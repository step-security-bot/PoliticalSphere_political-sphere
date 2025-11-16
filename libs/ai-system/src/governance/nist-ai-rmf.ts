/**
 * NIST AI Risk Management Framework (AI RMF 1.0)
 *
 * Implements the 4 core functions: GOVERN, MAP, MEASURE, MANAGE
 *
 * @module governance/nist-ai-rmf
 * @see https://www.nist.gov/itl/ai-risk-management-framework
 */

/**
 * AI System registration for governance tracking
 */
export interface AISystemRegistration {
  /** System ID */
  id: string;
  /** System name */
  name: string;
  /** System description and purpose */
  description: string;
  /** Owner/responsible party */
  owner: string;
  /** Risk level */
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  /** Model information */
  model: {
    provider: string;
    version: string;
    type: 'generative' | 'discriminative' | 'reinforcement';
  };
  /** Data sources */
  dataSources: string[];
  /** Known limitations */
  limitations: string[];
  /** Bias mitigations */
  biasMitigations: string[];
  /** Registration date */
  registeredAt: Date;
  /** Last audit date */
  lastAuditedAt?: Date;
}

/**
 * AI RMF GOVERN Function
 *
 * Establishes governance structures and accountability.
 */
export class GovernFunction {
  private systems: Map<string, AISystemRegistration> = new Map();

  /**
   * Register an AI system
   */
  registerSystem(system: AISystemRegistration): void {
    this.systems.set(system.id, system);
  }

  /**
   * Get registered system
   */
  getSystem(id: string): AISystemRegistration | undefined {
    return this.systems.get(id);
  }

  /**
   * Get all systems by risk level
   */
  getSystemsByRisk(riskLevel: AISystemRegistration['riskLevel']): AISystemRegistration[] {
    return Array.from(this.systems.values()).filter(s => s.riskLevel === riskLevel);
  }

  /**
   * Require approval for high-risk operations
   */
  requiresApproval(systemId: string, operationType: string): boolean {
    const system = this.systems.get(systemId);
    if (!system) return true;

    // High and critical risk systems always require approval
    if (system.riskLevel === 'high' || system.riskLevel === 'critical') {
      return true;
    }

    // Political content always requires approval
    const politicalOperations = ['voting', 'speech', 'moderation', 'power', 'policy'];
    if (politicalOperations.includes(operationType)) {
      return true;
    }

    return false;
  }
}

/**
 * AI RMF MAP Function
 *
 * Identifies and documents AI system context and impacts.
 */
export class MapFunction {
  /**
   * Create impact assessment for AI system
   */
  async assessImpact(
    _systemId: string,
    context: {
      stakeholders: string[];
      affectedRights: string[];
      dataProcessing: string[];
    }
  ): Promise<{
    impactLevel: 'low' | 'medium' | 'high' | 'critical';
    findings: string[];
    recommendations: string[];
  }> {
    const findings: string[] = [];
    const recommendations: string[] = [];
    let impactLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Check for fundamental rights impact
    const fundamentalRights = ['voting', 'freedom of speech', 'privacy', 'equality'];
    const affectedFundamentalRights = context.affectedRights.filter(r =>
      fundamentalRights.includes(r.toLowerCase())
    );

    if (affectedFundamentalRights.length > 0) {
      impactLevel = 'critical';
      findings.push(`Affects fundamental rights: ${affectedFundamentalRights.join(', ')}`);
      recommendations.push('Require human oversight and approval');
      recommendations.push('Implement contestability mechanisms');
    }

    // Check for PII processing
    const processesPII = context.dataProcessing.some(
      d => d.includes('personal') || d.includes('PII')
    );

    if (processesPII) {
      if (impactLevel === 'low') impactLevel = 'medium';
      findings.push('Processes personally identifiable information');
      recommendations.push('Conduct DPIA (Data Protection Impact Assessment)');
      recommendations.push('Ensure GDPR compliance');
    }

    // Check stakeholder count
    if (context.stakeholders.length > 100) {
      if (impactLevel === 'low') impactLevel = 'medium';
      findings.push('Large-scale impact (>100 stakeholders)');
      recommendations.push('Implement monitoring and feedback mechanisms');
    }

    return { impactLevel, findings, recommendations };
  }

  /**
   * Generate model card (NIST requirement)
   */
  generateModelCard(system: AISystemRegistration): string {
    return `
# Model Card: ${system.name}

## Model Details
- **Owner**: ${system.owner}
- **Version**: ${system.model.version}
- **Type**: ${system.model.type}
- **Provider**: ${system.model.provider}

## Intended Use
${system.description}

## Limitations
${system.limitations.map(l => `- ${l}`).join('\n')}

## Data Sources
${system.dataSources.map(d => `- ${d}`).join('\n')}

## Bias Mitigations
${system.biasMitigations.map(m => `- ${m}`).join('\n')}

## Risk Level
${system.riskLevel.toUpperCase()}

## Governance
- **Registered**: ${system.registeredAt.toISOString()}
- **Last Audit**: ${system.lastAuditedAt?.toISOString() || 'Never'}
`.trim();
  }
}

/**
 * AI RMF MEASURE Function
 *
 * Tracks and measures AI system performance and risks.
 */
