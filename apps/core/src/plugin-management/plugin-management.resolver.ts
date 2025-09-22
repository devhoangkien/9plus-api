import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { PluginsManagementService } from './plugin-management.service';

// Input types for GraphQL
class RegisterPluginInput {
  name: string;
  displayName?: string;
  description?: string;
  url: string;
  version?: string;
  healthCheck?: string;
  metadata?: any;
  dependencies?: string[];
  tags?: string[];
  isRequired?: boolean;
}

class UpdatePluginInput {
  displayName?: string;
  description?: string;
  url?: string;
  version?: string;
  healthCheck?: string;
  metadata?: any;
  dependencies?: string[];
  tags?: string[];
  isRequired?: boolean;
}

// Output types for GraphQL
class Plugin {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  url: string;
  version: string;
  status: string;
  healthCheck?: string;
  metadata?: any;
  dependencies: string[];
  tags: string[];
  isRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastHealthCheck?: Date;
}

class HealthCheckResult {
  plugin: string;
  healthy: boolean;
}

class GatewaySubgraph {
  name: string;
  url: string;
}

@Resolver()
export class PluginsManagementResolver {
  constructor(private readonly pluginsManagementService: PluginsManagementService) {}

  @Mutation(() => Plugin)
  async registerPlugin(
    @Args('input') input: RegisterPluginInput,
  ) {
    return this.pluginsManagementService.register(input);
  }

  @Mutation(() => Plugin)
  async unregisterPlugin(
    @Args('id', { type: () => String, nullable: true }) id?: string,
    @Args('name', { type: () => String, nullable: true }) name?: string,
  ) {
    return this.pluginsManagementService.unregister({ id, name });
  }

  @Mutation(() => Plugin)
  async updatePlugin(
    @Args('id', { type: () => String, nullable: true }) id?: string,
    @Args('name', { type: () => String, nullable: true }) name?: string,
    @Args('input') input?: UpdatePluginInput,
  ) {
    if (!input) {
      throw new Error('Input is required');
    }
    return this.pluginsManagementService.update({ id, name }, input);
  }

  @Mutation(() => Plugin)
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

  @Query(() => [Plugin])
  async getPlugins() {
    return this.pluginsManagementService.findAll();
  }

  @Query(() => [Plugin])
  async getActivePlugins() {
    return this.pluginsManagementService.findActiveServices();
  }

  @Query(() => Plugin)
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

  @Query(() => [HealthCheckResult])
  async checkAllPluginsHealth() {
    return this.pluginsManagementService.healthCheckAll();
  }

  @Query(() => [GatewaySubgraph])
  async getGatewaySubgraphs() {
    return this.pluginsManagementService.getGatewaySubgraphs();
  }
}