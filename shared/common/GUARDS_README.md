# Common Auth Guards Library

Shared authentication and permission guards for all microservices.

## Installation

The guards are already available in `@anineplus/common`. No additional installation needed.

## Setup in Your Service

### Step 1: Implement Interfaces

Your auth service must implement `IAuthService`:

```typescript
// apps/your-service/src/auth/your-auth.service.ts
import { Injectable } from '@nestjs/common';
import { IAuthService } from '@anineplus/common';

@Injectable()
export class YourAuthService implements IAuthService {
  async getSession(sessionToken: string) {
    // Your implementation
    // Return session + user or null
    return {
      session: {
        id: 'session-id',
        userId: 'user-id',
        expiresAt: new Date(),
      },
      user: {
        id: 'user-id',
        email: 'user@example.com',
        name: 'User Name',
      },
    };
  }
}
```

Your permission service must implement `IPermissionService`:

```typescript
// apps/your-service/src/auth/your-permission.service.ts
import { Injectable } from '@nestjs/common';
import { IPermissionService } from '@anineplus/common';

@Injectable()
export class YourPermissionService implements IPermissionService {
  async hasPermission(
    sessionToken: string,
    permissions: Record<string, string[]>,
    organizationId?: string,
  ) {
    // Your implementation
    // Check if user has required permissions
    return {
      success: true, // or false
      error: null, // or error message
    };
  }
}
```

### Step 2: Provide Services in Module

```typescript
// apps/your-service/src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthGuard, PermissionGuard, AuthPermissionGuard } from '@anineplus/common';
import { YourAuthService } from './your-auth.service';
import { YourPermissionService } from './your-permission.service';

@Module({
  providers: [
    YourAuthService,
    YourPermissionService,
    // Provide services with tokens
    {
      provide: 'AUTH_SERVICE',
      useClass: YourAuthService,
    },
    {
      provide: 'PERMISSION_SERVICE',
      useClass: YourPermissionService,
    },
    // Provide guards
    AuthGuard,
    PermissionGuard,
    AuthPermissionGuard,
  ],
  exports: [
    YourAuthService,
    YourPermissionService,
    AuthGuard,
    PermissionGuard,
    AuthPermissionGuard,
  ],
})
export class AuthModule {}
```

### Step 3 (Optional): Apply Global Auth Guard

```typescript
// apps/your-service/src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '@anineplus/common';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
```

## Usage in Resolvers

### Import What You Need

```typescript
import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import {
  AuthGuard,
  PermissionGuard,
  AuthPermissionGuard,
  Public,
  RequirePermissions,
  OrganizationContext,
} from '@anineplus/common';
```

### Pattern 1: Public Endpoint

```typescript
@Query(() => [Anime])
@Public() // Skip authentication
async listPublicAnime() {
  return this.animeService.findAll();
}
```

### Pattern 2: Authentication Only

```typescript
@Query(() => User)
@UseGuards(AuthGuard)
async getCurrentUser(@Context() context: any) {
  // context.user is available
  return context.user;
}
```

### Pattern 3: Authentication + Permissions (Separate Guards)

```typescript
@Mutation(() => Anime)
@UseGuards(AuthGuard, PermissionGuard)
@RequirePermissions({ anime: ['create'] })
async createAnime(
  @Args('input') input: CreateAnimeInput,
  @Args('organizationId') organizationId: string,
) {
  return this.animeService.create(input);
}
```

### Pattern 4: Authentication + Permissions (Combined Guard) - RECOMMENDED

```typescript
@Mutation(() => Anime)
@UseGuards(AuthPermissionGuard)
@RequirePermissions({ anime: ['create', 'update'] })
async createAnime(
  @Args('input') input: CreateAnimeInput,
  @Args('organizationId') organizationId: string,
) {
  return this.animeService.create(input);
}
```

### Pattern 5: Custom Organization Parameter Name

```typescript
@Mutation(() => Anime)
@UseGuards(AuthPermissionGuard)
@RequirePermissions({ anime: ['create'] })
@OrganizationContext('orgId') // Look for 'orgId' instead of 'organizationId'
async createAnime(
  @Args('input') input: CreateAnimeInput,
  @Args('orgId') orgId: string, // Custom parameter name
) {
  return this.animeService.create(input);
}
```

### Pattern 6: Multiple Resources

```typescript
@Mutation(() => Boolean)
@UseGuards(AuthPermissionGuard)
@RequirePermissions({
  anime: ['delete'],
  episode: ['delete'],
})
async deleteAnimeWithEpisodes(
  @Args('animeId') animeId: string,
  @Args('organizationId') organizationId: string,
) {
  await this.contentService.deleteAll(animeId);
  return true;
}
```

## Available Decorators

