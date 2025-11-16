/**
 * Validation Gate
 *
 * Enforces validation checks at different tier levels.
 *
 * @module validation/gate
 */

import type { ValidationResult, ValidationTier } from '../types';

/**
 * Validation gate configuration
 */
export interface GateConfig {
  /** Gate identifier */
  id: string;
  /** Gate tier level */
  tier: ValidationTier;
  /** Gate name */
  name: string;
  /** Gate description */
  description: string;
  /** Validators to run */
  validators: Validator[];
  /** Block on failure (Tier 0-1 only) */
  blockOnFailure: boolean;
}

/**
 * Validation rule result
 */
export interface RuleResult {
  rule: string;
  passed: boolean;
  message?: string;
  severity?: 'error' | 'warning' | 'info';
}

/**
 * Validator function
 */
export interface Validator {
  /** Validator ID */
  id: string;
  /** Validator name */
  name: string;
  /** Validation function */
  validate: (input: unknown) => Promise<RuleResult>;
  /** OWASP ASVS requirement (if applicable) */
  requirement?: string;
}

/**
 * Validation Gate
 *
 * Enforces validation checks at constitutional, mandatory, or best-practice levels.
 *
 * @example
 * ```typescript
 * const gate = new ValidationGate({
 *   id: 'political-neutrality',
 *   tier: ValidationTier.CONSTITUTIONAL,
 *   name: 'Political Neutrality Check',
 *   description: 'Ensures AI output is politically neutral',
 *   validators: [biasValidator, sentimentValidator],
 *   blockOnFailure: true
 * });
 *
 * const result = await gate.validate(agentOutput);
 * if (!result.passed && gate.config.blockOnFailure) {
 *   throw new Error('Validation gate failed');
 * }
 * ```
 */
export class ValidationGate {
  constructor(public readonly config: GateConfig) {}

  /**
   * Run validation gate
   */
  async validate(input: unknown): Promise<ValidationResult> {
    const ruleResults: RuleResult[] = [];

    // Run all validators
    for (const validator of this.config.validators) {
      try {
        const result = await validator.validate(input);
        ruleResults.push(result);
      } catch (error) {
        ruleResults.push({
          rule: validator.id,
          passed: false,
          message: `Validator ${validator.id} failed: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error',
        });
      }
    }

    // Determine if gate passed
    const failedRules = ruleResults.filter(r => !r.passed && r.severity === 'error');
    const passed = failedRules.length === 0;

    return {
      passed,
      tier: this.config.tier,
      ruleResults,
      timestamp: new Date(),
    };
  }

  /**
   * Check if gate should block on failure
   */
  shouldBlock(): boolean {
    return this.config.blockOnFailure;
  }
}
