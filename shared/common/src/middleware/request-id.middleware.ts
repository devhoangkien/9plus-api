import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { RequestContextService } from '../services/request-context.service';

/**
 * Factory function to create middleware with service name
 */
export function createRequestIdMiddleware(serviceName: string) {
  @Injectable()
  class DynamicRequestIdMiddleware implements NestMiddleware {
    constructor(public readonly contextService: RequestContextService) {}

    use(req: any, res: any, next: any) {
      // Get requestId from header (forwarded from Gateway or other services)
      // or generate new one if not present
      const requestId = 
        req.headers['x-request-id'] as string ||
        req.headers['x-correlation-id'] as string ||
        this.contextService.generateRequestId();

      // Set response header for tracking
      res.setHeader('X-Request-Id', requestId);

      // Extract userId from request (if available)
      const userId = (req as any).userId || (req as any).user?.id;

      // Run within context
      this.contextService.run(
        {
          requestId,
          timestamp: new Date(),
          path: req.path,
          method: req.method,
          userId,
          service: serviceName,
        },
        () => next(),
      );
    }
  }

  return DynamicRequestIdMiddleware;
}

/**
 * Generic RequestIdMiddleware (without specific service name)
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(private readonly contextService: RequestContextService) {}

  use(req: any, res: any, next: any) {
    const requestId = 
      req.headers['x-request-id'] as string ||
      req.headers['x-correlation-id'] as string ||
      this.contextService.generateRequestId();

    res.setHeader('X-Request-Id', requestId);

    const userId = (req as any).userId || (req as any).user?.id;

    this.contextService.run(
      {
        requestId,
        timestamp: new Date(),
        path: req.path,
        method: req.method,
        userId,
        service: 'unknown',
      },
      () => next(),
    );
  }
}
