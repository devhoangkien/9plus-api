export interface IAuthService {
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

export interface IPermissionService {
  hasPermission(
    sessionToken: string,
    permissions: Record<string, string[]>,
    organizationId?: string,
  ): Promise<{
    success: boolean;
    error?: string | null;
  }>;
}

export const AUTH_METADATA_KEYS = {
  PERMISSIONS: 'permissions',
  ORGANIZATION_ID: 'organizationId',
  IS_PUBLIC: 'isPublic',
  REQUIRE_AUTH: 'requireAuth',
} as const;

export type PermissionDefinition = Record<string, string[]>;
