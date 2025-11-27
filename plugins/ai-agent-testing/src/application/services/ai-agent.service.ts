import { Injectable, Logger } from '@nestjs/common';
import { LlmClient, PromptTemplates } from '../../infrastructure/ai';
import { TestType, TestStep, TestStepType } from '../../domain/entities';

/**
 * Parameters for generating test cases
 */
export interface GenerateTestCaseParams {
  projectId: string;
  description: string;
  testType: TestType;
  language?: string;
  style?: 'GWT' | 'STEP_BY_STEP';
  modelId?: string;
}

/**
 * Generated test case structure
 */
export interface GeneratedTestCase {
  name: string;
  description: string;
  steps: TestStep[];
  script?: string;
}

/**
 * Failure analysis result
 */
export interface FailureAnalysis {
  rootCause: string;
  suggestedFixes: Array<{
    stepIndex: number;
    change: string;
    reason: string;
  }>;
  recommendations: string[];
}

/**
 * Locator suggestions
 */
export interface LocatorSuggestion {
  selector: string;
  type: 'css' | 'xpath';
  confidence: number;
  reason: string;
}

/**
 * AI Agent Service
 * Handles AI-powered test case generation and analysis
 */
@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);

  constructor(private readonly llmClient: LlmClient) {}

  /**
   * Generate a test case from natural language description
   */
  async generateTestCase(params: GenerateTestCaseParams): Promise<GeneratedTestCase> {
    this.logger.debug(`Generating test case for project ${params.projectId}`);
    this.logger.debug(`Description: ${params.description.substring(0, 100)}...`);

    const prompt = PromptTemplates.buildGenerateTestCasePrompt({
      description: params.description,
      testType: params.testType,
      language: params.language,
      style: params.style,
    });

    const result = await this.llmClient.completeJsonWithModel<GeneratedTestCase>(
      {
        modelId: params.modelId,
        projectId: params.projectId,
      },
      prompt,
    );

    // Validate and normalize the result
    return this.normalizeGeneratedTestCase(result);
  }

  /**
   * Analyze a test failure and suggest fixes
   */
  async analyzeFailure(
    testCase: { name: string; steps: TestStep[] },
    errorMessage: string,
    logs?: string,
    options?: { modelId?: string; projectId?: string },
  ): Promise<FailureAnalysis> {
    this.logger.debug(`Analyzing failure for test: ${testCase.name}`);

    const prompt = PromptTemplates.buildAnalyzeFailurePrompt(
      testCase,
      errorMessage,
      logs,
    );

    const result = await this.llmClient.completeJsonWithModel<FailureAnalysis>(
      options || {},
      prompt,
    );

    return result;
  }

  /**
   * Suggest better locators for an element
   */
  async suggestLocators(
    currentSelector: string,
    domSnippet: string,
    options?: { modelId?: string; projectId?: string },
  ): Promise<LocatorSuggestion[]> {
    this.logger.debug(`Suggesting locators for: ${currentSelector}`);

    const prompt = PromptTemplates.buildLocatorSuggestionPrompt(
      currentSelector,
      domSnippet,
    );

    const result = await this.llmClient.completeJsonWithModel<{
      suggestions: LocatorSuggestion[];
    }>(options || {}, prompt);

    return result.suggestions;
  }

  /**
   * Normalize and validate generated test case
   */
  private normalizeGeneratedTestCase(raw: GeneratedTestCase): GeneratedTestCase {
    // Ensure steps have required fields
    const steps = (raw.steps || []).map((step, index) => ({
      order: step.order ?? index + 1,
      type: this.normalizeStepType(step.type),
      description: step.description || `Step ${index + 1}`,
      target: step.target,
      value: step.value,
      timeout: step.timeout ?? 5000,
      options: step.options || {},
    }));

    return {
      name: raw.name || 'Generated Test Case',
      description: raw.description || '',
      steps,
      script: raw.script,
    };
  }

  /**
   * Normalize step type to valid enum value
   */
  private normalizeStepType(type: string | TestStepType): TestStepType {
    const normalized = String(type).toUpperCase();
    if (Object.values(TestStepType).includes(normalized as TestStepType)) {
      return normalized as TestStepType;
    }
    return TestStepType.CUSTOM;
  }
}
