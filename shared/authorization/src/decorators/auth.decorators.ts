import { SetMetadata } from '@nestjs/common';
import { AUTH_METADATA_KEYS, PermissionDefinition } from '../interfaces';

/**
 * Mark endpoint as public (skip authentication)
 * 
 * @example
 * ```typescript
 * @Query(() => [Anime])
 * @Public()
 * async listPublicAnime() {
 *   return this.animeService.findAll();
 * }
 * ```
 */
export const Public = () => SetMetadata(AUTH_METADATA_KEYS.IS_PUBLIC, true);

/**
 * Mark endpoint as requiring authentication
 * Use this when you have global auth guard but want to be explicit
 * 
 * @example
 * ```typescript
 * @Query(() => User)
 * @RequireAuth()
 * async getCurrentUser() {
 *   return this.userService.getCurrent();
 * }
 * ```
 */
export const RequireAuth = () => SetMetadata(AUTH_METADATA_KEYS.REQUIRE_AUTH, true);

/**
 * Define required permissions for an endpoint
 * 
 * @param permissions - Object mapping resources to required actions
 * 
 * @example
 * ```typescript
 * // Single resource
 * @RequirePermissions({ anime: ['create'] })
 * 
 * // Multiple actions
 * @RequirePermissions({ anime: ['create', 'update'] })
 * 
 * // Multiple resources
 * @RequirePermissions({
 *   anime: ['update'],
 *   episode: ['create']
 * })
 * ```
 */
export const RequirePermissions = (permissions: PermissionDefinition) =>
  SetMetadata(AUTH_METADATA_KEYS.PERMISSIONS, permissions);

/**
 * Specify parameter name for organization context
 * Default is 'organizationId'
 * 
 * @param paramName - Name of the parameter containing organization ID
 * 
 * @example
 * ```typescript
 * @Mutation(() => Anime)
 * @RequirePermissions({ anime: ['create'] })
 * @OrganizationContext('orgId')
 * async createAnime(@Args('orgId') orgId: string) {
 *   // ...
 * }
 * ```
 */
export const OrganizationContext = (paramName: string = 'organizationId') =>
  SetMetadata(AUTH_METADATA_KEYS.ORGANIZATION_ID, paramName);

/**
 * Combined decorator: Authentication + Permissions
 * Shorthand for @RequireAuth() + @RequirePermissions()
 * 
 * @param permissions - Required permissions
 * 
 * @example
 * ```typescript
 * @Mutation(() => Anime)
 * @Protected({ anime: ['create'] })
 * async createAnime() {
 *   // User must be authenticated AND have anime.create permission
 * }
 * ```
 */
export const Protected = (permissions: PermissionDefinition) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(AUTH_METADATA_KEYS.REQUIRE_AUTH, true)(target, propertyKey, descriptor);
    SetMetadata(AUTH_METADATA_KEYS.PERMISSIONS, permissions)(target, propertyKey, descriptor);
    return descriptor;
  };
};
