# Permission Guards Usage Guide

## Overview

This system provides three guards for protecting GraphQL resolvers:

1. **AuthGuard** - Basic authentication check
2. **PermissionGuard** - Permission-based access control (requires authenticated user)
3. **AuthPermissionGuard** - Combined authentication + permission check

## Guards

### 1. AuthGuard

Simple authentication check - verifies user has a valid session.

```typescript
import { UseGuards } from '@nestjs/common';
import { Query } from '@nestjs/graphql';
import { AuthGuard } from './guards';

@Query(() => User)
@UseGuards(AuthGuard)
async getCurrentUser(@Context() context: any) {
  // User is authenticated
  return context.user;
}
```

### 2. PermissionGuard

Checks if user has specific permissions in an organization.

**Usage:**

```typescript
import { UseGuards } from '@nestjs/common';
import { Mutation } from '@nestjs/graphql';
import { PermissionGuard, RequirePermissions } from './guards';

@Mutation(() => Anime)
@UseGuards(AuthGuard, PermissionGuard) // Must use both guards
@RequirePermissions({
  anime: ['create', 'update'] // Requires create AND update on anime resource
})
async createAnime(
  @Args('input') input: CreateAnimeInput,
  @Args('organizationId') organizationId: string,
  @Context() context: any,
) {
  // User has permission to create/update anime
  return this.animeService.create(input);
}
```

### 3. AuthPermissionGuard

Combined guard - does both authentication and permission checks in one guard.

```typescript
import { UseGuards } from '@nestjs/common';
import { Mutation } from '@nestjs/graphql';
import { AuthPermissionGuard, RequirePermissions } from './guards';

@Mutation(() => Episode)
@UseGuards(AuthPermissionGuard) // One guard for both auth + permissions
@RequirePermissions({
  episode: ['create']
})
async createEpisode(
  @Args('input') input: CreateEpisodeInput,
  @Context() context: any,
) {
  // User is authenticated AND has permission
  return this.episodeService.create(input);
}
```

## Decorators

### @RequirePermissions

Defines required permissions for a resolver.

**Syntax:**
```typescript
@RequirePermissions({
  [resource]: [actions]
})
```

**Examples:**

```typescript
// Single resource, single action
@RequirePermissions({
  anime: ['create']
})

// Single resource, multiple actions (requires ALL)
@RequirePermissions({
  anime: ['create', 'update', 'delete']
})

// Multiple resources
@RequirePermissions({
  anime: ['update'],
  episode: ['create']
})

// Admin-level permissions
@RequirePermissions({
  user: ['read', 'update', 'delete'],
  settings: ['update']
})
```

### @OrganizationContext

Specifies where to find the organizationId in resolver arguments.

**Default behavior:** Looks for `organizationId` in args or `input.organizationId`

**Custom parameter name:**
```typescript
@Mutation(() => Anime)
@UseGuards(AuthPermissionGuard)
@RequirePermissions({ anime: ['update'] })
@OrganizationContext('orgId') // Look for 'orgId' instead
async updateAnime(
  @Args('orgId') orgId: string,
  @Args('input') input: UpdateAnimeInput,
) {
  // ...
}
```

## Permission Resources

Based on your `permissions.ts`, available resources are:

- **anime** - Actions: `create`, `read`, `update`, `delete`, `publish`, `unpublish`
- **episode** - Actions: `create`, `read`, `update`, `delete`, `publish`, `unpublish`
- **comment** - Actions: `create`, `read`, `update`, `delete`, `moderate`
- **user** - Actions: `create`, `read`, `update`, `delete`, `ban`, `unban`
- **subscription** - Actions: `create`, `read`, `update`, `cancel`, `refund`
- **analytics** - Actions: `read`, `export`
- **settings** - Actions: `read`, `update`

## Built-in Roles

Your system has 6 pre-defined roles with specific permissions:

### Owner (Full Access)
- All permissions on all resources
- Can manage billing and delete organization

### Admin
- All permissions except organization deletion
- Can manage users, content, and settings

### Content Manager
- `anime.*`, `episode.*` (all operations)
- `analytics.read`

### Moderator
- `comment.*` (moderate, delete)
- `user.read`, `user.ban`, `user.unban`
- `anime.read`, `episode.read`

### Member (Basic Access)
- `anime.read`, `episode.read`
- `comment.create`, `comment.update`, `comment.delete` (own)
- `subscription.*`

### Viewer (Read-only)
- `anime.read`, `episode.read`
- `comment.read`
- `analytics.read`

## Real-World Examples

### Example 1: Content Management

