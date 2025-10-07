# Request Context Service - Shared Library

## 📦 Location
`shared/common/src/services/request-context.service.ts`

## 🎯 Purpose
Shared service để tracking requestId across tất cả microservices sử dụng AsyncLocalStorage.

---

## 🚀 Usage

### 1. Import trong Service

```typescript
import { RequestContextService } from '@anineplus/common';

@Injectable()
export class YourService {
  private readonly logger = new Logger(YourService.name);

  constructor(
    private readonly contextService: RequestContextService,
  ) {}

  async yourMethod() {
    const requestId = this.contextService.getRequestId();
    this.logger.log(`[${requestId}] Processing...`);
  }
}
```

### 2. Setup Middleware trong Module

```typescript
import { 
  RequestContextService, 
  createRequestIdMiddleware 
} from '@anineplus/common';

// Create service-specific middleware
const YourServiceRequestIdMiddleware = createRequestIdMiddleware('your-service-name');

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

---

## 📊 API Reference

### Methods

#### `getRequestId(): string`
Get current requestId from AsyncLocalStorage context.
```typescript
const requestId = this.contextService.getRequestId();
// Returns: "req_1696694771893_x7k2m9p4q"
```

#### `getUserId(): string | undefined`
Get current userId from context (if available).
```typescript
const userId = this.contextService.getUserId();
```

#### `getService(): string | undefined`
Get current service name from context.
```typescript
const service = this.contextService.getService();
// Returns: "gateway", "core", "searcher", etc.
```

#### `generateRequestId(): string`
Generate new unique requestId.
```typescript
const newRequestId = this.contextService.generateRequestId();
// Returns: "req_1696694771893_x7k2m9p4q"
```

#### `generateErrorId(): string`
Generate errorId with requestId prefix.
```typescript
const errorId = this.contextService.generateErrorId();
// Returns: "err_req_1696694771893_x7k2m9p4q_abc45"
```

#### `formatLog(message: string): string`
Format log message with requestId prefix.
```typescript
const formatted = this.contextService.formatLog('User created');
// Returns: "[req_123_xyz] User created"
```

---

## 🔧 Middleware Configuration

### Basic Setup (Auto-detect service name)
```typescript
import { createRequestIdMiddleware, RequestContextService } from '@anineplus/common';

const RequestIdMiddleware = createRequestIdMiddleware('gateway');

