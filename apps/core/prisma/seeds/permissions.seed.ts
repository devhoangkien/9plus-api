import { PrismaClient } from '../@generated/client';

const prisma = new PrismaClient();

/**
 * Permission definitions matching better-auth organization plugin structure
 * These permissions will be stored in the database instead of static permissions.ts
 */

export interface PermissionDefinition {
  role: string;
  resource: string;
  actions: string[];
  description?: string;
}

// Define all available resources and their possible actions
export const RESOURCES = {
  // Better-auth default resources
  organization: ['create', 'read', 'update', 'delete'],
  member: ['create', 'read', 'update', 'delete'],
  invitation: ['create', 'read', 'update', 'delete', 'cancel'],
  team: ['create', 'read', 'update', 'delete'],
  ac: ['create', 'read', 'update', 'delete'], // Access control management

  // Custom anime platform resources
  anime: ['create', 'read', 'update', 'delete', 'publish'],
  episode: ['create', 'read', 'update', 'delete', 'upload'],
  comment: ['create', 'read', 'update', 'delete', 'moderate'],
  user: ['read', 'update', 'ban', 'unban'],
  subscription: ['create', 'read', 'update', 'cancel'],
  analytics: ['read', 'export'],
  settings: ['read', 'update'],
} as const;

// Role definitions with their permissions
export const ROLE_PERMISSIONS: Record<string, PermissionDefinition[]> = {
  // Owner: Full control over everything
  owner: [
    {
      role: 'owner',
      resource: 'organization',
      actions: ['create', 'read', 'update', 'delete'],
      description: 'Full control over organization',
    },
    {
      role: 'owner',
      resource: 'member',
      actions: ['create', 'read', 'update', 'delete'],
      description: 'Full control over members',
    },
    {
      role: 'owner',
      resource: 'invitation',
      actions: ['create', 'read', 'update', 'delete', 'cancel'],
      description: 'Full control over invitations',
    },
    {
      role: 'owner',
      resource: 'team',
      actions: ['create', 'read', 'update', 'delete'],
      description: 'Full control over teams',
    },
    {
      role: 'owner',
      resource: 'ac',
      actions: ['create', 'read', 'update', 'delete'],
      description: 'Full control over access control',
    },
    {
      role: 'owner',
      resource: 'anime',
      actions: ['create', 'read', 'update', 'delete', 'publish'],
      description: 'Full control over anime content',
    },
    {
      role: 'owner',
      resource: 'episode',
      actions: ['create', 'read', 'update', 'delete', 'upload'],
      description: 'Full control over episodes',
    },
    {
      role: 'owner',
      resource: 'comment',
      actions: ['create', 'read', 'update', 'delete', 'moderate'],
      description: 'Full control over comments',
    },
    {
      role: 'owner',
      resource: 'user',
      actions: ['read', 'update', 'ban', 'unban'],
      description: 'Full control over users',
    },
    {
      role: 'owner',
      resource: 'subscription',
      actions: ['create', 'read', 'update', 'cancel'],
      description: 'Full control over subscriptions',
    },
    {
      role: 'owner',
      resource: 'analytics',
      actions: ['read', 'export'],
      description: 'Full access to analytics',
    },
    {
      role: 'owner',
      resource: 'settings',
      actions: ['read', 'update'],
      description: 'Full control over settings',
    },
  ],

  // Admin: Can manage content and users but not billing/subscriptions
  admin: [
    {
      role: 'admin',
      resource: 'organization',
      actions: ['read', 'update'],
      description: 'Can view and update organization details',
    },
    {
      role: 'admin',
      resource: 'member',
      actions: ['create', 'read', 'update', 'delete'],
      description: 'Full control over members',
    },
    {
      role: 'admin',
      resource: 'invitation',
      actions: ['create', 'read', 'update', 'cancel'],
      description: 'Can manage invitations',
    },
    {
      role: 'admin',
      resource: 'team',
      actions: ['create', 'read', 'update', 'delete'],
      description: 'Full control over teams',
    },
    {
      role: 'admin',
      resource: 'ac',
      actions: ['create', 'read', 'update', 'delete'],
      description: 'Can manage access control',
    },
    {
      role: 'admin',
      resource: 'anime',
      actions: ['create', 'read', 'update', 'delete', 'publish'],
      description: 'Full control over anime content',
    },
    {
      role: 'admin',
      resource: 'episode',
      actions: ['create', 'read', 'update', 'delete', 'upload'],
      description: 'Full control over episodes',
    },
    {
      role: 'admin',
      resource: 'comment',
      actions: ['create', 'read', 'update', 'delete', 'moderate'],
      description: 'Full control over comments',
    },
    {
      role: 'admin',
      resource: 'user',
      actions: ['read', 'update', 'ban', 'unban'],
      description: 'Can manage users',
    },
    {
      role: 'admin',
      resource: 'subscription',
      actions: ['read'],
      description: 'Can view subscriptions',
    },
    {
      role: 'admin',
      resource: 'analytics',
      actions: ['read', 'export'],
      description: 'Full access to analytics',
    },
    {
      role: 'admin',
      resource: 'settings',
      actions: ['read'],
      description: 'Can view settings',
    },
  ],

  // Content Manager: Can manage anime and episodes
  contentManager: [
    {
      role: 'contentManager',
      resource: 'organization',
      actions: ['read'],
      description: 'Can view organization',
    },
    {
      role: 'contentManager',
      resource: 'member',
      actions: ['read'],
      description: 'Can view members',
    },
    {
      role: 'contentManager',
      resource: 'invitation',
      actions: ['read'],
      description: 'Can view invitations',
    },
    {
      role: 'contentManager',
      resource: 'team',
      actions: ['read'],
      description: 'Can view teams',
    },
    {
      role: 'contentManager',
      resource: 'anime',
      actions: ['create', 'read', 'update', 'publish'],
      description: 'Can manage anime content',
    },
    {
      role: 'contentManager',
      resource: 'episode',
      actions: ['create', 'read', 'update', 'upload'],
      description: 'Can manage episodes',
    },
    {
      role: 'contentManager',
      resource: 'comment',
      actions: ['read', 'moderate'],
      description: 'Can view and moderate comments',
    },
    {
      role: 'contentManager',
      resource: 'user',
      actions: ['read'],
      description: 'Can view users',
    },
    {
      role: 'contentManager',
      resource: 'analytics',
      actions: ['read'],
      description: 'Can view analytics',
    },
  ],

  // Moderator: Can moderate content and comments
  moderator: [
    {
      role: 'moderator',
      resource: 'organization',
      actions: ['read'],
      description: 'Can view organization',
    },
    {
      role: 'moderator',
      resource: 'member',
      actions: ['read'],
      description: 'Can view members',
    },
    {
      role: 'moderator',
      resource: 'anime',
      actions: ['read'],
      description: 'Can view anime',
    },
    {
      role: 'moderator',
      resource: 'episode',
      actions: ['read'],
      description: 'Can view episodes',
    },
    {
      role: 'moderator',
      resource: 'comment',
      actions: ['read', 'update', 'delete', 'moderate'],
      description: 'Full control over comments',
    },
    {
      role: 'moderator',
      resource: 'user',
      actions: ['read', 'ban', 'unban'],
      description: 'Can moderate users',
    },
    {
      role: 'moderator',
      resource: 'analytics',
      actions: ['read'],
      description: 'Can view analytics',
    },
  ],

  // Member: Basic access to view content
  member: [
    {
      role: 'member',
      resource: 'organization',
      actions: ['read'],
      description: 'Can view organization',
    },
    {
      role: 'member',
      resource: 'member',
      actions: ['read'],
      description: 'Can view members',
    },
    {
      role: 'member',
      resource: 'anime',
      actions: ['read'],
      description: 'Can view anime',
    },
    {
      role: 'member',
      resource: 'episode',
      actions: ['read'],
      description: 'Can view episodes',
    },
    {
      role: 'member',
      resource: 'comment',
      actions: ['create', 'read', 'update'],
      description: 'Can create and edit own comments',
    },
    {
      role: 'member',
      resource: 'user',
      actions: ['read'],
      description: 'Can view users',
    },
    {
      role: 'member',
      resource: 'subscription',
      actions: ['read'],
      description: 'Can view own subscription',
    },
  ],

  // Viewer: Read-only access
  viewer: [
    {
      role: 'viewer',
      resource: 'anime',
      actions: ['read'],
      description: 'Can view anime',
    },
    {
      role: 'viewer',
      resource: 'episode',
      actions: ['read'],
      description: 'Can view episodes',
    },
    {
      role: 'viewer',
      resource: 'comment',
      actions: ['read'],
      description: 'Can view comments',
    },
    {
      role: 'viewer',
      resource: 'user',
      actions: ['read'],
      description: 'Can view users',
    },
  ],
};

