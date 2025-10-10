/**
 * Metadata keys for decorators
 */
export const AUTH_METADATA_KEYS = {
  PERMISSIONS: 'permissions',
  ORGANIZATION_ID: 'organizationId',
  IS_PUBLIC: 'isPublic',
  REQUIRE_AUTH: 'requireAuth',
} as const;

/**
 * Permission definition type
 */
export type PermissionDefinition = Record<string, string[]>;
