# Saga Pattern - Usage Examples

This document provides practical examples of using the Saga pattern in the 9Plus API.

---

## Table of Contents

1. [Basic Example](#basic-example)
2. [User Registration Saga](#user-registration-saga)
3. [Subscription Payment Saga](#subscription-payment-saga)
4. [Testing Sagas](#testing-sagas)
5. [Advanced Patterns](#advanced-patterns)

---

## Basic Example

### Simple Two-Step Saga

```typescript
import { Injectable } from '@nestjs/common';
import {
  SagaOrchestrator,
  SagaConfig,
  SagaStep,
  SagaResult,
  SagaStatus,
} from '@anineplus/common';

interface OrderData {
  orderId: string;
  userId: string;
  amount: number;
}

@Injectable()
export class SimpleOrderSaga {
  constructor(private sagaOrchestrator: SagaOrchestrator) {}

  async execute(data: OrderData): Promise<SagaResult<OrderData>> {
    const config: SagaConfig = {
      sagaId: `order-${data.orderId}`,
      name: 'SimpleOrderSaga',
      timeout: 30000,
    };

    const steps: SagaStep<OrderData>[] = [
      // Step 1: Reserve inventory
      {
        name: 'ReserveInventory',
        order: 1,
        execute: async (context) => {
          console.log(`Reserving inventory for order ${context.data.orderId}`);
          // Simulate inventory reservation
          return { reserved: true, reservationId: 'res-123' };
        },
        compensate: async (context, result) => {
          if (result?.reservationId) {
            console.log(`Releasing reservation ${result.reservationId}`);
            // Release inventory reservation
          }
        },
      },

      // Step 2: Process payment
      {
        name: 'ProcessPayment',
        order: 2,
        execute: async (context) => {
          console.log(`Processing payment of ${context.data.amount}`);
          // Simulate payment processing
          return { charged: true, transactionId: 'txn-456' };
        },
        compensate: async (context, result) => {
          if (result?.transactionId) {
            console.log(`Refunding transaction ${result.transactionId}`);
            // Refund payment
          }
        },
      },
    ];

    return this.sagaOrchestrator.execute(config, steps, data);
  }
}
```

### Using the Saga

```typescript
@Injectable()
export class OrderService {
  constructor(private simpleOrderSaga: SimpleOrderSaga) {}

  async createOrder(orderData: OrderData) {
    const result = await this.simpleOrderSaga.execute(orderData);

    if (result.status === SagaStatus.COMPLETED) {
      return {
        success: true,
        orderId: orderData.orderId,
        message: 'Order created successfully',
      };
    } else {
      throw new Error(`Order creation failed: ${result.error?.message}`);
    }
  }
}
```

---

## User Registration Saga

Complete implementation in `apps/core/src/saga/user-registration.saga.ts`

### Overview

This saga handles user registration with the following steps:
1. Validate user doesn't exist
2. Hash password
3. Create user in database
4. Assign default role
5. Publish user created event

### Usage

```typescript
@Resolver()
export class AuthResolver {
  constructor(private userRegistrationSaga: UserRegistrationSaga) {}

  @Mutation(() => UserResponse)
  async register(
    @Args('input') input: RegisterUserInput,
  ): Promise<UserResponse> {
    try {
      const result = await this.userRegistrationSaga.execute({
        email: input.email,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName,
      });

      if (result.status === SagaStatus.COMPLETED) {
        const user = result.context.stepResults.get('AssignRole')?.user;
        return {
          success: true,
          user,
          message: 'User registered successfully',
        };
      } else {
        throw new Error(`Registration failed: ${result.error?.message}`);
      }
    } catch (error) {
      throw new GraphQLError(error.message);
    }
  }
}
```

### What Happens on Failure?

If any step fails (e.g., email already exists, role not found), the saga automatically:

1. **Stops execution** at the failed step
2. **Compensates completed steps** in reverse order:
   - If "AssignRole" fails: Nothing to compensate (no steps completed after it)
   - If "CreateUser" fails: No compensation needed (user wasn't created)
   - If "PublishEvent" fails after user creation: User and role are removed

### Testing the Saga

```typescript
describe('UserRegistrationSaga', () => {
  let saga: UserRegistrationSaga;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserRegistrationSaga,
        SagaOrchestrator,
        // ... other providers
      ],
    }).compile();

    saga = module.get(UserRegistrationSaga);
    prisma = module.get(PrismaService);
  });

  it('should create user successfully', async () => {
    const result = await saga.execute({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(result.status).toBe(SagaStatus.COMPLETED);
    
    const user = result.context.stepResults.get('AssignRole')?.user;
    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
  });

  it('should rollback on duplicate email', async () => {
    // Create user first
    await prisma.user.create({
      data: { email: 'existing@example.com', password: 'hash' },
    });

    const result = await saga.execute({
      email: 'existing@example.com',
      password: 'password123',
    });

    expect(result.status).toBe(SagaStatus.COMPENSATED);
    expect(result.error?.message).toContain('already exists');
  });
});
```

---

## Subscription Payment Saga

Complete implementation in `plugins/payment/src/saga/subscription-payment.saga.ts`

### Overview

This saga handles subscription payment processing:
1. Validate payment method
2. Create subscription record
3. Process payment
4. Generate invoice
5. Activate subscription

### Usage

```typescript
@Resolver()
export class SubscriptionResolver {
  constructor(private subscriptionPaymentSaga: SubscriptionPaymentSaga) {}

  @Mutation(() => SubscriptionResponse)
  async createSubscription(
    @Args('input') input: CreateSubscriptionInput,
    @Context() context,
  ): Promise<SubscriptionResponse> {
    const result = await this.subscriptionPaymentSaga.execute({
      userId: context.user.id,
      planId: input.planId,
      amount: input.amount,
      currency: input.currency,
      paymentMethodId: input.paymentMethodId,
    });

    if (result.status === SagaStatus.COMPLETED) {
      const subscriptionId = result.context.stepResults
        .get('CreateSubscription')?.subscriptionId;
      
      return {
        success: true,
        subscriptionId,
        message: 'Subscription created successfully',
      };
    } else if (result.status === SagaStatus.COMPENSATED) {
      throw new GraphQLError(
        'Payment failed. Your card was not charged.',
      );
    } else {
      throw new GraphQLError(
        'Subscription creation failed. Please try again.',
      );
    }
  }
}
```

### What Happens on Payment Failure?

If payment processing fails (Step 3), the saga:

1. **Compensates Step 2**: Deletes the subscription record
2. **Returns COMPENSATED status**
3. **User's card is not charged** (payment was never completed)

If payment succeeds but invoice generation fails:

1. **Compensates Step 3**: Refunds the payment
2. **Compensates Step 2**: Deletes the subscription
3. **Returns COMPENSATED status**

---

## Testing Sagas

### Unit Testing a Saga

```typescript
import { Test } from '@nestjs/testing';
import { SagaOrchestrator } from '@anineplus/common';
import { MySaga } from './my-saga';

describe('MySaga', () => {
  let saga: MySaga;
  let orchestrator: SagaOrchestrator;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MySaga,
        SagaOrchestrator,
        SagaEventPublisher,
        SagaStateStore,
      ],
    }).compile();

    saga = module.get(MySaga);
    orchestrator = module.get(SagaOrchestrator);
  });

  it('should complete successfully', async () => {
    const result = await saga.execute({
      // test data
    });

    expect(result.status).toBe(SagaStatus.COMPLETED);
  });

  it('should handle failure', async () => {
    // Mock a service to throw error
    jest.spyOn(service, 'method').mockRejectedValue(new Error('Failed'));

    const result = await saga.execute({
      // test data
    });

    expect(result.status).toBe(SagaStatus.COMPENSATED);
  });
});
```

### Integration Testing

```typescript
describe('MySaga Integration', () => {
  let app: INestApplication;
  let saga: MySaga;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    saga = module.get(MySaga);
  });

  afterEach(async () => {
    await app.close();
  });

  it('should process end-to-end', async () => {
    const result = await saga.execute({
      // realistic test data
    });

    expect(result.status).toBe(SagaStatus.COMPLETED);
    
    // Verify database state
    const record = await repository.findOne(result.data.id);
    expect(record).toBeDefined();
  });
});
```

---

## Advanced Patterns

### 1. Saga with Conditional Steps

```typescript
async execute(data: MyData): Promise<SagaResult<MyData>> {
  const steps: SagaStep<MyData>[] = [
    {
      name: 'ValidateData',
      order: 1,
      execute: async (context) => {
        // Validation logic
        return { valid: true, requiresApproval: context.data.amount > 1000 };
      },
      compensate: async () => {},
    },
  ];

  // Add conditional step based on amount
  if (data.amount > 1000) {
    steps.push({
      name: 'RequestApproval',
      order: 2,
      execute: async (context) => {
        // Request approval for high-value transactions
        return { approvalId: 'approval-123' };
      },
      compensate: async (context, result) => {
        // Cancel approval request
      },
    });
  }

  steps.push({
    name: 'ProcessTransaction',
    order: 3,
    execute: async (context) => {
      // Process transaction
      return { transactionId: 'txn-456' };
    },
    compensate: async (context, result) => {
      // Rollback transaction
    },
  });

  return this.sagaOrchestrator.execute(config, steps, data);
}
```

### 2. Saga with Retry Logic

```typescript
{
  name: 'ProcessPayment',
  order: 2,
  execute: async (context) => {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        return await this.paymentService.process(context.data);
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw error;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
  },
  compensate: async (context, result) => {
    // Refund if payment succeeded
  },
}
```

### 3. Saga with External API Calls

```typescript
{
  name: 'NotifyExternalSystem',
  order: 4,
  execute: async (context) => {
    try {
      const response = await axios.post('https://api.external.com/webhook', {
        event: 'subscription.created',
        data: context.data,
      });
      
      return { notified: true, webhookId: response.data.id };
    } catch (error) {
      // Log but don't fail the saga
      this.logger.warn(`External notification failed: ${error.message}`);
      return { notified: false };
    }
  },
  compensate: async (context, result) => {
    if (result?.webhookId) {
      // Send cancellation webhook
      await axios.post('https://api.external.com/webhook', {
        event: 'subscription.cancelled',
        webhookId: result.webhookId,
      });
    }
  },
}
```

### 4. Accessing Previous Step Results

```typescript
{
  name: 'SendNotification',
  order: 5,
  execute: async (context) => {
    // Get user from step 1
    const userResult = context.stepResults.get('CreateUser');
    const userId = userResult?.userId;
    
    // Get subscription from step 2
    const subscriptionResult = context.stepResults.get('CreateSubscription');
    const subscriptionId = subscriptionResult?.subscriptionId;
    
    // Send notification using data from previous steps
    await this.notificationService.send({
      userId,
      message: `Your subscription ${subscriptionId} is now active`,
    });
    
    return { sent: true };
  },
  compensate: async () => {
    // Notification can't be unsent, just log it
  },
}
```

### 5. Saga with Event Publishing

```typescript
{
  name: 'PublishEvent',
  order: 6,
  execute: async (context) => {
    const allResults = Array.from(context.stepResults.entries());
    
    await this.kafkaProducer.publish({
      topic: 'subscription.completed',
      message: {
        sagaId: context.sagaId,
        userId: context.data.userId,
        stepResults: Object.fromEntries(allResults),
        timestamp: new Date(),
      },
    });
    
    return { published: true };
  },
  compensate: async (context) => {
    // Publish compensating event
    await this.kafkaProducer.publish({
      topic: 'subscription.cancelled',
      message: {
        sagaId: context.sagaId,
        reason: 'saga_failed',
        timestamp: new Date(),
      },
    });
  },
}
```

---

## Best Practices

### 1. Always Implement Compensation

```typescript
// ❌ Bad: No compensation logic
{
  name: 'CreateRecord',
  order: 1,
  execute: async (context) => {
    return await this.db.create(context.data);
  },
  compensate: async () => {
    // Empty - record won't be cleaned up!
  },
}

// ✅ Good: Proper compensation
{
  name: 'CreateRecord',
  order: 1,
  execute: async (context) => {
    return await this.db.create(context.data);
  },
  compensate: async (context, result) => {
    if (result?.id) {
      await this.db.delete(result.id);
    }
  },
}
```

### 2. Make Steps Idempotent

```typescript
{
  name: 'ReserveInventory',
  order: 1,
  execute: async (context) => {
    // Check if already reserved
    const existing = await this.inventory.getReservation(context.data.orderId);
    if (existing) {
      return existing; // Already reserved
    }
    
    // Create new reservation
    return await this.inventory.reserve(context.data);
  },
  compensate: async (context, result) => {
    if (result?.reservationId) {
      await this.inventory.release(result.reservationId);
    }
  },
}
```

### 3. Use Meaningful Step Names

```typescript
// ❌ Bad: Generic names
{ name: 'Step1', order: 1, ... }
{ name: 'Step2', order: 2, ... }

// ✅ Good: Descriptive names
{ name: 'ValidatePaymentMethod', order: 1, ... }
{ name: 'ChargeCustomerCard', order: 2, ... }
{ name: 'SendReceiptEmail', order: 3, ... }
```

---

## Monitoring Sagas

### Subscribe to Saga Events

```typescript
@Injectable()
export class SagaMonitoringService implements OnModuleInit {
  constructor(private eventPublisher: SagaEventPublisher) {}

  onModuleInit() {
    // Monitor failed sagas
    this.eventPublisher.subscribe(
      SagaEventType.SAGA_FAILED,
      async (event) => {
        await this.alerting.send({
          severity: 'high',
          message: `Saga ${event.sagaId} failed`,
          error: event.error,
        });
      },
    );

    // Monitor compensated sagas
    this.eventPublisher.subscribe(
      SagaEventType.SAGA_COMPENSATED,
      async (event) => {
        await this.metrics.increment('saga.compensated', {
          sagaName: event.data?.name,
        });
      },
    );
  }
}
```

---

**Version**: 1.0.0
**Last Updated**: 2025-11-11
