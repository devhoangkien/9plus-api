import { createAccessControl } from 'better-auth/plugins/access';
import {
  defaultStatements,
  ownerAc,
  adminAc,
  memberAc,
} from 'better-auth/plugins/organization/access';

/**
 * Define custom statements for access control
 * Merge with default statements to include built-in organization, member, and invitation permissions
 */
const statement = {
  ...defaultStatements,
  // Custom resources for anime platform
  anime: ['create', 'read', 'update', 'delete', 'publish'],
  episode: ['create', 'read', 'update', 'delete', 'upload'],
  comment: ['create', 'read', 'update', 'delete', 'moderate'],
  user: ['read', 'update', 'ban', 'unban'],
  subscription: ['create', 'read', 'update', 'cancel'],
  analytics: ['read', 'export'],
  settings: ['read', 'update'],
} as const;

/**
 * Create access control instance
 */
export const ac = createAccessControl(statement);

/**
 * Define roles with permissions
 */

// Owner role: Full control over everything
export const owner = ac.newRole({
  ...ownerAc.statements,
  anime: ['create', 'read', 'update', 'delete', 'publish'],
  episode: ['create', 'read', 'update', 'delete', 'upload'],
  comment: ['create', 'read', 'update', 'delete', 'moderate'],
  user: ['read', 'update', 'ban', 'unban'],
  subscription: ['create', 'read', 'update', 'cancel'],
  analytics: ['read', 'export'],
  settings: ['read', 'update'],
});

// Admin role: Can manage content and users but not billing/subscriptions
export const admin = ac.newRole({
  ...adminAc.statements,
  anime: ['create', 'read', 'update', 'delete', 'publish'],
  episode: ['create', 'read', 'update', 'delete', 'upload'],
  comment: ['create', 'read', 'update', 'delete', 'moderate'],
  user: ['read', 'update', 'ban', 'unban'],
  subscription: ['read'],
  analytics: ['read', 'export'],
  settings: ['read'],
});

// Content Manager role: Can manage anime and episodes
export const contentManager = ac.newRole({
  ...memberAc.statements,
  anime: ['create', 'read', 'update', 'publish'],
  episode: ['create', 'read', 'update', 'upload'],
  comment: ['read', 'moderate'],
  user: ['read'],
  analytics: ['read'],
});

// Moderator role: Can moderate content and comments
export const moderator = ac.newRole({
  ...memberAc.statements,
  anime: ['read'],
  episode: ['read'],
  comment: ['read', 'update', 'delete', 'moderate'],
  user: ['read', 'ban', 'unban'],
  analytics: ['read'],
});

// Member role: Basic access to view content
export const member = ac.newRole({
  ...memberAc.statements,
  anime: ['read'],
  episode: ['read'],
  comment: ['create', 'read', 'update'],
  user: ['read'],
  subscription: ['read'],
});

// Viewer role: Read-only access
export const viewer = ac.newRole({
  anime: ['read'],
  episode: ['read'],
  comment: ['read'],
  user: ['read'],
});

/**
 * Export all roles for use in auth configuration
 */
export const roles = {
  owner,
  admin,
  contentManager,
  moderator,
  member,
  viewer,
};

export type Roles = keyof typeof roles;
