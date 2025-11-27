import {
  Resolver,
  Query,
  Mutation,
  Args,
  Context,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@anineplus/authorization';
import { OrganizationService } from './organization.service';
import { ErrorCodes, createErrorString } from '@anineplus/common';
import {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  InviteMemberInput,
  UpdateMemberRoleInput,
  CreateTeamInput,
  Organization,
  Member,
  Invitation,
  Team,
  FullOrganization,
  BasicOrgResponse,
} from './dto/better-auth-organization.dto';

/**
 * OrganizationResolver
 * 
 * Handles GraphQL queries/mutations for:
 * - Organizations: CRUD operations
 * - Members: Invite, remove, update roles
 * - Teams: Create and manage teams
 * 
 * Note: Permission-related queries are in PermissionResolver
 */
@Resolver()
export class OrganizationResolver {
  constructor(private readonly organizationService: OrganizationService) {}

  private extractSessionToken(context: any): string {
    const authHeader = context.req?.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error(createErrorString('User not authenticated', ErrorCodes.USER_NOT_AUTHENTICATED));
    }
    return authHeader.substring(7);
  }

  // ========== Organization Queries ==========

  @Query(() => [Organization])
  @UseGuards(AuthGuard)
  async listOrganizations(@Context() context: any): Promise<Organization[]> {
    const sessionToken = this.extractSessionToken(context);
    return this.organizationService.listOrganizations(sessionToken) as any;
  }

  @Query(() => FullOrganization)
  @UseGuards(AuthGuard)
  async getFullOrganization(
    @Args('organizationId', { nullable: true }) organizationId?: string,
    @Args('organizationSlug', { nullable: true }) organizationSlug?: string,
    @Context() context?: any,
  ): Promise<FullOrganization> {
    const sessionToken = this.extractSessionToken(context);
    return this.organizationService.getFullOrganization(
      sessionToken,
      organizationId,
      organizationSlug,
    ) as any;
  }

  // ========== Member Queries ==========

  @Query(() => [Member])
  @UseGuards(AuthGuard)
  async listMembers(
    @Args('organizationId', { nullable: true }) organizationId?: string,
    @Context() context?: any,
  ): Promise<Member[]> {
    const sessionToken = this.extractSessionToken(context);
    return this.organizationService.listMembers(sessionToken, organizationId) as any;
  }

  // ========== Team Queries ==========

  @Query(() => [Team])
  @UseGuards(AuthGuard)
  async listTeams(
    @Args('organizationId', { nullable: true }) organizationId?: string,
    @Context() context?: any,
  ): Promise<Team[]> {
    const sessionToken = this.extractSessionToken(context);
    return this.organizationService.listTeams(sessionToken, organizationId) as any;
  }

  @Mutation(() => Organization)
  @UseGuards(AuthGuard)
  async createOrganization(
    @Args('input') input: CreateOrganizationInput,
    @Context() context: any,
  ): Promise<Organization> {
    const sessionToken = this.extractSessionToken(context);
    // Generate slug from name if not provided
    const slug = input.slug || input.name.toLowerCase().replace(/\s+/g, '-');
    return this.organizationService.createOrganization(
      sessionToken,
      input.name,
      slug,
      input.logo,
      input.metadata,
    ) as any;
  }

  @Mutation(() => Organization)
  @UseGuards(AuthGuard)
  async updateOrganization(
    @Args('organizationId') organizationId: string,
    @Args('input') input: UpdateOrganizationInput,
    @Context() context: any,
  ): Promise<Organization> {
    const sessionToken = this.extractSessionToken(context);
    return this.organizationService.updateOrganization(
      sessionToken,
      organizationId,
      input,
    ) as any;
  }

  @Mutation(() => BasicOrgResponse)
  @UseGuards(AuthGuard)
  async deleteOrganization(
    @Args('organizationId') organizationId: string,
    @Context() context: any,
  ): Promise<BasicOrgResponse> {
    const sessionToken = this.extractSessionToken(context);
    await this.organizationService.deleteOrganization(sessionToken, organizationId);
    return {
      success: true,
      message: 'Organization deleted successfully',
    };
  }

  @Mutation(() => Invitation)
  @UseGuards(AuthGuard)
  async inviteMember(
    @Args('input') input: InviteMemberInput,
    @Context() context: any,
  ): Promise<Invitation> {
    const sessionToken = this.extractSessionToken(context);
    return this.organizationService.inviteMember(
      sessionToken,
      input.email,
      input.role,
      input.organizationId,
      input.teamId,
    ) as any;
  }

  @Mutation(() => BasicOrgResponse)
  @UseGuards(AuthGuard)
  async removeMember(
    @Args('memberIdOrEmail') memberIdOrEmail: string,
    @Args('organizationId', { nullable: true }) organizationId?: string,
    @Context() context?: any,
  ): Promise<BasicOrgResponse> {
    const sessionToken = this.extractSessionToken(context);
    await this.organizationService.removeMember(
      sessionToken,
      memberIdOrEmail,
      organizationId,
    );
    return {
      success: true,
      message: 'Member removed successfully',
    };
  }

  @Mutation(() => Member)
  @UseGuards(AuthGuard)
  async updateMemberRole(
    @Args('input') input: UpdateMemberRoleInput,
    @Context() context: any,
  ): Promise<Member> {
    const sessionToken = this.extractSessionToken(context);
    return this.organizationService.updateMemberRole(
      sessionToken,
      input.memberId,
      input.role,
      input.organizationId,
    ) as any;
  }

  // ========== Team Mutations ==========

  @Mutation(() => Team)
  @UseGuards(AuthGuard)
  async createTeam(
    @Args('input') input: CreateTeamInput,
    @Context() context: any,
  ): Promise<Team> {
    const sessionToken = this.extractSessionToken(context);
    return this.organizationService.createTeam(
      sessionToken,
      input.name,
      input.organizationId,
    ) as any;
  }
}
