import { Module } from '@nestjs/common';
import { SagaModule as CommonSagaModule } from '@anineplus/common';
import { ExecuteTestRunSaga } from '../application/sagas';
import { TestCaseService, TestRunService } from '../application/services';
import { WebRunner, ApiRunner } from '../infrastructure/runner';
import { PrismaModule } from '../prisma/prisma.module';

/**
 * AI Agent Testing Saga Module
 * Provides saga orchestration for test execution
 */
@Module({
  imports: [
    CommonSagaModule,
    PrismaModule,
  ],
  providers: [
    TestCaseService,
    TestRunService,
    WebRunner,
    ApiRunner,
    ExecuteTestRunSaga,
  ],
  exports: [
    ExecuteTestRunSaga,
  ],
})
export class AiTestingSagaModule {}
