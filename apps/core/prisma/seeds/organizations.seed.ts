import { PrismaClient } from '../@generated/client';

const prisma = new PrismaClient();

/**
 * Seed file for Organizations and Organization Permissions
 * This creates sample organizations with complete permission structures
 */

interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  metadata: string | null;
}

interface PermissionTemplate {
  role: string;
  resource: string;
  action: string;
  description: string;
}

// Sample organizations to create
const SAMPLE_ORGANIZATIONS: OrganizationData[] = [
  {
    id: 'org_anineplus_main',
    name: 'AninePlus Main',
    slug: 'anineplus-main',
    logo: 'https://example.com/logos/anineplus-main.png',
    metadata: JSON.stringify({
      industry: 'Entertainment',
      size: 'Large',
      subscription: 'Enterprise',
      features: ['anime', 'episodes', 'comments', 'analytics'],
    }),
  },
  {
    id: 'org_demo_studio',
    name: 'Demo Animation Studio',
    slug: 'demo-studio',
    logo: 'https://example.com/logos/demo-studio.png',
    metadata: JSON.stringify({
      industry: 'Animation',
      size: 'Medium',
      subscription: 'Professional',
      features: ['anime', 'episodes'],
    }),
  },
  {
    id: 'org_test_community',
    name: 'Test Community',
    slug: 'test-community',
    logo: null,
    metadata: JSON.stringify({
      industry: 'Community',
      size: 'Small',
      subscription: 'Basic',
      features: ['comments'],
    }),
  },
];

