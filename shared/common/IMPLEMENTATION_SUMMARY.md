# Request Tracking - Shared Library Summary

## ✅ Implementation Complete

### Files Created in `shared/common`:
1. `src/services/request-context.service.ts` - Core service with AsyncLocalStorage
2. `src/middleware/request-id.middleware.ts` - Middleware with factory function
3. `REQUEST_CONTEXT_SERVICE.md` - Complete documentation

### Files Updated:
1. `shared/common/src/index.ts` - Export new services
2. `apps/gateway/src/app.module.ts` - Use from @anineplus/common
3. `apps/gateway/src/factories/sofa-api.factory.ts` - Import from shared
4. `apps/gateway/src/services/graphql-executor.service.ts` - Import from shared
5. `apps/core/src/app.module.ts` - Use from @anineplus/common
6. `apps/core/src/auth/auth.service.ts` - Import from shared
7. `apps/core/src/auth/auth.module.ts` - Import from shared

### Files Deleted (no longer needed):
1. `apps/gateway/src/services/request-context.service.ts`
2. `apps/gateway/src/middleware/request-id.middleware.ts`
3. `apps/core/src/common/services/request-context.service.ts`
4. `apps/core/src/common/middleware/request-id.middleware.ts`

---

## 🎯 How to Use in Any Service

### Step 1: Import from @anineplus/common
```typescript
import { 
  RequestContextService, 
  createRequestIdMiddleware 
} from '@anineplus/common';
```

### Step 2: Create Service-Specific Middleware
```typescript
// In your app.module.ts
const YourServiceRequestIdMiddleware = createRequestIdMiddleware('your-service-name');
```

### Step 3: Register in Module
```typescript
@Module({
  providers: [
    RequestContextService,
    YourServiceRequestIdMiddleware,
  ],
})
export class YourModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(YourServiceRequestIdMiddleware).forRoutes('*');
  }
}
```

### Step 4: Use in Services
```typescript
@Injectable()
export class YourService {
  constructor(private readonly contextService: RequestContextService) {}

  async yourMethod() {
    const requestId = this.contextService.getRequestId();
    this.logger.log(`[${requestId}] Processing...`);
  }
}
```

---

## 📊 Current Implementation Status

### ✅ Gateway Service
- Using shared RequestContextService
- Middleware: `GatewayRequestIdMiddleware`
- Logs with requestId format
- Forwards requestId to Core service

### ✅ Core Service  
- Using shared RequestContextService
- Middleware: `CoreRequestIdMiddleware`
- Auth service logs with requestId
- Returns requestId in error responses

### ⏳ Searcher Service (Next)
```typescript
// TODO: Add to apps/searcher/src/app.module.ts
import { RequestContextService, createRequestIdMiddleware } from '@anineplus/common';

const SearcherRequestIdMiddleware = createRequestIdMiddleware('searcher');

@Module({
  providers: [RequestContextService, SearcherRequestIdMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SearcherRequestIdMiddleware).forRoutes('*');
  }
}
```

### ⏳ Logger Service (Future)
Same pattern as above.

---

## 🔍 Example Flow

```
1. Client Request
   POST http://gateway:3000/api/register
   
2. Gateway Middleware
   - Generates: req_1696694771893_x7k2m9p4q
   - Sets header: X-Request-Id
   
3. Gateway Service
   [req_123_xyz] POST /api/register
   [req_123_xyz] Delegating to Core...
   
4. Core Middleware
   - Reads X-Request-Id from header
   - Creates context with same requestId
   
5. Core Service
   [req_123_xyz] 📝 Registration attempt
   [req_123_xyz] ⚠️ User already exists
   
6. Error Response
   {
     "message": "User already exists",
     "requestId": "req_123_xyz"
   }
   
7. Search Logs
   grep "req_123_xyz" logs/*.log
   
8. Result: Full flow visible!
   [Gateway] [req_123_xyz] POST /api/register
   [Gateway] [req_123_xyz] Delegating to Core
   [Core] [req_123_xyz] Registration attempt
   [Core] [req_123_xyz] User already exists
```

---

## 🎯 Benefits of Shared Library

✅ **Single Source of Truth**
- One implementation for all services
- Consistent behavior everywhere

✅ **Easy Maintenance**
- Update once in shared/common
- All services automatically benefit

✅ **Type Safety**
- Full TypeScript support
- Compile-time checks

✅ **Zero Duplication**
- No copy-paste between services
- DRY principle

✅ **Version Control**
- Update shared library version
- Services opt-in to updates

---

## 📝 Testing

### Test Gateway:
```bash
cd apps/gateway
bun dev

curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'

# Check response header
X-Request-Id: req_123_xyz
```

### Test Core:
```bash
cd apps/core
bun dev

# Gateway will forward X-Request-Id header
# Core logs will show same requestId
[req_123_xyz] 📝 Registration attempt
```

### Search Logs:
```bash
grep "req_123_xyz" apps/*/logs/*.log

# Result: See full flow across services!
```

---

## 🚀 Next Steps

### For Searcher Service:
1. Add import in `apps/searcher/src/app.module.ts`
2. Create `SearcherRequestIdMiddleware`
3. Register middleware
4. Update Kafka handlers to use requestId

### For Logger Service:
Same pattern as Searcher.

### For All Services:
- Use `this.contextService.formatLog(message)` helper
- Follow emoji convention for logs
- Forward requestId in Kafka messages
- Include requestId in error responses

---

## 📚 Documentation

- **Shared Library**: `shared/common/REQUEST_CONTEXT_SERVICE.md`
- **Gateway Guide**: `apps/gateway/DISTRIBUTED_TRACING.md`
- **Core Guide**: `apps/core/REQUEST_TRACKING.md`
- **API Summary**: `apps/gateway/REQUEST_TRACKING_SUMMARY.md`

---

*Shared Library Implementation - Production Ready* ✅

**Key Achievement**: Single source of truth for request tracking across all microservices!
