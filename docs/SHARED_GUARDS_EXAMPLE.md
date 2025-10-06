# Shared Guards Usage Example

## Overview
Hướng dẫn chi tiết cách sử dụng shared guards từ `@anineplus/common` trong bất kỳ microservice nào.

## Architecture

```
shared/common/
├── src/
│   ├── interfaces/
│   │   └── auth.interface.ts      # IAuthService, IPermissionService
│   ├── decorators/
│   │   └── auth.decorators.ts     # @Public, @RequirePermissions, etc.
│   └── guards/
│       ├── auth.guard.ts          # Generic AuthGuard
│       ├── permission.guard.ts    # Generic PermissionGuard
│       └── auth-permission.guard.ts # Combined guard
```

## Step-by-Step Integration

### 1. Install & Configure TypeScript

#### Update `tsconfig.json`
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "paths": {
      "@anineplus/common": ["../../shared/common/src"]
    }
  }
}
```

### 2. Implement Required Interfaces

#### Create Auth Service
```typescript
// your-service/src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { IAuthService } from '@anineplus/common';

@Injectable()
export class AuthService implements IAuthService {
  async getSession(sessionToken: string) {
    // Call your auth API or validate JWT
    const response = await fetch('http://auth-service/api/auth/get-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ sessionToken })
    });
    
    return response.json(); // Returns { session, user }
  }
}
```

#### Create Permission Service (Optional)
```typescript
// your-service/src/auth/permission.service.ts
import { Injectable } from '@nestjs/common';
import { IPermissionService, PermissionDefinition } from '@anineplus/common';

@Injectable()
export class PermissionService implements IPermissionService {
  async hasPermission(
    sessionToken: string,
    permissions: PermissionDefinition,
    organizationId?: string
  ): Promise<boolean> {
    // Call permission check API
    const response = await fetch('http://auth-service/api/organizations/check-permission', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({
        permissions,
        organizationId
      })
    });
    
    const result = await response.json();
    return result.hasPermission;
  }
}
```

### 3. Configure Module with Dependency Injection

```typescript
// your-service/src/your.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard, PermissionGuard, AuthPermissionGuard } from '@anineplus/common';
import { AuthService } from './auth/auth.service';
import { PermissionService } from './auth/permission.service';

@Module({
  providers: [
    AuthService,
    PermissionService,
    
    // Provide service implementations with tokens
    {
      provide: 'AUTH_SERVICE',
      useClass: AuthService,
    },
    {
      provide: 'PERMISSION_SERVICE',
      useClass: PermissionService,
    },
    
    // Option 1: Use AuthGuard globally (only authentication)
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    
    // Option 2: Use AuthPermissionGuard globally (auth + permissions)
    // {
    //   provide: APP_GUARD,
    //   useClass: AuthPermissionGuard,
    // },
  ],
  exports: [AuthService, PermissionService],
})
export class YourModule {}
```

### 4. Use Decorators in Resolvers/Controllers

#### Basic Authentication
```typescript
// your-service/src/your.resolver.ts
import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard, Public, RequireAuth } from '@anineplus/common';

@Resolver()
export class YourResolver {
  
  // Public endpoint - no authentication required
  @Public()
  @Query(() => String)
  publicEndpoint() {
    return 'This is public';
  }
  
  // Authenticated endpoint
  @RequireAuth()
  @Query(() => String)
  protectedEndpoint(@Context() context) {
    const user = context.user; // Set by AuthGuard
    return `Hello, ${user.name}`;
  }
  
  // Manual guard application
  @UseGuards(AuthGuard)
  @Query(() => String)
  anotherProtected(@Context() context) {
    return `User ID: ${context.user.id}`;
  }
}
```

#### Permission-Based Authorization
```typescript
// your-service/src/organization.resolver.ts
import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { 
  AuthPermissionGuard, 
  RequirePermissions,
  OrganizationContext 
} from '@anineplus/common';

@Resolver()
@UseGuards(AuthPermissionGuard) // Apply to all methods
export class OrganizationResolver {
  
  // Requires specific permissions
  @RequirePermissions({
    organization: ['create', 'update']
  })
  @Mutation(() => Organization)
  createOrganization(@Args('input') input: CreateOrgInput) {
    // User has 'organization:create' AND 'organization:update' permissions
    return this.orgService.create(input);
  }
  