// Complete permission definitions for each role
// These match the structure defined in permissions.seed.ts
const ORGANIZATION_ROLE_PERMISSIONS: Record<string, PermissionTemplate[]> = {
  owner: [
    { role: 'owner', resource: 'organization', action: 'create', description: 'Create organization' },
    { role: 'owner', resource: 'organization', action: 'read', description: 'View organization details' },
    { role: 'owner', resource: 'organization', action: 'update', description: 'Update organization settings' },
    { role: 'owner', resource: 'organization', action: 'delete', description: 'Delete organization' },
    { role: 'owner', resource: 'member', action: 'create', description: 'Add new members' },
    { role: 'owner', resource: 'member', action: 'read', description: 'View all members' },
    { role: 'owner', resource: 'member', action: 'update', description: 'Update member roles' },
    { role: 'owner', resource: 'member', action: 'delete', description: 'Remove members' },
    { role: 'owner', resource: 'invitation', action: 'create', description: 'Create invitations' },
    { role: 'owner', resource: 'invitation', action: 'read', description: 'View all invitations' },
    { role: 'owner', resource: 'invitation', action: 'update', description: 'Update invitations' },
    { role: 'owner', resource: 'invitation', action: 'delete', description: 'Delete invitations' },
    { role: 'owner', resource: 'invitation', action: 'cancel', description: 'Cancel pending invitations' },
    { role: 'owner', resource: 'team', action: 'create', description: 'Create teams' },
    { role: 'owner', resource: 'team', action: 'read', description: 'View all teams' },
    { role: 'owner', resource: 'team', action: 'update', description: 'Update teams' },
    { role: 'owner', resource: 'team', action: 'delete', description: 'Delete teams' },
    { role: 'owner', resource: 'ac', action: 'create', description: 'Create access control rules' },
    { role: 'owner', resource: 'ac', action: 'read', description: 'View access control' },
    { role: 'owner', resource: 'ac', action: 'update', description: 'Update access control' },
    { role: 'owner', resource: 'ac', action: 'delete', description: 'Delete access control rules' },
    { role: 'owner', resource: 'anime', action: 'create', description: 'Create anime content' },
    { role: 'owner', resource: 'anime', action: 'read', description: 'View all anime' },
    { role: 'owner', resource: 'anime', action: 'update', description: 'Update anime content' },
    { role: 'owner', resource: 'anime', action: 'delete', description: 'Delete anime' },
    { role: 'owner', resource: 'anime', action: 'publish', description: 'Publish anime content' },
    { role: 'owner', resource: 'episode', action: 'create', description: 'Create episodes' },
    { role: 'owner', resource: 'episode', action: 'read', description: 'View all episodes' },
    { role: 'owner', resource: 'episode', action: 'update', description: 'Update episodes' },
    { role: 'owner', resource: 'episode', action: 'delete', description: 'Delete episodes' },
    { role: 'owner', resource: 'episode', action: 'upload', description: 'Upload episode videos' },
    { role: 'owner', resource: 'comment', action: 'create', description: 'Create comments' },
    { role: 'owner', resource: 'comment', action: 'read', description: 'View all comments' },
    { role: 'owner', resource: 'comment', action: 'update', description: 'Update comments' },
    { role: 'owner', resource: 'comment', action: 'delete', description: 'Delete comments' },
    { role: 'owner', resource: 'comment', action: 'moderate', description: 'Moderate comments' },
    { role: 'owner', resource: 'user', action: 'read', description: 'View users' },
    { role: 'owner', resource: 'user', action: 'update', description: 'Update users' },
    { role: 'owner', resource: 'user', action: 'ban', description: 'Ban users' },
    { role: 'owner', resource: 'user', action: 'unban', description: 'Unban users' },
    { role: 'owner', resource: 'subscription', action: 'create', description: 'Create subscriptions' },
    { role: 'owner', resource: 'subscription', action: 'read', description: 'View subscriptions' },
    { role: 'owner', resource: 'subscription', action: 'update', description: 'Update subscriptions' },
    { role: 'owner', resource: 'subscription', action: 'cancel', description: 'Cancel subscriptions' },
    { role: 'owner', resource: 'analytics', action: 'read', description: 'View analytics' },
    { role: 'owner', resource: 'analytics', action: 'export', description: 'Export analytics data' },
    { role: 'owner', resource: 'settings', action: 'read', description: 'View settings' },
    { role: 'owner', resource: 'settings', action: 'update', description: 'Update settings' },
  ],
  admin: [
    { role: 'admin', resource: 'organization', action: 'read', description: 'View organization details' },
    { role: 'admin', resource: 'organization', action: 'update', description: 'Update organization settings' },
    { role: 'admin', resource: 'member', action: 'create', description: 'Add new members' },
    { role: 'admin', resource: 'member', action: 'read', description: 'View all members' },
    { role: 'admin', resource: 'member', action: 'update', description: 'Update member roles' },
    { role: 'admin', resource: 'member', action: 'delete', description: 'Remove members' },
    { role: 'admin', resource: 'invitation', action: 'create', description: 'Create invitations' },
    { role: 'admin', resource: 'invitation', action: 'read', description: 'View all invitations' },
    { role: 'admin', resource: 'invitation', action: 'delete', description: 'Delete invitations' },
    { role: 'admin', resource: 'invitation', action: 'cancel', description: 'Cancel pending invitations' },
    { role: 'admin', resource: 'team', action: 'create', description: 'Create teams' },
    { role: 'admin', resource: 'team', action: 'read', description: 'View all teams' },
    { role: 'admin', resource: 'team', action: 'update', description: 'Update teams' },
    { role: 'admin', resource: 'team', action: 'delete', description: 'Delete teams' },
    { role: 'admin', resource: 'ac', action: 'read', description: 'View access control' },
    { role: 'admin', resource: 'anime', action: 'create', description: 'Create anime content' },
    { role: 'admin', resource: 'anime', action: 'read', description: 'View all anime' },
    { role: 'admin', resource: 'anime', action: 'update', description: 'Update anime content' },
    { role: 'admin', resource: 'anime', action: 'delete', description: 'Delete anime' },
    { role: 'admin', resource: 'anime', action: 'publish', description: 'Publish anime content' },
    { role: 'admin', resource: 'episode', action: 'create', description: 'Create episodes' },
    { role: 'admin', resource: 'episode', action: 'read', description: 'View all episodes' },
    { role: 'admin', resource: 'episode', action: 'update', description: 'Update episodes' },
    { role: 'admin', resource: 'episode', action: 'delete', description: 'Delete episodes' },
    { role: 'admin', resource: 'episode', action: 'upload', description: 'Upload episode videos' },
    { role: 'admin', resource: 'comment', action: 'read', description: 'View all comments' },
    { role: 'admin', resource: 'comment', action: 'update', description: 'Update comments' },
    { role: 'admin', resource: 'comment', action: 'delete', description: 'Delete comments' },
    { role: 'admin', resource: 'comment', action: 'moderate', description: 'Moderate comments' },
    { role: 'admin', resource: 'user', action: 'read', description: 'View users' },
    { role: 'admin', resource: 'user', action: 'update', description: 'Update users' },
    { role: 'admin', resource: 'user', action: 'ban', description: 'Ban users' },
    { role: 'admin', resource: 'user', action: 'unban', description: 'Unban users' },
    { role: 'admin', resource: 'subscription', action: 'read', description: 'View subscriptions' },
    { role: 'admin', resource: 'analytics', action: 'read', description: 'View analytics' },
    { role: 'admin', resource: 'analytics', action: 'export', description: 'Export analytics data' },
    { role: 'admin', resource: 'settings', action: 'read', description: 'View settings' },
    { role: 'admin', resource: 'settings', action: 'update', description: 'Update settings' },
  ],
  contentManager: [
    { role: 'contentManager', resource: 'organization', action: 'read', description: 'View organization details' },
    { role: 'contentManager', resource: 'member', action: 'read', description: 'View all members' },
    { role: 'contentManager', resource: 'team', action: 'read', description: 'View all teams' },
    { role: 'contentManager', resource: 'anime', action: 'create', description: 'Create anime content' },
    { role: 'contentManager', resource: 'anime', action: 'read', description: 'View all anime' },
    { role: 'contentManager', resource: 'anime', action: 'update', description: 'Update anime content' },
    { role: 'contentManager', resource: 'anime', action: 'delete', description: 'Delete anime' },
    { role: 'contentManager', resource: 'anime', action: 'publish', description: 'Publish anime content' },
    { role: 'contentManager', resource: 'episode', action: 'create', description: 'Create episodes' },
    { role: 'contentManager', resource: 'episode', action: 'read', description: 'View all episodes' },
    { role: 'contentManager', resource: 'episode', action: 'update', description: 'Update episodes' },
    { role: 'contentManager', resource: 'episode', action: 'delete', description: 'Delete episodes' },
    { role: 'contentManager', resource: 'episode', action: 'upload', description: 'Upload episode videos' },
    { role: 'contentManager', resource: 'comment', action: 'read', description: 'View all comments' },
    { role: 'contentManager', resource: 'comment', action: 'moderate', description: 'Moderate comments' },
    { role: 'contentManager', resource: 'analytics', action: 'read', description: 'View analytics' },
  ],
  moderator: [
    { role: 'moderator', resource: 'organization', action: 'read', description: 'View organization details' },
    { role: 'moderator', resource: 'member', action: 'read', description: 'View all members' },
    { role: 'moderator', resource: 'anime', action: 'read', description: 'View all anime' },
    { role: 'moderator', resource: 'episode', action: 'read', description: 'View all episodes' },
    { role: 'moderator', resource: 'comment', action: 'read', description: 'View all comments' },
    { role: 'moderator', resource: 'comment', action: 'update', description: 'Update comments' },
    { role: 'moderator', resource: 'comment', action: 'delete', description: 'Delete comments' },
    { role: 'moderator', resource: 'comment', action: 'moderate', description: 'Moderate comments' },
    { role: 'moderator', resource: 'user', action: 'read', description: 'View users' },
    { role: 'moderator', resource: 'user', action: 'ban', description: 'Ban users' },
    { role: 'moderator', resource: 'user', action: 'unban', description: 'Unban users' },
  ],
  member: [
    { role: 'member', resource: 'organization', action: 'read', description: 'View organization details' },
    { role: 'member', resource: 'member', action: 'read', description: 'View all members' },
    { role: 'member', resource: 'team', action: 'read', description: 'View teams' },
    { role: 'member', resource: 'anime', action: 'read', description: 'View all anime' },
    { role: 'member', resource: 'episode', action: 'read', description: 'View all episodes' },
    { role: 'member', resource: 'comment', action: 'create', description: 'Create comments' },
    { role: 'member', resource: 'comment', action: 'read', description: 'View comments' },
    { role: 'member', resource: 'comment', action: 'update', description: 'Update own comments' },
    { role: 'member', resource: 'comment', action: 'delete', description: 'Delete own comments' },
  ],
  viewer: [
    { role: 'viewer', resource: 'organization', action: 'read', description: 'View organization details' },
    { role: 'viewer', resource: 'member', action: 'read', description: 'View all members' },
    { role: 'viewer', resource: 'anime', action: 'read', description: 'View all anime' },
    { role: 'viewer', resource: 'episode', action: 'read', description: 'View all episodes' },
    { role: 'viewer', resource: 'comment', action: 'read', description: 'View comments' },
  ],
};

