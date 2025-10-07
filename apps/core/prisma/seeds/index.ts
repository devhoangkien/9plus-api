/**
 * Main seed file for database
 * Run with: bun run prisma/seeds/index.ts
 */

import { seedRolesAndPermissions } from './roles-permissions.seed';
import { seedOrganizations } from './organizations.seed';

async function main() {
  console.log('🌱 Starting database seeding...\n');
  console.log('═'.repeat(60));
  console.log('ANINEPLUS API - DATABASE SEEDING');
  console.log('═'.repeat(60));
  console.log('');

  // 1. Seed global roles and permissions (Admin plugin)
  console.log('📍 STEP 1: Seeding Global Roles & Permissions (Admin Plugin)\n');
  await seedRolesAndPermissions();

  console.log('─'.repeat(60));
  console.log('');

  // 2. Seed organizations with their permissions (Organization plugin)
  console.log('📍 STEP 2: Seeding Organizations & Organization Permissions\n');
  await seedOrganizations();

  console.log('═'.repeat(60));
  console.log('\n✅ Database seeding completed successfully!');
  console.log('');
  console.log('Summary:');
  console.log('  ✓ Global roles and permissions seeded');
  console.log('  ✓ Role-Permission relationships established');
  console.log('  ✓ Sample organizations created');
  console.log('  ✓ Organization role permissions seeded');
  console.log('');
}

main()
  .catch((error) => {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