### @Public()
Mark endpoint as public (skip authentication).

### @RequirePermissions(permissions)
Define required permissions for an endpoint.

```typescript
@RequirePermissions({
  [resource]: [actions]
})
```

### @OrganizationContext(paramName)
Specify parameter name for organization ID (default: 'organizationId').

## Available Guards

### AuthGuard
- Validates JWT token
- Sets `context.user`, `context.session`, `context.sessionToken`
- Respects `@Public()` decorator

### PermissionGuard
- Checks permissions against organization roles
- Requires `sessionToken` in context (use with AuthGuard)
- Uses `@RequirePermissions()` metadata

### AuthPermissionGuard
- Combined auth + permission check
- Most convenient for protected endpoints
- Single guard to rule them all!

## Context Available After Auth

After successful authentication, these are available in GraphQL context:

```typescript
@Query(() => User)
@UseGuards(AuthGuard)
async getCurrentUser(@Context() context: any) {
  // Available from context:
  context.user           // { id, email, name }
  context.session        // { id, userId, expiresAt }
  context.sessionToken   // JWT token string
  context.req            // Express request object
}
```

## Error Responses

**401 Unauthorized** - Authentication failed:
```json
{
  "errors": [{
    "message": "No authorization token provided",
    "extensions": { "code": "UNAUTHENTICATED" }
  }]
}
```

**403 Forbidden** - Permission denied:
```json
{
  "errors": [{
    "message": "Insufficient permissions",
    "extensions": { "code": "FORBIDDEN" }
  }]
}
```

## Service Tokens

Guards use dependency injection with these tokens:

- `AUTH_SERVICE` - Must implement `IAuthService`
- `PERMISSION_SERVICE` - Must implement `IPermissionService`

Make sure to provide these in your module!

## Example: Complete Service Setup

```typescript
// 1. Auth Service
@Injectable()
export class BetterAuthService implements IAuthService {
  async getSession(sessionToken: string) {
    return this.auth.api.getSession({
      headers: { authorization: `Bearer ${sessionToken}` }
    });
  }
}

// 2. Permission Service
@Injectable()
export class OrganizationService implements IPermissionService {
  async hasPermission(sessionToken: string, permissions: Record<string, string[]>, organizationId?: string) {
    return this.authApi.hasPermission({
      headers: { authorization: `Bearer ${sessionToken}` },
      body: { permissions, organizationId }
    });
  }
}

// 3. Module
@Module({
  providers: [
    BetterAuthService,
    OrganizationService,
    { provide: 'AUTH_SERVICE', useClass: BetterAuthService },
    { provide: 'PERMISSION_SERVICE', useClass: OrganizationService },
    AuthGuard,
    PermissionGuard,
    AuthPermissionGuard,
  ],
  exports: [AuthGuard, PermissionGuard, AuthPermissionGuard],
})
export class AuthModule {}

// 4. App Module (Optional Global Guard)
@Module({
  imports: [AuthModule],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}

// 5. Resolver
@Resolver()
export class AnimeResolver {
  @Query(() => [Anime])
  @Public()
  async listAnime() { }

  @Mutation(() => Anime)
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({ anime: ['create'] })
  async createAnime(@Args('input') input: CreateAnimeInput, @Args('organizationId') orgId: string) {
    return this.animeService.create(input, orgId);
  }
}
```

## Best Practices

1. ✅ Use `AuthPermissionGuard` for most protected endpoints
2. ✅ Use `@Public()` for public endpoints when using global auth
3. ✅ Be specific with permissions - request only what you need
4. ✅ Store commonly used permission sets as constants
5. ✅ Implement proper error handling in your service implementations
6. ✅ Test your implementations thoroughly

## Testing

Mock the service tokens in your tests:

```typescript
const mockAuthService: IAuthService = {
  getSession: jest.fn().mockResolvedValue({
    session: { id: '1', userId: '1', expiresAt: new Date() },
    user: { id: '1', email: 'test@test.com', name: 'Test' },
  }),
};

const mockPermissionService: IPermissionService = {
  hasPermission: jest.fn().mockResolvedValue({ success: true }),
};

TestingModule.createTestingModule({
  providers: [
    { provide: 'AUTH_SERVICE', useValue: mockAuthService },
    { provide: 'PERMISSION_SERVICE', useValue: mockPermissionService },
    AuthGuard,
  ],
});
```

## Migration from Service-specific Guards

If you have existing guards in your service:

1. Implement `IAuthService` and `IPermissionService` in your existing services
2. Provide them with tokens `AUTH_SERVICE` and `PERMISSION_SERVICE`
3. Replace your guard imports with `@anineplus/common`
4. Update decorator imports
5. Test thoroughly!

That's it! Your guards are now shared across all services. 🎉
