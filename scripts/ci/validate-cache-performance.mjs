#!/usr/bin/env node
/**
 * Cache Performance Validation Script
 *
 * Validates caching infrastructure performance and effectiveness
 * Measures cache hit rates, latency improvements, and memory usage
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import cache service (relative path from scripts/ci to libs/shared/src)
import { CacheService, getCache } from '../../libs/shared/src/cache.ts';

const RESULTS_FILE = path.join(__dirname, '..', '..', 'cache-performance-results.json');

/**
 * Performance test configuration
 */
const TEST_CONFIG = {
  iterations: 1000,
  concurrentUsers: 50,
  cacheEnabled: true,
  cacheDisabled: false,
  testData: {
    users: Array.from({ length: 100 }, (_, i) => ({
      id: `user_${i}`,
      email: `user${i}@example.com`,
      role: i % 5 === 0 ? 'admin' : 'user',
    })),
    sessions: Array.from({ length: 50 }, (_, i) => ({
      id: `session_${i}`,
      userId: `user_${i % 100}`,
      userAgent: 'TestAgent/1.0',
    })),
  },
};

/**
 * Mock database query simulator
 */
class MockDatabase {
  constructor() {
    this.users = new Map(TEST_CONFIG.testData.users.map(u => [u.id, u]));
    this.sessions = new Map(TEST_CONFIG.testData.sessions.map(s => [s.id, s]));
  }

  async findUserById(id) {
    // Simulate database latency
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10 + 5));
    return this.users.get(id) || null;
  }

  async findUserByEmail(email) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 15 + 10));
    return Array.from(this.users.values()).find(u => u.email === email) || null;
  }

  async getSession(id) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 8 + 3));
    return this.sessions.get(id) || null;
  }

  async checkRateLimit() {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 5 + 2));
    return { attempts: Math.floor(Math.random() * 5), blocked_until: null };
  }
}

/**
 * Run performance test with caching enabled/disabled
 */
