# Organization & Permission Seeding Guide

## Overview

This guide covers the organization and organization permission seeding system for AninePlus API. The system creates sample organizations with complete role-based permission structures.

## Architecture

### Two-Level Permission System

1. **Global Level** (Admin Plugin)
   - System-wide roles: `super-admin`, `admin`, `moderator`, `user`
   - Global permissions: User management, system settings, etc.
   - Stored in: `Role` and `Permission` tables

2. **Organization Level** (Organization Plugin)
   - Organization-specific roles: `owner`, `admin`, `contentManager`, `moderator`, `member`, `viewer`
   - Organization permissions: Anime management, episode uploads, comment moderation, etc.
   - Stored in: `OrganizationRolePermission` table

## Database Schema

### Organization Table
```prisma
model Organization {
  id                          String                       @id
  name                        String
  slug                        String                       @unique
  logo                        String?
  createdAt                   DateTime
  metadata                    String?
  organizationRolePermissions OrganizationRolePermission[]
  members                     Member[]
  invitations                 Invitation[]
  teams                       Team[]
}
```

### OrganizationRolePermission Table
```prisma
model OrganizationRolePermission {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  role           String       // owner, admin, contentManager, moderator, member, viewer
  resource       String       // anime, episode, comment, member, etc.
  action         String       // create, read, update, delete, publish, etc.
  description    String?
  conditions     Json?        // Advanced ABAC conditions
  createdAt      DateTime     @default(now())
  updatedAt      DateTime?    @updatedAt

  @@unique([organizationId, role, resource, action])
  @@index([organizationId])
  @@index([organizationId, role])
}
```

## Sample Organizations

The seed script creates three sample organizations:

### 1. AninePlus Main
- **Slug**: `anineplus-main`
- **Type**: Enterprise
- **Features**: Full platform (anime, episodes, comments, analytics)
- **Use Case**: Primary production organization

### 2. Demo Animation Studio
- **Slug**: `demo-studio`
- **Type**: Professional
- **Features**: Content creation (anime, episodes)
- **Use Case**: Content studio with limited features

### 3. Test Community
- **Slug**: `test-community`
- **Type**: Basic
- **Features**: Community features (comments only)
- **Use Case**: Testing and development

## Organization Roles & Permissions

### Role Hierarchy

```
owner (Full Control)
  └─ admin (Management)
      └─ contentManager (Content Operations)
          └─ moderator (Moderation)
              └─ member (Basic Access)
                  └─ viewer (Read-Only)
```

### Permission Matrix

#### Resources
- `organization` - Organization settings
- `member` - Member management
- `invitation` - Invitation management
- `team` - Team management
- `ac` - Access control
- `anime` - Anime content
- `episode` - Episodes
- `comment` - Comments
- `user` - User management
- `subscription` - Subscriptions
- `analytics` - Analytics data
- `settings` - Organization settings

#### Actions
- `create` - Create new resources
- `read` - View resources
- `update` - Modify existing resources
- `delete` - Remove resources
- `publish` - Publish content (anime)
- `upload` - Upload files (episodes)
- `moderate` - Moderate content (comments)
- `ban/unban` - Ban/unban users
- `cancel` - Cancel operations (invitations, subscriptions)
- `export` - Export data (analytics)

### Detailed Role Permissions

#### Owner
**Full access to all resources and actions (47 permissions)**
- All organization management
- All member and invitation controls
- All team management
- Complete access control management
- Full anime and episode control
- Complete comment moderation
- User management (ban/unban)
- Subscription management
- Analytics access and export
- Settings management

#### Admin
**Administrative access excluding organization deletion (38 permissions)**
- Organization read/update (no delete)
- Full member and invitation management
- Full team management
- Access control read-only
- Full anime and episode management
- Comment moderation
- User management
- Subscription read-only
- Analytics access and export
- Settings management

#### Content Manager
**Content creation and management (16 permissions)**
- Organization read-only
- Member and team read-only
- Full anime and episode management
- Comment moderation (read/moderate)
- Analytics read-only

#### Moderator
**Moderation and monitoring (11 permissions)**
- Organization and member read-only
- Anime and episode read-only
- Full comment moderation
- User ban/unban capabilities

