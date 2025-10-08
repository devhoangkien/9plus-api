# Authorization Library (@anineplus/authorization)

## Overview

`@anineplus/authorization` là thư viện tập trung tất cả logic về authentication và authorization cho toàn bộ microservices.

## 📁 Structure

```
shared/authorization/
├── src/
│   ├── guards/                    # Authentication & Permission Guards
│   │   ├── auth.guard.ts         # JWT/Session authentication
│   │   ├── permission.guard.ts   # Permission-based authorization
│   │   └── auth-permission.guard.ts # Combined guard
│   │
│   ├── decorators/                # Auth decorators
│   │   └── auth.decorators.ts    # @Public, @RequirePermissions, etc.
│   │
│   ├── interfaces/                # Service contracts
│   │   └── auth.interface.ts     # IAuthService, IPermissionService
│   │
│   ├── casl.guard.ts             # CASL authorization guard
│   ├── ability.factory.ts         # CASL ability factory
│   └── index.ts                   # Exports
```

## 🚀 Quick Start

### 1. Configure TypeScript Paths



### 2. Import Guards & Decorators

```typescript
// Import from @anineplus/authorization
import { 
  AuthGuard, 
  PermissionGuard, 
  AuthPermissionGuard,
  Public, 
  RequireAuth,
  RequirePermissions,
  OrganizationContext
} from '@anineplus/authorization';
```

### 3. Implement Service Interfaces

```typescript
// your-service/src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { IAuthService } from '@anineplus/authorization';

@Injectable()
export class AuthService implements IAuthService {
  async getSession(sessionToken: string) {
    // Call your auth API
    const response = await fetch('http://auth-service/api/auth/get-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ sessionToken })
    });
    
    return response.json(); // { session, user }
  }
}
```

### 4. Configure Module

```typescript
// your-service/src/your.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '@anineplus/authorization';
import { AuthService } from './auth/auth.service';

@Module({
  providers: [
    AuthService,
    {
      provide: 'AUTH_SERVICE',
      useClass: AuthService,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // Global authentication
    },
  ],
})
export class YourModule {}
```

### 5. Use in Resolvers/Controllers

```typescript
import { Resolver, Query, Context } from '@nestjs/graphql';
import { Public, RequireAuth, RequirePermissions } from '@anineplus/authorization';

@Resolver()
export class YourResolver {
  
  @Public() // Skip authentication
  @Query(() => String)
  publicEndpoint() {
    return 'Hello World';
  }
  
  @RequireAuth() // Require authentication only
  @Query(() => User)
  getProfile(@Context() context) {
    return context.user;
  }
  
  @RequirePermissions({ resource: ['action'] }) // Require specific permissions
  @Mutation(() => Boolean)
  protectedAction() {
    return true;
  }
}
```

## 📚 Available Components

### Guards

#### AuthGuard
Validates JWT/session tokens and sets `context.user`, `context.session`, `context.sessionToken`.

**Usage:**
```typescript
@UseGuards(AuthGuard)
@Query(() => User)
getUser(@Context() context) {
  return context.user;
}
```

#### PermissionGuard
Checks user permissions against required permissions.

**Usage:**
```typescript
@UseGuards(AuthGuard, PermissionGuard)
@RequirePermissions({ organization: ['create', 'update'] })
@Mutation(() => Organization)
createOrg() {
  // User has 'organization:create' AND 'organization:update'
}
```

#### AuthPermissionGuard
Combined guard - validates auth + checks permissions.

**Usage:**
```typescript
@UseGuards(AuthPermissionGuard)
@RequirePermissions({ member: ['invite'] })
@Mutation(() => Member)
inviteMember() {
  // Auth validated + Permission checked
}
```

### Decorators

#### @Public()
Mark endpoint as public (skip authentication).

```typescript
@Public()
@Query(() => String)
healthCheck() {
  return 'OK';
}
```

#### @RequireAuth()
Explicitly require authentication (useful when no global guard).

```typescript
@RequireAuth()
@Query(() => User)
getProfile() {
  return this.userService.getProfile();
}
```

#### @RequirePermissions(permissions)
Specify required permissions.

```typescript
@RequirePermissions({
  organization: ['create', 'update'],
  member: ['invite']
})
@Mutation(() => Organization)
createOrganization() {
  // Needs ANY of these permissions (OR logic)
}
```

#### @OrganizationContext()
Extract `organizationId` from resolver args for permission check.

```typescript
@RequirePermissions({ member: ['invite'] })
@OrganizationContext()
@Mutation(() => Member)
inviteMember(@Args('organizationId') orgId: string) {
  // Permission checked for this specific organization
}
```

#### @Protected(permissions)
Shorthand for @RequireAuth() + @RequirePermissions().

```typescript
@Protected({ post: ['create'] })
@Mutation(() => Post)
createPost() {
  // Auth + Permission in one decorator
}
```

### Interfaces

#### IAuthService
Contract for authentication services.

```typescript
interface IAuthService {
  getSession(sessionToken: string): Promise<{
    session: Session;
    user: User;
  }>;
}
```

#### IPermissionService
Contract for permission services.

```typescript
interface IPermissionService {
  hasPermission(
    sessionToken: string,
    permissions: PermissionDefinition,
    organizationId?: string
  ): Promise<boolean>;
}
```

#### PermissionDefinition
Permission format.

```typescript
type PermissionDefinition = Record<string, string[]>;

// Example:
const permissions = {
  organization: ['create', 'update'],
  member: ['invite', 'remove']
};
```

## 🔧 Integration Examples

