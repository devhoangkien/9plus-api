import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LRUCache } from 'lru-cache';

@Injectable()
export class GatewayCacheService {
  private readonly logger = new Logger(GatewayCacheService.name);
  private readonly responseCache: LRUCache<string, any>;

  constructor(private readonly configService: ConfigService) {
    const cacheConfig = this.getCacheConfig();
    this.responseCache = new LRUCache<string, any>(cacheConfig);
    
    this.logger.log(
      `🗄️ Cache initialized with max: ${cacheConfig.max} entries, TTL: ${cacheConfig.ttl}ms`
    );
  }

  private getCacheConfig() {
    return {
      max: parseInt(this.configService.get<string>('CACHE_MAX_SIZE') || '1000', 10),
      ttl: parseInt(this.configService.get<string>('CACHE_TTL_MINUTES') || '5', 10) * 60 * 1000,
    };
  }

  /**
   * Get cached response if available
   */
  get(key: string): any {
    return this.responseCache.get(key);
  }

  /**
   * Set cache entry
   */
  set(key: string, value: any): void {
    this.responseCache.set(key, value);
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.responseCache.has(key);
  }

  /**
   * Generate cache key for GraphQL operations
   */
  generateCacheKey(query: string, variables: any, operationName?: string): string {
    return JSON.stringify({ query, variables, operationName });
  }

  /**
   * Check if operation should be cached (only queries, not mutations)
   */
  shouldCache(query: string): boolean {
    return !query.includes('mutation') && !query.includes('subscription');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.responseCache.size,
      maxSize: this.responseCache.max,
      ttl: this.responseCache.ttl,
      calculatedSize: this.responseCache.calculatedSize,
    };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.responseCache.clear();
    this.logger.log('🗑️ Cache cleared');
  }

  /**
   * Get cache instance for direct access if needed
   */
  getCacheInstance(): LRUCache<string, any> {
    return this.responseCache;
  }
}