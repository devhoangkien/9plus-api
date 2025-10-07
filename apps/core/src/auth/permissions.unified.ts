/**
 * Unified Access Control System
 * Combines better-auth Admin plugin and Organization plugin
 * 
 * Two-level permission system:
 * 1. Global/System Level (Admin plugin) - Application-wide permissions
 * 2. Organization Level (Organization plugin) - Organization-specific permissions
 */

import { createAccessControl } from 'better-auth/plugins/access';
import { 
  defaultStatements as adminDefaultStatements,
  adminAc,
  userAc 
} from 'better-auth/plugins/admin/access';
import {
  defaultStatements as orgDefaultStatements,
  ownerAc,
  adminAc as orgAdminAc,
  memberAc,
} from 'better-auth/plugins/organization/access';

/**
 * ========================================
 * LEVEL 1: GLOBAL/SYSTEM PERMISSIONS (Admin Plugin)
 * ========================================
 * For application-wide operations
 * Roles: super-admin, admin, user
 */

export const globalStatement = {
  ...adminDefaultStatements,
  // System resources
  system: ['read', 'update', 'configure', 'maintain'],
  plugin: ['create', 'read', 'update', 'delete', 'activate', 'deactivate'],
  analytics: ['read', 'export', 'manage'],
  settings: ['read', 'update'],
  audit: ['read', 'export'],
} as const;

export const globalAc = createAccessControl(globalStatement);

// Super Admin: Full system control
export const superAdmin = globalAc.newRole({
  ...adminAc.statements,
  system: ['read', 'update', 'configure', 'maintain'],
  plugin: ['create', 'read', 'update', 'delete', 'activate', 'deactivate'],
  analytics: ['read', 'export', 'manage'],
  settings: ['read', 'update'],
  audit: ['read', 'export'],
});

// Admin: User management
export const admin = globalAc.newRole({
  ...adminAc.statements,
  system: ['read'],
  plugin: ['read'],
  analytics: ['read', 'export'],
  settings: ['read'],
  audit: ['read'],
});

// Regular User: Basic access
export const user = globalAc.newRole({
  ...userAc.statements,
  system: ['read'],
  analytics: ['read'],
});

export const globalRoles = {
  superAdmin,
  admin,
  user,
};

/**
 * ========================================
 * LEVEL 2: ORGANIZATION PERMISSIONS (Organization Plugin)
 * ========================================
 * For organization-specific operations
 * Roles: owner, admin, contentManager, moderator, member, viewer
 */

export const organizationStatement = {
  ...orgDefaultStatements,
  // Custom anime platform resources
  anime: ['create', 'read', 'update', 'delete', 'publish'],
  episode: ['create', 'read', 'update', 'delete', 'upload'],
  comment: ['create', 'read', 'update', 'delete', 'moderate'],
  subscription: ['create', 'read', 'update', 'cancel'],
  orgAnalytics: ['read', 'export'], // Organization-specific analytics
  orgSettings: ['read', 'update'], // Organization-specific settings
} as const;

export const organizationAc = createAccessControl(organizationStatement);

// Owner: Full control over organization
export const owner = organizationAc.newRole({
  ...ownerAc.statements,
  anime: ['create', 'read', 'update', 'delete', 'publish'],
  episode: ['create', 'read', 'update', 'delete', 'upload'],
  comment: ['create', 'read', 'update', 'delete', 'moderate'],
  subscription: ['create', 'read', 'update', 'cancel'],
  orgAnalytics: ['read', 'export'],
  orgSettings: ['read', 'update'],
});

// Organization Admin: Can manage content and members
export const orgAdmin = organizationAc.newRole({
  ...orgAdminAc.statements,
  anime: ['create', 'read', 'update', 'delete', 'publish'],
  episode: ['create', 'read', 'update', 'delete', 'upload'],
  comment: ['create', 'read', 'update', 'delete', 'moderate'],
  subscription: ['read'],
  orgAnalytics: ['read', 'export'],
  orgSettings: ['read'],
});

// Content Manager: Manages anime and episodes
export const contentManager = organizationAc.newRole({
  ...memberAc.statements,
  anime: ['create', 'read', 'update', 'publish'],
  episode: ['create', 'read', 'update', 'upload'],
  comment: ['read', 'moderate'],
  orgAnalytics: ['read'],
});

// Moderator: Moderates content and comments
export const moderator = organizationAc.newRole({
  ...memberAc.statements,
  anime: ['read'],
  episode: ['read'],
  comment: ['read', 'update', 'delete', 'moderate'],
  orgAnalytics: ['read'],
});

// Member: Basic organization member
export const member = organizationAc.newRole({
  ...memberAc.statements,
  anime: ['read'],
  episode: ['read'],
  comment: ['create', 'read', 'update'],
  subscription: ['read'],
});

// Viewer: Read-only access
export const viewer = organizationAc.newRole({
  anime: ['read'],
  episode: ['read'],
  comment: ['read'],
});

export const organizationRoles = {
  owner,
  admin: orgAdmin,
  contentManager,
  moderator,
  member,
  viewer,
};

/**
 * ========================================
 * UNIFIED ACCESS CONTROL
 * ========================================
 */

// Export for use in auth config
export const ac = {
  global: globalAc,
  organization: organizationAc,
};

// Combined roles export
export const roles = {
  global: globalRoles,
  organization: organizationRoles,
};

// TypeScript types
export type GlobalRoles = keyof typeof globalRoles;
export type OrganizationRoles = keyof typeof organizationRoles;
export type GlobalResource = keyof typeof globalStatement;
export type OrganizationResource = keyof typeof organizationStatement;