#### Member
**Basic participation (9 permissions)**
- Organization and member read-only
- Team read-only
- Anime and episode read-only
- Comment CRUD (own comments only)

#### Viewer
**Read-only access (5 permissions)**
- Organization and member read-only
- Anime and episode read-only
- Comment read-only

## Seed Files

### Main Files

1. **`organizations.seed.ts`** - Organization and permission seeding
   - Creates sample organizations
   - Seeds all role permissions for each organization
   - Provides auto-seeding function for new organizations

2. **`index.ts`** - Main seed orchestrator
   - Runs global role/permission seeding
   - Runs organization seeding
   - Provides execution summary

### File Structure
```
apps/core/prisma/seeds/
├── index.ts                      # Main seed entry point
├── roles-permissions.seed.ts     # Global roles/permissions (Admin plugin)
├── organizations.seed.ts         # Organizations & permissions (NEW)
└── permissions.seed.ts           # Organization permission utilities
```

## Running Seeds

### Full Database Seeding
```bash
cd apps/core
bun run prisma/seeds/index.ts
```

This will:
1. Seed global roles and permissions
2. Create sample organizations
3. Seed all organization permissions

### Individual Organization Seeding
```bash
cd apps/core
bun run prisma/seeds/organizations.seed.ts
```

### Reset and Re-seed
```bash
cd apps/core
bunx prisma migrate reset --force
bun run prisma/seeds/index.ts
```

## Auto-Seeding for New Organizations

The seed file exports a `seedSingleOrganization()` function for auto-seeding:

```typescript
import { seedSingleOrganization } from './prisma/seeds/organizations.seed';

// In your organization creation logic
const newOrg = await createOrganization({
  name: 'New Org',
  slug: 'new-org',
});

// Auto-seed permissions
await seedSingleOrganization(
  newOrg.id,
  newOrg.name,
  newOrg.slug
);
```

### Integration with Better-Auth Hooks

Add to `auth.config.ts`:

```typescript
import { seedSingleOrganization } from './prisma/seeds/organizations.seed';

export const authConfig = {
  // ... other config
  organization: {
    // ... other organization config
    hooks: {
      afterCreateOrganization: async (organization) => {
        // Auto-seed permissions for new organization
        await seedSingleOrganization(
          organization.id,
          organization.name,
          organization.slug
        );
      },
    },
  },
};
```

## Querying Organization Permissions

### Get All Permissions for a Role
```typescript
const ownerPermissions = await prisma.organizationRolePermission.findMany({
  where: {
    organizationId: 'org_anineplus_main',
    role: 'owner',
  },
});
```

### Get Permissions for a Resource
```typescript
const animePermissions = await prisma.organizationRolePermission.findMany({
  where: {
    organizationId: 'org_anineplus_main',
    resource: 'anime',
  },
  orderBy: { role: 'asc' },
});
```

### Check Specific Permission
```typescript
const canDelete = await prisma.organizationRolePermission.findUnique({
  where: {
    organizationId_role_resource_action: {
      organizationId: 'org_anineplus_main',
      role: 'admin',
      resource: 'anime',
      action: 'delete',
    },
  },
});
```

### Get All Roles in Organization
```typescript
const roles = await prisma.organizationRolePermission.findMany({
  where: { organizationId: 'org_anineplus_main' },
  distinct: ['role'],
  select: { role: true },
});
```

## Permission Service Usage

Use the organization permission service for runtime checks:

```typescript
import { OrganizationPermissionService } from './auth/permission.service';

const permService = new OrganizationPermissionService(prisma);

// Check if user has permission
const canEdit = await permService.checkPermission(
  'org_anineplus_main',
  'admin',
  'anime',
  'update'
);

// Get all permissions for a role
const permissions = await permService.getRolePermissions(
  'org_anineplus_main',
  'contentManager'
);

// Get user's permissions based on their role
const member = await prisma.member.findUnique({
  where: {
    organizationId_userId: {
      organizationId: 'org_anineplus_main',
      userId: user.id,
    },
  },
});

const userPermissions = await permService.getUserPermissions(
  'org_anineplus_main',
  member.role
);
```

## Seed Data Statistics

