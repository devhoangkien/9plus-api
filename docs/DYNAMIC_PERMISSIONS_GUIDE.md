# Dynamic Permissions System Guide

## 🎯 Overview

Hệ thống permissions của AninePlus API đã chuyển từ **static permissions** (định nghĩa trong code) sang **dynamic permissions** (quản lý trong database). Điều này cho phép linh hoạt hơn trong việc quản lý quyền hạn mà không cần thay đổi code.

## 📊 Architecture

### Two-Level Permission System

#### 1️⃣ **Global/System Level** (Admin Plugin)
Quản lý quyền hạn toàn hệ thống qua các bảng:
- `roles` - System-wide roles (super-admin, admin, moderator, user)
- `permissions` - System-wide permissions (user:*, session:*, system:*, etc.)
- Many-to-Many relationship qua implicit join table

**Use Cases:**
- User management (create, ban, impersonate)
- System configuration
- Plugin management
- Global analytics
- Audit logs

#### 2️⃣ **Organization Level** (Organization Plugin)
Quản lý quyền hạn cấp organization qua bảng:
- `organizationRolePermission` - Dynamic role permissions per organization

**Use Cases:**
- Content management (anime, episodes)
- Member management
- Organization-specific settings
- Organization analytics

## 🗂️ Database Schema

### Global Roles & Permissions
```prisma
model Role {
  id           String       @id @default(cuid())
  key          String       @unique
  name         String
  level        Int          // Hierarchy: 100 = super-admin, 1 = user
  isSystemRole Boolean      // Can't be deleted
  status       RoleStatusEnum
  permissions  Permission[] @relation("RolePermissions")
  users        User[]       @relation("UserRoles")
}

model Permission {
  id       String    @id @default(cuid())
  key      String    @unique
  resource String    // user, session, system, plugin, etc.
  action   String    // create, read, update, delete, etc.
  scope    String    // ALL, OWN, ORGANIZATION
  status   PermissionStatusEnum
  roles    Role[]    @relation("RolePermissions")
}
```

### Organization Permissions
```prisma
model OrganizationRolePermission {
  id             String       @id @default(cuid())
  organizationId String
  role           String       // owner, admin, contentManager, etc.
  resource       String       // anime, episode, comment, etc.
  action         String       // create, read, update, delete, etc.
  description    String?
  conditions     Json?        // For ABAC (Attribute-Based Access Control)
}
```

## 🌱 Seeding Data

### Run Seeds
```bash
cd apps/core

# Seed all
bun run seed

# Seed only global roles & permissions
bun run seed:roles

# Seed only organizations & org permissions
bun run seed:orgs
```

### Seed Data Includes

#### Global Level
- **4 Roles**: super-admin (100), admin (50), moderator (25), user (1)
- **45+ Permissions**: 
  - User: create, list, read, update, delete, ban, unban, impersonate, set-role
  - Session: list, revoke, delete
  - System: read, update, configure, maintain
  - Plugin: create, read, update, delete, activate, deactivate
  - Analytics: read, export, manage
  - Settings: read, update
  - Audit: read, export
- **180+ Role-Permission Relationships**

#### Organization Level
- **3 Sample Organizations**
- **6 Roles per Org**: owner, admin, contentManager, moderator, member, viewer
- **126 Permissions per Org** across resources:
  - organization, member, invitation, team, ac
  - anime, episode, comment, user
  - subscription, analytics, settings

## 🔧 Usage

### 1. Check Global Permission (Admin Plugin)

```typescript
import { RolePermissionService } from './permissions/role-permission.service';

const rolePermService = new RolePermissionService();

// Check if user has permission
const canManageUsers = await rolePermService.userHasPermission(
  userId,
  'user:update'
);

// Get all user permissions
const permissions = await rolePermService.getUserPermissions(userId);

// Check role
const isAdmin = await rolePermService.userHasRole(userId, 'admin');
```

### 2. Check Organization Permission

```typescript
import { checkOrganizationPermission } from './permissions/permissions.dynamic';

// Check if user can publish anime in their org
const canPublish = await checkOrganizationPermission(
  organizationId,
  userRole, // 'owner', 'admin', 'contentManager', etc.
  'anime',
  'publish'
);
```

### 3. Assign Roles

```typescript
// Assign global role
await rolePermService.assignRoleToUser(userId, 'admin');

// Assign multiple roles
await rolePermService.assignRolesToUser(userId, ['admin', 'moderator']);
```

