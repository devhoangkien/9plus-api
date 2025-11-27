/**
 * Role and Permission Service
 * Manages system-wide roles and permissions (Admin Plugin)
 */

import { Injectable } from '@nestjs/common';
import { PrismaClient, RoleStatusEnum } from 'prisma/@generated/client';
import { ErrorCodes, createErrorString } from '@anineplus/common';

@Injectable()
export class RolePermissionService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Check if a user has a specific permission
   */
  async userHasPermission(
    userId: string,
    permissionKey: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        roles: {
          some: {
            status: 'ACTIVE',
            permissions: {
              some: {
                key: permissionKey,
                status: 'ACTIVE',
              },
            },
          },
        },
      },
    });

    return user !== null;
  }

  /**
   * Check if a user has multiple permissions (requires ALL)
   */
  async userHasPermissions(
    userId: string,
    permissionKeys: string[],
  ): Promise<boolean> {
    const results = await Promise.all(
      permissionKeys.map((key) => this.userHasPermission(userId, key)),
    );

    return results.every((has) => has);
  }

  /**
   * Check if a user has any of the permissions (requires ANY)
   */
  async userHasAnyPermission(
    userId: string,
    permissionKeys: string[],
  ): Promise<boolean> {
    const results = await Promise.all(
      permissionKeys.map((key) => this.userHasPermission(userId, key)),
    );

    return results.some((has) => has);
  }

  /**
   * Get all permissions for a user (deduplicated)
   */
  async getUserPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          where: { status: 'ACTIVE' },
          include: {
            permissions: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    // Flatten and deduplicate
    const permissionMap = new Map();
    for (const role of user.roles) {
      for (const permission of role.permissions) {
        permissionMap.set(permission.key, permission);
      }
    }

    return Array.from(permissionMap.values());
  }

  /**
   * Get user permissions grouped by resource
   */
  async getUserPermissionsByResource(userId: string) {
    const permissions = await this.getUserPermissions(userId);

    const grouped: Record<string, string[]> = {};
    for (const perm of permissions) {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = [];
      }
      grouped[perm.resource].push(perm.action);
    }

    return grouped;
  }

  /**
   * Get all roles for a user
   */
  async getUserRoles(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          where: { status: 'ACTIVE' },
          orderBy: { level: 'desc' },
        },
      },
    });

    return user?.roles || [];
  }

  /**
   * Get highest role level for a user
   */
  async getUserMaxRoleLevel(userId: string): Promise<number> {
    const roles = await this.getUserRoles(userId);
    return Math.max(...roles.map((r) => r.level), 0);
  }

  /**
   * Check if user has a specific role
   */
  async userHasRole(userId: string, roleKey: string): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        roles: {
          some: {
            key: roleKey,
            status: 'ACTIVE',
          },
        },
      },
    });

    return user !== null;
  }

  /**
   * Check if user has any of the roles
   */
  async userHasAnyRole(userId: string, roleKeys: string[]): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        roles: {
          some: {
            key: {
              in: roleKeys,
            },
            status: 'ACTIVE',
          },
        },
      },
    });

    return user !== null;
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: string, roleKey: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          connect: { key: roleKey },
        },
      },
      include: {
        roles: true,
      },
    });
  }

  /**
   * Assign multiple roles to user
   */
  async assignRolesToUser(userId: string, roleKeys: string[]) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          connect: roleKeys.map((key) => ({ key })),
        },
      },
      include: {
        roles: true,
      },
    });
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string, roleKey: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          disconnect: { key: roleKey },
        },
      },
      include: {
        roles: true,
      },
    });
  }

  /**
   * Set user roles (replaces all existing roles)
   */
  async setUserRoles(userId: string, roleKeys: string[]) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          set: [], // Clear all
          connect: roleKeys.map((key) => ({ key })),
        },
      },
      include: {
        roles: true,
      },
    });
  }

  /**
   * Create a new role
   */
  async createRole(data: {
    key: string;
    name: string;
    description?: string;
    level: number;
    isSystemRole?: boolean;
    permissionKeys?: string[];
  }) {
    const { permissionKeys, ...roleData } = data;

    const role = await this.prisma.role.create({
      data: {
        ...roleData,
        status: 'ACTIVE',
        isSystemRole: roleData.isSystemRole ?? false,
      },
    });

    // Add permissions if provided
    if (permissionKeys && permissionKeys.length > 0) {
      await this.addPermissionsToRole(role.key, permissionKeys);
    }

    return role;
  }

  /**
   * Update role
   */
  async updateRole(
    roleKey: string,
    data: {
      name?: string;
      description?: string;
      level?: number;
      status?: RoleStatusEnum;
    },
  ) {
    return this.prisma.role.update({
      where: { key: roleKey },
      data,
    });
  }

  /**
   * Delete role (only non-system roles)
   */
  async deleteRole(roleKey: string) {
    const role = await this.prisma.role.findUnique({
      where: { key: roleKey },
    });

    if (!role) {
      throw new Error(createErrorString('Role not found', ErrorCodes.ROLE_NOT_FOUND));
    }

    if (role.isSystemRole) {
      throw new Error(createErrorString('Cannot delete system role', ErrorCodes.ROLE_CANNOT_DELETE_SYSTEM_ROLE));
    }

    return this.prisma.role.delete({
      where: { key: roleKey },
    });
  }

  /**
   * Get role with permissions
   */
  async getRole(roleKey: string) {
    return this.prisma.role.findUnique({
      where: { key: roleKey },
      include: {
        permissions: {
          where: { status: 'ACTIVE' },
          orderBy: { resource: 'asc' },
        },
        _count: {
          select: { users: true },
        },
      },
    });
  }

  /**
   * List all roles
   */
  async listRoles() {
    return this.prisma.role.findMany({
      include: {
        _count: {
          select: { users: true, permissions: true },
        },
      },
      orderBy: { level: 'desc' },
    });
  }

  /**
   * Add permissions to role
   */
  async addPermissionsToRole(roleKey: string, permissionKeys: string[]) {
    return this.prisma.role.update({
      where: { key: roleKey },
      data: {
        permissions: {
          connect: permissionKeys.map((key) => ({ key })),
        },
      },
      include: {
        permissions: true,
      },
    });
  }

  /**
   * Remove permissions from role
   */
  async removePermissionsFromRole(roleKey: string, permissionKeys: string[]) {
    return this.prisma.role.update({
      where: { key: roleKey },
      data: {
        permissions: {
          disconnect: permissionKeys.map((key) => ({ key })),
        },
      },
      include: {
        permissions: true,
      },
    });
  }

  /**
   * Set role permissions (replaces all existing permissions)
   */
  async setRolePermissions(roleKey: string, permissionKeys: string[]) {
    return this.prisma.role.update({
      where: { key: roleKey },
      data: {
        permissions: {
          set: [], // Clear all
          connect: permissionKeys.map((key) => ({ key })),
        },
      },
      include: {
        permissions: true,
      },
    });
  }

  /**
   * Get all permissions
   */
  async listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  /**
   * Get permissions by resource
   */
  async getPermissionsByResource(resource: string) {
    return this.prisma.permission.findMany({
      where: { resource },
      orderBy: { action: 'asc' },
    });
  }

  /**
   * Create permission
   */
  async createPermission(data: {
    key: string;
    name: string;
    resource: string;
    action: string;
    scope: string;
    description?: string;
  }) {
    return this.prisma.permission.create({
      data: {
        ...data,
        status: 'ACTIVE',
      },
    });
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
