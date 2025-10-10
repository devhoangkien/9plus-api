import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { print } from 'graphql';
import fetch from 'node-fetch';
import { GatewayCacheService } from './gateway-cache.service';
import { GatewayUrlResolver } from '../resolvers/gateway-url-resolver';
import { RequestContextService } from '@anineplus/common';

@Injectable()
export class GraphQLExecutorService {
  private readonly logger = new Logger(GraphQLExecutorService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly urlResolver: GatewayUrlResolver,
    private readonly cacheService: GatewayCacheService,
    private readonly contextService: RequestContextService,
  ) {}

  /**
   * Create optimized executeWithFetch function with caching and dynamic URL
   */
  createExecuteFunction() {
    return async ({
      document,
      variableValues = {},
      contextValue,
      operationName,
    }: {
      document: any;
      variableValues?: any;
      contextValue?: any;
      operationName?: any;
    }) => {
      const query = print(document);
      
      // Check if operation should be cached
      const shouldCache = this.cacheService.shouldCache(query);
      const cacheKey = shouldCache 
        ? this.cacheService.generateCacheKey(query, variableValues, operationName)
        : null;

      // Check cache for queries only
      if (cacheKey && this.cacheService.has(cacheKey)) {
        this.logger.debug('📦 Serving cached GraphQL response...');
        return this.cacheService.get(cacheKey);
      }

      this.logger.debug('🔄 Delegating REST API request to GraphQL Gateway...');
      
      try {
        const response = await this.executeGraphQLRequest(query, variableValues, contextValue, operationName);
        
        // Cache successful query responses only
        if (cacheKey && !response.errors) {
          this.cacheService.set(cacheKey, response);
        }

        return response;
      } catch (error) {
        this.logger.error('❌ GraphQL delegation error:', error.message);
        throw error;
      }
    };
  }

  /**
   * Execute GraphQL request with proper error handling and timeout
   */
  private async executeGraphQLRequest(
    query: string, 
    variables: any, 
    contextValue: any, 
    operationName?: string
  ): Promise<any> {
    const timeout = parseInt(
      this.configService.get<string>('REQUEST_TIMEOUT_MS') || '30000', 
      10
    );

    // Get requestId from context for distributed tracing
    const requestId = this.contextService.getRequestId();

    const response = await fetch(this.urlResolver.getGraphQLUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': contextValue?.authorization ?? '',
        'user-agent': 'Gateway-REST-Proxy/1.0',
        'x-request-id': requestId,
        'x-correlation-id': requestId,
      },
      body: JSON.stringify({
        query,
        variables,
        operationName,
      }),
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Generate unique request ID for tracing
   * @deprecated Use RequestContextService.generateRequestId() instead
   */
  private generateRequestId(): string {
    return this.contextService.generateRequestId();
  }
}