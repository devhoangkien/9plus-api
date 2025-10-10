/**
 * Dynamic permissions helper for better-auth
 * This file provides utilities to work with database-stored permissions
 * instead of static permissions.ts file
 */

import { PrismaClient } from 'prisma/@generated/client';
import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements } from 'better-auth/plugins/organization/access';

const prisma = new PrismaClient();

/**
 * Define custom statements for access control
 * This merges with better-auth default statements
 */
export const statement = {
  ...defaultStatements,
  // Custom resources for anime platform
  anime: ['create', 'read', 'update', 'delete', 'publish'],
  episode: ['create', 'read', 'update', 'delete', 'upload'],
  comment: ['create', 'read', 'update', 'delete', 'moderate'],
  user: ['read', 'update', 'ban', 'unban'],
  subscription: ['create', 'read', 'update', 'cancel'],
  analytics: ['read', 'export'],
  settings: ['read', 'update'],
} as const;

/**
 * Create access control instance
 * This is required by better-auth organization plugin
 */
export const ac = createAccessControl(statement);

/**
 * Load role permissions from database for a specific organization
 * This is used by better-auth to check permissions dynamically
 */
export async function loadOrganizationRolePermissions(
  organizationId: string,
  role: string,
) {
  const permissions = await prisma.organizationRolePermission.findMany({
    where: {
      organizationId,
      role,
    },
    select: {
      resource: true,
      action: true,
    },
  });

  // Group by resource
  const grouped: Record<string, string[]> = {};
  for (const perm of permissions) {
    if (!grouped[perm.resource]) {
      grouped[perm.resource] = [];
    }
    if (!grouped[perm.resource].includes(perm.action)) {
      grouped[perm.resource].push(perm.action);
    }
  }

  return grouped;
}

/**
 * Check if a user has permission in their organization
 * This is the main permission check function
 */
export async function checkOrganizationPermission(
  organizationId: string,
  userRole: string | string[],
  resource: string,
  action: string,
): Promise<boolean> {
  const roles = Array.isArray(userRole) ? userRole : [userRole];

  for (const role of roles) {
    const hasPermission = await prisma.organizationRolePermission.findFirst({
      where: {
        organizationId,
        role,
        resource,
        action,
      },
    });

    if (hasPermission) {
      return true;
    }
  }

  return false;
}

/**
 * Get all permissions for a role in an organization
 * Returns in the format expected by better-auth
 */
export async function getRolePermissions(organizationId: string, role: string) {
  return loadOrganizationRolePermissions(organizationId, role);
}

/**
 * Create a new custom role with permissions in an organization
 * This allows runtime creation of roles
 */
export async function createOrganizationRole(
  organizationId: string,
  roleName: string,
  permissions: Record<string, string[]>,
) {
  const permissionRecords: any[] = [];

  for (const [resource, actions] of Object.entries(permissions)) {
    for (const action of actions) {
      permissionRecords.push({
        organizationId,
        role: roleName,
        resource,
        action,
        description: `${roleName} can ${action} ${resource}`,
      });
    }
  }

  const result = await prisma.organizationRolePermission.createMany({
    data: permissionRecords,
    skipDuplicates: true,
  });

  return result;
}

/**
 * Update role permissions
 */
export async function updateOrganizationRole(
  organizationId: string,
  roleName: string,
  permissions: Record<string, string[]>,
) {
  // Delete existing permissions for this role
  await prisma.organizationRolePermission.deleteMany({
    where: {
      organizationId,
      role: roleName,
    },
  });

  // Create new permissions
  return createOrganizationRole(organizationId, roleName, permissions);
}

/**
 * Delete a role and all its permissions
 */
export async function deleteOrganizationRole(
  organizationId: string,
  roleName: string,
) {
  const result = await prisma.organizationRolePermission.deleteMany({
    where: {
      organizationId,
      role: roleName,
    },
  });

  return result;
}

/**
 * List all available roles in an organization
 */
export async function listOrganizationRoles(organizationId: string) {
  const roles = await prisma.organizationRolePermission.findMany({
    where: {
      organizationId,
    },
    select: {
      role: true,
    },
    distinct: ['role'],
  });

  return roles.map((r) => r.role);
}

/**
 * Export types for TypeScript
 */
export type Roles = 
  | 'owner' 
  | 'admin' 
  | 'contentManager' 
  | 'moderator' 
  | 'member' 
  | 'viewer';

export type Resource = keyof typeof statement;
export type Action<R extends Resource> = typeof statement[R][number];
