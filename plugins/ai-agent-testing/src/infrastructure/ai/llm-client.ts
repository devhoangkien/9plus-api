import { Injectable, Logger } from '@nestjs/common';
import { ModelConfigRepository, ResolveModelOptions } from '../../domain/repositories';
import { ModelConfig, ModelProvider } from '../../domain/entities';
import { LlmProvider } from './llm-provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { GeminiProvider } from './providers/gemini.provider';

/**
 * LLM Client - Orchestrates calls to different AI model providers
 */
@Injectable()
export class LlmClient {
  private readonly logger = new Logger(LlmClient.name);
  private readonly providers: Map<ModelProvider, LlmProvider>;

  constructor(
    private readonly modelConfigRepository: ModelConfigRepository,
    private readonly anthropicProvider: AnthropicProvider,
    private readonly openAiProvider: OpenAiProvider,
    private readonly geminiProvider: GeminiProvider,
  ) {
    this.providers = new Map([
      [ModelProvider.ANTHROPIC, this.anthropicProvider],
      [ModelProvider.OPENAI, this.openAiProvider],
      [ModelProvider.AZURE_OPENAI, this.openAiProvider],
      [ModelProvider.GOOGLE, this.geminiProvider],
    ]);
  }

  /**
   * Complete a prompt and return JSON using the resolved model
   */
  async completeJsonWithModel<T>(
    options: ResolveModelOptions,
    prompt: string,
  ): Promise<T> {
    const modelConfig = await this.resolveModelConfig(options);
    const provider = this.getProvider(modelConfig);
    
    this.logger.debug(
      `Using model ${modelConfig.name} (${modelConfig.modelName}) for JSON completion`,
    );

    return provider.completeJson<T>(modelConfig, prompt);
  }

  /**
   * Complete a prompt and return text using the resolved model
   */
  async completeTextWithModel(
    options: ResolveModelOptions,
    prompt: string,
  ): Promise<string> {
    const modelConfig = await this.resolveModelConfig(options);
    const provider = this.getProvider(modelConfig);
    
    this.logger.debug(
      `Using model ${modelConfig.name} (${modelConfig.modelName}) for text completion`,
    );

    return provider.completeText(modelConfig, prompt);
  }

  /**
   * Resolve the model configuration based on options
   */
  private async resolveModelConfig(options: ResolveModelOptions): Promise<ModelConfig> {
    const modelConfig = await this.modelConfigRepository.resolveModel(options);
    
    if (!modelConfig) {
      throw new Error(
        'No model configuration found. Please configure a default model or specify a modelId.',
      );
    }

    if (!modelConfig.isActive) {
      throw new Error(`Model configuration "${modelConfig.name}" is not active.`);
    }

    return modelConfig;
  }

  /**
   * Get the appropriate provider for a model configuration
   */
  private getProvider(modelConfig: ModelConfig): LlmProvider {
    const provider = this.providers.get(modelConfig.provider);
    
    if (!provider) {
      throw new Error(`No provider available for ${modelConfig.provider}`);
    }

    return provider;
  }
}
