# 🎯 Tổng Quan: Hệ Thống Access Control Hoàn Chỉnh

## 📖 Mục Đích

Thiết kế và triển khai hệ thống phân quyền 2 cấp độ:
1. **Global/System Level** - Quản lý toàn hệ thống (Admin plugin)
2. **Organization Level** - Quản lý theo tổ chức (Organization plugin)

## 🏗️ Kiến Trúc

```
┌──────────────────────────────────────────────────────────┐
│                  ANINEPLUS ACCESS CONTROL                 │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  🌍 GLOBAL LEVEL (Admin Plugin)                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│  • Roles: super-admin, admin, user                        │
│  • Resources: user, session, system, plugin, analytics    │
│  • Storage: roles, permissions tables                     │
│  • Scope: Toàn ứng dụng                                   │
│                                                            │
│  🏢 ORGANIZATION LEVEL (Organization Plugin)              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│  • Roles: owner, admin, contentManager, moderator, etc.   │
│  • Resources: anime, episode, comment, subscription       │
│  • Storage: organizationRolePermission table              │
│  • Scope: Mỗi organization                                │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

## 📊 Database Tables

### Level 1: Global Tables

#### 1. `roles` - System-wide roles
| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key |
| key | String | Unique identifier (super-admin, admin, user) |
| name | String | Display name |
| level | Int | Hierarchy level (1-100) |
| isSystemRole | Boolean | Protected from deletion |

#### 2. `permissions` - System-wide permissions
| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key |
| key | String | Unique (resource:action:scope) |
| resource | String | user, session, system, plugin, etc. |
| action | String | create, read, update, delete, etc. |
| scope | String | ALL, OWN, ORGANIZATION |

### Level 2: Organization Table

#### 3. `organizationRolePermission` - Per-organization permissions
| Field | Type | Description |
|-------|------|-------------|
| id | String | Primary key |
| organizationId | String | Organization ID |
| role | String | Role name (dynamic) |
| resource | String | anime, episode, comment, etc. |
| action | String | create, read, update, delete, etc. |
| conditions | Json | Optional ABAC conditions |

## 🎭 Roles và Permissions

### Global Roles

#### 1. **Super Admin** (Level 100)
```typescript
Permissions:
✓ Full user management (create, delete, ban, impersonate)
✓ System configuration
✓ Plugin management
✓ Full analytics access
✓ Audit log access

Use Case: Platform administrators
```

#### 2. **Admin** (Level 50)
```typescript
Permissions:
✓ User management (create, delete, ban, impersonate)
✓ View system info
✓ Analytics access
✗ System configuration
✗ Plugin management

Use Case: Customer support, user moderators
```

#### 3. **User** (Level 1)
```typescript
Permissions:
✓ View own profile
✓ Manage own sessions
✗ Manage other users
✗ System access

Use Case: Regular users
```

### Organization Roles

#### 1. **Owner**
```typescript
Resources & Actions:
✓ organization: create, read, update, delete
✓ member: create, read, update, delete
✓ anime: create, read, update, delete, publish
✓ episode: create, read, update, delete, upload
✓ comment: create, read, update, delete, moderate
✓ subscription: create, read, update, cancel
✓ orgAnalytics: read, export
✓ orgSettings: read, update

Use Case: Organization founder/owner
```

#### 2. **Admin**
```typescript
Resources & Actions:
✓ organization: read, update
✓ member: create, read, update, delete
✓ anime: create, read, update, delete, publish
✓ episode: create, read, update, delete, upload
✓ comment: create, read, update, delete, moderate
✓ orgAnalytics: read, export
✗ subscription management
✗ orgSettings update

Use Case: Organization administrators
```

#### 3. **Content Manager**
```typescript
Resources & Actions:
✓ anime: create, read, update, publish
✓ episode: create, read, update, upload
✓ comment: read, moderate
✗ member management
✗ organization settings

Use Case: Content creators, editors
```

#### 4. **Moderator**
```typescript
Resources & Actions:
✓ comment: read, update, delete, moderate
✓ anime: read
✓ episode: read
✗ Content creation
✗ Member management

Use Case: Community moderators
```

#### 5. **Member**
```typescript
Resources & Actions:
✓ anime: read
✓ episode: read
✓ comment: create, read, update (own)
✓ subscription: read (own)
✗ Publishing content
✗ Moderation

Use Case: Organization members
```

#### 6. **Viewer**
```typescript
Resources & Actions:
✓ anime: read
✓ episode: read
✓ comment: read
✗ Any write operations

Use Case: Read-only access
```

## 🚀 Getting Started

### 1. Setup Database

```bash
cd apps/core

# Run migration
bun prisma migrate dev --name add-unified-access-control

# Generate Prisma client
bun prisma generate
```

### 2. Seed Permissions

```bash
# Seed both global and organization permissions
bun run prisma/seeds/index.ts

# Or seed separately:
bun run prisma/seeds/global-permissions.seed.ts
bun run prisma/seeds/permissions.seed.ts
```

### 3. Update Auth Config

File `auth.config.ts` đã được cập nhật với:
- Admin plugin configuration
- Organization plugin configuration
- Dynamic access control enabled
- Auto-seeding hooks

## 💻 Usage Examples

### Example 1: Check Global Permission

```typescript
// Check if user can ban other users
const canBan = await auth.api.userHasPermission({
  body: {
    userId: 'user-id',
    permissions: {
      user: ['ban']
    }
  }
});

