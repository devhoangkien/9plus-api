# Standard Response Format

## Overview

Tất cả API responses đều tuân theo format chuẩn để đảm bảo tính nhất quán.

## Response Formats

### 1. Paginated Response (Danh sách có phân trang)

```typescript
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "perPage": 10,
    "totalItems": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "message": "Optional success message"
}
```

### 2. Single Item Response (Đối tượng đơn)

```typescript
{
  "success": true,
  "data": {...},
  "message": "Optional success message"
}
```

### 3. Error Response (Lỗi)

```typescript
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is invalid",
      "code": "VALIDATION_ERROR"
    }
  ],
  "timestamp": "2025-10-11T10:30:00.000Z",
  "path": "/api/users",
  "requestId": "req-123-456"
}
```

## Usage Examples

### GraphQL Resolver

```typescript
import { 
  PaginatedResponseType, 
  SingleResponseType,
  createPaginatedResponse,
  createSingleResponse,
  QueryInput,
} from '@anineplus/common';
import { ObjectType, Resolver, Query, Args } from '@nestjs/graphql';

// 1. Define your entity
@ObjectType()
class User {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;
}

// 2. Create response types
@ObjectType()
class PaginatedUserResponse extends PaginatedResponseType(User) {}

@ObjectType()
class SingleUserResponse extends SingleResponseType(User) {}

// 3. Use in resolver
@Resolver()
export class UserResolver {
  @Query(() => PaginatedUserResponse)
  async users(@Args() query: QueryInput): Promise<PaginatedUserResponse> {
    const users = await this.userService.findAll(query);
    const total = await this.userService.count();
    
    return createPaginatedResponse(
      users,
      query.page || 1,
      query.limit || 10,
      total,
      'Users fetched successfully'
    );
  }

  @Query(() => SingleUserResponse)
  async user(@Args('id') id: string): Promise<SingleUserResponse> {
    const user = await this.userService.findOne(id);
    return createSingleResponse(user, 'User fetched successfully');
  }
}
```

### REST API (với Sofa)

GraphQL queries sẽ tự động được convert sang REST endpoints:

```bash
# Paginated list
GET /api/users?page=1&limit=10&search=john

# Single item
GET /api/user/123

# With filters
GET /api/users?page=1&limit=10&filters[0][field]=status&filters[0][operator]=eq&filters[0][value]=active

# With sorting
GET /api/users?page=1&limit=10&sort[0][field]=createdAt&sort[0][direction]=DESC
```

### Query Input Parameters

```typescript
import { QueryInput } from '@anineplus/common';

@Args() query: QueryInput
// Includes:
// - page: number (default: 1)
// - limit: number (default: 10, max: 100)
// - search: string (optional)
// - sort: SortInput[] (optional)
// - filters: FilterInput[] (optional)
```

### Helper Functions

```typescript
import {
  createPaginatedResponse,
  createSingleResponse,
  createErrorResponse,
} from '@anineplus/common';

// Create paginated response
const paginatedResult = createPaginatedResponse(
  items,
  page,
  limit,
  totalCount,
  'Success message' // optional
);

// Create single item response
const singleResult = createSingleResponse(
  item,
  'Success message' // optional
);

// Create error response
const errorResult = createErrorResponse(
  'Error message',
  [{ field: 'email', message: 'Invalid email', code: 'INVALID' }],
  '/api/users',
  'req-123'
);
```

### Enable Auto-formatting for REST API

Thêm interceptor vào app module để tự động format responses:

```typescript
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseFormatInterceptor } from '@anineplus/common';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseFormatInterceptor,
    },
  ],
})
export class AppModule {}
```

## Benefits

1. **Consistency**: Tất cả APIs đều có format giống nhau
2. **Type Safety**: TypeScript types đầy đủ
3. **Auto-complete**: IDE hỗ trợ autocomplete
4. **Pagination**: Built-in pagination với metadata đầy đủ
5. **Error Handling**: Error format chuẩn với chi tiết
6. **Request Tracing**: Bao gồm requestId để trace requests
7. **GraphQL + REST**: Hoạt động với cả GraphQL và REST API

## Best Practices

1. Luôn sử dụng `createPaginatedResponse` cho danh sách
2. Luôn sử dụng `createSingleResponse` cho đối tượng đơn
3. Bao gồm `message` để mô tả kết quả
4. Sử dụng `QueryInput` để nhận pagination/filter parameters
5. Đặt limit tối đa 100 items per page
6. Luôn trả về `requestId` trong error responses
