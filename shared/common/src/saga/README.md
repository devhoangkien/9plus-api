# Saga Pattern Implementation

This directory contains the core implementation of the Saga pattern for distributed transaction management across microservices.

## Overview

The Saga pattern helps manage distributed transactions by breaking them into a series of local transactions with compensating actions for rollback.

## Components

### Core Interfaces (`saga.interface.ts`)

Defines the fundamental types and interfaces for the Saga pattern:

- **SagaStep**: Represents a single step in a saga with execute and compensate methods
- **SagaContext**: Holds saga execution state and step results
- **SagaConfig**: Configuration for saga execution
- **SagaStatus**: Status of saga execution (COMPLETED, FAILED, COMPENSATED, etc.)
- **SagaEvent**: Events emitted during saga execution

### Saga Orchestrator (`saga-orchestrator.service.ts`)

The core orchestrator that:
- Executes saga steps in sequence
- Manages the saga context
- Handles failures and triggers compensation
- Publishes lifecycle events
- Tracks saga state

### Event Publisher (`saga-event-publisher.service.ts`)

Publishes saga lifecycle events for monitoring and integration:
- In-memory implementation (can be extended to use Kafka)
- Event subscription support
- Async event handling

### State Store (`saga-state-store.service.ts`)

Stores saga execution state:
- In-memory implementation (can be extended to use Redis/Database)
- State persistence for recovery
- Saga history tracking

## Quick Start

### 1. Import SagaModule

```typescript
import { SagaModule } from '@anineplus/common';

@Module({
  imports: [SagaModule],
  // ...
})
export class MyModule {}
```

### 2. Create a Saga

```typescript
import { Injectable } from '@nestjs/common';
import { SagaOrchestrator, SagaConfig, SagaStep } from '@anineplus/common';

@Injectable()
export class MyOperationSaga {
  constructor(private sagaOrchestrator: SagaOrchestrator) {}

  async execute(data: MyData): Promise<SagaResult<MyData>> {
    const config: SagaConfig = {
      sagaId: `my-saga-${Date.now()}`,
      name: 'MyOperationSaga',
      timeout: 30000,
    };

    const steps: SagaStep<MyData>[] = [
      {
        name: 'Step1',
        order: 1,
        execute: async (context) => {
          // Execute step logic
          return { result: 'data' };
        },
        compensate: async (context, result) => {
          // Rollback step if needed
        },
      },
      // ... more steps
    ];

    return this.sagaOrchestrator.execute(config, steps, data);
  }
}
```

### 3. Use the Saga

```typescript
@Injectable()
export class MyService {
  constructor(private myOperationSaga: MyOperationSaga) {}

  async performOperation(input: MyInput) {
    const result = await this.myOperationSaga.execute(input);
    
    if (result.status === SagaStatus.COMPLETED) {
      // Success
      return result.context.stepResults;
    } else {
      // Failed or compensated
      throw new Error(result.error?.message);
    }
  }
}
```

## Step Execution Flow

```
1. Execute Step 1 → Success → Store Result
2. Execute Step 2 → Success → Store Result
3. Execute Step 3 → FAILURE
4. Compensate Step 2 (rollback)
5. Compensate Step 1 (rollback)
6. Return COMPENSATED status
```

## Features

### ✅ Sequential Execution
Steps execute in order based on their `order` property.

### ✅ Automatic Compensation
On failure, completed steps are automatically compensated in reverse order.

### ✅ Context Management
Saga context stores step results for use in subsequent steps.

### ✅ Event Publishing
Saga lifecycle events are published for monitoring and integration.

### ✅ Timeout Support
Configure timeouts at the saga level to prevent hung executions.

### ✅ State Persistence
Saga state can be persisted for recovery and monitoring (with appropriate store implementation).

## Examples

### Example 1: User Registration Saga

See: `apps/core/src/saga/user-registration.saga.ts`

Handles user registration with automatic rollback on failure:
1. Validate user
2. Hash password
3. Create user
4. Assign role
5. Publish event

### Example 2: Subscription Payment Saga

See: `plugins/payment/src/saga/subscription-payment.saga.ts`

Handles subscription payment with refunds on failure:
1. Validate payment method
2. Create subscription
3. Process payment
4. Generate invoice
5. Activate subscription

## Best Practices

### 1. Make Steps Idempotent

```typescript
execute: async (context) => {
  // Check if already executed
  const existing = await this.checkExisting(context.data.id);
  if (existing) return existing;
  
  // Execute logic
  return await this.createResource(context.data);
}
```