  // Check permissions for specific organization
  @RequirePermissions({
    member: ['invite']
  })
  @OrganizationContext() // Extract organizationId from args
  @Mutation(() => Member)
  inviteMember(
    @Args('organizationId') organizationId: string,
    @Args('email') email: string
  ) {
    // Guard checks 'member:invite' permission in this organization
    return this.orgService.invite(organizationId, email);
  }
  
  // Multiple permissions (OR logic)
  @RequirePermissions({
    member: ['manage'],
    team: ['manage']
  })
  @Mutation(() => Boolean)
  manageMember(@Args('input') input: ManageMemberInput) {
    // User needs 'member:manage' OR 'team:manage'
    return this.orgService.manage(input);
  }
}
```

#### Combined Approach
```typescript
@Resolver()
export class MixedResolver {
  
  // Public - no guard needed
  @Public()
  @Query(() => [Post])
  getPosts() {
    return this.postService.findAll();
  }
  
  // Authenticated only
  @RequireAuth()
  @Query(() => User)
  getProfile(@Context() context) {
    return this.userService.findById(context.user.id);
  }
  
  // Authenticated + Permission check
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({ post: ['create'] })
  @Mutation(() => Post)
  createPost(@Args('input') input: CreatePostInput) {
    return this.postService.create(input);
  }
  
  // Custom logic with manual token extraction
  @UseGuards(AuthGuard)
  @Mutation(() => Boolean)
  customAction(@Context() context) {
    const sessionToken = context.sessionToken; // Set by AuthGuard
    // Use sessionToken for custom logic
    return true;
  }
}
```

## Real-World Examples

### Example 1: Gateway Service
```typescript
// apps/gateway/src/gateway.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '@anineplus/common';
import { GatewayAuthService } from './auth/gateway-auth.service';

@Module({
  providers: [
    GatewayAuthService,
    {
      provide: 'AUTH_SERVICE',
      useClass: GatewayAuthService,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard, // Protect all endpoints by default
    },
  ],
})
export class GatewayModule {}

// apps/gateway/src/auth/gateway-auth.service.ts
import { Injectable, HttpService } from '@nestjs/common';
import { IAuthService } from '@anineplus/common';

