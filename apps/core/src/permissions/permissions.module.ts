import { Module, Global } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionResolver } from './permissions.resolver';
import { AuthPermissionGuard, PermissionGuard } from '@anineplus/authorization';

/**
 * PermissionsModule
 * 
 * Handles RBAC (Role-Based Access Control) and permission management:
 * - Permission checking (hasPermission)
 * - Role CRUD operations (create, update, delete, list)
 * - Integration with Better Auth organization plugin
 * 
 * Renamed PermissionService to PermissionsService to avoid confusion.
 * This is the ONLY permission module in the app now.
 * 
 * This module is @Global() to make permission guards available everywhere
 */
@Global()
@Module({
  providers: [
    // Better Auth RBAC permissions
    PermissionsService,
    PermissionResolver,
    
    // Provide PERMISSION_SERVICE token for guards
    {
      provide: 'PERMISSION_SERVICE',
      useExisting: PermissionsService,
    },
    
    // Provide guards that depend on PERMISSION_SERVICE
    PermissionGuard,
    AuthPermissionGuard,
  ],
  exports: [
    PermissionsService,
    'PERMISSION_SERVICE',
    // Export permission-related guards
    PermissionGuard,
    AuthPermissionGuard,
  ],
})
export class PermissionsModule {}
