import { Injectable, Logger } from '@nestjs/common';
import { auth } from './auth.config';

@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);
  private readonly authApi = auth.api;

  /**
   * Create a new organization
   */
  async createOrganization(
    sessionToken: string,
    name: string,
    slug: string,
    logo?: string,
    metadata?: Record<string, any>,
  ) {
    try {
      const result = await this.authApi.createOrganization({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
        body: {
          name,
          slug,
          logo,
          metadata,
        },
      });

      this.logger.log(`Organization created: ${name}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create organization: ${error.message}`);
      throw error;
    }
  }

  /**
   * List user's organizations
   */
  async listOrganizations(sessionToken: string) {
    try {
      const result = await this.authApi.listOrganizations({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
      });
      return result;
    } catch (error) {
      this.logger.error(`Failed to list organizations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get full organization details
   */
  async getFullOrganization(
    sessionToken: string,
    organizationId?: string,
    organizationSlug?: string,
  ) {
    try {
      const result = await this.authApi.getFullOrganization({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
        query: {
          organizationId,
          organizationSlug,
        },
      });
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get organization details: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Update organization
   */
  async updateOrganization(
    sessionToken: string,
    organizationId: string,
    data: {
      name?: string;
      slug?: string;
      logo?: string;
      metadata?: Record<string, any>;
    },
  ) {
    try {
      const result = await this.authApi.updateOrganization({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
        body: {
          organizationId,
          data,
        },
      });

      this.logger.log(`Organization updated: ${organizationId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update organization: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete organization
   */
  async deleteOrganization(sessionToken: string, organizationId: string) {
    try {
      const result = await this.authApi.deleteOrganization({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
        body: {
          organizationId,
        },
      });

      this.logger.log(`Organization deleted: ${organizationId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to delete organization: ${error.message}`);
      throw error;
    }
  }

  /**
   * Invite member to organization
   */
  async inviteMember(
    sessionToken: string,
    email: string,
    role: string | string[],
    organizationId?: string,
    teamId?: string,
  ) {
    try {
      const result = await this.authApi.createInvitation({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
        body: {
          email,
          role: role as any, // Type assertion for custom roles
          organizationId,
          teamId,
        },
      });

      this.logger.log(`Member invited: ${email} to organization ${organizationId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to invite member: ${error.message}`);
      throw error;
    }
  }

  /**
   * List organization members
   */
  async listMembers(sessionToken: string, organizationId?: string) {
    try {
      const result = await this.authApi.listMembers({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
        query: {
          organizationId,
        },
      });
      return result;
    } catch (error) {
      this.logger.error(`Failed to list members: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove member from organization
   */
  async removeMember(
    sessionToken: string,
    memberIdOrEmail: string,
    organizationId?: string,
  ) {
    try {
      const result = await this.authApi.removeMember({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
        body: {
          memberIdOrEmail,
          organizationId,
        },
      });

      this.logger.log(`Member removed: ${memberIdOrEmail} from ${organizationId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to remove member: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    sessionToken: string,
    memberId: string,
    role: string | string[],
    organizationId?: string,
  ) {
    try {
      const result = await this.authApi.updateMemberRole({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
        body: {
          memberId,
          role,
          organizationId,
        },
      });

      this.logger.log(`Member role updated: ${memberId} to ${role}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update member role: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if user has permission
   */
  async hasPermission(
    sessionToken: string,
    permissions: Record<string, string[]>,
    organizationId?: string,
  ) {
    try {
      const result = await this.authApi.hasPermission({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
        body: {
          permissions,
          organizationId,
        },
      });
      return result;
    } catch (error) {
      this.logger.error(`Failed to check permission: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create dynamic role (DAC)
   */
  async createRole(
    sessionToken: string,
    role: string,
    permission: Record<string, string[]>,
    organizationId?: string,
  ) {
    try {
      const result = await this.authApi.createOrgRole({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
        body: {
          role,
          permission,
          organizationId,
        },
      });

      this.logger.log(`Dynamic role created: ${role} in ${organizationId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create role: ${error.message}`);
      throw error;
    }
  }

  /**
   * List organization roles
   */
  async listRoles(sessionToken: string, organizationId?: string) {
    try {
      const result = await this.authApi.listOrgRoles({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
        query: {
          organizationId,
        },
      });
      return result;
    } catch (error) {
      this.logger.error(`Failed to list roles: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a specific role
   */
  async getRole(
    sessionToken: string,
    organizationId: string,
    identifier: { roleId: string } | { roleName: string },
  ) {
    try {
      const result = await this.authApi.getOrgRole({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
        query: {
          organizationId,
          ...identifier,
        },
      });
      return result;
    } catch (error) {
      this.logger.error(`Failed to get role: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update role
   */
  async updateRole(
    sessionToken: string,
    roleId: string,
    data: {
      permission?: Record<string, string[]>;
      roleName?: string;
    },
    organizationId?: string,
  ) {
    try {
      const result = await this.authApi.updateOrgRole({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
        body: {
          roleId,
          data,
          organizationId,
        },
      });

      this.logger.log(`Role updated: ${roleId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update role: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete role
   */
  async deleteRole(
    sessionToken: string,
    roleId: string,
    organizationId?: string,
  ) {
    try {
      const result = await this.authApi.deleteOrgRole({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
        body: {
          roleId,
          organizationId,
        },
      });

      this.logger.log(`Role deleted: ${roleId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to delete role: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create team
   */
  async createTeam(sessionToken: string, name: string, organizationId?: string) {
    try {
      const result = await this.authApi.createTeam({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
        body: {
          name,
          organizationId,
        },
      });

      this.logger.log(`Team created: ${name}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to create team: ${error.message}`);
      throw error;
    }
  }

  /**
   * List teams
   */
  async listTeams(sessionToken: string, organizationId?: string) {
    try {
      const result = await this.authApi.listOrganizationTeams({
        headers: {
          authorization: `Bearer ${sessionToken}`,
        },
        query: {
          organizationId,
        },
      });
      return result;
    } catch (error) {
      this.logger.error(`Failed to list teams: ${error.message}`);
      throw error;
    }
  }
}
