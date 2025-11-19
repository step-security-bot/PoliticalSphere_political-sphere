/**
 * Judiciary Service
 * Handles judiciary-related operations using Prisma database
 */

import { getLogger } from '@political-sphere/shared';
import { JudiciaryDB, WhereClause } from '../services/database.service.js';
// import { nlpService } from '../../../../libs/ai-system/src/nlp';

const logger = getLogger({ service: 'judiciary' });

export interface CreateCaseData {
  title: string;
  description?: string;
  type: 'constitutional' | 'civil' | 'criminal';
}

export interface CreateJudgeData {
  userId: string;
  court: string;
  position: string;
  termEndsAt?: Date;
}

export interface CreateRulingData {
  caseId: string;
  judgeId: string;
  decision: string;
  reasoning?: string;
}

export interface CreateReviewData {
  caseId: string;
  type: 'appeal' | 'judicial_review';
}

export interface CreatePrecedentData {
  citation: string;
  summary: string;
  holding: string;
  caseId?: string;
}

export class JudiciaryService {
  /**
   * Create a new case
   */
  async createCase(data: CreateCaseData) {
    try {
      logger.info('Creating case', { title: data.title, type: data.type });
      const caseData = await JudiciaryDB.createCase({
        title: data.title,
        description: data.description,
        type: data.type,
        status: 'filed',
        filedAt: new Date(),
      });
      logger.info('Case created', { id: caseData.id });
      return caseData;
    } catch (error) {
      logger.error('Failed to create case', { error: error.message, data });
      throw error;
    }
  }

  /**
   * Get case by ID
   */
  async getCase(id: string) {
    try {
      const caseData = await JudiciaryDB.getCase(id);
      if (!caseData) {
        throw new Error(`Case with id ${id} not found`);
      }
      return caseData;
    } catch (error) {
      logger.error('Failed to get case', { id, error: error.message });
      throw error;
    }
  }

  /**
   * List cases with optional filtering
   */
  async listCases(options: { status?: string; type?: string; limit?: number } = {}) {
    try {
      const where: any = {};
      if (options.status) {
        where.status = options.status;
      }
      if (options.type) {
        where.type = options.type;
      }

      const cases = await JudiciaryDB.listCases(where, {
        orderBy: { filedAt: 'desc' },
        take: options.limit || 50,
      });

      return cases;
    } catch (error) {
      logger.error('Failed to list cases', { options, error: error.message });
      throw error;
    }
  }

  /**
   * Update case
   */
  async updateCase(
    id: string,
    data: Partial<CreateCaseData & { status: string; decidedAt?: Date }>
  ) {
    try {
      logger.info('Updating case', { id, data });
      const caseData = await JudiciaryDB.updateCase(id, data);
      logger.info('Case updated', { id });
      return caseData;
    } catch (error) {
      logger.error('Failed to update case', { id, data, error: error.message });
      throw error;
    }
  }

