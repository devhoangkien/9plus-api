import { PermissionStatusEnum, PrismaClient, RoleStatusEnum, UserStatusEnum } from '@prisma/client';
import PermissionsData from './data/permissions.json';
import RolesData from './data/roles.json';
import UsersData from './data/users.json';
import { seedPluginsManagement } from './seed-plugin-management';

// Force local database URL to avoid conflicts with parent .env
process.env.DATABASE_URL = "postgresql://bune-cms:bune-cms@127.0.0.1:5432/nineplusedu?schema=public";

const prisma = new PrismaClient();

// Hash password function for seed
async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, {
    algorithm: 'bcrypt',
    cost: 10,
  });
}

async function main() {

  // Seed Permissions
  for (const permission of PermissionsData) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: {},
      create: {
        name: permission.name,
        key: permission.key,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        status: permission.status as PermissionStatusEnum,   
      },
    });
  }

  // Seed Roles
  for (const role of RolesData) {
    const createdRole = await prisma.role.upsert({
      where: { key: role.key },
      update: {},
      create: {
        name: role.name,
        key: role.key,
        description: role.description,
        status: role.status as RoleStatusEnum,
      },
    });

    // Assign Permissions to Role
    if (role.permissions && role.permissions.length > 0) {
      const permissionsToConnect = await prisma.permission.findMany({
        where: { key: { in: role.permissions } },
      });

      await prisma.role.update({
        where: { id: createdRole.id },
        data: {
          permissions: {
            connect: permissionsToConnect.map((permission) => ({
              id: permission.id,
            })),
          },
        },
      });
    }
  }

  // Seed Users
  for (const user of UsersData) {
    const rolesToConnect = await prisma.role.findMany({
      where: { key: { in: user.roles } },
    });

    const nameParts = user.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        firstName,
        lastName,
        fullName: user.name,
        email: user.email,
        password: await hashPassword(process.env.DEFAULT_USER_PASSWORD || 'defaultPassword'),  
        status: user.status as UserStatusEnum,
        roles: {
          connect: rolesToConnect.map((role) => ({ id: role.id })),
        },
      },
    });
  }

  console.log('Seed data successfully!');

  // Seed service registry
  try {
    await seedPluginsManagement();
  } catch (error) {
    console.warn('Service registry seeding failed (this may be expected if dependencies are not available):', error.message);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
