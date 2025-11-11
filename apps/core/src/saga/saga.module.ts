import { Module } from '@nestjs/common';
import { SagaModule as CommonSagaModule } from '@anineplus/common';
import { UserRegistrationSaga } from './user-registration.saga';
import { PrismaModule } from '../prisma/prisma.module';
import { KafkaModule } from '../kafka/kafka.module';

/**
 * Core Service Saga Module
 * Provides saga orchestration for core service operations
 */
@Module({
  imports: [
    CommonSagaModule,
    PrismaModule,
    KafkaModule,
  ],
  providers: [
    UserRegistrationSaga,
  ],
  exports: [
    UserRegistrationSaga,
  ],
})
export class CoreSagaModule {}
