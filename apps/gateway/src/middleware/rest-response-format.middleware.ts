import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService } from '@anineplus/common';

/**
 * REST API Response Format Middleware
 * Wraps REST API responses in standard format
 */
@Injectable()
export class RestResponseFormatMiddleware implements NestMiddleware {
  constructor(private readonly contextService: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Only apply to REST API routes (not GraphQL)
    console.log('Request path:', req.path);
    if (!req.path.startsWith('/api') || req.path.includes('/graphql')) {
      return next();
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to format response
    res.json = function (data: any) {
      const requestId = this.contextService?.getRequestId() || 'unknown';
        console.log('Request ID:', requestId);
        console.log('data:', data);
      // If already formatted, return as-is
      if (data && typeof data === 'object' && 'success' in data) {
        return originalJson(data);
      } 

      // Check if it's a paginated response (has data and pagination)
      if (data && typeof data === 'object' && 'data' in data && 'pagination' in data) {
        return originalJson({
          success: true,
          ...data,
          timestamp: new Date().toISOString(),
          requestId,
        });
      }

      // Wrap in standard format
      return originalJson({
        success: true,
        data: data,
        timestamp: new Date().toISOString(),
        requestId,
      });
    }.bind({ contextService: this.contextService });

    next();
  }
}
