import { Injectable, Logger } from '@nestjs/common';
import { EventBus, EventHandler, ApplicationEvent } from '../../application/bus/event-bus';
import { DomainEvent } from '../../domain/events';

/**
 * In-memory implementation of the EventBus
 * For production, consider using Kafka, Redis, or RabbitMQ
 */
@Injectable()
export class InMemoryEventBus implements EventBus {
  private readonly logger = new Logger(InMemoryEventBus.name);
  private readonly handlers: Map<string, Set<EventHandler>> = new Map();

  async publish(event: DomainEvent | ApplicationEvent): Promise<void> {
    const eventName = event.name;
    const handlers = this.handlers.get(eventName);

    if (!handlers || handlers.size === 0) {
      this.logger.debug(`No handlers registered for event: ${eventName}`);
      return;
    }

    this.logger.debug(`Publishing event: ${eventName} to ${handlers.size} handlers`);

    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        const err = error as Error;
        this.logger.error(
          `Error in handler for event ${eventName}: ${err.message}`,
          err.stack,
        );
      }
    });

    await Promise.all(promises);
  }

  subscribe(eventName: string, handler: EventHandler): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    this.handlers.get(eventName)!.add(handler);
    this.logger.debug(`Subscribed handler to event: ${eventName}`);
  }

  unsubscribe(eventName: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventName);
    if (handlers) {
      handlers.delete(handler);
      this.logger.debug(`Unsubscribed handler from event: ${eventName}`);
    }
  }
}
