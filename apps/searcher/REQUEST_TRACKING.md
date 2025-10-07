# Request Tracking in Searcher Service

## ✅ Implementation Complete

### What Was Added:

1. **App Module** - Request context middleware
2. **Kafka Consumer Service** - Log with requestId from messages
3. **User Indexing Handler** - Track operations with requestId
4. **Elasticsearch Indexing** - Store requestId in metadata

---

## 🔍 How It Works

### 1. Kafka Message Flow:
```
Core Service (User Registration)
    ↓ [req_123_xyz]
Publishes to Kafka: user.created
    {
      userId: "abc123",
      email: "test@example.com",
      requestId: "req_123_xyz"  ← Forwarded from Core
    }
    ↓
Searcher Service Receives Message
    ↓
Kafka Consumer extracts requestId from message
    ↓
Runs handler within request context
    ↓
All logs use same requestId
    ↓
Elasticsearch document includes requestId
```

### 2. Logs Example:

**Core Service:**
```
[req_123_xyz] 📝 Registration attempt for email: test@example.com
[req_123_xyz] 💾 Creating user in database
[req_123_xyz] 🚀 Event published to topic user.created: abc123
[req_123_xyz] ✅ User created: abc123
```

**Searcher Service:**
```
[req_123_xyz] 📨 Processing message from user.created (offset: 5, attempt: 1)
[req_123_xyz] ✅ User indexed: abc123
[req_123_xyz] ✅ Message processed and committed (offset: 5)
```

---

## 📊 Request Context in Kafka Messages

### Message Structure:
```json
{
  "topic": "user.created",
  "value": {
    "id": "abc123",
    "email": "test@example.com",
    "eventType": "created",
    "entityType": "user",
    "timestamp": "2025-10-07T15:46:11.893Z",
    "requestId": "req_123_xyz",  ← Forwarded for tracking
    "data": { ... }
  },
  "headers": {
    "eventType": "created",
    "entityType": "user",
    "source": "core-service",
    "requestId": "req_123_xyz"  ← Also in headers
  }
}
```

### Reading RequestId in Consumer:
```typescript
// In kafka-consumer.service.ts
const requestId = kafkaMessage.value?.requestId || 
                 this.requestContextService.generateRequestId();

// Run handler within context
await this.requestContextService.run(
  { requestId, timestamp: new Date(), service: 'searcher' },
  async () => {
    this.logger.debug(`[${requestId}] 📨 Processing message...`);
    await handler(kafkaMessage);
  }
);
```

---

## 🎯 Benefits

### 1. **End-to-End Tracking**
```bash
# Search by requestId across ALL services
grep "req_123_xyz" apps/*/logs/*.log

# Result: Complete flow
[Core] [req_123_xyz] User registration started
[Core] [req_123_xyz] Event published: user.created
[Searcher] [req_123_xyz] Processing message: user.created
[Searcher] [req_123_xyz] User indexed successfully
```

### 2. **Elasticsearch Metadata**
```json
{
  "_index": "users",
  "_id": "abc123",
  "_source": {
    "id": "abc123",
    "email": "test@example.com",
    "_metadata": {
      "requestId": "req_123_xyz",
      "indexedAt": "2025-10-07T15:46:12.000Z"
    }
  }
}
```

### 3. **Error Debugging**
```bash
# If indexing fails, find root cause
grep "req_123_xyz" apps/core/logs/*.log
grep "req_123_xyz" apps/searcher/logs/*.log

# See exactly what happened in Core before error in Searcher
```

---

## 🚀 Usage Examples

### Example 1: User Registration Flow

**Client Request:**
```bash
POST /api/register
{ "email": "test@example.com", "password": "123456" }
```

**Gateway:**
```
[req_123_xyz] POST /api/register
[req_123_xyz] Delegating to Core...
```

**Core:**
```
[req_123_xyz] 📝 Registration attempt
[req_123_xyz] 💾 Creating user: abc123
[req_123_xyz] 🚀 Publishing user.created event
[req_123_xyz] ✅ User created successfully
```

