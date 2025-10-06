/**
 * Interface for authentication service
 * Any service can implement this to work with auth guards
 */
export interface IAuthService {
  /**
   * Validate session token and return user session
   */
  getSession(sessionToken: string): Promise<{
    session: {
      id: string;
      userId: string;
      expiresAt: Date;
    };
    user: {
      id: string;
      email: string;
      name: string;
    };
  } | null>;
}

/**
 * Interface for organization/permission service
 * Any service can implement this to work with permission guards
 */
export interface IPermissionService {
  /**
   * Check if user has required permissions in an organization
   */
  hasPermission(
    sessionToken: string,
    permissions: Record<string, string[]>,
    organizationId?: string,
  ): Promise<{
    success: boolean;
    error?: string | null;
  }>;
}

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
