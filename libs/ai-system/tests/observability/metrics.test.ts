/**
 * Metrics Tracking Tests
 *
 * Tests for SLI/SLO monitoring and performance metrics.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { MetricsCollector } from '../../src/observability/metrics';

describe('MetricsCollector', () => {
  let metrics: MetricsCollector;

  beforeEach(() => {
    metrics = new MetricsCollector('test-service');
  });

  it('should record counter metrics', () => {
    metrics.incrementCounter('requests_total', { method: 'GET' });
    metrics.incrementCounter('requests_total', { method: 'GET' });
    metrics.incrementCounter('requests_total', { method: 'POST' });

    const report = metrics.getMetrics();

    expect(report.counters['requests_total']).toBeDefined();
    expect(report.counters['requests_total']['method:GET']).toBe(2);
    expect(report.counters['requests_total']['method:POST']).toBe(1);
  });

  it('should record gauge metrics', () => {
    metrics.setGauge('memory_usage_bytes', 1024 * 1024 * 100); // 100MB
    metrics.setGauge('active_connections', 42);

    const report = metrics.getMetrics();

    expect(report.gauges['memory_usage_bytes']).toBe(1024 * 1024 * 100);
    expect(report.gauges['active_connections']).toBe(42);
  });

  it('should record histogram metrics', () => {
    // Record response times
    metrics.recordHistogram('request_duration_ms', 150);
    metrics.recordHistogram('request_duration_ms', 200);
    metrics.recordHistogram('request_duration_ms', 100);
    metrics.recordHistogram('request_duration_ms', 300);

    const report = metrics.getMetrics();
    const histogram = report.histograms['request_duration_ms'];

    expect(histogram).toBeDefined();
    expect(histogram.count).toBe(4);
    expect(histogram.sum).toBe(750);
    expect(histogram.min).toBe(100);
    expect(histogram.max).toBe(300);
    expect(histogram.avg).toBe(187.5);
  });

  it('should calculate percentiles for histograms', () => {
    // Record 100 values
    for (let i = 1; i <= 100; i++) {
      metrics.recordHistogram('latency', i);
    }

    const report = metrics.getMetrics();
    const histogram = report.histograms['latency'];

    expect(histogram.p50).toBeCloseTo(50, 0);
    expect(histogram.p95).toBeCloseTo(95, 0);
    expect(histogram.p99).toBeCloseTo(99, 0);
  });

  it('should track SLI/SLO compliance', () => {
    // Define SLO: 95% of requests under 200ms
    metrics.defineSLO('api_latency', {
      target: 200,
      threshold: 0.95,
      window: '30d',
    });

    // Record successful requests
    for (let i = 0; i < 96; i++) {
      metrics.recordSLI('api_latency', 150); // Under threshold
    }

    // Record slow requests
    for (let i = 0; i < 4; i++) {
      metrics.recordSLI('api_latency', 250); // Over threshold
    }

    const sloStatus = metrics.checkSLO('api_latency');

    expect(sloStatus.compliant).toBe(true);
    expect(sloStatus.successRate).toBe(0.96); // 96% under threshold
    expect(sloStatus.target).toBe(0.95);
  });

  it('should detect SLO violations', () => {
    metrics.defineSLO('error_rate', {
      target: 0.01, // Values under 0.01 are successes
      threshold: 0.99, // 99% success required
      window: '1h',
    });

    // 10% success rate (below threshold) - most values over target
    for (let i = 0; i < 10; i++) {
      metrics.recordSLI('error_rate', 0.001); // Success (under target)
    }
    for (let i = 0; i < 90; i++) {
      metrics.recordSLI('error_rate', 0.5); // Failure (over target)
    }

    const sloStatus = metrics.checkSLO('error_rate');

    expect(sloStatus.compliant).toBe(false);
    expect(sloStatus.successRate).toBe(0.1);
  });

  it('should export metrics in Prometheus format', () => {
    metrics.incrementCounter('http_requests_total', { status: '200' });
    metrics.setGauge('cpu_usage_percent', 45.5);
    metrics.recordHistogram('request_duration_seconds', 0.15);

    const prometheusOutput = metrics.exportPrometheus();

    expect(prometheusOutput).toContain('# TYPE http_requests_total counter');
    expect(prometheusOutput).toContain('http_requests_total{status="200"} 1');
    expect(prometheusOutput).toContain('# TYPE cpu_usage_percent gauge');
    expect(prometheusOutput).toContain('cpu_usage_percent 45.5');
    expect(prometheusOutput).toContain('# TYPE request_duration_seconds histogram');
  });

  it('should reset metrics', () => {
    metrics.incrementCounter('test_counter');
    metrics.setGauge('test_gauge', 100);
    metrics.recordHistogram('test_histogram', 50);

    metrics.reset();

    const report = metrics.getMetrics();

    expect(Object.keys(report.counters).length).toBe(0);
    expect(Object.keys(report.gauges).length).toBe(0);
    expect(Object.keys(report.histograms).length).toBe(0);
  });
});
