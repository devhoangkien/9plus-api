import { Module } from '@nestjs/common';
import { SagaModule as CommonSagaModule } from '@anineplus/common';
import { SubscriptionPaymentSaga } from './subscription-payment.saga';

/**
 * Payment Plugin Saga Module
 * Provides saga orchestration for payment operations
 */
@Module({
  imports: [
    CommonSagaModule,
  ],
  providers: [
    SubscriptionPaymentSaga,
  ],
  exports: [
    SubscriptionPaymentSaga,
  ],
})
export class PaymentSagaModule {}
