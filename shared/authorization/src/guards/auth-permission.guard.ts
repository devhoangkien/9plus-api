import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import {
  IAuthService,
  IPermissionService,
  AUTH_METADATA_KEYS,
  PermissionDefinition,
} from '../interfaces/auth.interface';

/**
 * Combined Authentication + Permission Guard
 * Performs both auth and permission checks in a single guard
 * 
 * Usage:
 * 1. Provide both AUTH_SERVICE and PERMISSION_SERVICE in your module
 * 2. Use @UseGuards(AuthPermissionGuard) + @RequirePermissions()
 * 
 * @example
 * ```typescript
 * // In your module
 * providers: [
 *   {
 *     provide: 'AUTH_SERVICE',
 *     useClass: BetterAuthService,
 *   },
 *   {
 *     provide: 'PERMISSION_SERVICE',
 *     useClass: OrganizationService,
 *   },
 *   AuthPermissionGuard,
 * ]
 * 
 * // In resolver
 * @Mutation(() => Anime)
 * @UseGuards(AuthPermissionGuard)
 * @RequirePermissions({ anime: ['create'] })
 * async createAnime() { }
 * ```
 */
@Injectable()
export class AuthPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject('AUTH_SERVICE')
    private readonly authService: IAuthService,
    @Inject('PERMISSION_SERVICE')
    private readonly permissionService: IPermissionService,
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
    const args = gqlContext.getArgs();

    // Extract and validate session token
    const authHeader = ctx.req?.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No authorization token provided');
    }

    const sessionToken = authHeader.substring(7);

    // Verify session is valid
    try {
      const session = await this.authService.getSession(sessionToken);
      if (!session) {
        throw new UnauthorizedException('Invalid or expired session');
      }

      // Store session in context for later use
      ctx.session = session.session;
      ctx.user = session.user;
      ctx.sessionToken = sessionToken;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new UnauthorizedException('Authentication failed: ' + message);
    }

    // Check permissions if required
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionDefinition
    >(AUTH_METADATA_KEYS.PERMISSIONS, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no permissions required, just authentication is enough
    if (!requiredPermissions) {
      return true;
    }

    // Get organization ID from args
    const orgIdParamName =
      this.reflector.get<string>(
        AUTH_METADATA_KEYS.ORGANIZATION_ID,
        context.getHandler(),
      ) || 'organizationId';

    let organizationId: string | undefined;

    // Try different sources for organizationId
    if (args[orgIdParamName]) {
      organizationId = args[orgIdParamName];
    } else if (args.input && args.input[orgIdParamName]) {
      organizationId = args.input[orgIdParamName];
    } else if (ctx.organizationId) {
      organizationId = ctx.organizationId;
    }

    // Check permissions
    try {
      const result = await this.permissionService.hasPermission(
        sessionToken,
        requiredPermissions,
        organizationId,
      );

      if (!result || !result.success) {
        throw new ForbiddenException(
          result?.error || 'Insufficient permissions',
        );
      }

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new ForbiddenException(`Permission check failed: ${message}`);
    }
  }
}
