/**
 * Performance Monitoring Module
 * Implements SLI/SLO tracking and performance metrics
 */

// TODO: Temporarily disable Pino logger to fix startup issues
// import { getLogger } from './logger-pino.js';
// const logger = getLogger({ service: 'performance' });
const logger = console;

/**
 * Service Level Indicators (SLIs)
 */
export interface SLI {
  /** Request latency percentiles (ms) */
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  /** Error rate (percentage) */
  errorRate: number;
  /** Availability (percentage) */
  availability: number;
  /** Throughput (requests per second) */
  throughput: number;
}

/**
 * Service Level Objectives (SLOs)
 */
export interface SLO {
  /** Maximum acceptable p95 latency (ms) */
  maxLatencyP95: number;
  /** Maximum acceptable p99 latency (ms) */
  maxLatencyP99: number;
  /** Maximum acceptable error rate (percentage) */
  maxErrorRate: number;
  /** Minimum acceptable availability (percentage) */
  minAvailability: number;
}

/**
 * Default SLOs for API endpoints
 */
export const DEFAULT_SLO: SLO = {
  maxLatencyP95: 200, // 200ms
  maxLatencyP99: 500, // 500ms
  maxErrorRate: 0.1, // 0.1%
  minAvailability: 99.9, // 99.9%
};

/**
 * Performance metrics store
 */
interface PerformanceMetrics {
  requestCount: number;
  errorCount: number;
  latencies: number[];
  startTime: number;
  lastReset: number;
}

const metrics: Map<string, PerformanceMetrics> = new Map();

/**
 * Initialize metrics for an endpoint
 */
function initMetrics(_endpoint: string): PerformanceMetrics {
  const now = Date.now();
  return {
    requestCount: 0,
    errorCount: 0,
    latencies: [],
    startTime: now,
    lastReset: now,
  };
}

/**
 * Get or create metrics for an endpoint
 */
function getMetrics(endpoint: string): PerformanceMetrics {
  let endpointMetrics = metrics.get(endpoint);
  if (!endpointMetrics) {
    endpointMetrics = initMetrics(endpoint);
    metrics.set(endpoint, endpointMetrics);
  }
  return endpointMetrics;
}

/**
 * Record request latency
 */
export function recordLatency(endpoint: string, latencyMs: number, isError = false): void {
  const endpointMetrics = getMetrics(endpoint);

  endpointMetrics.requestCount++;
  if (isError) {
    endpointMetrics.errorCount++;
  }

  // Keep last 1000 latencies for percentile calculation
  endpointMetrics.latencies.push(latencyMs);
  if (endpointMetrics.latencies.length > 1000) {
    endpointMetrics.latencies.shift();
  }
}

/**
 * Calculate percentile from sorted array
 */
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)] ?? 0;
}

/**
 * Calculate SLI for an endpoint
 */
export function calculateSLI(endpoint: string): SLI {
  const endpointMetrics = getMetrics(endpoint);

  const errorRate =
    endpointMetrics.requestCount > 0
      ? (endpointMetrics.errorCount / endpointMetrics.requestCount) * 100
      : 0;

  const availability = 100 - errorRate;

  const durationSeconds = (Date.now() - endpointMetrics.startTime) / 1000;
  const throughput = durationSeconds > 0 ? endpointMetrics.requestCount / durationSeconds : 0;

  return {
    latencyP50: percentile(endpointMetrics.latencies, 50),
    latencyP95: percentile(endpointMetrics.latencies, 95),
    latencyP99: percentile(endpointMetrics.latencies, 99),
    errorRate,
    availability,
    throughput,
  };
}

/**
 * Check if endpoint is meeting SLO
 */
export function checkSLO(
  endpoint: string,
  slo: SLO = DEFAULT_SLO
): {
  passing: boolean;
  violations: string[];
  sli: SLI;
} {
  const sli = calculateSLI(endpoint);
  const violations: string[] = [];

  if (sli.latencyP95 > slo.maxLatencyP95) {
    violations.push(`P95 latency ${sli.latencyP95}ms exceeds ${slo.maxLatencyP95}ms`);
  }

  if (sli.latencyP99 > slo.maxLatencyP99) {
    violations.push(`P99 latency ${sli.latencyP99}ms exceeds ${slo.maxLatencyP99}ms`);
  }

  if (sli.errorRate > slo.maxErrorRate) {
    violations.push(`Error rate ${sli.errorRate.toFixed(2)}% exceeds ${slo.maxErrorRate}%`);
  }

  if (sli.availability < slo.minAvailability) {
    violations.push(`Availability ${sli.availability.toFixed(2)}% below ${slo.minAvailability}%`);
  }

  if (violations.length > 0) {
    logger.warn('SLO violations detected', {
      endpoint,
      violations,
      sli,
      slo,
    });
  }

  return {
    passing: violations.length === 0,
    violations,
    sli,
  };
}

/**
 * Get all metrics for reporting
 */
export function getAllMetrics(): Record<string, SLI> {
  const result: Record<string, SLI> = {};

  for (const [endpoint, _] of metrics) {
    result[endpoint] = calculateSLI(endpoint);
  }

  return result;
}

/**
 * Reset metrics for an endpoint
 */
export function resetMetrics(endpoint?: string): void {
  if (endpoint) {
    metrics.delete(endpoint);
    logger.info('Metrics reset', { endpoint });
  } else {
    metrics.clear();
    logger.info('All metrics reset');
  }
}

/**
 * Performance middleware for HTTP requests
 */
export function performanceMiddleware(endpoint: string) {
  return {
    start: () => {
      return Date.now();
    },
    end: (startTime: number, isError = false) => {
      const latency = Date.now() - startTime;
      recordLatency(endpoint, latency, isError);

      // Log slow requests (> 1 second)
      if (latency > 1000) {
        logger.warn('Slow request detected', {
          endpoint,
          latency,
          threshold: 1000,
        });
      }

      return latency;
    },
  };
}

/**
 * Start periodic SLO checking
 */
export function startSLOMonitoring(intervalMs = 60000): NodeJS.Timeout {
  const interval = setInterval(() => {
    const allMetrics = getAllMetrics();

    for (const endpoint of Object.keys(allMetrics)) {
      checkSLO(endpoint);
    }
  }, intervalMs);

  logger.info('SLO monitoring started', { intervalMs });

  return interval;
}

/**
 * Stop SLO monitoring
 */
export function stopSLOMonitoring(interval: NodeJS.Timeout): void {
  clearInterval(interval);
  logger.info('SLO monitoring stopped');
}
