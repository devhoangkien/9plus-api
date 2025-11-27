import { TestCase } from '../entities';
import { TestType } from '../entities/test-enums';

/**
 * Test Case Repository Interface
 */
export interface TestCaseRepository {
  findById(id: string): Promise<TestCase | null>;
  findByProjectId(projectId: string, options?: { page?: number; limit?: number; type?: TestType; isActive?: boolean }): Promise<TestCase[]>;
  findByIds(ids: string[]): Promise<TestCase[]>;
  countByProjectId(projectId: string): Promise<number>;
  save(testCase: TestCase): Promise<TestCase>;
  delete(id: string): Promise<void>;
}
