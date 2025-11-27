import { Injectable, Logger } from '@nestjs/common';
import { TestRunner, TestExecutionContext, TestExecutionResult } from './test-runner.interface';
import { TestCase, TestType, TestResultStatus, StepResult, TestStep, TestStepType } from '../../domain/entities';

/**
 * API Test Runner
 * Executes HTTP API tests
 */
@Injectable()
export class ApiRunner implements TestRunner {
  private readonly logger = new Logger(ApiRunner.name);

  canExecute(testCase: TestCase): boolean {
    return testCase.type === TestType.API;
  }

  async execute(context: TestExecutionContext): Promise<TestExecutionResult> {
    const { testCase, baseUrl, timeout = 30000 } = context;
    const startTime = Date.now();
    const logs: string[] = [];
    const stepResults: StepResult[] = [];

    this.logger.debug(`Starting API test: ${testCase.name}`);
    logs.push(`[${new Date().toISOString()}] Starting test: ${testCase.name}`);

    const steps = testCase.steps ?? [];

    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepStartTime = Date.now();
        
        logs.push(`[${new Date().toISOString()}] Step ${i + 1}: ${step.description}`);

        try {
          const result = await this.executeStep(step, context);
          
          const stepDuration = Date.now() - stepStartTime;
          stepResults.push({
            stepIndex: i,
            status: TestResultStatus.PASSED,
            startedAt: new Date(stepStartTime),
            finishedAt: new Date(),
            duration: stepDuration,
            log: result,
          });

          logs.push(`[${new Date().toISOString()}] ✓ Step ${i + 1} passed (${stepDuration}ms)`);
          logs.push(result);
        } catch (error) {
          const err = error as Error;
          const stepDuration = Date.now() - stepStartTime;
          
          stepResults.push({
            stepIndex: i,
            status: TestResultStatus.FAILED,
            startedAt: new Date(stepStartTime),
            finishedAt: new Date(),
            duration: stepDuration,
            log: `Step failed: ${step.description}`,
            errorMessage: err.message,
          });

          logs.push(`[${new Date().toISOString()}] ✗ Step ${i + 1} failed: ${err.message}`);

          const duration = Date.now() - startTime;
          return {
            status: TestResultStatus.FAILED,
            duration,
            logs: logs.join('\n'),
            errorMessage: err.message,
            errorStack: err.stack,
            stepResults,
          };
        }
      }

      const duration = Date.now() - startTime;
      logs.push(`[${new Date().toISOString()}] Test completed successfully (${duration}ms)`);

      return {
        status: TestResultStatus.PASSED,
        duration,
        logs: logs.join('\n'),
        stepResults,
      };
    } catch (error) {
      const err = error as Error;
      const duration = Date.now() - startTime;
      
      logs.push(`[${new Date().toISOString()}] Test error: ${err.message}`);

      return {
        status: TestResultStatus.ERROR,
        duration,
        logs: logs.join('\n'),
        errorMessage: err.message,
        errorStack: err.stack,
        stepResults,
      };
    }
  }

  /**
   * Execute a single API test step
   */
  private async executeStep(step: TestStep, context: TestExecutionContext): Promise<string> {
    const { baseUrl } = context;
    const options = step.options || {};

    switch (step.type) {
      case TestStepType.HTTP_REQUEST: {
        const method = options.method || 'GET';
        const url = this.resolveUrl(step.target || '', baseUrl);
        const headers = options.headers || {};
        const body = options.body;

        this.logger.debug(`Making ${method} request to: ${url}`);

        const fetchOptions: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
        };

        if (body && method !== 'GET') {
          fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        const response = await fetch(url, fetchOptions);
        const responseBody = await response.text();

        let parsedBody: any;
        try {
          parsedBody = JSON.parse(responseBody);
        } catch {
          parsedBody = responseBody;
        }

        // Store response for assertions
        (context as any).lastResponse = {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: parsedBody,
        };

        return `Response: ${response.status} ${response.statusText}\n${JSON.stringify(parsedBody, null, 2).substring(0, 500)}`;
      }

      case TestStepType.ASSERT_STATUS: {
        const lastResponse = (context as any).lastResponse;
        if (!lastResponse) {
          throw new Error('No response to assert. Make an HTTP request first.');
        }

        const expectedStatus = parseInt(step.value || '200', 10);
        if (lastResponse.status !== expectedStatus) {
          throw new Error(
            `Expected status ${expectedStatus} but got ${lastResponse.status}`,
          );
        }

        return `Status assertion passed: ${lastResponse.status} === ${expectedStatus}`;
      }

      case TestStepType.ASSERT_RESPONSE: {
        const lastResponse = (context as any).lastResponse;
        if (!lastResponse) {
          throw new Error('No response to assert. Make an HTTP request first.');
        }

        const assertion = options.assertion;
        if (!assertion) {
          throw new Error('No assertion specified in step options');
        }

        // Simple JSON path assertion
        const { path, expected, operator = 'equals' } = assertion;
        const actual = this.getValueAtPath(lastResponse.body, path);

        let passed = false;
        switch (operator) {
          case 'equals':
            passed = actual === expected;
            break;
          case 'contains':
            passed = String(actual).includes(String(expected));
            break;
          case 'exists':
            passed = actual !== undefined;
            break;
          case 'notNull':
            passed = actual !== null && actual !== undefined;
            break;
          default:
            throw new Error(`Unknown assertion operator: ${operator}`);
        }

        if (!passed) {
          throw new Error(
            `Assertion failed: ${path} ${operator} ${expected}, got ${actual}`,
          );
        }

        return `Response assertion passed: ${path} ${operator} ${expected}`;
      }

      default:
        this.logger.warn(`Unknown or unsupported step type for API runner: ${step.type}`);
        return `Skipped step type: ${step.type}`;
    }
  }

  /**
   * Resolve URL with optional base URL
   */
  private resolveUrl(target: string, baseUrl?: string): string {
    if (target.startsWith('http://') || target.startsWith('https://')) {
      return target;
    }
    if (baseUrl) {
      return `${baseUrl.replace(/\/$/, '')}/${target.replace(/^\//, '')}`;
    }
    return target;
  }

  /**
   * Get value at JSON path (simple implementation)
   */
  private getValueAtPath(obj: any, path: string): any {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      // Handle array access like "items[0]"
      const match = part.match(/^(\w+)\[(\d+)\]$/);
      if (match) {
        const [, arrayName, index] = match;
        current = current[arrayName]?.[parseInt(index, 10)];
      } else {
        current = current[part];
      }
    }

    return current;
  }
}
