#!/usr/bin/env node
/*
  Context Preloader: Load common development contexts for fast AI warm-up
  
  Features:
  - LRU cache with configurable size limits
  - Priority-based context loading
  - Usage analytics and tracking
  - Automated bundle optimization
  - Cache invalidation on file changes
  
  Usage: 
    node scripts/ai/context-preloader.js preload [--priority high|normal|low]
    node scripts/ai/context-preloader.js get <context>
    node scripts/ai/context-preloader.js stats
    node scripts/ai/context-preloader.js optimize
    node scripts/ai/context-preloader.js invalidate <context>
*/

import { createHash } from 'crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { extname, join } from 'path';

// Prefer repository-root `ai-cache/`, fall back to `ai/ai-cache/` if present or needed.
const ROOT_CACHE_DIR = 'ai-cache';
const FALLBACK_CACHE_DIR = join('ai', 'ai-cache');

let CACHE_DIR = ROOT_CACHE_DIR;

// Always prefer the repository-root `ai-cache`. Create it if missing.
try {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
} catch (err) {
  console.warn(
    'Warning: failed to create root cache dir at',
    CACHE_DIR,
    '- falling back to ai/ai-cache:',
    err?.message
  );
  // Fall back to `ai/ai-cache` if root creation fails for any reason.
  if (!existsSync(FALLBACK_CACHE_DIR)) mkdirSync(FALLBACK_CACHE_DIR, { recursive: true });
  CACHE_DIR = FALLBACK_CACHE_DIR;
}

const CACHE_FILE = join(CACHE_DIR, 'context-cache.json');
const ANALYTICS_FILE = join(CACHE_DIR, 'context-analytics.json');
const MAX_CACHE_SIZE_MB = 50; // Maximum cache size in megabytes
const MAX_LRU_ENTRIES = 100; // Maximum number of LRU cache entries

// Priority levels for context loading (higher = more important)
const PRIORITY = {
  HIGH: 3,
  NORMAL: 2,
  LOW: 1,
};

const CONTEXTS = {
  'api-routes': {
    paths: [
      'apps/api/src/routes/',
      'libs/shared/src/',
      'docs/architecture/decisions/',
      '.blackboxrules',
    ],
    priority: PRIORITY.HIGH,
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  'frontend-components': {
    paths: [
      'apps/frontend/src/components/',
      'libs/shared/src/',
      'docs/architecture/decisions/',
      '.blackboxrules',
    ],
    priority: PRIORITY.HIGH,
    maxSize: 5 * 1024 * 1024,
  },
  tests: {
    paths: ['tests/', 'jest.config.cjs', 'docs/', '.blackboxrules'],
    priority: PRIORITY.NORMAL,
    maxSize: 3 * 1024 * 1024,
  },
  config: {
    paths: [
      'package.json',
      'tsconfig.base.json',
      'nx.json',
      'docs/architecture/decisions/',
      '.blackboxrules',
    ],
    priority: PRIORITY.HIGH,
    maxSize: 2 * 1024 * 1024,
  },
  docs: {
    paths: ['docs/', 'README.md', '.blackboxrules'],
    priority: PRIORITY.NORMAL,
    maxSize: 4 * 1024 * 1024,
  },
  'rules-awareness': {
    paths: [
      '.blackboxrules',
      '.github/copilot-instructions/copilot-instructions.md',
      'docs/architecture/decisions/',
    ],
    priority: PRIORITY.HIGH,
    maxSize: 2 * 1024 * 1024,
  },
  patterns: {
    paths: ['ai/patterns/', 'ai-learning/patterns.json', 'docs/TODO.md'],
    priority: PRIORITY.LOW,
    maxSize: 1 * 1024 * 1024,
  },
};

/**
 * Recursively walk a directory and return full file paths.
 * Uses sync APIs for simplicity and predictable ordering.
 */
function walkDir(dir) {
  const results = [];

  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    console.warn(`Warning: unable to read directory ${dir}: ${err?.message}`);
    return results;
  }

  for (const entry of entries) {
    const res = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(res));
    } else if (entry.isFile()) {
      results.push(res);
    }
  }

  return results;
}