/**
 * Seed a single organization with its permissions
 */
async function seedOrganization(orgData: OrganizationData): Promise<void> {
  console.log(`  📦 Seeding organization: ${orgData.name} (${orgData.slug})`);

  // Create or update organization
  const organization = await prisma.organization.upsert({
    where: { id: orgData.id },
    update: {
      name: orgData.name,
      slug: orgData.slug,
      logo: orgData.logo,
      metadata: orgData.metadata,
    },
    create: {
      id: orgData.id,
      name: orgData.name,
      slug: orgData.slug,
      logo: orgData.logo,
      metadata: orgData.metadata,
      createdAt: new Date(),
    },
  });

  console.log(`     ✓ Organization created/updated: ${organization.id}`);

  // Seed permissions for all roles in this organization
  let permissionCount = 0;
  for (const [roleName, permissions] of Object.entries(ORGANIZATION_ROLE_PERMISSIONS)) {
    console.log(`     → Seeding ${roleName} permissions...`);

    for (const perm of permissions) {
      await prisma.organizationRolePermission.upsert({
        where: {
          organizationId_role_resource_action: {
            organizationId: organization.id,
            role: perm.role,
            resource: perm.resource,
            action: perm.action,
          },
        },
        update: {
          description: perm.description,
        },
        create: {
          organizationId: organization.id,
          role: perm.role,
          resource: perm.resource,
          action: perm.action,
          description: perm.description,
          createdAt: new Date(),
        },
      });
      permissionCount++;
    }
  }

  console.log(`     ✓ ${permissionCount} permissions seeded for all roles\n`);
}

