import { Project } from '../entities';

/**
 * Project Repository Interface
 */
export interface ProjectRepository {
  findById(id: string): Promise<Project | null>;
  findAll(options?: { page?: number; limit?: number }): Promise<Project[]>;
  count(): Promise<number>;
  save(project: Project): Promise<Project>;
  delete(id: string): Promise<void>;
}
