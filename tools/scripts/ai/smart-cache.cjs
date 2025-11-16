#!/usr/bin/env node
/**
 * Smart Cache with LRU and TTL
 *
 * High-performance caching layer inspired by Redis and LRU-cache patterns.
 *
 * Features:
 * - LRU (Least Recently Used) eviction
 * - TTL (Time To Live) expiration
 * - Size-based limits
 * - Hit/miss statistics
 * - Persistent storage
 * - Sub-millisecond lookups
 *
 * @source Redis (caching patterns)
 * @source lru-cache (NPM package patterns)
 * @source Node.js built-in Map optimization
 */

const fs = require('fs');
const path = require('path');

class SmartCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 3600000; // 1 hour default
    this.cache = new Map();
    this.accessOrder = new Map(); // key -> timestamp
    this.persistPath = options.persistPath || 'ai/cache/smart-cache.json';

    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      expirations: 0,
    };

    this.ensureDirectory();
    this.load();

    // Auto-cleanup every 5 minutes
    if (options.autoCleanup !== false) {
      this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
    }
  }

  ensureDirectory() {
    const dir = path.dirname(this.persistPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Get value from cache
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    // Check TTL
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.stats.expirations++;
      this.stats.misses++;
      return undefined;
    }

    // Update access time
    this.accessOrder.set(key, Date.now());
    this.stats.hits++;

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key, value, ttl = this.ttl) {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const expiresAt = ttl ? Date.now() + ttl : null;

    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now(),
    });

    this.accessOrder.set(key, Date.now());
    this.stats.sets++;
  }

  /**
   * Check if key exists and is valid
   */
  has(key) {
    const value = this.get(key);
    return value !== undefined;
  }

  /**
   * Delete key
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    this.accessOrder.delete(key);
    return deleted;
  }

  /**
   * Evict least recently used item
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, time] of this.accessOrder) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Remove expired entries
   */
  cleanup() {
    const now = Date.now();
    const toDelete = [];

    for (const [key, entry] of this.cache) {
      if (entry.expiresAt && now > entry.expiresAt) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.stats.expirations++;
    }

    return toDelete.length;
  }

  /**
   * Clear all entries
   */
  clear() {
    this.cache.clear();
    this.accessOrder.clear();
  }

  /**
   * Get or set pattern (compute if missing)
   */
  getOrSet(key, computeFn, ttl = this.ttl) {
    const cached = this.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const value = computeFn();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Memoize a function
   */
  memoize(fn, options = {}) {
    const { keyFn = (...args) => JSON.stringify(args), ttl = this.ttl } = options;

    return (...args) => {
      const key = keyFn(...args);
      return this.getOrSet(key, () => fn(...args), ttl);
    };
  }

  /**
   * Save to disk
   */
  save() {
    const data = {
      cache: Array.from(this.cache.entries()),
      accessOrder: Array.from(this.accessOrder.entries()),
      stats: this.stats,
      savedAt: Date.now(),
    };

    fs.writeFileSync(this.persistPath, JSON.stringify(data, null, 2));
    return this.persistPath;
  }

  /**
   * Load from disk
   */
  load() {
    if (!fs.existsSync(this.persistPath)) {
      return false;
    }

    try {
      const data = JSON.parse(fs.readFileSync(this.persistPath, 'utf8'));

      // Filter out expired entries
      const now = Date.now();
      const validEntries = data.cache.filter(([, entry]) => {
        return !entry.expiresAt || now < entry.expiresAt;
      });

      this.cache = new Map(validEntries);
      this.accessOrder = new Map(data.accessOrder);
      this.stats = data.stats || this.stats;

      return true;
    } catch (error) {
      console.error('Failed to load cache:', error.message);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate =
      this.stats.hits + this.stats.misses > 0
        ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(2)
        : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      maxSize: this.maxSize,
      utilization: `${((this.cache.size / this.maxSize) * 100).toFixed(2)}%`,
    };
  }

  /**
   * Destroy cache and cleanup
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const cache = new SmartCache({ maxSize: 100, ttl: 60000 });

  if (command === 'set') {
    const key = process.argv[3];
    const value = process.argv[4];

    if (!key || !value) {
      console.error('Usage: node smart-cache.cjs set <key> <value>');
      process.exit(1);
    }

    cache.set(key, value);
    cache.save();
    console.log(`✅ Set: ${key} = ${value}`);
  } else if (command === 'get') {
    const key = process.argv[3];

    if (!key) {
      console.error('Usage: node smart-cache.cjs get <key>');
      process.exit(1);
    }

    const value = cache.get(key);

    if (value !== undefined) {
      console.log(`✅ ${key} = ${value}`);
    } else {
      console.log(`❌ Key not found: ${key}`);
    }
  } else if (command === 'stats') {
    console.log('📊 Cache Statistics:');
    console.log(cache.getStats());
  } else if (command === 'cleanup') {
    const cleaned = cache.cleanup();
    console.log(`🧹 Cleaned ${cleaned} expired entries`);
    cache.save();
  } else if (command === 'test') {
    console.log('🧪 Testing Smart Cache...\n');

    // Test basic operations
    console.log('1. Setting values...');
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    console.log('✅ Set 3 values\n');

    // Test retrieval
    console.log('2. Getting values...');
    console.log(`   key1: ${cache.get('key1')}`);
    console.log(`   key2: ${cache.get('key2')}`);
    console.log(`   missing: ${cache.get('missing')}`);
    console.log();

    // Test variable names in test
    console.log('3. Testing variable names...');
    const myKey = 'testKey';
    const myValue = 'testValue';
    cache.set(myKey, myValue);
    console.log(`   Set ${myKey}: ${cache.get(myKey)}`);
    console.log();

    // Test memoization
    console.log('3. Testing memoization...');
    let callCount = 0;
    const expensiveFn = x => {
      callCount++;
      return x * x;
    };

    const memoized = cache.memoize(expensiveFn);

    console.log(`   First call memoized(5): ${memoized(5)} (computed)`);
    console.log(`   Second call memoized(5): ${memoized(5)} (cached)`);
    console.log(`   Function called ${callCount} time(s)\n`);

    // Test LRU eviction
    console.log('4. Testing LRU eviction...');
    const smallCache = new SmartCache({ maxSize: 3 });
    smallCache.set('a', 1);
    smallCache.set('b', 2);
    smallCache.set('c', 3);
    console.log(`   Cache size: ${smallCache.cache.size}`);
    smallCache.set('d', 4); // Should evict 'a'
    console.log(`   Added 'd', evicted oldest`);
    console.log(`   'a' exists: ${smallCache.has('a')}`);
    console.log(`   'd' exists: ${smallCache.has('d')}`);
    console.log();

    // Show stats
    console.log('5. Final statistics:');
    console.log(cache.getStats());

    cache.save();
    console.log(`\n💾 Saved to ${cache.persistPath}`);
  } else {
    console.log(`
Smart Cache - High Performance Caching

Usage:
  node smart-cache.cjs set <key> <value>
  node smart-cache.cjs get <key>
  node smart-cache.cjs stats
  node smart-cache.cjs cleanup
  node smart-cache.cjs test

Examples:
  node smart-cache.cjs test
  node smart-cache.cjs set myKey myValue
  node smart-cache.cjs get myKey
    `);
  }
}

module.exports = SmartCache;
