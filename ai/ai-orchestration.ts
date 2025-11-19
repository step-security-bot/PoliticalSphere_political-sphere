/**
 * AI Orchestration System
 *
 * Provides high-level orchestration patterns for AI operations in the political sphere simulation.
 * This module integrates with the libs/ai-system for advanced multi-agent workflows.
 */

import { OrchestrationEngine } from '../libs/ai-system/src/orchestration/engine';
import { nlpService } from '../libs/ai-system/src/nlp';
import type {
  Agent,
  AgentInput,
  AgentOutput,
  OrchestrationConfig,
  OrchestrationPattern,
} from '../libs/ai-system/src/types/index';
import type { NLPAnalysisResult } from '../libs/ai-system/src/nlp';

/**
 * Learning Data for NPC Adaptation
 */
export interface LearningData {
  playerAction: string;
  context: Record<string, unknown>;
  outcome: 'success' | 'failure' | 'neutral';
  timestamp: Date;
  npcStrategy: string;
  effectiveness: number;
}

/**
 * Adaptive Learning System for NPC Strategies
 */
export class AdaptiveLearningSystem {
  private learningHistory: LearningData[] = [];
  private strategyEffectiveness: Map<string, { success: number; total: number }> = new Map();

  /**
   * Record a learning event
   */
  recordLearning(data: LearningData): void {
    this.learningHistory.push(data);

    // Update strategy effectiveness
    const key = data.npcStrategy;
    const current = this.strategyEffectiveness.get(key) || { success: 0, total: 0 };
    current.total++;
    if (data.outcome === 'success') {
      current.success++;
    }
    this.strategyEffectiveness.set(key, current);

    // Limit history size to prevent memory issues
    if (this.learningHistory.length > 1000) {
      this.learningHistory = this.learningHistory.slice(-500);
    }
  }

  /**
   * Get the most effective strategy for a given context
   */
  getBestStrategy(context: Record<string, unknown>): string {
    const relevantStrategies = Array.from(this.strategyEffectiveness.entries())
      .map(([strategy, stats]) => ({
        strategy,
        effectiveness: stats.success / stats.total,
        confidence: stats.total / (this.learningHistory.length + 1),
      }))
      .filter(s => s.confidence > 0.1) // Minimum confidence threshold
      .sort((a, b) => b.effectiveness - a.effectiveness);

    return relevantStrategies[0]?.strategy || 'default';
  }

  /**
   * Analyze player patterns and suggest adaptations
   */
  analyzePlayerPatterns(): {
    dominantStrategies: string[];
    adaptationSuggestions: string[];
  } {
    const recentActions = this.learningHistory.slice(-50);
    const actionCounts = new Map<string, number>();

    for (const event of recentActions) {
      actionCounts.set(event.playerAction, (actionCounts.get(event.playerAction) || 0) + 1);
    }

    const dominantActions = Array.from(actionCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([action]) => action);

    const suggestions: string[] = [];
    if (dominantActions.includes('aggressive_legislation')) {
      suggestions.push('Increase focus on coalition building');
    }
    if (dominantActions.includes('media_campaigns')) {
      suggestions.push('Develop counter-narrative strategies');
    }
    if (dominantActions.includes('judicial_appeals')) {
      suggestions.push('Strengthen legal compliance measures');
    }

    return {
      dominantStrategies: dominantActions,
      adaptationSuggestions: suggestions,
    };
  }

  /**
   * Export learning data for persistence
   */
  exportLearningData(): LearningData[] {
    return [...this.learningHistory];
  }

  /**
   * Import learning data
   */
  importLearningData(data: LearningData[]): void {
    this.learningHistory = [...this.learningHistory, ...data];
    // Rebuild effectiveness map
    this.strategyEffectiveness.clear();
    for (const event of this.learningHistory) {
      const key = event.npcStrategy;
      const current = this.strategyEffectiveness.get(key) || { success: 0, total: 0 };
      current.total++;
      if (event.outcome === 'success') {
        current.success++;
      }
      this.strategyEffectiveness.set(key, current);
    }
  }
}

/**
 * Political AI Orchestrator
 *
 * Specialized orchestrator for political simulation scenarios, with built-in governance
 * and bias monitoring capabilities.
 */
export class PoliticalAIOrchestrator {
  private engine: OrchestrationEngine;
  private governanceEnabled: boolean = true;
  private learningSystem: AdaptiveLearningSystem;

  constructor(config?: Partial<OrchestrationConfig>) {
    this.engine = new OrchestrationEngine({
      framework: 'semantic-kernel',
      pattern: 'sequential',
      ...config,
    });
    this.learningSystem = new AdaptiveLearningSystem();
  }