/**
 * Seed permissions for a specific organization
 * This function should be called when a new organization is created
 */
export async function seedOrganizationPermissions(organizationId: string) {
  console.log(`🌱 Seeding permissions for organization: ${organizationId}`);

  const permissions: any[] = [];

  // Flatten role permissions into individual permission records
  for (const [roleName, rolePermissions] of Object.entries(ROLE_PERMISSIONS)) {
    for (const perm of rolePermissions) {
      for (const action of perm.actions) {
        permissions.push({
          organizationId,
          role: roleName,
          resource: perm.resource,
          action,
          description: perm.description,
        });
      }
    }
  }

  // Batch insert all permissions
  const result = await prisma.organizationRolePermission.createMany({
    data: permissions,
    skipDuplicates: true, // Skip if already exists
  });

  console.log(`✅ Created ${result.count} permissions for organization ${organizationId}`);
  return result;
}

/**
 * Seed permissions for all existing organizations
 * This is useful for migration or initial setup
 */
export async function seedAllOrganizationsPermissions() {
  console.log('🌱 Starting permission seeding for all organizations...\n');

  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true, slug: true },
  });

  console.log(`Found ${organizations.length} organizations\n`);

  for (const org of organizations) {
    console.log(`Processing organization: ${org.name} (${org.slug})`);
    await seedOrganizationPermissions(org.id);
    console.log('');
  }

  console.log('✅ Permission seeding completed for all organizations!');
}

/**
 * Clear all permissions for testing or reset
 */
export async function clearAllPermissions() {
  console.log('🗑️  Clearing all permissions...');
  const result = await prisma.organizationRolePermission.deleteMany({});
  console.log(`✅ Deleted ${result.count} permissions`);
  return result;
}

/**
 * Get permissions for a specific role in an organization
 */
export async function getOrganizationRolePermissions(
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
      description: true,
    },
  });

  // Group by resource
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
 * Check if a role has permission for a specific action on a resource
 */
export async function hasPermission(
  organizationId: string,
  role: string,
  resource: string,
  action: string,
): Promise<boolean> {
  const permission = await prisma.organizationRolePermission.findFirst({
    where: {
      organizationId,
      role,
      resource,
      action,
    },
  });

  return permission !== null;
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedAllOrganizationsPermissions()
    .catch((error) => {
      console.error('❌ Error seeding permissions:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
