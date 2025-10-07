# Role-Permission System (Many-to-Many)

Hệ thống quản lý Role và Permission với quan hệ Many-to-Many trong database.

## 🏗️ Database Structure

### Tables

#### 1. `roles` - System Roles
```prisma
model Role {
  id           String         @id @default(cuid())
  key          String         @unique // 'super-admin', 'admin', 'user'
  name         String         // Display name
  description  String?
  level        Int            // Hierarchy (1-100)
  isSystemRole Boolean        // Protected from deletion
  status       RoleStatusEnum
  permissions  Permission[]   // Many-to-Many
  users        User[]         // Many-to-Many
}
```

#### 2. `permissions` - System Permissions
```prisma
model Permission {
  id          String               @id @default(cuid())
  key         String               @unique // 'user:create', 'session:list'
  name        String               // Display name
  resource    String               // 'user', 'session', 'system'
  action      String               // 'create', 'read', 'update', 'delete'
  scope       String               // 'ALL', 'OWN', 'ORGANIZATION'
  status      PermissionStatusEnum
  roles       Role[]               // Many-to-Many
}
```

#### 3. Many-to-Many Relationship
Prisma tự động tạo join table: `_PermissionToRole` hoặc `_RolePermissions`

```sql
CREATE TABLE "_RolePermissions" (
  "A" TEXT NOT NULL, -- Permission ID
  "B" TEXT NOT NULL, -- Role ID
  CONSTRAINT "_RolePermissions_AB_pkey" PRIMARY KEY ("A", "B")
);
```

## 🎭 Default Roles

### 1. Super Admin (Level 100)
```typescript
{
  key: 'super-admin',
  name: 'Super Administrator',
  level: 100,
  permissions: [
    // ALL permissions (45+)
    'user:*',
    'session:*',
    'system:*',
    'plugin:*',
    'analytics:*',
    'settings:*',
    'audit:*'
  ]
}
```

**Capabilities:**
- ✅ Full user management (create, delete, ban, impersonate)
- ✅ System configuration
- ✅ Plugin management
- ✅ Full analytics & audit access
- ✅ Cannot be deleted (system role)

### 2. Admin (Level 50)
```typescript
{
  key: 'admin',
  name: 'Administrator',
  level: 50,
  permissions: [
    // User management
    'user:create', 'user:list', 'user:read', 'user:update',
    'user:delete', 'user:ban', 'user:unban', 'user:impersonate',
    'user:set-role', 'user:set-password',
    
    // Session management
    'session:list', 'session:revoke', 'session:delete',
    
    // Limited system access
    'system:read',
    'plugin:read',
    'analytics:read', 'analytics:export',
    'settings:read',
    'audit:read'
  ]
}
```

**Capabilities:**
- ✅ User & session management
- ✅ Analytics & reporting
- ❌ System configuration
- ❌ Plugin management
- ✅ Cannot be deleted (system role)

### 3. Moderator (Level 25)
```typescript
{
  key: 'moderator',
  name: 'Moderator',
  level: 25,
  permissions: [
    'user:list', 'user:read', 'user:ban', 'user:unban',
    'session:list',
    'system:read',
    'analytics:read'
  ]
}
```

**Capabilities:**
- ✅ View users & ban/unban
- ✅ View sessions
- ❌ Delete users
- ❌ Change roles
- ✅ Cannot be deleted (system role)

### 4. User (Level 1)
```typescript
{
  key: 'user',
  name: 'User',
  level: 1,
  permissions: [
    'user:read:own', 'user:update:own',
    'session:list:own', 'session:revoke:own',
    'system:read',
    'analytics:read:org'
  ]
}
```

**Capabilities:**
- ✅ Manage own profile
- ✅ Manage own sessions
- ❌ View other users
- ❌ System operations
- ✅ Cannot be deleted (system role)

## 📝 Permission Structure

### Permission Key Format
```
{resource}:{action}[:{scope}]
```

Examples:
- `user:create` - Create user (scope: ALL)
- `user:read:own` - Read own user data (scope: OWN)
- `analytics:read:org` - Read organization analytics (scope: ORGANIZATION)

### Resources
- **user**: User management
- **session**: Session management
- **system**: System operations
- **plugin**: Plugin management
- **analytics**: Analytics & reports
- **settings**: System settings
- **audit**: Audit logs

### Actions
- **create**: Create new records
- **read/list**: View records
- **update**: Modify records
- **delete**: Remove records
- **ban/unban**: Ban/unban users
- **impersonate**: Act as another user
- **set-role**: Change user roles
- **activate/deactivate**: Toggle plugin status
- **export**: Export data
- **manage**: Full management

### Scopes
- **ALL**: Access to all records
- **OWN**: Only own records
- **ORGANIZATION**: Organization-scoped records

## 🔄 Permission Checking

### Check User Permission

```typescript
// Get user with roles and permissions
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    roles: {
      include: {
        permissions: true
      }
    }
  }
});

// Check if user has permission
function hasPermission(user, permissionKey: string): boolean {
  return user.roles.some(role =>
    role.permissions.some(p => p.key === permissionKey)
  );
}

// Usage
if (hasPermission(user, 'user:delete')) {
  // User can delete users
}
```

