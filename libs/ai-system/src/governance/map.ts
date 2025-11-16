/**
 * NIST AI RMF MAP Function - Complete Implementation
 *
 * Identifies, inventories, and documents all AI systems with comprehensive risk classification.
 *
 * @module governance/map
 */

import type { AISystemRegistration } from './nist-ai-rmf';

/**
 * Comprehensive AI System Inventory
 *
 * Complete catalog of all AI systems used in Political Sphere.
 */
export class AISystemInventory {
  private systems: Map<string, AISystemRegistration> = new Map();

  constructor() {
    this.initializeInventory();
  }

  /**
   * Initialize complete AI system inventory
   */
  private initializeInventory(): void {
    // Core AI Governance System
    this.registerSystem({
      id: 'ai-governance-orchestrator',
      name: 'AI Governance Orchestrator',
      description: 'Multi-agent workflow orchestration with constitutional governance',
      owner: 'Technical Governance Committee',
      riskLevel: 'high',
      model: {
        provider: 'OpenAI',
        version: 'GPT-4',
        type: 'generative',
      },
      dataSources: ['User messages', 'System prompts', 'Validation rules'],
      limitations: [
        'Cannot bypass constitutional gates',
        'Requires human approval for high-risk operations',
        'Limited to approved use cases',
      ],
      biasMitigations: [
        'Political neutrality validation',
        'Bias monitoring with <0.1 threshold',
        'Human oversight for critical decisions',
      ],
      registeredAt: new Date('2025-11-01'),
      lastAuditedAt: new Date('2025-11-12'),
    });

    // AI Assistants
    this.registerSystem({
      id: 'github-copilot',
      name: 'GitHub Copilot',
      description: 'AI-powered code completion and generation',
      owner: 'Development Team',
      riskLevel: 'medium',
      model: {
        provider: 'GitHub/OpenAI',
        version: 'GPT-4',
        type: 'generative',
      },
      dataSources: ['Code repositories', 'Development context', 'User prompts'],
      limitations: [
        'Cannot generate production secrets',
        'Limited to code-related tasks',
        'Requires human review for complex changes',
      ],
      biasMitigations: [
        'Neutral code generation patterns',
        'No political content generation',
        'Human code review required',
      ],
      registeredAt: new Date('2025-10-01'),
      lastAuditedAt: new Date('2025-11-01'),
    });

    this.registerSystem({
      id: 'blackbox-ai',
      name: 'Blackbox AI Assistant',
      description: 'Enterprise AI assistant for development and governance',
      owner: 'Technical Governance Committee',
      riskLevel: 'high',
      model: {
        provider: 'Blackbox',
        version: 'Latest',
        type: 'generative',
      },
      dataSources: ['Project documentation', 'Code context', 'Governance rules'],
      limitations: [
        'Bound by constitutional rules',
        'Cannot modify governance documents',
        'Requires human approval for policy changes',
      ],
      biasMitigations: [
        'Constitutional neutrality enforcement',
        'Bias monitoring integration',
        'Human oversight for all outputs',
      ],
      registeredAt: new Date('2025-10-15'),
      lastAuditedAt: new Date('2025-11-12'),
    });

    // Content Analysis Systems
    this.registerSystem({
      id: 'moderation-analyzer',
      name: 'Content Moderation Analyzer',
      description: 'AI-powered content safety and moderation analysis',
      owner: 'Community Safety Team',
      riskLevel: 'high',
      model: {
        provider: 'OpenAI',
        version: 'GPT-4',
        type: 'generative',
      },
      dataSources: ['User-generated content', 'Moderation guidelines', 'Historical cases'],
      limitations: [
        'Cannot autonomously remove content',
        'Requires human review for decisions',
        'Limited to analysis and recommendations',
      ],
      biasMitigations: [
        'Neutral content analysis',
        'Balanced training data',
        'Human moderation oversight',
      ],
      registeredAt: new Date('2025-10-01'),
      lastAuditedAt: new Date('2025-11-01'),
    });

    // Bias Detection System
    this.registerSystem({
      id: 'bias-detection-engine',
      name: 'Bias Detection Engine',
      description: 'Continuous monitoring for political and content bias',
      owner: 'AI Ethics Committee',
      riskLevel: 'medium',
      model: {
        provider: 'Custom/HuggingFace',
        version: '1.0',
        type: 'discriminative',
      },
      dataSources: ['Content outputs', 'User interactions', 'System logs'],
      limitations: [
        'Statistical detection only',
        'Requires human interpretation',
        'False positive/negative possibilities',
      ],
      biasMitigations: [
        'Regular model retraining',
        'Multi-source validation',
        'Human expert review',
      ],
      registeredAt: new Date('2025-10-15'),
      lastAuditedAt: new Date('2025-11-01'),
    });

    // Voting Analysis System (Future)
    this.registerSystem({
      id: 'voting-pattern-analyzer',
      name: 'Voting Pattern Analyzer',
      description: 'Anonymous voting trend analysis (no individual prediction)',
      owner: 'Research Committee',
      riskLevel: 'low',
      model: {
        provider: 'Statistical Models',
        version: '1.0',
        type: 'discriminative',
      },
      dataSources: ['Aggregated voting data', 'Demographic trends', 'Historical patterns'],
      limitations: [
        'Aggregate analysis only',
        'No individual predictions',
        'Cannot influence voting',
      ],
      biasMitigations: [
        'Demographic balancing',
        'Regular methodology review',
        'Transparent reporting',
      ],
      registeredAt: new Date('2025-11-01'),
      lastAuditedAt: new Date('2025-11-01'),
    });
  }

