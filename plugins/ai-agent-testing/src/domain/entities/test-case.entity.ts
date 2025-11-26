import { TestType, TestStepType } from './test-enums';

/**
 * TestStep - A single step in a test case
 */
export interface TestStep {
  order: number;
  type: TestStepType;
  description: string;
  target?: string; // CSS selector, XPath, or URL
  value?: string; // Input value, expected text, etc.
  timeout?: number; // Step timeout in milliseconds
  options?: Record<string, any>; // Additional step-specific options
}

/**
 * TestCase Domain Entity
 */
export class TestCase {
  constructor(
    public readonly id: string,
    public projectId: string,
    public name: string,
    public description: string | null,
    public type: TestType,
    public steps: TestStep[] | null,
    public script: string | null,
    public generatedBy: string | null,
    public originalPrompt: string | null,
    public isActive: boolean,
    public createdAt: Date,
    public updatedAt: Date,
    public createdBy: string | null,
  ) {}

  updateName(name: string): void {
    this.name = name;
  }

  updateDescription(description: string | null): void {
    this.description = description;
  }

  updateSteps(steps: TestStep[] | null): void {
    this.steps = steps;
  }

  updateScript(script: string | null): void {
    this.script = script;
  }

  activate(): void {
    this.isActive = true;
  }

  deactivate(): void {
    this.isActive = false;
  }

  setGenerationMetadata(modelId: string, prompt: string): void {
    this.generatedBy = modelId;
    this.originalPrompt = prompt;
  }
}
