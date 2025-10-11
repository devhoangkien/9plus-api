import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GqlExecutionContext } from '@nestjs/graphql';
import { RequestContextService } from '@anineplus/common';

/**
 * GraphQL Response Interceptor
 * Adds metadata to GraphQL responses (requestId, timestamp)
 * Does NOT wrap the data - maintains GraphQL schema compatibility
 */
@Injectable()
export class GraphQLResponseInterceptor implements NestInterceptor {
  constructor(private readonly contextService: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const gqlContext = GqlExecutionContext.create(context);
    const ctx = gqlContext.getContext();

    // Get requestId
    const requestId = this.contextService.getRequestId();

    return next.handle().pipe(
      map((data) => {
        // For GraphQL, we don't wrap the data
        // Instead, we add metadata to the context that can be included in extensions
        if (ctx && ctx.res) {
          ctx.res.setHeader('X-Request-Id', requestId);
          ctx.res.setHeader('X-Response-Time', new Date().toISOString());
        }

        // Return data as-is to maintain GraphQL schema
        return data;
      }),
    );
  }
}