  /**
   * Execute political analysis workflow with NLP enhancement
   */
  async analyzePoliticalScenario(
    agents: Agent[],
    scenario: string,
    context?: Record<string, unknown>,
  ): Promise<{
    outputs: AgentOutput[];
    nlpAnalysis: NLPAnalysisResult;
    biasAssessment: ReturnType<typeof orchestrationUtils.validatePoliticalNeutrality>;
  }> {
    // Perform NLP analysis on the scenario
    const nlpAnalysis = await nlpService.analyzeText(scenario);

    const input: AgentInput = {
      prompt: `Analyze the following political scenario with focus on democratic principles, stakeholder impacts, and potential outcomes. Consider the sentiment (${nlpAnalysis.sentiment?.label || 'unknown'}) and key topics: ${scenario}`,
      context: {
        domain: 'politics',
        analysisType: 'scenario',
        nlpAnalysis,
        ...context,
      },
    };

    const result = await this.engine.execute({
      agents,
      prompt: input.prompt,
      context: input.context,
    });

    if (!result.success) {
      throw new Error(`Orchestration failed: ${result.error?.message}`);
    }

    // Validate political neutrality of outputs
    const biasAssessment = orchestrationUtils.validatePoliticalNeutrality(result.outputs);

    return {
      outputs: result.outputs,
      nlpAnalysis,
      biasAssessment,
    };
  }

  /**
   * Execute policy debate simulation
   */
  async simulatePolicyDebate(
    agents: Agent[],
    policyProposal: string,
    stakeholders: string[],
  ): Promise<AgentOutput[]> {
    // Use group-chat pattern for debate
    this.engine.setPattern('group-chat');

    const input: AgentInput = {
      prompt: `Debate the following policy proposal from multiple stakeholder perspectives: ${policyProposal}`,
      context: {
        domain: 'politics',
        simulationType: 'debate',
        stakeholders,
      },
    };

    const result = await this.engine.execute({
      agents,
      prompt: input.prompt,
      context: input.context,
    });

    if (!result.success) {
      throw new Error(`Debate simulation failed: ${result.error?.message}`);
    }

    return result.outputs;
  }

  /**
   * Execute concurrent fact-checking
   */
  async factCheckStatements(agents: Agent[], statements: string[]): Promise<AgentOutput[]> {
    // Use concurrent pattern for parallel fact-checking
    this.engine.setPattern('concurrent');

    const input: AgentInput = {
      prompt: `Fact-check the following statements for accuracy, bias, and political implications: ${statements.join('; ')}`,
      context: {
        domain: 'politics',
        taskType: 'fact-checking',
        statements,
      },
    };

    const result = await this.engine.execute({
      agents,
      prompt: input.prompt,
      context: input.context,
    });

    if (!result.success) {
      throw new Error(`Fact-checking failed: ${result.error?.message}`);
    }

    return result.outputs;
  }

  /**
   * Execute legislative process simulation
   */
  async simulateLegislation(
    agents: Agent[],
    billText: string,
    committeeMembers: string[],
  ): Promise<AgentOutput[]> {
    // Use handoff pattern for legislative stages
    this.engine.setPattern('handoff');

    const input: AgentInput = {
      prompt: `Simulate the legislative process for the following bill through committee review, debate, and voting: ${billText}`,
      context: {
        domain: 'politics',
        processType: 'legislation',
        committeeMembers,
      },
    };

    const result = await this.engine.execute({
      agents,
      prompt: input.prompt,
      context: input.context,
    });

    if (!result.success) {
      throw new Error(`Legislation simulation failed: ${result.error?.message}`);
    }

    return result.outputs;
  }

  /**
   * Execute adaptive NPC strategy based on player actions
   */
  async executeAdaptiveStrategy(
    playerActions: string[],
    currentContext: Record<string, unknown>,
  ): Promise<{
    strategy: string;
    execution: AgentOutput[];
    learning: ReturnType<AdaptiveLearningSystem['analyzePlayerPatterns']>;
  }> {
    // Analyze player patterns
    const learning = this.learningSystem.analyzePlayerPatterns();

    // Get best strategy based on learning
    const strategy = this.learningSystem.getBestStrategy(currentContext);

    // Adapt strategy based on player actions
    let adaptedStrategy = strategy;
    if (playerActions.includes('aggressive_policy')) {
      adaptedStrategy = 'defensive_coalition';
    } else if (playerActions.includes('media_focus')) {
      adaptedStrategy = 'counter_narrative';
    }

    // Execute strategy
    const input: AgentInput = {
      prompt: `Execute ${adaptedStrategy} strategy in response to player actions: ${playerActions.join(', ')}`,
      context: {
        ...currentContext,
        strategy: adaptedStrategy,
        playerActions,
        learningInsights: learning,
      },
    };

    const result = await this.engine.execute({
      agents: [], // Would need actual agents
      prompt: input.prompt,
      context: input.context,
    });

    // Record learning event
    this.learningSystem.recordLearning({
      playerAction: playerActions[0] || 'unknown',
      context: currentContext,
      outcome: result.success ? 'success' : 'failure',
      timestamp: new Date(),
      npcStrategy: adaptedStrategy,
      effectiveness: result.success ? 0.8 : 0.3,
    });

    return {
      strategy: adaptedStrategy,
      execution: result.outputs,
      learning,
    };
  }

