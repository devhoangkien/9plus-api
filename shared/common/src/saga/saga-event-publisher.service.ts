import { Injectable, Logger } from '@nestjs/common';
import { SagaEvent, SagaEventType } from './saga.interface';
import { ISagaEventPublisher } from './interfaces';

/**
 * In-memory implementation of Saga event publisher
 * For production, integrate with Kafka or other message broker
 */
@Injectable()
export class SagaEventPublisher implements ISagaEventPublisher {
  private readonly logger = new Logger(SagaEventPublisher.name);
  private readonly handlers: Map<
    SagaEventType,
    Array<(event: SagaEvent) => Promise<void>>
  > = new Map();

  /**
   * Publish a Saga event
   */
  async publish(event: SagaEvent): Promise<void> {
    this.logger.debug(
      `Publishing event: ${event.eventType} for saga ${event.sagaId}`,
    );

    const handlers = this.handlers.get(event.eventType) || [];
    
    // Execute all handlers for this event type
    await Promise.allSettled(
      handlers.map(handler => 
        handler(event).catch(error => {
          this.logger.error(
            `Error in event handler for ${event.eventType}: ${error.message}`,
          );
        })
      ),
    );
  }

  /**
   * Subscribe to a specific event type
   */
  subscribe(
    eventType: SagaEventType,
    handler: (event: SagaEvent) => Promise<void>,
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)!.push(handler);
    this.logger.debug(`Subscribed to event type: ${eventType}`);
  }

  /**
   * Unsubscribe from an event type (for cleanup)
   */
  unsubscribe(eventType: SagaEventType): void {
    this.handlers.delete(eventType);
  }

  /**
   * Clear all subscriptions
   */
  clearAll(): void {
    this.handlers.clear();
  }
}
