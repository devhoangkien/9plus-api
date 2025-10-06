# Dynamic Access Control (DAC) with Better Auth

This document describes the Dynamic Access Control implementation using Better Auth's organization plugin.

## Overview

Dynamic Access Control allows you to create, manage, and assign roles at runtime within organizations. This provides flexibility to define custom permissions without modifying code or redeploying the application.

## Features

✅ **Runtime Role Creation** - Create custom roles on-the-fly
✅ **Flexible Permissions** - Define permissions for custom resources (anime, episode, comment, etc.)
✅ **Organization-Scoped** - Roles are scoped to specific organizations
✅ **Team Support** - Organize members into teams within organizations
✅ **Built-in Roles** - Pre-defined roles: owner, admin, contentManager, moderator, member, viewer
✅ **GraphQL API** - Full GraphQL support for all DAC operations

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Better Auth Core                         │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │ Organization │───▶│    Member    │───▶│   Session    │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                    │                              │
│         │                    ▼                              │
│         │            ┌──────────────┐                       │
│         └───────────▶│     Role     │                       │
│                      │  (Dynamic)   │                       │
│                      └──────────────┘                       │
│                              │                              │
│                              ▼                              │
│                      ┌──────────────┐                       │
│                      │ Permissions  │                       │
│                      └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

### 1. Define Access Control (permissions.ts)

```typescript
import { createAccessControl } from 'better-auth/plugins/access';

const statement = {
  ...defaultStatements,
  // Custom resources
  anime: ['create', 'read', 'update', 'delete', 'publish'],
  episode: ['create', 'read', 'update', 'delete', 'upload'],
  comment: ['create', 'read', 'update', 'delete', 'moderate'],
  user: ['read', 'update', 'ban', 'unban'],
  subscription: ['create', 'read', 'update', 'cancel'],
  analytics: ['read', 'export'],
  settings: ['read', 'update'],
} as const;

export const ac = createAccessControl(statement);
```

### 2. Define Built-in Roles

```typescript
// Owner: Full control
export const owner = ac.newRole({
  ...ownerAc.statements,
  anime: ['create', 'read', 'update', 'delete', 'publish'],
  episode: ['create', 'read', 'update', 'delete', 'upload'],
  // ... all permissions
});

// Content Manager: Manage content
export const contentManager = ac.newRole({
  anime: ['create', 'read', 'update', 'publish'],
  episode: ['create', 'read', 'update', 'upload'],
  comment: ['read', 'moderate'],
});

// Moderator: Moderate content
export const moderator = ac.newRole({
  comment: ['read', 'update', 'delete', 'moderate'],
  user: ['read', 'ban', 'unban'],
});

// Member: Basic access
export const member = ac.newRole({
  anime: ['read'],
  episode: ['read'],
  comment: ['create', 'read', 'update'],
});
```

### 3. Enable in Auth Config

```typescript
import { betterAuth } from 'better-auth';
import { organization } from 'better-auth/plugins';
import { ac, roles } from './permissions';

export const auth = betterAuth({
  plugins: [
    organization({
      ac,
      roles,
      dynamicAccessControl: {
        enabled: true,
        maximumRolesPerOrganization: 20,
      },
      teams: {
        enabled: true,
        maximumTeams: 50,
      },
    }),
  ],
});
```

## Database Schema

### organizationRole Table

Stores dynamic roles created at runtime:

| Column | Type | Description |
|--------|------|-------------|
| id | string | Unique identifier |
| organizationId | string | Organization the role belongs to |
| role | string | Role name |
| permission | JSON | Permissions object |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### Other Tables

- `organization` - Organization details
- `member` - Organization members with roles
- `invitation` - Pending member invitations
- `team` - Teams within organizations
- `teamMember` - Team membership

## GraphQL API

### Organization Operations

#### Create Organization

```graphql
mutation CreateOrganization {
  createOrganization(input: {
    name: "AnimeStudio"
    slug: "anime-studio"
    logo: "https://example.com/logo.png"
    metadata: { plan: "pro" }
  }) {
    id
    name
    slug
    createdAt
  }
}
```

