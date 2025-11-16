/**
 * Configuration System Tests
 *
 * Tests for AI system configuration and validation gate tiers.
 */

import { describe, expect, it } from 'vitest';
import {
  defaultOrchestrationConfig,
  defaultSLIs,
  defaultSLOs,
  validationGateConfigs,
} from '../../src/config';

describe('Configuration System', () => {
  describe('Validation Gate Configs', () => {
    it('should define tier 0 constitutional gates as non-bypassable', () => {
      const tier0 = validationGateConfigs[0];

      expect(tier0.tier).toBe(0);
      expect(tier0.bypassable).toBe(false);
      expect(tier0.rules).toContain('political-neutrality');
      expect(tier0.rules).toContain('democratic-integrity');
      expect(tier0.metadata?.name).toBe('Constitutional Gates');
    });

    it('should define tier 1 mandatory gates as non-bypassable', () => {
      const tier1 = validationGateConfigs[1];

      expect(tier1.tier).toBe(1);
      expect(tier1.bypassable).toBe(false);
      expect(tier1.rules).toContain('input-validation');
      expect(tier1.rules).toContain('authentication');
      expect(tier1.rules).toContain('authorization');
      expect(tier1.metadata?.standards).toContain('OWASP ASVS 5.0.0');
    });

    it('should define tier 2 best-practice gates as bypassable', () => {
      const tier2 = validationGateConfigs[2];

      expect(tier2.tier).toBe(2);
      expect(tier2.bypassable).toBe(true);
      expect(tier2.rules).toContain('code-quality');
      expect(tier2.rules).toContain('test-coverage');
    });

    it('should have complete metadata for each tier', () => {
      Object.values(validationGateConfigs).forEach(config => {
        expect(config.metadata).toBeDefined();
        expect(config.metadata?.name).toBeTruthy();
        expect(config.metadata?.description).toBeTruthy();
        expect(config.metadata?.standards).toBeDefined();
        expect(config.metadata?.standards?.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Default Orchestration Config', () => {
    it('should define semantic-kernel as default framework', () => {
      expect(defaultOrchestrationConfig.framework).toBe('semantic-kernel');
    });

    it('should use sequential pattern by default', () => {
      expect(defaultOrchestrationConfig.pattern).toBe('sequential');
    });

    it('should enable checkpointing by default', () => {
      expect(defaultOrchestrationConfig.checkpoint?.enabled).toBe(true);
      expect(defaultOrchestrationConfig.checkpoint?.storage).toBe('memory');
      expect(defaultOrchestrationConfig.checkpoint?.resumeOnFailure).toBe(true);
    });
  });

  describe('Service Level Indicators (SLIs)', () => {
    it('should define availability SLI with 99.9% target', () => {
      const availability = defaultSLIs.find(sli => sli.name === 'availability');

      expect(availability).toBeDefined();
      expect(availability?.target).toBe(0.999);
      expect(availability?.query).toContain('up');
    });

    it('should define latency percentile SLIs', () => {
      const p50 = defaultSLIs.find(sli => sli.name === 'latency_p50');
      const p95 = defaultSLIs.find(sli => sli.name === 'latency_p95');
      const p99 = defaultSLIs.find(sli => sli.name === 'latency_p99');

      expect(p50?.target).toBe(100); // 100ms
      expect(p95?.target).toBe(200); // 200ms
      expect(p99?.target).toBe(500); // 500ms
    });

    it('should define error rate SLI with 0.1% target', () => {
      const errorRate = defaultSLIs.find(sli => sli.name === 'error_rate');

      expect(errorRate).toBeDefined();
      expect(errorRate?.target).toBe(0.001);
      expect(errorRate?.query).toContain('status=~"5.."');
    });
  });

  describe('Service Level Objectives (SLOs)', () => {
    it('should define SLOs with required fields', () => {
      expect(defaultSLOs.length).toBeGreaterThan(0);

      defaultSLOs.forEach(slo => {
        expect(slo.name).toBeTruthy();
        expect(slo.sli).toBeDefined();
        expect(slo.sli.name).toBeTruthy();
        expect(typeof slo.target).toBe('number');
        expect(slo.window).toMatch(/\d+d|\d+w|\d+m/); // basic window format check
        expect(slo.errorBudget).toBeDefined();
        expect(typeof slo.errorBudget.total).toBe('number');
        expect(typeof slo.errorBudget.remaining).toBe('number');
      });
    });

    it('should include availability and latency SLOs', () => {
      const availabilitySLO = defaultSLOs.find(slo =>
        slo.name.toLowerCase().includes('availability')
      );
      const latencySLO = defaultSLOs.find(slo => slo.name.toLowerCase().includes('latency'));

      expect(availabilitySLO).toBeDefined();
      expect(availabilitySLO?.sli.name).toBe('availability');
      expect(latencySLO).toBeDefined();
      expect(latencySLO?.sli.name).toBe('latency_p95');
    });
  });

  describe('Validation Gate Access', () => {
    it('should provide all tier configs', () => {
      const tiers = [0, 1, 2];

      tiers.forEach(tier => {
        const config = validationGateConfigs[tier];
        expect(config).toBeDefined();
        expect(config.tier).toBe(tier);
        expect(config.rules).toBeDefined();
        expect(config.rules.length).toBeGreaterThan(0);
      });
    });

    it('should validate tier constraints', () => {
      // Tier 0 and 1 must not be bypassable
      expect(validationGateConfigs[0].bypassable).toBe(false);
      expect(validationGateConfigs[1].bypassable).toBe(false);

      // Tier 2 can be bypassable
      expect(validationGateConfigs[2].bypassable).toBe(true);
    });

    it('should contain expected rules by tier', () => {
      const tier0Rules = validationGateConfigs[0].rules;
      const tier1Rules = validationGateConfigs[1].rules;
      const tier2Rules = validationGateConfigs[2].rules;

      expect(tier0Rules).toContain('political-neutrality');
      expect(tier1Rules).toContain('authentication');
      expect(tier2Rules).toContain('code-quality');
    });
  });

  describe('Configuration Validation', () => {
    it('should enforce mandatory SLIs', () => {
      const requiredSLIs = ['availability', 'latency_p95', 'error_rate'];

      requiredSLIs.forEach(name => {
        expect(defaultSLIs.some(sli => sli.name === name)).toBe(true);
      });
    });

    it('should have realistic SLI targets', () => {
      defaultSLIs.forEach(sli => {
        if (sli.name === 'availability') {
          expect(sli.target).toBeGreaterThan(0.99);
          expect(sli.target).toBeLessThanOrEqual(1.0);
        }

        if (sli.name.startsWith('latency_')) {
          expect(sli.target).toBeGreaterThan(0);
          expect(sli.target).toBeLessThan(10000); // 10 seconds max
        }

        if (sli.name === 'error_rate') {
          expect(sli.target).toBeGreaterThanOrEqual(0);
          expect(sli.target).toBeLessThan(0.05); // < 5%
        }
      });
    });
  });
});
