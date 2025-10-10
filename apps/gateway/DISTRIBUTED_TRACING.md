# Distributed Tracing with Request ID

## Overview

Hệ thống tracking request qua các microservices sử dụng **Request ID** và **Error ID**.

---

## 🔍 How It Works

### Request Flow
```
Client Request
    ↓
Gateway (generates requestId: req_123_xyz)
    ↓ (forwards via X-Request-Id header)
Core Service
    ↓ (forwards via X-Request-Id header)
Other Services
    ↓ (all logs include same requestId)
Response to Client (includes X-Request-Id header)
```

### Error Flow
```
Service Error Occurs
    ↓
Generate errorId: err_req_123_xyz_abc45
    ↓
Log with both requestId and errorId
    ↓
Return to Gateway with errorId
    ↓
Client receives both IDs in response
```

---

## 📊 Response Format

### Success Response
```json
{
  "data": { ... },
  "headers": {
    "X-Request-Id": "req_1696694771893_x7k2m9p4q"
  }
}
```

### Error Response
```json
{
  "message": "User with this email already exists",
  "messageCode": 0,
  "code": 400,
  "timestamp": "2025-10-07T15:46:11.893Z",
  "requestId": "req_1696694771893_x7k2m9p4q",
  "errorId": "err_req_1696694771893_x7k2m9p4q_abc45"
}
```

**Headers:**
```
X-Request-Id: req_1696694771893_x7k2m9p4q
X-Error-Id: err_req_1696694771893_x7k2m9p4q_abc45
X-Error-Source: GraphQL-Gateway
```

---

## 🔧 Implementation

### 1. RequestContextService
Quản lý request context sử dụng AsyncLocalStorage.

```typescript
// Get current requestId
const requestId = contextService.getRequestId();

// Generate errorId (includes requestId prefix)
const errorId = contextService.generateErrorId();
```

### 2. RequestIdMiddleware
Inject requestId vào mọi request và set response header.

```typescript
// Reads from headers or generates new:
// - X-Request-Id
// - X-Correlation-Id

// Sets response header:
res.setHeader('X-Request-Id', requestId);
```

### 3. RequestLoggerInterceptor
Log mọi request/response với requestId.

```
➡️ [req_123_xyz] GET /api/users - 192.168.1.1
⬅️ [req_123_xyz] GET /api/users 200 - 45ms
❌ [req_123_xyz] POST /api/users 400 - 12ms - Validation failed
```

---

## 🚀 Usage in Services

### Gateway Service

**Already Configured:**
- ✅ RequestContextService
- ✅ RequestIdMiddleware
- ✅ RequestLoggerInterceptor
- ✅ GraphQLExecutorService (forwards requestId)
- ✅ SofaApiFactory (uses requestId in errors)

### Core Service (Need to Add)

**1. Install in Core Service:**
```bash
cd apps/core
```

**2. Create RequestContextService:**
```typescript
// Copy from gateway/src/services/request-context.service.ts
```

**3. Create Middleware:**
```typescript
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(private readonly contextService: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Read requestId from header (forwarded from gateway)
    const requestId = req.headers['x-request-id'] as string || 
                      this.contextService.generateRequestId();
    
    res.setHeader('X-Request-Id', requestId);
    
    this.contextService.run({ requestId, timestamp: new Date() }, () => next());
  }
}
```

**4. Update Logger:**
```typescript
// In any service
constructor(private readonly contextService: RequestContextService) {}

someMethod() {
  const requestId = this.contextService.getRequestId();
  this.logger.log(`[${requestId}] Processing user creation...`);
}
```

**5. Update Error Handler:**
```typescript
throw new BadRequestException({
  message: 'User with this email already exists',
  requestId: this.contextService.getRequestId(),
  errorId: this.contextService.generateErrorId(),
});
```

---

## 🔍 Tracking Errors

### Step 1: Client receives error
```bash
POST /api/register
Response:
{
  "message": "User with this email already exists",
  "requestId": "req_1696694771893_x7k2m9p4q",
  "errorId": "err_req_1696694771893_x7k2m9p4q_abc45"
}
```

### Step 2: Search logs by requestId
```bash
# Gateway logs
grep "req_1696694771893_x7k2m9p4q" logs/gateway.log

# Core service logs
grep "req_1696694771893_x7k2m9p4q" logs/core.log

# All services
grep -r "req_1696694771893_x7k2m9p4q" logs/
```