  /**
   * Record player action for learning
   */
  recordPlayerAction(
    action: string,
    context: Record<string, unknown>,
    outcome: 'success' | 'failure' | 'neutral',
  ): void {
    this.learningSystem.recordLearning({
      playerAction: action,
      context,
      outcome,
      timestamp: new Date(),
      npcStrategy: 'observed',
      effectiveness: outcome === 'success' ? 1 : outcome === 'neutral' ? 0.5 : 0,
    });
  }

  /**
   * Get learning insights
   */
  getLearningInsights(): ReturnType<AdaptiveLearningSystem['analyzePlayerPatterns']> {
    return this.learningSystem.analyzePlayerPatterns();
  }

  /**
   * Set orchestration pattern
   */
  setPattern(pattern: OrchestrationPattern): void {
    this.engine.setPattern(pattern);
  }

  /**
   * Enable/disable governance features
   */
  setGovernance(enabled: boolean): void {
    this.governanceEnabled = enabled;
  }

  /**
   * Get current configuration
   */
  getConfig(): OrchestrationConfig {
    return this.engine.getConfig();
  }
}

/**
 * Pre-configured orchestrators for common political AI tasks
 */
export const politicalOrchestrators = {
  /**
   * Scenario analysis orchestrator
   */
  scenarioAnalyzer: new PoliticalAIOrchestrator({
    pattern: 'sequential',
  }),

  /**
   * Debate simulation orchestrator
   */
  debateSimulator: new PoliticalAIOrchestrator({
    pattern: 'group-chat',
  }),

  /**
   * Fact-checking orchestrator
   */
  factChecker: new PoliticalAIOrchestrator({
    pattern: 'concurrent',
  }),

  /**
   * Legislative process orchestrator
   */
  legislationSimulator: new PoliticalAIOrchestrator({
    pattern: 'handoff',
  }),

  /**
   * Adaptive NPC strategy orchestrator
   */
  adaptiveNPC: new PoliticalAIOrchestrator({
    pattern: 'magentic',
  }),
};

/**
 * Utility functions for orchestration
 */
export const orchestrationUtils = {
  /**
   * Validate orchestration results for political neutrality
   */
  validatePoliticalNeutrality(outputs: AgentOutput[]): {
    isNeutral: boolean;
    biasScore: number;
    recommendations: string[];
  } {
    // Simple bias detection based on content analysis
    const biasIndicators = ['biased', 'partisan', 'extreme', 'polarizing'];
    let totalBiasScore = 0;
    const recommendations: string[] = [];

    for (const output of outputs) {
      const content = output.content.toLowerCase();
      let outputBias = 0;

      for (const indicator of biasIndicators) {
        if (content.includes(indicator)) {
          outputBias += 0.2;
        }
      }

      // Check for balanced language
      if (!content.includes('however') && !content.includes('on the other hand')) {
        outputBias += 0.1;
      }

      totalBiasScore += outputBias;
    }

    const avgBiasScore = totalBiasScore / outputs.length;
    const isNeutral = avgBiasScore < 0.3;

    if (!isNeutral) {
      recommendations.push('Consider including counter-arguments for balance');
      recommendations.push('Review language for potential bias indicators');
    }

    return {
      isNeutral,
      biasScore: avgBiasScore,
      recommendations,
    };
  },

  /**
   * Measure orchestration effectiveness
   */
  measureEffectiveness(outputs: AgentOutput[]): {
    completeness: number;
    consistency: number;
    relevance: number;
  } {
    let completeness = 0;
    let consistency = 0;
    let relevance = 0;

    // Simple heuristics
    const avgLength = outputs.reduce((sum, o) => sum + o.content.length, 0) / outputs.length;
    completeness = Math.min(avgLength / 500, 1); // Assume 500 chars is complete

    // Check for consistent terminology
    const terms = outputs.flatMap(o => o.content.split(' '));
    const uniqueTerms = new Set(terms);
    consistency = uniqueTerms.size / terms.length;

    // Relevance based on political keywords
    const politicalKeywords = ['policy', 'government', 'democracy', 'citizen', 'law'];
    const keywordMatches = outputs.filter(o =>
      politicalKeywords.some(kw => o.content.toLowerCase().includes(kw)),
    ).length;
    relevance = keywordMatches / outputs.length;

    return { completeness, consistency, relevance };
  },
};
