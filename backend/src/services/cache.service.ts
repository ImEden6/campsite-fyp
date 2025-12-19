// Cache Service using Redis

import Redis from 'ioredis';
import crypto from 'crypto';
import { config } from '@/config';
import logger from '@/utils/logger';

export class CacheService {
  private redis: Redis;
  private isConnected: boolean = false;
  private serviceName: string = 'campsite';

  constructor() {
    const redisOptions: any = {
      host: this.extractHost(config.redis.url),
      port: this.extractPort(config.redis.url),
      maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
      lazyConnect: true,
    };

    if (config.redis.password) {
      redisOptions.password = config.redis.password;
    }

    this.redis = new Redis(redisOptions);

    this.setupEventHandlers();
  }

  // ============================================================
  // Key Namespacing: <env>:<service>:<resource>
  // ============================================================

  private getNamespacedKey(resource: string): string {
    const env = config.server.nodeEnv;
    return `${env}:${this.serviceName}:${resource}`;
  }

  // Hash query params for cache key (prevents key pollution)
  static hashQuery(query: object): string {
    return crypto.createHash('md5').update(JSON.stringify(query)).digest('hex').slice(0, 8);
  }

  // Feature flag check
  private isCachingEnabled(): boolean {
    return config.features?.enableCaching !== false;
  }