/**
 * Main seed function for organizations
 */
export async function seedOrganizations(): Promise<void> {
  console.log('🏢 Seeding Organizations and Permissions\n');
  console.log(`   Creating ${SAMPLE_ORGANIZATIONS.length} sample organizations with role permissions...\n`);

  try {
    // Seed each organization
    for (const orgData of SAMPLE_ORGANIZATIONS) {
      await seedOrganization(orgData);
    }

    // Get summary statistics
    const orgCount = await prisma.organization.count();
    const permCount = await prisma.organizationRolePermission.count();

    console.log('─'.repeat(60));
    console.log('📊 Organization Seeding Summary:');
    console.log(`   Total Organizations: ${orgCount}`);
    console.log(`   Total Organization Permissions: ${permCount}`);
    console.log(`   Roles per Organization: ${Object.keys(ORGANIZATION_ROLE_PERMISSIONS).length}`);
    console.log('   ✅ Organizations seeded successfully!\n');
  } catch (error) {
    console.error('❌ Error seeding organizations:', error);
    throw error;
  }
}

/**
 * Seed a single organization when created
 * This function can be called from organization creation hooks
 */
export async function seedSingleOrganization(
  organizationId: string,
  organizationName: string,
  organizationSlug: string,
): Promise<void> {
  console.log(`🔧 Auto-seeding permissions for new organization: ${organizationName}`);

  try {
    let permissionCount = 0;
    for (const [roleName, permissions] of Object.entries(ORGANIZATION_ROLE_PERMISSIONS)) {
      for (const perm of permissions) {
        await prisma.organizationRolePermission.create({
          data: {
            organizationId: organizationId,
            role: perm.role,
            resource: perm.resource,
            action: perm.action,
            description: perm.description,
            createdAt: new Date(),
          },
        });
        permissionCount++;
      }
    }

    console.log(`✓ Auto-seeded ${permissionCount} permissions for organization: ${organizationId}`);
  } catch (error) {
    console.error(`❌ Error auto-seeding organization ${organizationId}:`, error);
    // Don't throw - allow organization creation to succeed even if permissions fail
  }
}

// Allow running this file directly
if (require.main === module) {
  seedOrganizations()
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