**Searcher:**
```
[req_123_xyz] 📨 Received user.created message
[req_123_xyz] 📊 Indexing user: abc123
[req_123_xyz] ✅ User indexed successfully
```

**Result:** Complete traceability từ client request → database → Elasticsearch!

### Example 2: Retry Scenario

**Core:**
```
[req_456_abc] 🚀 Publishing user.created event
```

**Searcher (First Attempt):**
```
[req_456_abc] 📨 Processing message (offset: 10, attempt: 1)
[req_456_abc] ❌ Elasticsearch connection failed
[req_456_abc] 🔄 Retrying message (attempt 1/3)...
```

**Searcher (Second Attempt):**
```
[req_456_abc] 📨 Processing message (offset: 10, attempt: 2)
[req_456_abc] ✅ User indexed successfully
[req_456_abc] ✅ Message committed (offset: 10)
```

**Result:** Easy to see it was same request, just retried!

---

## 📝 Code Reference

### Kafka Consumer Service
```typescript
private async handleMessage(payload: EachMessagePayload) {
  const { message } = payload;
  
  // Extract requestId from message
  const requestId = kafkaMessage.value?.requestId || 
                   this.requestContextService.generateRequestId();
  
  // Run within context
  await this.requestContextService.run(
    { requestId, timestamp: new Date(), service: 'searcher' },
    async () => {
      // All logs within this block will have requestId
      this.logger.debug(`[${requestId}] Processing...`);
      await handler(kafkaMessage);
    }
  );
}
```

### User Indexing Handler
```typescript
private async handleUserCreated(message: KafkaMessage) {
  const requestId = this.requestContextService.getRequestId();
  
  try {
    const userData = message.value;
    await this.indexingService.indexUser(userData);
    this.logger.log(`[${requestId}] ✅ User indexed: ${userData.id}`);
  } catch (error) {
    this.logger.error(`[${requestId}] ❌ Failed to index user:`, error);
    throw error;
  }
}
```

### Core Kafka Producer
```typescript
async publishEvent(payload: EventPayload) {
  const requestId = this.requestContextService.getRequestId();
  
  const message = {
    value: JSON.stringify({
      ...payload,
      requestId,  // Forward requestId
    }),
    headers: {
      requestId: requestId,  // Also in headers
    },
  };
  
  await this.producer.send({ topic, messages: [message] });
  this.logger.debug(`[${requestId}] 🚀 Event published`);
}
```

---

## 🔍 Monitoring & Debugging

### Query Elasticsearch by RequestId:
```bash
GET /users/_search
{
  "query": {
    "match": { "_metadata.requestId": "req_123_xyz" }
  }
}
```

### Search Kafka Messages:
```bash
# If using Kafka UI or CLI
kafka-console-consumer --topic user.created | grep "req_123_xyz"
```

### Search All Logs:
```bash
# Find complete flow
grep -r "req_123_xyz" apps/*/logs/

# Result:
apps/gateway/logs/app.log:[req_123_xyz] POST /api/register
apps/core/logs/app.log:[req_123_xyz] User created: abc123
apps/searcher/logs/app.log:[req_123_xyz] User indexed: abc123
```

---

## 🎯 Summary

### What Changed:
1. ✅ Searcher now uses shared RequestContextService
2. ✅ Kafka messages include requestId from Core
3. ✅ All logs include requestId
4. ✅ Elasticsearch documents store requestId in metadata
5. ✅ Full traceability from client → Core → Searcher

### Request Flow:
```
Client
  ↓ [generates requestId]
Gateway
  ↓ [forwards in header]
Core
  ↓ [forwards in Kafka message]
Searcher
  ↓ [uses same requestId]
Elasticsearch
  ↓ [stores in metadata]
Complete Traceability! ✅
```

### Benefits:
- 🔍 Track requests across all services
- 🐛 Easy debugging with requestId
- 📊 Query Elasticsearch by requestId
- 🔄 See retry attempts clearly
- ✅ Complete audit trail

---

*Request Tracking Complete - Production Ready* ✅
