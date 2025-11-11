import { Injectable, Logger } from '@nestjs/common';
import { ISagaStateStore } from './saga.interface';

/**
 * In-memory implementation of Saga state store
 * For production, integrate with Redis, MongoDB, or other persistent storage
 */
@Injectable()
export class SagaStateStore implements ISagaStateStore {
  private readonly logger = new Logger(SagaStateStore.name);
  private readonly store: Map<string, any> = new Map();

  /**
   * Save Saga state
   */
  async save(sagaId: string, state: any): Promise<void> {
    this.logger.debug(`Saving state for saga ${sagaId}`);
    this.store.set(sagaId, {
      ...state,
      savedAt: new Date(),
    });
  }

  /**
   * Get Saga state
   */
  async get(sagaId: string): Promise<any | null> {
    return this.store.get(sagaId) || null;
  }

  /**
   * Update Saga state
   */
  async update(sagaId: string, state: any): Promise<void> {
    const existingState = this.store.get(sagaId);
    if (!existingState) {
      this.logger.warn(`No existing state found for saga ${sagaId}`);
      await this.save(sagaId, state);
      return;
    }

    this.store.set(sagaId, {
      ...existingState,
      ...state,
      updatedAt: new Date(),
    });
    
    this.logger.debug(`Updated state for saga ${sagaId}`);
  }

  /**
   * Delete Saga state
   */
  async delete(sagaId: string): Promise<void> {
    this.store.delete(sagaId);
    this.logger.debug(`Deleted state for saga ${sagaId}`);
  }

  /**
   * Get all Saga states (for monitoring/debugging)
   */
  async getAll(): Promise<Map<string, any>> {
    return new Map(this.store);
  }

  /**
   * Clear all states (for testing/cleanup)
   */
  async clear(): Promise<void> {
    this.store.clear();
    this.logger.debug('Cleared all saga states');
  }
}
