# Saga Pattern Implementation

## Overview

The Saga pattern is implemented across the 9Plus API microservices to manage distributed transactions and ensure data consistency in a microservices architecture. This document describes the implementation, usage, and best practices.

---

## Table of Contents

1. [What is the Saga Pattern?](#what-is-the-saga-pattern)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Implementation Examples](#implementation-examples)
5. [Usage Guide](#usage-guide)
6. [Best Practices](#best-practices)
7. [Monitoring and Debugging](#monitoring-and-debugging)
8. [Troubleshooting](#troubleshooting)

---

## What is the Saga Pattern?

The Saga pattern is a design pattern for managing distributed transactions across multiple microservices. Instead of using traditional two-phase commit (2PC), a saga consists of a sequence of local transactions. Each transaction updates data within a single service and publishes an event or message to trigger the next transaction step.

### Key Characteristics

- **Sequential Execution**: Steps execute in a defined order
- **Compensation**: Failed steps trigger rollback of completed steps
- **Event-Driven**: Steps can publish events for other services
- **Resilient**: Handles partial failures gracefully
- **Observable**: Provides visibility into transaction progress

### When to Use Sagas

✅ **Use Sagas When:**
- You need to coordinate operations across multiple services
- Operations involve multiple database transactions
- You need to maintain data consistency without distributed transactions
- Compensation logic can undo previous operations

❌ **Don't Use Sagas When:**
- Operations are contained within a single service
- Simple CRUD operations without complex workflows
- Real-time consistency is absolutely required (consider event sourcing instead)

---

## Architecture

### Saga Orchestration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Saga Orchestrator                        │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Step 1  │→ │  Step 2  │→ │  Step 3  │→ │  Step N  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│       │             │             │             │          │
│       ↓             ↓             ↓             ↓          │
│  Execute       Execute       Execute       Execute        │
│       │             │             │             │          │
│       ↓             ↓             ↓             ↓          │
│  Compensate ← Compensate ← Compensate ← Compensate        │
│  (on failure)                                              │
└─────────────────────────────────────────────────────────────┘
         │                                        │
         ↓                                        ↓
┌──────────────────┐                    ┌──────────────────┐
│  Event Publisher │                    │   State Store    │
│   (Kafka/Events) │                    │ (Memory/Redis)   │
└──────────────────┘                    └──────────────────┘
```

### Component Interaction Flow

```
1. Client Request
    ↓
2. Saga Orchestrator.execute()
    ↓
3. For each step:
    a. Execute step logic
    b. Store step result
    c. Publish step event
    d. Continue to next step
    ↓
4. On Success: Return SUCCESS
   On Failure:
    a. Execute compensation for completed steps (in reverse)
    b. Publish compensation events
    c. Return COMPENSATED/FAILED
```

---

## Core Components

### 1. Saga Interfaces

Located in: `shared/common/src/saga/saga.interface.ts`

**Key Interfaces:**

```typescript
// Saga step definition
interface SagaStep<T, R> {
  name: string;
  order: number;
  execute: (context: SagaContext<T>) => Promise<R>;
  compensate: (context: SagaContext<T>, result?: R) => Promise<void>;
}

// Saga execution context
interface SagaContext<T> {
  sagaId: string;
  correlationId: string;
  data: T;
  metadata: {...};
  stepResults: Map<string, any>;
}

// Saga configuration
interface SagaConfig {
  sagaId: string;
  name: string;
  timeout?: number;
  retryAttempts?: number;
}
```

### 2. Saga Orchestrator

Located in: `shared/common/src/saga/saga-orchestrator.service.ts`

**Responsibilities:**
- Execute saga steps in sequence
- Manage saga context and step results
- Handle failures and trigger compensation
- Publish saga events
- Track saga state

**Key Methods:**
- `execute()`: Run a saga with given steps
- `compensate()`: Execute compensation for completed steps
- `getStatus()`: Get current saga status

### 3. Event Publisher

Located in: `shared/common/src/saga/saga-event-publisher.service.ts`

**Responsibilities:**
- Publish saga lifecycle events
- Allow subscription to saga events
- Support event-driven integrations

**Events Published:**
- `SAGA_STARTED`: Saga execution begins
- `SAGA_COMPLETED`: All steps completed successfully
- `SAGA_FAILED`: Saga failed and compensation failed
- `SAGA_COMPENSATED`: Saga failed but compensation succeeded
- `STEP_STARTED`, `STEP_COMPLETED`, `STEP_FAILED`, etc.

### 4. State Store

Located in: `shared/common/src/saga/saga-state-store.service.ts`

**Responsibilities:**
- Store saga execution state
- Enable saga recovery and monitoring
- Track saga history

**Note:** Current implementation uses in-memory storage. For production, integrate with Redis or a persistent database.

---

## Implementation Examples

### Example 1: User Registration Saga

Located in: `apps/core/src/saga/user-registration.saga.ts`

**Workflow:**
1. Validate user doesn't exist
2. Hash password
3. Create user in database
4. Assign default role
5. Publish user created event

**Compensation:**
- Step 5: Publish user deletion event
- Step 4: Remove role from user
- Step 3: Delete user from database
- Step 2: No compensation needed
- Step 1: No compensation needed

**Usage:**

```typescript
@Injectable()
export class AuthService {
  constructor(private userRegistrationSaga: UserRegistrationSaga) {}

  async register(input: RegisterInput) {
    const result = await this.userRegistrationSaga.execute({
      email: input.email,
      password: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
    });

    if (result.status === SagaStatus.COMPLETED) {
      const user = result.context.stepResults.get('AssignRole')?.user;
      return { success: true, user };
    } else {
      throw new Error(`Registration failed: ${result.error?.message}`);
    }
  }
}
```

### Example 2: Subscription Payment Saga

Located in: `plugins/payment/src/saga/subscription-payment.saga.ts`

**Workflow:**
1. Validate payment method
2. Create subscription record
3. Process payment
4. Generate invoice
5. Activate subscription

**Compensation:**
- Step 5: Deactivate subscription
- Step 4: Cancel invoice
- Step 3: Refund payment
- Step 2: Delete subscription
- Step 1: No compensation needed

**Usage:**

```typescript
@Injectable()
export class SubscriptionService {
  constructor(private subscriptionPaymentSaga: SubscriptionPaymentSaga) {}

  async createSubscription(input: CreateSubscriptionInput) {
    const result = await this.subscriptionPaymentSaga.execute({
      userId: input.userId,
      planId: input.planId,
      amount: input.amount,
      currency: input.currency,
      paymentMethodId: input.paymentMethodId,
    });

    if (result.status === SagaStatus.COMPLETED) {
      return { success: true, subscriptionId: result.context.stepResults.get('CreateSubscription')?.subscriptionId };
    } else {
      throw new Error(`Subscription creation failed: ${result.error?.message}`);
    }
  }
}
```

---

## Usage Guide

### Creating a New Saga

**Step 1: Define Your Saga Data Interface**

```typescript
export interface MyOperationData {
  // Input data for your saga
  userId: string;
  // ... other fields
}
```

**Step 2: Create Saga Class**

```typescript
@Injectable()
export class MyOperationSaga {
  private readonly logger = new Logger(MyOperationSaga.name);

  constructor(
    private readonly sagaOrchestrator: SagaOrchestrator,
    // ... inject required services
  ) {}

  async execute(data: MyOperationData): Promise<SagaResult<MyOperationData>> {
    const sagaId = `my-operation-${Date.now()}`;
    
    const config: SagaConfig = {
      sagaId,
      name: 'MyOperationSaga',
      timeout: 30000,
    };

    const steps: SagaStep<MyOperationData>[] = [
      this.createStep1(),
      this.createStep2(),
      // ... more steps
    ];

    return this.sagaOrchestrator.execute(config, steps, data);
  }

  private createStep1(): SagaStep<MyOperationData> {
    return {
      name: 'Step1',
      order: 1,
      execute: async (context) => {
        // Implement step logic
        return { result: 'data' };
      },
      compensate: async (context, result) => {
        // Implement compensation logic
      },
    };
  }
}
```

**Step 3: Register in Module**

```typescript
@Module({
  imports: [SagaModule],
  providers: [MyOperationSaga],
  exports: [MyOperationSaga],
})
export class MySagaModule {}
```

**Step 4: Use in Service**

```typescript
@Injectable()
export class MyService {
  constructor(private myOperationSaga: MyOperationSaga) {}

  async performOperation(input: MyInput) {
    const result = await this.myOperationSaga.execute(input);
    
    if (result.status === SagaStatus.COMPLETED) {
      // Handle success
    } else {
      // Handle failure
    }
  }
}
```

---

## Best Practices

### 1. Step Design

✅ **Do:**
- Keep steps atomic and idempotent
- Design clear compensation logic for each step
- Use meaningful step names
- Order steps from least to most critical

❌ **Don't:**
- Create steps with side effects that can't be compensated
- Make steps dependent on external state
- Skip compensation implementation

### 2. Error Handling

```typescript
execute: async (context) => {
  try {
    // Step logic
    return result;
  } catch (error) {
    this.logger.error(`Step failed: ${error.message}`);
    throw error; // Let orchestrator handle it
  }
}
```

### 3. Timeouts

```typescript
const config: SagaConfig = {
  sagaId,
  name: 'MySaga',
  timeout: 30000, // Set appropriate timeout per saga
};
```

### 4. Idempotency

Ensure compensation can be called multiple times safely:

```typescript
compensate: async (context, result) => {
  if (!result?.resourceId) {
    return; // Already compensated or nothing to compensate
  }
  
  try {
    await this.deleteResource(result.resourceId);
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      // Already deleted, ignore
      return;
    }
    throw error;
  }
}
```

### 5. Saga State Management

For production systems, persist saga state:

```typescript
// Implement Redis-based state store
@Injectable()
export class RedisSagaStateStore implements ISagaStateStore {
  constructor(private redis: Redis) {}
  
  async save(sagaId: string, state: any): Promise<void> {
    await this.redis.set(
      `saga:${sagaId}`,
      JSON.stringify(state),
      'EX',
      3600, // 1 hour expiry
    );
  }
  
  // ... implement other methods
}
```

---

## Monitoring and Debugging

### 1. Saga Events

Subscribe to saga events for monitoring:

```typescript
sagaEventPublisher.subscribe(
  SagaEventType.SAGA_FAILED,
  async (event) => {
    logger.error(`Saga ${event.sagaId} failed:`, event.error);
    // Send alert, update metrics, etc.
  },
);
```

### 2. Logging

All saga operations are logged with correlation IDs:

```
[user-registration-123] Starting Saga: UserRegistrationSaga
[user-registration-123] Executing step: ValidateUser
[user-registration-123] Step ValidateUser completed
[user-registration-123] Executing step: CreateUser
[user-registration-123] Step CreateUser failed: Email already exists
[user-registration-123] Starting compensation for 1 steps
[user-registration-123] Compensating step: ValidateUser
[user-registration-123] Compensation completed
[user-registration-123] Saga COMPENSATED in 150ms
```

### 3. Metrics

Track saga metrics:

```typescript
// Saga success rate
saga_executions_total{status="completed"}
saga_executions_total{status="compensated"}
saga_executions_total{status="failed"}

// Saga duration
saga_duration_ms{name="UserRegistrationSaga"}

// Step failures
saga_step_failures_total{step="CreateUser"}
```

---

## Troubleshooting

### Issue: Saga times out

**Cause:** Step takes longer than configured timeout

**Solution:**
- Increase timeout in `SagaConfig`
- Optimize slow step operations
- Consider breaking step into smaller steps

```typescript
const config: SagaConfig = {
  timeout: 60000, // Increase from 30s to 60s
};
```

### Issue: Compensation fails

**Cause:** Compensation logic has bugs or resources already cleaned up

**Solution:**
- Make compensation idempotent
- Add proper error handling
- Log compensation failures for manual review

```typescript
compensate: async (context, result) => {
  try {
    // Compensation logic
  } catch (error) {
    this.logger.error(`Compensation failed: ${error.message}`);
    // Don't throw - log for manual review
  }
}
```

### Issue: Saga state lost after restart

**Cause:** Using in-memory state store

**Solution:** Implement persistent state store

```typescript
// Use Redis or database for state persistence
@Module({
  providers: [
    {
      provide: ISagaStateStore,
      useClass: RedisSagaStateStore, // Instead of SagaStateStore
    },
  ],
})
```

### Issue: Duplicate saga executions

**Cause:** Missing idempotency checks

**Solution:** Add idempotency key checking

```typescript
async execute(data: MyData): Promise<SagaResult> {
  const idempotencyKey = `${data.userId}-${data.operation}`;
  
  // Check if saga already executed
  const existing = await this.stateStore.get(idempotencyKey);
  if (existing) {
    return existing.result;
  }
  
  // Execute saga
  const result = await this.sagaOrchestrator.execute(...);
  
  // Store result for idempotency
  await this.stateStore.save(idempotencyKey, { result });
  
  return result;
}
```

---

## Integration with Kafka

For production systems, integrate saga events with Kafka:

```typescript
@Injectable()
export class KafkaSagaEventPublisher implements ISagaEventPublisher {
  constructor(private kafkaProducer: KafkaProducerService) {}
  
  async publish(event: SagaEvent): Promise<void> {
    await this.kafkaProducer.publishEvent({
      id: event.sagaId,
      eventType: 'saga',
      entityType: 'saga',
      timestamp: event.timestamp.toISOString(),
      data: event,
    });
  }
}
```

---

## References

- [Saga Pattern - Microsoft](https://docs.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga)
- [Task 03: Architecture & Services](../tasks/03-architecture-services.md)
- [Event-Driven Architecture](./EVENT_DRIVEN_ARCHITECTURE.md)

---

**Last Updated**: 2025-11-11
**Version**: 1.0.0
