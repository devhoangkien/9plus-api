import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { GraphQLClient } from 'graphql-request';
import { WebhookService } from './webhook.service';

interface PluginCreateData {
  name: string;
  displayName?: string;
  description?: string;
  url: string;
  version?: string;
  status?: string;
  healthCheck?: string;
  metadata?: any;
  dependencies?: string[];
  tags?: string[];
  isRequired?: boolean;
  createdBy?: string;
}

interface PluginUpdateData {
  displayName?: string;
  description?: string;
  url?: string;
  version?: string;
  status?: string;
  healthCheck?: string;
  metadata?: any;
  dependencies?: string[];
  tags?: string[];
  isRequired?: boolean;
  updatedBy?: string;
}

@Injectable()
export class PluginsManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookService: WebhookService,
  ) {}

  async register(data: PluginCreateData) {
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

    const service = await (this.prisma as any).pluginRegistry.create({
      data,
    });

    // Notify gateway about the new service
    await this.webhookService.notifyServiceRegistered(service);

    return service;
  }

  async unregister(where: { id?: string; name?: string }) {
    const service = await (this.prisma as any).pluginRegistry.findUnique({ where });
    if (!service) {
      throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
    }

    const deletedService = await (this.prisma as any).pluginRegistry.delete({ where });

    // Notify gateway about the removed service
    await this.webhookService.notifyServiceUnregistered(deletedService);

    return deletedService;
  }

  async update(
    where: { id?: string; name?: string },
    data: PluginUpdateData,
  ) {
    const service = await (this.prisma as any).pluginRegistry.findUnique({ where });
    if (!service) {
      throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
    }

    // Validate service URL if it's being updated
    if (data.url) {
      const isValid = await this.validateServiceEndpoint(data.url);
      if (!isValid) {
        throw new HttpException(
          'Service URL is not a valid GraphQL endpoint',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const updatedService = await (this.prisma as any).pluginRegistry.update({
      where,
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
    return (this.prisma as any).pluginRegistry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActiveServices() {
    return (this.prisma as any).pluginRegistry.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(where: { id?: string; name?: string }) {
    const service = await (this.prisma as any).pluginRegistry.findUnique({ where });
    if (!service) {
      throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
    }
    return service;
  }

  async updateStatus(
    where: { id?: string; name?: string },
    status: string,
  ) {
    return (this.prisma as any).pluginRegistry.update({
      where,
      data: {
        status,
        lastHealthCheck: new Date(),
      },
    });
  }

  async healthCheck(where: { id?: string; name?: string }): Promise<boolean> {
    const service = await this.findOne(where);
    
    try {
      const isHealthy = await this.validateServiceEndpoint(service.url);
      
      // Update health check timestamp and status
      await (this.prisma as any).pluginRegistry.update({
        where,
        data: {
          lastHealthCheck: new Date(),
          status: isHealthy ? 'ACTIVE' : 'ERROR',
        },
      });

      return isHealthy;
    } catch (error) {
      await (this.prisma as any).pluginRegistry.update({
        where,
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
