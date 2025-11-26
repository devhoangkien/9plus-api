import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  SagaOrchestrator,
  SagaConfig,
  SagaStep,
  SagaResult,
} from '@anineplus/common';
import { TestCaseService, TestRunService } from '../services';
import { WebRunner, ApiRunner } from '../../infrastructure/runner';
import {
  TestRun,
  TestCase,
  TestRunStatus,
  TestResultStatus,
  TestType,
} from '../../domain/entities';

/**
 * Execute Test Run Saga Data
 */
export interface ExecuteTestRunData {
  testRunId: string;
  testCaseIds: string[];
  environment?: string;
  config?: Record<string, any>;
}

/**
 * Execute Test Run Saga Result
 */
export interface ExecuteTestRunResult {
  testRunId: string;
  status: TestRunStatus;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
}

/**
 * Execute Test Run Saga
 * 
 * Orchestrates the execution of a test run:
 * 1. Load test run and test cases
 * 2. Update test run status to RUNNING
 * 3. Execute each test case
 * 4. Update test run with results
 * 5. Complete test run
 */
@Injectable()
export class ExecuteTestRunSaga {
  private readonly logger = new Logger(ExecuteTestRunSaga.name);

  constructor(
    private readonly sagaOrchestrator: SagaOrchestrator,
    private readonly testRunService: TestRunService,
    private readonly testCaseService: TestCaseService,
    private readonly webRunner: WebRunner,
    private readonly apiRunner: ApiRunner,
  ) {}

  /**
   * Execute the test run saga
   */
  async execute(data: ExecuteTestRunData): Promise<SagaResult<ExecuteTestRunData>> {
    const sagaId = `execute-test-run-${data.testRunId}-${randomUUID()}`;
    
    const config: SagaConfig = {
      sagaId,
      name: 'ExecuteTestRunSaga',
      timeout: 300000, // 5 minutes
      retryAttempts: 0,
    };

    const steps: SagaStep<ExecuteTestRunData>[] = [
      this.createLoadDataStep(),
      this.createStartTestRunStep(),
      this.createExecuteTestsStep(),
      this.createCompleteTestRunStep(),
    ];

    return this.sagaOrchestrator.execute(config, steps, data);
  }

  /**
   * Step 1: Load test run and test cases
   */
  private createLoadDataStep(): SagaStep<ExecuteTestRunData> {
    return {
      name: 'LoadData',
      order: 1,
      execute: async (context) => {
        this.logger.debug(`[${context.sagaId}] Loading test run ${context.data.testRunId}`);
        
        const testRun = await this.testRunService.getById(context.data.testRunId);
        const testCases = await this.testCaseService.findByIds(context.data.testCaseIds);
        
        if (testCases.length === 0) {
          throw new Error('No test cases found for execution');
        }

        return { testRun, testCases };
      },
      compensate: async () => {
        this.logger.debug('No compensation needed for LoadData');
      },
    };
  }

  /**
   * Step 2: Update test run status to RUNNING
   */
  private createStartTestRunStep(): SagaStep<ExecuteTestRunData> {
    return {
      name: 'StartTestRun',
      order: 2,
      execute: async (context) => {
        this.logger.debug(`[${context.sagaId}] Starting test run ${context.data.testRunId}`);
        
        const testRun = await this.testRunService.update(context.data.testRunId, {
          status: TestRunStatus.RUNNING,
          startedAt: new Date(),
        });

        return { testRun };
      },
      compensate: async (context) => {
        // Revert to PENDING status
        this.logger.warn(`[${context.sagaId}] Reverting test run to PENDING`);
        try {
          await this.testRunService.update(context.data.testRunId, {
            status: TestRunStatus.PENDING,
            startedAt: undefined,
          });
        } catch (error) {
          const err = error as Error;
          this.logger.error(`Failed to revert test run status: ${err.message}`);
        }
      },
    };
  }

