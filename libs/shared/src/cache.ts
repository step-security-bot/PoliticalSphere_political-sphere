/**
 * Security Database Caching Service
 *
 * Provides high-performance caching for security-related database queries
 * Supports Redis and in-memory fallback with configurable TTL and invalidation
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { getLogger } from './logger.js';

const logger = getLogger({ service: 'cache' });

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize?: number; // Maximum cache size for memory cache
  redisUrl?: string; // Redis connection URL
  enabled: boolean;
  fileCache?: {
    enabled: boolean;
    directory: string;
    maxFileSize: number;
  };
  compression?: boolean;
  serialization?: 'json' | 'msgpack';
}

const DEFAULT_CONFIG: CacheConfig = {
  ttl: 300, // 5 minutes default
  maxSize: 1000,
  enabled: process.env.CACHE_ENABLED !== 'false',
  fileCache: {
    enabled: process.env.FILE_CACHE_ENABLED === 'true',
    directory: process.env.FILE_CACHE_DIR || './.cache',
    maxFileSize: parseInt(process.env.MAX_FILE_CACHE_SIZE || '10485760', 10), // 10MB
  },
  compression: process.env.CACHE_COMPRESSION === 'true',
  serialization: 'json',
};

// Cache entry interface
interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

// In-memory cache implementation
class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, value: T, ttl = 300): void {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl,
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key);
      }
    }
  }

  get size(): number {
    return this.cache.size;
  }
}

// Redis cache implementation (lazy loaded)
type RedisClient = {
  on: (event: string, handler: (...args: never[]) => void) => void;
  connect: () => Promise<void>;
  get: (key: string) => Promise<string | null>;
  setEx: (key: string, ttl: number, value: string) => Promise<void>;
  del: (key: string) => Promise<number>;
  flushAll: () => Promise<void>;
  disconnect: () => Promise<void>;
};

class RedisCache {
  private client: RedisClient | null = null;
  private connected = false;

  async connect(redisUrl?: string): Promise<void> {
    if (this.connected) return;

    try {
      // Dynamic import to handle optional Redis dependency
      // @ts-expect-error - Redis is optional dependency
      const redis = await import('redis').catch(() => null);
      if (!redis) {
        throw new Error('Redis package not installed');
      }

      const { createClient } = redis;
      this.client = createClient({
        url: redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      }) as RedisClient;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.client.on('error', (...args: unknown[]) => {
        const err = args[0] as Error;
        logger.warn('Redis connection error', { error: err.message });
        this.connected = false;
      });

      this.client.on('connect', () => {
        logger.info('Connected to Redis');
        this.connected = true;
      });

      await this.client.connect();
    } catch (error) {
      logger.warn('Failed to connect to Redis, falling back to memory cache', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.connected || !this.client) return null;

    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.warn('Redis get error', { error: (error as Error).message });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl = 300): Promise<void> {
    if (!this.connected || !this.client) return;

    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.warn('Redis set error', { error: (error as Error).message });
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.connected || !this.client) return false;

    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      logger.warn('Redis delete error', { error: (error as Error).message });
      return false;
    }
  }

  async clear(): Promise<void> {
    if (!this.connected || !this.client) return;

    try {
      await this.client.flushAll();
    } catch (error) {
      logger.warn('Redis clear error', { error: (error as Error).message });
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.connected = false;
    }
  }
}

// File-based cache implementation for large objects
class FileCache {
  private directory: string;
  private maxFileSize: number;

  constructor(directory: string, maxFileSize: number) {
    this.directory = directory;
    this.maxFileSize = maxFileSize;
  }

  private getFilePath(key: string): string {
    // Create a safe filename from the key
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
    return path.join(this.directory, `${safeKey}.cache`);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const filePath = this.getFilePath(key);
      const stats = await fs.stat(filePath);

      // Check if file is too large
      if (stats.size > this.maxFileSize) {
        await fs.unlink(filePath);
        return null;
      }

      const data = await fs.readFile(filePath, 'utf8');
      const entry: CacheEntry<T> = JSON.parse(data);

      // Check if expired
      if (Date.now() - entry.timestamp > entry.ttl * 1000) {
        await fs.unlink(filePath);
        return null;
      }

      return entry.data;
    } catch {
      // File doesn't exist or is corrupted
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl = 300): Promise<void> {
    try {
      await fs.mkdir(this.directory, { recursive: true });
      const filePath = this.getFilePath(key);
      const entry: CacheEntry<T> = {
        data: value,
        timestamp: Date.now(),
        ttl,
      };

      const data = JSON.stringify(entry);

      // Check if data is too large for file cache
      if (data.length > this.maxFileSize) {
        return; // Skip file caching for large objects
      }

      await fs.writeFile(filePath, data, 'utf8');
    } catch (error) {
      logger.warn('File cache set error', { error: (error as Error).message });
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const files = await fs.readdir(this.directory);
      await Promise.all(
        files
          .filter(file => file.endsWith('.cache'))
          .map(file => fs.unlink(path.join(this.directory, file)))
      );
    } catch (error) {
      logger.warn('File cache clear error', { error: (error as Error).message });
    }
  }
}

// Main cache service
class CacheService {
  private memoryCache: MemoryCache;
  private redisCache: RedisCache;
  private fileCache: FileCache | null = null;
  private config: CacheConfig;
  private useRedis = false;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.memoryCache = new MemoryCache(this.config.maxSize);
    this.redisCache = new RedisCache();

    // Initialize file cache if enabled
    if (this.config.fileCache?.enabled) {
      this.fileCache = new FileCache(
        this.config.fileCache.directory,
        this.config.fileCache.maxFileSize
      );
    }

    // Try to initialize Redis
    void this.initRedis();
  }

  async initRedis(): Promise<void> {
    if (!this.config.redisUrl && !process.env.REDIS_URL) {
      logger.info('Redis not configured, using memory cache only');
      return;
    }

    try {
      await this.redisCache.connect(this.config.redisUrl);
      this.useRedis = true;
      logger.info('Cache service initialized with Redis');
    } catch {
      logger.info('Redis unavailable, using memory cache fallback');
      this.useRedis = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.config.enabled) return null;

    // Try Redis first if available (fastest)
    if (this.useRedis) {
      const result = await this.redisCache.get<T>(key);
      if (result !== null) {
        logger.debug('Cache hit (Redis)', { key });
        return result;
      }
    }

    // Try memory cache (fast)
    const result = this.memoryCache.get<T>(key);
    if (result !== null) {
      logger.debug('Cache hit (Memory)', { key });
      return result;
    }

    // Try file cache for larger objects (slower but persistent)
    if (this.fileCache) {
      const result = await this.fileCache.get<T>(key);
      if (result !== null) {
        logger.debug('Cache hit (File)', { key });
        // Promote to memory cache for faster future access
        this.memoryCache.set(key, result, this.config.ttl);
        return result;
      }
    }

    logger.debug('Cache miss', { key });
    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.config.enabled) return;

    const cacheTtl = ttl || this.config.ttl;
    const valueSize = JSON.stringify(value).length;

    // Set in Redis if available (for all objects)
    if (this.useRedis) {
      await this.redisCache.set(key, value, cacheTtl);
    }

    // Always set in memory cache for fast access
    this.memoryCache.set(key, value, cacheTtl);

    // Set in file cache for larger objects (persistent storage)
    if (this.fileCache && valueSize > 1024) {
      // > 1KB
      await this.fileCache.set(key, value, cacheTtl);
    }

    logger.debug('Cache set', { key, ttl: cacheTtl, size: valueSize });
  }

  async delete(key: string): Promise<void> {
    if (!this.config.enabled) return;

    if (this.useRedis) {
      await this.redisCache.delete(key);
    }

    this.memoryCache.delete(key);

    if (this.fileCache) {
      await this.fileCache.delete(key);
    }

    logger.debug('Cache delete', { key });
  }

  async clear(): Promise<void> {
    if (this.useRedis) {
      await this.redisCache.clear();
    }

    this.memoryCache.clear();

    if (this.fileCache) {
      await this.fileCache.clear();
    }

    logger.info('Cache cleared');
  }

  // Cache key generators for security queries
  static key = {
    user: {
      byId: (id: string) => `user:id:${id}`,
      byEmail: (email: string) => `user:email:${email}`,
      permissions: (id: string) => `user:permissions:${id}`,
      roles: (id: string) => `user:roles:${id}`,
    },
    session: {
      byId: (id: string) => `session:id:${id}`,
      userSessions: (userId: string) => `session:user:${userId}`,
    },
    rateLimit: {
      check: (identifier: string, action: string) => `ratelimit:${identifier}:${action}`,
    },
    audit: {
      userActivity: (userId: string, limit: number) => `audit:user:${userId}:${limit}`,
      recentActivity: (limit: number) => `audit:recent:${limit}`,
    },
  };

  // Cache invalidation helpers
  async invalidateUser(userId: string): Promise<void> {
    const keys = [
      CacheService.key.user.byId(userId),
      CacheService.key.user.permissions(userId),
      CacheService.key.user.roles(userId),
      CacheService.key.session.userSessions(userId),
    ];

    for (const key of keys) {
      await this.delete(key);
    }

    logger.debug('Invalidated user cache', { userId });
  }

  async invalidateSession(sessionId: string, userId?: string): Promise<void> {
    await this.delete(CacheService.key.session.byId(sessionId));

    if (userId) {
      await this.delete(CacheService.key.session.userSessions(userId));
    }

    logger.debug('Invalidated session cache', { sessionId, userId });
  }

  // Cleanup expired entries (for memory cache)
  cleanup(): void {
    this.memoryCache.cleanup();
  }

  // Get cache statistics
  getStats() {
    return {
      enabled: this.config.enabled,
      useRedis: this.useRedis,
      useFileCache: !!this.fileCache,
      memoryCacheSize: this.memoryCache.size,
      config: this.config,
    };
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    if (this.useRedis) {
      await this.redisCache.disconnect();
    }
    logger.info('Cache service shutdown');
  }
}

// Singleton instance
let cacheInstance: CacheService | null = null;

export function getCache(config?: Partial<CacheConfig>): CacheService {
  if (!cacheInstance) {
    cacheInstance = new CacheService(config);
  }
  return cacheInstance;
}

// Cached database query wrapper
export async function withCache<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl?: number,
  forceRefresh = false
): Promise<T> {
  const cache = getCache();

  if (!forceRefresh) {
    const cached = await cache.get<T>(key);
    if (cached !== null) {
      return cached;
    }
  }

  const result = await queryFn();
  await cache.set(key, result, ttl);

  return result;
}

// Security-specific cached queries
export const cachedQueries = {
  async findUserById(userId: string) {
    const key = CacheService.key.user.byId(userId);

    return withCache(key, async () => {
      const { executeQuerySingle, userQueries } = await import('./database.js');
      return executeQuerySingle(userQueries.findById, [userId]);
    });
  },

  async findUserByEmail(email: string) {
    const key = CacheService.key.user.byEmail(email);

    return withCache(key, async () => {
      const { executeQuerySingle, userQueries } = await import('./database.js');
      return executeQuerySingle(userQueries.findByEmail, [email]);
    });
  },

  async getSession(sessionId: string) {
    const key = CacheService.key.session.byId(sessionId);

    return withCache(
      key,
      async () => {
        const { executeQuerySingle, sessionQueries } = await import('./database.js');
        return executeQuerySingle(sessionQueries.findById, [sessionId]);
      },
      60
    ); // Shorter TTL for sessions
  },

  async checkRateLimit(identifier: string, action: string) {
    const key = CacheService.key.rateLimit.check(identifier, action);

    return withCache(
      key,
      async () => {
        const { executeQuerySingle, rateLimitQueries } = await import('./database.js');
        return executeQuerySingle(rateLimitQueries.check, [identifier, action]);
      },
      30
    ); // Very short TTL for rate limiting
  },
};

// Export cache key generators for external use
export { CacheService };

// Graceful shutdown
process.on('SIGINT', async () => {
  if (cacheInstance) {
    await cacheInstance.shutdown();
  }
});

process.on('SIGTERM', async () => {
  if (cacheInstance) {
    await cacheInstance.shutdown();
  }
});