### Check via Better-auth API

```typescript
// Check permission via API
const hasPermission = await auth.api.userHasPermission({
  body: {
    userId: 'user-id',
    permissions: {
      user: ['delete', 'ban']
    }
  }
});

// Check by role
const hasPermission = await auth.api.userHasPermission({
  body: {
    role: 'admin',
    permissions: {
      user: ['impersonate']
    }
  }
});
```

## 🔧 CRUD Operations

### Create Custom Role

```typescript
// Create new role
const role = await prisma.role.create({
  data: {
    key: 'support-agent',
    name: 'Support Agent',
    description: 'Customer support role',
    level: 10,
    isSystemRole: false,
    status: 'ACTIVE'
  }
});

// Add permissions to role
await prisma.role.update({
  where: { id: role.id },
  data: {
    permissions: {
      connect: [
        { key: 'user:list' },
        { key: 'user:read' },
        { key: 'session:list' }
      ]
    }
  }
});
```

### Assign Role to User

```typescript
// Single role
await prisma.user.update({
  where: { id: userId },
  data: {
    roles: {
      connect: { key: 'admin' }
    }
  }
});

// Multiple roles
await prisma.user.update({
  where: { id: userId },
  data: {
    roles: {
      connect: [
        { key: 'admin' },
        { key: 'moderator' }
      ]
    }
  }
});
```

### Remove Permission from Role

```typescript
await prisma.role.update({
  where: { key: 'moderator' },
  data: {
    permissions: {
      disconnect: { key: 'user:ban' }
    }
  }
});
```

### Update Role Permissions

```typescript
// Replace all permissions
const permissions = await prisma.permission.findMany({
  where: {
    key: {
      in: ['user:list', 'user:read', 'session:list']
    }
  }
});

await prisma.role.update({
  where: { key: 'support-agent' },
  data: {
    permissions: {
      set: [], // Clear all
      connect: permissions.map(p => ({ id: p.id }))
    }
  }
});
```

## 🎯 Usage Examples

### Example 1: Check if User Can Ban

```typescript
// Method 1: Direct query
const user = await prisma.user.findFirst({
  where: {
    id: userId,
    roles: {
      some: {
        permissions: {
          some: {
            key: 'user:ban'
          }
        }
      }
    }
  }
});

const canBan = user !== null;

// Method 2: Load and check
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    roles: {
      include: { permissions: true }
    }
  }
});

const canBan = user?.roles.some(role =>
  role.permissions.some(p => p.key === 'user:ban')
) ?? false;
```

### Example 2: Get All Permissions for User

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    roles: {
      include: {
        permissions: {
          orderBy: { resource: 'asc' }
        }
      }
    }
  }
});

// Flatten and deduplicate
const allPermissions = [
  ...new Set(
    user?.roles.flatMap(role => 
      role.permissions.map(p => p.key)
    )
  )
];

// Group by resource
const grouped = user?.roles.flatMap(r => r.permissions)
  .reduce((acc, p) => {
    if (!acc[p.resource]) acc[p.resource] = [];
    acc[p.resource].push(p.action);
    return acc;
  }, {} as Record<string, string[]>);
```

### Example 3: Check Multiple Permissions

```typescript
const requiredPermissions = [
  'user:create',
  'user:delete',
  'session:revoke'
];

const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    roles: {
      include: { permissions: true }
    }
  }
});

const userPermissions = new Set(
  user?.roles.flatMap(r => r.permissions.map(p => p.key))
);

const hasAllPermissions = requiredPermissions.every(
  p => userPermissions.has(p)
);
```

## 🔒 Security Best Practices

### 1. Protect System Roles
```typescript
// Cannot delete system roles
if (role.isSystemRole) {
  throw new Error('Cannot delete system role');
}
```

### 2. Validate Permission Hierarchy
```typescript
// Lower level cannot assign higher level role
if (currentUser.maxRoleLevel < targetRole.level) {
  throw new Error('Insufficient permissions');
}
```

### 3. Audit Permission Changes
```typescript
await prisma.auditLog.create({
  data: {
    userId: adminId,
    action: 'ROLE_PERMISSION_CHANGED',
    resource: 'role',
    resourceId: roleId,
    metadata: {
      added: addedPermissions,
      removed: removedPermissions
    }
  }
});
```

## 📊 Seed Data

Run seed script:
```bash
cd apps/core

# Seed all
bun run prisma/seeds/index.ts

# Or seed only roles/permissions
bun run prisma/seeds/roles-permissions.seed.ts
```

Seed creates:
- ✅ 4 system roles (super-admin, admin, moderator, user)
- ✅ 45+ permissions across 7 resources
- ✅ All role-permission relationships

## 🔗 Related Files

- `prisma/schema.prisma` - Database schema
- `prisma/seeds/roles-permissions.seed.ts` - Seed script
- `src/auth/permissions.unified.ts` - Permission definitions
- `ACCESS_CONTROL_SUMMARY.md` - Overall architecture

## 📚 References

- [Prisma Many-to-Many Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations/many-to-many-relations)
- [Better-auth Admin Plugin](https://www.better-auth.com/docs/plugins/admin)
- [RBAC Design Patterns](https://auth0.com/docs/manage-users/access-control/rbac)