  /**
   * Step 3: Execute all test cases
   */
  private createExecuteTestsStep(): SagaStep<ExecuteTestRunData> {
    return {
      name: 'ExecuteTests',
      order: 3,
      execute: async (context) => {
        this.logger.debug(`[${context.sagaId}] Executing tests`);
        
        const loadDataResult = context.stepResults.get('LoadData');
        const testCases = loadDataResult?.testCases as TestCase[];
        
        let passedTests = 0;
        let failedTests = 0;
        let skippedTests = 0;

        for (const testCase of testCases) {
          this.logger.debug(`[${context.sagaId}] Executing test case: ${testCase.name}`);

          // Create result record
          const resultRecord = await this.testRunService.createResult({
            testRunId: context.data.testRunId,
            testCaseId: testCase.id,
            status: TestResultStatus.RUNNING,
          });

          try {
            // Select appropriate runner
            const runner = testCase.type === TestType.WEB 
              ? this.webRunner 
              : this.apiRunner;

            // Execute test
            const executionResult = await runner.execute({
              testCase,
              environment: context.data.environment,
              config: context.data.config,
            });

            // Update result record
            await this.testRunService.updateResult(resultRecord.id, {
              status: executionResult.status,
              startedAt: new Date(),
              finishedAt: new Date(),
              duration: executionResult.duration,
              logs: executionResult.logs,
              errorMessage: executionResult.errorMessage,
              errorStack: executionResult.errorStack,
              screenshotUrl: executionResult.screenshotUrl,
              stepResults: executionResult.stepResults,
            });

            // Update counters
            switch (executionResult.status) {
              case TestResultStatus.PASSED:
                passedTests++;
                break;
              case TestResultStatus.FAILED:
              case TestResultStatus.ERROR:
                failedTests++;
                break;
              case TestResultStatus.SKIPPED:
                skippedTests++;
                break;
            }
          } catch (error) {
            const err = error as Error;
            this.logger.error(
              `[${context.sagaId}] Test case ${testCase.name} execution error: ${err.message}`,
            );
            
            await this.testRunService.updateResult(resultRecord.id, {
              status: TestResultStatus.ERROR,
              finishedAt: new Date(),
              errorMessage: err.message,
              errorStack: err.stack,
            });
            
            failedTests++;
          }
        }

        return { passedTests, failedTests, skippedTests };
      },
      compensate: async (context) => {
        // Mark all results as cancelled
        this.logger.warn(`[${context.sagaId}] Cleaning up test results`);
        // Results are already stored, no compensation needed
      },
    };
  }

  /**
   * Step 4: Complete test run with final status
   */
  private createCompleteTestRunStep(): SagaStep<ExecuteTestRunData> {
    return {
      name: 'CompleteTestRun',
      order: 4,
      execute: async (context) => {
        this.logger.debug(`[${context.sagaId}] Completing test run`);
        
        const executeResult = context.stepResults.get('ExecuteTests');
        const { passedTests, failedTests, skippedTests } = executeResult || {
          passedTests: 0,
          failedTests: 0,
          skippedTests: 0,
        };

        // Determine final status
        let status: TestRunStatus;
        if (failedTests === 0 && passedTests > 0) {
          status = TestRunStatus.PASSED;
        } else if (passedTests === 0 && failedTests > 0) {
          status = TestRunStatus.FAILED;
        } else if (passedTests > 0 && failedTests > 0) {
          status = TestRunStatus.PARTIAL;
        } else {
          status = TestRunStatus.ERROR;
        }

        const testRun = await this.testRunService.update(context.data.testRunId, {
          status,
          finishedAt: new Date(),
          totalTests: passedTests + failedTests + skippedTests,
          passedTests,
          failedTests,
          skippedTests,
        });

        return { testRun, status };
      },
      compensate: async (context) => {
        // Mark as error if compensation needed
        this.logger.warn(`[${context.sagaId}] Marking test run as ERROR`);
        try {
          await this.testRunService.update(context.data.testRunId, {
            status: TestRunStatus.ERROR,
            finishedAt: new Date(),
          });
        } catch (error) {
          const err = error as Error;
          this.logger.error(`Failed to mark test run as error: ${err.message}`);
        }
      },
    };
  }
}
