/**
 * Bias Monitoring Tests
 *
 * Tests for AI bias detection and alerting.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BiasMonitoringSystem, type BiasMetric } from '../../src/governance/bias-monitoring';

describe('BiasMonitoringSystem', () => {
  let monitor: BiasMonitoringSystem;
  const systemId = 'test-ai-system';

  beforeEach(() => {
    monitor = new BiasMonitoringSystem();
    vi.clearAllMocks();
  });

  const createMetric = (biasScore: number, overrides: Partial<BiasMetric> = {}): BiasMetric => ({
    timestamp: new Date(),
    systemId,
    biasScore,
    metrics: {
      sentimentVariance: 0.05,
      keywordBalance: 0.03,
      framingNeutrality: 0.02,
    },
    sampleSize: 1000,
    ...overrides,
  });

  it('should record bias metrics', () => {
    const metric = createMetric(0.05);
    monitor.recordMetric(metric);

    const trend = monitor.getTrend(systemId);
    expect(trend.metrics.length).toBe(1);
    expect(trend.average).toBe(0.05);
  });

  it('should trigger alert when bias exceeds threshold', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const metric = createMetric(0.16); // Above 0.1 threshold and > 0.15 for medium
    monitor.recordMetric(metric);

    const alerts = monitor.getActiveAlerts();
    expect(alerts.length).toBe(1);
    expect(alerts[0].systemId).toBe(systemId);
    expect(alerts[0].severity).toBe('medium');
    expect(alerts[0].status).toBe('active');
    expect(consoleWarnSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should not trigger alert when bias is below threshold', () => {
    const metric = createMetric(0.05); // Below 0.1 threshold
    monitor.recordMetric(metric);

    const alerts = monitor.getActiveAlerts();
    expect(alerts.length).toBe(0);
  });

  it('should calculate correct severity levels', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Low severity (0.1 < bias <= 0.15)
    monitor.recordMetric(createMetric(0.12));
    expect(monitor.getActiveAlerts()[0].severity).toBe('low');

    // Medium severity (0.15 < bias <= 0.2)
    monitor.recordMetric(createMetric(0.18));
    expect(monitor.getActiveAlerts()[1].severity).toBe('medium');

    // High severity (0.2 < bias <= 0.3)
    monitor.recordMetric(createMetric(0.25));
    expect(monitor.getActiveAlerts()[2].severity).toBe('high');

    // Critical severity (bias > 0.3)
    monitor.recordMetric(createMetric(0.35));
    expect(monitor.getActiveAlerts()[3].severity).toBe('critical');

    consoleWarnSpy.mockRestore();
  });

  it('should calculate bias trend - improving', () => {
    // Record metrics showing improvement over time
    monitor.recordMetric(createMetric(0.2)); // Early metric (high)
    monitor.recordMetric(createMetric(0.15)); // Mid metric
    monitor.recordMetric(createMetric(0.08)); // Recent metric (low)
    monitor.recordMetric(createMetric(0.05)); // Most recent (lower)

    const trend = monitor.getTrend(systemId);

    expect(trend.trend).toBe('improving');
    expect(trend.metrics.length).toBe(4);
  });

  it('should calculate bias trend - worsening', () => {
    // Record metrics showing degradation over time
    monitor.recordMetric(createMetric(0.05)); // Early metric (low)
    monitor.recordMetric(createMetric(0.08)); // Mid metric
    monitor.recordMetric(createMetric(0.15)); // Recent metric (high)
    monitor.recordMetric(createMetric(0.2)); // Most recent (higher)

    const trend = monitor.getTrend(systemId);

    expect(trend.trend).toBe('worsening');
  });

  it('should calculate bias trend - stable', () => {
    // Record metrics showing stability
    monitor.recordMetric(createMetric(0.05));
    monitor.recordMetric(createMetric(0.06));
    monitor.recordMetric(createMetric(0.05));
    monitor.recordMetric(createMetric(0.06));

    const trend = monitor.getTrend(systemId);

    expect(trend.trend).toBe('stable');
  });

  it('should filter metrics by time window', () => {
    const now = new Date();
    const oldDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    const recentDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago

    // Old metric (outside 7-day window)
    monitor.recordMetric(createMetric(0.2, { timestamp: oldDate }));

    // Recent metrics (inside 7-day window)
    monitor.recordMetric(createMetric(0.05, { timestamp: recentDate }));
    monitor.recordMetric(createMetric(0.06));

    const trend = monitor.getTrend(systemId, 7);

    expect(trend.metrics.length).toBe(2); // Should only include recent metrics
    expect(trend.average).toBeCloseTo(0.055, 2);
  });

  it('should acknowledge alerts', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    monitor.recordMetric(createMetric(0.15));
    const alerts = monitor.getActiveAlerts();
    const alertId = alerts[0].id;

    monitor.acknowledgeAlert(alertId);

    expect(monitor.getActiveAlerts().length).toBe(0); // No longer active

    consoleWarnSpy.mockRestore();
  });

  it('should resolve alerts', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    monitor.recordMetric(createMetric(0.15));
    const alerts = monitor.getActiveAlerts();
    const alertId = alerts[0].id;

    monitor.resolveAlert(alertId);

    expect(monitor.getActiveAlerts().length).toBe(0); // No longer active

    consoleWarnSpy.mockRestore();
  });

  it('should track multiple systems independently', () => {
    monitor.recordMetric(createMetric(0.05, { systemId: 'system-1' }));
    monitor.recordMetric(createMetric(0.15, { systemId: 'system-2' }));

    const trend1 = monitor.getTrend('system-1');
    const trend2 = monitor.getTrend('system-2');

    expect(trend1.average).toBe(0.05);
    expect(trend2.average).toBe(0.15);
  });

  it('should generate comprehensive monitoring report', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Add metrics for different systems
    monitor.recordMetric(createMetric(0.05, { systemId: 'system-1' }));
    monitor.recordMetric(createMetric(0.15, { systemId: 'system-2' })); // Above threshold
    monitor.recordMetric(createMetric(0.2, { systemId: 'system-3' })); // Above threshold

    const report = monitor.generateReport();

    expect(report.totalMetrics).toBe(3);
    expect(report.averageBias).toBeCloseTo(0.133, 2);
    expect(report.activeAlerts).toBe(2);
    expect(report.systemsAboveThreshold).toContain('system-2');
    expect(report.systemsAboveThreshold).toContain('system-3');
    expect(report.systemsAboveThreshold.length).toBe(2);
    expect(report.recommendations.length).toBeGreaterThan(0);

    consoleWarnSpy.mockRestore();
  });

  it('should include recommendations when bias is high', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Add high bias metrics
    monitor.recordMetric(createMetric(0.2));
    monitor.recordMetric(createMetric(0.3));

    const report = monitor.generateReport();

    expect(report.averageBias).toBeGreaterThan(0.1);
    expect(report.recommendations).toContain(
      'Overall bias exceeds threshold - review training data'
    );
    expect(report.recommendations).toContain('Implement additional bias mitigation strategies');

    consoleWarnSpy.mockRestore();
  });

  it('should track demographic parity when provided', () => {
    const metric = createMetric(0.05, {
      metrics: {
        sentimentVariance: 0.05,
        keywordBalance: 0.03,
        framingNeutrality: 0.02,
        demographicParity: 0.08,
      },
    });

    monitor.recordMetric(metric);

    const trend = monitor.getTrend(systemId);
    expect(trend.metrics[0].metrics.demographicParity).toBe(0.08);
  });

  it('should handle empty metrics gracefully', () => {
    const trend = monitor.getTrend('nonexistent-system');

    expect(trend.average).toBe(0);
    expect(trend.trend).toBe('stable');
    expect(trend.metrics.length).toBe(0);
  });
});
