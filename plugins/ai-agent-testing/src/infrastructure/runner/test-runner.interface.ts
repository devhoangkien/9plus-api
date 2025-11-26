import { TestCase, TestStep, TestResultStatus, TestRunResult, StepResult } from '../../domain/entities';

/**
 * Test execution context
 */
export interface TestExecutionContext {
  testCase: TestCase;
  environment?: string;
  config?: Record<string, any>;
  baseUrl?: string;
  timeout?: number;
}

/**
 * Test execution result
 */
export interface TestExecutionResult {
  status: TestResultStatus;
  duration: number;
  logs: string;
  errorMessage?: string;
  errorStack?: string;
  screenshotUrl?: string;
  stepResults: StepResult[];
}

/**
 * Base interface for test runners
 */
export interface TestRunner {
  /**
   * Execute a test case
   */
  execute(context: TestExecutionContext): Promise<TestExecutionResult>;

  /**
   * Validate test case can be executed by this runner
   */
  canExecute(testCase: TestCase): boolean;
}