### Core Service (Better Auth)

```typescript
// apps/core/src/auth/better-auth.service.ts
import { IAuthService } from '@anineplus/authorization';

export class BetterAuthService implements IAuthService {
  async getSession(sessionToken: string) {
    return await auth.api.getSession({
      headers: { authorization: `Bearer ${sessionToken}` }
    });
  }
}

// apps/core/src/auth/organization.service.ts
import { IPermissionService } from '@anineplus/authorization';

export class OrganizationService implements IPermissionService {
  async hasPermission(sessionToken, permissions, organizationId) {
    // Check permissions via Better Auth Organization API
    const result = await auth.api.checkPermission({
      headers: { authorization: `Bearer ${sessionToken}` },
      body: { permissions, organizationId }
    });
    return result.hasPermission;
  }
}

// apps/core/src/auth/better-auth.module.ts
import { AuthGuard, AuthPermissionGuard } from '@anineplus/authorization';

@Module({
  providers: [
    BetterAuthService,
    OrganizationService,
    {
      provide: 'AUTH_SERVICE',
      useClass: BetterAuthService,
    },
    {
      provide: 'PERMISSION_SERVICE',
      useClass: OrganizationService,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class BetterAuthModule {}
```

### Gateway Service

```typescript
// apps/gateway/src/auth/gateway-auth.service.ts
import { IAuthService } from '@anineplus/authorization';

export class GatewayAuthService implements IAuthService {
  async getSession(sessionToken: string) {
    // Forward to Core service
    const { data } = await this.httpService.post(
      'http://core:3000/graphql',
      {
        query: `
          query GetSession {
            getSession {
              session { token expiresAt }
              user { id name email }
            }
          }
        `
      },
      { headers: { Authorization: `Bearer ${sessionToken}` } }
    ).toPromise();
    
    return data.data.getSession;
  }
}
```

### Other Services (Searcher, Logger, Payment)

```typescript
// apps/searcher/src/auth/searcher-auth.service.ts
import { IAuthService } from '@anineplus/authorization';

export class SearcherAuthService implements IAuthService {
  async getSession(sessionToken: string) {
    // Call Core service via HTTP
    const response = await fetch('http://core:3000/api/auth/get-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionToken })
    });
    
    return response.json();
  }
}
```

## 🎯 Migration from @anineplus/common

Previously, guards were in `@anineplus/common`. They have been moved to `@anineplus/authorization`.

### Update Imports

**Before:**
```typescript
import { AuthGuard, RequirePermissions } from '@anineplus/common';
```

**After:**
```typescript
import { AuthGuard, RequirePermissions } from '@anineplus/authorization';
```

### Update tsconfig.json

**Before:**
```json
"paths": {
  "@anineplus/common": ["../../shared/common/src"]
}
```

**After:**
```json
"paths": {
  "@anineplus/common": ["../../shared/common/src"],
  "@anineplus/authorization": ["../../shared/authorization/src"]
}
```

### What Moved

**Moved to @anineplus/authorization:**
- ✅ All guards (AuthGuard, PermissionGuard, AuthPermissionGuard)
- ✅ All decorators (@Public, @RequireAuth, @RequirePermissions, etc.)
- ✅ All interfaces (IAuthService, IPermissionService, etc.)

**Still in @anineplus/common:**
- ✅ Common utilities
- ✅ Logger service
- ✅ Exception handlers
- ✅ Validation utilities
- ✅ GraphQL errors

## 📝 Best Practices

### ✅ DO:
- Implement `IAuthService` in your auth service
- Implement `IPermissionService` if using permissions
- Provide services with DI tokens: `'AUTH_SERVICE'`, `'PERMISSION_SERVICE'`
- Use `@Public()` to mark public endpoints explicitly
- Use `@RequirePermissions()` with specific permission definitions
- Use global guards when most endpoints need protection

### ❌ DON'T:
- Don't forget to implement required interfaces
- Don't hardcode service dependencies
- Don't forget to configure TypeScript paths
- Don't mix authentication logic with business logic
- Don't forget to mark public endpoints with `@Public()`

## 🐛 Troubleshooting

### Cannot find module '@anineplus/authorization'

**Solution:** Check `tsconfig.json`:
```json
"paths": {
  "@anineplus/authorization": ["../../shared/authorization/src"]
}
```

### Guards not working

**Solution:** Verify DI token providers:
```typescript
{
  provide: 'AUTH_SERVICE',
  useClass: YourAuthService,
}
```

### Permission checks always fail

**Solution:**
1. Implement `IPermissionService` correctly
2. Check permission format: `{ resource: ['action'] }`
3. Use `@OrganizationContext()` if checking org permissions

## 📖 Further Reading

- [Shared Guards Documentation](./SHARED_GUARDS_EXAMPLE.md)
- [Better Auth Integration](./BETTER_AUTH.md)
- [CASL Authorization](./DYNAMIC_ACCESS_CONTROL.md)
- [Microservices Architecture](./MICROSERVICES_ARCHITECTURE.md)

## 🎉 Summary

`@anineplus/authorization` cung cấp:
- ✅ **Reusable** - Dùng cho tất cả microservices
- ✅ **Type-safe** - Full TypeScript support
- ✅ **Flexible** - Interface-based loose coupling
- ✅ **Declarative** - Clean decorator syntax
- ✅ **Testable** - Easy to mock via DI
- ✅ **Documented** - Complete examples and patterns

Import từ `@anineplus/authorization` thay vì `@anineplus/common` để sử dụng authentication và authorization features.
