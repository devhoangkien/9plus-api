import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Project } from '../../domain/entities';

/**
 * Project Service - Application layer service for project operations
 */
@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new project
   */
  async create(input: {
    name: string;
    description?: string;
    settings?: Record<string, any>;
    createdBy?: string;
  }): Promise<Project> {
    const created = await this.prisma.project.create({
      data: {
        name: input.name,
        description: input.description,
        settings: input.settings,
        createdBy: input.createdBy,
      },
    });

    return this.mapToEntity(created);
  }

  /**
   * Find project by ID
   */
  async findById(id: string): Promise<Project | null> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    return project ? this.mapToEntity(project) : null;
  }

  /**
   * Get project by ID or throw
   */
  async getById(id: string): Promise<Project> {
    const project = await this.findById(id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  /**
   * Find all projects with pagination
   */
  async findAll(options?: {
    page?: number;
    limit?: number;
  }): Promise<{ projects: Project[]; total: number; hasMore: boolean }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.project.count(),
    ]);

    return {
      projects: projects.map((p) => this.mapToEntity(p)),
      total,
      hasMore: skip + projects.length < total,
    };
  }

  /**
   * Update a project
   */
  async update(
    id: string,
    input: {
      name?: string;
      description?: string;
      defaultModelId?: string;
      settings?: Record<string, any>;
    },
  ): Promise<Project> {
    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        defaultModelId: input.defaultModelId,
        settings: input.settings,
      },
    });

    return this.mapToEntity(updated);
  }

  /**
   * Delete a project
   */
  async delete(id: string): Promise<boolean> {
    await this.prisma.project.delete({
      where: { id },
    });
    return true;
  }

  /**
   * Map Prisma model to domain entity
   */
  private mapToEntity(data: any): Project {
    return new Project(
      data.id,
      data.name,
      data.description,
      data.defaultModelId,
      data.settings,
      data.createdAt,
      data.updatedAt,
      data.createdBy,
    );
  }
}
