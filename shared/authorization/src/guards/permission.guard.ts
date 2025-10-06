import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import {
  IPermissionService,
  AUTH_METADATA_KEYS,
  PermissionDefinition,
} from '../interfaces/auth.interface';

/**
 * Generic Permission Guard
 * Works with any service implementing IPermissionService
 * 
 * Note: This guard requires authentication context (sessionToken)
 * Use with AuthGuard or ensure context has sessionToken
 * 
 * Usage:
 * 1. Implement IPermissionService in your permission service
 * 2. Provide PERMISSION_SERVICE token in your module
 * 3. Use @UseGuards(AuthGuard, PermissionGuard) + @RequirePermissions()
 * 
 * @example
 * ```typescript
 * // In your module
 * providers: [
 *   {
 *     provide: 'PERMISSION_SERVICE',
 *     useClass: OrganizationService,
 *   },
 *   PermissionGuard,
 * ]
 * 
 * // In resolver
 * @Mutation(() => Anime)
 * @UseGuards(AuthGuard, PermissionGuard)
 * @RequirePermissions({ anime: ['create'] })
 * async createAnime() { }
 * ```
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject('PERMISSION_SERVICE')
    private readonly permissionService: IPermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permissions from decorator
    const requiredPermissions = this.reflector.getAllAndOverride<
      PermissionDefinition
    >(AUTH_METADATA_KEYS.PERMISSIONS, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no permissions required, allow access
    if (!requiredPermissions) {
      return true;
    }

    // Get GraphQL context
    const gqlContext = GqlExecutionContext.create(context);
    const ctx = gqlContext.getContext();
    const args = gqlContext.getArgs();

    // Get session token from context (set by AuthGuard)
    let sessionToken = ctx.sessionToken;

    // Fallback: extract from header if not in context
    if (!sessionToken) {
      const authHeader = ctx.req?.headers?.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ForbiddenException('No authorization token for permission check');
      }
      sessionToken = authHeader.substring(7);
    }

    // Get organization ID from args (configurable via decorator)
    const orgIdParamName =
      this.reflector.get<string>(
        AUTH_METADATA_KEYS.ORGANIZATION_ID,
        context.getHandler(),
      ) || 'organizationId';

    // Try to get organizationId from different sources
    let organizationId: string | undefined;

    // 1. From direct args
    if (args[orgIdParamName]) {
      organizationId = args[orgIdParamName];
    }
    // 2. From input object
    else if (args.input && args.input[orgIdParamName]) {
      organizationId = args.input[orgIdParamName];
    }
    // 3. From context (if set by previous middleware)
    else if (ctx.organizationId) {
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