#### List Organizations

```graphql
query ListOrganizations {
  listOrganizations {
    id
    name
    slug
    logo
    metadata
  }
}
```

#### Update Organization

```graphql
mutation UpdateOrganization {
  updateOrganization(
    organizationId: "org_123"
    input: {
      name: "New Name"
      metadata: { plan: "enterprise" }
    }
  ) {
    id
    name
    metadata
  }
}
```

### Member Management

#### Invite Member

```graphql
mutation InviteMember {
  inviteMember(input: {
    email: "user@example.com"
    role: "contentManager"
    organizationId: "org_123"
  }) {
    id
    email
    role
    status
    expiresAt
  }
}
```

#### List Members

```graphql
query ListMembers {
  listMembers(organizationId: "org_123") {
    id
    userId
    role
    createdAt
  }
}
```

#### Update Member Role

```graphql
mutation UpdateMemberRole {
  updateMemberRole(input: {
    memberId: "member_123"
    role: "admin"
    organizationId: "org_123"
  }) {
    id
    role
  }
}
```

#### Remove Member

```graphql
mutation RemoveMember {
  removeMember(
    memberIdOrEmail: "user@example.com"
    organizationId: "org_123"
  ) {
    success
    message
  }
}
```

### Dynamic Role Management (DAC)

#### Create Custom Role

```graphql
mutation CreateRole {
  createRole(input: {
    role: "videoEditor"
    permission: {
      anime: ["read", "update"]
      episode: ["create", "read", "update", "upload"]
      comment: ["read"]
    }
    organizationId: "org_123"
  }) {
    id
    role
    permission
    createdAt
  }
}
```

#### List Roles

```graphql
query ListRoles {
  listRoles(organizationId: "org_123") {
    id
    role
    permission
    createdAt
  }
}
```

#### Update Role

```graphql
mutation UpdateRole {
  updateRole(input: {
    roleId: "role_123"
    permission: {
      anime: ["read", "update", "publish"]
      episode: ["create", "read", "update", "upload"]
    }
    roleName: "seniorVideoEditor"
  }) {
    id
    role
    permission
  }
}
```

#### Delete Role

```graphql
mutation DeleteRole {
  deleteRole(
    roleId: "role_123"
    organizationId: "org_123"
  ) {
    success
    message
  }
}
```

### Permission Checking

#### Check Permission

```graphql
query CheckPermission {
  checkPermission(input: {
    permissions: {
      anime: ["create", "publish"]
      episode: ["upload"]
    }
    organizationId: "org_123"
  }) {
    hasPermission
    message
  }
}
```

### Team Management

#### Create Team

```graphql
mutation CreateTeam {
  createTeam(input: {
    name: "Content Team"
    organizationId: "org_123"
  }) {
    id
    name
    createdAt
  }
}
```

#### List Teams

```graphql
query ListTeams {
  listTeams(organizationId: "org_123") {
    id
    name
    organizationId
    createdAt
  }
}
```

## Usage Examples

### 1. Create Organization with Owner

```typescript
// User creates organization - automatically becomes owner
const { data } = await client.organization.create({
  name: "My Anime Studio",
  slug: "my-anime-studio",
  logo: "https://example.com/logo.png",
});

// Owner has full permissions
await client.organization.hasPermission({
  permissions: {
    anime: ["create", "delete", "publish"],
    episode: ["upload"],
    user: ["ban"],
  },
}); // Returns { hasPermission: true }
```

### 2. Invite Members with Different Roles

```typescript
// Invite content manager
await client.organization.inviteMember({
  email: "editor@example.com",
  role: "contentManager",
});

// Invite moderator
await client.organization.inviteMember({
  email: "mod@example.com",
  role: "moderator",
});

// Invite viewer
await client.organization.inviteMember({
  email: "viewer@example.com",
  role: "viewer",
});
```

### 3. Create Custom Role at Runtime

