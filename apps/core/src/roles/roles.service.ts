import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async getRoles() {
    return this.prisma.role.findMany();
  }

  async getRoleById(id: string) {
    return this.prisma.role.findUnique({
      where: { id },
    });
  }

  async getRolByKey(key: string) {
    return this.prisma.role.findUnique({
      where: { key },
      include: { permissions: true },
    });
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
