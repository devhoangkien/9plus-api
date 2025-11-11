import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RolesDataLoaderService } from './roles.dataloader.service';
import DataLoader from 'dataloader';

@Injectable()
export class RolesService {
  private roleByIdLoader: DataLoader<string, Role | null>;
  private roleByKeyLoader: DataLoader<string, Role | null>;

  constructor(
    private prisma: PrismaService,
    private readonly rolesDataLoaderService: RolesDataLoaderService,
  ) {
    // Initialize DataLoaders
    this.roleByIdLoader = this.rolesDataLoaderService.createRoleByIdLoader();
    this.roleByKeyLoader = this.rolesDataLoaderService.createRoleByKeyLoader();
  }

  async getRoles() {
    return this.prisma.role.findMany();
  }

  async getRoleById(id: string) {
    return this.roleByIdLoader.load(id);
  }

  async getRolByKey(key: string) {
    return this.roleByKeyLoader.load(key);
  }

  async getRolesByKeys(keys: string): Promise<Role[]> {
    const keysArray = keys.split(',').map((key) => key.trim());
    return this.prisma.role.findMany({
      where: {
        key: { in: keysArray },
      },
      include: { permissions: true },
    });
  }
}
