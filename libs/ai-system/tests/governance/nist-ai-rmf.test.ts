/**
 * NIST AI RMF Tests
 *
 * Tests for AI governance framework implementation.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  GovernFunction,
  ManageFunction,
  MapFunction,
  MeasureFunction,
  type AISystemRegistration,
} from '../../src/governance/nist-ai-rmf';

describe('GovernFunction', () => {
  let govern: GovernFunction;

  beforeEach(() => {
    govern = new GovernFunction();
  });

  it('should register AI system', () => {
    const system: AISystemRegistration = {
      id: 'test-ai-1',
      name: 'Test AI System',
      description: 'Testing system',
      owner: 'test-team',
      riskLevel: 'medium',
      model: {
        provider: 'test-provider',
        version: '1.0.0',
        type: 'generative',
      },
      dataSources: ['test-data'],
      limitations: ['test-limitation'],
      biasMitigations: ['test-mitigation'],
      registeredAt: new Date(),
    };

    govern.registerSystem(system);
    const retrieved = govern.getSystem('test-ai-1');

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe('test-ai-1');
  });

  it('should filter systems by risk level', () => {
    govern.registerSystem({
      id: 'low-risk',
      name: 'Low Risk System',
      description: 'Low risk',
      owner: 'team',
      riskLevel: 'low',
      model: { provider: 'test', version: '1.0', type: 'discriminative' },
      dataSources: [],
      limitations: [],
      biasMitigations: [],
      registeredAt: new Date(),
    });

    govern.registerSystem({
      id: 'high-risk',
      name: 'High Risk System',
      description: 'High risk',
      owner: 'team',
      riskLevel: 'high',
      model: { provider: 'test', version: '1.0', type: 'generative' },
      dataSources: [],
      limitations: [],
      biasMitigations: [],
      registeredAt: new Date(),
    });

    const highRiskSystems = govern.getSystemsByRisk('high');
    expect(highRiskSystems.length).toBe(1);
    expect(highRiskSystems[0].id).toBe('high-risk');
  });

  it('should require approval for high-risk systems', () => {
    govern.registerSystem({
      id: 'high-risk',
      name: 'High Risk',
      description: 'Test',
      owner: 'team',
      riskLevel: 'high',
      model: { provider: 'test', version: '1.0', type: 'generative' },
      dataSources: [],
      limitations: [],
      biasMitigations: [],
      registeredAt: new Date(),
    });

    expect(govern.requiresApproval('high-risk', 'any-operation')).toBe(true);
  });

  it('should require approval for political operations', () => {
    govern.registerSystem({
      id: 'low-risk',
      name: 'Low Risk',
      description: 'Test',
      owner: 'team',
      riskLevel: 'low',
      model: { provider: 'test', version: '1.0', type: 'discriminative' },
      dataSources: [],
      limitations: [],
      biasMitigations: [],
      registeredAt: new Date(),
    });

    expect(govern.requiresApproval('low-risk', 'voting')).toBe(true);
  });
});

describe('MapFunction', () => {
  let map: MapFunction;

  beforeEach(() => {
    map = new MapFunction();
  });

  it('should assess impact for critical rights', async () => {
    const assessment = await map.assessImpact('test-ai', {
      stakeholders: ['citizens'],
      affectedRights: ['voting', 'privacy'],
      dataProcessing: ['personal data', 'PII'],
    });

    expect(assessment).toBeDefined();
    expect(assessment.impactLevel).toBe('critical');
    expect(assessment.findings.length).toBeGreaterThan(0);
  });

  it('should generate model card', () => {
    const system: AISystemRegistration = {
      id: 'test-ai',
      name: 'Test System',
      description: 'Test description',
      owner: 'team',
      riskLevel: 'medium',
      model: { provider: 'test', version: '1.0', type: 'generative' },
      dataSources: ['source1'],
      limitations: ['limitation1'],
      biasMitigations: ['mitigation1'],
      registeredAt: new Date(),
    };

    const card = map.generateModelCard(system);
    expect(card).toContain('Test System');
    expect(card).toContain('Model Card');
  });
});

describe('MeasureFunction', () => {
  let measure: MeasureFunction;

  beforeEach(() => {
    measure = new MeasureFunction();
  });

  it('should measure bias in outputs', async () => {
    const outputs = [{ text: 'This is good and excellent' }, { text: 'This is bad and poor' }];

    const result = await measure.measureBias('test-ai', outputs);
    expect(result).toBeDefined();
    expect(result.biasScore).toBeGreaterThanOrEqual(0);
    expect(result.biasScore).toBeLessThanOrEqual(1);
  });

  it('should track performance metrics', () => {
    measure.trackPerformance('test-ai', {
      latencyMs: 150,
      tokensUsed: 1000,
      errorRate: 0.01,
      timestamp: new Date(),
    });
    // No error means success (method logs to console)
    expect(true).toBe(true);
  });
});

describe('ManageFunction', () => {
  let manage: ManageFunction;

  beforeEach(() => {
    manage = new ManageFunction();
  });

  it('should respond to critical incident', async () => {
    const response = await manage.respondToIncident({
      systemId: 'test-ai',
      type: 'bias-detected',
      severity: 'critical',
      description: 'Severe bias detected',
      timestamp: new Date(),
    });

    expect(response).toBeDefined();
    expect(response.escalated).toBe(true);
    expect(response.notified.length).toBeGreaterThan(0);
  });

  it('should implement control', () => {
    manage.implementControl('test-ai', 'bias-risk', {
      type: 'preventive',
      description: 'Implement bias detection',
      automated: true,
    });
    // No error means success
    expect(true).toBe(true);
  });
});