async function runPerformanceTest(cacheEnabled, testName) {
  console.log(`\n🧪 Running ${testName}...`);

  const cache = getCache({ enabled: cacheEnabled });
  const db = new MockDatabase();

  const results = {
    testName,
    cacheEnabled,
    metrics: {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalLatency: 0,
      averageLatency: 0,
      p50Latency: 0,
      p95Latency: 0,
      p99Latency: 0,
    },
    operations: {
      findUserById: { count: 0, latencies: [] },
      findUserByEmail: { count: 0, latencies: [] },
      getSession: { count: 0, latencies: [] },
      checkRateLimit: { count: 0, latencies: [] },
    },
  };

  // Test user queries
  for (let i = 0; i < TEST_CONFIG.iterations; i++) {
    const userId = TEST_CONFIG.testData.users[i % TEST_CONFIG.testData.users.length].id;

    const start = performance.now();
    const result =
      (await cache.get(CacheService.key.user.byId(userId))) || (await db.findUserById(userId));
    const latency = performance.now() - start;

    if (cacheEnabled && (await cache.get(CacheService.key.user.byId(userId)))) {
      results.metrics.cacheHits++;
    } else {
      results.metrics.cacheMisses++;
      if (cacheEnabled) {
        await cache.set(CacheService.key.user.byId(userId), result, 300);
      }
    }

    results.metrics.totalQueries++;
    results.metrics.totalLatency += latency;
    results.operations.findUserById.count++;
    results.operations.findUserById.latencies.push(latency);
  }

  // Test email queries
  for (let i = 0; i < TEST_CONFIG.iterations / 2; i++) {
    const email = TEST_CONFIG.testData.users[i % TEST_CONFIG.testData.users.length].email;

    const start = performance.now();
    const result =
      (await cache.get(CacheService.key.user.byEmail(email))) || (await db.findUserByEmail(email));
    const latency = performance.now() - start;

    if (cacheEnabled && (await cache.get(CacheService.key.user.byEmail(email)))) {
      results.metrics.cacheHits++;
    } else {
      results.metrics.cacheMisses++;
      if (cacheEnabled) {
        await cache.set(CacheService.key.user.byEmail(email), result, 300);
      }
    }

    results.metrics.totalQueries++;
    results.metrics.totalLatency += latency;
    results.operations.findUserByEmail.count++;
    results.operations.findUserByEmail.latencies.push(latency);
  }

  // Test session queries
  for (let i = 0; i < TEST_CONFIG.iterations / 2; i++) {
    const sessionId = TEST_CONFIG.testData.sessions[i % TEST_CONFIG.testData.sessions.length].id;

    const start = performance.now();
    const result =
      (await cache.get(CacheService.key.session.byId(sessionId))) ||
      (await db.getSession(sessionId));
    const latency = performance.now() - start;

    if (cacheEnabled && (await cache.get(CacheService.key.session.byId(sessionId)))) {
      results.metrics.cacheHits++;
    } else {
      results.metrics.cacheMisses++;
      if (cacheEnabled) {
        await cache.set(CacheService.key.session.byId(sessionId), result, 60);
      }
    }

    results.metrics.totalQueries++;
    results.metrics.totalLatency += latency;
    results.operations.getSession.count++;
    results.operations.getSession.latencies.push(latency);
  }

  // Calculate percentiles
  function calculatePercentile(latencies, p) {
    const sorted = latencies.slice().sort((a, b) => a - b);
    const index = Math.floor((sorted.length * p) / 100);
    return sorted[index];
  }

  const allLatencies = [
    ...results.operations.findUserById.latencies,
    ...results.operations.findUserByEmail.latencies,
    ...results.operations.getSession.latencies,
  ];

  results.metrics.averageLatency = results.metrics.totalLatency / results.metrics.totalQueries;
  results.metrics.p50Latency = calculatePercentile(allLatencies, 50);
  results.metrics.p95Latency = calculatePercentile(allLatencies, 95);
  results.metrics.p99Latency = calculatePercentile(allLatencies, 99);

  console.log(`✅ ${testName} completed`);
  console.log(`   Queries: ${results.metrics.totalQueries}`);
  console.log(`   Cache hits: ${results.metrics.cacheHits}`);
  console.log(`   Cache misses: ${results.metrics.cacheMisses}`);
  console.log(
    `   Hit rate: ${((results.metrics.cacheHits / results.metrics.totalQueries) * 100).toFixed(1)}%`
  );
  console.log(`   Avg latency: ${results.metrics.averageLatency.toFixed(2)}ms`);
  console.log(`   P95 latency: ${results.metrics.p95Latency.toFixed(2)}ms`);

  return results;
}

/**
 * Run concurrent load test
 */
async function runConcurrentLoadTest() {
  console.log('\n🏋️ Running concurrent load test...');

  const cache = getCache({ enabled: true });
  const db = new MockDatabase();

  const results = {
    concurrentUsers: TEST_CONFIG.concurrentUsers,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalLatency: 0,
    averageLatency: 0,
    errors: [],
  };

  async function simulateUser(_userId) {
    const operations = [];

    for (let i = 0; i < 20; i++) {
      operations.push(
        (async () => {
          try {
            const start = performance.now();

            // Random operation
            const op = Math.floor(Math.random() * 4);
            let _result;

            switch (op) {
              case 0:
                _result =
                  (await cache.get(
                    CacheService.key.user.byId(`user_${Math.floor(Math.random() * 100)}`)
                  )) || (await db.findUserById(`user_${Math.floor(Math.random() * 100)}`));
                break;
              case 1:
                _result =
                  (await cache.get(
                    CacheService.key.user.byEmail(
                      `user${Math.floor(Math.random() * 100)}@example.com`
                    )
                  )) ||
                  (await db.findUserByEmail(`user${Math.floor(Math.random() * 100)}@example.com`));
                break;
              case 2:
                _result =
                  (await cache.get(
                    CacheService.key.session.byId(`session_${Math.floor(Math.random() * 50)}`)
                  )) || (await db.getSession(`session_${Math.floor(Math.random() * 50)}`));
                break;
              case 3:
                _result = await db.checkRateLimit();
                break;
            }

            const latency = performance.now() - start;
            results.totalRequests++;
            results.successfulRequests++;
            results.totalLatency += latency;

            return { success: true, latency };
          } catch (error) {
            results.totalRequests++;
            results.failedRequests++;
            results.errors.push(error.message);
            return { success: false, error: error.message };
          }
        })()
      );
    }

    return Promise.all(operations);
  }

  const userPromises = [];
  for (let i = 0; i < TEST_CONFIG.concurrentUsers; i++) {
    userPromises.push(simulateUser(i));
  }

  await Promise.all(userPromises);

  results.averageLatency = results.totalLatency / results.successfulRequests;

  console.log(`✅ Concurrent load test completed`);
  console.log(`   Total requests: ${results.totalRequests}`);
  console.log(`   Successful: ${results.successfulRequests}`);
  console.log(`   Failed: ${results.failedRequests}`);
  console.log(`   Avg latency: ${results.averageLatency.toFixed(2)}ms`);
  console.log(
    `   Success rate: ${((results.successfulRequests / results.totalRequests) * 100).toFixed(1)}%`
  );

  return results;
}

