import { Module, Global } from '@nestjs/common';
import { SagaOrchestrator } from './saga-orchestrator.service';
import { SagaEventPublisher } from './saga-event-publisher.service';
import { SagaStateStore } from './saga-state-store.service';

/**
 * Saga module providing orchestration services
 * Global module to be available across all services
 */
@Global()
@Module({
  providers: [
    SagaOrchestrator,
    SagaEventPublisher,
    SagaStateStore,
  ],
  exports: [
    SagaOrchestrator,
    SagaEventPublisher,
    SagaStateStore,
  ],
})
export class SagaModule {}
