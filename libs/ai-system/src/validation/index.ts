import type { AgentOutput, ValidationGateConfig, ValidationResult } from '../types';

export type ValidationRule = {
  name: string;
  validate: (output: AgentOutput) => Promise<{ passed: boolean; message?: string }>;
};

export class ValidationRegistry {
  private rules = new Map<string, ValidationRule>();

  register(rule: ValidationRule) {
    this.rules.set(rule.name, rule);
  }

  get(name: string): ValidationRule | undefined {
    return this.rules.get(name);
  }
}

export class ValidationGate {
  constructor(
    private cfg: ValidationGateConfig,
    private registry: ValidationRegistry
  ) {}

  async validate(output: AgentOutput): Promise<ValidationResult> {
    const results: ValidationResult['ruleResults'] = [];

    for (const ruleName of this.cfg.rules) {
      const rule = this.registry.get(ruleName);
      if (!rule) {
        results.push({
          rule: ruleName,
          passed: false,
          message: 'Rule not found',
          severity: 'warning',
        });
        continue;
      }
      try {
        const res = await rule.validate(output);
        results.push({ rule: ruleName, passed: res.passed, message: res.message });
      } catch (err) {
        results.push({
          rule: ruleName,
          passed: false,
          message: err instanceof Error ? err.message : 'Validation error',
        });
      }
    }

    return {
      passed: results.every(r => r.passed || this.cfg.bypassable === true),
      tier: this.cfg.tier,
      ruleResults: results,
      timestamp: new Date(),
    };
  }
}

// Default rules
export function createDefaultValidationRegistry() {
  const registry = new ValidationRegistry();

  registry.register({
    name: 'error-handling',
    async validate(output) {
      const passed = !output.error;
      return { passed, message: passed ? 'No errors present' : output.error?.message };
    },
  });

  registry.register({
    name: 'minimum-content',
    async validate(output) {
      const min = 5;
      const passed = (output.content || '').trim().length >= min;
      return { passed, message: passed ? 'Content length OK' : `Content too short (<${min})` };
    },
  });

  registry.register({
    name: 'political-neutrality',
    async validate(output) {
      // Placeholder heuristic: warn if highly polarized keywords are present
      const text = (output.content || '').toLowerCase();
      const hit = /(extreme|radical|hate|illegitimate)/.test(text);
      return {
        passed: !hit,
        message: hit ? 'Potentially non-neutral phrasing' : 'Neutrality check passed',
      };
    },
  });

  return registry;
}
