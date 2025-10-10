/**
 * Global Permissions Seed
 * Seeds system-wide roles and permissions for Admin plugin
 */

import { PrismaClient } from '../@generated/client';

const prisma = new PrismaClient();

/**
 * Global permission definitions for Admin plugin
 */

// System-wide resources and actions
export const GLOBAL_RESOURCES = {
  // Better-auth admin default resources
  user: ['create', 'list', 'update', 'delete', 'ban', 'unban', 'impersonate', 'set-role', 'set-password'],
  session: ['list', 'revoke', 'delete'],
  
  // Custom system resources
  system: ['read', 'update', 'configure', 'maintain'],
  plugin: ['create', 'read', 'update', 'delete', 'activate', 'deactivate'],
  analytics: ['read', 'export', 'manage'],
  settings: ['read', 'update'],
  audit: ['read', 'export'],
} as const;

// Role definitions with permissions
export const GLOBAL_ROLES = [
  {
    key: 'super-admin',
    name: 'Super Administrator',
    description: 'Full system control and access',
    level: 100,
    isSystemRole: true,
    permissions: [
      // Full control over users
      { resource: 'user', action: 'create', scope: 'ALL' },
      { resource: 'user', action: 'list', scope: 'ALL' },
      { resource: 'user', action: 'update', scope: 'ALL' },
      { resource: 'user', action: 'delete', scope: 'ALL' },
      { resource: 'user', action: 'ban', scope: 'ALL' },
      { resource: 'user', action: 'unban', scope: 'ALL' },
      { resource: 'user', action: 'impersonate', scope: 'ALL' },
      { resource: 'user', action: 'set-role', scope: 'ALL' },
      { resource: 'user', action: 'set-password', scope: 'ALL' },
      // Full control over sessions
      { resource: 'session', action: 'list', scope: 'ALL' },
      { resource: 'session', action: 'revoke', scope: 'ALL' },
      { resource: 'session', action: 'delete', scope: 'ALL' },
      // Full system control
      { resource: 'system', action: 'read', scope: 'ALL' },
      { resource: 'system', action: 'update', scope: 'ALL' },
      { resource: 'system', action: 'configure', scope: 'ALL' },
      { resource: 'system', action: 'maintain', scope: 'ALL' },
      // Plugin management
      { resource: 'plugin', action: 'create', scope: 'ALL' },
      { resource: 'plugin', action: 'read', scope: 'ALL' },
      { resource: 'plugin', action: 'update', scope: 'ALL' },
      { resource: 'plugin', action: 'delete', scope: 'ALL' },
      { resource: 'plugin', action: 'activate', scope: 'ALL' },
      { resource: 'plugin', action: 'deactivate', scope: 'ALL' },
      // Analytics access
      { resource: 'analytics', action: 'read', scope: 'ALL' },
      { resource: 'analytics', action: 'export', scope: 'ALL' },
      { resource: 'analytics', action: 'manage', scope: 'ALL' },
      // Settings management
      { resource: 'settings', action: 'read', scope: 'ALL' },
      { resource: 'settings', action: 'update', scope: 'ALL' },
      // Audit logs
      { resource: 'audit', action: 'read', scope: 'ALL' },
      { resource: 'audit', action: 'export', scope: 'ALL' },
    ],
  },
  {
    key: 'admin',
    name: 'Administrator',
    description: 'User management and system monitoring',
    level: 50,
    isSystemRole: true,
    permissions: [
      // User management
      { resource: 'user', action: 'create', scope: 'ALL' },
      { resource: 'user', action: 'list', scope: 'ALL' },
      { resource: 'user', action: 'update', scope: 'ALL' },
      { resource: 'user', action: 'delete', scope: 'ALL' },
      { resource: 'user', action: 'ban', scope: 'ALL' },
      { resource: 'user', action: 'unban', scope: 'ALL' },
      { resource: 'user', action: 'impersonate', scope: 'ALL' },
      { resource: 'user', action: 'set-role', scope: 'ALL' },
      { resource: 'user', action: 'set-password', scope: 'ALL' },
      // Session management
      { resource: 'session', action: 'list', scope: 'ALL' },
      { resource: 'session', action: 'revoke', scope: 'ALL' },
      { resource: 'session', action: 'delete', scope: 'ALL' },
      // Limited system access
      { resource: 'system', action: 'read', scope: 'ALL' },
      // Plugin read-only
      { resource: 'plugin', action: 'read', scope: 'ALL' },
      // Analytics access
      { resource: 'analytics', action: 'read', scope: 'ALL' },
      { resource: 'analytics', action: 'export', scope: 'ALL' },
      // Settings read-only
      { resource: 'settings', action: 'read', scope: 'ALL' },
      // Audit read access
      { resource: 'audit', action: 'read', scope: 'ALL' },
    ],
  },
  {
    key: 'user',
    name: 'User',
    description: 'Regular user with basic access',
    level: 1,
    isSystemRole: true,
    permissions: [
      // Can only view own data
      { resource: 'user', action: 'list', scope: 'OWN' },
      { resource: 'user', action: 'update', scope: 'OWN' },
      // Can manage own sessions
      { resource: 'session', action: 'list', scope: 'OWN' },
      { resource: 'session', action: 'revoke', scope: 'OWN' },
      // Basic system read
      { resource: 'system', action: 'read', scope: 'ALL' },
      // Can view analytics
      { resource: 'analytics', action: 'read', scope: 'ORGANIZATION' },
    ],
  },
];

