/**
 * Validation performance benchmark script.
 * Measures schema parse time for each route's validation schemas.
 *
 * Run: node apps/api/src/benchmarks/validation-performance.mjs
 */

import { performance } from 'node:perf_hooks';

// Import schemas from shared-shim
import {
  AnalyzeContentSchema,
  CompleteVerificationSchema,
  CreateNewsSchema,
  CreateReportSchema,
  InitiateVerificationSchema,
  ReviewContentSchema,
  UpdateNewsSchema,
} from '../utils/shared-shim.js';

// Create additional schemas not in shared-shim
const ComplianceEventSchema = {
  parse(data) {
    if (!data || typeof data !== 'object') throw new Error('Input must be an object');
    if (!data.category) throw new Error('Missing required field: category');
    if (!data.action) throw new Error('Missing required field: action');
    return data;
  },
};

const BreachNotificationSchema = {
  parse(data) {
    if (!data || typeof data !== 'object') throw new Error('Input must be an object');
    const required = ['date', 'time', 'categories', 'approximateNumber'];
    for (const field of required) {
      if (!data[field]) throw new Error(`Missing required field: ${field}`);
    }
    return data;
  },
};

// Test data for benchmarking
const testData = {
  news: {
    create: {
      title: 'Test News Article',
      content: 'This is a test article for benchmarking validation performance.',
      category: 'politics',
      tags: ['test', 'benchmark'],
      author: 'benchmark-user',
    },
    update: {
      title: 'Updated Title',
      content: 'Updated content for benchmark testing.',
    },
  },
  moderation: {
    analyze: { content: 'Sample content for moderation analysis' },
    report: {
      contentId: '123',
      reason: 'spam',
      description: 'Benchmark report',
    },
    review: {
      decision: 'approved',
      reviewerId: 'reviewer-123',
    },
  },
  ageVerification: {
    initiate: { method: 'document', userId: 'user-123' },
    verify: {
      verificationId: 'verify-123',
      token: 'token-abc',
    },
  },
  compliance: {
    event: { category: 'data_access', action: 'user_login' },
    breach: {
      date: '2025-11-16',
      time: '14:30',
      categories: ['personal_data'],
      approximateNumber: 100,
    },
  },
};

// Create schemas
const schemas = {
  CreateNewsSchema,
  UpdateNewsSchema,
  AnalyzeContentSchema,
  CreateReportSchema,
  ReviewContentSchema,
  InitiateVerificationSchema,
  CompleteVerificationSchema,
  ComplianceEventSchema,
  BreachNotificationSchema,
};

/**
 * Benchmark a schema parse operation.
 *
 * @param {string} name - Schema name
 * @param {Function} schema - Zod schema
 * @param {unknown} data - Test data
 * @param {number} iterations - Number of iterations
 * @returns {object} Benchmark results
 */
function benchmarkSchema(name, schema, data, iterations = 10000) {
  const times = [];

  // Warmup
  for (let i = 0; i < 100; i++) {
    try {
      schema.parse(data);
    } catch {
      // Ignore validation errors during warmup
    }
  }

  // Actual benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      schema.parse(data);
    } catch {
      // Ignore validation errors
    }
    const end = performance.now();
    times.push(end - start);
  }

  // Calculate statistics
  times.sort((a, b) => a - b);
  const sum = times.reduce((acc, t) => acc + t, 0);
  const avg = sum / times.length;
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];
  const min = times[0];
  const max = times[times.length - 1];

  return {
    name,
    iterations,
    avg: parseFloat(avg.toFixed(4)),
    p50: parseFloat(p50.toFixed(4)),
    p95: parseFloat(p95.toFixed(4)),
    p99: parseFloat(p99.toFixed(4)),
    min: parseFloat(min.toFixed(4)),
    max: parseFloat(max.toFixed(4)),
  };
}

/**
 * Run all validation benchmarks.
 */
function runBenchmarks() {
  console.log('🔬 Validation Performance Benchmark');
  console.log('====================================\n');

  const results = [
    benchmarkSchema('CreateNewsSchema', schemas.CreateNewsSchema, testData.news.create),
    benchmarkSchema('UpdateNewsSchema', schemas.UpdateNewsSchema, testData.news.update),
    benchmarkSchema(
      'AnalyzeContentSchema',
      schemas.AnalyzeContentSchema,
      testData.moderation.analyze
    ),
    benchmarkSchema('CreateReportSchema', schemas.CreateReportSchema, testData.moderation.report),
    benchmarkSchema('ReviewContentSchema', schemas.ReviewContentSchema, testData.moderation.review),
    benchmarkSchema(
      'InitiateVerificationSchema',
      schemas.InitiateVerificationSchema,
      testData.ageVerification.initiate
    ),
    benchmarkSchema(
      'CompleteVerificationSchema',
      schemas.CompleteVerificationSchema,
      testData.ageVerification.verify
    ),
    benchmarkSchema(
      'ComplianceEventSchema',
      schemas.ComplianceEventSchema,
      testData.compliance.event
    ),
    benchmarkSchema(
      'BreachNotificationSchema',
      schemas.BreachNotificationSchema,
      testData.compliance.breach
    ),
  ];

  // Print results table
  console.log(
    'Schema                          Iterations    Avg (ms)    P50 (ms)    P95 (ms)    P99 (ms)'
  );
  console.log('─'.repeat(95));

  for (const result of results) {
    const name = result.name.padEnd(30);
    const iterations = result.iterations.toString().padStart(10);
    const avg = result.avg.toFixed(4).padStart(10);
    const p50 = result.p50.toFixed(4).padStart(10);
    const p95 = result.p95.toFixed(4).padStart(10);
    const p99 = result.p99.toFixed(4).padStart(10);

    console.log(`${name}  ${iterations}  ${avg}  ${p50}  ${p95}  ${p99}`);
  }

  console.log('\n📊 Summary:');
  const avgTotal = results.reduce((sum, r) => sum + r.avg, 0) / results.length;
  const p95Total = results.reduce((sum, r) => sum + r.p95, 0) / results.length;
  console.log(`  Average parse time (all schemas): ${avgTotal.toFixed(4)}ms`);
  console.log(`  Average P95 (all schemas): ${p95Total.toFixed(4)}ms`);

  console.log('\n✅ Performance baseline established');
  console.log('   Add results to docs/COMPREHENSIVE-TESTING-REPORT.md');
}

// Run benchmarks
runBenchmarks();
