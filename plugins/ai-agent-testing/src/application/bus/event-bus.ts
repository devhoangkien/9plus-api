import { DomainEvent } from '../../domain/events';

/**
 * Application Event interface
 */
export interface ApplicationEvent {
  readonly name: string;
  readonly payload: any;
  readonly happenedAt: Date;
}

/**
 * Event handler type
 */
export type EventHandler<T = DomainEvent | ApplicationEvent> = (event: T) => Promise<void> | void;

/**
 * Event Bus interface for publishing and subscribing to events
 */
export interface EventBus {
  /**
   * Publish an event
   */
  publish(event: DomainEvent | ApplicationEvent): Promise<void>;

  /**
   * Subscribe to events by name
   */
  subscribe(eventName: string, handler: EventHandler): void;

  /**
   * Unsubscribe a handler from an event
   */
  unsubscribe(eventName: string, handler: EventHandler): void;
}

/**
 * Token for EventBus injection
 */
export const EVENT_BUS = Symbol('EVENT_BUS');