/**
 * Seed global roles and permissions
 */
export async function seedGlobalPermissions() {
  console.log('🌱 Seeding global roles and permissions...\n');

  for (const roleData of GLOBAL_ROLES) {
    console.log(`Processing role: ${roleData.name} (${roleData.key})`);

    // Create or update role
    const role = await prisma.role.upsert({
      where: { key: roleData.key },
      update: {
        name: roleData.name,
        description: roleData.description,
        level: roleData.level,
        isSystemRole: roleData.isSystemRole,
      },
      create: {
        key: roleData.key,
        name: roleData.name,
        description: roleData.description,
        level: roleData.level,
        isSystemRole: roleData.isSystemRole,
      },
    });

    console.log(`  ✓ Role created/updated: ${role.id}`);

    // Create permissions
    for (const perm of roleData.permissions) {
      const permKey = `${perm.resource}:${perm.action}:${perm.scope}`;
      
      const permission = await prisma.permission.upsert({
        where: { key: permKey },
        update: {
          name: `${perm.action} ${perm.resource}`,
          resource: perm.resource,
          action: perm.action,
          scope: perm.scope,
        },
        create: {
          key: permKey,
          name: `${perm.action} ${perm.resource}`,
          resource: perm.resource,
          action: perm.action,
          scope: perm.scope,
          description: `Permission to ${perm.action} ${perm.resource} with scope ${perm.scope}`,
        },
      });

      // Link permission to role
      await prisma.role.update({
        where: { id: role.id },
        data: {
          permissions: {
            connect: { id: permission.id },
          },
        },
      });
    }

    console.log(`  ✓ ${roleData.permissions.length} permissions linked\n`);
  }

  console.log('✅ Global permissions seeding completed!\n');
}

/**
 * Clear all global roles and permissions
 */
export async function clearGlobalPermissions() {
  console.log('🗑️  Clearing global roles and permissions...');
  
  // Delete all non-system roles first
  await prisma.role.deleteMany({
    where: { isSystemRole: false },
  });
  
  // Disconnect permissions from system roles
  const systemRoles = await prisma.role.findMany({
    where: { isSystemRole: true },
    include: { permissions: true },
  });

  for (const role of systemRoles) {
    await prisma.role.update({
      where: { id: role.id },
      data: {
        permissions: {
          disconnect: role.permissions.map(p => ({ id: p.id })),
        },
      },
    });
  }

  // Delete all permissions
  const permCount = await prisma.permission.deleteMany({});
  console.log(`✅ Deleted ${permCount.count} permissions`);

  return permCount;
}

/**
 * List all global roles with their permissions
 */
export async function listGlobalRoles() {
  const roles = await prisma.role.findMany({
    include: {
      permissions: true,
      _count: {
        select: { users: true },
      },
    },
    orderBy: { level: 'desc' },
  });

  console.log('\n📋 Global Roles:\n');
  for (const role of roles) {
    console.log(`${role.name} (${role.key})`);
    console.log(`  Level: ${role.level}`);
    console.log(`  System Role: ${role.isSystemRole ? 'Yes' : 'No'}`);
    console.log(`  Users: ${role._count.users}`);
    console.log(`  Permissions: ${role.permissions.length}`);
    
    // Group permissions by resource
    const grouped: Record<string, string[]> = {};
    for (const perm of role.permissions) {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = [];
      }
      grouped[perm.resource].push(`${perm.action} (${perm.scope})`);
    }

    for (const [resource, actions] of Object.entries(grouped)) {
      console.log(`    ${resource}: ${actions.join(', ')}`);
    }
    console.log('');
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedGlobalPermissions()
    .then(() => listGlobalRoles())
    .catch((error) => {
      console.error('❌ Error seeding global permissions:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
