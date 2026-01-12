import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AUTH_METADATA_KEYS } from '../interfaces';

/**
 * Generic Authentication Guard
 * Works with any auth service injected via 'AUTH_SERVICE' token
 * 
 * Usage:
 * 1. Provide your auth service with 'AUTH_SERVICE' token
 * 2. Use @UseGuards(AuthGuard) or apply globally
 * 3. Service must have getSession(token) method
 * 
 * @example
 * ```typescript
 * // In your module
 * providers: [
 *   {
 *     provide: 'AUTH_SERVICE',
 *     useClass: BetterAuthService,
 *   },
 *   AuthGuard,
 * ]
 * 
 * // In resolver
 * @Query(() => User)
 * @UseGuards(AuthGuard)
 * async getCurrentUser() { }
 * ```
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    @Inject('AUTH_SERVICE') private readonly authService: any,
  ) { }

  private get reflector(): Reflector {
    // Lazy load Reflector to avoid circular dependency issues
    return new Reflector();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if endpoint is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      AUTH_METADATA_KEYS.IS_PUBLIC,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    // Get GraphQL context
    const gqlContext = GqlExecutionContext.create(context);
    const ctx = gqlContext.getContext();

    // Extract token from authorization header
    const authHeader = ctx.req?.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn('No authorization token provided');
      throw new UnauthorizedException('No authorization token provided');
    }

    const sessionToken = authHeader.substring(7);

    // Validate session
    try {
      const session = await this.authService.getSession(sessionToken);

      if (!session) {
        this.logger.warn('Invalid or expired session');
        throw new UnauthorizedException('Invalid or expired session');
      }

      // Store session and user in context for downstream use
      ctx.session = session.session;
      ctx.user = session.user;
      ctx.sessionToken = sessionToken;

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Authentication failed: ${message}`);
      throw new UnauthorizedException('Authentication failed: ' + message);
    }
  }
}