export class MeasureFunction {
  /**
   * Measure bias metrics
   */
  async measureBias(
    _systemId: string,
    outputs: Array<{
      text: string;
      metadata?: Record<string, unknown>;
    }>
  ): Promise<{
    biasScore: number;
    metrics: {
      sentimentVariance: number;
      keywordBalance: number;
      framingNeutrality: number;
    };
    passed: boolean;
  }> {
    // Simple bias detection (placeholder - replace with actual NLP model)
    let totalSentiment = 0;
    let sentimentCount = 0;

    for (const output of outputs) {
      // Count positive vs negative words (simplified)
      const positiveWords = ['good', 'great', 'excellent', 'positive', 'beneficial'];
      const negativeWords = ['bad', 'poor', 'negative', 'harmful', 'detrimental'];

      const text = output.text.toLowerCase();
      const positiveCount = positiveWords.filter(w => text.includes(w)).length;
      const negativeCount = negativeWords.filter(w => text.includes(w)).length;

      const sentiment = (positiveCount - negativeCount) / (positiveCount + negativeCount + 1);
      totalSentiment += sentiment;
      sentimentCount++;
    }

    const avgSentiment = sentimentCount > 0 ? totalSentiment / sentimentCount : 0;
    const biasScore = Math.abs(avgSentiment);

    // Bias threshold: < 0.1 is acceptable
    const passed = biasScore < 0.1;

    return {
      biasScore,
      metrics: {
        sentimentVariance: biasScore,
        keywordBalance: 1 - biasScore, // Higher is better
        framingNeutrality: 1 - biasScore,
      },
      passed,
    };
  }

  /**
   * Track performance metrics
   */
  trackPerformance(
    systemId: string,
    metrics: {
      latencyMs: number;
      tokensUsed: number;
      errorRate: number;
      timestamp: Date;
    }
  ): void {
    // Store metrics for trending analysis
    console.log(`[MEASURE] ${systemId}:`, metrics);
  }
}

/**
 * AI RMF MANAGE Function
 *
 * Implements controls and responses to AI risks.
 */
export class ManageFunction {
  /**
   * Implement control for identified risk
   */
  implementControl(
    systemId: string,
    _risk: string,
    control: {
      type: 'preventive' | 'detective' | 'corrective';
      description: string;
      automated: boolean;
    }
  ): void {
    console.log(
      `[MANAGE] Implementing ${control.type} control for ${systemId}:`,
      control.description
    );

    if (control.automated) {
      // Automated controls are enforced in validation gates
      console.log('Control will be enforced automatically in validation pipeline');
    } else {
      // Manual controls require human review
      console.log('Control requires human review and approval');
    }
  }

  /**
   * Respond to incident
   */
  async respondToIncident(incident: {
    systemId: string;
    type: 'bias-detected' | 'security-breach' | 'privacy-violation' | 'manipulation-attempt';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    timestamp: Date;
  }): Promise<{
    action: string;
    escalated: boolean;
    notified: string[];
  }> {
    const actions: string[] = [];
    const notified: string[] = [];
    let escalated = false;

    // Critical incidents require immediate escalation
    if (incident.severity === 'critical') {
      actions.push('Suspend system immediately');
      actions.push('Notify governance committee');
      actions.push('Initiate incident response plan');
      notified.push('governance-committee');
      notified.push('security-team');
      escalated = true;
    }

    // Bias incidents require review
    if (incident.type === 'bias-detected') {
      actions.push('Flag outputs for review');
      actions.push('Retrain model with balanced dataset');
      notified.push('ai-ethics-team');
    }

    // Privacy violations trigger GDPR breach protocol
    if (incident.type === 'privacy-violation') {
      actions.push('Assess data exposure');
      actions.push('Notify affected users (72-hour GDPR requirement)');
      actions.push('Report to supervisory authority if required');
      notified.push('data-protection-officer');
      notified.push('legal-team');
    }

    return {
      action: actions.join('; '),
      escalated,
      notified,
    };
  }
}

/**
 * NIST AI RMF Orchestrator
 *
 * Coordinates all 4 functions.
 */
export class NISTAIRMFOrchestrator {
  public readonly govern: GovernFunction;
  public readonly map: MapFunction;
  public readonly measure: MeasureFunction;
  public readonly manage: ManageFunction;

  constructor() {
    this.govern = new GovernFunction();
    this.map = new MapFunction();
    this.measure = new MeasureFunction();
    this.manage = new ManageFunction();
  }

  /**
   * Full lifecycle governance workflow
   */
  async governSystem(
    system: AISystemRegistration,
    operationType: string,
    outputs: Array<{ text: string; metadata?: Record<string, unknown> }>
  ): Promise<{
    approved: boolean;
    requiresHumanReview: boolean;
    findings: string[];
  }> {
    const findings: string[] = [];

    // GOVERN: Register system
    this.govern.registerSystem(system);

    // MAP: Assess impact
    const impact = await this.map.assessImpact(system.id, {
      stakeholders: ['citizens', 'administrators'],
      affectedRights: ['voting', 'freedom of speech'],
      dataProcessing: ['user preferences', 'voting history'],
    });

    findings.push(...impact.findings);

    // MEASURE: Check bias
    const biasCheck = await this.measure.measureBias(system.id, outputs);
    if (!biasCheck.passed) {
      findings.push(`Bias detected: ${biasCheck.biasScore.toFixed(3)} (threshold: 0.1)`);
    }

    // MANAGE: Determine approval requirements
    const requiresHumanReview = this.govern.requiresApproval(system.id, operationType);
    const approved = biasCheck.passed && (impact.impactLevel !== 'critical' || requiresHumanReview);

    return {
      approved,
      requiresHumanReview,
      findings,
    };
  }
}
