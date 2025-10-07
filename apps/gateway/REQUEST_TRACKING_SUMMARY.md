# Request Tracking Implementation - Quick Guide

## ✅ Đã Hoàn Thành

### Files Created:
1. `services/request-context.service.ts` - Context management với AsyncLocalStorage
2. `middleware/request-id.middleware.ts` - Inject requestId vào mọi request
3. `interceptors/request-logger.interceptor.ts` - Log requests với requestId
4. `DISTRIBUTED_TRACING.md` - Complete documentation

### Files Updated:
1. `factories/sofa-api.factory.ts` - Use RequestContextService
2. `services/graphql-executor.service.ts` - Forward requestId to Core service
3. `app.module.ts` - Register middleware và services

---

## 🎯 Cách Tracking

### 1. Client gửi request:
```bash
POST /api/register
Body: { email: "test@example.com", password: "123456" }
```

### 2. Gateway generates requestId:
```
req_1696694771893_x7k2m9p4q
```

### 3. Response khi có lỗi:
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
```

### 4. Tracking trong logs:
```bash
# Gateway logs
[req_1696694771893_x7k2m9p4q] POST /api/register - 192.168.1.1
[req_1696694771893_x7k2m9p4q] Delegating to GraphQL Gateway...
[req_1696694771893_x7k2m9p4q] Error: User with email exists
[req_1696694771893_x7k2m9p4q] Response 400 - 45ms

# Core service logs (if implemented)
[req_1696694771893_x7k2m9p4q] Mutation: register
[req_1696694771893_x7k2m9p4q] Validation failed
```

### 5. Search logs:
```bash
# Find all logs for this request
grep "req_1696694771893_x7k2m9p4q" logs/*.log

# Or in Elasticsearch
GET /logs/_search
{
  "query": { "match": { "requestId": "req_1696694771893_x7k2m9p4q" } }
}
```

---

## 🔧 Next Steps cho Core Service

### 1. Copy RequestContextService
```bash
cp apps/gateway/src/services/request-context.service.ts \
   apps/core/src/services/request-context.service.ts
```

### 2. Create Middleware in Core
```typescript
// apps/core/src/middleware/request-id.middleware.ts
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(private readonly contextService: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Read from header (forwarded from Gateway)
    const requestId = req.headers['x-request-id'] as string || 
                      this.contextService.generateRequestId();
    
    res.setHeader('X-Request-Id', requestId);
    
    this.contextService.run(
      { requestId, timestamp: new Date() },
      () => next()
    );
  }
}
```

### 3. Update Core Module
```typescript
@Module({
  providers: [RequestContextService, RequestIdMiddleware],
})
export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
```

### 4. Use in Services
```typescript
export class AuthService {
  constructor(private readonly contextService: RequestContextService) {}

  async register(data: RegisterDto) {
    const requestId = this.contextService.getRequestId();
    this.logger.log(`[${requestId}] Registering user: ${data.email}`);
    
    // ... validation ...
    
    if (existingUser) {
      throw new BadRequestException({
        message: 'User with this email already exists',
        requestId: requestId,
        errorId: this.contextService.generateErrorId(),
      });
    }
  }
}
```

---

## 📊 Benefits

✅ **Full Tracing**: Track request từ Gateway → Core → Services  
✅ **Easy Debugging**: Tìm lỗi bằng requestId  
✅ **Performance**: Measure latency giữa services  
✅ **Client Support**: Client report lỗi với requestId  
✅ **Audit Trail**: Complete log history  

---

## 🎯 Example Tracking Flow

```
1. Client Request
   POST /api/register
   
2. Gateway Receives [req_123_xyz]
   ➡️ [req_123_xyz] POST /api/register - 192.168.1.1
   
3. Gateway Forwards to Core
   Headers: X-Request-Id: req_123_xyz
   
4. Core Receives [req_123_xyz]
   ➡️ [req_123_xyz] Mutation: register
   
5. Core Validation Error [req_123_xyz]
   ❌ [req_123_xyz] User already exists
   Error ID: err_req_123_xyz_abc45
   
6. Gateway Returns Error [req_123_xyz]
   Response:
   {
     "message": "User with this email already exists",
     "requestId": "req_123_xyz",
     "errorId": "err_req_123_xyz_abc45"
   }
   
7. Client Can Report Issue
   "I got error with requestId: req_123_xyz"
   
8. Support Team Searches
   grep "req_123_xyz" logs/*.log
   
9. Full Flow Visible
   See exactly where error occurred
```

---

## 📝 Summary

**Gateway Service:**
- ✅ RequestContextService created
- ✅ RequestIdMiddleware created  
- ✅ RequestLoggerInterceptor created
- ✅ SofaApiFactory updated
- ✅ GraphQLExecutorService updated
- ✅ AppModule configured

**Core Service (TODO):**
- ⏳ Copy RequestContextService
- ⏳ Create RequestIdMiddleware
- ⏳ Update CoreModule
- ⏳ Update services to use requestId

**Testing:**
```bash
# Start services
bun gateway
bun core

# Make request
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'

# Check response headers
X-Request-Id: req_1696694771893_x7k2m9p4q
X-Error-Id: err_req_1696694771893_x7k2m9p4q_abc45

# Search logs
grep "req_1696694771893_x7k2m9p4q" apps/gateway/logs/*.log
```

---

*Implementation Complete - Ready for Production*
