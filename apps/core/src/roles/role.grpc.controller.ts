import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RolesService } from './roles.service';

/**
 * gRPC Controller for Role Service
 * Provides high-performance internal service communication
 */
@Controller()
export class RoleGrpcController {
    constructor(private readonly rolesService: RolesService) { }

    /**
     * Get roles by their keys
     * Used by Gateway for authentication flow
     */
    @GrpcMethod('RoleService', 'GetRolesByKeys')
    async getRolesByKeys(data: { keys: string[] }): Promise<{ roles: any[] }> {
        const keysString = data.keys.join(',');
        const roles = await this.rolesService.findByKeys(keysString);

        return {
            roles: roles.map(role => this.transformRole(role)),
        };
    }

    /**
     * Get role by ID
     */
    @GrpcMethod('RoleService', 'GetRoleById')
    async getRoleById(data: { id: string }): Promise<any> {
        const role = await this.rolesService.findOne(data.id);
        return this.transformRole(role);
    }

    /**
     * Get all roles for a user
     */
    @GrpcMethod('RoleService', 'GetUserRoles')
    async getUserRoles(data: { user_id: string }): Promise<{ roles: any[] }> {
        const roles = await this.rolesService.findByUserId(data.user_id);

        return {
            roles: roles.map(role => this.transformRole(role)),
        };
    }

    /**
     * Transform database role to gRPC response format
     */
    private transformRole(role: any): any {
        if (!role) return null;

        return {
            id: role.id,
            key: role.key,
            name: role.name,
            description: role.description || '',
            status: role.status || 'ACTIVE',
            created_at: role.createdAt?.toISOString() || '',
            updated_at: role.updatedAt?.toISOString() || '',
            permissions: (role.permissions || []).map((perm: any) => ({
                id: perm.id,
                key: perm.key,
                name: perm.name,
                resource: perm.resource || '',
                action: perm.action || '',
                status: perm.status || 'ACTIVE',
                description: perm.description || '',
            })),
        };
    }
}