  /**
   * Decide case
   */
  async decideCase(id: string) {
    try {
      logger.info('Deciding case', { id });
      const caseData = await this.updateCase(id, {
        status: 'decided',
        decidedAt: new Date(),
      });
      logger.info('Case decided', { id });
      return caseData;
    } catch (error) {
      logger.error('Failed to decide case', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Create judge
   */
  async createJudge(data: CreateJudgeData) {
    try {
      logger.info('Creating judge', {
        userId: data.userId,
        court: data.court,
        position: data.position,
      });
      const judge = await JudiciaryDB.createJudge({
        userId: data.userId,
        court: data.court,
        position: data.position,
        appointedAt: new Date(),
        termEndsAt: data.termEndsAt,
      });
      logger.info('Judge created', { id: judge.id });
      return judge;
    } catch (error) {
      logger.error('Failed to create judge', { error: error.message, data });
      throw error;
    }
  }

  /**
   * Get judge by ID
   */
  async getJudge(id: string) {
    try {
      const judge = await JudiciaryDB.getJudge(id);
      if (!judge) {
        throw new Error(`Judge with id ${id} not found`);
      }
      return judge;
    } catch (error) {
      logger.error('Failed to get judge', { id, error: error.message });
      throw error;
    }
  }

  /**
   * List judges
   */
  async listJudges(options: { court?: string; position?: string; limit?: number } = {}) {
    try {
      const where: any = {};
      if (options.court) where.court = options.court;
      if (options.position) where.position = options.position;

      const judges = await JudiciaryDB.listJudges(where);

      return judges;
    } catch (error) {
      logger.error('Failed to list judges', { options, error: error.message });
      throw error;
    }
  }

  /**
   * Update judge
   */
  async updateJudge(id: string, data: Partial<CreateJudgeData & { termEndsAt?: Date }>) {
    try {
      logger.info('Updating judge', { id, data });
      const judge = await JudiciaryDB.updateJudge(id, data);
      logger.info('Judge updated', { id });
      return judge;
    } catch (error) {
      logger.error('Failed to update judge', { id, data, error: error.message });
      throw error;
    }
  }

  /**
   * Create ruling
   */
  async createRuling(data: CreateRulingData) {
    try {
      logger.info('Creating ruling', { caseId: data.caseId, judgeId: data.judgeId });
      const ruling = await JudiciaryDB.createRuling({
        caseId: data.caseId,
        judgeId: data.judgeId,
        decision: data.decision,
        reasoning: data.reasoning,
        issuedAt: new Date(),
      });
      logger.info('Ruling created', { id: ruling.id });
      return ruling;
    } catch (error) {
      logger.error('Failed to create ruling', { error: error.message, data });
      throw error;
    }
  }

  /**
   * Get ruling by ID
   */
  async getRuling(id: string) {
    try {
      const ruling = await JudiciaryDB.getRuling(id);
      if (!ruling) {
        throw new Error(`Ruling with id ${id} not found`);
      }
      return ruling;
    } catch (error) {
      logger.error('Failed to get ruling', { id, error: error.message });
      throw error;
    }
  }

  /**
   * List rulings for a case
   */
  async listRulings(caseId: string) {
    try {
      const rulings = await JudiciaryDB.listRulings({ caseId });
      return rulings;
    } catch (error) {
      logger.error('Failed to list rulings', { caseId, error: error.message });
      throw error;
    }
  }

  /**
   * Create review (appeal or judicial review)
   */
  async createReview(data: CreateReviewData) {
    try {
      logger.info('Creating review', { caseId: data.caseId, type: data.type });
      const review = await JudiciaryDB.createReview({
        caseId: data.caseId,
        type: data.type,
        status: 'pending',
        filedAt: new Date(),
      });
      logger.info('Review created', { id: review.id });
      return review;
    } catch (error) {
      logger.error('Failed to create review', { error: error.message, data });
      throw error;
    }
  }

  /**
   * Get review by ID
   */
  async getReview(id: string) {
    try {
      const review = await JudiciaryDB.getReview(id);
      if (!review) {
        throw new Error(`Review with id ${id} not found`);
      }
      return review;
    } catch (error) {
      logger.error('Failed to get review', { id, error: error.message });
      throw error;
    }
  }

  /**
   * List reviews for a case
   */
  async listReviews(
    caseId: string,
    options: { type?: string; status?: string; limit?: number } = {}
  ) {
    try {
      const where: any = { caseId };
      if (options.type) where.type = options.type;
      if (options.status) where.status = options.status;

      const reviews = await JudiciaryDB.listReviews(where, {
        orderBy: { filedAt: 'desc' },
        take: options.limit || 20,
      });

      return reviews;
    } catch (error) {
      logger.error('Failed to list reviews', { caseId, options, error: error.message });
      throw error;
    }
  }

  /**
   * Update review status
   */
  async updateReview(
    id: string,
    data: { status: 'pending' | 'granted' | 'denied'; decidedAt?: Date }
  ) {
    try {
      logger.info('Updating review', { id, status: data.status });
      const review = await JudiciaryDB.updateReview(id, {
        status: data.status,
        decidedAt: data.decidedAt || (data.status !== 'pending' ? new Date() : undefined),
      });
      logger.info('Review updated', { id, status: data.status });
      return review;
    } catch (error) {
      logger.error('Failed to update review', { id, data, error: error.message });
      throw error;
    }
  }

  /**
   * Grant review
   */
  async grantReview(id: string) {
    try {
      return await this.updateReview(id, { status: 'granted', decidedAt: new Date() });
    } catch (error) {
      logger.error('Failed to grant review', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Deny review
   */
  async denyReview(id: string) {
    try {
      return await this.updateReview(id, { status: 'denied', decidedAt: new Date() });
    } catch (error) {
      logger.error('Failed to deny review', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Create precedent
   */
  async createPrecedent(data: CreatePrecedentData) {
    try {
      logger.info('Creating precedent', { citation: data.citation });
      const precedent = await JudiciaryDB.createPrecedent({
        citation: data.citation,
        summary: data.summary,
        holding: data.holding,
        caseId: data.caseId,
      });
      logger.info('Precedent created', { id: precedent.id });
      return precedent;
    } catch (error) {
      logger.error('Failed to create precedent', { error: error.message, data });
      throw error;
    }
  }

  /**
   * List precedents
   */
  async listPrecedents(options: { caseId?: string; limit?: number } = {}) {
    try {
      const where: any = {};
      if (options.caseId) where.caseId = options.caseId;

      const precedents = await JudiciaryDB.listPrecedents(where);

      return precedents;
    } catch (error) {
      logger.error('Failed to list precedents', { options, error: error.message });
      throw error;
    }
  }

  /**
   * Get cases by judge
   */
  async getCasesByJudge(judgeId: string) {
    try {
      // Get all rulings by this judge, then get the associated cases
      const rulings = await JudiciaryDB.listRulings({ judgeId });
      const caseIds = [...new Set(rulings.map(r => r.caseId))];

      if (caseIds.length === 0) {
        return [];
      }

      const cases = await Promise.all(caseIds.map(id => this.getCase(id)));
      return cases;
    } catch (error) {
      logger.error('Failed to get cases by judge', { judgeId, error: error.message });
      throw error;
    }
  }

  /**
   * Get active cases (not decided)
   */
  async getActiveCases() {
    try {
      return await this.listCases({ status: 'filed' });
    } catch (error) {
      logger.error('Failed to get active cases', { error: error.message });
      throw error;
    }
  }

  /**
   * Get cases under review
   */
  async getCasesUnderReview() {
    try {
      return await this.listCases({ status: 'under_review' });
    } catch (error) {
      logger.error('Failed to get cases under review', { error: error.message });
      throw error;
    }
  }

  /**
   * Analyze case content using NLP for legal insights
   */
  async analyzeCaseNLP(caseId: string): Promise<{
    analysis: any;
    sentiment: any;
    entities: any[];
    keywords: string[];
    complexity: {
      score: number;
      factors: string[];
    };
  }> {
    try {
      const caseData = await this.getCase(caseId);
      const content = `${caseData.title} ${caseData.description || ''}`;

      // Stub NLP analysis for now
      const analysis = { sentiment: { label: 'neutral', score: 0.5 } };

      // Calculate legal complexity
      const complexity = this.calculateLegalComplexity(content);

      return {
        analysis,
        sentiment: analysis.sentiment,
        entities: [],
        keywords: content.split(' ').slice(0, 5),
        complexity,
      };
    } catch (error) {
      logger.error('Failed to analyze case with NLP', { caseId, error: error.message });
      throw error;
    }
  }

  /**
   * Generate automated legal reasoning for a case
   */
  async generateLegalReasoning(caseId: string, judgeId: string): Promise<string> {
    try {
      const caseData = await this.getCase(caseId);
      const judge = await this.getJudge(judgeId);

      // Stub legal reasoning generation
      return `As Judge ${judge.position} in the ${judge.court}, I have reviewed the case "${caseData.title}". Based on the facts presented and applicable legal principles, I conclude that the matter requires careful consideration of constitutional principles and fairness.`;
    } catch (error) {
      logger.error('Failed to generate legal reasoning', { caseId, judgeId, error: error.message });
      throw error;
    }
  }

  /**
   * Classify case type and suggest similar precedents
   */
  async classifyCaseAndFindPrecedents(caseId: string): Promise<{
    predictedType: string;
    confidence: number;
    similarPrecedents: any[];
  }> {
    try {
      const caseData = await this.getCase(caseId);

      // Stub classification for now
      const predictedType = caseData.type;
      const confidence = 0.8;

      // Find similar precedents (simplified)
      const precedents = await this.listPrecedents({ limit: 10 });
      const similarPrecedents = precedents.slice(0, 3);

      return {
        predictedType,
        confidence,
        similarPrecedents,
      };
    } catch (error) {
      logger.error('Failed to classify case and find precedents', { caseId, error: error.message });
      throw error;
    }
  }

  /**
   * Calculate legal complexity of case content
   */
  private calculateLegalComplexity(content: string): { score: number; factors: string[] } {
    const factors: string[] = [];
    let score = 0;

    // Length complexity
    if (content.length > 1000) {
      score += 2;
      factors.push('Long case description');
    } else if (content.length > 500) {
      score += 1;
      factors.push('Moderate length description');
    }

    // Legal terminology density
    const legalTerms = [
      'constitutional',
      'rights',
      'law',
      'statute',
      'precedent',
      'jurisdiction',
      'remedy',
    ];
    const termCount = legalTerms.filter(term => content.toLowerCase().includes(term)).length;
    if (termCount > 3) {
      score += 2;
      factors.push('High legal terminology density');
    } else if (termCount > 1) {
      score += 1;
      factors.push('Moderate legal terminology');
    }

    // Multiple parties/issues
    const partyIndicators = [' vs ', ' versus ', ' plaintiff ', ' defendant ', ' petitioner '];
    const partyCount = partyIndicators.filter(indicator =>
      content.toLowerCase().includes(indicator)
    ).length;
    if (partyCount > 1) {
      score += 2;
      factors.push('Multiple parties involved');
    } else if (partyCount > 0) {
      score += 1;
      factors.push('Multiple parties mentioned');
    }

    // Constitutional issues
    if (
      content.toLowerCase().includes('constitutional') ||
      content.toLowerCase().includes('amendment')
    ) {
      score += 3;
      factors.push('Constitutional issues involved');
    }

    return {
      score: Math.min(10, score),
      factors,
    };
  }
}

// Export singleton instance
export const judiciaryService = new JudiciaryService();