  // Extract host from Redis URL
  private extractHost(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return 'localhost';
    }
  }

  // Extract port from Redis URL
  private extractPort(url: string): number {
    try {
      const parsed = new URL(url);
      return parseInt(parsed.port) || 6379;
    } catch {
      return 6379;
    }
  }

  // Setup Redis event handlers
  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      logger.info('Cache service connected to Redis');
      this.isConnected = true;
    });

    this.redis.on('ready', () => {
      logger.info('Cache service ready');
    });

    this.redis.on('error', (error) => {
      logger.error('Cache service error', error);
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      logger.warn('Cache service connection closed');
      this.isConnected = false;
    });

    this.redis.on('reconnecting', () => {
      logger.info('Cache service reconnecting');
    });
  }

  // Connect to Redis
  async connect(): Promise<void> {
    try {
      await this.redis.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis', error);
      throw error;
    }
  }

  // Disconnect from Redis
  async disconnect(): Promise<void> {
    try {
      await this.redis.disconnect();
      this.isConnected = false;
    } catch (error) {
      logger.error('Failed to disconnect from Redis', error);
    }
  }

  // Check if Redis is connected
  isReady(): boolean {
    return this.isConnected && this.redis.status === 'ready';
  }

  // Set a value in cache
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      if (!this.isReady()) {
        logger.warn('Cache service not ready, skipping set operation');
        return;
      }

      const serializedValue = JSON.stringify(value);

      if (ttl) {
        await this.redis.setex(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }

      logger.cacheSet(key, ttl || 0);
    } catch (error) {
      logger.error('Cache set operation failed', error, { key, ttl });
    }
  }

  // Get a value from cache
  async get<T = any>(key: string): Promise<T | null> {
    try {
      if (!this.isReady()) {
        logger.warn('Cache service not ready, skipping get operation');
        return null;
      }

      const value = await this.redis.get(key);

      if (value === null) {
        logger.cacheMiss(key);
        return null;
      }

      logger.cacheHit(key);
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Cache get operation failed', error, { key });
      return null;
    }
  }

  // Delete a value from cache
  async delete(key: string): Promise<void> {
    try {
      if (!this.isReady()) {
        logger.warn('Cache service not ready, skipping delete operation');
        return;
      }

      await this.redis.del(key);
      logger.debug('Cache key deleted', { key });
    } catch (error) {
      logger.error('Cache delete operation failed', error, { key });
    }
  }

  // Delete multiple keys
  async deleteMany(keys: string[]): Promise<void> {
    try {
      if (!this.isReady() || keys.length === 0) {
        return;
      }

      await this.redis.del(...keys);
      logger.debug('Cache keys deleted', { keys });
    } catch (error) {
      logger.error('Cache delete many operation failed', error, { keys });
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isReady()) {
        return false;
      }

      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists operation failed', error, { key });
      return false;
    }
  }

  // Set expiration time for a key
  async expire(key: string, ttl: number): Promise<void> {
    try {
      if (!this.isReady()) {
        return;
      }

      await this.redis.expire(key, ttl);
      logger.debug('Cache key expiration set', { key, ttl });
    } catch (error) {
      logger.error('Cache expire operation failed', error, { key, ttl });
    }
  }

  // Get remaining TTL for a key
  async ttl(key: string): Promise<number> {
    try {
      if (!this.isReady()) {
        return -1;
      }

      return await this.redis.ttl(key);
    } catch (error) {
      logger.error('Cache TTL operation failed', error, { key });
      return -1;
    }
  }

  // Increment a numeric value
  async increment(key: string, by: number = 1): Promise<number> {
    try {
      if (!this.isReady()) {
        return 0;
      }

      return await this.redis.incrby(key, by);
    } catch (error) {
      logger.error('Cache increment operation failed', error, { key, by });
      return 0;
    }
  }

  // Decrement a numeric value
  async decrement(key: string, by: number = 1): Promise<number> {
    try {
      if (!this.isReady()) {
        return 0;
      }

      return await this.redis.decrby(key, by);
    } catch (error) {
      logger.error('Cache decrement operation failed', error, { key, by });
      return 0;
    }
  }

  // Get multiple values at once
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (!this.isReady() || keys.length === 0) {
        return [];
      }

      const values = await this.redis.mget(...keys);
      return values.map((value) => {
        if (value === null) {
          return null;
        }
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      logger.error('Cache mget operation failed', error, { keys });
      return [];
    }
  }

  // Set multiple values at once
  async mset(keyValuePairs: Record<string, any>, ttl?: number): Promise<void> {
    try {
      if (!this.isReady()) {
        return;
      }

      const serializedPairs: string[] = [];
      for (const [key, value] of Object.entries(keyValuePairs)) {
        serializedPairs.push(key, JSON.stringify(value));
      }

      await this.redis.mset(...serializedPairs);

      // Set TTL for all keys if specified
      if (ttl) {
        const keys = Object.keys(keyValuePairs);
        await Promise.all(keys.map(key => this.expire(key, ttl)));
      }

      logger.debug('Cache mset operation completed', {
        keyCount: Object.keys(keyValuePairs).length,
        ttl
      });
    } catch (error) {
      logger.error('Cache mset operation failed', error, { keyValuePairs, ttl });
    }
  }

  // Get keys matching a pattern
  async keys(pattern: string): Promise<string[]> {
    try {
      if (!this.isReady()) {
        return [];
      }

      return await this.redis.keys(pattern);
    } catch (error) {
      logger.error('Cache keys operation failed', error, { pattern });
      return [];
    }
  }

  // Clear all cache
  async flushAll(): Promise<void> {
    try {
      if (!this.isReady()) {
        return;
      }

      await this.redis.flushall();
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Cache flush operation failed', error);
    }
  }

  // Clear cache by pattern
  async flushPattern(pattern: string): Promise<void> {
    try {
      if (!this.isReady()) {
        return;
      }

      const keys = await this.keys(pattern);
      if (keys.length > 0) {
        await this.deleteMany(keys);
      }

      logger.info('Cache pattern cleared', { pattern, keyCount: keys.length });
    } catch (error) {
      logger.error('Cache flush pattern operation failed', error, { pattern });
    }
  }

  // Add to a set
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      if (!this.isReady()) {
        return 0;
      }

      return await this.redis.sadd(key, ...members);
    } catch (error) {
      logger.error('Cache sadd operation failed', error, { key, members });
      return 0;
    }
  }

  // Remove from a set
  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      if (!this.isReady()) {
        return 0;
      }

      return await this.redis.srem(key, ...members);
    } catch (error) {
      logger.error('Cache srem operation failed', error, { key, members });
      return 0;
    }
  }

  // Check if member exists in set
  async sismember(key: string, member: string): Promise<boolean> {
    try {
      if (!this.isReady()) {
        return false;
      }

      const result = await this.redis.sismember(key, member);
      return result === 1;
    } catch (error) {
      logger.error('Cache sismember operation failed', error, { key, member });
      return false;
    }
  }

  // Get all members of a set
  async smembers(key: string): Promise<string[]> {
    try {
      if (!this.isReady()) {
        return [];
      }

      return await this.redis.smembers(key);
    } catch (error) {
      logger.error('Cache smembers operation failed', error, { key });
      return [];
    }
  }

  // Add to a sorted set
  async zadd(key: string, score: number, member: string): Promise<number> {
    try {
      if (!this.isReady()) {
        return 0;
      }

      return await this.redis.zadd(key, score, member);
    } catch (error) {
      logger.error('Cache zadd operation failed', error, { key, score, member });
      return 0;
    }
  }

  // Get sorted set range
  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      if (!this.isReady()) {
        return [];
      }

      return await this.redis.zrange(key, start, stop);
    } catch (error) {
      logger.error('Cache zrange operation failed', error, { key, start, stop });
      return [];
    }
  }

  // Push to a list
  async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      if (!this.isReady()) {
        return 0;
      }

      return await this.redis.lpush(key, ...values);
    } catch (error) {
      logger.error('Cache lpush operation failed', error, { key, values });
      return 0;
    }
  }

  // Pop from a list
  async lpop(key: string): Promise<string | null> {
    try {
      if (!this.isReady()) {
        return null;
      }

      return await this.redis.lpop(key);
    } catch (error) {
      logger.error('Cache lpop operation failed', error, { key });
      return null;
    }
  }

  // Get list range
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      if (!this.isReady()) {
        return [];
      }

      return await this.redis.lrange(key, start, stop);
    } catch (error) {
      logger.error('Cache lrange operation failed', error, { key, start, stop });
      return [];
    }
  }

  // Hash operations
  async hset(key: string, field: string, value: any): Promise<void> {
    try {
      if (!this.isReady()) {
        return;
      }

      await this.redis.hset(key, field, JSON.stringify(value));
    } catch (error) {
      logger.error('Cache hset operation failed', error, { key, field });
    }
  }

  async hget<T = any>(key: string, field: string): Promise<T | null> {
    try {
      if (!this.isReady()) {
        return null;
      }

      const value = await this.redis.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache hget operation failed', error, { key, field });
      return null;
    }
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    try {
      if (!this.isReady()) {
        return 0;
      }

      return await this.redis.hdel(key, ...fields);
    } catch (error) {
      logger.error('Cache hdel operation failed', error, { key, fields });
      return 0;
    }
  }

  async hgetall<T = any>(key: string): Promise<Record<string, T>> {
    try {
      if (!this.isReady()) {
        return {};
      }

      const hash = await this.redis.hgetall(key);
      const result: Record<string, T> = {};

      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value as T;
        }
      }

      return result;
    } catch (error) {
      logger.error('Cache hgetall operation failed', error, { key });
      return {};
    }
  }

  // ============================================================
  // Cache Helper Methods
  // ============================================================

  /**
   * Get from cache with namespace prefix
   * Fail-open: returns null on any error
   */
  async safeGet<T>(resource: string): Promise<T | null> {
    if (!this.isCachingEnabled()) return null;

    try {
      const key = this.getNamespacedKey(resource);
      return await this.get<T>(key);
    } catch (error) {
      logger.warn('Cache safeGet failed, failing open', { resource, error });
      return null;
    }
  }

  /**
   * Set to cache with namespace prefix
   * Fail-open: silently fails on error
   */
  async safeSet(resource: string, value: any, ttl?: number): Promise<void> {
    if (!this.isCachingEnabled()) return;

    try {
      const key = this.getNamespacedKey(resource);
      await this.set(key, value, ttl);
    } catch (error) {
      logger.warn('Cache safeSet failed, failing open', { resource, error });
    }
  }

  /**
   * Delete from cache with namespace prefix
   */
  async safeDelete(resource: string): Promise<void> {
    if (!this.isCachingEnabled()) return;

    try {
      const key = this.getNamespacedKey(resource);
      await this.delete(key);
    } catch (error) {
      logger.warn('Cache safeDelete failed, failing open', { resource, error });
    }
  }

  /**
   * Flush all keys matching a pattern with namespace prefix
   */
  async safeFlushPattern(resourcePattern: string): Promise<void> {
    if (!this.isCachingEnabled()) return;

    try {
      const pattern = this.getNamespacedKey(resourcePattern);
      await this.flushPattern(pattern);
    } catch (error) {
      logger.warn('Cache safeFlushPattern failed, failing open', { resourcePattern, error });
    }
  }

  /**
   * Get with soft/hard TTL for stampede prevention
   * - softTtl: Time after which background refresh starts (seconds)
   * - hardTtl: Absolute cache expiry (seconds)
   * Returns stale data while refreshing in background
   */
  async getWithSoftTtl<T>(
    resource: string,
    fetchFn: () => Promise<T>,
    softTtlSeconds: number,
    hardTtlSeconds: number,
  ): Promise<T> {
    if (!this.isCachingEnabled()) {
      return await fetchFn();
    }

    const key = this.getNamespacedKey(resource);

    try {
      const cached = await this.get<{ data: T; softExpiry: number }>(key);

      if (cached) {
        if (Date.now() < cached.softExpiry) {
          // Fresh cache - log hit
          return cached.data;
        }
        // Soft-expired: return stale, refresh in background
        this.refreshInBackground(key, fetchFn, softTtlSeconds, hardTtlSeconds);
        return cached.data;
      }
    } catch (error) {
      logger.warn('Cache getWithSoftTtl read failed, fetching fresh', { resource, error });
    }

    // Cache miss - fetch and cache
    const fresh = await fetchFn();
    try {
      await this.set(key, { data: fresh, softExpiry: Date.now() + softTtlSeconds * 1000 }, hardTtlSeconds);
    } catch (error) {
      logger.warn('Cache getWithSoftTtl write failed, failing open', { resource, error });
    }
    return fresh;
  }

  /**
   * Background refresh for soft-expired cache entries
   */
  private async refreshInBackground<T>(
    key: string,
    fetchFn: () => Promise<T>,
    softTtlSeconds: number,
    hardTtlSeconds: number,
  ): Promise<void> {
    // Fire and forget - don't await
    fetchFn()
      .then((fresh) => {
        this.set(key, { data: fresh, softExpiry: Date.now() + softTtlSeconds * 1000 }, hardTtlSeconds);
      })
      .catch((error) => {
        logger.warn('Cache background refresh failed', { key, error });
      });
  }

  async remember<T>(key: string, callback: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const result = await callback();
    await this.set(key, result, ttl);
    return result;
  }

  async rememberForever<T>(key: string, callback: () => Promise<T>): Promise<T> {
    return this.remember(key, callback);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; latency?: number }> {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;

      return {
        status: 'healthy',
        latency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
      };
    }
  }
}

// Export singleton instance
export default new CacheService();