  /**
   * Register a new AI system
   */
  registerSystem(system: AISystemRegistration): void {
    this.systems.set(system.id, system);
  }

  /**
   * Get system by ID
   */
  getSystem(id: string): AISystemRegistration | undefined {
    return this.systems.get(id);
  }

  /**
   * Get all registered systems
   */
  getAllSystems(): AISystemRegistration[] {
    return Array.from(this.systems.values());
  }

  /**
   * Get systems by risk level
   */
  getSystemsByRisk(riskLevel: AISystemRegistration['riskLevel']): AISystemRegistration[] {
    return this.getAllSystems().filter(s => s.riskLevel === riskLevel);
  }

  /**
   * Get systems requiring audit (>90 days since last audit)
   */
  getSystemsRequiringAudit(): AISystemRegistration[] {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    return this.getAllSystems().filter(s => {
      if (!s.lastAuditedAt) return true;
      return s.lastAuditedAt < ninetyDaysAgo;
    });
  }

  /**
   * Generate comprehensive inventory report
   */
  generateInventoryReport(): {
    totalSystems: number;
    riskDistribution: Record<string, number>;
    auditStatus: {
      upToDate: number;
      requiresAudit: number;
      neverAudited: number;
    };
    criticalSystems: AISystemRegistration[];
    dataSources: string[];
    limitations: string[];
  } {
    const all = this.getAllSystems();
    const riskDistribution = {
      low: this.getSystemsByRisk('low').length,
      medium: this.getSystemsByRisk('medium').length,
      high: this.getSystemsByRisk('high').length,
      critical: this.getSystemsByRisk('critical').length,
    };

    const requiresAudit = this.getSystemsRequiringAudit();
    const neverAudited = all.filter(s => !s.lastAuditedAt).length;
    const upToDate = all.length - requiresAudit.length;

    const criticalSystems = this.getSystemsByRisk('critical');

    const dataSources = Array.from(new Set(all.flatMap(s => s.dataSources)));
    const limitations = Array.from(new Set(all.flatMap(s => s.limitations)));

    return {
      totalSystems: all.length,
      riskDistribution,
      auditStatus: {
        upToDate,
        requiresAudit: requiresAudit.length,
        neverAudited,
      },
      criticalSystems,
      dataSources,
      limitations,
    };
  }
}

/**
 * Enhanced MAP Function with Complete Risk Classification
 */
export class MapFunction {
  private inventory: AISystemInventory;

  constructor() {
    this.inventory = new AISystemInventory();
  }