### Step 3: Analyze full request flow
```
[Gateway] ➡️ [req_123_xyz] POST /api/register - 192.168.1.1
[Gateway] 🔄 [req_123_xyz] Delegating to GraphQL...
[Core] ➡️ [req_123_xyz] Mutation: register
[Core] ❌ [req_123_xyz] User validation failed
[Core] ⬅️ [req_123_xyz] 400 - 12ms
[Gateway] ❌ [req_123_xyz] POST /api/register 400 - 45ms
```

---

## 📡 Integration with External Services

### Kafka Messages
```typescript
await producer.send({
  topic: 'user.created',
  messages: [{
    value: JSON.stringify({
      ...userData,
      requestId: this.contextService.getRequestId(),
    }),
  }],
});
```

### Elasticsearch Indexing
```typescript
await elasticsearchService.indexDocument('users', {
  ...user,
  _metadata: {
    requestId: this.contextService.getRequestId(),
    indexedAt: new Date(),
  },
});
```

### External API Calls
```typescript
const response = await fetch('https://external-api.com', {
  headers: {
    'X-Request-Id': this.contextService.getRequestId(),
    'X-Correlation-Id': this.contextService.getRequestId(),
  },
});
```

---

## 🔧 Configuration

### Enable Middleware in Gateway

**gateway.module.ts:**
```typescript
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { RequestIdMiddleware } from './middleware/request-id.middleware';
import { RequestContextService } from './services/request-context.service';

@Module({
  providers: [RequestContextService, RequestIdMiddleware],
  exports: [RequestContextService],
})
export class GatewayModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
```

### Enable Interceptor Globally

**main.ts:**
```typescript
import { RequestLoggerInterceptor } from './interceptors/request-logger.interceptor';
import { RequestContextService } from './services/request-context.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const contextService = app.get(RequestContextService);
  app.useGlobalInterceptors(new RequestLoggerInterceptor(contextService));
  
  await app.listen(3000);
}
```

---

## 📊 Monitoring & Analytics

### Query by Request ID
```bash
# ElasticSearch
GET /logs/_search
{
  "query": {
    "match": { "requestId": "req_1696694771893_x7k2m9p4q" }
  }
}

# Kibana
requestId: "req_1696694771893_x7k2m9p4q"
```

### Error Rate by Service
```bash
# Group errors by service
GET /logs/_search
{
  "aggs": {
    "by_service": {
      "terms": { "field": "service.keyword" },
      "aggs": {
        "error_count": {
          "filter": { "exists": { "field": "errorId" } }
        }
      }
    }
  }
}
```

### Request Duration Tracking
```bash
# Track request flow timing
[Gateway] ➡️ [req_123] 0ms - Request received
[Gateway] 🔄 [req_123] 5ms - Delegating to Core
[Core] ➡️ [req_123] 5ms - Processing mutation
[Core] ⬅️ [req_123] 50ms - Response sent (45ms processing)
[Gateway] ⬅️ [req_123] 55ms - Response to client (total: 55ms)
```

---

## 🎯 Benefits

✅ **Full Request Tracing**: Track request qua tất cả microservices  
✅ **Error Debugging**: Dễ dàng tìm root cause của error  
✅ **Performance Analysis**: Measure latency giữa các services  
✅ **Distributed Context**: Share context data across services  
✅ **Client Transparency**: Client có thể report lỗi với requestId  
✅ **Audit Trail**: Complete log trail cho compliance  

---

## 📝 Best Practices

1. **Always Forward Headers**
   - Luôn forward `X-Request-Id` khi gọi service khác
   - Dùng `X-Correlation-Id` cho backward compatibility

2. **Log Format Consistency**
   - Format: `[{requestId}] {message}`
   - Include trong mọi log statement

3. **Error Response Format**
   - Always include `requestId` và `errorId` trong error response
   - Set trong response headers

4. **AsyncLocalStorage**
   - Dùng AsyncLocalStorage thay vì thread-local
   - Tự động propagate qua async calls

5. **ID Format**
   - Request: `req_{timestamp}_{random}`
   - Error: `err_req_{timestamp}_{random}_{errorRandom}`

---

## 🔗 Related Files

- `apps/gateway/src/services/request-context.service.ts`
- `apps/gateway/src/middleware/request-id.middleware.ts`
- `apps/gateway/src/interceptors/request-logger.interceptor.ts`
- `apps/gateway/src/services/graphql-executor.service.ts`
- `apps/gateway/src/factories/sofa-api.factory.ts`

---

*Last Updated: October 7, 2025*
*Distributed Tracing System - Production Ready*
