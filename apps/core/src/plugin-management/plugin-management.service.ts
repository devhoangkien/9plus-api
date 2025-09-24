import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GraphQLClient } from 'graphql-request';
import { WebhookService } from './webhook.service';
import { PluginRegistryCreateInput, PluginRegistryUpdateInput } from 'prisma/@generated';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class PluginManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookService: WebhookService,
  ) {}

  async register(data: PluginRegistryCreateInput) {
    // Validate service URL by checking GraphQL endpoint
    if (data.url) {
      const isValid = await this.validateServiceEndpoint(data.url);
      if (!isValid) {
        throw new HttpException(
          'Service URL is not a valid GraphQL endpoint',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const service = await this.prisma.pluginRegistry.create({
      data,
    });

    // Notify gateway about the new service
    await this.webhookService.notifyServiceRegistered(service);

    return service;
  }

  async unregister(where: { id?: string; name?: string }) {
    if (!where.id && !where.name) {
      throw new HttpException('Either id or name must be provided', HttpStatus.BAD_REQUEST);
    }
    
    // Use either id or name as unique identifier
    const uniqueWhere = where.id ? { id: where.id } : { name: where.name! };
    const service = await this.prisma.pluginRegistry.findUnique({ where: uniqueWhere });
    if (!service) {
      throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
    }

    const deletedService = await this.prisma.pluginRegistry.delete({ where: uniqueWhere });

    // Notify gateway about the removed service
    await this.webhookService.notifyServiceUnregistered(deletedService);

    return deletedService;
  }

  async update(
    where: { id?: string; name?: string },
    data: PluginRegistryUpdateInput,
  ) {
    if (!where.id && !where.name) {
      throw new HttpException('Either id or name must be provided', HttpStatus.BAD_REQUEST);
    }
    
    // Use either id or name as unique identifier
    const uniqueWhere = where.id ? { id: where.id } : { name: where.name! };
    const service = await this.prisma.pluginRegistry.findUnique({ where: uniqueWhere });
    if (!service) {
      throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
    }

    // Validate service URL if it's being updated
    if (data.url && typeof data.url === 'string') {
      const isValid = await this.validateServiceEndpoint(data.url);
      if (!isValid) {
        throw new HttpException(
          'Service URL is not a valid GraphQL endpoint',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const updatedService = await this.prisma.pluginRegistry.update({
      where: uniqueWhere,
      data: {
        ...data,
        lastHealthCheck: new Date(),
      },
    });

    // Notify gateway about the updated service
    await this.webhookService.notifyServiceUpdated(updatedService);

    return updatedService;
  }

  async findAll(where?: any) {
    return this.prisma.pluginRegistry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveServices() {
    return this.prisma.pluginRegistry.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(where: { id?: string; name?: string }) {
    if (!where.id && !where.name) {
      throw new HttpException('Either id or name must be provided', HttpStatus.BAD_REQUEST);
    }
    
    // Use either id or name as unique identifier
    const uniqueWhere = where.id ? { id: where.id } : { name: where.name! };
    const service = await this.prisma.pluginRegistry.findUnique({ where: uniqueWhere });
    if (!service) {
      throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
    }
    return service;
  }

  async updateStatus(
    where: { id?: string; name?: string },
    status: string,
  ) {
    if (!where.id && !where.name) {
      throw new HttpException('Either id or name must be provided', HttpStatus.BAD_REQUEST);
    }
    
    // Use either id or name as unique identifier
    const uniqueWhere = where.id ? { id: where.id } : { name: where.name! };
    return this.prisma.pluginRegistry.update({
      where: uniqueWhere,
      data: {
        status: status as any, // Cast to handle the enum type
        lastHealthCheck: new Date(),
      },
    });
  }

  async healthCheck(where: { id?: string; name?: string }): Promise<boolean> {
    const service = await this.findOne(where);
    
    if (!where.id && !where.name) {
      throw new HttpException('Either id or name must be provided', HttpStatus.BAD_REQUEST);
    }
    
    // Use either id or name as unique identifier
    const uniqueWhere = where.id ? { id: where.id } : { name: where.name! };
    
    try {
      const isHealthy = await this.validateServiceEndpoint(service.url);
      
      // Update health check timestamp and status
      await this.prisma.pluginRegistry.update({
        where: uniqueWhere,
        data: {
          lastHealthCheck: new Date(),
          status: isHealthy ? 'ACTIVE' : 'ERROR',
        },
      });

      return isHealthy;
    } catch (error) {
      await this.prisma.pluginRegistry.update({
        where: uniqueWhere,
        data: {
          lastHealthCheck: new Date(),
          status: 'ERROR',
        },
      });
      return false;
    }
  }

  async healthCheckAll(): Promise<{ service: string; healthy: boolean }[]> {
    const services = await this.findAll();
    const results: { service: string; healthy: boolean }[] = [];

    for (const service of services) {
      const isHealthy = await this.healthCheck({ id: service.id });
      results.push({
        service: service.name,
        healthy: isHealthy,
      });
    }

    return results;
  }

  private async validateServiceEndpoint(url: string): Promise<boolean> {
    try {
      const client = new GraphQLClient(url);
      
      // Try to introspect the GraphQL schema
      const introspectionQuery = `
        query IntrospectionQuery {
          __schema {
            queryType {
              name
            }
          }
        }
      `;
      
      await client.request(introspectionQuery);
      return true;
    } catch (error) {
      console.warn(`Service validation failed for ${url}:`, error.message);
      return false;
    }
  }

  // Get services formatted for Apollo Gateway
  async getGatewaySubgraphs(): Promise<{ name: string; url: string }[]> {
    const activeServices = await this.findActiveServices();
    
    return activeServices.map((service: any) => ({
      name: service.name,
      url: service.url,
    }));
  }
}
