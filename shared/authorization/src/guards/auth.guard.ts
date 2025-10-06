import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { IAuthService, AUTH_METADATA_KEYS } from '../interfaces';

/**
 * Generic Authentication Guard
 * Works with any service implementing IAuthService
 * 
 * Usage:
 * 1. Implement IAuthService in your auth service
 * 2. Provide AUTH_SERVICE token in your module
 * 3. Use @UseGuards(AuthGuard) or apply globally
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
  constructor(
    private reflector: Reflector,
    @Inject('AUTH_SERVICE') private readonly authService: IAuthService,
  ) {}

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
      throw new UnauthorizedException('No authorization token provided');
    }

    const sessionToken = authHeader.substring(7);

    // Validate session
    try {
      const session = await this.authService.getSession(sessionToken);

      if (!session) {
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
      throw new UnauthorizedException('Authentication failed: ' + message);
    }
  }
}
