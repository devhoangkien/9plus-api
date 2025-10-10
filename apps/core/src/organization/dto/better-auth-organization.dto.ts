import { Field, InputType, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

/**
 * Better Auth Organization DTOs
 * 
 * These types are specifically for Better Auth's organization plugin API operations.
 * They are separate from Prisma-generated types to avoid conflicts.
 * 
 * Note: 
 * - Prisma-generated types are for database operations
 * - These DTOs are for Better Auth API calls (createOrganization, inviteMember, etc.)
 */

// ============ Input Types ============

@InputType('BetterAuthCreateOrganizationInput')
export class CreateOrganizationInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  slug?: string;

  @Field({ nullable: true })
  logo?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: Record<string, any>;
}

@InputType('BetterAuthUpdateOrganizationInput')
export class UpdateOrganizationInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  slug?: string;

  @Field({ nullable: true })
  logo?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: Record<string, any>;
}

@InputType('BetterAuthInviteMemberInput')
export class InviteMemberInput {
  @Field()
  email: string;

  @Field()
  role: string;

  @Field({ nullable: true })
  organizationId?: string;

  @Field({ nullable: true })
  teamId?: string;
}

@InputType('BetterAuthUpdateMemberRoleInput')
export class UpdateMemberRoleInput {
  @Field()
  memberId: string;

  @Field()
  role: string;

  @Field({ nullable: true })
  organizationId?: string;
}

@InputType('BetterAuthCreateRoleInput')
export class CreateRoleInput {
  @Field()
  role: string;

  @Field(() => GraphQLJSON)
  permission: Record<string, string[]>;

  @Field({ nullable: true })
  organizationId?: string;
}

@InputType('BetterAuthUpdateRoleInput')
export class UpdateRoleInput {
  @Field()
  roleId: string;

  @Field(() => GraphQLJSON, { nullable: true })
  permission?: Record<string, string[]>;

  @Field({ nullable: true })
  roleName?: string;

  @Field({ nullable: true })
  organizationId?: string;
}

@InputType('BetterAuthCreateTeamInput')
export class CreateTeamInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  organizationId?: string;
}

@InputType('BetterAuthCheckPermissionInput')
export class CheckPermissionInput {
  @Field(() => GraphQLJSON)
  permissions: Record<string, string[]>;

  @Field({ nullable: true })
  organizationId?: string;
}

// ============ Output Types ============

@ObjectType('BetterAuthOrganizationType')
export class Organization {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  logo?: string;

  @Field()
  createdAt: Date;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: Record<string, any>;
}

@ObjectType('BetterAuthMemberType')
export class Member {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field()
  organizationId: string;

  @Field()
  role: string;

  @Field()
  createdAt: Date;
}

@ObjectType('BetterAuthInvitationType')
export class Invitation {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  role?: string;

  @Field()
  organizationId: string;

  @Field({ nullable: true })
  teamId?: string;

  @Field()
  status: string;

  @Field()
  expiresAt: Date;

  @Field()
  inviterId: string;
}

@ObjectType('BetterAuthOrganizationRoleType')
export class OrganizationRole {
  @Field()
  id: string;

  @Field()
  organizationId: string;

  @Field()
  role: string;

  @Field(() => GraphQLJSON)
  permission: Record<string, string[]>;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

@ObjectType('BetterAuthTeamType')
export class Team {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  organizationId: string;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

@ObjectType('BetterAuthFullOrganizationType')
export class FullOrganization {
  @Field(() => Organization)
  organization: Organization;

  @Field(() => [Member])
  members: Member[];

  @Field(() => [Team], { nullable: true })
  teams?: Team[];
}

@ObjectType('BetterAuthPermissionCheckResponseType')
export class PermissionCheckResponse {
  @Field()
  hasPermission: boolean;

  @Field({ nullable: true })
  message?: string;
}

@ObjectType('BetterAuthBasicOrgResponseType')
export class BasicOrgResponse {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;
}
