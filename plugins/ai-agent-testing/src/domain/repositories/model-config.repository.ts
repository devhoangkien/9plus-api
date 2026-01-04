import { ModelConfig } from '../entities';
import { ModelProvider } from '../entities/test-enums';

/**
 * Options for resolving a model
 */
export interface ResolveModelOptions {
  modelId?: string;
  projectId?: string;
}

/**
 * Model Config Repository Interface
 */
export abstract class ModelConfigRepository {
  abstract findById(id: string): Promise<ModelConfig | null>;
  abstract findByProjectId(projectId?: string): Promise<ModelConfig[]>;
  abstract findByProvider(provider: ModelProvider): Promise<ModelConfig[]>;
  abstract findDefault(projectId?: string): Promise<ModelConfig | null>;

  /**
   * Resolve model configuration based on options
   * Priority: modelId > project default > global default
   */
  abstract resolveModel(options: ResolveModelOptions): Promise<ModelConfig | null>;

  abstract save(modelConfig: ModelConfig): Promise<ModelConfig>;
  abstract delete(id: string): Promise<void>;

  /**
   * Set a model as default, unsetting any existing default for the same scope
   */
  abstract setAsDefault(id: string): Promise<ModelConfig>;
}
