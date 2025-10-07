import { Field, InputType, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

/**
 * Better Auth Permission DTOs
 * 
 * These are DTOs for Better Auth's organization API, NOT Prisma models.
 * They are separate from Prisma-generated types to avoid conflicts.
 * 
 * Prisma generates types from schema.prisma for database operations.
 * These DTOs are specifically for Better Auth's permission system.
 */

// ============ Input Types ============

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

@InputType('BetterAuthCheckPermissionInput')
export class CheckPermissionInput {
  @Field(() => GraphQLJSON)
  permissions: Record<string, string[]>;

  @Field({ nullable: true })
  organizationId?: string;
}

// ============ Output Types ============

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

@ObjectType('BetterAuthPermissionCheckResponseType')
export class PermissionCheckResponse {
  @Field()
  hasPermission: boolean;

  @Field({ nullable: true })
  message?: string;
}

@ObjectType('BetterAuthBasicResponseType')
export class BasicOrgResponse {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;
}
