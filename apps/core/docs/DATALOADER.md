# DataLoader Implementation Guide

## Overview

This project uses [DataLoader](https://github.com/graphql/dataloader) to optimize database queries in GraphQL resolvers. DataLoader provides batching and caching capabilities to solve the N+1 query problem.

## What is DataLoader?

DataLoader is a utility that:
- **Batches** multiple individual data requests into a single batch request
- **Caches** results within a single request to avoid duplicate queries
- **Optimizes** GraphQL query performance by reducing database round-trips

## Architecture

### Base Service
- **Location**: `shared/common/src/services/dataloader.service.ts`
- **Package**: `@anineplus/common`
- **Purpose**: Generic DataLoader manager for creating and managing DataLoader instances
- **Scope**: Request-scoped to ensure each GraphQL request gets fresh DataLoader instances
- **Usage**: Can be imported from `@anineplus/common` in any service (core, searcher, gateway, etc.)

### Service-Specific DataLoaders

#### UsersDataLoaderService
**Location**: `apps/core/src/users/users.dataloader.service.ts`

Provides batch loaders for:
- `createUserByIdLoader()` - Batch load users by ID
- `createUserByEmailLoader()` - Batch load users by email
- `createUserByUsernameLoader()` - Batch load users by username

**Example Usage**:
```typescript
// In UsersService
const user = await this.userByIdLoader.load(userId);
```

#### RolesDataLoaderService
**Location**: `apps/core/src/roles/roles.dataloader.service.ts`

Provides batch loaders for:
- `createRoleByIdLoader()` - Batch load roles by ID
- `createRoleByKeyLoader()` - Batch load roles by key

**Example Usage**:
```typescript
// In RolesService
const role = await this.roleByIdLoader.load(roleId);
```

## How It Works

### Before DataLoader
```typescript
// Multiple individual queries - N+1 problem
async findById(id: string) {
  return this.prisma.user.findUnique({ where: { id } });
}

// If called 10 times in one request = 10 database queries
```

### After DataLoader
```typescript
// Single batched query
async findById(id: string) {
  return this.userByIdLoader.load(id);
}

// If called 10 times in one request = 1 batched database query
// Example: SELECT * FROM users WHERE id IN (id1, id2, ..., id10)
```

## Benefits

1. **Performance**: Reduces database round-trips by batching queries
2. **Caching**: Eliminates duplicate queries within a single request
3. **Simplicity**: Service methods remain simple and easy to use
4. **GraphQL Optimization**: Especially useful for nested GraphQL queries

## Example Scenario

Consider a GraphQL query that fetches users and their roles:

```graphql
query {
  users {
    id
    email
    roles {
      id
      name
    }
  }
}
```

### Without DataLoader
- 1 query to fetch users
- N queries to fetch roles for each user (N+1 problem)
- Total: N+1 database queries

### With DataLoader
- 1 query to fetch users
- 1 batched query to fetch all roles
- Total: 2 database queries

## Adding New DataLoaders

To add DataLoader support to any service (core, searcher, gateway, etc.):

1. **Import DataLoader from shared/common**:
```typescript
// In any service: apps/core, apps/searcher, apps/gateway, etc.
import DataLoader from 'dataloader';
import { DataLoaderService } from '@anineplus/common';
```

2. **Create DataLoader Service**:
```typescript
// Example: apps/core/src/yourmodule/yourmodule.dataloader.service.ts
import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class YourModuleDataLoaderService {
  constructor(private prisma: PrismaService) {}

  private async batchLoadByIds(ids: readonly string[]) {
    const items = await this.prisma.yourModel.findMany({
      where: { id: { in: [...ids] } },
    });
    
    const itemMap = new Map(items.map(item => [item.id, item]));
    return ids.map(id => itemMap.get(id) || null);
  }

  createByIdLoader(): DataLoader<string, YourType | null> {
    return new DataLoader(
      (ids) => this.batchLoadByIds(ids),
      { cache: true }
    );
  }
}
```

3. **Update Service**:
```typescript
// yourmodule.service.ts
import { YourModuleDataLoaderService } from './yourmodule.dataloader.service';
import DataLoader from 'dataloader';

@Injectable()
export class YourModuleService {
  private byIdLoader: DataLoader<string, YourType | null>;

  constructor(
    private prisma: PrismaService,
    private dataLoaderService: YourModuleDataLoaderService,
  ) {
    this.byIdLoader = this.dataLoaderService.createByIdLoader();
  }

  async findById(id: string) {
    return this.byIdLoader.load(id);
  }
}
```

4. **Update Module**:
```typescript
// yourmodule.module.ts
@Module({
  providers: [
    YourModuleService,
    YourModuleDataLoaderService,
  ],
  exports: [YourModuleService, YourModuleDataLoaderService],
})
export class YourModuleModule {}
```

## Best Practices

1. **Use for Individual Record Lookups**: DataLoader works best for loading individual records by ID or unique keys
2. **Don't Use for Complex Queries**: Keep using Prisma directly for complex queries with filters, pagination, etc.
3. **Request Scope**: Ensure DataLoaders are request-scoped to prevent data leaking between requests
4. **Cache Strategy**: DataLoader caches within a single request by default - this is intentional
5. **Batch Function**: Always return results in the same order as input keys

## Monitoring

To verify DataLoader is working:
1. Enable Prisma query logging in development
2. Watch for batched queries instead of individual queries
3. Monitor database query count before and after implementation

## References

- [DataLoader GitHub](https://github.com/graphql/dataloader)
- [GraphQL N+1 Problem](https://www.apollographql.com/blog/backend/data-sources/solving-the-n1-problem/)
- [NestJS Request Scope](https://docs.nestjs.com/fundamentals/injection-scopes)