```typescript
@Resolver()
export class AnimeResolver {
  // Anyone can view anime
  @Query(() => [Anime])
  async listAnime() {
    return this.animeService.findAll();
  }

  // Must be authenticated to get details
  @Query(() => Anime)
  @UseGuards(AuthGuard)
  async getAnime(@Args('id') id: string) {
    return this.animeService.findOne(id);
  }

  // Requires content creation permission
  @Mutation(() => Anime)
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({ anime: ['create'] })
  async createAnime(
    @Args('input') input: CreateAnimeInput,
    @Args('organizationId') organizationId: string,
  ) {
    return this.animeService.create(input, organizationId);
  }

  // Requires update permission
  @Mutation(() => Anime)
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({ anime: ['update'] })
  async updateAnime(
    @Args('id') id: string,
    @Args('input') input: UpdateAnimeInput,
    @Args('organizationId') organizationId: string,
  ) {
    return this.animeService.update(id, input);
  }

  // Requires publish permission (higher privilege)
  @Mutation(() => Anime)
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({ anime: ['publish'] })
  async publishAnime(
    @Args('id') id: string,
    @Args('organizationId') organizationId: string,
  ) {
    return this.animeService.publish(id);
  }

  // Requires delete permission (admin-level)
  @Mutation(() => Boolean)
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({ anime: ['delete'] })
  async deleteAnime(
    @Args('id') id: string,
    @Args('organizationId') organizationId: string,
  ) {
    await this.animeService.delete(id);
    return true;
  }
}
```

### Example 2: User Management

```typescript
@Resolver()
export class UserManagementResolver {
  // View users - requires read permission
  @Query(() => [User])
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({ user: ['read'] })
  async listUsers(@Args('organizationId') organizationId: string) {
    return this.userService.findAll(organizationId);
  }

  // Ban user - moderator/admin only
  @Mutation(() => Boolean)
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({ user: ['ban'] })
  async banUser(
    @Args('userId') userId: string,
    @Args('organizationId') organizationId: string,
    @Args('reason') reason: string,
  ) {
    await this.userService.ban(userId, reason);
    return true;
  }

  // Delete user - admin only
  @Mutation(() => Boolean)
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({ user: ['delete'] })
  async deleteUser(
    @Args('userId') userId: string,
    @Args('organizationId') organizationId: string,
  ) {
    await this.userService.delete(userId);
    return true;
  }
}
```

### Example 3: Settings Management

```typescript
@Resolver()
export class SettingsResolver {
  // Anyone can read settings
  @Query(() => Settings)
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({ settings: ['read'] })
  async getSettings(@Args('organizationId') organizationId: string) {
    return this.settingsService.get(organizationId);
  }

  // Only admins can update settings
  @Mutation(() => Settings)
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({ settings: ['update'] })
  async updateSettings(
    @Args('input') input: UpdateSettingsInput,
    @Args('organizationId') organizationId: string,
  ) {
    return this.settingsService.update(organizationId, input);
  }
}
```

### Example 4: Multi-Resource Permission

```typescript
@Resolver()
export class ContentPublishResolver {
  // Requires permissions on both anime AND episode
  @Mutation(() => Boolean)
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({
    anime: ['publish'],
    episode: ['publish']
  })
  async publishAnimeWithEpisodes(
    @Args('animeId') animeId: string,
    @Args('episodeIds') episodeIds: string[],
    @Args('organizationId') organizationId: string,
  ) {
    await this.contentService.publishBulk(animeId, episodeIds);
    return true;
  }
}
```

## Testing Permissions

You can check permissions programmatically:

```typescript
@Injectable()
export class MyService {
  constructor(private organizationService: OrganizationService) {}

  async someMethod(sessionToken: string, organizationId: string) {
    // Check if user has permission
    const hasPermission = await this.organizationService.hasPermission(
      sessionToken,
      { anime: ['create'] },
      organizationId,
    );

    if (hasPermission.success) {
      // User has permission
    } else {
      throw new ForbiddenException(hasPermission.error);
    }
  }
}
```

## Error Handling

Guards throw specific exceptions:

- **UnauthorizedException** (401): No token or invalid session
- **ForbiddenException** (403): Valid session but insufficient permissions

```typescript
// Client will receive:
{
  "errors": [
    {
      "message": "Insufficient permissions",
      "extensions": {
        "code": "FORBIDDEN",
        "statusCode": 403
      }
    }
  ]
}
```

## Best Practices

1. **Always use AuthGuard or AuthPermissionGuard** - Never rely on client-side checks alone
2. **Be specific with permissions** - Request only what you need
3. **Use OrganizationContext** - When organizationId is in a different parameter
4. **Combine guards properly** - Use `@UseGuards(AuthGuard, PermissionGuard)` or just `@UseGuards(AuthPermissionGuard)`
5. **Handle errors gracefully** - Provide meaningful error messages to users

## Dynamic Role Creation

You can create custom roles at runtime:

```typescript
await organizationService.createRole(
  sessionToken,
  'custom-editor',
  {
    anime: ['read', 'update'],
    episode: ['read', 'update', 'create']
  },
  organizationId
);
```

This allows organizations to define their own permission structures beyond the built-in roles.
