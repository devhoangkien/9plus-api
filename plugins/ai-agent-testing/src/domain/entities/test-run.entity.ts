import { TestRunStatus, TestRunTriggerSource, TestResultStatus } from './test-enums';

/**
 * StepResult - Result of a single step execution
 */
export interface StepResult {
  stepIndex: number;
  status: TestResultStatus;
  startedAt?: Date;
  finishedAt?: Date;
  duration?: number;
  log?: string;
  errorMessage?: string;
  screenshotUrl?: string;
}

/**
 * TestRunResult Domain Entity
 */
export class TestRunResult {
  constructor(
    public readonly id: string,
    public testRunId: string,
    public testCaseId: string,
    public status: TestResultStatus,
    public startedAt: Date | null,
    public finishedAt: Date | null,
    public duration: number | null,
    public logs: string | null,
    public errorMessage: string | null,
    public errorStack: string | null,
    public screenshotUrl: string | null,
    public artifacts: string[] | null,
    public stepResults: StepResult[] | null,
    public createdAt: Date,
    public updatedAt: Date,
  ) {}

  start(): void {
    this.status = TestResultStatus.RUNNING;
    this.startedAt = new Date();
  }

  pass(logs?: string): void {
    this.status = TestResultStatus.PASSED;
    this.finishedAt = new Date();
    if (logs) this.logs = logs;
    if (this.startedAt) {
      this.duration = this.finishedAt.getTime() - this.startedAt.getTime();
    }
  }

  fail(errorMessage: string, errorStack?: string, screenshotUrl?: string): void {
    this.status = TestResultStatus.FAILED;
    this.finishedAt = new Date();
    this.errorMessage = errorMessage;
    if (errorStack) this.errorStack = errorStack;
    if (screenshotUrl) this.screenshotUrl = screenshotUrl;
    if (this.startedAt) {
      this.duration = this.finishedAt.getTime() - this.startedAt.getTime();
    }
  }

  skip(): void {
    this.status = TestResultStatus.SKIPPED;
  }

  setError(message: string): void {
    this.status = TestResultStatus.ERROR;
    this.errorMessage = message;
    this.finishedAt = new Date();
  }

  setStepResults(stepResults: StepResult[]): void {
    this.stepResults = stepResults;
  }

  addArtifact(artifactUrl: string): void {
    if (!this.artifacts) {
      this.artifacts = [];
    }
    this.artifacts.push(artifactUrl);
  }
}

/**
 * TestRun Domain Entity
 */
export class TestRun {
  constructor(
    public readonly id: string,
    public projectId: string,
    public name: string | null,
    public description: string | null,
    public status: TestRunStatus,
    public triggerSource: TestRunTriggerSource,
    public startedAt: Date | null,
    public finishedAt: Date | null,
    public environment: string | null,
    public config: Record<string, any> | null,
    public totalTests: number,
    public passedTests: number,
    public failedTests: number,
    public skippedTests: number,
    public buildId: string | null,
    public commitSha: string | null,
    public branch: string | null,
    public createdAt: Date,
    public updatedAt: Date,
    public createdBy: string | null,
  ) {}

  start(): void {
    this.status = TestRunStatus.RUNNING;
    this.startedAt = new Date();
  }

  complete(): void {
    this.finishedAt = new Date();
    
    if (this.failedTests === 0 && this.passedTests > 0) {
      this.status = TestRunStatus.PASSED;
    } else if (this.passedTests === 0 && this.failedTests > 0) {
      this.status = TestRunStatus.FAILED;
    } else if (this.passedTests > 0 && this.failedTests > 0) {
      this.status = TestRunStatus.PARTIAL;
    } else {
      this.status = TestRunStatus.ERROR;
    }
  }

  cancel(): void {
    this.status = TestRunStatus.CANCELLED;
    this.finishedAt = new Date();
  }

  setError(message?: string): void {
    this.status = TestRunStatus.ERROR;
    this.finishedAt = new Date();
  }

  updateCounts(passed: number, failed: number, skipped: number): void {
    this.passedTests = passed;
    this.failedTests = failed;
    this.skippedTests = skipped;
    this.totalTests = passed + failed + skipped;
  }

  incrementPassed(): void {
    this.passedTests++;
    this.totalTests++;
  }

  incrementFailed(): void {
    this.failedTests++;
    this.totalTests++;
  }

  incrementSkipped(): void {
    this.skippedTests++;
    this.totalTests++;
  }
}
