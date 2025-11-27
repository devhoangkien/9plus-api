import { BaseDomainEvent } from './domain-event';
import { TestRunStatus, TestRunTriggerSource } from '../entities';

/**
 * Event fired when a test run is created
 */
export class TestRunCreatedEvent extends BaseDomainEvent {
  constructor(
    testRunId: string,
    public readonly projectId: string,
    public readonly triggerSource: TestRunTriggerSource,
    public readonly testCaseIds: string[],
  ) {
    super('TestRunCreated', testRunId, {
      projectId,
      triggerSource,
      testCaseIds,
    });
  }
}

/**
 * Event fired when a test run starts execution
 */
export class TestRunStartedEvent extends BaseDomainEvent {
  constructor(
    testRunId: string,
    public readonly startedAt: Date,
  ) {
    super('TestRunStarted', testRunId, { startedAt });
  }
}

/**
 * Event fired when a test run completes
 */
export class TestRunCompletedEvent extends BaseDomainEvent {
  constructor(
    testRunId: string,
    public readonly status: TestRunStatus,
    public readonly passedTests: number,
    public readonly failedTests: number,
    public readonly skippedTests: number,
    public readonly duration: number,
  ) {
    super('TestRunCompleted', testRunId, {
      status,
      passedTests,
      failedTests,
      skippedTests,
      duration,
    });
  }
}
