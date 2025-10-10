# Authentication & Authorization Guide

Complete guide for implementing authentication and authorization in AnineePlus API using Better Auth and CASL.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Authorization](#authorization)
4. [Access Control System](#access-control-system)
5. [Implementation Guide](#implementation-guide)
6. [API Reference](#api-reference)

---

## Overview

### Two-Level Permission System

```
┌─────────────────────────────────────────────────┐
│         ANINEPLUS ACCESS CONTROL                │
├─────────────────────────────────────────────────┤
│  🌍 GLOBAL LEVEL (System-wide)                 │
│  • Roles: super-admin, admin, user              │
│  • Resources: user, session, system, plugin     │
│  • Storage: roles, permissions tables           │
│  • Scope: Application-wide                      │
├─────────────────────────────────────────────────┤
│  🏢 ORGANIZATION LEVEL (Per-organization)       │
│  • Roles: owner, admin, contentManager, etc.    │
│  • Resources: anime, episode, comment           │
│  • Storage: organizationRolePermission table    │
│  • Scope: Organization-scoped                   │
└─────────────────────────────────────────────────┘
```

### Tech Stack

- **Better Auth**: Authentication provider with session/JWT support
- **CASL**: Authorization library for permission-based access control
- **Prisma**: ORM for database operations

---

## Authentication

### Setup Better Auth

**Install dependencies:**
```bash
bun add better-auth
```

**Configuration (auth.ts):**
```typescript
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { organization } from 'better-auth/plugins';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  
  // Email/password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  
  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update every 24 hours
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d',
  },
  
  // Organization plugin for multi-tenancy
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 10,
    }),
  ],
});
```

### Authentication Flows

#### 1. User Registration
```typescript
// GraphQL Mutation
mutation SignUp {
  signUp(input: {
    email: "user@example.com"
    password: "securePassword123"
    name: "John Doe"
  }) {
    user {
      id
      email
      name
    }
    session {
      token
      expiresAt
    }
  }
}
```

#### 2. User Login
```typescript
mutation SignIn {
  signIn(input: {
    email: "user@example.com"
    password: "securePassword123"
  }) {
    user {
      id
      email
    }
    session {
      token
    }
  }
}
```

#### 3. OAuth Providers (Optional)
```typescript
// Support for Google, GitHub, etc.
socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
}
```

---

## Authorization

### CASL Setup

**Install CASL:**
```bash
bun add @casl/ability @casl/prisma
```

**Define Abilities:**
```typescript
import { PureAbility, AbilityBuilder } from '@casl/ability';
import { PrismaQuery, Subjects } from '@casl/prisma';

type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage';
type AppSubjects = 
  | 'User' 
  | 'Anime' 
  | 'Episode' 
  | 'Comment' 
  | 'all';

export type AppAbility = PureAbility<[Actions, Subjects<AppSubjects>], PrismaQuery>;

export function defineAbilitiesFor(user: User): AppAbility {
  const { can, cannot, build } = new AbilityBuilder<AppAbility>(PureAbility);
  
  // Global admin can do everything
  if (user.role === 'super-admin') {
    can('manage', 'all');
    return build();
  }
  
  // Regular admin
  if (user.role === 'admin') {
    can('read', 'all');
    can('create', 'User');
    can('update', 'User');
    cannot('delete', 'User', { role: 'super-admin' });
  }
  
  // Regular user
  can('read', 'User', { id: user.id });
  can('update', 'User', { id: user.id });
  
  return build();
}
```

### Permission Guards

**Create Guard:**
```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<Permission[]>(
      'permissions',
      context.getHandler(),
    );
    
    if (!requiredPermissions) {
      return true; // No permissions required
    }
    
    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user;
    
    if (!user) {
      return false;
    }
    
    const ability = this.caslAbilityFactory.createForUser(user);
    
    return requiredPermissions.every(permission =>
      ability.can(permission.action, permission.subject)
    );
  }
}
```

**Use Guard with Decorator:**
```typescript
import { SetMetadata } from '@nestjs/common';

export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata('permissions', permissions);

// Usage in resolver
@Resolver()
export class UserResolver {
  @Query(() => [User])
  @UseGuards(PermissionGuard)
  @RequirePermissions({ action: 'read', subject: 'User' })
  async users() {
    return this.userService.findAll();
  }
  
  @Mutation(() => User)
  @UseGuards(PermissionGuard)
  @RequirePermissions({ action: 'delete', subject: 'User' })
  async deleteUser(@Args('id') id: string) {
    return this.userService.delete(id);
  }
}
```

---

## Access Control System

### Database Schema

**Global Level Tables:**
```prisma
model Role {
  id           String       @id @default(cuid())
  key          String       @unique // super-admin, admin, user
  name         String
  level        Int          @default(0)
  isSystemRole Boolean      @default(false)
  permissions  Permission[]
  users        User[]
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}

model Permission {
  id          String   @id @default(cuid())
  key         String   @unique // format: resource:action:scope
  resource    String   // user, session, system, etc.
  action      String   // create, read, update, delete
  scope       String?  // own, any, organization
  description String?
  roles       Role[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Organization Level Table:**
```prisma
model OrganizationRolePermission {
  id             String   @id @default(cuid())
  organizationId String
  roleName       String   // owner, admin, contentManager, moderator, member
  resource       String   // anime, episode, comment, etc.
  action         String   // create, read, update, delete
  conditions     Json?    // Additional constraints
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@unique([organizationId, roleName, resource, action])
  @@index([organizationId])
}
```

### Permission Format

**Global Permissions:**
```typescript
{
  key: "user:read:any",
  resource: "user",
  action: "read",
  scope: "any"
}
```

**Organization Permissions:**
```typescript
{
  organizationId: "org_123",
  roleName: "contentManager",
  resource: "anime",
  action: "create",
  conditions: {
    status: ["draft", "published"]
  }
}
```

---

## Implementation Guide

### Step 1: Setup Authentication

```bash
# Generate JWT secret
openssl rand -base64 32

# Add to .env
JWT_SECRET=your_generated_secret
BETTER_AUTH_SECRET=your_auth_secret
BETTER_AUTH_URL=http://localhost:3000
```

### Step 2: Initialize Database

```bash
# Run migrations
cd apps/core
bun prisma migrate dev

# Seed default roles and permissions
bun prisma db seed
```

### Step 3: Implement Auth Module

```typescript
@Module({
  imports: [PrismaModule],
  providers: [
    AuthService,
    CaslAbilityFactory,
    PermissionGuard,
  ],
  exports: [AuthService, CaslAbilityFactory],
})
export class AuthModule {}
```

### Step 4: Protect Routes

```typescript
// Apply globally
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}

// Or per resolver
@UseGuards(PermissionGuard)
@RequirePermissions({ action: 'manage', subject: 'User' })
```

### Step 5: Check Permissions in Code

```typescript
async updateAnime(id: string, data: UpdateAnimeInput, user: User) {
  const anime = await this.prisma.anime.findUnique({ where: { id } });
  const ability = this.caslAbilityFactory.createForUser(user);
  
  if (ability.cannot('update', subject('Anime', anime))) {
    throw new ForbiddenException('You cannot update this anime');
  }
  
  return this.prisma.anime.update({ where: { id }, data });
}
```

---

## API Reference

### Mutations

```graphql
# Sign up
mutation {
  signUp(input: {
    email: "user@example.com"
    password: "password123"
    name: "User Name"
  }) {
    user { id email name }
    session { token expiresAt }
  }
}

# Sign in
mutation {
  signIn(input: {
    email: "user@example.com"
    password: "password123"
  }) {
    session { token }
  }
}

# Create organization
mutation {
  createOrganization(input: {
    name: "My Organization"
    slug: "my-org"
  }) {
    id
    name
    slug
  }
}

# Assign role in organization
mutation {
  assignOrganizationRole(input: {
    organizationId: "org_123"
    userId: "user_456"
    role: "contentManager"
  }) {
    success
  }
}
```

### Queries

```graphql
# Get current user
query {
  me {
    id
    email
    name
    role
    organizations {
      id
      name
      role
    }
  }
}

# Check permissions
query {
  checkPermission(
    action: "create"
    subject: "Anime"
    organizationId: "org_123"
  ) {
    allowed
  }
}
```

---

## Best Practices

### Security
- ✅ Always hash passwords (Better Auth does this automatically)
- ✅ Use HTTPS in production
- ✅ Set secure session cookies
- ✅ Implement rate limiting on auth endpoints
- ✅ Enable CORS properly
- ✅ Rotate JWT secrets regularly

### Performance
- ✅ Cache user abilities (LRU cache recommended)
- ✅ Use database indexes on permission lookups
- ✅ Minimize permission checks in loops
- ✅ Load permissions with user in single query

### Testing
- ✅ Test all permission scenarios
- ✅ Test unauthorized access
- ✅ Test edge cases (deleted users, expired sessions)
- ✅ Mock authentication in tests

---

## Troubleshooting

### Common Issues

**Issue: "Unauthorized" error**
- Check if JWT token is included in Authorization header
- Verify JWT secret matches between services
- Check if session is still valid

**Issue: Permission denied despite having correct role**
- Verify role-permission mapping in database
- Check if permissions are loaded correctly
- Verify organization context is passed

**Issue: Slow permission checks**
- Implement caching for abilities
- Optimize database queries with indexes
- Consider using Redis for session storage

---

## References

- [Better Auth Documentation](https://better-auth.com)
- [CASL Documentation](https://casl.js.org)
- [Task Checklist: Authentication](../tasks/02-auth-authorization.md)

---

**Last Updated**: 2025-10-10