/**
 * Calculate hash of file content for cache invalidation
 */
function calculateHash(content) {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * Load or initialize analytics data
 */
function loadAnalytics() {
  if (!existsSync(ANALYTICS_FILE)) {
    return {
      contextUsage: {},
      lruCache: [],
      cacheHits: 0,
      cacheMisses: 0,
      lastOptimization: null,
    };
  }
  return JSON.parse(readFileSync(ANALYTICS_FILE, 'utf8'));
}

/**
 * Save analytics data
 */
function saveAnalytics(analytics) {
  writeFileSync(ANALYTICS_FILE, JSON.stringify(analytics, null, 2));
}

/**
 * Update LRU cache and track usage
 */
function trackContextUsage(contextName, analytics) {
  // Update usage count
  if (!analytics.contextUsage[contextName]) {
    analytics.contextUsage[contextName] = {
      count: 0,
      lastAccessed: null,
      totalBytes: 0,
    };
  }
  analytics.contextUsage[contextName].count++;
  analytics.contextUsage[contextName].lastAccessed = new Date().toISOString();

  // Update LRU cache
  const existingIndex = analytics.lruCache.indexOf(contextName);
  if (existingIndex !== -1) {
    analytics.lruCache.splice(existingIndex, 1);
  }
  analytics.lruCache.unshift(contextName);

  // Trim LRU cache to max entries
  if (analytics.lruCache.length > MAX_LRU_ENTRIES) {
    analytics.lruCache = analytics.lruCache.slice(0, MAX_LRU_ENTRIES);
  }

  saveAnalytics(analytics);
}

/**
 * Calculate total cache size in bytes
 */
function calculateCacheSize(cache) {
  let totalSize = 0;
  for (const contextName in cache.contexts) {
    const context = cache.contexts[contextName];
    for (const filePath in context.files) {
      totalSize += context.files[filePath].size || 0;
    }
  }
  return totalSize;
}

/**
 * Optimize cache by removing least-used contexts if size exceeds limit
 */
function optimizeCache() {
  if (!existsSync(CACHE_FILE)) {
    console.log('No cache to optimize');
    return;
  }

  const cache = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  const analytics = loadAnalytics();
  const currentSize = calculateCacheSize(cache);
  const maxSizeBytes = MAX_CACHE_SIZE_MB * 1024 * 1024;

  console.log(`Current cache size: ${(currentSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Maximum cache size: ${MAX_CACHE_SIZE_MB} MB`);

  if (currentSize <= maxSizeBytes) {
    console.log('Cache size within limits - no optimization needed');
    analytics.lastOptimization = new Date().toISOString();
    saveAnalytics(analytics);
    return;
  }

  // Remove least-used contexts until size is under limit
  const usageRanking = Object.entries(analytics.contextUsage)
    .sort((a, b) => a[1].count - b[1].count)
    .map(([name]) => name);

  let removed = 0;
  for (const contextName of usageRanking) {
    if (calculateCacheSize(cache) <= maxSizeBytes) break;

    if (cache.contexts[contextName]) {
      delete cache.contexts[contextName];
      removed++;
      console.log(`Removed low-usage context: ${contextName}`);
    }
  }

  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  analytics.lastOptimization = new Date().toISOString();
  saveAnalytics(analytics);

  console.log(`Optimization complete - removed ${removed} contexts`);
  console.log(`New cache size: ${(calculateCacheSize(cache) / 1024 / 1024).toFixed(2)} MB`);
}

/**
 * Display cache statistics
 */
function showStats() {
  if (!existsSync(CACHE_FILE)) {
    console.log('No cache found. Run "preload" first.');
    return;
  }

  const cache = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  const analytics = loadAnalytics();
  const cacheSize = calculateCacheSize(cache);

  const stats = {
    totalContexts: Object.keys(cache.contexts).length,
    cacheSizeMB: (cacheSize / 1024 / 1024).toFixed(2),
    maxSizeMB: MAX_CACHE_SIZE_MB,
    utilizationPercent: ((cacheSize / (MAX_CACHE_SIZE_MB * 1024 * 1024)) * 100).toFixed(1),
    cacheHits: analytics.cacheHits,
    cacheMisses: analytics.cacheMisses,
    hitRate:
      analytics.cacheHits + analytics.cacheMisses > 0
        ? ((analytics.cacheHits / (analytics.cacheHits + analytics.cacheMisses)) * 100).toFixed(1) +
          '%'
        : 'N/A',
    lastOptimization: analytics.lastOptimization || 'Never',
    mostUsedContexts: Object.entries(analytics.contextUsage)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([name, data]) => ({ name, count: data.count, lastAccessed: data.lastAccessed })),
    lruCacheSize: analytics.lruCache.length,
    contexts: Object.entries(cache.contexts).map(([name, context]) => ({
      name,
      files: Object.keys(context.files).length,
      priority: CONTEXTS[name]?.priority || 'unknown',
      lastUpdated: context.lastUpdated,
    })),
  };

  console.log(JSON.stringify(stats, null, 2));
}

