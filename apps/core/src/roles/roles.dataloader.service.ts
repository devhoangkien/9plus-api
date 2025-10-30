import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

/**
 * RolesDataLoaderService
 * 
 * Provides DataLoader instances for batching Role queries.
 */
@Injectable()
export class RolesDataLoaderService {
  constructor(private prisma: PrismaService) {}

  /**
   * Batch load roles by IDs
   */
  private async batchLoadRolesByIds(ids: readonly string[]): Promise<(Role | null)[]> {
    const roles = await this.prisma.role.findMany({
      where: {
        id: { in: [...ids] },
      },
      include: {
        permissions: true,
      },
    });

    const roleMap = new Map(roles.map(role => [role.id, role]));
    return ids.map(id => roleMap.get(id) || null);
  }

  /**
   * Batch load roles by keys
   */
  private async batchLoadRolesByKeys(keys: readonly string[]): Promise<(Role | null)[]> {
    const roles = await this.prisma.role.findMany({
      where: {
        key: { in: [...keys] },
      },
      include: {
        permissions: true,
      },
    });

    const roleMap = new Map(roles.map(role => [role.key, role]));
    return keys.map(key => roleMap.get(key) || null);
  }

  /**
   * Create a DataLoader for loading roles by ID
   */
  createRoleByIdLoader(): DataLoader<string, Role | null> {
    return new DataLoader<string, Role | null>(
      (ids) => this.batchLoadRolesByIds(ids),
      { cache: true }
    );
  }

  /**
   * Create a DataLoader for loading roles by key
   */
  createRoleByKeyLoader(): DataLoader<string, Role | null> {
    return new DataLoader<string, Role | null>(
      (keys) => this.batchLoadRolesByKeys(keys),
      { cache: true }
    );
  }
}
