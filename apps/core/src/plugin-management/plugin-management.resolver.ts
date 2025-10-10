import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { PluginManagementService } from './plugin-management.service';
import { PluginRegistryCreateInput } from 'prisma/@generated';
import { PluginRegistry } from 'prisma/@generated';
import { HealthCheckResult } from './dto/health-check-result.dto';
import { GatewaySubgraph } from './dto/gateway-subgraph.dto';

@Resolver()
export class PluginManagementResolver {
  constructor(private readonly pluginsManagementService: PluginManagementService) {}

  @Mutation(() => PluginRegistry)
  async registerPlugin(
    @Args('input') input: PluginRegistryCreateInput,
  ) {
    return this.pluginsManagementService.register(input);
  }

  @Mutation(() => PluginRegistry)
  async unregisterPlugin(
    @Args('id', { type: () => String, nullable: true }) id?: string,
    @Args('name', { type: () => String, nullable: true }) name?: string,
  ) {
    return this.pluginsManagementService.unregister({ id, name });
  }

  @Mutation(() => PluginRegistry)
  async updatePlugin(
    @Args('id', { type: () => String, nullable: true }) id?: string,
    @Args('name', { type: () => String, nullable: true }) name?: string,
    @Args('input') input?: PluginRegistryCreateInput,
  ) {
    if (!input) {
      throw new Error('Input is required');
    }
    return this.pluginsManagementService.update({ id, name }, input);
  }

  @Mutation(() => PluginRegistry)
  async updatePluginStatus(
    @Args('id', { type: () => String, nullable: true }) id?: string,
    @Args('name', { type: () => String, nullable: true }) name?: string,
    @Args('status') status?: string,
  ) {
    if (!status) {
      throw new Error('Status is required');
    }
    return this.pluginsManagementService.updateStatus({ id, name }, status);
  }

  @Query(() => [PluginRegistry])
  async getPlugins() {
    return this.pluginsManagementService.findAll();
  }

  @Query(() => [PluginRegistry])
  async getActivePlugins() {
    return this.pluginsManagementService.findActiveServices();
  }

  @Query(() => PluginRegistry)
  async getPlugin(
    @Args('id', { type: () => String, nullable: true }) id?: string,
    @Args('name', { type: () => String, nullable: true }) name?: string,
  ) {
    return this.pluginsManagementService.findOne({ id, name });
  }

  @Query(() => Boolean)
  async checkPluginHealth(
    @Args('id', { type: () => String, nullable: true }) id?: string,
    @Args('name', { type: () => String, nullable: true }) name?: string,
  ) {
    return this.pluginsManagementService.healthCheck({ id, name });
  }

  @Query(() => [HealthCheckResult], {nullable: 'itemsAndList'})
  async checkAllPluginsHealth() {

    return this.pluginsManagementService.healthCheckAll();

  }

  @Query(() => [GatewaySubgraph])
  async getGatewaySubgraphs() {
    return this.pluginsManagementService.getGatewaySubgraphs();
  }
}