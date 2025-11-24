/**
 * Validation metrics tracking and endpoint.
 * Provides observability into schema validation performance.
 *
 * Tests: vitest apps/api/src/routes/validation-metrics.test.mjs
 */

import express from 'express';

// In-memory validation metrics
const validationMetrics: {
  success: number;
  failure: number;
  totalParseTime: number;
  parseCount: number;
  routeMetrics: Map<
    string,
    { success: number; failure: number; totalParseTime: number; parseCount: number }
  >;
} = {
  success: 0,
  failure: 0,
  totalParseTime: 0, // in milliseconds
  parseCount: 0,
  routeMetrics: new Map(),
};

/**
 * Record a validation attempt with timing.
 *
 * Tracks global and per-route validation success/failure counts and aggregate
 * parse time to support debugging and performance monitoring of schema validation.
 *
 * @param route - Route identifier (e.g., 'POST /api/news')
 * @param success - Whether validation succeeded
 * @param duration - Parse time in milliseconds
 */
export function recordValidation(route: string, success: boolean, duration = 0) {
  // Update global metrics
  if (success) {
    validationMetrics.success++;
  } else {
    validationMetrics.failure++;
  }

  validationMetrics.totalParseTime += duration;
  validationMetrics.parseCount++;

  // Update per-route metrics
  const routeKey = route;
  const existing = validationMetrics.routeMetrics.get(routeKey) || {
    success: 0,
    failure: 0,
    totalParseTime: 0,
    parseCount: 0,
  };

  validationMetrics.routeMetrics.set(routeKey, {
    success: existing.success + (success ? 1 : 0),
    failure: existing.failure + (success ? 0 : 1),
    totalParseTime: existing.totalParseTime + duration,
    parseCount: existing.parseCount + 1,
  });
}

/**
 * Get current validation metrics.
 *
 * @returns {object} Metrics summary
 */
export function getValidationMetrics() {
  const totalRequests = validationMetrics.success + validationMetrics.failure;
  const avgParseTime =
    validationMetrics.parseCount > 0
      ? validationMetrics.totalParseTime / validationMetrics.parseCount
      : 0;

  const routeStats: Record<
    string,
    { total: number; success: number; failure: number; successRate: number; avgParseTime: number }
  > = {};
  for (const [route, stats] of validationMetrics.routeMetrics.entries()) {
    const routeTotal = stats.success + stats.failure;
    routeStats[route] = {
      total: routeTotal,
      success: stats.success,
      failure: stats.failure,
      successRate: routeTotal > 0 ? (stats.success / routeTotal) * 100 : 0,
      avgParseTime: stats.parseCount > 0 ? stats.totalParseTime / stats.parseCount : 0,
    };
  }

  return {
    global: {
      totalRequests,
      success: validationMetrics.success,
      failure: validationMetrics.failure,
      successRate: totalRequests > 0 ? (validationMetrics.success / totalRequests) * 100 : 0,
      avgParseTime,
    },
    routes: routeStats,
  };
}

/**
 * Reset all validation metrics (useful for testing).
 */
export function resetValidationMetrics() {
  validationMetrics.success = 0;
  validationMetrics.failure = 0;
  validationMetrics.totalParseTime = 0;
  validationMetrics.parseCount = 0;
  validationMetrics.routeMetrics.clear();
}

/**
 * Create validation metrics router.
 *
 * @returns {express.Router} Express router with /metrics/validation endpoint
 */
export function createValidationMetricsRouter() {
  const router = express.Router();

  // GET /metrics/validation - Retrieve validation metrics
  router.get('/metrics/validation', (_req, res) => {
    const metrics = getValidationMetrics();
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
