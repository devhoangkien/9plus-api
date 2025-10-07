# Dynamic Permission System - Final Architecture

## 🎯 Overview

The permission system has been refactored to use **100% database-driven dynamic permissions** instead of static permission files. All permissions are now managed through seed data and services.

## 📁 File Structure

```
apps/core/src/permissions/
├── index.ts                              # Barrel exports
├── permissions.dynamic.ts                # Better-auth AC config (minimal)
├── role-permission.service.ts            # Global permissions (Admin plugin)
└── organization-permission.service.ts    # Organization permissions (NEW)

apps/core/prisma/seeds/
├── index.ts                              # Main seed orchestrator
├── roles-permissions.seed.ts             # Global roles & permissions
└── organizations.seed.ts                 # Organizations & org permissions
```

## 🗑️ Removed Files

The following static permission files have been **removed** in favor of database-driven approach:

- ❌ `src/permissions/permissions.ts` - Replaced by seed data
- ❌ `src/permissions/permissions.unified.ts` - Replaced by seed data
- ❌ `src/auth/permission.service.ts` - Consolidated into new services

## 🔧 Core Components

### 1. `permissions.dynamic.ts` (Minimal)

**Purpose**: Only exports configuration needed by better-auth plugins

```typescript
// What it exports:
export const statement = { ... };  // Resource definitions
export const ac = createAccessControl(statement);  // AC instance
export type Roles = 'owner' | 'admin' | ...;  // Type definitions
```

**What it NO LONGER does**:
- ❌ Database operations (moved to services)
- ❌ Permission checking logic (moved to services)
- ❌ Role management (moved to services)

### 2. `RolePermissionService` (Global Level)

**Purpose**: Manages system-wide roles and permissions (Admin plugin)

```typescript
// Key methods:
- userHasPermission(userId, permissionKey)
- getUserPermissions(userId)
- assignRoleToUser(userId, roleKey)
- createRole(data)
- addPermissionsToRole(roleKey, permissionKeys)
```

**Database Tables**:
- `roles` - System roles (super-admin, admin, moderator, user)
- `permissions` - System permissions
- `_RolePermissions` - Many-to-many join table

### 3. `OrganizationPermissionService` (Organization Level - NEW)

**Purpose**: Manages organization-specific permissions dynamically

```typescript
// Key methods:
- checkPermission(orgId, userRole, resource, action)
- getRolePermissions(orgId, role)
- createRole(orgId, roleName, permissions)
- updateRole(orgId, roleName, permissions)
- listRoles(orgId)
- getAllOrganizationPermissions(orgId)
```

**Database Table**:
- `organizationRolePermission` - Dynamic org permissions

## 🌱 Seed Data System

### Global Level Seeding

```bash
bun run seed:roles  # Seeds 4 roles, 45+ permissions
```

Creates:
- **4 System Roles**: super-admin, admin, moderator, user
- **45+ Permissions**: user:*, session:*, system:*, plugin:*, etc.
- **180+ Role-Permission Relationships**

### Organization Level Seeding

```bash
bun run seed:orgs  # Seeds 3 orgs with permissions
```

Creates per organization:
- **6 Roles**: owner, admin, contentManager, moderator, member, viewer
- **12 Resources**: anime, episode, comment, user, subscription, etc.
- **126 Permissions per Organization**

## 📊 Data Flow

### Global Permission Check (Admin Plugin)

```
User → RolePermissionService → Database (roles, permissions)
  ↓
Check: User has role? → Role has permission?
  ↓
Return: true/false
```

### Organization Permission Check (Organization Plugin)

```
User → Member of Org → OrganizationPermissionService → Database
  ↓                     ↓
Get user's role    Check: organizationRolePermission table
  ↓
Return: true/false
```

## 🔌 Better-Auth Integration

### auth.config.ts Configuration

```typescript
import { ac } from '../permissions/permissions.dynamic';

export const auth = betterAuth({
  plugins: [
    organization({
      ac: ac,  // ← Only needs the AC instance
      // Roles are now managed dynamically via seed data
      dynamicAccessControl: {
        enabled: true,
        maximumRolesPerOrganization: async () => 50,
      },
    }),
  ],
});
```

**Key Changes**:
- ✅ Uses minimal `ac` instance from `permissions.dynamic.ts`
- ✅ No static role definitions needed
- ✅ All roles come from database
- ✅ Auto-seeds on organization creation