### 4. Create Custom Organization Role

```typescript
import { createOrganizationRole } from './permissions/permissions.dynamic';

await createOrganizationRole(
  organizationId,
  'customEditor',
  {
    anime: ['read', 'update'],
    episode: ['read', 'update', 'create']
  }
);
```

### 5. Add Permission to Role

```typescript
// Add global permissions
await rolePermService.addPermissionsToRole(
  'moderator',
  ['comment:moderate', 'user:ban']
);

// Set all permissions (replaces existing)
await rolePermService.setRolePermissions(
  'customRole',
  ['anime:read', 'anime:update']
);
```

## 📝 Better-Auth Configuration

File `src/auth/auth.config.ts` đã được cấu hình để sử dụng dynamic permissions:

```typescript
export const auth = betterAuth({
  // ...
  plugins: [
    admin({
      // Using database-driven permissions
      adminRoles: ['super-admin', 'admin'],
      defaultRole: 'user',
    }),
    
    organization({
      // Dynamic permissions từ database
      dynamicAccessControl: {
        enabled: true,
        maximumRolesPerOrganization: async (orgId) => 50,
      },
      creatorRole: 'owner',
      
      // Auto-seed permissions on org creation
      organizationHooks: {
        async afterCreateOrganization({ organization }) {
          await seedOrganizationPermissions(organization.id);
        },
      },
    }),
  ],
});
```

## 🎨 Migration from Static to Dynamic

### ❌ Old Way (Static - Removed)
```typescript
// ❌ Không dùng nữa
import { ac, roles } from './permissions.unified';

admin({
  ac: ac.global,
  roles: roles.global,
});
```

### ✅ New Way (Dynamic - Current)
```typescript
// ✅ Dùng database
import { RolePermissionService } from './permissions/role-permission.service';

const service = new RolePermissionService();
const hasPermission = await service.userHasPermission(userId, 'user:update');
```

## 🚀 Benefits

### 1. **Flexibility**
- Tạo custom roles runtime mà không cần deploy code
- Thay đổi permissions mà không restart server

### 2. **Multi-tenancy**
- Mỗi organization có thể có permission structure khác nhau
- Không bị giới hạn bởi static roles

### 3. **Scalability**
- Dễ dàng thêm resources và actions mới
- Không cần maintain static permission files

### 4. **Auditability**
- Tất cả thay đổi được lưu trong database
- Có thể track history qua timestamps

### 5. **Admin UI Ready**
- Có thể build admin panel để quản lý roles/permissions
- CRUD operations qua services

## 📚 Related Documentation

- [ROLE_PERMISSION_SYSTEM.md](./ROLE_PERMISSION_SYSTEM.md) - Chi tiết về hệ thống global roles
- [ORGANIZATION_SEEDING.md](./ORGANIZATION_SEEDING.md) - Chi tiết về organization permissions
- [COMPLETE_ACCESS_CONTROL.md](./COMPLETE_ACCESS_CONTROL.md) - Implementation guide đầy đủ

## 🔍 Troubleshooting

### Issue: Permissions not working after seed
**Solution**: Generate Prisma client và restart server
```bash
cd apps/core
bunx prisma generate
bun run dev
```

### Issue: User has no permissions
**Solution**: Assign role to user
```typescript
await rolePermService.assignRoleToUser(userId, 'user');
```

### Issue: Organization has no permissions
**Solution**: Run organization seed
```typescript
await seedOrganizationPermissions(organizationId);
```

## 🎯 Next Steps

1. ✅ Static permissions removed
2. ✅ Dynamic permissions implemented
3. ✅ Seed scripts created
4. ⏳ Build admin UI for permission management
5. ⏳ Implement caching layer (Redis)
6. ⏳ Create NestJS Guards/Decorators
7. ⏳ Add permission audit logs
8. ⏳ Implement ABAC with conditions field

## 💡 Best Practices

1. **Always use services** - Không query database trực tiếp
2. **Cache permissions** - Implement Redis cache cho performance
3. **Validate role hierarchy** - Check role level trước khi grant permissions
4. **Use transactions** - Khi update multiple permissions
5. **Audit changes** - Log tất cả permission changes
6. **Test thoroughly** - Write integration tests cho permission checks

---

📌 **Important**: File `permissions.ts` và `permissions.unified.ts` đã được xóa vì không còn cần thiết với dynamic permission system.
