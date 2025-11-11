import { Injectable, Logger } from '@nestjs/common';
import {
  SagaOrchestrator,
  SagaConfig,
  SagaStep,
  SagaResult,
} from '@anineplus/common';

/**
 * Subscription payment data interface
 */
export interface SubscriptionPaymentData {
  userId: string;
  planId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  metadata?: Record<string, any>;
}

/**
 * Subscription Payment Result
 */
export interface SubscriptionPaymentResult {
  subscriptionId?: string;
  paymentId?: string;
  invoiceId?: string;
  status: 'success' | 'failed' | 'compensated';
}

/**
 * Subscription Payment Saga
 * 
 * Orchestrates the subscription payment process as a distributed transaction:
 * 1. Validate payment method
 * 2. Create subscription record
 * 3. Process payment
 * 4. Generate invoice
 * 5. Activate subscription
 * 
 * If any step fails, compensation is performed to roll back completed steps.
 */
@Injectable()
export class SubscriptionPaymentSaga {
  private readonly logger = new Logger(SubscriptionPaymentSaga.name);

  constructor(
    private readonly sagaOrchestrator: SagaOrchestrator,
  ) {}

  /**
   * Execute subscription payment saga
   */
  async execute(
    data: SubscriptionPaymentData,
  ): Promise<SagaResult<SubscriptionPaymentData>> {
    const sagaId = `subscription-payment-${data.userId}-${Date.now()}`;
    
    const config: SagaConfig = {
      sagaId,
      name: 'SubscriptionPaymentSaga',
      timeout: 60000, // 60 seconds
      retryAttempts: 0,
    };

    const steps: SagaStep<SubscriptionPaymentData>[] = [
      this.createPaymentMethodValidationStep(),
      this.createSubscriptionCreationStep(),
      this.createPaymentProcessingStep(),
      this.createInvoiceGenerationStep(),
      this.createSubscriptionActivationStep(),
    ];

    return this.sagaOrchestrator.execute(config, steps, data);
  }

  /**
   * Step 1: Validate payment method
   */
  private createPaymentMethodValidationStep(): SagaStep<SubscriptionPaymentData> {
    return {
      name: 'ValidatePaymentMethod',
      order: 1,
      execute: async (context) => {
        this.logger.debug(
          `[${context.sagaId}] Validating payment method: ${context.data.paymentMethodId}`,
        );
        
        // Simulate payment method validation
        // In production, integrate with Stripe/PayPal API
        const isValid = await this.validatePaymentMethod(context.data.paymentMethodId);
        
        if (!isValid) {
          throw new Error(
            `Payment method ${context.data.paymentMethodId} is invalid or expired`,
          );
        }

        return { 
          validated: true,
          paymentMethodId: context.data.paymentMethodId,
        };
      },
      compensate: async () => {
        // No compensation needed for validation
        this.logger.debug('No compensation needed for payment method validation');
      },
    };
  }

  /**
   * Step 2: Create subscription record
   */
  private createSubscriptionCreationStep(): SagaStep<SubscriptionPaymentData> {
    return {
      name: 'CreateSubscription',
      order: 2,
      execute: async (context) => {
        this.logger.debug(
          `[${context.sagaId}] Creating subscription for user ${context.data.userId}`,
        );
        
        // Simulate subscription creation
        // In production, create record in database
        const subscription = await this.createSubscription(context.data);
        
        return { 
          subscriptionId: subscription.id,
          subscription,
        };
      },
      compensate: async (context, result) => {
        // Delete the created subscription
        if (result?.subscriptionId) {
          this.logger.warn(
            `[${context.sagaId}] Compensating: Deleting subscription ${result.subscriptionId}`,
          );
          
          try {
            await this.deleteSubscription(result.subscriptionId);
            this.logger.debug(
              `[${context.sagaId}] Subscription ${result.subscriptionId} deleted successfully`,
            );
          } catch (error) {
            this.logger.error(
              `[${context.sagaId}] Failed to delete subscription: ${error.message}`,
            );
          }
        }
      },
    };
  }

  /**
   * Step 3: Process payment
   */
  private createPaymentProcessingStep(): SagaStep<SubscriptionPaymentData> {
    return {
      name: 'ProcessPayment',
      order: 3,
      execute: async (context) => {
        this.logger.debug(
          `[${context.sagaId}] Processing payment of ${context.data.amount} ${context.data.currency}`,
        );
        
        const subscriptionResult = context.stepResults.get('CreateSubscription');
        const subscriptionId = subscriptionResult?.subscriptionId;
        
        if (!subscriptionId) {
          throw new Error('Subscription ID not found from previous step');
        }

        // Simulate payment processing
        // In production, integrate with payment gateway (Stripe, PayPal, etc.)
        const payment = await this.processPayment(context.data, subscriptionId);
        
        return { 
          paymentId: payment.id,
          payment,
        };
      },
      compensate: async (context, result) => {
        // Refund the payment
        if (result?.paymentId) {
          this.logger.warn(
            `[${context.sagaId}] Compensating: Refunding payment ${result.paymentId}`,
          );
          
          try {
            await this.refundPayment(result.paymentId);
            this.logger.debug(
              `[${context.sagaId}] Payment ${result.paymentId} refunded successfully`,
            );
          } catch (error) {
            this.logger.error(
              `[${context.sagaId}] Failed to refund payment: ${error.message}`,
            );
          }
        }
      },
    };
  }

