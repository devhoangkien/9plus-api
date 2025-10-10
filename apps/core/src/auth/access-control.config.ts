/**
 * Better-Auth Access Control Configuration
 * Defines resources and actions for organization permissions
 * 
 * NOTE: All permission logic has been moved to OrganizationPermissionService
 * This file only exports the access control configuration needed by better-auth
 */

import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements } from 'better-auth/plugins/organization/access';

/**
 * Define custom statements for access control
 * This merges with better-auth default statements
 * 
 * Structure:
 * - defaultStatements: Better-auth built-in resources (organization, member, invitation, team, ac)
 * - Plugin-based resources: Explicitly defined with full actions (type-safe, autocomplete)
 * - Wildcard '*': Fallback for future plugins or dynamic resources
 */

export const statement = {
  ...defaultStatements,
  
  // Core plugin resources (anineplus-core)
  'user': ['read', 'update', 'ban', 'unban', 'verify'],
  

  // Wildcard fallback for future plugins or dynamic resources
  // Use this when you need flexibility without redeploying code
  '*': ['create', 'read', 'update', 'delete'],
} as const;

/**
 * Create access control instance
 * This is required by better-auth organization plugin
 */
export const ac = createAccessControl(statement);

/**
 * Export types for TypeScript
 */
export type Roles = 
  | 'owner' 
  | 'admin' 
  | 'contentManager' 
  | 'moderator' 
  | 'member' 
  | 'viewer';

export type Resource = keyof typeof statement;
export type Action<R extends Resource> = (typeof statement)[R][number];
