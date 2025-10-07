/**
 * Permission Service
 * Provides methods to manage organization permissions dynamically
 */

import { Injectable } from '@nestjs/common';
import { PrismaClient } from 'prisma/@generated/client';
import {
  checkOrganizationPermission,
  createOrganizationRole,
  deleteOrganizationRole,
  getRolePermissions,
  listOrganizationRoles,
  updateOrganizationRole,
} from '../auth/permissions.dynamic';
import { seedOrganizationPermissions } from '../../prisma/seeds/permissions.seed';

@Injectable()
export class PermissionService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Check if a user has permission
   */
  async hasPermission(
    organizationId: string,
    userRole: string | string[],
    resource: string,
    action: string,
  ): Promise<boolean> {
    return checkOrganizationPermission(organizationId, userRole, resource, action);
  }

  /**
   * Get all permissions for a role
   */
  async getRolePermissions(organizationId: string, role: string) {
    return getRolePermissions(organizationId, role);
  }

  /**
   * List all roles in an organization
   */
  async listRoles(organizationId: string) {
    return listOrganizationRoles(organizationId);
  }

  /**
   * Create a new custom role
   */
  async createRole(
    organizationId: string,
    roleName: string,
    permissions: Record<string, string[]>,
  ) {
    return createOrganizationRole(organizationId, roleName, permissions);
  }

  /**
   * Update role permissions
   */
  async updateRole(
    organizationId: string,
    roleName: string,
    permissions: Record<string, string[]>,
  ) {
    return updateOrganizationRole(organizationId, roleName, permissions);
  }

  /**
   * Delete a role
   */
  async deleteRole(organizationId: string, roleName: string) {
    return deleteOrganizationRole(organizationId, roleName);
  }

  /**
   * Seed default permissions for an organization
   */
  async seedDefaultPermissions(organizationId: string) {
    return seedOrganizationPermissions(organizationId);
  }

  /**
   * Get all permissions for an organization (all roles)
   */
  async getAllOrganizationPermissions(organizationId: string) {
    const permissions = await this.prisma.organizationRolePermission.findMany({
      where: {
        organizationId,
      },
      select: {
        role: true,
        resource: true,
        action: true,
        description: true,
      },
      orderBy: [
        { role: 'asc' },
        { resource: 'asc' },
        { action: 'asc' },
      ],
    });

    // Group by role
    const grouped: Record<string, Record<string, string[]>> = {};
    for (const perm of permissions) {
      if (!grouped[perm.role]) {
        grouped[perm.role] = {};
      }
      if (!grouped[perm.role][perm.resource]) {
        grouped[perm.role][perm.resource] = [];
      }
      grouped[perm.role][perm.resource].push(perm.action);
    }

    return grouped;
  }

  /**
   * Add a single permission to a role
   */
  async addPermission(
    organizationId: string,
    role: string,
    resource: string,
    action: string,
    description?: string,
  ) {
    return this.prisma.organizationRolePermission.create({
      data: {
        organizationId,
        role,
        resource,
        action,
        description,
      },
    });
  }

  /**
   * Remove a single permission from a role
   */
  async removePermission(
    organizationId: string,
    role: string,
    resource: string,
    action: string,
  ) {
    return this.prisma.organizationRolePermission.deleteMany({
      where: {
        organizationId,
        role,
        resource,
        action,
      },
    });
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
