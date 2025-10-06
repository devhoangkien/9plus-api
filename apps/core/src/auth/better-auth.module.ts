import { Module } from '@nestjs/common';
import { AuthGuard, PermissionGuard, AuthPermissionGuard } from '@anineplus/authorization';
import { BetterAuthService } from './better-auth.service';
import { BetterAuthResolver } from './better-auth.resolver';
import { OrganizationService } from './organization.service';
import { OrganizationResolver } from './organization.resolver';

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
      useClass: BetterAuthService,
    },
    {
      provide: 'PERMISSION_SERVICE',
      useClass: OrganizationService,
    },
    // Provide guards
    AuthGuard,
    PermissionGuard,
    AuthPermissionGuard,
  ],
  exports: [
    BetterAuthService,
    OrganizationService,
    AuthGuard,
    PermissionGuard,
    AuthPermissionGuard,
  ],
})
export class BetterAuthModule {}
