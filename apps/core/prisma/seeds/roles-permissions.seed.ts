/**
 * Role and Permission Seed
 * Seeds system-wide roles, permissions and their relationships
 */

import { PrismaClient } from "prisma/@generated/client";


const prisma = new PrismaClient();

/**
 * System-wide permission definitions
 */
export const SYSTEM_PERMISSIONS = [
  // User Management Permissions
  {
    key: 'user:create',
    name: 'Create User',
    resource: 'user',
    action: 'create',
    scope: 'ALL',
    description: 'Permission to create new users',
  },
  {
    key: 'user:list',
    name: 'List Users',
    resource: 'user',
    action: 'list',
    scope: 'ALL',
    description: 'Permission to list all users',
  },
  {
    key: 'user:read',
    name: 'Read User',
    resource: 'user',
    action: 'read',
    scope: 'ALL',
    description: 'Permission to read user details',
  },
  {
    key: 'user:read:own',
    name: 'Read Own User',
    resource: 'user',
    action: 'read',
    scope: 'OWN',
    description: 'Permission to read own user details',
  },
  {
    key: 'user:update',
    name: 'Update User',
    resource: 'user',
    action: 'update',
    scope: 'ALL',
    description: 'Permission to update any user',
  },
  {
    key: 'user:update:own',
    name: 'Update Own User',
    resource: 'user',
    action: 'update',
    scope: 'OWN',
    description: 'Permission to update own profile',
  },
  {
    key: 'user:delete',
    name: 'Delete User',
    resource: 'user',
    action: 'delete',
    scope: 'ALL',
    description: 'Permission to delete users',
  },
  {
    key: 'user:ban',
    name: 'Ban User',
    resource: 'user',
    action: 'ban',
    scope: 'ALL',
    description: 'Permission to ban users',
  },
  {
    key: 'user:unban',
    name: 'Unban User',
    resource: 'user',
    action: 'unban',
    scope: 'ALL',
    description: 'Permission to unban users',
  },
  {
    key: 'user:impersonate',
    name: 'Impersonate User',
    resource: 'user',
    action: 'impersonate',
    scope: 'ALL',
    description: 'Permission to impersonate other users',
  },
  {
    key: 'user:set-role',
    name: 'Set User Role',
    resource: 'user',
    action: 'set-role',
    scope: 'ALL',
    description: 'Permission to change user roles',
  },
  {
    key: 'user:set-password',
    name: 'Set User Password',
    resource: 'user',
    action: 'set-password',
    scope: 'ALL',
    description: 'Permission to change user passwords',
  },

  // Session Management Permissions
  {
    key: 'session:list',
    name: 'List Sessions',
    resource: 'session',
    action: 'list',
    scope: 'ALL',
    description: 'Permission to list all user sessions',
  },
  {
    key: 'session:list:own',
    name: 'List Own Sessions',
    resource: 'session',
    action: 'list',
    scope: 'OWN',
    description: 'Permission to list own sessions',
  },
  {
    key: 'session:revoke',
    name: 'Revoke Session',
    resource: 'session',
    action: 'revoke',
    scope: 'ALL',
    description: 'Permission to revoke any session',
  },
  {
    key: 'session:revoke:own',
    name: 'Revoke Own Session',
    resource: 'session',
    action: 'revoke',
    scope: 'OWN',
    description: 'Permission to revoke own sessions',
  },
  {
    key: 'session:delete',
    name: 'Delete Session',
    resource: 'session',
    action: 'delete',
    scope: 'ALL',
    description: 'Permission to delete any session',
  },

  // System Management Permissions
  {
    key: 'system:read',
    name: 'Read System Info',
    resource: 'system',
    action: 'read',
    scope: 'ALL',
    description: 'Permission to read system information',
  },
  {
    key: 'system:update',
    name: 'Update System',
    resource: 'system',
    action: 'update',
    scope: 'ALL',
    description: 'Permission to update system settings',
  },
  {
    key: 'system:configure',
    name: 'Configure System',
    resource: 'system',
    action: 'configure',
    scope: 'ALL',
    description: 'Permission to configure system',
  },
  {
    key: 'system:maintain',
    name: 'Maintain System',
    resource: 'system',
    action: 'maintain',
    scope: 'ALL',
    description: 'Permission to perform system maintenance',
  },

  // Plugin Management Permissions
  {
    key: 'plugin:create',
    name: 'Create Plugin',
    resource: 'plugin',
    action: 'create',
    scope: 'ALL',
    description: 'Permission to create plugins',
  },
  {
    key: 'plugin:read',
    name: 'Read Plugin',
    resource: 'plugin',
    action: 'read',
    scope: 'ALL',
    description: 'Permission to read plugin information',
  },
  {
    key: 'plugin:update',
    name: 'Update Plugin',
    resource: 'plugin',
    action: 'update',
    scope: 'ALL',
    description: 'Permission to update plugins',
  },
  {
    key: 'plugin:delete',
    name: 'Delete Plugin',
    resource: 'plugin',
    action: 'delete',
    scope: 'ALL',
    description: 'Permission to delete plugins',
  },
  {
    key: 'plugin:activate',
    name: 'Activate Plugin',
    resource: 'plugin',
    action: 'activate',
    scope: 'ALL',
    description: 'Permission to activate plugins',
  },
  {
    key: 'plugin:deactivate',
    name: 'Deactivate Plugin',
    resource: 'plugin',
    action: 'deactivate',
    scope: 'ALL',
    description: 'Permission to deactivate plugins',
  },

  // Analytics Permissions
  {
    key: 'analytics:read',
    name: 'Read Analytics',
    resource: 'analytics',
    action: 'read',
    scope: 'ALL',
    description: 'Permission to read analytics data',
  },
  {
    key: 'analytics:read:org',
    name: 'Read Organization Analytics',
    resource: 'analytics',
    action: 'read',
    scope: 'ORGANIZATION',
    description: 'Permission to read organization analytics',
  },
  {
    key: 'analytics:export',
    name: 'Export Analytics',
    resource: 'analytics',
    action: 'export',
    scope: 'ALL',
    description: 'Permission to export analytics data',
  },
  {
    key: 'analytics:manage',
    name: 'Manage Analytics',
    resource: 'analytics',
    action: 'manage',
    scope: 'ALL',
    description: 'Permission to manage analytics settings',
  },

  // Settings Permissions
  {
    key: 'settings:read',
    name: 'Read Settings',
    resource: 'settings',
    action: 'read',
    scope: 'ALL',
    description: 'Permission to read system settings',
  },
  {
    key: 'settings:update',
    name: 'Update Settings',
    resource: 'settings',
    action: 'update',
    scope: 'ALL',
    description: 'Permission to update system settings',
  },

  // Audit Permissions
  {
    key: 'audit:read',
    name: 'Read Audit Logs',
    resource: 'audit',
    action: 'read',
    scope: 'ALL',
    description: 'Permission to read audit logs',
  },
  {
    key: 'audit:export',
    name: 'Export Audit Logs',
    resource: 'audit',
    action: 'export',
    scope: 'ALL',
    description: 'Permission to export audit logs',
  },
];