@Module({
  providers: [RequestContextService, RequestIdMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
```

### How Middleware Works
1. **Reads requestId from headers**:
   - `X-Request-Id` (primary)
   - `X-Correlation-Id` (fallback)
   - Generates new if not found

2. **Sets response header**:
   - `X-Request-Id: req_123_xyz`

3. **Creates context** with:
   - requestId
   - timestamp
   - path
   - method
   - userId (from JWT)
   - service name

---

## 📝 Examples

### Example 1: Simple Logging
```typescript
@Injectable()
export class UserService {
  constructor(private readonly contextService: RequestContextService) {}

  async createUser(data: CreateUserDto) {
    const requestId = this.contextService.getRequestId();
    
    this.logger.log(`[${requestId}] 📝 Creating user: ${data.email}`);
    
    const user = await this.prisma.user.create({ data });
    
    this.logger.log(`[${requestId}] ✅ User created: ${user.id}`);
    
    return user;
  }
}
```

### Example 2: Error Handling
```typescript
@Injectable()
export class AuthService {
  constructor(private readonly contextService: RequestContextService) {}

  async register(email: string, password: string) {
    const requestId = this.contextService.getRequestId();
    
    const existing = await this.findByEmail(email);
    
    if (existing) {
      this.logger.warn(`[${requestId}] ⚠️ User already exists: ${email}`);
      
      throw new BadRequestException({
        message: 'User already exists',
        requestId,
      });
    }
    
    // ... continue
  }
}
```

### Example 3: Kafka Message
```typescript
@Injectable()
export class UserEventProducer {
  constructor(private readonly contextService: RequestContextService) {}

  async publishUserCreated(user: User) {
    const requestId = this.contextService.getRequestId();
    
    await this.kafkaProducer.send({
      topic: 'user.created',
      messages: [{
        value: JSON.stringify({
          userId: user.id,
          email: user.email,
          requestId, // Forward requestId
        }),
      }],
    });
    
    this.logger.log(`[${requestId}] 🚀 Published user.created event`);
  }
}
```

### Example 4: Elasticsearch Indexing
```typescript
@Injectable()
export class SearchService {
  constructor(private readonly contextService: RequestContextService) {}

  async indexUser(user: User) {
    const requestId = this.contextService.getRequestId();
    
    await this.elasticsearch.indexDocument('users', {
      ...user,
      _metadata: {
        requestId,
        indexedAt: new Date(),
      },
    });
    
    this.logger.log(`[${requestId}] 📊 User indexed: ${user.id}`);
  }
}
```

---

## 🔍 Distributed Tracing Flow

```
Client Request
    ↓
Gateway (generates requestId: req_123_xyz)
    ├─ Middleware: Creates context
    ├─ Service: Logs with [req_123_xyz]
    ├─ HTTP Header: X-Request-Id: req_123_xyz
    ↓
Core Service
    ├─ Middleware: Reads X-Request-Id header
    ├─ Service: Logs with same [req_123_xyz]
    ├─ Kafka: Forwards requestId in message
    ↓
Searcher Service
    ├─ Kafka Consumer: Reads requestId from message
    ├─ Service: Logs with same [req_123_xyz]
    ├─ Elasticsearch: Stores in _metadata
    ↓
All logs correlated by requestId!
```

---

## 🏗️ Services Using This Library

### ✅ Gateway Service
```typescript
const GatewayRequestIdMiddleware = createRequestIdMiddleware('gateway');
```

### ✅ Core Service
```typescript
const CoreRequestIdMiddleware = createRequestIdMiddleware('core');
```

### ⏳ Searcher Service (TODO)
```typescript
const SearcherRequestIdMiddleware = createRequestIdMiddleware('searcher');
```

### ⏳ Logger Service (TODO)
```typescript
const LoggerRequestIdMiddleware = createRequestIdMiddleware('logger');
```

---

## 📊 Log Format Convention

Use emojis for visual scanning:
- `📝` Starting operation
- `✅` Success
- `⚠️` Warning
- `❌` Error
- `🔄` Processing/Retry
- `💾` Database operation
- `📡` External API
- `🔐` Authentication
- `🚀` Kafka/Event
- `📊` Elasticsearch
- `🔍` Search/Query

Example complete flow:
```
[req_123_xyz] 📝 Registration started
[req_123_xyz] 🔐 Validating credentials
[req_123_xyz] 🔍 Checking existing user
[req_123_xyz] 💾 Creating user in database
[req_123_xyz] 🚀 Publishing user.created event
[req_123_xyz] 📡 Sending welcome email
[req_123_xyz] ✅ Registration complete
```

---

## 🎯 Benefits

✅ **Single Source of Truth**: Shared library cho tất cả services  
✅ **Consistent Behavior**: Same API across all services  
✅ **Easy Maintenance**: Update once, all services benefit  
✅ **AsyncLocalStorage**: Automatic context propagation  
✅ **Type Safety**: Full TypeScript support  
✅ **Zero Config**: Works out of the box  

---

## 🔗 Related Files

- `shared/common/src/services/request-context.service.ts`
- `shared/common/src/middleware/request-id.middleware.ts`
- `apps/gateway/src/app.module.ts` (example usage)
- `apps/core/src/app.module.ts` (example usage)
- `apps/gateway/DISTRIBUTED_TRACING.md` (full guide)

---

*Shared Library - Used by All Services* ✅
