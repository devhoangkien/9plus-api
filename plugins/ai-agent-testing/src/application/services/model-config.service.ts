import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ModelConfig, ModelProvider, ModelParameters } from '../../domain/entities';
import { ModelConfigRepository, ResolveModelOptions } from '../../domain/repositories';

/**
 * Model Config Service - Application layer service for AI model configuration operations
 * Also implements ModelConfigRepository interface for use with LlmClient
 */
@Injectable()
export class ModelConfigService implements ModelConfigRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new model configuration
   */
  async create(input: {
    name: string;
    provider: ModelProvider;
    modelName: string;
    apiBaseUrl: string;
    apiKeyRef: string;
    parameters?: ModelParameters;
    isDefault?: boolean;
    projectId?: string;
    createdBy?: string;
  }): Promise<ModelConfig> {
    // If setting as default, unset existing default for same scope
    if (input.isDefault) {
      await this.unsetDefaultForScope(input.projectId);
    }

    const created = await this.prisma.modelConfig.create({
      data: {
        name: input.name,
        provider: input.provider,
        modelName: input.modelName,
        apiBaseUrl: input.apiBaseUrl,
        apiKeyRef: input.apiKeyRef,
        parameters: input.parameters,
        isDefault: input.isDefault || false,
        projectId: input.projectId,
        createdBy: input.createdBy,
      },
    });

    return this.mapToEntity(created);
  }

  /**
   * Find model config by ID
   */
  async findById(id: string): Promise<ModelConfig | null> {
    const config = await this.prisma.modelConfig.findUnique({
      where: { id },
    });

    return config ? this.mapToEntity(config) : null;
  }

  /**
   * Get model config by ID or throw
   */
  async getById(id: string): Promise<ModelConfig> {
    const config = await this.findById(id);
    if (!config) {
      throw new NotFoundException(`Model configuration with ID ${id} not found`);
    }
    return config;
  }

  /**
   * Find model configs by project ID (null = global)
   */
  async findByProjectId(projectId?: string): Promise<ModelConfig[]> {
    const configs = await this.prisma.modelConfig.findMany({
      where: projectId ? { projectId } : { projectId: null },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return configs.map((c) => this.mapToEntity(c));
  }

  /**
   * Find model configs by provider
   */
  async findByProvider(provider: ModelProvider): Promise<ModelConfig[]> {
    const configs = await this.prisma.modelConfig.findMany({
      where: { provider, isActive: true },
      orderBy: { name: 'asc' },
    });

    return configs.map((c) => this.mapToEntity(c));
  }

  /**
   * Find all model configs with pagination
   */
  async findAll(options?: {
    page?: number;
    limit?: number;
    projectId?: string;
  }): Promise<{ configs: ModelConfig[]; total: number; hasMore: boolean }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (options?.projectId !== undefined) {
      where.projectId = options.projectId || null;
    }

    const [configs, total] = await Promise.all([
      this.prisma.modelConfig.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.modelConfig.count({ where }),
    ]);

    return {
      configs: configs.map((c) => this.mapToEntity(c)),
      total,
      hasMore: skip + configs.length < total,
    };
  }

  /**
   * Find default model for a project or global
   */
  async findDefault(projectId?: string): Promise<ModelConfig | null> {
    // First try project-specific default
    if (projectId) {
      const projectDefault = await this.prisma.modelConfig.findFirst({
        where: { projectId, isDefault: true, isActive: true },
      });
      if (projectDefault) {
        return this.mapToEntity(projectDefault);
      }
    }

    // Fall back to global default
    const globalDefault = await this.prisma.modelConfig.findFirst({
      where: { projectId: null, isDefault: true, isActive: true },
    });

    return globalDefault ? this.mapToEntity(globalDefault) : null;
  }

  /**
   * Resolve model based on options
   * Priority: modelId > project default > global default
   */
  async resolveModel(options: ResolveModelOptions): Promise<ModelConfig | null> {
    // If modelId is specified, use it directly
    if (options.modelId) {
      const config = await this.findById(options.modelId);
      return config && config.isActive ? config : null;
    }

    // Otherwise resolve default
    return this.findDefault(options.projectId);
  }

  /**
   * Update a model configuration
   */
  async update(
    id: string,
    input: {
      name?: string;
      modelName?: string;
      apiBaseUrl?: string;
      apiKeyRef?: string;
      parameters?: ModelParameters;
      isActive?: boolean;
    },
  ): Promise<ModelConfig> {
    const updated = await this.prisma.modelConfig.update({
      where: { id },
      data: input,
    });

    return this.mapToEntity(updated);
  }

  /**
   * Set a model as default for its scope
   */
  async setAsDefault(id: string): Promise<ModelConfig> {
    const config = await this.getById(id);
    
    // Unset existing default for same scope
    await this.unsetDefaultForScope(config.projectId);

    // Set this one as default
    const updated = await this.prisma.modelConfig.update({
      where: { id },
      data: { isDefault: true },
    });

    return this.mapToEntity(updated);
  }

  /**
   * Save model config (for repository interface)
   */
  async save(modelConfig: ModelConfig): Promise<ModelConfig> {
    const saved = await this.prisma.modelConfig.upsert({
      where: { id: modelConfig.id },
      create: {
        id: modelConfig.id,
        name: modelConfig.name,
        provider: modelConfig.provider,
        modelName: modelConfig.modelName,
        apiBaseUrl: modelConfig.apiBaseUrl,
        apiKeyRef: modelConfig.apiKeyRef,
        parameters: modelConfig.parameters,
        isDefault: modelConfig.isDefault,
        isActive: modelConfig.isActive,
        projectId: modelConfig.projectId,
        createdBy: modelConfig.createdBy,
      },
      update: {
        name: modelConfig.name,
        modelName: modelConfig.modelName,
        apiBaseUrl: modelConfig.apiBaseUrl,
        apiKeyRef: modelConfig.apiKeyRef,
        parameters: modelConfig.parameters,
        isDefault: modelConfig.isDefault,
        isActive: modelConfig.isActive,
      },
    });

    return this.mapToEntity(saved);
  }

  /**
   * Delete a model configuration
   */
  async delete(id: string): Promise<void> {
    await this.prisma.modelConfig.delete({
      where: { id },
    });
  }

  /**
   * Unset default for a given scope
   */
  private async unsetDefaultForScope(projectId?: string | null): Promise<void> {
    await this.prisma.modelConfig.updateMany({
      where: { projectId: projectId || null, isDefault: true },
      data: { isDefault: false },
    });
  }

  /**
   * Map Prisma model to domain entity
   */
  private mapToEntity(data: any): ModelConfig {
    return new ModelConfig(
      data.id,
      data.name,
      data.provider as ModelProvider,
      data.modelName,
      data.apiBaseUrl,
      data.apiKeyRef,
      data.parameters as ModelParameters | null,
      data.isDefault,
      data.isActive,
      data.projectId,
      data.createdAt,
      data.updatedAt,
      data.createdBy,
    );
  }
}
