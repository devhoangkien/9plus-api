import { Injectable, Logger } from '@nestjs/common';
import { LoggerService, RequestContextService } from '@anineplus/common';
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
    private readonly contextService: RequestContextService,
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
      const firstError = errors[0];
      const errorMessage = firstError?.message ?? 'Unknown GraphQL error';
      
      // Extract nested error from response body if exists
      const nestedError = firstError?.extensions?.response?.body?.errors?.[0];
      const actualMessage = nestedError?.message || errorMessage;
      const messageCode = nestedError?.extensions?.messageCode ?? null;
      const statusCode = firstError?.extensions?.response?.status || 500;
      
      // Get requestId from context for distributed tracing
      const requestId = this.contextService.getRequestId();
      
      this.loggerService.error(
        `❌ GraphQL Error [${requestId}]: ${actualMessage}`, 
        JSON.stringify({ 
          ...errors, 
          requestId,
        })
      );
      
      return new FetsResponse(
        JSON.stringify({ 
          message: actualMessage,
          messageCode: messageCode,
          code: statusCode,
          timestamp: new Date().toISOString(),
          requestId: requestId,
        }),
        {
          status: statusCode,
          headers: { 
            'Content-Type': 'application/json',
            'X-Error-Source': 'GraphQL-Gateway',
            'X-Request-Id': requestId,
          },
        },
      );
    };
  }
}