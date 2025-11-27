import { ModelProvider } from './test-enums';

/**
 * Model Parameters interface for LLM configuration
 */
export interface ModelParameters {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  [key: string]: any;
}

/**
 * ModelConfig Domain Entity
 */
export class ModelConfig {
  constructor(
    public readonly id: string,
    public name: string,
    public provider: ModelProvider,
    public modelName: string,
    public apiBaseUrl: string,
    public apiKeyRef: string,
    public parameters: ModelParameters | null,
    public isDefault: boolean,
    public isActive: boolean,
    public projectId: string | null,
    public createdAt: Date,
    public updatedAt: Date,
    public createdBy: string | null,
  ) {}

  updateName(name: string): void {
    this.name = name;
  }

  updateModelName(modelName: string): void {
    this.modelName = modelName;
  }

  updateApiBaseUrl(apiBaseUrl: string): void {
    this.apiBaseUrl = apiBaseUrl;
  }

  updateApiKeyRef(apiKeyRef: string): void {
    this.apiKeyRef = apiKeyRef;
  }

  updateParameters(parameters: ModelParameters | null): void {
    this.parameters = parameters;
  }

  setAsDefault(): void {
    this.isDefault = true;
  }

  unsetDefault(): void {
    this.isDefault = false;
  }

  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }
}