/**
 * Invalidate a specific context (force rebuild on next preload)
 */
function invalidateContext(contextName) {
  if (!existsSync(CACHE_FILE)) {
    console.log('No cache found');
    return;
  }

  const cache = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  if (cache.contexts[contextName]) {
    delete cache.contexts[contextName];
    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log(`Invalidated context: ${contextName}`);
  } else {
    console.log(`Context not found: ${contextName}`);
  }
}

async function preloadContext(contextName) {
  const contextConfig = CONTEXTS[contextName];
  if (!contextConfig) return null;

  const context = {
    name: contextName,
    files: {},
    lastUpdated: new Date().toISOString(),
    priority: contextConfig.priority,
    hash: null,
  };

  let totalSize = 0;
  const paths = contextConfig.paths;

  const promises = paths.map(async path => {
    if (existsSync(path)) {
      if (statSync(path).isDirectory()) {
        const files = walkDir(path);
        for (const fullPath of files) {
          // Check if adding this file would exceed context size limit
          if (totalSize >= contextConfig.maxSize) {
            console.warn(`Context ${contextName} exceeds size limit, skipping remaining files`);
            break;
          }

          const ext = extname(fullPath);
          if (ext === '.ts' || ext === '.js' || ext === '.json' || ext === '.md') {
            try {
              const content = readFileSync(fullPath, 'utf8');
              // Validate content integrity
              if (content.length === 0) {
                console.warn('Warning: Empty file', fullPath);
                continue;
              }

              const fileSize = content.length;
              totalSize += fileSize;

              context.files[fullPath] = {
                content: content.slice(0, 1000),
                size: fileSize,
                hash: calculateHash(content),
              };
            } catch (err) {
              // Security: Separate format string from variable to prevent log injection
              console.error('Error reading file:', fullPath, err?.message);
              // Skip unreadable files but log the error
            }
          }
        }
      } else {
        try {
          const content = readFileSync(path, 'utf8');
          if (content.length === 0) {
            console.warn('Warning: Empty file', path);
            return;
          }

          const fileSize = content.length;
          totalSize += fileSize;

          context.files[path] = {
            content: content.slice(0, 1000),
            size: fileSize,
            hash: calculateHash(content),
          };
        } catch (err) {
          // Security: Separate format string from variable to prevent log injection
          console.error('Error reading file:', path, err?.message);
          // Skip unreadable files but log the error
        }
      }
    } else {
      // Skip non-existent paths silently to avoid noise
      return;
    }
  });

  await Promise.all(promises);

  // Calculate overall context hash for cache invalidation
  const contextHashes = Object.values(context.files)
    .map(f => f.hash)
    .join('');
  context.hash = calculateHash(contextHashes);

  return context;
}

