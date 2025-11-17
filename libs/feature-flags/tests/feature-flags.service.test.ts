import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FeatureFlagService } from '../feature-flags.service';
import type { FeatureFlags, FlagContext } from '../types';

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;
  let mockFlags: FeatureFlags;

  beforeEach(() => {
    mockFlags = {
      'test-flag': {
        defaultValue: false,
        description: 'Test flag',
      },
      'enabled-flag': {
        defaultValue: true,
        description: 'Always enabled flag',
      },
      'string-flag': {
        defaultValue: 'default-value',
        description: 'String flag',
      },
      'number-flag': {
        defaultValue: 42,
        description: 'Number flag',
      },
      'rule-flag': {
        defaultValue: false,
        rules: [
          {
            conditions: [
              {
                property: 'userId',
                operator: 'equals',
                value: 'user123',
              },
            ],
            value: true,
          },
        ],
      },
      'complex-rule-flag': {
        defaultValue: false,
        rules: [
          {
            conditions: [
              {
                property: 'role',
                operator: 'in',
                value: ['admin', 'moderator'],
              },
              {
                property: 'environment',
                operator: 'equals',
                value: 'production',
              },
            ],
            value: true,
          },
        ],
      },
    };

    service = new FeatureFlagService(mockFlags);

    // Mock process.env
    vi.stubGlobal('process', {
      env: {},
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided flags', () => {
      const flags = service.getAllFlags();
      expect(flags).toEqual(mockFlags);
    });

    it('should initialize with empty flags if none provided', () => {
      const emptyService = new FeatureFlagService();
      const flags = emptyService.getAllFlags();
      expect(flags).toEqual({});
    });
  });

  describe('isEnabled', () => {
    it('should return true for boolean true values', () => {
      expect(service.isEnabled('enabled-flag')).toBe(true);
    });

    it('should return false for boolean false values', () => {
      expect(service.isEnabled('test-flag')).toBe(false);
    });

    it('should return true for truthy string values', () => {
      const serviceWithTruthy = new FeatureFlagService({
        'string-true': { defaultValue: 'true' },
        'number-1': { defaultValue: 1 },
      });
      expect(serviceWithTruthy.isEnabled('string-true')).toBe(true);
      expect(serviceWithTruthy.isEnabled('number-1')).toBe(true);
    });

    it('should return false for falsy string values', () => {
      const serviceWithFalsy = new FeatureFlagService({
        'string-false': { defaultValue: 'false' },
        'string-0': { defaultValue: '0' },
        'empty-string': { defaultValue: '' },
      });
      expect(serviceWithFalsy.isEnabled('string-false')).toBe(false);
      expect(serviceWithFalsy.isEnabled('string-0')).toBe(false);
      expect(serviceWithFalsy.isEnabled('empty-string')).toBe(false);
    });

    it('should return false for non-existent flags', () => {
      expect(service.isEnabled('non-existent')).toBe(false);
    });

    it('should evaluate rules correctly', () => {
      const context: FlagContext = { userId: 'user123' };
      expect(service.isEnabled('rule-flag', context)).toBe(true);

      const wrongContext: FlagContext = { userId: 'user456' };
      expect(service.isEnabled('rule-flag', wrongContext)).toBe(false);
    });
  });

  describe('getValue', () => {
    it('should return flag value for existing flags', () => {
      expect(service.getValue('enabled-flag')).toBe(true);
      expect(service.getValue('string-flag')).toBe('default-value');
      expect(service.getValue('number-flag')).toBe(42);
    });

    it('should return default value for non-existent flags', () => {
      expect(service.getValue('non-existent', undefined, 'fallback')).toBe('fallback');
    });

    it('should return undefined for non-existent flags without default', () => {
      expect(service.getValue('non-existent')).toBeUndefined();
    });

    it('should evaluate rules and return rule value', () => {
      const context: FlagContext = { userId: 'user123' };
      expect(service.getValue('rule-flag', context)).toBe(true);
    });

    it('should return default value when rules do not match', () => {
      const context: FlagContext = { userId: 'user456' };
      expect(service.getValue('rule-flag', context)).toBe(false);
    });

    it('should handle complex rules with multiple conditions', () => {
      const adminProdContext: FlagContext = { role: 'admin', environment: 'production' };
      expect(service.getValue('complex-rule-flag', adminProdContext)).toBe(true);

      const adminDevContext: FlagContext = { role: 'admin', environment: 'development' };
      expect(service.getValue('complex-rule-flag', adminDevContext)).toBe(false);

      const userProdContext: FlagContext = { role: 'user', environment: 'production' };
      expect(service.getValue('complex-rule-flag', userProdContext)).toBe(false);
    });
  });

  describe('environment overrides', () => {
    beforeEach(() => {
      vi.stubGlobal('process', {
        env: {
          FEATURE_FLAG_TEST_FLAG: 'true',
          FEATURE_FLAG_STRING_FLAG: 'overridden-value',
          FEATURE_FLAG_NEW_FLAG: '42',
        },
      });
    });

    it('should prioritize environment overrides over flag defaults', () => {
      const serviceWithEnv = new FeatureFlagService(mockFlags);
      expect(serviceWithEnv.getValue('test-flag')).toBe(true);
      expect(serviceWithEnv.getValue('string-flag')).toBe('overridden-value');
    });

    it('should create new flags from environment variables', () => {
      const serviceWithEnv = new FeatureFlagService(mockFlags);
      expect(serviceWithEnv.getValue('new-flag')).toBe(42);
    });

    it('should parse environment values correctly', () => {
      vi.stubGlobal('process', {
        env: {
          FEATURE_FLAG_BOOL_TRUE: 'true',
          FEATURE_FLAG_BOOL_FALSE: 'false',
          FEATURE_FLAG_NUMBER: '123',
          FEATURE_FLAG_STRING: 'hello world',
        },
      });

      const serviceWithEnv = new FeatureFlagService();
      expect(serviceWithEnv.getValue('bool-true')).toBe(true);
      expect(serviceWithEnv.getValue('bool-false')).toBe(false);
      expect(serviceWithEnv.getValue('number')).toBe(123);
      expect(serviceWithEnv.getValue('string')).toBe('hello world');
    });

    it('should handle invalid environment values', () => {
      vi.stubGlobal('process', {
        env: {
          FEATURE_FLAG_INVALID: 'not-a-number',
        },
      });

      const serviceWithEnv = new FeatureFlagService();
      expect(serviceWithEnv.getValue('invalid')).toBe('not-a-number');
    });
  });

  describe('rule evaluation', () => {
    describe('equals operator', () => {
      it('should match equal values', () => {
        const context: FlagContext = { userId: 'user123' };
        const rule = {
          conditions: [{ property: 'userId', operator: 'equals' as const, value: 'user123' }],
          value: true,
        };
        expect(service['evaluateRule'](rule, context)).toBe(true);
      });

      it('should not match unequal values', () => {
        const context: FlagContext = { userId: 'user456' };
        const rule = {
          conditions: [{ property: 'userId', operator: 'equals' as const, value: 'user123' }],
          value: true,
        };
        expect(service['evaluateRule'](rule, context)).toBe(false);
      });
    });

    describe('not_equals operator', () => {
      it('should match unequal values', () => {
        const context: FlagContext = { userId: 'user456' };
        const rule = {
          conditions: [{ property: 'userId', operator: 'not_equals' as const, value: 'user123' }],
          value: true,
        };
        expect(service['evaluateRule'](rule, context)).toBe(true);
      });

      it('should not match equal values', () => {
        const context: FlagContext = { userId: 'user123' };
        const rule = {
          conditions: [{ property: 'userId', operator: 'not_equals' as const, value: 'user123' }],
          value: true,
        };
        expect(service['evaluateRule'](rule, context)).toBe(false);
      });
    });

    describe('in operator', () => {
      it('should match when value is in array', () => {
        const context: FlagContext = { role: 'admin' };
        const rule = {
          conditions: [
            { property: 'role', operator: 'in' as const, value: ['admin', 'moderator'] },
          ],
          value: true,
        };
        expect(service['evaluateRule'](rule, context)).toBe(true);
      });

      it('should not match when value is not in array', () => {
        const context: FlagContext = { role: 'user' };
        const rule = {
          conditions: [
            { property: 'role', operator: 'in' as const, value: ['admin', 'moderator'] },
          ],
          value: true,
        };
        expect(service['evaluateRule'](rule, context)).toBe(false);
      });
    });

    describe('not_in operator', () => {
      it('should match when value is not in array', () => {
        const context: FlagContext = { role: 'user' };
        const rule = {
          conditions: [
            { property: 'role', operator: 'not_in' as const, value: ['admin', 'moderator'] },
          ],
          value: true,
        };
        expect(service['evaluateRule'](rule, context)).toBe(true);
      });

      it('should not match when value is in array', () => {
        const context: FlagContext = { role: 'admin' };
        const rule = {
          conditions: [
            { property: 'role', operator: 'not_in' as const, value: ['admin', 'moderator'] },
          ],
          value: true,
        };
        expect(service['evaluateRule'](rule, context)).toBe(false);
      });
    });

    describe('contains operator', () => {
      it('should match when string contains substring', () => {
        const context: FlagContext = { email: 'user@example.com' };
        const rule = {
          conditions: [{ property: 'email', operator: 'contains' as const, value: 'example' }],
          value: true,
        };
        expect(service['evaluateRule'](rule, context)).toBe(true);
      });

      it('should not match when string does not contain substring', () => {
        const context: FlagContext = { email: 'user@test.com' };
        const rule = {
          conditions: [{ property: 'email', operator: 'contains' as const, value: 'example' }],
          value: true,
        };
        expect(service['evaluateRule'](rule, context)).toBe(false);
      });

      it('should handle non-string values gracefully', () => {
        const context: FlagContext = { count: 123 };
        const rule = {
          conditions: [{ property: 'count', operator: 'contains' as const, value: '2' }],
          value: true,
        };
        expect(service['evaluateRule'](rule, context)).toBe(false);
      });
    });

    describe('greater_than operator', () => {
      it('should match when number is greater than value', () => {
        const context: FlagContext = { score: 85 };
        const rule = {
          conditions: [{ property: 'score', operator: 'greater_than' as const, value: 80 }],
          value: true,
        };
        expect(service['evaluateRule'](rule, context)).toBe(true);
      });

      it('should not match when number is not greater than value', () => {
        const context: FlagContext = { score: 75 };
        const rule = {
          conditions: [{ property: 'score', operator: 'greater_than' as const, value: 80 }],
          value: true,
        };
        expect(service['evaluateRule'](rule, context)).toBe(false);
      });
    });

    describe('less_than operator', () => {
      it('should match when number is less than value', () => {
        const context: FlagContext = { score: 75 };
        const rule = {
          conditions: [{ property: 'score', operator: 'less_than' as const, value: 80 }],
          value: true,
        };
        expect(service['evaluateRule'](rule, context)).toBe(true);
      });

      it('should not match when number is not less than value', () => {
        const context: FlagContext = { score: 85 };
        const rule = {
          conditions: [{ property: 'score', operator: 'less_than' as const, value: 80 }],
          value: true,
        };
        expect(service['evaluateRule'](rule, context)).toBe(false);
      });
    });

    describe('multiple conditions', () => {
      it('should require all conditions to be true', () => {
        const context: FlagContext = { role: 'admin', environment: 'production' };
        const rule = {
          conditions: [
            { property: 'role', operator: 'equals' as const, value: 'admin' },
            { property: 'environment', operator: 'equals' as const, value: 'production' },
          ],
          value: true,
        };
        expect(service['evaluateRule'](rule, context)).toBe(true);
      });

      it('should fail if any condition is false', () => {
        const context: FlagContext = { role: 'admin', environment: 'development' };
        const rule = {
          conditions: [
            { property: 'role', operator: 'equals' as const, value: 'admin' },
            { property: 'environment', operator: 'equals' as const, value: 'production' },
          ],
          value: true,
        };
        expect(service['evaluateRule'](rule, context)).toBe(false);
      });
    });

    describe('unknown operator', () => {
      it('should return false for unknown operators', () => {
        const context: FlagContext = { userId: 'user123' };
        const rule = {
          conditions: [{ property: 'userId', operator: 'unknown' as any, value: 'user123' }],
          value: true,
        };
        expect(service['evaluateRule'](rule, context)).toBe(false);
      });
    });
  });

  describe('flag management', () => {
    describe('setFlag', () => {
      it('should set flag with default value', () => {
        service.setFlag('new-flag', true);
        expect(service.getValue('new-flag')).toBe(true);
      });

      it('should set flag with full configuration', () => {
        service.setFlag('complex-flag', {
          defaultValue: false,
          rules: [
            {
              conditions: [{ property: 'userId', operator: 'equals', value: 'admin' }],
              value: true,
            },
          ],
        });
        expect(service.getValue('complex-flag')).toBe(false);
        expect(service.getValue('complex-flag', { userId: 'admin' })).toBe(true);
      });
    });

    describe('removeFlag', () => {
      it('should remove existing flag', () => {
        service.removeFlag('test-flag');
        expect(service.getValue('test-flag')).toBeUndefined();
      });

      it('should not throw when removing non-existent flag', () => {
        expect(() => service.removeFlag('non-existent')).not.toThrow();
      });
    });

    describe('reload', () => {
      it('should reload flags with new configuration', () => {
        const newFlags: FeatureFlags = {
          'reloaded-flag': { defaultValue: true },
        };
        service.reload(newFlags);
        expect(service.getAllFlags()).toEqual(newFlags);
      });

      it('should apply environment overrides on reload', () => {
        vi.stubGlobal('process', {
          env: {
            FEATURE_FLAG_RELOADED_FLAG: 'false',
          },
        });

        const newFlags: FeatureFlags = {
          'reloaded-flag': { defaultValue: true },
        };
        service.reload(newFlags);
        expect(service.getValue('reloaded-flag')).toBe(false);
      });
    });
  });

  describe('getAllFlags', () => {
    it('should return a copy of all flags', () => {
      const isolatedService = new FeatureFlagService(mockFlags);
      const flags = isolatedService.getAllFlags();
      expect(flags).toEqual(mockFlags);

      // Ensure it's a copy, not the original
      flags['new-flag'] = { defaultValue: true };
      expect(isolatedService.getAllFlags()).not.toHaveProperty('new-flag');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined process.env', () => {
      vi.stubGlobal('process', undefined);
      const serviceNoEnv = new FeatureFlagService(mockFlags);
      expect(serviceNoEnv.getValue('test-flag')).toBe(false);
    });

    it('should handle empty conditions array', () => {
      const rule = {
        conditions: [],
        value: true,
      };
      expect(service['evaluateRule'](rule, {})).toBe(true);
    });

    it('should handle missing context properties', () => {
      const context: FlagContext = {};
      const rule = {
        conditions: [{ property: 'missingProp', operator: 'equals' as const, value: 'value' }],
        value: true,
      };
      expect(service['evaluateRule'](rule, context)).toBe(false);
    });

    it('should handle concurrent access', async () => {
      const promises = Array.from({ length: 100 }, () =>
        Promise.resolve(service.getValue('test-flag'))
      );
      const results = await Promise.all(promises);
      results.forEach(result => expect(result).toBe(false));
    });

    it('should handle large number of flags', () => {
      const largeFlags: FeatureFlags = {};
      for (let i = 0; i < 1000; i++) {
        largeFlags[`flag-${i}`] = { defaultValue: i % 2 === 0 };
      }
      const largeService = new FeatureFlagService(largeFlags);

      expect(largeService.getValue('flag-0')).toBe(true);
      expect(largeService.getValue('flag-1')).toBe(false);
      expect(largeService.getValue('flag-999')).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle invalid rule configurations', () => {
      const invalidFlags: FeatureFlags = {
        'invalid-rule': {
          defaultValue: false,
          rules: [
            {
              conditions: undefined as any,
              value: true,
            },
          ],
        },
      };
      const serviceWithInvalid = new FeatureFlagService(invalidFlags);
      expect(serviceWithInvalid.getValue('invalid-rule')).toBe(false);
    });

    it('should handle malformed environment variables', () => {
      vi.stubGlobal('process', {
        env: {
          FEATURE_FLAG_MALFORMED: 'not-a-valid-env-value',
        },
      });

      const serviceWithMalformed = new FeatureFlagService();
      expect(serviceWithMalformed.getValue('malformed')).toBe('not-a-valid-env-value');
    });
  });
});
