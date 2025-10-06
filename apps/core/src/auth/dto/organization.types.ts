import { Field, InputType, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

// ============ Input Types ============

@InputType()
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

@InputType()
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

@InputType()
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

@InputType()
export class UpdateMemberRoleInput {
  @Field()
  memberId: string;

  @Field()
  role: string;

  @Field({ nullable: true })
  organizationId?: string;
}

@InputType()
export class CreateRoleInput {
  @Field()
  role: string;

  @Field(() => GraphQLJSON)
  permission: Record<string, string[]>;

  @Field({ nullable: true })
  organizationId?: string;
}

@InputType()
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

@InputType()
export class CreateTeamInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  organizationId?: string;
}

@InputType()
export class CheckPermissionInput {
  @Field(() => GraphQLJSON)
  permissions: Record<string, string[]>;

  @Field({ nullable: true })
  organizationId?: string;
}

// ============ Output Types ============

@ObjectType()
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

@ObjectType()
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

@ObjectType()
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

@ObjectType()
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

@ObjectType()
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

@ObjectType()
export class FullOrganization {
  @Field(() => Organization)
  organization: Organization;

  @Field(() => [Member])
  members: Member[];

  @Field(() => [Team], { nullable: true })
  teams?: Team[];
}

@ObjectType()
export class PermissionCheckResponse {
  @Field()
  hasPermission: boolean;

  @Field({ nullable: true })
  message?: string;
}

@ObjectType()
export class BasicOrgResponse {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;
}
