import { Injectable } from '@nestjs/common';
import { auth } from '../auth/auth.config';

/**
 * PermissionService
 * 
 * Handles permission checking and role-based access control (RBAC)
 * using Better Auth's organization plugin
 * 
 * This service is injected as 'PERMISSION_SERVICE' token for guards
 */
@Injectable()
export class PermissionsService {
  /**
   * Check if user has required permissions in organization
   * 
   * @param sessionToken - User's session token
   * @param permissions - Required permissions { [key: string]: string[] }
   * @param organizationId - Optional organization ID
   * @returns Promise with success status
   */
  async hasPermission(
    sessionToken: string,
    permissions: Record<string, string[]>,
    organizationId?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await auth.api.hasPermission({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
        query: {
          organizationId,
        },
        body: {
          permission: permissions,
        },
      });

      return {
        success: result.success,
        error: result.error ?? undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Permission check failed',
      };
    }
  }

  /**
   * List all roles in an organization
   */
  async listRoles(sessionToken: string, organizationId?: string) {
    return auth.api.listOrgRoles({
      headers: {
        authorization: `Bearer ${sessionToken}`,
      },
      query: {
        organizationId,
      },
    });
  }

  /**
   * Create a new role with permissions
   */
  async createRole(
    sessionToken: string,
    role: string,
    permission: Record<string, string[]>,
    organizationId?: string,
  ) {
    return auth.api.createOrgRole({
      headers: {
        authorization: `Bearer ${sessionToken}`,
      },
      query: {
        organizationId,
      },
      body: {
        role,
        permission,
      },
    });
  }

  /**
   * Update an existing role
   */
  async updateRole(
    sessionToken: string,
    roleId: string,
    data: {
      permission?: Record<string, string[]>;
      roleName?: string;
    },
    organizationId?: string,
  ) {
    return auth.api.updateOrgRole({
      headers: {
        authorization: `Bearer ${sessionToken}`,
      },
      query: {
        organizationId,
      },
      body: {
        roleId,
        data,
      },
    });
  }

  /**
   * Delete a role
   */
  async deleteRole(
    sessionToken: string,
    roleId: string,
    organizationId?: string,
  ) {
    return auth.api.deleteOrgRole({
      headers: {
        authorization: `Bearer ${sessionToken}`,
      },
      query: {
        organizationId,
      },
      body: {
        roleId,
      },
    });
  }
}
