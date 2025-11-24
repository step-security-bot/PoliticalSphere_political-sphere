/**
 * Observability Library
 *
 * Comprehensive monitoring and observability utilities for the application.
 * Includes metrics collection, error tracking, logging, and health checks.
 */

export * from './metrics';
export * from './health';
export * from './error-tracking';
export * from './logging';
export * from './alerting';
export * from './compliance';

// Re-export types
export type { HealthCheckResult, HealthStatus } from './types';

// Re-export specific functions for app.ts compatibility
export {
  getHealthCheckService,
  createDatabaseHealthCheck,
  createSystemResourceHealthCheck,
} from './health';

export { getErrorTracker, initializeErrorTracking } from './error-tracking';

export { initializeMetrics } from './metrics';

export { initializeLogging } from './logging';