```typescript
// Create custom "translator" role
await client.organization.createRole({
  role: "translator",
  permission: {
    anime: ["read"],
    episode: ["read", "update"], // Can update subtitles
    comment: ["read"],
  },
});

// Assign to member
await client.organization.updateMemberRole({
  memberId: "member_123",
  role: "translator",
});
```

### 4. Check Permissions Before Action

```typescript
// Before allowing user to upload episode
const canUpload = await client.organization.hasPermission({
  permissions: {
    episode: ["upload"],
  },
});

if (canUpload.hasPermission) {
  // Allow upload
} else {
  // Show error
}
```

### 5. Organize with Teams

```typescript
// Create content team
const contentTeam = await client.organization.createTeam({
  name: "Content Production",
});

// Invite member to specific team
await client.organization.inviteMember({
  email: "producer@example.com",
  role: "contentManager",
  teamId: contentTeam.id,
});

// Create moderation team
const modTeam = await client.organization.createTeam({
  name: "Moderation Team",
});

await client.organization.inviteMember({
  email: "mod@example.com",
  role: "moderator",
  teamId: modTeam.id,
});
```

## Best Practices

### 1. Role Naming Convention

Use clear, descriptive role names:
- ✅ `contentManager`, `videoEditor`, `translator`
- ❌ `role1`, `temp`, `user`

### 2. Permission Granularity

Define granular permissions for fine-grained control:
```typescript
{
  anime: ["read", "update"],        // Can update but not delete
  episode: ["read", "upload"],      // Can upload but not delete
  comment: ["moderate"]             // Can moderate but not create
}
```

### 3. Role Hierarchy

Design roles with clear hierarchy:
```
owner (full access)
  ↓
admin (manage everything except billing)
  ↓
contentManager (manage content)
  ↓
moderator (moderate content)
  ↓
member (basic access)
  ↓
viewer (read-only)
```

### 4. Dynamic Role Limits

Set appropriate limits based on organization plan:
```typescript
dynamicAccessControl: {
  maximumRolesPerOrganization: async (organizationId) => {
    const org = await getOrganization(organizationId);
    return org.plan === 'enterprise' ? 100 : 20;
  },
}
```

### 5. Permission Checking

Always check permissions before sensitive operations:
```typescript
// Before deleting anime
const canDelete = await hasPermission({
  permissions: { anime: ["delete"] }
});

if (!canDelete.hasPermission) {
  throw new UnauthorizedException("No permission to delete");
}

// Proceed with deletion
```

## Security Considerations

1. **Validate Role Names**: Ensure role names don't contain special characters
2. **Limit Role Creation**: Only allow owners/admins to create roles
3. **Audit Trail**: Log all role and permission changes
4. **Permission Escalation**: Prevent users from granting permissions they don't have
5. **Regular Review**: Periodically review and clean up unused roles

## Troubleshooting

### Permission Check Returns False

1. Verify user is member of organization
2. Check user's role has required permissions
3. Ensure permission resource names match exactly
4. Confirm organization is active

### Cannot Create Role

1. Check maximum role limit hasn't been reached
2. Verify user has `ac:create` permission
3. Ensure role name is unique within organization
4. Validate permission structure matches defined resources

### Member Cannot Access Resource

1. Verify member's role assignment
2. Check role has required permissions
3. Ensure active organization is set correctly
4. Confirm resource exists and is accessible

## Migration from Static Roles

If migrating from static roles to DAC:

1. **Map Existing Roles**: Create equivalent dynamic roles
2. **Migrate Members**: Assign new dynamic roles to members
3. **Test Permissions**: Verify all permissions work correctly
4. **Deprecate Old Roles**: Gradually phase out static role checks
5. **Update Code**: Replace static role checks with permission checks

## Further Reading

- [Better Auth Organization Plugin](https://www.better-auth.com/docs/plugins/organization)
- [Dynamic Access Control Guide](https://www.better-auth.com/docs/plugins/organization#dynamic-access-control)
- [Access Control Patterns](https://www.better-auth.com/docs/plugins/organization#access-control)
