/**
 * Political Neutrality Enforcement
 *
 * Ensures AI systems maintain absolute political neutrality.
 *
 * @module governance/political-neutrality
 */

/**
 * Political neutrality check result
 */
export interface NeutralityCheckResult {
  /** Overall neutrality score (0-1, higher is more neutral) */
  neutralityScore: number;
  /** Pass/fail based on threshold */
  passed: boolean;
  /** Detected biases */
  biases: Array<{
    type: 'partisan' | 'ideological' | 'framing' | 'sentiment';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    evidence: string;
  }>;
  /** Recommendations for improvement */
  recommendations: string[];
}

/**
 * Political Neutrality Enforcer
 *
 * Tier 0 (Constitutional) requirement - cannot be bypassed.
 */
export class PoliticalNeutralityEnforcer {
  private readonly neutralityThreshold = 0.9; // Minimum score to pass

  /**
   * Check text for political neutrality
   */
  async checkNeutrality(text: string): Promise<NeutralityCheckResult> {
    const biases: NeutralityCheckResult['biases'] = [];
    const recommendations: string[] = [];

    // Check for partisan keywords
    const partisanKeywords = {
      // Placeholder - in production, use comprehensive political lexicon
      left: ['socialist', 'progressive', 'liberal', 'leftist'],
      right: ['conservative', 'traditional', 'right-wing', 'libertarian'],
      center: ['moderate', 'centrist'],
    };

    const lowerText = text.toLowerCase();
    let leftCount = 0;
    let rightCount = 0;
    let centerCount = 0;

    for (const keyword of partisanKeywords.left) {
      if (lowerText.includes(keyword)) leftCount++;
    }
    for (const keyword of partisanKeywords.right) {
      if (lowerText.includes(keyword)) rightCount++;
    }
    for (const keyword of partisanKeywords.center) {
      if (lowerText.includes(keyword)) centerCount++;
    }

    const totalPartisan = leftCount + rightCount;
    if (totalPartisan > 3) {
      biases.push({
        type: 'partisan',
        severity: 'high',
        description: 'Excessive use of partisan language',
        evidence: `Left: ${leftCount}, Right: ${rightCount}, Center: ${centerCount}`,
      });
      recommendations.push('Use neutral, descriptive language instead of political labels');
    }

    // Check for ideological framing
    const framingIndicators = [
      'obviously',
      'clearly',
      'undeniably',
      'everyone knows',
      'always',
      'never',
      'only solution',
      'only way',
    ];

    for (const indicator of framingIndicators) {
      if (lowerText.includes(indicator)) {
        biases.push({
          type: 'framing',
          severity: 'medium',
          description: `Absolutist framing detected: "${indicator}"`,
          evidence: indicator,
        });
        recommendations.push('Avoid absolute statements; present multiple perspectives');
      }
    }

    // Check for sentiment imbalance
    const positiveWords = ['excellent', 'great', 'wonderful', 'perfect', 'amazing'];
    const negativeWords = ['terrible', 'awful', 'horrible', 'disastrous', 'catastrophic'];

    const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;

    if (Math.abs(positiveCount - negativeCount) > 2) {
      biases.push({
        type: 'sentiment',
        severity: 'medium',
        description: 'Sentiment imbalance detected',
        evidence: `Positive: ${positiveCount}, Negative: ${negativeCount}`,
      });
      recommendations.push('Balance emotional language or use neutral alternatives');
    }

    // Calculate neutrality score
    const biasDeductions = biases.reduce((sum, bias) => {
      const severityWeights = { low: 0.05, medium: 0.1, high: 0.2, critical: 0.4 };
      return sum + severityWeights[bias.severity];
    }, 0);

    const neutralityScore = Math.max(0, 1 - biasDeductions);
    const passed =
      neutralityScore >= this.neutralityThreshold && !biases.some(b => b.severity === 'critical');

    return {
      neutralityScore,
      passed,
      biases,
      recommendations,
    };
  }

  /**
   * Check for voting manipulation attempts
   */
  detectVotingManipulation(data: unknown): {
    detected: boolean;
    findings: string[];
  } {
    const findings: string[] = [];

    if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;

      // Check for direct vote manipulation
      const votingFields = ['votes', 'voteCount', 'votingResults', 'voteScore'];
      for (const field of votingFields) {
        if (field in obj) {
          findings.push(`Attempted to modify voting data: ${field}`);
        }
      }

      // Check for vote weighting manipulation
      if ('voteWeight' in obj || 'votePriority' in obj) {
        findings.push('Attempted to manipulate vote weighting (violates One Person One Vote)');
      }

      // Check for outcome prediction/influencing
      if ('predictedOutcome' in obj || 'recommendedVote' in obj) {
        findings.push('Attempted to influence voting outcome');
      }
    }

    return {
      detected: findings.length > 0,
      findings,
    };
  }

  /**
   * Check for speech/content moderation bias
   */
  detectModerationBias(action: {
    type: 'remove' | 'flag' | 'warn' | 'allow';
    content: string;
    reason: string;
  }): {
    biased: boolean;
    findings: string[];
  } {
    const findings: string[] = [];

    // Check if moderation reason contains political bias
    const politicalReasons = [
      'wrong ideology',
      'incorrect opinion',
      'disagree',
      'against our values',
      'offensive viewpoint',
    ];

    const lowerReason = action.reason.toLowerCase();
    for (const reason of politicalReasons) {
      if (lowerReason.includes(reason)) {
        findings.push(`Politically biased moderation reason: "${reason}"`);
      }
    }

    // Moderation should only be for objective violations
    const validReasons = [
      'spam',
      'harassment',
      'personal attack',
      'hate speech',
      'illegal content',
      'explicit content',
      'off-topic',
    ];

    const hasValidReason = validReasons.some(r => lowerReason.includes(r));
    if (!hasValidReason && action.type !== 'allow') {
      findings.push('Moderation action lacks objective justification');
    }

    return {
      biased: findings.length > 0,
      findings,
    };
  }

  /**
   * Check for power distribution manipulation
   */
  detectPowerManipulation(change: {
    userId: string;
    action: 'grant' | 'revoke' | 'modify';
    permission: string;
    reason: string;
  }): {
    suspicious: boolean;
    findings: string[];
  } {
    const findings: string[] = [];

    // AI should never autonomously change power structures
    findings.push('AI systems cannot autonomously modify user roles or permissions');
    findings.push('All power distribution changes require human approval');

    // Check for political motivation in reason
    const politicalMotivations = [
      'political alignment',
      'ideology',
      'party affiliation',
      'voting history',
      'political views',
    ];

    const lowerReason = change.reason.toLowerCase();
    for (const motivation of politicalMotivations) {
      if (lowerReason.includes(motivation)) {
        findings.push(`Politically motivated permission change: "${motivation}"`);
      }
    }

    return {
      suspicious: true, // Always suspicious - requires human review
      findings,
    };
  }
}
