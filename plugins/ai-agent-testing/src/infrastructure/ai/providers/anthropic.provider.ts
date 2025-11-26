import { Injectable, Logger } from '@nestjs/common';
import { BaseLlmProvider } from '../llm-provider';
import { ModelConfig, ModelProvider } from '../../../domain/entities';

/**
 * Anthropic (Claude) LLM Provider
 */
@Injectable()
export class AnthropicProvider extends BaseLlmProvider {
  private readonly logger = new Logger(AnthropicProvider.name);

  supports(modelConfig: ModelConfig): boolean {
    return modelConfig.provider === ModelProvider.ANTHROPIC;
  }

  async completeJson<T>(modelConfig: ModelConfig, prompt: string): Promise<T> {
    const response = await this.completeText(modelConfig, prompt);
    return this.parseJsonResponse<T>(response);
  }

  async completeText(modelConfig: ModelConfig, prompt: string): Promise<string> {
    const apiKey = this.getApiKey(modelConfig.apiKeyRef);
    const baseUrl = modelConfig.apiBaseUrl || 'https://api.anthropic.com';
    
    const params = modelConfig.parameters || {};
    const maxTokens = params.maxTokens || 4096;
    const temperature = params.temperature ?? 0.7;

    this.logger.debug(`Calling Anthropic API with model: ${modelConfig.modelName}`);

    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: modelConfig.modelName,
        max_tokens: maxTokens,
        temperature,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Anthropic API error: ${error}`);
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as {
      content: Array<{ type: string; text?: string }>;
    };
    
    const textContent = data.content.find((c) => c.type === 'text');
    if (!textContent?.text) {
      throw new Error('No text content in Anthropic response');
    }

    return textContent.text;
  }
}
