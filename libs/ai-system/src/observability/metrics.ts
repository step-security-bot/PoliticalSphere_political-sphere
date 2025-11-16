/**
 * Metrics Collection
 *
 * SLI/SLO tracking for AI systems with Prometheus export.
 *
 * @module observability/metrics
 */

import type { SLOMetrics } from '../types';

/**
 * Metric data point
 */
interface MetricDataPoint {
  timestamp: Date;
  value: number;
  labels?: Record<string, string>;
}

/**
 * Histogram data
 */
interface HistogramData {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50?: number;
  p95?: number;
  p99?: number;
  values: number[];
}

/**
 * SLO definition
 */
interface SLODefinition {
  target: number;
  threshold: number;
  window: string;
}

/**
 * SLO status
 */
interface SLOStatus {
  compliant: boolean;
  successRate: number;
  target: number;
}

/**
 * Metrics report
 */
interface MetricsReport {
  counters: Record<string, Record<string, number>>;
  gauges: Record<string, number>;
  histograms: Record<string, HistogramData>;
}

/**
 * Metrics Collector
 *
 * Collects and aggregates metrics for monitoring and observability.
 */
export class MetricsCollector {
  private metrics: Map<string, MetricDataPoint[]> = new Map();
  private counters: Map<string, Map<string, number>> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private slos: Map<string, SLODefinition> = new Map();
  private sliData: Map<string, number[]> = new Map();
  private serviceName: string;

  constructor(serviceName: string = 'default') {
    this.serviceName = serviceName;
  }

  /**
   * Record metric (legacy method for compatibility)
   */
  record(name: string, value: number, labels?: Record<string, string>): void {
    const dataPoint: MetricDataPoint = {
      timestamp: new Date(),
      value,
      labels,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    this.metrics.get(name)!.push(dataPoint);
    this.exportMetric(name, dataPoint);
  }

  /**
   * Record latency metric
   */
  recordLatency(service: string, durationMs: number): void {
    this.record(`latency_${service}`, durationMs);
  }

  /**
   * Record error
   */
  recordError(service: string): void {
    this.record('errors_total', 1, { service });
  }

  /**
   * Record success
   */
  recordSuccess(service: string): void {
    this.record('successes_total', 1, { service });
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, labels: Record<string, string> = {}): void {
    if (!this.counters.has(name)) {
      this.counters.set(name, new Map());
    }

    const labelKey =
      Object.entries(labels)
        .map(([k, v]) => `${k}:${v}`)
        .join(',') || 'default';

    const counterMap = this.counters.get(name)!;
    counterMap.set(labelKey, (counterMap.get(labelKey) || 0) + 1);
  }

  /**
   * Set a gauge metric
   */
  setGauge(name: string, value: number): void {
    this.gauges.set(name, value);
  }

