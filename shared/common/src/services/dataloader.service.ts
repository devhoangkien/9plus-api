import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';

/**
 * DataLoaderService
 * 
 * Provides DataLoader instances for batching and caching database queries.
 * This service is request-scoped to ensure each request gets its own DataLoader instances.
 */
@Injectable({ scope: Scope.REQUEST })
export class DataLoaderService {
  private loaders: Map<string, DataLoader<any, any>> = new Map();

  /**
   * Get or create a DataLoader instance
   * @param key - Unique identifier for the DataLoader
   * @param batchFn - Function to batch load data
   * @param options - DataLoader options
   */
  getLoader<K, V>(
    key: string,
    batchFn: (keys: readonly K[]) => Promise<(V | Error)[]>,
    options?: DataLoader.Options<K, V>,
  ): DataLoader<K, V> {
    if (!this.loaders.has(key)) {
      this.loaders.set(key, new DataLoader(batchFn, options));
    }
    return this.loaders.get(key) as DataLoader<K, V>;
  }

  /**
   * Clear all loaders (useful for testing)
   */
  clearAll(): void {
    this.loaders.forEach(loader => loader.clearAll());
    this.loaders.clear();
  }

  /**
   * Clear a specific loader
   * @param key - Unique identifier for the DataLoader
   */
  clear(key: string): void {
    const loader = this.loaders.get(key);
    if (loader) {
      loader.clearAll();
    }
  }
}