@Injectable()
export class GatewayAuthService implements IAuthService {
  constructor(private httpService: HttpService) {}
  
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
        `,
      },
      {
        headers: { Authorization: `Bearer ${sessionToken}` }
      }
    ).toPromise();
    
    return data.data.getSession;
  }
}

// apps/gateway/src/user/user.resolver.ts
import { Resolver, Query, Context } from '@nestjs/graphql';
import { Public } from '@anineplus/common';

@Resolver()
export class UserResolver {
  @Public() // Override global guard
  @Query(() => String)
  healthCheck() {
    return 'OK';
  }
  
  @Query(() => User) // Protected by global AuthGuard
  me(@Context() context) {
    return context.user;
  }
}
```

### Example 2: Payment Plugin
```typescript
// plugins/payment/src/payment.module.ts
import { Module } from '@nestjs/common';
import { AuthPermissionGuard } from '@anineplus/common';
import { PaymentAuthService } from './auth/payment-auth.service';
import { PaymentPermissionService } from './auth/payment-permission.service';

@Module({
  providers: [
    PaymentAuthService,
    PaymentPermissionService,
    {
      provide: 'AUTH_SERVICE',
      useClass: PaymentAuthService,
    },
    {
      provide: 'PERMISSION_SERVICE',
      useClass: PaymentPermissionService,
    },
    // No global guard - apply manually where needed
  ],
})
export class PaymentModule {}

// plugins/payment/src/payment.resolver.ts
import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthPermissionGuard, RequirePermissions } from '@anineplus/common';

@Resolver()
export class PaymentResolver {
  
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({
    payment: ['create']
  })
  @Mutation(() => Payment)
  createPayment(@Args('input') input: CreatePaymentInput) {
    return this.paymentService.create(input);
  }
  
  @UseGuards(AuthPermissionGuard)
  @RequirePermissions({
    payment: ['refund']
  })
  @Mutation(() => Payment)
  refundPayment(@Args('id') id: string) {
    return this.paymentService.refund(id);
  }
}
```

### Example 3: Searcher Service
```typescript
// apps/searcher/src/searcher.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from '@anineplus/common';
import { SearcherAuthService } from './auth/searcher-auth.service';

@Module({
  providers: [
    SearcherAuthService,
    {
      provide: 'AUTH_SERVICE',
      useClass: SearcherAuthService,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class SearcherModule {}

// apps/searcher/src/search.resolver.ts
import { Resolver, Query, Args } from '@nestjs/graphql';
import { Public } from '@anineplus/common';

@Resolver()
export class SearchResolver {
  
  @Public() // Public search
  @Query(() => [SearchResult])
  searchPublic(@Args('query') query: string) {
    return this.searchService.searchPublic(query);
  }
  
  @Query(() => [SearchResult]) // Authenticated search (global guard)
  searchPrivate(@Args('query') query: string, @Context() context) {
    return this.searchService.searchPrivate(query, context.user.id);
  }
}
```

## Permission Definition Format

```typescript
type PermissionDefinition = Record<string, string[]>;

// Examples:
const permissions = {
  // Single resource, multiple actions
  organization: ['create', 'update', 'delete'],
  
  // Multiple resources
  member: ['invite', 'remove'],
  team: ['create', 'manage'],
  
  // ANY permission in the object allows access (OR logic)
  // User needs (organization:create OR organization:update OR organization:delete)
  //         OR (member:invite OR member:remove)
  //         OR (team:create OR team:manage)
};
```

## Testing Guards

```typescript
// your-service/src/your.resolver.spec.ts
import { Test } from '@nestjs/testing';
import { AuthGuard } from '@anineplus/common';
import { YourResolver } from './your.resolver';

describe('YourResolver', () => {
  let resolver: YourResolver;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        YourResolver,
        {
          provide: 'AUTH_SERVICE',
          useValue: {
            getSession: jest.fn().mockResolvedValue({
              session: { token: 'test', expiresAt: new Date() },
              user: { id: '1', name: 'Test' }
            })
          }
        }
      ],
    }).compile();
    
    resolver = module.get<YourResolver>(YourResolver);
  });
  
  it('should work', () => {
    expect(resolver).toBeDefined();
  });
});
```

## Best Practices

### ✅ DO:
- Use `@Public()` to explicitly mark public endpoints
- Use `@RequireAuth()` for simple authentication
- Use `@RequirePermissions()` with specific permission definitions
- Implement `IAuthService` in your auth service
- Implement `IPermissionService` if using permissions
- Provide services with DI tokens: `'AUTH_SERVICE'`, `'PERMISSION_SERVICE'`
- Use global guards when most endpoints need protection
- Extract `organizationId` from args using `@OrganizationContext()`

### ❌ DON'T:
- Don't forget to add `experimentalDecorators` and `emitDecoratorMetadata` to tsconfig
- Don't mix old local guards with new shared guards
- Don't forget to configure TypeScript paths for `@anineplus/common`
- Don't hardcode service dependencies in guards
- Don't forget to mark public endpoints with `@Public()`

## Troubleshooting

### Cannot find module '@anineplus/common'
**Solution:** Add paths to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@anineplus/common": ["../../shared/common/src"]
    }
  }
}
```

### Guards not working
**Solution:** Check DI token providers:
```typescript
{
  provide: 'AUTH_SERVICE',
  useClass: YourAuthService,
}
```

### Decorators not recognized
**Solution:** Enable in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Permission checks always fail
**Solution:** 
1. Verify `IPermissionService` implementation
2. Check permission format: `{ resource: ['action1', 'action2'] }`
3. Ensure `@OrganizationContext()` is used if checking organization permissions

## Migration Checklist

When migrating a service to use shared guards:

- [ ] Update `tsconfig.json` with paths and decorator support
- [ ] Create auth service implementing `IAuthService`
- [ ] Create permission service implementing `IPermissionService` (if needed)
- [ ] Configure module with DI token providers
- [ ] Update imports in resolvers/controllers to use `@anineplus/common`
- [ ] Add `@Public()` to public endpoints
- [ ] Add `@RequirePermissions()` to protected endpoints
- [ ] Remove old local guard files
- [ ] Test all endpoints
- [ ] Update tests to mock services with DI tokens

## Summary

Shared guards từ `@anineplus/common` cung cấp:
- ✅ **Reusable**: Dùng cho tất cả microservices
- ✅ **Flexible**: Interfaces cho loose coupling
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Decorators**: Clean and declarative
- ✅ **Dependency Injection**: Easy testing and mocking
- ✅ **Documented**: Complete examples and patterns

Bắt đầu với `AuthGuard` cho authentication, sau đó thêm `AuthPermissionGuard` khi cần permission checks.
