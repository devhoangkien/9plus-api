import { SagaConfig, SagaContext, SagaResult, SagaStatus, SagaStep } from '../saga.interface';

/**
 * Interface for Saga orchestrator
 */
export interface ISagaOrchestrator {
  execute<T = any>(
    config: SagaConfig,
    steps: SagaStep<T>[],
    initialData: T,
  ): Promise<SagaResult<T>>;
  
  getStatus(sagaId: string): Promise<SagaStatus | null>;
  
  compensate<T = any>(
    context: SagaContext<T>,
    completedSteps: SagaStep<T>[],
  ): Promise<void>;
}
