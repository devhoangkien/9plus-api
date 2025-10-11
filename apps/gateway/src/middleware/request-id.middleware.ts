import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService } from '../services/request-context.service';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(private readonly contextService: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Get requestId from header or generate new one
    const requestId = 
      req.headers['x-request-id'] as string ||
      req.headers['x-correlation-id'] as string ||
      this.contextService.generateRequestId();

    // Set response header for tracking
    res.setHeader('X-Request-Id', requestId);
    console.log('Assigned Request ID:', requestId);
    // Run within context
    this.contextService.run(
      {
        requestId,
        timestamp: new Date(),
        path: req.path,
        method: req.method,
        userId: (req as any).user?.id,
      },
      () => next(),
    );
  }
}