async function preloadAll(priorityFilter = null) {
  const cache = { contexts: {}, lastUpdated: new Date().toISOString() };
  const analytics = loadAnalytics();

  // Sort contexts by priority if filter is applied
  let contextsToLoad = Object.keys(CONTEXTS);

  if (priorityFilter) {
    const priorityValue = PRIORITY[priorityFilter.toUpperCase()];
    contextsToLoad = contextsToLoad.filter(name => CONTEXTS[name].priority === priorityValue);
    console.log(`Loading ${contextsToLoad.length} contexts with priority: ${priorityFilter}`);
  }

  // Sort by priority (highest first)
  contextsToLoad.sort((a, b) => CONTEXTS[b].priority - CONTEXTS[a].priority);

  const promises = contextsToLoad.map(async contextName => {
    console.log(`Preloading context: ${contextName} (priority: ${CONTEXTS[contextName].priority})`);
    const context = await preloadContext(contextName);
    if (context) {
      cache.contexts[contextName] = context;

      // Update analytics
      const totalBytes = Object.values(context.files).reduce((sum, f) => sum + f.size, 0);
      if (!analytics.contextUsage[contextName]) {
        analytics.contextUsage[contextName] = {
          count: 0,
          lastAccessed: null,
          totalBytes: 0,
        };
      }
      analytics.contextUsage[contextName].totalBytes = totalBytes;
    }
  });

  await Promise.all(promises);

  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  saveAnalytics(analytics);

  const cacheSize = calculateCacheSize(cache);
  console.log(`Context cache built with ${Object.keys(cache.contexts).length} contexts`);
  console.log(`Total cache size: ${(cacheSize / 1024 / 1024).toFixed(2)} MB`);

  // Auto-optimize if cache is too large
  if (cacheSize > MAX_CACHE_SIZE_MB * 1024 * 1024) {
    console.log('Cache size exceeds limit - running optimization...');
    optimizeCache();
  }
}

function getContext(contextName) {
  if (!existsSync(CACHE_FILE)) {
    console.error('Cache not found. Run "preload" first.');
    process.exit(1);
  }

  const cache = JSON.parse(readFileSync(CACHE_FILE, 'utf8'));
  const analytics = loadAnalytics();

  const context = cache.contexts[contextName];
  if (!context) {
    // Track cache miss
    analytics.cacheMisses++;
    saveAnalytics(analytics);

    // Do not exit with error code for non-existent contexts — callers/tests expect graceful handling.
    console.log(`Context "${contextName}" not found.`);
    return;
  }

  // Track cache hit and usage
  analytics.cacheHits++;
  trackContextUsage(contextName, analytics);

  console.log(JSON.stringify(context, null, 2));
}

// Parse command-line arguments
const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

if (command === 'preload') {
  // Support priority filter: node context-preloader.js preload --priority high
  const priorityFilter = arg1 === '--priority' ? arg2 : null;
  preloadAll(priorityFilter).catch(console.error);
} else if (command === 'get') {
  getContext(arg1);
} else if (command === 'stats') {
  showStats();
} else if (command === 'optimize') {
  optimizeCache();
} else if (command === 'invalidate') {
  invalidateContext(arg1);
} else {
  console.log('Usage:');
  console.log('  node scripts/ai/context-preloader.js preload [--priority high|normal|low]');
  console.log('  node scripts/ai/context-preloader.js get <context>');
  console.log('  node scripts/ai/context-preloader.js stats');
  console.log('  node scripts/ai/context-preloader.js optimize');
  console.log('  node scripts/ai/context-preloader.js invalidate <context>');
}
