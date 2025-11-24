/**
 * Observability Types
 */

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Result from a health check probe
 */
export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  message?: string;
  details?: Record<string, unknown>;
  timestamp: string;
  duration: number;
}

/**
 * Configuration for metric collection and reporting
 */
export interface MetricsConfig {
  prefix?: string;
  labels?: Record<string, string>;
  collectDefaultMetrics?: boolean;
}

/**
 * Configuration for error tracking services (Sentry, Honeycomb, etc.)
 */
export interface ErrorTrackingConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  sampleRate?: number;
}

/**
 * Configuration for logging output and transports
 */
export interface LoggingConfig {
  level?: string;
  format?: 'json' | 'simple';
  transports?: Array<{
    type: 'console' | 'file' | 'http';
    options?: Record<string, unknown>;
  }>;
}

/**
 * Rule for generating alerts based on metric queries and thresholds
 */
export interface AlertRule {
  name: string;
  query: string;
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
  labels?: Record<string, string>;
}
