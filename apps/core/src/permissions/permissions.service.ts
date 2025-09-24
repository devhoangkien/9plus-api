import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermissionsService {
      constructor(
        private prisma: PrismaService,
      ) {}

    async getPermissionsByRoleKey(roleKey: string) {
        return this.prisma.permission.findMany({
            where: {
                roles: {
                    some: {
                        key: roleKey,
                    },
                },
            },
        });
    }
}