### 2. Implement Proper Compensation

```typescript
compensate: async (context, result) => {
  if (!result?.id) return; // Nothing to compensate
  
  try {
    await this.deleteResource(result.id);
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      // Already deleted, OK
      return;
    }
    throw error;
  }
}
```

### 3. Use Meaningful Names

```typescript
const steps: SagaStep[] = [
  { name: 'ValidatePayment', order: 1, ... },
  { name: 'ChargeCard', order: 2, ... },
  { name: 'SendReceipt', order: 3, ... },
];
```

### 4. Set Appropriate Timeouts

```typescript
const config: SagaConfig = {
  sagaId: 'my-saga-123',
  name: 'PaymentProcessing',
  timeout: 60000, // 60 seconds for payment operations
};
```

### 5. Access Previous Step Results

```typescript
execute: async (context) => {
  // Get result from previous step
  const userResult = context.stepResults.get('CreateUser');
  const userId = userResult?.userId;
  
  // Use in current step
  return await this.assignRole(userId, 'admin');
}
```

## Monitoring

### Subscribe to Events

```typescript
import { SagaEventPublisher, SagaEventType } from '@anineplus/common';

@Injectable()
export class SagaMonitor {
  constructor(private eventPublisher: SagaEventPublisher) {
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    this.eventPublisher.subscribe(
      SagaEventType.SAGA_FAILED,
      async (event) => {
        console.error(`Saga ${event.sagaId} failed:`, event.error);
        // Send alert, update metrics, etc.
      },
    );

    this.eventPublisher.subscribe(
      SagaEventType.SAGA_COMPENSATED,
      async (event) => {
        console.warn(`Saga ${event.sagaId} was compensated`);
        // Log for review
      },
    );
  }
}
```

### Query Saga State

```typescript
const status = await this.sagaOrchestrator.getStatus(sagaId);
console.log(`Saga status: ${status}`);
```

## Production Considerations

### 1. Persistent State Store

Replace in-memory store with Redis or database:

```typescript
@Injectable()
export class RedisSagaStateStore implements ISagaStateStore {
  constructor(private redis: Redis) {}
  
  async save(sagaId: string, state: any): Promise<void> {
    await this.redis.set(`saga:${sagaId}`, JSON.stringify(state), 'EX', 3600);
  }
  
  async get(sagaId: string): Promise<any> {
    const data = await this.redis.get(`saga:${sagaId}`);
    return data ? JSON.parse(data) : null;
  }
}
```

### 2. Integrate with Kafka

Publish saga events to Kafka:

```typescript
@Injectable()
export class KafkaSagaEventPublisher implements ISagaEventPublisher {
  constructor(private kafkaProducer: KafkaProducerService) {}
  
  async publish(event: SagaEvent): Promise<void> {
    await this.kafkaProducer.send({
      topic: 'saga-events',
      messages: [{
        key: event.sagaId,
        value: JSON.stringify(event),
      }],
    });
  }
}
```

### 3. Add Metrics

Track saga performance:

```typescript
// Track saga duration
const startTime = Date.now();
const result = await saga.execute(data);
const duration = Date.now() - startTime;

metrics.recordSagaDuration(saga.name, duration);
metrics.incrementSagaStatus(saga.name, result.status);
```

## Testing

### Unit Test Example

```typescript
describe('MyOperationSaga', () => {
  let saga: MyOperationSaga;
  let orchestrator: SagaOrchestrator;

  beforeEach(() => {
    orchestrator = new SagaOrchestrator();
    saga = new MyOperationSaga(orchestrator);
  });

  it('should complete successfully', async () => {
    const result = await saga.execute({
      userId: '123',
      operation: 'test',
    });

    expect(result.status).toBe(SagaStatus.COMPLETED);
    expect(result.completedSteps).toHaveLength(5);
  });

  it('should compensate on failure', async () => {
    // Mock a step to fail
    jest.spyOn(service, 'method').mockRejectedValue(new Error('Failed'));

    const result = await saga.execute(data);

    expect(result.status).toBe(SagaStatus.COMPENSATED);
    expect(result.failedStep).toBe('StepName');
  });
});
```

## Further Reading

- [Saga Pattern Documentation](../../../../docs/architecture/saga-pattern.md)
- [Microservices Patterns by Chris Richardson](https://microservices.io/patterns/data/saga.html)
- [Microsoft - Saga Pattern](https://docs.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga)

---

**Version**: 1.0.0
**Last Updated**: 2025-11-11
