import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ModelConfigService } from '../../application/services';
import { CreateModelConfigInput, UpdateModelConfigInput } from '../inputs';
import { GetModelConfigArgs, GetModelConfigsArgs } from '../dto/args.dto';
import { ModelConfigModel } from '../models';

@Resolver(() => ModelConfigModel)
export class ModelConfigResolver {
  constructor(private readonly modelConfigService: ModelConfigService) {}

  @Mutation(() => ModelConfigModel)
  async createModelConfig(
    @Args('input') input: CreateModelConfigInput,
  ): Promise<ModelConfigModel> {
    return this.modelConfigService.create(input);
  }

  @Query(() => [ModelConfigModel])
  async modelConfigs(@Args() args: GetModelConfigsArgs): Promise<ModelConfigModel[]> {
    const result = await this.modelConfigService.findAll({
      page: args.page,
      limit: args.limit,
      projectId: args.projectId,
    });
    return result.configs;
  }

  @Query(() => ModelConfigModel, { nullable: true })
  async modelConfig(@Args() args: GetModelConfigArgs): Promise<ModelConfigModel | null> {
    return this.modelConfigService.findById(args.id);
  }

  @Query(() => ModelConfigModel, { nullable: true })
  async defaultModelConfig(
    @Args('projectId', { type: () => ID, nullable: true }) projectId?: string,
  ): Promise<ModelConfigModel | null> {
    return this.modelConfigService.findDefault(projectId);
  }

  @Mutation(() => ModelConfigModel)
  async updateModelConfig(
    @Args('input') input: UpdateModelConfigInput,
  ): Promise<ModelConfigModel> {
    return this.modelConfigService.update(input.id, input);
  }

  @Mutation(() => ModelConfigModel)
  async setDefaultModelConfig(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<ModelConfigModel> {
    return this.modelConfigService.setAsDefault(id);
  }

  @Mutation(() => Boolean)
  async deleteModelConfig(@Args('id') id: string): Promise<boolean> {
    await this.modelConfigService.delete(id);
    return true;
  }
}
