import { Injectable, Logger } from '@nestjs/common';
import { BaseLlmProvider } from '../llm-provider';
import { ModelConfig, ModelProvider } from '../../../domain/entities';

/**
 * Google Gemini LLM Provider
 */
@Injectable()
export class GeminiProvider extends BaseLlmProvider {
  private readonly logger = new Logger(GeminiProvider.name);

  supports(modelConfig: ModelConfig): boolean {
    return modelConfig.provider === ModelProvider.GOOGLE;
  }

  async completeJson<T>(modelConfig: ModelConfig, prompt: string): Promise<T> {
    const response = await this.completeText(modelConfig, prompt);
    return this.parseJsonResponse<T>(response);
  }

  async completeText(modelConfig: ModelConfig, prompt: string): Promise<string> {
    const apiKey = this.getApiKey(modelConfig.apiKeyRef);
    const baseUrl = modelConfig.apiBaseUrl || 'https://generativelanguage.googleapis.com';
    
    const params = modelConfig.parameters || {};
    const maxTokens = params.maxTokens || 4096;
    const temperature = params.temperature ?? 0.7;

    this.logger.debug(`Calling Google Gemini API with model: ${modelConfig.modelName}`);

    const response = await fetch(
      `${baseUrl}/v1beta/models/${modelConfig.modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature,
          },
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Google Gemini API error: ${error}`);
      throw new Error(`Google Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as {
      candidates: Array<{
        content: {
          parts: Array<{ text: string }>;
        };
      }>;
    };
    
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error('No content in Google Gemini response');
    }

    return content;
  }
}
