import { TestRun, TestRunResult } from '../entities';
import { TestRunStatus, TestRunTriggerSource } from '../entities/test-enums';

/**
 * Test Run Repository Interface
 */
export interface TestRunRepository {
  findById(id: string): Promise<TestRun | null>;
  findByProjectId(
    projectId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: TestRunStatus;
      triggerSource?: TestRunTriggerSource;
    },
  ): Promise<TestRun[]>;
  countByProjectId(projectId: string): Promise<number>;
  save(testRun: TestRun): Promise<TestRun>;
  delete(id: string): Promise<void>;
  
  // Results
  findResultsByTestRunId(testRunId: string): Promise<TestRunResult[]>;
  findResultById(id: string): Promise<TestRunResult | null>;
  saveResult(result: TestRunResult): Promise<TestRunResult>;
  saveResults(results: TestRunResult[]): Promise<TestRunResult[]>;
}
