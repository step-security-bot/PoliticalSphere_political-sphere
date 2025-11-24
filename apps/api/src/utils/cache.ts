import type { RedisOptions } from 'ioredis';
import Redis from 'ioredis';
import { getLogger } from '@political-sphere/shared';

/**
 * Type representing a Redis-like interface with essential caching operations.
 * This allows for dependency injection of Redis-compatible implementations.
 */
type RedisLike = Pick<Redis, 'get' | 'set' | 'setex' | 'del' | 'scan' | 'pipeline' | 'quit'>;

/**
 * Type representing possible Redis input configurations for cache initialization.
 * Can be a connection string, Redis instance, Redis options, or Redis-like object.
 */
type RedisInput = string | Redis | RedisOptions | RedisLike | undefined;

/**
 * Type guard to check if the input is a Redis instance.
 * @param input - The value to check
 * @returns True if the input is a Redis instance
 */
function isRedisInstance(input: unknown): input is Redis {
  return input instanceof Redis;
}

/**
 * Type guard to check if the input implements the RedisLike interface.
 * Verifies that all required Redis methods are present and are functions.
 * @param input - The value to check
 * @returns True if the input implements RedisLike interface
 */
function isRedisLike(input: unknown): input is RedisLike {
  if (!input || typeof input !== 'object') return false;
  const candidate = input as Partial<RedisLike>;
  return (
    typeof candidate.get === 'function' &&
    typeof candidate.set === 'function' &&
    typeof candidate.setex === 'function' &&
    typeof candidate.del === 'function' &&
    typeof candidate.scan === 'function' &&
    typeof candidate.pipeline === 'function' &&
    typeof candidate.quit === 'function'
  );
}

/**
 * Service for caching data using Redis or Redis-compatible backends.
 * Provides a unified interface for cache operations with metrics tracking
 * and flexible Redis configuration options.
 */
