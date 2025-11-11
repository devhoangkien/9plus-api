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
   * Create Sofa API instance with optimized configuration and response formatting
   */
  createSofaApi(schema: any) {
    const executeWithFetch = this.executorService.createExecuteFunction();

    const sofaHandler = useSofa({
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

    // Wrap Sofa handler to format responses
    return this.createResponseWrapper(sofaHandler);
  }

  /**
   * Wrap Sofa handler to format successful responses
   */
  private createResponseWrapper(sofaHandler: any) {
    return async (req: any, res: any, next: any) => {
      this.loggerService.log(`📥 REST API Request: ${req.method} ${req.url}`);

      // Store original methods
      const originalSend = res.send.bind(res);
      const originalJson = res.json.bind(res);
      const originalEnd = res.end.bind(res);
      const originalWrite = res.write.bind(res);

      let responseSent = false;
      let bufferedData: any[] = [];

      // Override write method to buffer data
      res.write = (chunk: any, encoding?: any, callback?: any) => {
        this.loggerService.log(`📝 res.write() called - buffering data`);
        bufferedData.push(chunk);
        if (callback) callback();
        return true;
      };

      // Override send method
      res.send = (body: any) => {
        if (responseSent) {
          this.loggerService.log('⚠️ Response already sent, ignoring res.send()');
          return res;
        }
        responseSent = true;
        this.loggerService.log(`🔵 res.send() called`);
        return this.formatAndSend(body, originalSend, req);
      };

      // Override json method
      res.json = (body: any) => {
        if (responseSent) {
          this.loggerService.log('⚠️ Response already sent, ignoring res.json()');
          return res;
        }
        responseSent = true;
        this.loggerService.log(`🟢 res.json() called`);
        return this.formatAndSend(body, originalJson, req);
      };

      // Override end method
      res.end = (chunk?: any, encoding?: any, callback?: any) => {
        if (responseSent) {
          this.loggerService.log('⚠️ Response already sent, ignoring res.end()');
          return res;
        }
        responseSent = true;
        this.loggerService.log(`🟡 res.end() called with chunk type: ${typeof chunk}`);
        
        // Combine buffered data with chunk
        let finalData = chunk;
        if (bufferedData.length > 0) {
          this.loggerService.log(`📦 Found ${bufferedData.length} buffered chunks, combining...`);
          const combined = Buffer.concat(
            bufferedData.map(d => typeof d === 'string' ? Buffer.from(d) : d)
          ).toString();
          
          if (chunk) {
            finalData = combined + (typeof chunk === 'string' ? chunk : JSON.stringify(chunk));
          } else {
            finalData = combined;
          }
          this.loggerService.log(`🔗 Combined data length: ${finalData.length}`);
        }
        
        // Handle both string and object chunks
        if (finalData !== undefined && finalData !== null) {
          let data = finalData;
          
          // If finalData is a string, try to parse it
          if (typeof finalData === 'string') {
            try {
              data = JSON.parse(finalData);
              this.loggerService.log('📋 Parsed JSON string in res.end()');
            } catch (e) {
              this.loggerService.log(`⚠️ Could not parse string chunk in res.end(): ${e.message}`);
              return originalEnd.call(res, finalData, encoding, callback);
            }
          } else if (typeof finalData === 'object') {
            this.loggerService.log('📦 Object chunk detected in res.end()');
          }
          
          // Format the data
          const formatted = this.formatData(data, req);
          this.loggerService.log(`✨ Formatted response`);
          
          // Return formatted response as string
          return originalEnd.call(res, JSON.stringify(formatted), encoding, callback);
        } else {
          // Chunk is null/undefined - return formatted empty response
          this.loggerService.log('⚠️ Chunk is null/undefined - formatting empty response');
          const requestId = this.contextService.getRequestId() || 'unknown';
          const formatted = {
            success: true,
            data: null,
            timestamp: new Date().toISOString(),
            requestId,
          };
          return originalEnd.call(res, JSON.stringify(formatted), encoding, callback);
        }
      };

      // Call Sofa handler
      return sofaHandler(req, res, next);
    };
  }

  /**
   * Format and send response
   */
  private formatAndSend(body: any, originalMethod: any, req: any) {
    const requestId = this.contextService.getRequestId() || 'unknown';
    
    this.loggerService.log(`📤 REST API Response formatting for: ${req.url}`);
    
    // If body is a string, try to parse it
    let data = body;
    if (typeof body === 'string') {
      try {
        data = JSON.parse(body);
        this.loggerService.log('📋 Parsed JSON body');
      } catch (e) {
        // Not JSON, return as-is
        this.loggerService.log('⚠️ Body is not JSON, returning as-is');
        return originalMethod(body);
      }
    }

    const formatted = this.formatData(data, req);
    return originalMethod(typeof body === 'string' ? JSON.stringify(formatted) : formatted);
  }

  /**
   * Format data with standard response structure
   */
  private formatData(data: any, req: any): any {
    const requestId = this.contextService.getRequestId() || 'unknown';

    // If already formatted, return as-is
    if (data && typeof data === 'object' && 'success' in data) {
      this.loggerService.log('✅ Response already formatted');
      return data;
    }

    // Check if it's a paginated response
    if (data && typeof data === 'object' && 'data' in data && 'pagination' in data) {
      this.loggerService.log('📊 Formatting paginated response');
      return {
        success: true,
        ...data,
        timestamp: new Date().toISOString(),
        requestId,
      };
    }

    // Wrap in standard format
    this.loggerService.log('📦 Wrapping response in standard format');
    return {
      success: true,
      data: data,
      timestamp: new Date().toISOString(),
      requestId,
    };
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
      
      // Standard error format
      const errorResponse = {
        success: false,
        message: actualMessage,
        errors: errors.map(err => ({
          message: err.message,
          path: err.path,
          extensions: err.extensions,
        })),
        messageCode: messageCode,
        code: statusCode,
        timestamp: new Date().toISOString(),
        requestId: requestId,
      };
      
      return new FetsResponse(
        JSON.stringify(errorResponse),
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