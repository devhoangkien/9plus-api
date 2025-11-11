import { SagaEvent, SagaEventType } from '../saga.interface';

/**
 * Interface for Saga event publisher
 */
export interface ISagaEventPublisher {
  publish(event: SagaEvent): Promise<void>;
  subscribe(
    eventType: SagaEventType,
    handler: (event: SagaEvent) => Promise<void>,
  ): void;
}