  /**
   * Record a histogram value
   */
  recordHistogram(name: string, value: number): void {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, []);
    }
    this.histograms.get(name)!.push(value);
  }

  /**
   * Define an SLO
   */
  defineSLO(name: string, definition: SLODefinition): void {
    this.slos.set(name, definition);
    this.sliData.set(name, []);
  }

  /**
   * Record an SLI measurement
   */
  recordSLI(name: string, value: number): void {
    if (!this.sliData.has(name)) {
      this.sliData.set(name, []);
    }
    this.sliData.get(name)!.push(value);
  }

  /**
   * Check SLO compliance
   */
  checkSLO(name: string): SLOStatus {
    const slo = this.slos.get(name);
    const data = this.sliData.get(name) || [];

    if (!slo) {
      throw new Error(`SLO "${name}" not defined`);
    }

    const successCount = data.filter(v => v <= slo.target).length;
    const successRate = data.length > 0 ? successCount / data.length : 1.0;

    return {
      compliant: successRate >= slo.threshold,
      successRate,
      target: slo.threshold,
    };
  }

  /**
   * Get all metrics as a report
   */
  getMetrics(): MetricsReport {
    const report: MetricsReport = {
      counters: {},
      gauges: {},
      histograms: {},
    };

    // Counters
    this.counters.forEach((labelMap, name) => {
      report.counters[name] = {};
      labelMap.forEach((count, labelKey) => {
        report.counters[name][labelKey] = count;
      });
    });

    // Gauges
    this.gauges.forEach((value, name) => {
      report.gauges[name] = value;
    });

    // Histograms
    this.histograms.forEach((values, name) => {
      if (values.length === 0) {
        return;
      }

      const sorted = [...values].sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);

      const percentile = (p: number): number => {
        const index = Math.ceil(sorted.length * p) - 1;
        return sorted[Math.max(0, index)] || 0;
      };

      report.histograms[name] = {
        count: values.length,
        sum,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: sum / values.length,
        p50: percentile(0.5),
        p95: percentile(0.95),
        p99: percentile(0.99),
        values: sorted,
      };
    });

    return report;
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus(): string {
    const lines: string[] = [];

    // Counters
    this.counters.forEach((labelMap, name) => {
      lines.push(`# TYPE ${name} counter`);
      labelMap.forEach((count, labelKey) => {
        if (labelKey === 'default') {
          lines.push(`${name} ${count}`);
        } else {
          const labels = labelKey
            .split(',')
            .map(kv => {
              const [k, v] = kv.split(':');
              return `${k}="${v}"`;
            })
            .join(',');
          lines.push(`${name}{${labels}} ${count}`);
        }
      });
    });

    // Gauges
    this.gauges.forEach((value, name) => {
      lines.push(`# TYPE ${name} gauge`);
      lines.push(`${name} ${value}`);
    });

    // Histograms
    this.histograms.forEach((values, name) => {
      if (values.length === 0) return;

      lines.push(`# TYPE ${name} histogram`);
      const sum = values.reduce((a, b) => a + b, 0);
      lines.push(`${name}_sum ${sum}`);
      lines.push(`${name}_count ${values.length}`);
    });

    return lines.join('\n');
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.sliData.clear();
  }

  /**
   * Calculate SLO metrics (legacy method for compatibility)
   */
  calculateSLO(service: string, windowMs: number = 3600000): SLOMetrics {
    const windowStart = new Date(Date.now() - windowMs);

    const getMetricsInWindow = (name: string): MetricDataPoint[] => {
      const allMetrics = this.metrics.get(name) || [];
      return allMetrics.filter(m => m.timestamp >= windowStart);
    };

    const successes = getMetricsInWindow('successes_total');
    const errors = getMetricsInWindow('errors_total');
    const total = successes.length + errors.length;
    const availability = total > 0 ? successes.length / total : 1.0;

    // Calculate latency percentiles
    const latencies = getMetricsInWindow(`latency_${service}`)
      .map(d => d.value)
      .sort((a, b) => a - b);

    const percentile = (arr: number[], p: number) => {
      if (arr.length === 0) return 0;
      const index = Math.ceil(arr.length * p) - 1;
      return arr[index] || 0;
    };

    const latency = {
      p50: percentile(latencies, 0.5),
      p95: percentile(latencies, 0.95),
      p99: percentile(latencies, 0.99),
    };

    // Calculate error rate
    const errorRate = total > 0 ? errors.length / total : 0;

    return {
      service,
      availability,
      latency,
      errorRate,
      window: {
        start: windowStart,
        end: new Date(),
      },
    };
  }

  /**
   * Export metric (placeholder for Prometheus)
   */
  private exportMetric(name: string, dataPoint: MetricDataPoint): void {
    // In production, this would push to Prometheus/Grafana
    // For now, just log to console
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[METRIC] ${name}:`, {
        value: dataPoint.value,
        labels: dataPoint.labels,
        timestamp: dataPoint.timestamp.toISOString(),
      });
    }
  }

  /**
   * Get error budget status
   */
  getErrorBudget(
    service: string,
    targetAvailability: number = 0.999
  ): {
    budget: number;
    consumed: number;
    remaining: number;
    percentConsumed: number;
  } {
    const slo = this.calculateSLO(service);
    const actualAvailability = slo.availability;

    // Error budget = 1 - target availability
    // e.g., 99.9% availability = 0.1% error budget
    const budget = 1 - targetAvailability;
    const consumed = 1 - actualAvailability;
    const remaining = Math.max(0, budget - consumed);
    const percentConsumed = budget > 0 ? (consumed / budget) * 100 : 0;

    return {
      budget,
      consumed,
      remaining,
      percentConsumed,
    };
  }
}

/**
 * Global metrics collector
 */
export const metrics = new MetricsCollector();
