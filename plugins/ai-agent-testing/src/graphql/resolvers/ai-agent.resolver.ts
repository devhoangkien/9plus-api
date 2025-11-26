import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AiAgentService, TestCaseService } from '../../application/services';
import { GenerateTestCaseInput } from '../inputs';
import { TestCaseModel, GeneratedTestCaseModel } from '../models';

@Resolver()
export class AiAgentResolver {
  constructor(
    private readonly aiAgentService: AiAgentService,
    private readonly testCaseService: TestCaseService,
  ) {}

  /**
   * Generate a test case from natural language description
   * Returns the generated test case without saving
   */
  @Mutation(() => GeneratedTestCaseModel)
  async generateTestCase(
    @Args('input') input: GenerateTestCaseInput,
  ): Promise<GeneratedTestCaseModel> {
    const generated = await this.aiAgentService.generateTestCase({
      projectId: input.projectId,
      description: input.description,
      testType: input.type,
      language: input.language,
      style: input.style as 'GWT' | 'STEP_BY_STEP',
      modelId: input.modelId,
    });

    return generated;
  }

  /**
   * Generate and save a test case from natural language description
   */
  @Mutation(() => TestCaseModel)
  async generateAndSaveTestCase(
    @Args('input') input: GenerateTestCaseInput,
  ): Promise<TestCaseModel> {
    // Generate the test case
    const generated = await this.aiAgentService.generateTestCase({
      projectId: input.projectId,
      description: input.description,
      testType: input.type,
      language: input.language,
      style: input.style as 'GWT' | 'STEP_BY_STEP',
      modelId: input.modelId,
    });

    // Save the generated test case
    return this.testCaseService.create({
      projectId: input.projectId,
      name: generated.name,
      description: generated.description,
      type: input.type,
      steps: generated.steps,
      script: generated.script,
      generatedBy: input.modelId,
      originalPrompt: input.description,
    });
  }
}
