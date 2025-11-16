/**
 * Integration Tests - Complete System
 *
 * End-to-end tests for the full AI Development System.
 */

import { describe, expect, it } from 'vitest';
import { GovernFunction } from '../src/governance/nist-ai-rmf';
import { PoliticalNeutralityEnforcer } from '../src/governance/political-neutrality';
import { ValidationGate } from '../src/validation/gate';

describe('AI Development System Integration', () => {
  it('should validate political neutrality through validation gate', async () => {
    const neutralityChecker = new PoliticalNeutralityEnforcer();

    const gate = new ValidationGate({
      id: 'neutrality-gate',
      tier: 0,
      name: 'Political Neutrality Gate',
      description: 'Constitutional tier neutrality enforcement',
      validators: [
        {
          id: 'political-neutrality',
          name: 'Political Neutrality Check',
          validate: async (input: string) => {
            const result = await neutralityChecker.checkNeutrality(input);
            return {
              rule: 'political-neutrality',
              passed: result.passed,
              message: result.passed ? 'Neutral' : 'Biased',
              severity: (result.passed ? 'info' : 'error') as const,
            };
          },
        },
      ],
      blockOnFailure: true,
    });

    const neutralText = 'The government implements various policies.';
    const result = await gate.validate(neutralText);

    expect(result.passed).toBe(true);
    expect(result.tier).toBe(0);
  });

  it('should register AI systems with governance', () => {
    const govern = new GovernFunction();

    govern.registerSystem({
      id: 'voting-ai',
      name: 'Voting Recommendation System',
      description: 'AI system for suggesting voting options',
      owner: 'governance-team',
      riskLevel: 'critical',
      model: {
        provider: 'openai',
        version: 'gpt-4',
        type: 'generative',
      },
      dataSources: ['user-preferences', 'voting-history'],
      limitations: ['Cannot predict individual votes', 'Requires human oversight'],
      biasMitigations: ['Balanced training data', 'Regular bias audits'],
      registeredAt: new Date(),
    });

    const system = govern.getSystem('voting-ai');
    expect(system).toBeDefined();
    expect(system?.riskLevel).toBe('critical');
  });

  it('should require approval for critical systems', () => {
    const govern = new GovernFunction();

    govern.registerSystem({
      id: 'critical-ai',
      name: 'Critical System',
      description: 'High-risk system',
      owner: 'team',
      riskLevel: 'critical',
      model: { provider: 'test', version: '1.0', type: 'generative' },
      dataSources: [],
      limitations: [],
      biasMitigations: [],
      registeredAt: new Date(),
    });

    expect(govern.requiresApproval('critical-ai', 'voting')).toBe(true);
    expect(govern.requiresApproval('critical-ai', 'any-operation')).toBe(true);
  });
});

describe('AI Development System Integration', () => {
  it('should validate political neutrality through validation gate', async () => {
    const neutralityChecker = new PoliticalNeutralityEnforcer();

    const neutralityValidator = {
      id: 'political-neutrality',
      name: 'Political Neutrality Check',
      validate: async (input: string) => {
        const result = await neutralityChecker.checkNeutrality(input);
        return {
          rule: 'political-neutrality',
          passed: result.passed,
          message: result.passed
            ? 'Content is neutral'
            : `Bias detected: ${result.biases.map(b => b.description).join(', ')}`,
          severity: result.passed ? ('info' as const) : ('error' as const),
        };
      },
    };

    const gate = new ValidationGate({
      id: 'political-neutrality-gate',
      tier: 0, // Tier 0 - Constitutional
      name: 'Political Neutrality Gate',
      description: 'Ensures political neutrality',
      validators: [neutralityValidator],
      blockOnFailure: true,
    });

    const neutralText = 'The government implements various policies.';
    const result = await gate.validate(neutralText);

    expect(result.passed).toBe(true);
    expect(result.tier).toBe(0);
  });

  it('should reject biased content at constitutional tier', async () => {
    const neutralityChecker = new PoliticalNeutralityEnforcer();

    const neutralityValidator = {
      id: 'political-neutrality',
      name: 'Political Neutrality Check',
      validate: async (input: string) => {
        const result = await neutralityChecker.checkNeutrality(input);
        return {
          rule: 'political-neutrality',
          passed: result.passed,
          message: result.passed ? 'Content is neutral' : 'Political bias detected',
          severity: result.passed ? ('info' as const) : ('error' as const),
        };
      },
    };

    const gate = new ValidationGate({
      id: 'political-neutrality-gate',
      tier: 0,
      name: 'Political Neutrality Gate',
      description: 'Ensures political neutrality',
      validators: [neutralityValidator],
      blockOnFailure: true,
    });

    // Text with excessive partisan keywords (4+ triggers bias detection)
    const biasedText = 'The socialist progressive liberal leftist agenda must be stopped!';
    const result = await gate.validate(biasedText);

    expect(result.passed).toBe(false);
    expect(result.ruleResults.some(r => r.severity === 'error')).toBe(true);
  });

  it('should register AI systems with governance', () => {
    const govern = new GovernFunction();

    govern.registerSystem({
      id: 'voting-ai',
      name: 'Voting Recommendation System',
      description: 'AI system for suggesting voting options',
      owner: 'governance-team',
      riskLevel: 'critical',
      model: {
        provider: 'openai',
        version: 'gpt-4',
        type: 'generative',
      },
      dataSources: ['user-preferences', 'voting-history'],
      limitations: ['Cannot predict individual votes', 'Requires human oversight'],
      biasMitigations: ['Balanced training data', 'Regular bias audits'],
      registeredAt: new Date(),
    });

    const system = govern.getSystem('voting-ai');
    expect(system).toBeDefined();
    expect(system?.riskLevel).toBe('critical');
  });

  it('should require approval for critical systems', () => {
    const govern = new GovernFunction();

    govern.registerSystem({
      id: 'critical-ai',
      name: 'Critical System',
      description: 'High-risk system',
      owner: 'team',
      riskLevel: 'critical',
      model: { provider: 'test', version: '1.0', type: 'generative' },
      dataSources: [],
      limitations: [],
      biasMitigations: [],
      registeredAt: new Date(),
    });

    expect(govern.requiresApproval('critical-ai', 'voting')).toBe(true);
    expect(govern.requiresApproval('critical-ai', 'any-operation')).toBe(true);
  });

  it('should enforce multi-tier validation', async () => {
    const sanitizationValidator = {
      id: 'input-sanitization',
      name: 'Input Sanitization',
      validate: async (input: string) => ({
        rule: 'input-sanitization',
        passed: !input.includes('<script>'),
        message: input.includes('<script>') ? 'XSS attempt detected' : 'Input clean',
        severity: input.includes('<script>') ? ('error' as const) : ('info' as const),
      }),
    };

    const gate = new ValidationGate({
      id: 'input-sanitization-gate',
      tier: 1, // Tier 1 - Mandatory
      name: 'Input Sanitization Gate',
      description: 'Validates input safety',
      validators: [sanitizationValidator],
      blockOnFailure: true,
    });

    const safeInput = 'Normal user input';
    const safeResult = await gate.validate(safeInput);
    expect(safeResult.passed).toBe(true);

    const maliciousInput = '<script>alert("xss")</script>';
    const maliciousResult = await gate.validate(maliciousInput);
    expect(maliciousResult.passed).toBe(false);
  });
});
