# Response Format Implementation - Summary

## ✅ Hoàn thành

Đã tích hợp response format chuẩn vào Gateway cho cả GraphQL và REST API.

## 📁 Files đã tạo/sửa

### Shared Common Package
1. **`shared/common/src/dto/base-response.dto.ts`** ✨ NEW
   - `PaginationMeta` - Pagination metadata
   - `PaginatedResponse<T>` - Interface cho response có phân trang
   - `SingleResponse<T>` - Interface cho response đơn
   - `ErrorResponse` - Interface cho error response
   - Helper functions: `createPaginatedResponse()`, `createSingleResponse()`, `createErrorResponse()`

2. **`shared/common/src/dto/response-type.factory.ts`** ✨ NEW
   - `PaginatedResponseType(Class)` - Factory tạo GraphQL paginated response type
   - `SingleResponseType(Class)` - Factory tạo GraphQL single response type
   - `ErrorResponseType` - GraphQL error response type
   - `ErrorDetail` - Error detail type

3. **`shared/common/src/dto/pagination.dto.ts`** ✨ NEW
   - `PaginationInput` - Input cho pagination (page, limit)
   - `SortInput` - Input cho sorting
   - `FilterInput` - Input cho filtering
   - `QueryInput` - Combined input với pagination, sorting, filtering, search

4. **`shared/common/src/dto/README.md`** ✨ NEW
   - Documentation đầy đủ về cách sử dụng response format

5. **`shared/common/src/index.ts`** 🔧 UPDATED
   - Export tất cả DTO và factories

### Gateway Service
6. **`apps/gateway/src/main.ts`** 🔧 UPDATED
   - Thêm middleware format response cho REST API
   - Apply trước khi mount Sofa
   - Logging chi tiết cho debugging

7. **`apps/gateway/src/factories/sofa-api.factory.ts`** 🔧 UPDATED
   - Cập nhật error handler với standard error format
   - Bao gồm `success`, `errors`, `requestId`, `timestamp`

8. **`apps/gateway/src/app.module.ts`** 🔧 UPDATED
   - Import RequestContextService
   - Loại bỏ middleware không sử dụng

9. **`apps/gateway/RESPONSE_FORMAT.md`** ✨ NEW
   - Documentation chi tiết về response format trong Gateway
   - Examples cho GraphQL và REST API

### Core Service
10. **`apps/core/package.json`** 🔧 UPDATED
    - Thêm `@anineplus/authorization` và `@anineplus/common` với `link:` syntax

11. **`apps/core/src/users/RESPONSE_FORMAT_EXAMPLE.ts`** ✨ NEW
    - Example resolver sử dụng response format
    - Bao gồm paginated và single responses

## 🎯 Response Formats

### REST API (qua Sofa)

#### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-10-11T10:30:00.000Z",
  "requestId": "req-gateway-123"
}
```

#### Paginated Response
```json
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
  "timestamp": "2025-10-11T10:30:00.000Z",
  "requestId": "req-gateway-123"
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "message": "Detailed error",
      "path": ["fieldName"],
      "extensions": { ... }
    }
  ],
  "messageCode": "MSG_001",
  "code": 400,
  "timestamp": "2025-10-11T10:30:00.000Z",
  "requestId": "req-gateway-123"
}
```

### GraphQL API

GraphQL responses giữ nguyên schema chuẩn:

```json
{
  "data": {
    "users": {
      "success": true,
      "data": [...],
      "pagination": { ... }
    }
  }
}
```

Response Headers:
- `X-Request-Id`: Request tracking ID
- `X-Response-Time`: Response timestamp

## 🚀 Cách sử dụng

### 1. Trong Resolver (Core Service)

```typescript
import { 
  PaginatedResponseType, 
  SingleResponseType,
  createPaginatedResponse,
  createSingleResponse,
  QueryInput,
} from '@anineplus/common';

// Define entity
@ObjectType()
class User {
  @Field(() => ID)
  id!: string;
  
  @Field()
  name!: string;
}

// Create response types
@ObjectType()
class PaginatedUserResponse extends PaginatedResponseType(User) {}

@ObjectType()
class SingleUserResponse extends SingleResponseType(User) {}

// Use in resolver
@Resolver()
export class UserResolver {
  @Query(() => PaginatedUserResponse)
  async users(@Args() query: QueryInput) {
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
  async user(@Args('id') id: string) {
    const user = await this.userService.findOne(id);
    return createSingleResponse(user, 'User fetched successfully');
  }
}
```

### 2. REST API Endpoints

Gateway tự động format responses khi gọi qua REST API:

```bash
# Paginated list
GET http://localhost:3000/api/users?page=1&limit=10

# Single item
GET http://localhost:3000/api/user/123
```

### 3. GraphQL Queries

```graphql
query GetUsers($page: Int, $limit: Int) {
  users(page: $page, limit: $limit) {
    success
    data {
      id
      name
    }
    pagination {
      currentPage
      totalPages
      hasNextPage
    }
  }
}
```

## 🔍 Debugging

Gateway có logging chi tiết:
- `📥 REST API Request: GET /path` - Khi nhận request
- `📤 REST API Response formatting for: /path` - Khi format response
- `✅ Response already formatted` - Nếu đã có format
- `📊 Formatting paginated response` - Format pagination
- `📦 Wrapping response in standard format` - Wrap response thông thường

## 📊 Benefits

1. **Consistency**: Tất cả APIs có format giống nhau
2. **Traceability**: Mỗi response có `requestId` để trace
3. **Timestamps**: Tất cả responses có ISO timestamp
4. **Type Safety**: Full TypeScript support
5. **Auto-format**: Tự động format cho REST API
6. **Flexible**: GraphQL giữ nguyên schema structure
7. **Error Handling**: Error format chuẩn với chi tiết

## 🧪 Testing

```bash
# Start Gateway
bun gateway

# Test REST API
curl http://localhost:3000/api/users?page=1&limit=10

# Test GraphQL
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ users(page: 1, limit: 10) { success data { id name } } }"}'
```

## 📝 Next Steps

1. ✅ Build shared/common package
2. ✅ Update resolvers để sử dụng response format
3. ✅ Test REST API endpoints
4. ✅ Test GraphQL queries
5. ⏳ Update existing resolvers trong Core service
6. ⏳ Add unit tests cho response formatting
7. ⏳ Update API documentation

## 🎉 Completed!

Response format system đã được tích hợp hoàn chỉnh vào Gateway và sẵn sàng sử dụng!