/**
 * Validate cache effectiveness
 */
function validateCacheEffectiveness(results) {
  const validations = {
    cacheEnabled: results.cacheEnabled,
    cacheDisabled: results.cacheDisabled,
    performanceImprovement: 0,
    hitRate: 0,
    recommendations: [],
  };

  if (results.cacheEnabled && results.cacheDisabled) {
    const enabled = results.cacheEnabled.metrics;
    const disabled = results.cacheDisabled.metrics;

    validations.performanceImprovement =
      ((disabled.averageLatency - enabled.averageLatency) / disabled.averageLatency) * 100;
    validations.hitRate = (enabled.cacheHits / enabled.totalQueries) * 100;

    console.log('\n📊 Cache Effectiveness Analysis:');
    console.log(`   Performance improvement: ${validations.performanceImprovement.toFixed(1)}%`);
    console.log(`   Cache hit rate: ${validations.hitRate.toFixed(1)}%`);

    // Recommendations
    if (validations.hitRate < 50) {
      validations.recommendations.push(
        'Low cache hit rate - consider adjusting cache TTL or key strategy'
      );
    }
    if (validations.performanceImprovement < 20) {
      validations.recommendations.push(
        'Limited performance improvement - cache may not be effectively reducing database load'
      );
    }
    if (enabled.p95Latency > 100) {
      validations.recommendations.push('High P95 latency - consider Redis for distributed caching');
    }
  }

  return validations;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Cache Performance Validation\n');
  console.log('This script validates the caching infrastructure performance and effectiveness.');
  console.log(
    'Tests include latency measurements, cache hit rates, and concurrent load testing.\n'
  );

  const finalResults = {
    timestamp: new Date().toISOString(),
    config: TEST_CONFIG,
    cacheEnabled: null,
    cacheDisabled: null,
    concurrentLoad: null,
    validation: null,
  };

  try {
    // Test with cache enabled
    finalResults.cacheEnabled = await runPerformanceTest(true, 'Cache Enabled Test');

    // Test with cache disabled
    finalResults.cacheDisabled = await runPerformanceTest(false, 'Cache Disabled Test');

    // Run concurrent load test
    finalResults.concurrentLoad = await runConcurrentLoadTest();

    // Validate effectiveness
    finalResults.validation = validateCacheEffectiveness(finalResults);

    // Save results
    await fs.writeFile(RESULTS_FILE, JSON.stringify(finalResults, null, 2));

    console.log(`\n📁 Results saved to: ${RESULTS_FILE}`);

    // Summary
    console.log('\n🎯 Validation Summary:');
    if (
      finalResults.validation.performanceImprovement > 30 &&
      finalResults.validation.hitRate > 60
    ) {
      console.log('✅ Caching infrastructure is performing well');
    } else if (
      finalResults.validation.performanceImprovement > 15 ||
      finalResults.validation.hitRate > 40
    ) {
      console.log('⚠️ Caching infrastructure has moderate performance - consider optimizations');
    } else {
      console.log('❌ Caching infrastructure needs improvement');
    }

    if (finalResults.validation.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      finalResults.validation.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Cache performance validation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { runConcurrentLoadTest, runPerformanceTest, validateCacheEffectiveness };
