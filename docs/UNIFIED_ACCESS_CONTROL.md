# Unified Access Control System

Hệ thống phân quyền 2 cấp độ kết hợp **Admin Plugin** (global) và **Organization Plugin** (organization-level).

## 🏗️ Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                    ACCESS CONTROL SYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  LEVEL 1: GLOBAL/SYSTEM (Admin Plugin)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Roles: super-admin, admin, user                      │   │
│  │ Resources: user, session, system, plugin, etc.       │   │
│  │ Scope: Application-wide                              │   │
│  │ Storage: Role & Permission tables                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↓                                    │
│  LEVEL 2: ORGANIZATION (Organization Plugin)                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Roles: owner, admin, contentManager, moderator, etc. │   │
│  │ Resources: anime, episode, comment, subscription     │   │
│  │ Scope: Per-organization                              │   │
│  │ Storage: OrganizationRolePermission table            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Database Schema

### Level 1: Global Tables (Admin Plugin)

#### `roles` - System-wide roles
```prisma
model Role {
  id           String   @id
  key          String   @unique
  name         String
  level        Int      // Hierarchy level
  isSystemRole Boolean  // Protected from deletion
  permissions  Permission[]
  users        User[]
}
```

**Default Roles:**
- `super-admin` (level 100): Full system control
- `admin` (level 50): User management, analytics
- `user` (level 1): Basic access

#### `permissions` - System-wide permissions
```prisma
model Permission {
  id       String @id
  resource String // user, session, system, plugin
  action   String // create, read, update, delete, ban, impersonate
  scope    String // ALL, OWN, ORGANIZATION
  roles    Role[]
}
```

**Default Resources:**
- `user`: create, list, update, delete, ban, impersonate, set-role
- `session`: list, revoke, delete
- `system`: read, update, configure, maintain
- `plugin`: create, read, update, delete, activate
- `analytics`: read, export, manage
- `settings`: read, update
- `audit`: read, export

### Level 2: Organization Table (Organization Plugin)

#### `organizationRolePermission` - Organization-specific permissions
```prisma
model OrganizationRolePermission {
  id             String @id
  organizationId String
  role           String // Dynamic role names
  resource       String // anime, episode, comment, etc.
  action         String // create, read, update, delete, etc.
  conditions     Json?  // Optional ABAC conditions
}
```

**Default Roles per Organization:**
- `owner`: Full control
- `admin`: Content & member management
- `contentManager`: Anime/episode management
- `moderator`: Comment moderation
- `member`: Basic access
- `viewer`: Read-only

**Resources:**
- `organization`: create, read, update, delete
- `member`: create, read, update, delete
- `invitation`: create, read, cancel
- `team`: create, read, update, delete
- `anime`: create, read, update, delete, publish
- `episode`: create, read, update, delete, upload
- `comment`: create, read, update, delete, moderate
- `subscription`: create, read, update, cancel
- `orgAnalytics`: read, export
- `orgSettings`: read, update

## 🎯 Use Cases

### Case 1: System Administrator
```typescript
// User: super-admin role (global)
// Can: Manage all users, configure system, access all organizations

// Check global permission
await auth.api.userHasPermission({
  body: {
    userId: 'admin-user-id',
    permissions: {
      user: ['delete', 'ban'],
      system: ['configure']
    }
  }
});

// Can impersonate any user
await authClient.admin.impersonateUser({ userId: 'target-user-id' });
```

### Case 2: Organization Owner
```typescript
// User: owner role in organization A (organization-level)
// Can: Manage organization A, cannot access system settings

// Check organization permission
await auth.api.hasPermission({
  headers: await headers(),
  body: {
    permissions: {
      anime: ['create', 'publish'],
      member: ['delete']
    }
  }
});

// Can create custom roles in their organization
await authClient.organization.createRole({
  role: 'custom-editor',
  permission: {
    anime: ['read', 'update'],
    episode: ['read', 'update', 'upload']
  }
});
```

### Case 3: Content Manager
```typescript
// User: contentManager role in organization B
// Can: Manage content, cannot manage members or billing

// Check permission
const canPublish = await permissionService.hasPermission(
  'org-b-id',
  'contentManager',
  'anime',
  'publish'
); // true

const canDeleteMember = await permissionService.hasPermission(
  'org-b-id',
  'contentManager',
  'member',
  'delete'
); // false
```