## 💡 Usage Examples

### Check Global Permission

```typescript
import { RolePermissionService } from './permissions';

const rolePermService = new RolePermissionService();

// Check if user can manage users
const canManage = await rolePermService.userHasPermission(
  userId,
  'user:manage'
);
```

### Check Organization Permission

```typescript
import { OrganizationPermissionService } from './permissions';

const orgPermService = new OrganizationPermissionService();

// Check if user can publish anime in their organization
const canPublish = await orgPermService.checkPermission(
  organizationId,
  userRole,  // from member.role
  'anime',
  'publish'
);
```

### Create Custom Organization Role

```typescript
// Create a custom "Editor" role
await orgPermService.createRole(
  organizationId,
  'editor',
  {
    anime: ['read', 'update'],
    episode: ['read', 'update', 'create'],
    comment: ['read', 'moderate'],
  },
  'Custom editor role with limited permissions'
);
```

### Update Role Permissions

```typescript
// Update admin role - add analytics export
await orgPermService.addPermissionsToRole(
  organizationId,
  'admin',
  {
    analytics: ['export'],
  }
);
```

## 🎨 Benefits of This Architecture

### ✅ Advantages

1. **Dynamic & Flexible**
   - Create custom roles at runtime
   - Per-organization permission customization
   - No code changes needed for new roles

2. **Database-Driven**
   - All permissions in one place
   - Easy to query and audit
   - Version controlled via migrations

3. **Clean Separation**
   - Global vs Organization level clear
   - Services handle all logic
   - Better-auth config minimal

4. **Scalable**
   - Handles unlimited organizations
   - Each org can have different permission sets
   - No performance impact

5. **Maintainable**
   - Less code to maintain
   - Services are testable
   - Clear responsibility boundaries

### ❌ What We Removed

1. **Static Permission Files**
   - No more hardcoded roles
   - No more static permission arrays
   - No more duplicate definitions

2. **Scattered Logic**
   - Consolidated into services
   - No helper functions floating around
   - Single source of truth

3. **Complexity**
   - Removed unified permission system
   - Simplified better-auth config
   - Cleaner file structure

## 📝 Migration Notes

### For Existing Code

If you have code importing from removed files:

```typescript
// ❌ OLD - No longer works
import { ac, roles } from './permissions.unified';
import { checkOrganizationPermission } from './permissions.dynamic';

// ✅ NEW - Use services
import { RolePermissionService, OrganizationPermissionService } from './permissions';

const rolePermService = new RolePermissionService();
const orgPermService = new OrganizationPermissionService();
```

### For Auth Config

```typescript
// ❌ OLD
import { ac, roles } from './permissions.unified';
plugins: [
  organization({ ac: ac.organization, roles: roles.organization })
]

// ✅ NEW
import { ac } from '../permissions/permissions.dynamic';
plugins: [
  organization({ ac: ac, /* roles from database */ })
]
```

## 🚀 Next Steps

1. **Run Migrations**
   ```bash
   cd apps/core
   bunx prisma db push
   bunx prisma generate
   ```

2. **Seed Database**
   ```bash
   bun run seed
   ```

3. **Update Imports**
   - Replace old permission imports with service imports
   - Update auth guards to use services

4. **Create Guards** (TODO)
   - `@RequireGlobalPermission()` decorator
   - `@RequireOrgPermission()` decorator
   - Permission checking middleware

5. **Add Caching** (TODO)
   - Cache user permissions in Redis
   - TTL-based invalidation
   - Improve performance

## 📚 Related Documentation

- [ROLE_PERMISSION_SYSTEM.md](../ROLE_PERMISSION_SYSTEM.md) - Global permission details
- [ORGANIZATION_SEEDING.md](../ORGANIZATION_SEEDING.md) - Organization setup guide
- [COMPLETE_ACCESS_CONTROL.md](../COMPLETE_ACCESS_CONTROL.md) - Full implementation guide

## ✅ Summary

**Before**: Static files, scattered logic, duplicate code  
**After**: Database-driven, service-based, clean architecture

All permission logic is now in **2 services**:
- `RolePermissionService` - Global permissions
- `OrganizationPermissionService` - Organization permissions

Better-auth only needs:
- `ac` instance from `permissions.dynamic.ts`
- Everything else comes from database via services

**Result**: Cleaner, more maintainable, fully dynamic permission system! 🎉
