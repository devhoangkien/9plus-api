import { ModelConfig } from '../../domain/entities';

/**
 * LLM Provider interface for different AI model providers
 */
export interface LlmProvider {
  /**
   * Complete a prompt and return JSON response
   */
  completeJson<T>(modelConfig: ModelConfig, prompt: string): Promise<T>;

  /**
   * Complete a prompt and return text response
   */
  completeText(modelConfig: ModelConfig, prompt: string): Promise<string>;

  /**
   * Check if the provider supports the given model
   */
  supports(modelConfig: ModelConfig): boolean;
}

/**
 * Base class for LLM providers with common functionality
 */
export abstract class BaseLlmProvider implements LlmProvider {
  abstract completeJson<T>(modelConfig: ModelConfig, prompt: string): Promise<T>;
  abstract completeText(modelConfig: ModelConfig, prompt: string): Promise<string>;
  abstract supports(modelConfig: ModelConfig): boolean;

  /**
   * Get API key from environment or reference
   */
  protected getApiKey(apiKeyRef: string): string {
    // First try to get from environment variable
    const envKey = process.env[apiKeyRef];
    if (envKey) {
      return envKey;
    }
    // Otherwise use the value directly (for development)
    return apiKeyRef;
  }

  /**
   * Parse JSON from response, handling potential markdown code blocks
   */
  protected parseJsonResponse<T>(response: string): T {
    // Remove markdown code blocks if present
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    return JSON.parse(cleaned.trim()) as T;
  }
}