export class CacheService {
  private redis: RedisLike;
  private ownsConnection = false;
  private metrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    gets: 0,
    errors: 0,
  };

  /**
   * Creates a new CacheService instance with the provided Redis configuration.
   * Supports various Redis input types including connection strings, instances,
   * options objects, and Redis-like interfaces.
   *
   * @param redisInput - Redis configuration or instance to use for caching
   */
  constructor(redisInput?: RedisInput) {
    if (isRedisInstance(redisInput)) {
      this.redis = redisInput;
      this.ownsConnection = false;
      return;
    }

    if (isRedisLike(redisInput)) {
      this.redis = redisInput;
      this.ownsConnection = false;
      return;
    }

    if (typeof redisInput === 'string') {
      this.redis = new Redis(redisInput);
    } else if (redisInput && typeof redisInput === 'object') {
      this.redis = new Redis(redisInput);
    } else {
      const connection = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redis = new Redis(connection);
    }

    this.ownsConnection = true;
  }

  /**
   * Retrieves a value from the cache by key.
   * Automatically deserializes JSON data and handles different data types.
   * Tracks cache hits, misses, and errors for monitoring.
   *
   * @template T - The expected return type of the cached value
   * @param key - The cache key to retrieve
   * @returns The cached value if found, null if not found or on error
   */
  async get<T>(key: string): Promise<T | null> {
    this.metrics.gets++;
    try {
      const data = await this.redis.get(key);
      if (!data) {
        this.metrics.misses++;
        return null;
      }

      this.metrics.hits++;

      // Fast path for primitives and simple objects
      if (data.startsWith('"') && data.endsWith('"')) {
        // String
        return JSON.parse(data) as T;
      }
      if (/^-?\d+(\.\d+)?$/.test(data)) {
        // Number
        return (data.includes('.') ? parseFloat(data) : parseInt(data, 10)) as T;
      }
      if (data === 'true' || data === 'false') {
        // Boolean
        return (data === 'true') as T;
      }

      // Full JSON parse for complex objects
      return JSON.parse(data) as T;
    } catch (error) {
      this.metrics.errors++;
      const logger = getLogger({ service: 'api-cache' });
      logger.warn('Cache get error:', { error });
      return null;
    }
  }

  /**
   * Stores a value in the cache with optional time-to-live.
   * Automatically serializes the value to JSON and handles different data types efficiently.
   * If TTL is 0 or negative, the key is deleted instead of set.
   *
   * @param key - The cache key to store the value under
   * @param value - The value to cache (will be JSON serialized)
   * @param ttlSeconds - Optional time-to-live in seconds (uses SETEX if provided)
   */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    this.metrics.sets++;
    try {
      let data: string;

      // Optimize serialization for common types
      if (typeof value === 'string') {
        data = JSON.stringify(value); // Keep quotes for strings to preserve type
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        data = String(value);
      } else {
        data = JSON.stringify(value);
      }

      if (typeof ttlSeconds === 'number' && Number.isFinite(ttlSeconds)) {
        const ttl = Math.max(0, Math.floor(ttlSeconds));
        if (ttl > 0) {
          await this.redis.setex(key, ttl, data);
        } else {
          await this.redis.del(key);
        }
      } else {
        await this.redis.set(key, data);
      }
    } catch (error) {
      this.metrics.errors++;
      const logger = getLogger({ service: 'api-cache' });
      logger.warn('Cache set error:', { error });
    }
  }

  /**
   * Deletes a key from the cache.
   * Silently handles errors and logs warnings for monitoring.
   *
   * @param key - The cache key to delete
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      const logger = getLogger({ service: 'api-cache' });
      logger.warn('Cache del error:', { error });
    }
  }

  /**
   * Invalidates all cache keys matching a pattern using Redis SCAN.
   * Uses pipelining for efficient bulk deletion of multiple keys.
   * Processes keys in batches of 100 to avoid blocking Redis.
   *
   * @param pattern - Redis key pattern to match (e.g., "user:*:votes")
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        if (keys.length > 0) {
          const pipeline = this.redis.pipeline();
          for (const key of keys) {
            pipeline.del(key);
          }
          await pipeline.exec();
        }
        cursor = nextCursor;
      } while (cursor !== '0');
    } catch (error) {
      const logger = getLogger({ service: 'api-cache' });
      logger.warn('Cache invalidate pattern error:', { error });
    }
  }

  /**
   * Closes the Redis connection if this service owns it.
   * Should be called during application shutdown to clean up resources.
   */
  async close(): Promise<void> {
    if (this.ownsConnection) {
      await this.redis.quit();
    }
  }

  /**
   * Invalidate all caches related to a vote creation/update.
   * Clears vote-related cache entries to ensure data consistency
   * when votes are added, modified, or removed.
   *
   * @param billId - The ID of the bill whose vote caches to invalidate
   * @param userId - The ID of the user whose vote caches to invalidate
   */
  async invalidateVoteRelated(billId: string, userId: string): Promise<void> {
    await Promise.all([
      this.del(cacheKeys.billVotes(billId)),
      this.del(cacheKeys.userVotes(userId)),
      this.del(`bill:${billId}:voteCounts`),
    ]);
  }

  /**
   * Returns cache performance metrics for monitoring and debugging.
   * Includes hit rate calculation and counts of all cache operations.
   *
   * @returns Object containing cache metrics including hit rate percentage
   */
  getMetrics() {
    const hitRate = this.metrics.gets > 0 ? (this.metrics.hits / this.metrics.gets) * 100 : 0;
    return {
      ...this.metrics,
      hitRate: `${hitRate.toFixed(2)}%`,
    };
  }
}

// Cache key generators
/**
 * Cache key generator functions for consistent cache key naming across the application.
 * Provides standardized patterns for caching different types of data.
 */
export const cacheKeys = {
  bill: (id: string) => `bill:${id}`,
  bills: (page?: number, limit?: number) => `bills:${page || 1}:${limit || 10}`,
  billVotes: (billId: string) => `bill:${billId}:votes`,
  user: (id: string) => `user:${id}`,
  userBills: (userId: string) => `user:${userId}:bills`,
  userVotes: (userId: string) => `user:${userId}:votes`,
  userByUsername: (username: string) => `user:username:${username}`,
  userByEmail: (email: string) => `user:email:${email}`,
  vote: (id: string) => `vote:${id}`,
  votesByBill: (billId: string) => `votes:bill:${billId}`,
  votesByUser: (userId: string) => `votes:user:${userId}`,
  party: (id: string) => `party:${id}`,
  partyByName: (name: string) => `party:name:${name}`,
  parties: () => `parties:all`,
};

// Cache TTL constants (in seconds)
/**
 * Cache time-to-live constants in seconds for different types of cached data.
 * Defines standard expiration times to balance performance and data freshness.
 */
export const CACHE_TTL = {
  BILL: 300, // 5 minutes
  BILLS_LIST: 60, // 1 minute
  VOTES: 120, // 2 minutes
  USER: 600, // 10 minutes
  PARTY: 300, // 5 minutes
  PARTY_LIST: 120, // 2 minutes
};
