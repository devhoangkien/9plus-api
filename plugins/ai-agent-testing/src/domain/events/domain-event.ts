/**
 * Base Domain Event interface
 */
export interface DomainEvent {
  readonly name: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly payload?: any;
}

/**
 * Base class for domain events
 */
export abstract class BaseDomainEvent implements DomainEvent {
  readonly occurredAt: Date;

  constructor(
    public readonly name: string,
    public readonly aggregateId: string,
    public readonly payload?: any,
  ) {
    this.occurredAt = new Date();
  }
}
