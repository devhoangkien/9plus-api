import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ISagaStateStore } from './interfaces';

interface StoredState {
  state: any;
  savedAt: Date;
  expiresAt: Date;
}

/**
 * In-memory implementation of Saga state store
 * For production, integrate with Redis, MongoDB, or other persistent storage
 */
@Injectable()
export class SagaStateStore implements ISagaStateStore, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SagaStateStore.name);
  private readonly store: Map<string, StoredState> = new Map();
  private readonly TTL_MS = 3600000; // 1 hour TTL
  private cleanupInterval?: NodeJS.Timeout;

  onModuleInit() {
    // Start cleanup task to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredStates();
    }, 300000); // Clean up every 5 minutes
  }

  /**
   * Clean up expired saga states
   */
  private cleanupExpiredStates(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sagaId, stored] of this.store.entries()) {
      if (stored.expiresAt < now) {
        this.store.delete(sagaId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired saga states`);
    }
  }

  /**
   * Save Saga state
   */
  async save(sagaId: string, state: any): Promise<void> {
    this.logger.debug(`Saving state for saga ${sagaId}`);
    const now = new Date();
    this.store.set(sagaId, {
      state: {
        ...state,
        savedAt: now,
      },
      savedAt: now,
      expiresAt: new Date(now.getTime() + this.TTL_MS),
    });
  }

  /**
   * Get Saga state
   */
  async get(sagaId: string): Promise<any | null> {
    const stored = this.store.get(sagaId);
    if (!stored) {
      return null;
    }

    // Check if expired
    if (stored.expiresAt < new Date()) {
      this.store.delete(sagaId);
      return null;
    }

    return stored.state;
  }

  /**
   * Update Saga state
   */
  async update(sagaId: string, state: any): Promise<void> {
    const stored = this.store.get(sagaId);
    if (!stored) {
      this.logger.warn(`No existing state found for saga ${sagaId}`);
      await this.save(sagaId, state);
      return;
    }

    const now = new Date();
    this.store.set(sagaId, {
      state: {
        ...stored.state,
        ...state,
        updatedAt: now,
      },
      savedAt: stored.savedAt,
      expiresAt: new Date(now.getTime() + this.TTL_MS), // Refresh TTL on update
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
    const result = new Map<string, any>();
    for (const [sagaId, stored] of this.store.entries()) {
      result.set(sagaId, stored.state);
    }
    return result;
  }

  /**
   * Clear all states (for testing/cleanup)
   */
  async clear(): Promise<void> {
    this.store.clear();
    this.logger.debug('Cleared all saga states');
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
