import { BaseDomainEvent } from './domain-event';
import { ModelProvider } from '../entities';

/**
 * Event fired when a model configuration is created
 */
export class ModelConfigCreatedEvent extends BaseDomainEvent {
  constructor(
    modelConfigId: string,
    public readonly name: string,
    public readonly provider: ModelProvider,
    public readonly modelName: string,
  ) {
    super('ModelConfigCreated', modelConfigId, {
      name,
      provider,
      modelName,
    });
  }
}

/**
 * Event fired when a model configuration is updated
 */
export class ModelConfigUpdatedEvent extends BaseDomainEvent {
  constructor(
    modelConfigId: string,
    public readonly changes: Record<string, any>,
  ) {
    super('ModelConfigUpdated', modelConfigId, { changes });
  }
}

/**
 * Event fired when a model is set as default
 */
export class ModelConfigSetDefaultEvent extends BaseDomainEvent {
  constructor(
    modelConfigId: string,
    public readonly projectId: string | null,
  ) {
    super('ModelConfigSetDefault', modelConfigId, { projectId });
  }
}
