import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { GraphQLClient } from 'graphql-request';

export interface SubgraphConfig {
  name: string;
  url: string;
}

@Injectable()
export class DynamicGatewayService implements OnModuleInit {
  private readonly logger = new Logger(DynamicGatewayService.name);
  private client: GraphQLClient;
  private subgraphs: SubgraphConfig[] = [];

  constructor() {
    const coreServiceUrl = process.env.CORE_SERVICE_URL;
    if (!coreServiceUrl) {
      throw new Error('CORE_SERVICE_URL environment variable is required');
    }
    this.client = new GraphQLClient(coreServiceUrl);
  }

  async onModuleInit() {
    await this.loadSubgraphs();
  }

  async loadSubgraphs(): Promise<SubgraphConfig[]> {
    try {
      const query = `
        query GetGatewaySubgraphs {
          getGatewaySubgraphs {
            name
            url
          }
        }
      `;

      const response = await this.client.request<{
        getGatewaySubgraphs: SubgraphConfig[];
      }>(query);

      // Always include core as the primary service
      const coreService: SubgraphConfig = {
        name: 'core',
        url: process.env.CORE_SERVICE_URL!,
      };

      // Combine core service with registered services
      const allSubgraphs = [coreService];
      
      // Add other services, excluding duplicates
      for (const subgraph of response.getGatewaySubgraphs) {
        if (subgraph.name !== 'core') {
          allSubgraphs.push(subgraph);
        }
      }

      this.subgraphs = allSubgraphs;
      this.logger.log(`Loaded ${this.subgraphs.length} subgraphs:`, 
        this.subgraphs.map(s => s.name).join(', ')
      );

      return this.subgraphs;
    } catch (error) {
      this.logger.error('Failed to load subgraphs from core service:', error.message);
      
      // Fallback to core service only
      const fallbackSubgraphs: SubgraphConfig[] = [
        {
          name: 'core',
          url: process.env.CORE_SERVICE_URL!,
        },
      ];
      
      this.subgraphs = fallbackSubgraphs;
      return fallbackSubgraphs;
    }
  }

  getSubgraphs(): SubgraphConfig[] {
    return this.subgraphs;
  }

  async reloadSubgraphs(): Promise<SubgraphConfig[]> {
    this.logger.log('Reloading subgraphs...');
    return this.loadSubgraphs();
  }

  async healthCheckSubgraphs(): Promise<{ name: string; healthy: boolean }[]> {
    const results: { name: string; healthy: boolean }[] = [];
    
    for (const subgraph of this.subgraphs) {
      try {
        const client = new GraphQLClient(subgraph.url);
        
        // Simple introspection query to check if service is healthy
        const introspectionQuery = `
          query {
            __schema {
              queryType {
                name
              }
            }
          }
        `;
        
        await client.request(introspectionQuery);
        results.push({ name: subgraph.name, healthy: true });
      } catch (error) {
        this.logger.warn(`Health check failed for ${subgraph.name}:`, error.message);
        results.push({ name: subgraph.name, healthy: false });
      }
    }
    
    return results;
  }
}