import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { TestCaseService } from '../../application/services';
import { CreateTestCaseInput, UpdateTestCaseInput } from '../inputs';
import { GetTestCaseArgs, GetTestCasesArgs } from '../dto/args.dto';
import { TestCaseModel } from '../models';
import { TestStep } from '../../domain/entities';

@Resolver(() => TestCaseModel)
export class TestCaseResolver {
  constructor(private readonly testCaseService: TestCaseService) {}

  @Mutation(() => TestCaseModel)
  async createTestCase(
    @Args('input') input: CreateTestCaseInput,
  ): Promise<TestCaseModel> {
    return this.testCaseService.create({
      ...input,
      steps: input.steps as TestStep[],
    });
  }

  @Query(() => [TestCaseModel])
  async testCases(@Args() args: GetTestCasesArgs): Promise<TestCaseModel[]> {
    const result = await this.testCaseService.findByProjectId(args.projectId, {
      page: args.page,
      limit: args.limit,
      type: args.type,
      isActive: args.isActive,
    });
    return result.testCases;
  }

  @Query(() => TestCaseModel, { nullable: true })
  async testCase(@Args() args: GetTestCaseArgs): Promise<TestCaseModel | null> {
    return this.testCaseService.findById(args.id);
  }

  @Mutation(() => TestCaseModel)
  async updateTestCase(
    @Args('input') input: UpdateTestCaseInput,
  ): Promise<TestCaseModel> {
    return this.testCaseService.update(input.id, {
      ...input,
      steps: input.steps as TestStep[],
    });
  }

  @Mutation(() => Boolean)
  async deleteTestCase(@Args('id') id: string): Promise<boolean> {
    return this.testCaseService.delete(id);
  }
}
