import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { TestRunService } from '../../application/services';
import { ExecuteTestRunSaga } from '../../application/sagas';
import { CreateTestRunInput } from '../inputs';
import { GetTestRunArgs, GetTestRunsArgs } from '../dto/args.dto';
import { TestRunModel, TestRunResultModel, TestRunSummaryModel } from '../models';

@Resolver(() => TestRunModel)
export class TestRunResolver {
  constructor(
    private readonly testRunService: TestRunService,
    private readonly executeTestRunSaga: ExecuteTestRunSaga,
  ) {}

  @Mutation(() => TestRunModel)
  async createTestRun(
    @Args('input') input: CreateTestRunInput,
  ): Promise<TestRunModel> {
    return this.testRunService.create({
      projectId: input.projectId,
      name: input.name,
      description: input.description,
      triggerSource: input.triggerSource,
      environment: input.environment,
      buildId: input.buildId,
      commitSha: input.commitSha,
      branch: input.branch,
    });
  }

  @Query(() => [TestRunModel])
  async testRuns(@Args() args: GetTestRunsArgs): Promise<TestRunModel[]> {
    const result = await this.testRunService.findByProjectId(args.projectId, {
      page: args.page,
      limit: args.limit,
      status: args.status,
      triggerSource: args.triggerSource,
    });
    return result.testRuns;
  }

  @Query(() => TestRunModel, { nullable: true })
  async testRun(@Args() args: GetTestRunArgs): Promise<TestRunModel | null> {
    return this.testRunService.findById(args.id);
  }

  @Query(() => [TestRunResultModel])
  async testRunResults(
    @Args('testRunId', { type: () => ID }) testRunId: string,
  ): Promise<TestRunResultModel[]> {
    return this.testRunService.findResultsByTestRunId(testRunId);
  }

  @Query(() => TestRunSummaryModel)
  async testRunSummary(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<TestRunSummaryModel> {
    return this.testRunService.getSummary(id);
  }

  @Mutation(() => TestRunModel)
  async executeTestRun(
    @Args('id', { type: () => ID }) id: string,
    @Args('testCaseIds', { type: () => [ID] }) testCaseIds: string[],
  ): Promise<TestRunModel> {
    // Execute the saga
    await this.executeTestRunSaga.execute({
      testRunId: id,
      testCaseIds,
    });

    // Return updated test run
    const testRun = await this.testRunService.getById(id);
    return testRun;
  }

  @Mutation(() => Boolean)
  async deleteTestRun(@Args('id') id: string): Promise<boolean> {
    return this.testRunService.delete(id);
  }
}
