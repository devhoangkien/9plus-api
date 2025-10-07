import {
  Resolver,
  Query,
  Mutation,
  Args,
  Context,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@anineplus/authorization';
import { PermissionsService } from './permissions.service';
import {
  CreateRoleInput,
  UpdateRoleInput,
  CheckPermissionInput,
  OrganizationRole,
  PermissionCheckResponse,
  BasicOrgResponse,
} from './dto/better-auth-permission.dto';

@Resolver()
export class PermissionResolver {
  constructor(private readonly permissionService: PermissionsService) {}

  private extractSessionToken(context: any): string {
    const authHeader = context.req?.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('User not authenticated');
    }
    return authHeader.substring(7);
  }

  @Query(() => PermissionCheckResponse)
  @UseGuards(AuthGuard)
  async checkPermission(
    @Args('input') input: CheckPermissionInput,
    @Context() context: any,
  ): Promise<PermissionCheckResponse> {
    const sessionToken = this.extractSessionToken(context);
    const result = await this.permissionService.hasPermission(
      sessionToken,
      input.permissions,
      input.organizationId,
    );
    return {
      hasPermission: result?.success || false,
      message: result?.error ?? undefined,
    };
  }

  @Query(() => [OrganizationRole])
  @UseGuards(AuthGuard)
  async listRoles(
    @Args('organizationId', { nullable: true }) organizationId?: string,
    @Context() context?: any,
  ): Promise<OrganizationRole[]> {
    const sessionToken = this.extractSessionToken(context);
    return this.permissionService.listRoles(sessionToken, organizationId) as any;
  }

  @Mutation(() => OrganizationRole)
  @UseGuards(AuthGuard)
  async createRole(
    @Args('input') input: CreateRoleInput,
    @Context() context: any,
  ): Promise<OrganizationRole> {
    const sessionToken = this.extractSessionToken(context);
    return this.permissionService.createRole(
      sessionToken,
      input.role,
      input.permission,
      input.organizationId,
    ) as any;
  }

  @Mutation(() => OrganizationRole)
  @UseGuards(AuthGuard)
  async updateRole(
    @Args('input') input: UpdateRoleInput,
    @Context() context: any,
  ): Promise<OrganizationRole> {
    const sessionToken = this.extractSessionToken(context);
    return this.permissionService.updateRole(
      sessionToken,
      input.roleId,
      {
        permission: input.permission,
        roleName: input.roleName,
      },
      input.organizationId,
    ) as any;
  }

  @Mutation(() => BasicOrgResponse)
  @UseGuards(AuthGuard)
  async deleteRole(
    @Args('roleId') roleId: string,
    @Args('organizationId', { nullable: true }) organizationId?: string,
    @Context() context?: any,
  ): Promise<BasicOrgResponse> {
    const sessionToken = this.extractSessionToken(context);
    await this.permissionService.deleteRole(sessionToken, roleId, organizationId);
    return {
      success: true,
      message: 'Role deleted successfully',
    };
  }
}
