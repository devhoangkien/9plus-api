import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ProjectService } from '../../application/services';
import { CreateProjectInput, UpdateProjectInput } from '../inputs';
import { GetProjectArgs, GetProjectsArgs } from '../dto/args.dto';
import { ProjectModel } from '../models';

@Resolver(() => ProjectModel)
export class ProjectResolver {
  constructor(private readonly projectService: ProjectService) {}

  @Mutation(() => ProjectModel)
  async createProject(
    @Args('input') input: CreateProjectInput,
  ): Promise<ProjectModel> {
    return this.projectService.create(input);
  }

  @Query(() => [ProjectModel])
  async projects(@Args() args: GetProjectsArgs): Promise<ProjectModel[]> {
    const result = await this.projectService.findAll({
      page: args.page,
      limit: args.limit,
    });
    return result.projects;
  }

  @Query(() => ProjectModel, { nullable: true })
  async project(@Args() args: GetProjectArgs): Promise<ProjectModel | null> {
    return this.projectService.findById(args.id);
  }

  @Mutation(() => ProjectModel)
  async updateProject(
    @Args('input') input: UpdateProjectInput,
  ): Promise<ProjectModel> {
    return this.projectService.update(input.id, input);
  }

  @Mutation(() => Boolean)
  async deleteProject(@Args('id') id: string): Promise<boolean> {
    return this.projectService.delete(id);
  }
}