  /**
   * Comprehensive impact assessment with detailed risk classification
   */
  async assessImpact(
    systemId: string,
    context: {
      stakeholders: string[];
      affectedRights: string[];
      dataProcessing: string[];
      scale: 'individual' | 'group' | 'population' | 'society';
      duration: 'temporary' | 'long-term' | 'permanent';
      reversibility: 'fully-reversible' | 'partially-reversible' | 'irreversible';
    }
  ): Promise<{
    impactLevel: 'low' | 'medium' | 'high' | 'critical';
    riskScore: number;
    findings: string[];
    recommendations: string[];
    mitigationStrategies: string[];
    monitoringRequirements: string[];
  }> {
    const system = this.inventory.getSystem(systemId);
    if (!system) {
      throw new Error(`System ${systemId} not found in inventory`);
    }

    const findings: string[] = [];
    const recommendations: string[] = [];
    const mitigationStrategies: string[] = [];
    const monitoringRequirements: string[] = [];

    let riskScore = 0;

    // Base risk from system classification
    const baseRiskScores = { low: 1, medium: 3, high: 7, critical: 10 };
    riskScore += baseRiskScores[system.riskLevel];

    // Stakeholder impact assessment
    if (
      context.stakeholders.includes('general-public') ||
      context.stakeholders.includes('citizens')
    ) {
      riskScore += 5;
      findings.push('Affects general public or citizens');
      recommendations.push('Conduct public consultation before deployment');
      mitigationStrategies.push('Implement gradual rollout with monitoring');
      monitoringRequirements.push('Track public sentiment and feedback');
    }

    if (context.stakeholders.includes('vulnerable-groups')) {
      riskScore += 4;
      findings.push('Affects vulnerable groups');
      recommendations.push('Conduct equality impact assessment');
      mitigationStrategies.push('Enhanced bias monitoring for protected characteristics');
    }

    // Rights impact assessment
    const fundamentalRights = [
      'voting-rights',
      'freedom-of-speech',
      'privacy',
      'equality',
      'due-process',
    ];
    const affectedFundamentalRights = context.affectedRights.filter(r =>
      fundamentalRights.includes(r)
    );

    if (affectedFundamentalRights.length > 0) {
      riskScore += affectedFundamentalRights.length * 3;
      findings.push(`Affects fundamental rights: ${affectedFundamentalRights.join(', ')}`);
      recommendations.push('Require constitutional review');
      recommendations.push('Implement human oversight for all decisions');
      mitigationStrategies.push('Constitutional compliance monitoring');
      monitoringRequirements.push('Regular constitutional impact reviews');
    }

    // Scale assessment
    const scaleMultipliers = {
      individual: 1,
      group: 2,
      population: 4,
      society: 6,
    };
    riskScore *= scaleMultipliers[context.scale];
    findings.push(`Scale: ${context.scale} (${scaleMultipliers[context.scale]}x multiplier)`);

    // Duration assessment
    const durationMultipliers = {
      temporary: 1,
      'long-term': 2,
      permanent: 3,
    };
    riskScore *= durationMultipliers[context.duration];
    findings.push(
      `Duration: ${context.duration} (${durationMultipliers[context.duration]}x multiplier)`
    );

    // Reversibility assessment
    const reversibilityMultipliers = {
      'fully-reversible': 0.5,
      'partially-reversible': 1,
      irreversible: 2,
    };
    riskScore *= reversibilityMultipliers[context.reversibility];
    findings.push(
      `Reversibility: ${context.reversibility} (${reversibilityMultipliers[context.reversibility]}x multiplier)`
    );

    // Data processing assessment
    const sensitiveDataTypes = [
      'personal-data',
      'political-opinions',
      'voting-records',
      'biometric-data',
    ];
    const processesSensitiveData = context.dataProcessing.some(d => sensitiveDataTypes.includes(d));

    if (processesSensitiveData) {
      riskScore += 4;
      findings.push('Processes sensitive personal data');
      recommendations.push('Conduct DPIA (Data Protection Impact Assessment)');
      recommendations.push('Implement data minimization principles');
      mitigationStrategies.push('GDPR compliance measures');
      mitigationStrategies.push('Data anonymization where possible');
      monitoringRequirements.push('Data processing audit logs');
    }

    // Determine impact level
    let impactLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 50) impactLevel = 'critical';
    else if (riskScore >= 25) impactLevel = 'high';
    else if (riskScore >= 10) impactLevel = 'medium';
    else impactLevel = 'low';

    // Additional recommendations based on impact level
    if (impactLevel === 'critical') {
      recommendations.push('Require Technical Governance Committee approval');
      recommendations.push('Implement emergency shutdown capability');
      monitoringRequirements.push('Real-time performance monitoring');
      monitoringRequirements.push('Incident response plan activation');
    } else if (impactLevel === 'high') {
      recommendations.push('Require senior management approval');
      monitoringRequirements.push('Weekly performance reviews');
    }

