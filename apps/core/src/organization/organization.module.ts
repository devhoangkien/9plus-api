import { Module, Global } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationResolver } from './organization.resolver';

/**
 * OrganizationModule
 * 
 * Handles multi-tenancy and organization management:
 * - Organizations: CRUD operations
 * - Members: Invitations, role assignments, removal
 * - Teams: Team management within organizations
 * 
 * Separated from PermissionModule following Single Responsibility Principle
 * 
 * Dependencies:
 * - BetterAuthService (from BetterAuthModule - @Global) for session validation
 * 
 * This module is @Global() to make organization service available everywhere
 */
@Global()
@Module({
  providers: [
    OrganizationService,
    OrganizationResolver,
  ],
  exports: [
    OrganizationService,
  ],
})
export class OrganizationModule {}
