import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TestCase, TestStep, TestType } from '../../domain/entities';

/**
 * Test Case Service - Application layer service for test case operations
 */
@Injectable()
export class TestCaseService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new test case
   */
  async create(input: {
    projectId: string;
    name: string;
    description?: string;
    type: TestType;
    steps?: TestStep[];
    script?: string;
    generatedBy?: string;
    originalPrompt?: string;
    createdBy?: string;
  }): Promise<TestCase> {
    const created = await this.prisma.testCase.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        description: input.description,
        type: input.type,
        steps: input.steps as any,
        script: input.script,
        generatedBy: input.generatedBy,
        originalPrompt: input.originalPrompt,
        createdBy: input.createdBy,
      },
    });

    return this.mapToEntity(created);
  }

  /**
   * Find test case by ID
   */
  async findById(id: string): Promise<TestCase | null> {
    const testCase = await this.prisma.testCase.findUnique({
      where: { id },
    });

    return testCase ? this.mapToEntity(testCase) : null;
  }

  /**
   * Get test case by ID or throw
   */
  async getById(id: string): Promise<TestCase> {
    const testCase = await this.findById(id);
    if (!testCase) {
      throw new NotFoundException(`Test case with ID ${id} not found`);
    }
    return testCase;
  }

  /**
   * Find test cases by project ID
   */
  async findByProjectId(
    projectId: string,
    options?: {
      page?: number;
      limit?: number;
      type?: TestType;
      isActive?: boolean;
    },
  ): Promise<{ testCases: TestCase[]; total: number; hasMore: boolean }> {
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = { projectId };
    if (options?.type) where.type = options.type;
    if (options?.isActive !== undefined) where.isActive = options.isActive;

    const [testCases, total] = await Promise.all([
      this.prisma.testCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.testCase.count({ where }),
    ]);

    return {
      testCases: testCases.map((tc) => this.mapToEntity(tc)),
      total,
      hasMore: skip + testCases.length < total,
    };
  }

  /**
   * Find test cases by IDs
   */
  async findByIds(ids: string[]): Promise<TestCase[]> {
    const testCases = await this.prisma.testCase.findMany({
      where: { id: { in: ids } },
    });

    return testCases.map((tc) => this.mapToEntity(tc));
  }

  /**
   * Update a test case
   */
  async update(
    id: string,
    input: {
      name?: string;
      description?: string;
      steps?: TestStep[];
      script?: string;
      isActive?: boolean;
    },
  ): Promise<TestCase> {
    const updated = await this.prisma.testCase.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        steps: input.steps as any,
        script: input.script,
        isActive: input.isActive,
      },
    });

    return this.mapToEntity(updated);
  }

  /**
   * Delete a test case
   */
  async delete(id: string): Promise<boolean> {
    await this.prisma.testCase.delete({
      where: { id },
    });
    return true;
  }

  /**
   * Map Prisma model to domain entity
   */
  private mapToEntity(data: any): TestCase {
    return new TestCase(
      data.id,
      data.projectId,
      data.name,
      data.description,
      data.type as TestType,
      data.steps as TestStep[] | null,
      data.script,
      data.generatedBy,
      data.originalPrompt,
      data.isActive,
      data.createdAt,
      data.updatedAt,
      data.createdBy,
    );
  }
}
