import { Module, Global } from '@nestjs/common';
import { AuthGuard } from '@anineplus/authorization';
import { BetterAuthService } from './better-auth.service';
import { BetterAuthResolver } from './better-auth.resolver';

/**
 * BetterAuthModule
 * 
 * Core authentication module using Better Auth:
 * - User sign up, sign in, sign out
 * - Email verification
 * - Password reset
 * - Session management
 * - OAuth providers (Google, GitHub, etc.)
 * 
 * This module is @Global() to make AuthGuard and BetterAuthService available everywhere
 * 
 * Note: PermissionGuard and AuthPermissionGuard are in OrganizationModule
 * because they depend on PERMISSION_SERVICE
 */
@Global()
@Module({
  controllers: [],
  providers: [
    BetterAuthService,
    BetterAuthResolver,
    // Provide service token for AuthGuard
    {
      provide: 'AUTH_SERVICE',
      useExisting: BetterAuthService,
    },
    // Only provide AuthGuard (no permission dependencies)
    AuthGuard,
  ],
  exports: [
    BetterAuthService,
    'AUTH_SERVICE',
    // Only export AuthGuard
    AuthGuard,
  ],
})
export class BetterAuthModule {}
