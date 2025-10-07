import { Module, Global } from '@nestjs/common';
import { AuthGuard, PermissionGuard, AuthPermissionGuard } from '@anineplus/authorization';
import { BetterAuthService } from './better-auth.service';
import { BetterAuthResolver } from './better-auth.resolver';
import { OrganizationService } from './organization.service';
import { OrganizationResolver } from './organization.resolver';

@Global() // Make this module global so services are available everywhere
@Module({
  controllers: [],
  providers: [
    BetterAuthService,
    BetterAuthResolver,
    OrganizationService,
    OrganizationResolver,
    // Provide service tokens for guards
    {
      provide: 'AUTH_SERVICE',
      useExisting: BetterAuthService,
    },
    {
      provide: 'PERMISSION_SERVICE',
      useExisting: OrganizationService,
    },
    // Provide guards (no need for Reflector anymore)
    AuthGuard,
    PermissionGuard,
    AuthPermissionGuard,
  ],
  exports: [
    BetterAuthService,
    OrganizationService,
    'AUTH_SERVICE',
    'PERMISSION_SERVICE',
    // Export guards for use in other modules
    AuthGuard,
    PermissionGuard,
    AuthPermissionGuard,
  ],
})
export class BetterAuthModule {}
