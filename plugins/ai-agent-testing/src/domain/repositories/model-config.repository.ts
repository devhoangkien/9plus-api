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
export interface ModelConfigRepository {
  findById(id: string): Promise<ModelConfig | null>;
  findByProjectId(projectId?: string): Promise<ModelConfig[]>;
  findByProvider(provider: ModelProvider): Promise<ModelConfig[]>;
  findDefault(projectId?: string): Promise<ModelConfig | null>;
  
  /**
   * Resolve model configuration based on options
   * Priority: modelId > project default > global default
   */
  resolveModel(options: ResolveModelOptions): Promise<ModelConfig | null>;
  
  save(modelConfig: ModelConfig): Promise<ModelConfig>;
  delete(id: string): Promise<void>;
  
  /**
   * Set a model as default, unsetting any existing default for the same scope
   */
  setAsDefault(id: string): Promise<ModelConfig>;
}