### Per Organization
- **6 Roles**: owner, admin, contentManager, moderator, member, viewer
- **12 Resources**: organization, member, invitation, team, ac, anime, episode, comment, user, subscription, analytics, settings
- **10+ Actions**: create, read, update, delete, publish, upload, moderate, ban, unban, cancel, export
- **126 Total Permissions**: Varies by role (5-47 permissions per role)

### Total Across All Organizations
- **3 Sample Organizations**
- **378 Total Permission Records** (126 × 3)
- **Auto-seeding Support** for unlimited organizations

## Best Practices

### 1. Role Assignment
```typescript
// Assign user to organization with role
await prisma.member.create({
  data: {
    organizationId: 'org_anineplus_main',
    userId: user.id,
    role: 'contentManager',
    createdAt: new Date(),
  },
});
```

### 2. Permission Checking in Routes
```typescript
import { OrganizationPermissionService } from './auth/permission.service';

@UseGuards(OrganizationPermissionGuard)
@RequirePermission('anime', 'create')
async createAnime(@CurrentUser() user, @Param('orgId') orgId) {
  // Permission check happens in guard
  // User must be member of organization with 'anime:create' permission
}
```

### 3. Custom Roles
```typescript
// Add custom role permissions for specific organization
await prisma.organizationRolePermission.create({
  data: {
    organizationId: 'org_anineplus_main',
    role: 'customRole',
    resource: 'anime',
    action: 'create',
    description: 'Custom role for specific use case',
  },
});
```

### 4. Conditional Permissions (ABAC)
```typescript
// Add condition-based permissions
await prisma.organizationRolePermission.create({
  data: {
    organizationId: 'org_anineplus_main',
    role: 'member',
    resource: 'comment',
    action: 'delete',
    description: 'Delete own comments only',
    conditions: {
      own: true, // Only own resources
      timeLimit: 3600, // Within 1 hour
    },
  },
});
```

## Troubleshooting

### Issue: Permissions not found after seeding
**Solution**: Ensure Prisma client is generated
```bash
cd apps/core
bunx prisma generate
```

### Issue: Duplicate key errors
**Solution**: The unique constraint ensures no duplicates. Use `upsert` instead of `create`:
```typescript
await prisma.organizationRolePermission.upsert({
  where: {
    organizationId_role_resource_action: {
      organizationId, role, resource, action
    }
  },
  update: { description },
  create: { organizationId, role, resource, action, description }
});
```

### Issue: Cascade deletion not working
**Solution**: Check foreign key relationship in schema:
```prisma
organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
```

## Migration Guide

### From Static Permissions to Database

1. **Export existing permissions**:
   ```typescript
   // permissions.ts
   export const PERMISSIONS = {
     owner: ['anime:create', 'anime:read', ...],
   };
   ```

2. **Run migration and seed**:
   ```bash
   bunx prisma migrate dev --name add_organization_permissions
   bun run prisma/seeds/organizations.seed.ts
   ```

3. **Update permission checks**:
   ```typescript
   // Old
   if (PERMISSIONS.owner.includes('anime:create')) { ... }
   
   // New
   const canCreate = await permService.checkPermission(
     orgId, userRole, 'anime', 'create'
   );
   ```

## Next Steps

1. **Implement Guards**: Create NestJS guards for route protection
2. **Add Caching**: Cache permission checks with Redis for performance
3. **Build Admin UI**: Create UI for managing custom roles and permissions
4. **Add Audit Logs**: Track permission changes and access attempts
5. **Implement ABAC**: Use conditions field for attribute-based access control

## Related Documentation

- [ROLE_PERMISSION_SYSTEM.md](./ROLE_PERMISSION_SYSTEM.md) - Global role/permission system
- [COMPLETE_ACCESS_CONTROL.md](./COMPLETE_ACCESS_CONTROL.md) - Complete implementation guide
- [UNIFIED_ACCESS_CONTROL.md](./UNIFIED_ACCESS_CONTROL.md) - Architecture overview
- [Better-Auth Organization Docs](https://www.better-auth.com/docs/plugins/organization)

## Support

For issues or questions:
1. Check the seed output logs for detailed error messages
2. Verify Prisma schema matches the expected structure
3. Ensure all migrations are applied
4. Check the database directly using Prisma Studio: `bunx prisma studio`