/**
 * System roles with their permission mappings
 */
export const SYSTEM_ROLES = [
  {
    key: 'super-admin',
    name: 'Super Administrator',
    description: 'Full system control with unrestricted access to all features and settings',
    level: 100,
    isSystemRole: true,
    status: 'ACTIVE',
    permissionKeys: [
      // All user permissions
      'user:create',
      'user:list',
      'user:read',
      'user:update',
      'user:delete',
      'user:ban',
      'user:unban',
      'user:impersonate',
      'user:set-role',
      'user:set-password',
      // All session permissions
      'session:list',
      'session:revoke',
      'session:delete',
      // All system permissions
      'system:read',
      'system:update',
      'system:configure',
      'system:maintain',
      // All plugin permissions
      'plugin:create',
      'plugin:read',
      'plugin:update',
      'plugin:delete',
      'plugin:activate',
      'plugin:deactivate',
      // All analytics permissions
      'analytics:read',
      'analytics:export',
      'analytics:manage',
      // All settings permissions
      'settings:read',
      'settings:update',
      // All audit permissions
      'audit:read',
      'audit:export',
    ],
  },
  {
    key: 'admin',
    name: 'Administrator',
    description: 'User management and system monitoring capabilities without full system access',
    level: 50,
    isSystemRole: true,
    status: 'ACTIVE',
    permissionKeys: [
      // User management
      'user:create',
      'user:list',
      'user:read',
      'user:update',
      'user:delete',
      'user:ban',
      'user:unban',
      'user:impersonate',
      'user:set-role',
      'user:set-password',
      // Session management
      'session:list',
      'session:revoke',
      'session:delete',
      // Limited system access
      'system:read',
      // Plugin read-only
      'plugin:read',
      // Analytics access
      'analytics:read',
      'analytics:export',
      // Settings read-only
      'settings:read',
      // Audit access
      'audit:read',
    ],
  },
  {
    key: 'moderator',
    name: 'Moderator',
    description: 'Content moderation and basic user management',
    level: 25,
    isSystemRole: true,
    status: 'ACTIVE',
    permissionKeys: [
      // Limited user management
      'user:list',
      'user:read',
      'user:ban',
      'user:unban',
      // Session viewing
      'session:list',
      // System read
      'system:read',
      // Analytics read
      'analytics:read',
    ],
  },
  {
    key: 'user',
    name: 'User',
    description: 'Regular user with basic access to own data',
    level: 1,
    isSystemRole: true,
    status: 'ACTIVE',
    permissionKeys: [
      // Own data only
      'user:read:own',
      'user:update:own',
      // Own sessions
      'session:list:own',
      'session:revoke:own',
      // Basic system read
      'system:read',
      // Organization analytics
      'analytics:read:org',
    ],
  },
];

