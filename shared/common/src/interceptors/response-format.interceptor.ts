import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * Response format interceptor
 * Automatically wraps responses in standard format for REST API
 */
@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType = context.getType<'http' | 'graphql'>();

    // Only apply to HTTP context (REST API), not GraphQL
    if (contextType === 'http') {
      return next.handle().pipe(
        map((data) => {
          // If already formatted, return as-is
          if (data && typeof data === 'object' && 'success' in data) {
            return data;
          }

          // Auto-format response
          return {
            success: true,
            data,
            timestamp: new Date().toISOString(),
          };
        }),
      );
    }

    // For GraphQL, pass through without modification
    return next.handle();
  }
}
