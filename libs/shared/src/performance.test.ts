import { beforeEach, describe, expect, it } from 'vitest';
import {
  calculateSLI,
  checkSLO,
  DEFAULT_SLO,
  getAllMetrics,
  performanceMiddleware,
  recordLatency,
  resetMetrics,
} from './performance.js';

describe('Performance Monitoring', () => {
  beforeEach(() => {
    resetMetrics();
  });

  describe('recordLatency', () => {
    it('should record request latency', async () => {
      recordLatency('/api/test', 100);
      recordLatency('/api/test', 200);
      recordLatency('/api/test', 150);

      // Wait a bit for throughput calculation to be meaningful
      await new Promise(resolve => setTimeout(resolve, 10));

      const sli = calculateSLI('/api/test');
      expect(sli.latencyP50).toBeGreaterThan(0);
      expect(sli.throughput).toBeGreaterThanOrEqual(0);
    });

    it('should track error count', () => {
      recordLatency('/api/test', 100, false);
      recordLatency('/api/test', 200, true);
      recordLatency('/api/test', 150, false);

      const sli = calculateSLI('/api/test');
      expect(sli.errorRate).toBeCloseTo(33.33, 1);
    });
  });

  describe('calculateSLI', () => {
    it('should calculate percentiles correctly', () => {
      const latencies = [100, 200, 300, 400, 500];
      for (const latency of latencies) {
        recordLatency('/api/test', latency);
      }

      const sli = calculateSLI('/api/test');
      expect(sli.latencyP50).toBe(300);
      expect(sli.latencyP95).toBe(500);
      expect(sli.latencyP99).toBe(500);
    });

    it('should calculate availability', () => {
      recordLatency('/api/test', 100, false);
      recordLatency('/api/test', 200, false);
      recordLatency('/api/test', 150, true);

      const sli = calculateSLI('/api/test');
      expect(sli.availability).toBeCloseTo(66.67, 1);
      expect(sli.errorRate).toBeCloseTo(33.33, 1);
    });

    it('should handle empty metrics', () => {
      const sli = calculateSLI('/api/nonexistent');
      expect(sli.latencyP50).toBe(0);
      expect(sli.errorRate).toBe(0);
      expect(sli.availability).toBe(100);
    });
  });

  describe('checkSLO', () => {
    it('should pass when meeting SLO', () => {
      recordLatency('/api/test', 50);
      recordLatency('/api/test', 100);
      recordLatency('/api/test', 150);

      const result = checkSLO('/api/test');
      expect(result.passing).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect latency violations', () => {
      // Create high latencies
      for (let i = 0; i < 100; i++) {
        recordLatency('/api/test', 600); // Exceeds p99 threshold
      }

      const result = checkSLO('/api/test');
      expect(result.passing).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations.some(v => v.includes('latency'))).toBe(true);
    });

    it('should detect error rate violations', () => {
      // Create high error rate
      for (let i = 0; i < 100; i++) {
        recordLatency('/api/test', 100, true);
      }

      const result = checkSLO('/api/test');
      expect(result.passing).toBe(false);
      expect(result.violations.some(v => v.includes('Error rate'))).toBe(true);
    });

    it('should use custom SLO', () => {
      recordLatency('/api/test', 150);

      const strictSLO = {
        maxLatencyP95: 100,
        maxLatencyP99: 200,
        maxErrorRate: 0.01,
        minAvailability: 99.99,
      };

      const result = checkSLO('/api/test', strictSLO);
      expect(result.passing).toBe(false);
    });
  });

  describe('getAllMetrics', () => {
    it('should return metrics for all endpoints', () => {
      recordLatency('/api/users', 100);
      recordLatency('/api/posts', 200);

      const allMetrics = getAllMetrics();
      expect(Object.keys(allMetrics)).toContain('/api/users');
      expect(Object.keys(allMetrics)).toContain('/api/posts');
    });

    it('should return empty object when no metrics', () => {
      const allMetrics = getAllMetrics();
      expect(allMetrics).toEqual({});
    });
  });

  describe('resetMetrics', () => {
    it('should reset specific endpoint metrics', () => {
      recordLatency('/api/test', 100);
      recordLatency('/api/other', 200);

      resetMetrics('/api/test');

      const sli = calculateSLI('/api/test');
      expect(sli.latencyP50).toBe(0);

      const otherSli = calculateSLI('/api/other');
      expect(otherSli.latencyP50).toBe(200);
    });

    it('should reset all metrics', () => {
      recordLatency('/api/test', 100);
      recordLatency('/api/other', 200);

      resetMetrics();

      const allMetrics = getAllMetrics();
      expect(Object.keys(allMetrics)).toHaveLength(0);
    });
  });

  describe('performanceMiddleware', () => {
    it('should measure request duration', async () => {
      const middleware = performanceMiddleware('/api/test');
      const startTime = middleware.start();

      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 50));

      const latency = middleware.end(startTime);
      expect(latency).toBeGreaterThanOrEqual(40);
      expect(latency).toBeLessThanOrEqual(200);
    });

    it('should record error status', () => {
      const middleware = performanceMiddleware('/api/test');
      const startTime = middleware.start();
      middleware.end(startTime, true);

      const sli = calculateSLI('/api/test');
      expect(sli.errorRate).toBe(100);
    });
  });

  describe('DEFAULT_SLO', () => {
    it('should have reasonable default values', () => {
      expect(DEFAULT_SLO.maxLatencyP95).toBe(200);
      expect(DEFAULT_SLO.maxLatencyP99).toBe(500);
      expect(DEFAULT_SLO.maxErrorRate).toBe(0.1);
      expect(DEFAULT_SLO.minAvailability).toBe(99.9);
    });
  });
});
