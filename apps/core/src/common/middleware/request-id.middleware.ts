import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService } from '../services/request-context.service';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(private readonly contextService: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Get requestId from header (forwarded from Gateway)
    // or generate new one if not present
    const requestId = 
      req.headers['x-request-id'] as string ||
      req.headers['x-correlation-id'] as string ||
      this.contextService.generateRequestId();

    // Set response header
    res.setHeader('X-Request-Id', requestId);

    // Run within context
    this.contextService.run(
      {
        requestId,
        timestamp: new Date(),
        path: req.path,
        method: req.method,
        userId: (req as any).userId, // From JWT middleware
      },
      () => next(),
    );
  }
}