### Case 4: Multi-role User
```typescript
// User: admin (global) + owner (org A) + member (org B)
// Can: System operations + full control in org A + limited access in org B

// Context-aware permission check
const user = await auth.api.getSession({ headers });

// Check global permission
if (user.user.role === 'admin') {
  // Can perform system operations
  await authClient.admin.listUsers();
}

// Check organization permission
if (user.session.activeOrganizationId === 'org-a') {
  // Can perform owner operations in org A
  await authClient.organization.delete({ organizationId: 'org-a' });
}
```

## 🔄 Permission Resolution Flow

```
1. Request comes in with userId + organizationId (optional)
                     ↓
2. Load User's Global Role (from User table)
                     ↓
3. Check Global Permissions (from Role-Permission relation)
                     ↓
         ┌───────────┴───────────┐
         │                       │
    YES (allowed)           NO (denied)
         │                       │
         ↓                       ↓
4. Load Organization Role  Check Organization
   (from Member table)     Permissions anyway
         │                       │
         ↓                       ↓
5. Check Organization      Organization
   Permissions             Permission Check
   (from OrgRolePermission)     │
         │                       │
         └───────────┬───────────┘
                     ↓
6. Return: Allow if ANY permission check passes
```

## 💡 Best Practices

### 1. Principle of Least Privilege
```typescript
// ❌ Bad: Give admin to everyone
user.role = 'admin';

// ✅ Good: Give minimum required permissions
user.role = 'user';
member.role = 'contentManager'; // Only in their organization
```

### 2. Separate Global and Organization Concerns
```typescript
// ❌ Bad: Mix system and organization permissions
permissions: {
  user: ['ban'], // System level
  anime: ['delete'] // Organization level
}

// ✅ Good: Check separately
// Global check
await auth.api.userHasPermission({ permissions: { user: ['ban'] } });

// Organization check
await auth.api.hasPermission({ permissions: { anime: ['delete'] } });
```

### 3. Use Dynamic Roles for Custom Needs
```typescript
// ✅ Create custom roles per organization
await authClient.organization.createRole({
  role: 'translator',
  permission: {
    anime: ['read'],
    episode: ['read', 'update'] // Can update subtitles
  }
});
```

### 4. Implement ABAC for Advanced Control
```typescript
// Add conditions to permissions
await prisma.organizationRolePermission.create({
  data: {
    organizationId: 'org-id',
    role: 'contentManager',
    resource: 'anime',
    action: 'publish',
    conditions: {
      // Only allow if anime.status === 'REVIEWED'
      anime: { status: 'REVIEWED' }
    }
  }
});
```

## 🔒 Security Considerations

### 1. Always Validate Context
```typescript
// ✅ Validate user is in organization
const member = await prisma.member.findFirst({
  where: {
    userId: user.id,
    organizationId: params.organizationId
  }
});

if (!member) {
  throw new Error('User not in organization');
}
```

### 2. Check Both Global and Organization Permissions
```typescript
// ✅ Multi-level check
const isGlobalAdmin = user.role === 'admin';
const isOrgOwner = member.role === 'owner';

if (!isGlobalAdmin && !isOrgOwner) {
  throw new Error('Insufficient permissions');
}
```

### 3. Audit Sensitive Operations
```typescript
// ✅ Log permission checks
await prisma.auditLog.create({
  data: {
    userId: user.id,
    action: 'DELETE_USER',
    resource: 'user',
    resourceId: targetUserId,
    success: true,
    metadata: { reason: 'spam' }
  }
});
```

## 📝 Implementation Checklist

- [x] Define global roles and permissions
- [x] Define organization roles and permissions
- [x] Create database schema
- [x] Implement permission checking logic
- [x] Add seed data for default permissions
- [x] Create permission service
- [ ] Add admin guards/decorators
- [ ] Add organization guards/decorators
- [ ] Implement audit logging
- [ ] Add permission caching
- [ ] Create admin UI for permission management
- [ ] Write integration tests

## 🔗 Related Files

- `permissions.unified.ts` - Unified permission definitions
- `auth.config.ts` - Auth plugin configuration
- `permission.service.ts` - Permission service
- `schema.prisma` - Database schema
- `permissions.seed.ts` - Seed data

## 📚 References

- [Better-auth Admin Plugin](https://www.better-auth.com/docs/plugins/admin)
- [Better-auth Organization Plugin](https://www.better-auth.com/docs/plugins/organization)
- [RBAC vs ABAC](https://www.osohq.com/academy/rbac-vs-abac)
