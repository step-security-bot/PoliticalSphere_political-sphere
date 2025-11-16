import type { FeatureFlags, FlagContext, FlagRule, FlagValue, RuleCondition } from './types';

/**
 * Feature Flag Service
 *
 * Provides runtime feature flag evaluation with environment overrides
 * and context-aware flag resolution.
 *
 * @example
 * ```typescript
 * const flags = new FeatureFlagService();
 *
 * if (flags.isEnabled('new-voting-ui')) {
 *   // Show new UI
 * }
 *
 * const variant = flags.getValue('experiment-homepage', { userId: '123' });
 * ```
 */
export class FeatureFlagService {
  private flags: FeatureFlags = {};
  private readonly envPrefix = 'FEATURE_FLAG_';

  constructor(initialFlags: FeatureFlags = {}) {
    this.flags = this.loadFlags(initialFlags);
  }

  /**
   * Check if a feature flag is enabled
   *
   * @param flagName - Name of the feature flag
   * @param context - Optional context for flag evaluation
   * @returns True if flag is enabled
   */
  isEnabled(flagName: string, context?: FlagContext): boolean {
    const value = this.getValue(flagName, context);
    return value === true || value === 'true' || value === 1;
  }

  /**
   * Get the value of a feature flag
   *
   * @param flagName - Name of the feature flag
   * @param context - Optional context for flag evaluation
   * @param defaultValue - Default value if flag not found
   * @returns Flag value
   */
  getValue<T extends FlagValue = FlagValue>(
    flagName: string,
    context?: FlagContext,
    defaultValue?: T
  ): T | undefined {
    // Check environment override first
    const envValue = this.getEnvOverride(flagName);
    if (envValue !== undefined) {
      return envValue as T;
    }

    // Get flag configuration
    const flag = this.flags[flagName];
    if (!flag) {
      return defaultValue;
    }

    // Evaluate context-based rules
    if (context && flag.rules) {
      for (const rule of flag.rules) {
        if (this.evaluateRule(rule, context)) {
          return rule.value as T;
        }
      }
    }

    // Return default value for the flag
    return (flag.defaultValue ?? defaultValue) as T;
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Update a feature flag
   */
  setFlag(
    flagName: string,
    value: FlagValue | { defaultValue: FlagValue; rules?: FlagRule[] }
  ): void {
    if (typeof value === 'object' && 'defaultValue' in value) {
      this.flags[flagName] = value;
    } else {
      this.flags[flagName] = { defaultValue: value };
    }
  }

  /**
   * Remove a feature flag
   */
  removeFlag(flagName: string): void {
    delete this.flags[flagName];
  }

  /**
   * Reload flags from configuration
   */
  reload(newFlags: FeatureFlags): void {
    this.flags = this.loadFlags(newFlags);
  }

  /**
   * Load flags with environment overrides
   */
  private loadFlags(initialFlags: FeatureFlags): FeatureFlags {
    const flags: FeatureFlags = { ...initialFlags };

    // Apply environment overrides
    if (typeof process !== 'undefined' && process.env) {
      Object.keys(process.env).forEach(key => {
        if (key.startsWith(this.envPrefix)) {
          const flagName = key.substring(this.envPrefix.length).toLowerCase().replace(/_/g, '-');
          const envValue = this.parseEnvValue(process.env[key] || '');

          if (!flags[flagName]) {
            flags[flagName] = { defaultValue: envValue };
          } else {
            flags[flagName] = {
              ...flags[flagName],
              defaultValue: envValue,
            };
          }
        }
      });
    }

    return flags;
  }

  /**
   * Get environment variable override for a flag
   */
  private getEnvOverride(flagName: string): FlagValue | undefined {
    if (typeof process === 'undefined' || !process.env) {
      return undefined;
    }

    const envKey = `${this.envPrefix}${flagName.toUpperCase().replace(/-/g, '_')}`;
    const envValue = process.env[envKey];

    if (envValue !== undefined) {
      return this.parseEnvValue(envValue);
    }

    return undefined;
  }

  /**
   * Parse environment variable value to appropriate type
   */
  private parseEnvValue(value: string): FlagValue {
    // Boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Number
    const numValue = Number(value);
    if (!Number.isNaN(numValue)) return numValue;

    // String
    return value;
  }

  /**
   * Evaluate a flag rule against context
   */
  private evaluateRule(rule: FlagRule, context: FlagContext): boolean {
    if (!rule.conditions) return false;

    return rule.conditions.every((condition: RuleCondition) => {
      const contextValue = context[condition.property];

      switch (condition.operator) {
        case 'equals':
          return contextValue === condition.value;
        case 'not_equals':
          return contextValue !== condition.value;
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(contextValue);
        case 'not_in':
          return Array.isArray(condition.value) && !condition.value.includes(contextValue);
        case 'contains':
          return (
            typeof contextValue === 'string' &&
            typeof condition.value === 'string' &&
            contextValue.includes(condition.value)
          );
        case 'greater_than':
          return Number(contextValue) > Number(condition.value);
        case 'less_than':
          return Number(contextValue) < Number(condition.value);
        default:
          return false;
      }
    });
  }
}

/**
 * Singleton instance for global access
 */
export const featureFlags = new FeatureFlagService();
