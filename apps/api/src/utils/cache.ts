import type { RedisOptions } from 'ioredis';
import Redis from 'ioredis';

type RedisLike = Pick<Redis, 'get' | 'set' | 'setex' | 'del' | 'scan' | 'pipeline' | 'quit'>;

type RedisInput = string | Redis | RedisOptions | RedisLike | undefined;

function isRedisInstance(input: unknown): input is Redis {
  return input instanceof Redis;
}

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
      console.warn('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    this.metrics.sets++;
    try {
      let data: string;

      // Optimize serialization for common types
      if (typeof value === 'string') {
        data = JSON.stringify(value); // Still need quotes for strings
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        data = String(value); // No JSON overhead for primitives
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
      console.warn('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.warn('Cache del error:', error);
    }
  }

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
      console.warn('Cache invalidate pattern error:', error);
    }
  }

  async close(): Promise<void> {
    if (this.ownsConnection) {
      await this.redis.quit();
    }
  }

  getMetrics() {
    const hitRate = this.metrics.gets > 0 ? (this.metrics.hits / this.metrics.gets) * 100 : 0;
    return {
      ...this.metrics,
      hitRate: `${hitRate.toFixed(2)}%`,
    };
  }
}

// Cache key generators
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
export const CACHE_TTL = {
  BILL: 300, // 5 minutes
  BILLS_LIST: 60, // 1 minute
  VOTES: 120, // 2 minutes
  USER: 600, // 10 minutes
  PARTY: 300, // 5 minutes
  PARTY_LIST: 120, // 2 minutes
};
