/**
 * ValidationGate Tests
 *
 * Tests for the 3-tier validation gate system.
 */

import { describe, expect, it } from 'vitest';
import type { RuleResult, Validator } from '../../src/validation/gate';
import { ValidationGate } from '../../src/validation/gate';

describe('ValidationGate', () => {
  describe('validate()', () => {
    it('should pass when all validators succeed', async () => {
      const successValidator: Validator = {
        id: 'success',
        name: 'Success Validator',
        validate: async (): Promise<RuleResult> => ({
          rule: 'success',
          passed: true,
        }),
      };

      const gate = new ValidationGate({
        id: 'test-gate',
        tier: 1,
        name: 'Test Gate',
        description: 'Test',
        validators: [successValidator],
        blockOnFailure: true,
      });

      const result = await gate.validate({ test: 'data' });

      expect(result.passed).toBe(true);
      expect(result.ruleResults).toHaveLength(1);
    });

    it('should fail when validator returns error', async () => {
      const errorValidator: Validator = {
        id: 'error',
        name: 'Error Validator',
        validate: async (): Promise<RuleResult> => ({
          rule: 'error',
          passed: false,
          message: 'Test error occurred',
          severity: 'error',
        }),
      };

      const gate = new ValidationGate({
        id: 'test-gate',
        tier: 1,
        name: 'Test Gate',
        description: 'Test',
        validators: [errorValidator],
        blockOnFailure: true,
      });

      const result = await gate.validate({ test: 'data' });

      expect(result.passed).toBe(false);
      expect(result.ruleResults[0].passed).toBe(false);
      expect(result.ruleResults[0].severity).toBe('error');
    });

    it('should pass when validator returns only warnings', async () => {
      const warningValidator: Validator = {
        id: 'warning',
        name: 'Warning Validator',
        validate: async (): Promise<RuleResult> => ({
          rule: 'warning',
          passed: false,
          message: 'Test warning',
          severity: 'warning',
        }),
      };

      const gate = new ValidationGate({
        id: 'test-gate',
        tier: 2,
        name: 'Test Gate',
        description: 'Test',
        validators: [warningValidator],
        blockOnFailure: false,
      });

      const result = await gate.validate({ test: 'data' });

      // Warnings don't fail the gate
      expect(result.passed).toBe(true);
      expect(result.ruleResults).toHaveLength(1);
    });

    it('should handle validator exceptions gracefully', async () => {
      const throwingValidator: Validator = {
        id: 'throwing',
        name: 'Throwing Validator',
        validate: async () => {
          throw new Error('Validator error');
        },
      };

      const gate = new ValidationGate({
        id: 'test-gate',
        tier: 1,
        name: 'Test Gate',
        description: 'Test',
        validators: [throwingValidator],
        blockOnFailure: true,
      });

      const result = await gate.validate({ test: 'data' });

      expect(result.passed).toBe(false);
      expect(result.ruleResults.length).toBeGreaterThan(0);
      expect(result.ruleResults[0].message).toContain('Validator error');
    });
  });

  describe('Tier enforcement', () => {
    it('should identify Tier 0 (constitutional) in results', async () => {
      const validator: Validator = {
        id: 'test',
        name: 'Test',
        validate: async (): Promise<RuleResult> => ({
          rule: 'test',
          passed: true,
        }),
      };

      const gate = new ValidationGate({
        id: 'constitutional-gate',
        tier: 0,
        name: 'Constitutional Gate',
        description: 'Cannot be bypassed',
        validators: [validator],
        blockOnFailure: true,
      });

      const result = await gate.validate({ test: 'data' });

      expect(result.tier).toBe(0);
    });

    it('should identify Tier 1 (mandatory) in results', async () => {
      const validator: Validator = {
        id: 'test',
        name: 'Test',
        validate: async (): Promise<RuleResult> => ({
          rule: 'test',
          passed: true,
        }),
      };

      const gate = new ValidationGate({
        id: 'mandatory-gate',
        tier: 1,
        name: 'Mandatory Gate',
        description: 'Blocks execution',
        validators: [validator],
        blockOnFailure: true,
      });

      const result = await gate.validate({ test: 'data' });

      expect(result.tier).toBe(1);
    });
  });
});