/**
 * Seed all permissions
 */
async function seedPermissions() {
  console.log('📝 Seeding permissions...');

  const permissions = [];

  for (const perm of SYSTEM_PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { key: perm.key },
      update: {
        name: perm.name,
        resource: perm.resource,
        action: perm.action,
        scope: perm.scope,
        description: perm.description,
        status: 'ACTIVE',
      },
      create: {
        key: perm.key,
        name: perm.name,
        resource: perm.resource,
        action: perm.action,
        scope: perm.scope,
        description: perm.description,
        status: 'ACTIVE',
      },
    });

    permissions.push(permission);
  }

  console.log(`  ✓ Created/updated ${permissions.length} permissions\n`);
  return permissions;
}

/**
 * Seed all roles and their permissions
 */
async function seedRoles() {
  console.log('👥 Seeding roles...');

  for (const roleData of SYSTEM_ROLES) {
    console.log(`  Processing role: ${roleData.name} (${roleData.key})`);

    // Create or update role
    const role = await prisma.role.upsert({
      where: { key: roleData.key },
      update: {
        name: roleData.name,
        description: roleData.description,
        level: roleData.level,
        isSystemRole: roleData.isSystemRole,
        status: roleData.status as any,
      },
      create: {
        key: roleData.key,
        name: roleData.name,
        description: roleData.description,
        level: roleData.level,
        isSystemRole: roleData.isSystemRole,
        status: roleData.status as any,
      },
    });

    // Get permissions for this role
    const permissions = await prisma.permission.findMany({
      where: {
        key: {
          in: roleData.permissionKeys,
        },
      },
    });

    // Clear existing permissions for this role
    await prisma.role.update({
      where: { id: role.id },
      data: {
        permissions: {
          set: [], // Disconnect all
        },
      },
    });

    // Connect new permissions
    await prisma.role.update({
      where: { id: role.id },
      data: {
        permissions: {
          connect: permissions.map((p) => ({ id: p.id })),
        },
      },
    });

    console.log(`    ✓ Linked ${permissions.length} permissions`);
  }

  console.log(`  ✓ Created/updated ${SYSTEM_ROLES.length} roles\n`);
}

/**
 * Main seed function
 */
export async function seedRolesAndPermissions() {
  console.log('🌱 Starting Roles and Permissions seeding...\n');

  try {
    // 1. Seed permissions first
    await seedPermissions();

    // 2. Seed roles and link permissions
    await seedRoles();

    console.log('✅ Roles and Permissions seeding completed!\n');

    // Display summary
    await displaySummary();
  } catch (error) {
    console.error('❌ Error seeding roles and permissions:', error);
    throw error;
  }
}

/**
 * Display summary of seeded data
 */
async function displaySummary() {
  console.log('📊 Summary:\n');

  const roles = await prisma.role.findMany({
    include: {
      permissions: true,
      _count: {
        select: { users: true },
      },
    },
    orderBy: { level: 'desc' },
  });

  for (const role of roles) {
    console.log(`${role.name} (${role.key})`);
    console.log(`  Level: ${role.level}`);
    console.log(`  System Role: ${role.isSystemRole ? 'Yes' : 'No'}`);
    console.log(`  Status: ${role.status}`);
    console.log(`  Users: ${role._count.users}`);
    console.log(`  Permissions: ${role.permissions.length}`);

    // Group permissions by resource
    const grouped: Record<string, string[]> = {};
    for (const perm of role.permissions) {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = [];
      }
      grouped[perm.resource].push(`${perm.action}${perm.scope !== 'ALL' ? ` (${perm.scope})` : ''}`);
    }

    for (const [resource, actions] of Object.entries(grouped)) {
      console.log(`    • ${resource}: ${actions.join(', ')}`);
    }
    console.log('');
  }

  // Total counts
  const totalPermissions = await prisma.permission.count();
  console.log(`Total Permissions: ${totalPermissions}`);
  console.log(`Total Roles: ${roles.length}`);
}

/**
 * Clear all roles and permissions
 */
export async function clearRolesAndPermissions() {
  console.log('🗑️  Clearing roles and permissions...');

  // Disconnect all role-permission relationships
  const roles = await prisma.role.findMany({
    include: { permissions: true },
  });

  for (const role of roles) {
    await prisma.role.update({
      where: { id: role.id },
      data: {
        permissions: {
          disconnect: role.permissions.map((p) => ({ id: p.id })),
        },
      },
    });
  }

  // Delete non-system roles
  const deletedRoles = await prisma.role.deleteMany({
    where: { isSystemRole: false },
  });
  console.log(`  ✓ Deleted ${deletedRoles.count} non-system roles`);

  // Delete all permissions
  const deletedPermissions = await prisma.permission.deleteMany({});
  console.log(`  ✓ Deleted ${deletedPermissions.count} permissions\n`);
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedRolesAndPermissions()
    .catch((error) => {
      console.error('❌ Error:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
