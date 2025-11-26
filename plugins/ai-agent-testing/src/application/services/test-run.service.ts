import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TestRun,
  TestRunResult,
  TestRunStatus,
  TestResultStatus,
  TestRunTriggerSource,
  StepResult,
} from '../../domain/entities';

/**
 * Test Run Service - Application layer service for test run operations
 */
@Injectable()
export class TestRunService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new test run
   */
  async create(input: {
    projectId: string;
    name?: string;
    description?: string;
    triggerSource?: TestRunTriggerSource;
    environment?: string;
    config?: Record<string, any>;
    buildId?: string;
    commitSha?: string;
    branch?: string;
    createdBy?: string;
  }): Promise<TestRun> {
    const created = await this.prisma.testRun.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        description: input.description,
        triggerSource: input.triggerSource || TestRunTriggerSource.MANUAL,
        environment: input.environment,
        config: input.config,
        buildId: input.buildId,
        commitSha: input.commitSha,
        branch: input.branch,
        createdBy: input.createdBy,
      },
    });

    return this.mapToTestRun(created);
  }

  /**
   * Find test run by ID
   */
  async findById(id: string): Promise<TestRun | null> {
    const testRun = await this.prisma.testRun.findUnique({
      where: { id },
    });

    return testRun ? this.mapToTestRun(testRun) : null;
  }

  /**
   * Get test run by ID or throw
   */
  async getById(id: string): Promise<TestRun> {
    const testRun = await this.findById(id);
    if (!testRun) {
      throw new NotFoundException(`Test run with ID ${id} not found`);
    }
    return testRun;
  }

  /**
   * Find test runs by project ID
   */
  async findByProjectId(
    projectId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: TestRunStatus;
      triggerSource?: TestRunTriggerSource;
    },
  ): Promise<{ testRuns: TestRun[]; total: number; hasMore: boolean }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = { projectId };
    if (options?.status) where.status = options.status;
    if (options?.triggerSource) where.triggerSource = options.triggerSource;

    const [testRuns, total] = await Promise.all([
      this.prisma.testRun.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.testRun.count({ where }),
    ]);

    return {
      testRuns: testRuns.map((tr) => this.mapToTestRun(tr)),
      total,
      hasMore: skip + testRuns.length < total,
    };
  }

  /**
   * Update a test run
   */
  async update(
    id: string,
    input: {
      status?: TestRunStatus;
      startedAt?: Date;
      finishedAt?: Date;
      totalTests?: number;
      passedTests?: number;
      failedTests?: number;
      skippedTests?: number;
    },
  ): Promise<TestRun> {
    const updated = await this.prisma.testRun.update({
      where: { id },
      data: input,
    });

    return this.mapToTestRun(updated);
  }

  /**
   * Delete a test run
   */
  async delete(id: string): Promise<boolean> {
    await this.prisma.testRun.delete({
      where: { id },
    });
    return true;
  }

  // ========== Test Run Results ==========

  /**
   * Create a test run result
   */
  async createResult(input: {
    testRunId: string;
    testCaseId: string;
    status?: TestResultStatus;
  }): Promise<TestRunResult> {
    const created = await this.prisma.testRunResult.create({
      data: {
        testRunId: input.testRunId,
        testCaseId: input.testCaseId,
        status: input.status || TestResultStatus.PENDING,
      },
    });

    return this.mapToTestRunResult(created);
  }

  /**
   * Find result by ID
   */
  async findResultById(id: string): Promise<TestRunResult | null> {
    const result = await this.prisma.testRunResult.findUnique({
      where: { id },
    });

    return result ? this.mapToTestRunResult(result) : null;
  }

  /**
   * Find results by test run ID
   */
  async findResultsByTestRunId(testRunId: string): Promise<TestRunResult[]> {
    const results = await this.prisma.testRunResult.findMany({
      where: { testRunId },
      orderBy: { createdAt: 'asc' },
    });

    return results.map((r) => this.mapToTestRunResult(r));
  }

  /**
   * Update a test run result
   */
  async updateResult(
    id: string,
    input: {
      status?: TestResultStatus;
      startedAt?: Date;
      finishedAt?: Date;
      duration?: number;
      logs?: string;
      errorMessage?: string;
      errorStack?: string;
      screenshotUrl?: string;
      artifacts?: string[];
      stepResults?: StepResult[];
    },
  ): Promise<TestRunResult> {
    const updated = await this.prisma.testRunResult.update({
      where: { id },
      data: {
        status: input.status,
        startedAt: input.startedAt,
        finishedAt: input.finishedAt,
        duration: input.duration,
        logs: input.logs,
        errorMessage: input.errorMessage,
        errorStack: input.errorStack,
        screenshotUrl: input.screenshotUrl,
        artifacts: input.artifacts,
        stepResults: input.stepResults,
      },
    });

    return this.mapToTestRunResult(updated);
  }

  /**
   * Get test run summary
   */
  async getSummary(testRunId: string): Promise<{
    testRunId: string;
    status: TestRunStatus;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    duration: number | null;
    passRate: number;
  }> {
    const testRun = await this.getById(testRunId);
    
    let duration: number | null = null;
    if (testRun.startedAt && testRun.finishedAt) {
      duration = testRun.finishedAt.getTime() - testRun.startedAt.getTime();
    }

    const passRate = testRun.totalTests > 0
      ? (testRun.passedTests / testRun.totalTests) * 100
      : 0;

    return {
      testRunId,
      status: testRun.status,
      totalTests: testRun.totalTests,
      passedTests: testRun.passedTests,
      failedTests: testRun.failedTests,
      skippedTests: testRun.skippedTests,
      duration,
      passRate: Math.round(passRate * 100) / 100,
    };
  }

  /**
   * Map Prisma model to TestRun entity
   */
  private mapToTestRun(data: any): TestRun {
    return new TestRun(
      data.id,
      data.projectId,
      data.name,
      data.description,
      data.status as TestRunStatus,
      data.triggerSource as TestRunTriggerSource,
      data.startedAt,
      data.finishedAt,
      data.environment,
      data.config,
      data.totalTests,
      data.passedTests,
      data.failedTests,
      data.skippedTests,
      data.buildId,
      data.commitSha,
      data.branch,
      data.createdAt,
      data.updatedAt,
      data.createdBy,
    );
  }

  /**
   * Map Prisma model to TestRunResult entity
   */
  private mapToTestRunResult(data: any): TestRunResult {
    return new TestRunResult(
      data.id,
      data.testRunId,
      data.testCaseId,
      data.status as TestResultStatus,
      data.startedAt,
      data.finishedAt,
      data.duration,
      data.logs,
      data.errorMessage,
      data.errorStack,
      data.screenshotUrl,
      data.artifacts as string[] | null,
      data.stepResults as StepResult[] | null,
      data.createdAt,
      data.updatedAt,
    );
  }
}