  /**
   * Step 4: Generate invoice
   */
  private createInvoiceGenerationStep(): SagaStep<SubscriptionPaymentData> {
    return {
      name: 'GenerateInvoice',
      order: 4,
      execute: async (context) => {
        this.logger.debug(`[${context.sagaId}] Generating invoice`);
        
        const subscriptionResult = context.stepResults.get('CreateSubscription');
        const paymentResult = context.stepResults.get('ProcessPayment');
        
        const subscriptionId = subscriptionResult?.subscriptionId;
        const paymentId = paymentResult?.paymentId;
        
        if (!subscriptionId || !paymentId) {
          throw new Error('Required data not found from previous steps');
        }

        // Simulate invoice generation
        const invoice = await this.generateInvoice(
          subscriptionId,
          paymentId,
          context.data,
        );
        
        return { 
          invoiceId: invoice.id,
          invoice,
        };
      },
      compensate: async (context, result) => {
        // Mark invoice as cancelled
        if (result?.invoiceId) {
          this.logger.warn(
            `[${context.sagaId}] Compensating: Cancelling invoice ${result.invoiceId}`,
          );
          
          try {
            await this.cancelInvoice(result.invoiceId);
            this.logger.debug(
              `[${context.sagaId}] Invoice ${result.invoiceId} cancelled successfully`,
            );
          } catch (error) {
            this.logger.error(
              `[${context.sagaId}] Failed to cancel invoice: ${error.message}`,
            );
          }
        }
      },
    };
  }

  /**
   * Step 5: Activate subscription
   */
  private createSubscriptionActivationStep(): SagaStep<SubscriptionPaymentData> {
    return {
      name: 'ActivateSubscription',
      order: 5,
      execute: async (context) => {
        this.logger.debug(`[${context.sagaId}] Activating subscription`);
        
        const subscriptionResult = context.stepResults.get('CreateSubscription');
        const subscriptionId = subscriptionResult?.subscriptionId;
        
        if (!subscriptionId) {
          throw new Error('Subscription ID not found from previous step');
        }

        // Activate the subscription
        await this.activateSubscription(subscriptionId);
        
        return { 
          activated: true,
          subscriptionId,
        };
      },
      compensate: async (context, result) => {
        // Deactivate subscription
        if (result?.subscriptionId) {
          this.logger.warn(
            `[${context.sagaId}] Compensating: Deactivating subscription ${result.subscriptionId}`,
          );
          
          try {
            await this.deactivateSubscription(result.subscriptionId);
            this.logger.debug(
              `[${context.sagaId}] Subscription ${result.subscriptionId} deactivated successfully`,
            );
          } catch (error) {
            this.logger.error(
              `[${context.sagaId}] Failed to deactivate subscription: ${error.message}`,
            );
          }
        }
      },
    };
  }

  // ==================== Helper Methods (Simulated) ====================
  // In production, these would integrate with actual services/APIs

  private async validatePaymentMethod(paymentMethodId: string): Promise<boolean> {
    // Simulate validation
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 100);
    });
  }

  private async createSubscription(data: SubscriptionPaymentData): Promise<any> {
    // Simulate subscription creation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: `sub_${Date.now()}`,
          userId: data.userId,
          planId: data.planId,
          status: 'pending',
          createdAt: new Date(),
        });
      }, 100);
    });
  }

  private async deleteSubscription(subscriptionId: string): Promise<void> {
    // Simulate subscription deletion
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 100);
    });
  }

  private async processPayment(
    data: SubscriptionPaymentData,
    subscriptionId: string,
  ): Promise<any> {
    // Simulate payment processing
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate random payment failure for testing
        const success = Math.random() > 0.1; // 90% success rate
        
        if (success) {
          resolve({
            id: `pay_${Date.now()}`,
            amount: data.amount,
            currency: data.currency,
            status: 'succeeded',
            subscriptionId,
          });
        } else {
          reject(new Error('Payment processing failed'));
        }
      }, 200);
    });
  }

  private async refundPayment(paymentId: string): Promise<void> {
    // Simulate payment refund
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 100);
    });
  }

  private async generateInvoice(
    subscriptionId: string,
    paymentId: string,
    data: SubscriptionPaymentData,
  ): Promise<any> {
    // Simulate invoice generation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: `inv_${Date.now()}`,
          subscriptionId,
          paymentId,
          amount: data.amount,
          currency: data.currency,
          status: 'paid',
          createdAt: new Date(),
        });
      }, 100);
    });
  }

  private async cancelInvoice(invoiceId: string): Promise<void> {
    // Simulate invoice cancellation
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 100);
    });
  }

  private async activateSubscription(subscriptionId: string): Promise<void> {
    // Simulate subscription activation
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 100);
    });
  }

  private async deactivateSubscription(subscriptionId: string): Promise<void> {
    // Simulate subscription deactivation
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 100);
    });
  }
}
