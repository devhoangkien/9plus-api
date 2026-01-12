import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { timeout, retry } from 'rxjs/operators';

/**
 * Role gRPC Service Interface
 */
interface RoleServiceClient {
    GetRolesByKeys(data: { keys: string[] }): Observable<{ roles: Role[] }>;
    GetRoleById(data: { id: string }): Observable<Role>;
    GetUserRoles(data: { user_id: string }): Observable<{ roles: Role[] }>;
}

/**
 * Role Interface
 */
export interface Role {
    id: string;
    key: string;
    name: string;
    description: string;
    permissions: Permission[];
    status: string;
    created_at: string;
    updated_at: string;
}

/**
 * Permission Interface
 */
export interface Permission {
    id: string;
    key: string;
    name: string;
    resource: string;
    action: string;
    status: string;
    description: string;
}

/**
 * gRPC Client for Role Service
 * Provides type-safe access to Role service methods
 */
@Injectable()
export class RoleGrpcClient implements OnModuleInit {
    private roleService: RoleServiceClient;
    private readonly TIMEOUT_MS = 5000;
    private readonly RETRY_COUNT = 2;

    constructor(
        @Inject('CORE_GRPC_PACKAGE') private readonly client: ClientGrpc,
    ) { }

    onModuleInit() {
        this.roleService = this.client.getService<RoleServiceClient>('RoleService');
    }

    /**
     * Get roles by their keys
     * @param keys Array of role keys
     * @returns Array of roles with permissions
     */
    async getRolesByKeys(keys: string[]): Promise<Role[]> {
        try {
            const response = await firstValueFrom(
                this.roleService.GetRolesByKeys({ keys }).pipe(
                    timeout(this.TIMEOUT_MS),
                    retry(this.RETRY_COUNT),
                ),
            );
            return response.roles || [];
        } catch (error) {
            console.error('[RoleGrpcClient] GetRolesByKeys error:', error);
            throw error;
        }
    }

    /**
     * Get role by ID
     * @param id Role ID
     * @returns Role with permissions
     */
    async getRoleById(id: string): Promise<Role | null> {
        try {
            const role = await firstValueFrom(
                this.roleService.GetRoleById({ id }).pipe(
                    timeout(this.TIMEOUT_MS),
                    retry(this.RETRY_COUNT),
                ),
            );
            return role;
        } catch (error) {
            console.error('[RoleGrpcClient] GetRoleById error:', error);
            throw error;
        }
    }

    /**
     * Get all roles for a user
     * @param userId User ID
     * @returns Array of roles with permissions
     */
    async getUserRoles(userId: string): Promise<Role[]> {
        try {
            const response = await firstValueFrom(
                this.roleService.GetUserRoles({ user_id: userId }).pipe(
                    timeout(this.TIMEOUT_MS),
                    retry(this.RETRY_COUNT),
                ),
            );
            return response.roles || [];
        } catch (error) {
            console.error('[RoleGrpcClient] GetUserRoles error:', error);
            throw error;
        }
    }

    /**
     * Extract unique permissions from roles
     * @param roles Array of roles
     * @returns Array of unique permissions
     */
    extractUniquePermissions(roles: Role[]): Permission[] {
        const permissionMap = new Map<string, Permission>();

        for (const role of roles) {
            for (const permission of role.permissions || []) {
                if (!permissionMap.has(permission.id)) {
                    permissionMap.set(permission.id, permission);
                }
            }
        }

        return Array.from(permissionMap.values());
    }
}