    return {
      impactLevel,
      riskScore,
      findings,
      recommendations,
      mitigationStrategies,
      monitoringRequirements,
    };
  }

  /**
   * Generate comprehensive model card with risk assessment
   */
  generateModelCard(systemId: string): string {
    const system = this.inventory.getSystem(systemId);
    if (!system) {
      throw new Error(`System ${systemId} not found in inventory`);
    }

    const riskAssessment = this.generateRiskAssessment(systemId);

    return `
# Model Card: ${system.name}

## System Information
- **ID**: ${system.id}
- **Owner**: ${system.owner}
- **Risk Level**: ${system.riskLevel.toUpperCase()}
- **Registered**: ${system.registeredAt.toISOString()}
- **Last Audit**: ${system.lastAuditedAt?.toISOString() || 'Never'}

## Model Details
- **Provider**: ${system.model.provider}
- **Version**: ${system.model.version}
- **Type**: ${system.model.type}

## Intended Use
${system.description}

## Data Sources
${system.dataSources.map(d => `- ${d}`).join('\n')}

## Limitations
${system.limitations.map(l => `- ${l}`).join('\n')}

## Bias Mitigations
${system.biasMitigations.map(m => `- ${m}`).join('\n')}

## Risk Assessment
${riskAssessment}

## Governance Requirements
- **Approval Required**: ${system.riskLevel === 'high' || system.riskLevel === 'critical' ? 'Yes' : 'No'}
- **Audit Frequency**: ${system.riskLevel === 'critical' ? 'Monthly' : system.riskLevel === 'high' ? 'Quarterly' : 'Annually'}
- **Monitoring**: Continuous bias and performance monitoring required
`.trim();
  }

  /**
   * Generate risk assessment report
   */
  private generateRiskAssessment(systemId: string): string {
    const system = this.inventory.getSystem(systemId);
    if (!system) return 'System not found';

    const riskFactors = [];

    // Risk level assessment
    const riskDescriptions = {
      low: 'Minimal risk - routine monitoring sufficient',
      medium: 'Moderate risk - regular reviews required',
      high: 'High risk - enhanced controls and oversight needed',
      critical: 'Critical risk - maximum controls and governance required',
    };

    riskFactors.push(`**Overall Risk Level**: ${system.riskLevel.toUpperCase()}`);
    riskFactors.push(`**Description**: ${riskDescriptions[system.riskLevel]}`);

    // Data sensitivity assessment
    const sensitiveData = ['personal', 'political', 'voting', 'biometric'];
    const hasSensitiveData = system.dataSources.some(ds =>
      sensitiveData.some(s => ds.toLowerCase().includes(s))
    );

    if (hasSensitiveData) {
      riskFactors.push(`**Data Sensitivity**: High - Processes sensitive data`);
      riskFactors.push(`**GDPR Compliance**: Required - Data Protection Impact Assessment needed`);
    }

    // Bias risk assessment
    if (system.biasMitigations.length === 0) {
      riskFactors.push(`**Bias Risk**: High - No bias mitigations documented`);
    } else {
      riskFactors.push(
        `**Bias Mitigations**: ${system.biasMitigations.length} strategies implemented`
      );
    }

    // Operational risk
    if (system.limitations.length > 0) {
      riskFactors.push(
        `**Operational Limitations**: ${system.limitations.length} documented limitations`
      );
    }

    return riskFactors.join('\n');
  }

  /**
   * Get complete system inventory
   */
  getInventory(): AISystemInventory {
    return this.inventory;
  }

  /**
   * Generate comprehensive MAP report
   */
  generateMapReport(): {
    inventory: ReturnType<AISystemInventory['generateInventoryReport']>;
    riskSummary: {
      totalRiskScore: number;
      systemsByRisk: Record<string, number>;
      criticalFindings: string[];
    };
    recommendations: string[];
  } {
    const inventory = this.inventory.generateInventoryReport();

    // Calculate aggregate risk metrics
    let totalRiskScore = 0;
    const systemsByRisk = { low: 0, medium: 0, high: 0, critical: 0 };
    const criticalFindings: string[] = [];

    for (const system of inventory.criticalSystems) {
      systemsByRisk[system.riskLevel]++;
      totalRiskScore += { low: 1, medium: 3, high: 7, critical: 10 }[system.riskLevel];

      if (!system.lastAuditedAt) {
        criticalFindings.push(`${system.name} has never been audited`);
      }
    }

    const recommendations = [
      'Conduct immediate audit of all critical systems',
      'Implement automated risk scoring for new systems',
      'Establish regular model card updates',
      'Create data protection impact assessments for high-risk systems',
      'Implement continuous bias monitoring for all systems',
    ];

    return {
      inventory,
      riskSummary: {
        totalRiskScore,
        systemsByRisk,
        criticalFindings,
      },
      recommendations,
    };
  }
}
