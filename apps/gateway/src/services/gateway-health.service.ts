import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GatewayUrlResolver } from '../resolvers/gateway-url-resolver';

@Injectable()
export class GatewayHealthService {
  private readonly logger = new Logger(GatewayHealthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly urlResolver: GatewayUrlResolver,
  ) {}

  /**
   * Check if the gateway is healthy by testing GraphQL endpoint
   */
  async checkHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    services: {
      gateway: boolean;
      cache: boolean;
    };
  }> {
    const timestamp = new Date().toISOString();
    
    try {
      // Check gateway GraphQL endpoint using URL resolver
      const gatewayUrl = this.urlResolver.getGraphQLUrl();
      
      // Simple introspection query to test GraphQL endpoint
      const response = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'query { __schema { queryType { name } } }',
        }),
        signal: AbortSignal.timeout(5000), // 5 second timeout for health checks
      });

      const gatewayHealthy = response.ok;
      const cacheHealthy = true; // LRU cache is always available

      return {
        status: gatewayHealthy && cacheHealthy ? 'healthy' : 'unhealthy',
        timestamp,
        services: {
          gateway: gatewayHealthy,
          cache: cacheHealthy,
        },
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp,
        services: {
          gateway: false,
          cache: true,
        },
      };
    }
  }

  /**
   * Get cache statistics (Cache is disabled)
   */
  getCacheStats() {
    return {
      enabled: false,
      size: 'N/A - Cache disabled',
      maxSize: 0,
      ttl: 0,
    };
  }

  /**
   * Log startup information
   */
  logStartupInfo(port: number, protocol: string, host: string) {
    this.logger.log('🚀 Gateway Configuration:');
    this.logger.log(`   Host: ${host}`);
    this.logger.log(`   Port: ${port}`);
    this.logger.log(`   Protocol: ${protocol}`);
    this.logger.log(`   Cache: DISABLED`);
    this.logger.log(`   Request Timeout: ${this.configService.get('REQUEST_TIMEOUT_MS', 30000)}ms`);
  }
}