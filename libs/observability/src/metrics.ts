/**
 * Application Metrics Collection
 *
 * Uses Prometheus client to collect and expose application metrics.
 */

import { register, collectDefaultMetrics, Gauge, Counter, Histogram } from 'prom-client';
import type { MetricsConfig } from './types.js';

class MetricsCollector {
  private config: Required<MetricsConfig>;
  private initialized = false;

  // Application metrics
  public httpRequestsTotal!: Counter<string>;
  public httpRequestDuration!: Histogram<string>;
  public activeConnections!: Gauge<string>;
  public databaseConnections!: Gauge<string>;
  public cacheHits!: Counter<string>;
  public cacheMisses!: Counter<string>;
  public businessLogicErrors!: Counter<string>;
  public externalApiCalls!: Counter<string>;
  public externalApiErrors!: Counter<string>;
  public memoryUsage!: Gauge<string>;
  public cpuUsage!: Gauge<string>;

  constructor(config: MetricsConfig = {}) {
    this.config = {
      prefix: config.prefix || 'political_sphere',
      labels: config.labels || { service: 'api' },
      collectDefaultMetrics: config.collectDefaultMetrics ?? true,
    };

    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    if (this.initialized) return;

    const { prefix } = this.config;

    // HTTP metrics
    this.httpRequestsTotal = new Counter({
      name: `${prefix}_http_requests_total`,
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [register],
    });

    this.httpRequestDuration = new Histogram({
      name: `${prefix}_http_request_duration_seconds`,
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2.5, 5, 10],
      registers: [register],
    });

    // Connection metrics
    this.activeConnections = new Gauge({
      name: `${prefix}_active_connections`,
      help: 'Number of active connections',
      registers: [register],
    });

    this.databaseConnections = new Gauge({
      name: `${prefix}_database_connections_active`,
      help: 'Number of active database connections',
      registers: [register],
    });

    // Cache metrics
    this.cacheHits = new Counter({
      name: `${prefix}_cache_hits_total`,
      help: 'Total number of cache hits',
      labelNames: ['cache_type'],
      registers: [register],
    });

    this.cacheMisses = new Counter({
      name: `${prefix}_cache_misses_total`,
      help: 'Total number of cache misses',
      labelNames: ['cache_type'],
      registers: [register],
    });

    // Error metrics
    this.businessLogicErrors = new Counter({
      name: `${prefix}_business_logic_errors_total`,
      help: 'Total number of business logic errors',
      labelNames: ['error_type', 'component'],
      registers: [register],
    });

    // External API metrics
    this.externalApiCalls = new Counter({
      name: `${prefix}_external_api_calls_total`,
      help: 'Total number of external API calls',
      labelNames: ['service', 'method', 'status'],
      registers: [register],
    });

    this.externalApiErrors = new Counter({
      name: `${prefix}_external_api_errors_total`,
      help: 'Total number of external API errors',
      labelNames: ['service', 'error_type'],
      registers: [register],
    });

    // System metrics
    this.memoryUsage = new Gauge({
      name: `${prefix}_memory_usage_bytes`,
      help: 'Application memory usage in bytes',
      registers: [register],
    });

    this.cpuUsage = new Gauge({
      name: `${prefix}_cpu_usage_percent`,
      help: 'Application CPU usage percentage',
      registers: [register],
    });

    // Collect default Node.js metrics
    if (this.config.collectDefaultMetrics) {
      collectDefaultMetrics({
        prefix: `${prefix}_nodejs_`,
        register,
      });
    }

    this.initialized = true;
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    this.httpRequestsTotal.inc({ method, route, status_code: statusCode.toString() });
    this.httpRequestDuration.observe(
      { method, route, status_code: statusCode.toString() },
      duration
    );
  }

  /**
   * Update active connections count
   */
  setActiveConnections(count: number): void {
    this.activeConnections.set(count);
  }

  /**
   * Update database connections count
   */
  setDatabaseConnections(count: number): void {
    this.databaseConnections.set(count);
  }

  /**
   * Record cache hit
   */
  recordCacheHit(cacheType: string): void {
    this.cacheHits.inc({ cache_type: cacheType });
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(cacheType: string): void {
    this.cacheMisses.inc({ cache_type: cacheType });
  }

  /**
   * Record business logic error
   */
  recordBusinessLogicError(errorType: string, component: string): void {
    this.businessLogicErrors.inc({ error_type: errorType, component });
  }

  /**
   * Record external API call
   */
  recordExternalApiCall(service: string, method: string, status: number): void {
    this.externalApiCalls.inc({ service, method, status: status.toString() });
  }

  /**
   * Record external API error
   */
  recordExternalApiError(service: string, errorType: string): void {
    this.externalApiErrors.inc({ service, error_type: errorType });
  }

  /**
   * Update memory usage
   */
  setMemoryUsage(bytes: number): void {
    this.memoryUsage.set(bytes);
  }

  /**
   * Update CPU usage
   */
  setCpuUsage(percentage: number): void {
    this.cpuUsage.set(percentage);
  }

  /**
   * Get metrics registry
   */
  getRegistry(): typeof register {
    return register;
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    register.resetMetrics();
    this.initializeMetrics();
  }
}

// Singleton instance
let metricsInstance: MetricsCollector | null = null;

/**
 * Get or create metrics collector instance
 */
export function getMetricsCollector(config?: MetricsConfig): MetricsCollector {
  if (!metricsInstance) {
    metricsInstance = new MetricsCollector(config);
  }
  return metricsInstance;
}

/**
 * Initialize metrics collection
 */
export function initializeMetrics(config?: MetricsConfig): MetricsCollector {
  return getMetricsCollector(config);
}

export { MetricsCollector };
export default getMetricsCollector;
