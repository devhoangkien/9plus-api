import { Injectable, Logger } from '@nestjs/common';
import { BaseLlmProvider } from '../llm-provider';
import { ModelConfig, ModelProvider } from '../../../domain/entities';

/**
 * OpenAI LLM Provider (also supports Azure OpenAI)
 */
@Injectable()
export class OpenAiProvider extends BaseLlmProvider {
  private readonly logger = new Logger(OpenAiProvider.name);

  supports(modelConfig: ModelConfig): boolean {
    return (
      modelConfig.provider === ModelProvider.OPENAI ||
      modelConfig.provider === ModelProvider.AZURE_OPENAI
    );
  }

  async completeJson<T>(modelConfig: ModelConfig, prompt: string): Promise<T> {
    const response = await this.completeText(modelConfig, prompt);
    return this.parseJsonResponse<T>(response);
  }

  async completeText(modelConfig: ModelConfig, prompt: string): Promise<string> {
    const apiKey = this.getApiKey(modelConfig.apiKeyRef);
    const isAzure = modelConfig.provider === ModelProvider.AZURE_OPENAI;
    
    const baseUrl = modelConfig.apiBaseUrl || 
      (isAzure ? '' : 'https://api.openai.com');
    
    const params = modelConfig.parameters || {};
    const maxTokens = params.maxTokens || 4096;
    const temperature = params.temperature ?? 0.7;

    this.logger.debug(`Calling OpenAI API with model: ${modelConfig.modelName}`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (isAzure) {
      headers['api-key'] = apiKey;
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const endpoint = isAzure
      ? `${baseUrl}/openai/deployments/${modelConfig.modelName}/chat/completions?api-version=2024-02-15-preview`
      : `${baseUrl}/v1/chat/completions`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
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
      this.logger.error(`OpenAI API error: ${error}`);
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('No content in OpenAI response');
    }

    return data.choices[0].message.content;
  }
}
