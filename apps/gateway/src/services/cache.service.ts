import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Cache Service using Redis
 * Provides caching layer for gRPC responses to reduce latency
 */
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
    private redis: Redis;
    private readonly DEFAULT_TTL = 300; // 5 minutes

    constructor(private readonly configService: ConfigService) { }

    onModuleInit() {
        const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
        const port = this.configService.get<number>('REDIS_PORT') || 6379;
        const password = this.configService.get<string>('REDIS_PASSWORD');

        this.redis = new Redis({
            host,
            port,
            password: password || undefined,
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
        });

        this.redis.on('connect', () => {
            console.log('[CacheService] Connected to Redis');
        });

        this.redis.on('error', (error) => {
            console.error('[CacheService] Redis error:', error);
        });
    }

    onModuleDestroy() {
        this.redis?.disconnect();
    }

    /**
     * Get value from cache
     * @param key Cache key
     * @returns Cached value or null
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.redis.get(key);
            if (value) {
                return JSON.parse(value);
            }
            return null;
        } catch (error) {
            console.error('[CacheService] Get error:', error);
            return null;
        }
    }

    /**
     * Set value in cache
     * @param key Cache key
     * @param value Value to cache
     * @param ttl Time to live in seconds (default: 300)
     */
    async set<T>(key: string, value: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
        try {
            await this.redis.setex(key, ttl, JSON.stringify(value));
        } catch (error) {
            console.error('[CacheService] Set error:', error);
        }
    }

    /**
     * Delete value from cache
     * @param key Cache key
     */
    async delete(key: string): Promise<void> {
        try {
            await this.redis.del(key);
        } catch (error) {
            console.error('[CacheService] Delete error:', error);
        }
    }

    /**
     * Delete all keys matching pattern
     * @param pattern Key pattern (e.g., "roles:*")
     */
    async deletePattern(pattern: string): Promise<void> {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        } catch (error) {
            console.error('[CacheService] DeletePattern error:', error);
        }
    }

    /**
     * Check if key exists in cache
     * @param key Cache key
     * @returns True if key exists
     */
    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.redis.exists(key);
            return result === 1;
        } catch (error) {
            console.error('[CacheService] Exists error:', error);
            return false;
        }
    }

    /**
     * Get or set value (cache-aside pattern)
     * @param key Cache key
     * @param fetchFn Function to fetch value if not in cache
     * @param ttl Time to live in seconds
     * @returns Cached or fetched value
     */
    async getOrSet<T>(
        key: string,
        fetchFn: () => Promise<T>,
        ttl: number = this.DEFAULT_TTL,
    ): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        const value = await fetchFn();
        await this.set(key, value, ttl);
        return value;
    }
}
