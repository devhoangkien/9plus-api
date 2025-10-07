# Dynamic Permissions System

Hệ thống permissions động sử dụng database thay vì file static `permissions.ts` để quản lý quyền truy cập trong organization.

## 📋 Tổng quan

Thay vì sử dụng file `permissions.ts` với các role và permission cố định, hệ thống mới lưu trữ tất cả permissions trong database table `organizationRolePermission`. Điều này cho phép:

- ✅ Tạo và quản lý roles động tại runtime
- ✅ Tùy chỉnh permissions cho từng organization
- ✅ Dễ dàng thêm/sửa/xóa permissions mà không cần deploy code
- ✅ Audit trail cho tất cả thay đổi về permissions
- ✅ Tương thích với better-auth organization plugin

## 🗄️ Database Schema

### Table: `organizationRolePermission`

```prisma
model OrganizationRolePermission {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  role           String       // owner, admin, contentManager, moderator, member, viewer
  resource       String       // anime, episode, comment, user, etc.
  action         String       // create, read, update, delete, etc.
  description    String?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime?    @updatedAt

  @@unique([organizationId, role, resource, action])
  @@index([organizationId])
  @@index([role])
  @@index([resource, action])
  @@map("organizationRolePermission")
}
```

## 🎭 Default Roles

Hệ thống có 6 roles mặc định:

### 1. **Owner** - Quyền tối cao
- Full control trên tất cả resources
- Có thể quản lý organization, members, và tất cả content
- Có thể xóa organization

### 2. **Admin** - Quản trị viên
- Có thể quản lý content và users
- Không thể xóa organization hoặc thay đổi subscription settings
- Có thể tạo và quản lý roles khác

### 3. **Content Manager** - Quản lý nội dung
- Có thể tạo, cập nhật, và publish anime/episodes
- Có thể moderate comments
- Không thể quản lý users hoặc settings

### 4. **Moderator** - Kiểm duyệt
- Có thể moderate comments
- Có thể ban/unban users
- Chỉ có quyền read trên anime/episodes

### 5. **Member** - Thành viên
- Có thể xem content và tạo comments
- Có thể edit comments của mình
- Quyền hạn cơ bản

### 6. **Viewer** - Người xem
- Chỉ có quyền read-only
- Không thể tạo hoặc chỉnh sửa gì

## 📦 Resources và Actions

### Organization Resources (Better-auth defaults)
- `organization`: create, read, update, delete
- `member`: create, read, update, delete
- `invitation`: create, read, update, delete, cancel
- `team`: create, read, update, delete
- `ac` (access control): create, read, update, delete

### Custom Anime Platform Resources
- `anime`: create, read, update, delete, publish
- `episode`: create, read, update, delete, upload
- `comment`: create, read, update, delete, moderate
- `user`: read, update, ban, unban
- `subscription`: create, read, update, cancel
- `analytics`: read, export
- `settings`: read, update

## 🚀 Setup và Migration

### 1. Chạy Migration

```bash
cd apps/core
bun prisma migrate dev --name add-organization-role-permission
```

### 2. Generate Prisma Client

```bash
bun prisma generate
```

### 3. Seed Default Permissions

Seed cho tất cả organizations hiện có:

```bash
cd apps/core
bun run prisma/seeds/index.ts
```

Hoặc chỉ seed cho một organization cụ thể (trong code):

```typescript
import { seedOrganizationPermissions } from './prisma/seeds/permissions.seed';

await seedOrganizationPermissions('organization-id');
```

## 💻 Cách Sử dụng

### 1. Check Permission

```typescript
import { PermissionService } from './auth/permission.service';

const permissionService = new PermissionService();

// Check single permission
const canCreate = await permissionService.hasPermission(
  'org-id',
  'admin',
  'anime',
  'create'
);

// Check với multiple roles
const canModerate = await permissionService.hasPermission(
  'org-id',
  ['moderator', 'admin'],
  'comment',
  'moderate'
);
```

### 2. Get Role Permissions

