# Request Tracking in Core Service

## ✅ Implementation Complete

### Files Created:
1. `common/services/request-context.service.ts` - Manage requestId with AsyncLocalStorage
2. `common/middleware/request-id.middleware.ts` - Read requestId from Gateway

### Files Updated:
1. `app.module.ts` - Register middleware globally
2. `auth/auth.service.ts` - Log with requestId
3. `auth/auth.module.ts` - Export RequestContextService

---

## 🔍 How It Works

### Request Flow:
```
1. Gateway generates requestId
   req_1696694771893_x7k2m9p4q

2. Gateway sends to Core with header
   X-Request-Id: req_1696694771893_x7k2m9p4q

3. Core Middleware reads header
   RequestIdMiddleware extracts requestId

4. Core Service logs with requestId
   [req_1696694771893_x7k2m9p4q] 📝 Registration attempt...
   [req_1696694771893_x7k2m9p4q] ⚠️ User already exists
```

---

## 📊 Example Logs

### Before (No RequestId):
```
[AuthService] Registration attempt for email: test@example.com
[AuthService] Registration failed: User already exists
```

### After (With RequestId):
```
[AuthService] [req_123_xyz] 📝 Registration attempt for email: test@example.com
[AuthService] [req_123_xyz] ⚠️ Registration failed: User already exists - test@example.com
[AuthService] [req_123_xyz] Error thrown with requestId
```

---

## 🎯 Benefits

✅ **Cross-Service Tracking**
```bash
# Gateway logs
[req_123_xyz] POST /api/register
[req_123_xyz] Delegating to GraphQL...

# Core logs
[req_123_xyz] Registration attempt for test@example.com
[req_123_xyz] User already exists

# Easy to correlate!
```

✅ **Error Debugging**
```bash
# Search all logs by requestId
grep "req_123_xyz" apps/*/logs/*.log

# Result: Full flow from Gateway → Core
```

✅ **Better Error Response**
```json
{
  "message": "User with this email already exists",
  "messageCode": 0,
  "requestId": "req_123_xyz"
}
```

---

## 🚀 Usage in Other Services

### In Any Service:
```typescript
@Injectable()
export class YourService {
  private readonly logger = new Logger(YourService.name);

  constructor(
    private readonly requestContextService: RequestContextService,
  ) {}

  async yourMethod() {
    const requestId = this.requestContextService.getRequestId();
    
    this.logger.log(`[${requestId}] Processing...`);
    
    try {
      // Your logic here
      this.logger.log(`[${requestId}] ✅ Success`);
    } catch (error) {
      this.logger.error(`[${requestId}] ❌ Error: ${error.message}`);
      throw new BadRequestException({
        message: error.message,
        requestId,
      });
    }
  }
}
```

### In Kafka Producer:
```typescript
await this.kafkaProducer.send({
  topic: 'user.created',
  messages: [{
    value: JSON.stringify({
      userId: user.id,
      email: user.email,
      requestId: this.requestContextService.getRequestId(),
    }),
  }],
});
```

### In Database Operations:
```typescript
this.logger.log(`[${requestId}] 💾 Creating user in database`);
const user = await this.prisma.user.create({ data });
this.logger.log(`[${requestId}] ✅ User created: ${user.id}`);
```

---

## 📝 Log Format Convention

Use emojis for easy scanning:
- `📝` - Starting operation
- `✅` - Success
- `⚠️` - Warning
- `❌` - Error
- `🔄` - Retry/Processing
- `💾` - Database operation
- `📡` - External API call
- `🔐` - Authentication
- `🚀` - Kafka/Event

Example:
```typescript
this.logger.log(`[${requestId}] 📝 Starting user registration`);
this.logger.log(`[${requestId}] 🔐 Validating credentials`);
this.logger.log(`[${requestId}] 💾 Saving to database`);
this.logger.log(`[${requestId}] 📡 Sending welcome email`);
this.logger.log(`[${requestId}] 🚀 Publishing user.created event`);
this.logger.log(`[${requestId}] ✅ Registration complete`);
```

---

## 🔍 Testing

### 1. Start Services:
```bash
# Terminal 1: Core
cd apps/core
bun dev

# Terminal 2: Gateway
cd apps/gateway
bun dev
```

### 2. Make Request:
```bash
POST http://localhost:3000/api/register
{
  "email": "test@example.com",
  "password": "123456"
}
```

### 3. Check Response:
```json
{
  "message": "User with this email already exists",
  "messageCode": 0,
  "requestId": "req_1696694771893_x7k2m9p4q"
}
```

### 4. Check Logs:

**Gateway:**
```
[HTTP] ➡️ [req_123_xyz] POST /api/register - 192.168.1.1
[GraphQLExecutor] 🔄 [req_123_xyz] Delegating to Core...
[SofaApi] ❌ [req_123_xyz] GraphQL Error: User already exists
[HTTP] ⬅️ [req_123_xyz] POST /api/register 400 - 45ms
```

**Core:**
```
[AuthService] [req_123_xyz] 📝 Registration attempt for email: test@example.com
[UsersService] [req_123_xyz] 🔍 Checking if user exists...
[AuthService] [req_123_xyz] ⚠️ Registration failed: User already exists - test@example.com
```

### 5. Search Logs:
```bash
grep "req_123_xyz" apps/gateway/logs/*.log apps/core/logs/*.log

# See full flow across both services!
```

---

## 🎯 Next Steps

**Other Services (Searcher, Logger, etc.):**
1. Copy `RequestContextService` and `RequestIdMiddleware`
2. Register in module
3. Use in services
4. Forward requestId in Kafka messages

**Example for Searcher Service:**
```typescript
// In Kafka Consumer
async handleMessage(message: KafkaMessage) {
  const requestId = message.value.requestId || this.generateRequestId();
  
  this.logger.log(`[${requestId}] 📥 Received message: ${message.topic}`);
  
  try {
    await this.elasticsearchService.indexDocument('users', {
      ...message.value,
      _metadata: { requestId }
    });
    this.logger.log(`[${requestId}] ✅ Document indexed`);
  } catch (error) {
    this.logger.error(`[${requestId}] ❌ Indexing failed: ${error.message}`);
  }
}
```

---

*Implementation Complete - Production Ready* ✅