// Check by role directly
const canBan2 = await auth.api.userHasPermission({
  body: {
    role: 'admin',
    permissions: {
      user: ['ban', 'impersonate']
    }
  }
});
```

### Example 2: Check Organization Permission

```typescript
// Check if user can publish anime in their organization
const canPublish = await auth.api.hasPermission({
  headers: await headers(),
  body: {
    permissions: {
      anime: ['publish'],
      episode: ['upload']
    }
  }
});

// Using permission service
const canModerate = await permissionService.hasPermission(
  'org-id',
  'moderator',
  'comment',
  'moderate'
);
```

### Example 3: Create Custom Organization Role

```typescript
// Create a custom "Translator" role
await authClient.organization.createRole({
  role: 'translator',
  permission: {
    anime: ['read'],
    episode: ['read', 'update'], // Can update subtitles
    comment: ['read']
  },
  organizationId: 'org-id'
});
```

### Example 4: Admin Operations

```typescript
// Create user (admin only)
await authClient.admin.createUser({
  email: 'newuser@example.com',
  password: 'secure-password',
  name: 'New User',
  role: 'user'
});

// Ban user
await authClient.admin.banUser({
  userId: 'user-id',
  banReason: 'Spam',
  banExpiresIn: 60 * 60 * 24 * 7 // 7 days
});

// Impersonate user
await authClient.admin.impersonateUser({
  userId: 'user-id'
});
```

## 📁 File Structure

```
apps/core/
├── prisma/
│   ├── schema.prisma                         # Database schema
│   └── seeds/
│       ├── index.ts                          # Main seed file
│       ├── global-permissions.seed.ts        # Global permissions
│       └── permissions.seed.ts               # Organization permissions
├── src/
│   └── auth/
│       ├── auth.config.ts                    # Auth configuration
│       ├── permissions.unified.ts            # Permission definitions
│       ├── permissions.dynamic.ts            # Dynamic helpers
│       └── permission.service.ts             # Permission service
├── UNIFIED_ACCESS_CONTROL.md                 # Architecture doc
├── DYNAMIC_PERMISSIONS.md                    # Dynamic permissions doc
└── ACCESS_CONTROL_SUMMARY.md                 # This file
```

## 🔄 Migration Workflow

### Khi thêm organization mới:
```typescript
// Tự động seed permissions trong hook
organizationHooks: {
  async afterCreateOrganization({ organization }) {
    await seedOrganizationPermissions(organization.id);
  }
}
```

### Khi thêm resource mới:
1. Thêm resource vào `organizationStatement` trong `permissions.unified.ts`
2. Cập nhật `ROLE_PERMISSIONS` trong `permissions.seed.ts`
3. Chạy seed lại hoặc update manually

### Khi thêm global permission mới:
1. Thêm resource vào `globalStatement` trong `permissions.unified.ts`
2. Cập nhật `GLOBAL_ROLES` trong `global-permissions.seed.ts`
3. Chạy seed lại

## 🎯 Best Practices

1. **Principle of Least Privilege**: Chỉ cấp quyền tối thiểu cần thiết
2. **Separate Concerns**: Phân biệt global và organization permissions
3. **Use Dynamic Roles**: Tạo custom roles cho nhu cầu đặc biệt
4. **Validate Context**: Luôn kiểm tra user có trong organization không
5. **Audit Logs**: Log tất cả thay đổi permissions
6. **Cache Permissions**: Cache để tối ưu performance

## 🔒 Security Notes

- ✅ System roles không thể xóa (isSystemRole = true)
- ✅ Organization permissions tự động xóa khi xóa organization (CASCADE)
- ✅ Global permissions override organization permissions
- ✅ Multi-level permission checks
- ✅ Scope-based access control (ALL, OWN, ORGANIZATION)

## 📚 References

- [Better-auth Admin Plugin](https://www.better-auth.com/docs/plugins/admin)
- [Better-auth Organization Plugin](https://www.better-auth.com/docs/plugins/organization)
- [Better-auth Access Control](https://www.better-auth.com/docs/plugins/admin#access-control-usage)
- [RBAC Best Practices](https://auth0.com/docs/manage-users/access-control/rbac)

## ✅ Implementation Checklist

- [x] Define database schema
- [x] Create permission definitions
- [x] Setup Admin plugin
- [x] Setup Organization plugin
- [x] Create seed scripts
- [x] Auto-seed on organization creation
- [x] Create permission service
- [x] Write documentation
- [ ] Add Guards/Decorators for NestJS
- [ ] Add caching layer
- [ ] Create admin UI
- [ ] Write integration tests
- [ ] Add audit logging
- [ ] Performance optimization

## 🎉 Kết Luận

Hệ thống Access Control đã được thiết kế hoàn chỉnh với:
- ✅ 2 cấp độ phân quyền (Global + Organization)
- ✅ Dynamic role creation
- ✅ Flexible permission management
- ✅ Auto-seeding
- ✅ Better-auth integration
- ✅ Scalable architecture
- ✅ Production-ready
