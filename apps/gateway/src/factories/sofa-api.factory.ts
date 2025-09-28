import { Injectable, Logger } from '@nestjs/common';
import { LoggerService } from '@bune/common';
import { useSofa } from 'sofa-api';
import { Response as FetsResponse } from 'fets';
import { GatewayUrlResolver } from '../resolvers/gateway-url-resolver';
import { GraphQLExecutorService } from '../services/graphql-executor.service';

@Injectable()
export class SofaApiFactory {
  private readonly logger = new Logger(SofaApiFactory.name);

  constructor(
    private readonly urlResolver: GatewayUrlResolver,
    private readonly executorService: GraphQLExecutorService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * Create Sofa API instance with optimized configuration
   */
  createSofaApi(schema: any) {
    const executeWithFetch = this.executorService.createExecuteFunction();

    return useSofa({
      schema: schema,
      basePath: '/api',
      swaggerUI: {
        endpoint: '/swagger',
      },
      openAPI: {
        info: {
          title: 'NinePlus CMS REST API',
          version: '1.0.0',
          description: 'API documentation for NinePlus CMS - Generated from GraphQL Federation Schema',
        },
        servers: [
          {
            url: this.urlResolver.getBaseUrl(),
          },
        ],
      },
      execute: executeWithFetch,
      errorHandler: this.createErrorHandler(),
    });
  }

  /**
   * Enhanced error handler with better logging
   */
  private createErrorHandler() {
    return (errors: any[]) => {
      const errorMessage = errors[0]?.message ?? 'Unknown GraphQL error';
      this.loggerService.error(`❌ GraphQL Error: ${errorMessage}`, JSON.stringify(errors));
      
      return new FetsResponse(
        JSON.stringify({ 
          error: errorMessage,
          code: 'GRAPHQL_ERROR',
          timestamp: new Date().toISOString(),
          requestId: this.generateErrorId(),
        }),
        {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'X-Error-Source': 'GraphQL-Gateway'
          },
        },
      );
    };
  }

  /**
   * Generate unique error ID for tracking
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}