```typescript
// Get all permissions for a role
const permissions = await permissionService.getRolePermissions(
  'org-id',
  'admin'
);

// Result:
// {
//   anime: ['create', 'read', 'update', 'delete', 'publish'],
//   episode: ['create', 'read', 'update', 'delete', 'upload'],
//   ...
// }
```

### 3. Create Custom Role

```typescript
await permissionService.createRole(
  'org-id',
  'custom-role',
  {
    anime: ['read', 'update'],
    comment: ['read', 'moderate'],
  }
);
```

### 4. Update Role

```typescript
await permissionService.updateRole(
  'org-id',
  'custom-role',
  {
    anime: ['read', 'update', 'publish'], // Added publish
    comment: ['read', 'moderate'],
  }
);
```

### 5. Delete Role

```typescript
await permissionService.deleteRole('org-id', 'custom-role');
```

### 6. List All Roles

```typescript
const roles = await permissionService.listRoles('org-id');
// ['owner', 'admin', 'contentManager', 'moderator', 'member', 'viewer', 'custom-role']
```

## 🔄 Auto-seeding

Khi một organization mới được tạo, hệ thống tự động seed default permissions:

```typescript
// In auth.config.ts
organizationHooks: {
  async afterCreateOrganization({ organization, member, user }) {
    // Automatically seed default permissions
    await seedOrganizationPermissions(organization.id);
  }
}
```

## 🎯 Better-auth Integration

Hệ thống tương thích hoàn toàn với better-auth organization plugin:

```typescript
// Check permission via better-auth
await auth.api.hasPermission({
  headers: await headers(),
  body: {
    permissions: {
      anime: ['create'],
      episode: ['upload'],
    },
  },
});

// Create dynamic role via better-auth
await authClient.organization.createRole({
  role: 'custom-editor',
  permission: {
    anime: ['read', 'update'],
    episode: ['read', 'update'],
  },
  organizationId: 'org-id',
});
```

## 🛡️ Guards và Decorators (Tương lai)

Có thể tạo custom decorators cho NestJS:

```typescript
// Example future implementation
@RequirePermission('anime', 'create')
@Post('anime')
async createAnime(@Body() data: CreateAnimeDto) {
  // ...
}
```

## 📝 Script Commands

Thêm vào `package.json`:

```json
{
  "scripts": {
    "seed:permissions": "bun run prisma/seeds/index.ts",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate"
  }
}
```

## 🔍 Query Examples

### Get all permissions in an organization

```typescript
const allPermissions = await permissionService.getAllOrganizationPermissions('org-id');

// Result grouped by role:
// {
//   owner: {
//     anime: ['create', 'read', 'update', 'delete', 'publish'],
//     ...
//   },
//   admin: {
//     anime: ['create', 'read', 'update', 'delete', 'publish'],
//     ...
//   }
// }
```

### Add single permission

```typescript
await permissionService.addPermission(
  'org-id',
  'viewer',
  'comment',
  'create',
  'Allow viewers to create comments'
);
```

### Remove single permission

```typescript
await permissionService.removePermission(
  'org-id',
  'member',
  'anime',
  'create'
);
```

## ⚠️ Important Notes

1. **Migration Required**: Phải chạy migration trước khi sử dụng
2. **Seed Data**: Chạy seed script để tạo default permissions
3. **Organization Creation**: Default permissions tự động được tạo khi organization mới được tạo
4. **Role Names**: Phải match với better-auth role names
5. **Cascade Delete**: Khi xóa organization, tất cả permissions cũng bị xóa

## 🔗 Related Files

- `prisma/schema.prisma` - Database schema
- `prisma/seeds/permissions.seed.ts` - Seed data script
- `src/auth/permissions.dynamic.ts` - Helper functions
- `src/auth/permission.service.ts` - Service class
- `src/auth/auth.config.ts` - Better-auth configuration

## 📚 References

- [Better-auth Organization Plugin](https://www.better-auth.com/docs/plugins/organization)
- [Better-auth Custom Permissions](https://www.better-auth.com/docs/plugins/organization#custom-permissions)
- [Better-auth Dynamic Access Control](https://www.better-auth.com/docs/plugins/organization#dynamic-access-control)
