/**
 * Feature flag value types
 */
export type FlagValue = boolean | string | number;

/**
 * Context for flag evaluation
 */
export interface FlagContext {
  userId?: string;
  role?: string;
  environment?: string;
  [key: string]: any;
}

/**
 * Rule condition for flag evaluation
 */
export interface RuleCondition {
  property: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

/**
 * Flag rule for conditional values
 */
export interface FlagRule {
  conditions: RuleCondition[];
  value: FlagValue;
}

/**
 * Feature flag definition
 */
export interface FeatureFlag {
  defaultValue: FlagValue;
  description?: string;
  rules?: FlagRule[];
}

/**
 * Collection of feature flags
 */
export interface FeatureFlags {
  [flagName: string]: FeatureFlag;
}
