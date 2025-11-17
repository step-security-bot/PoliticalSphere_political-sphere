/**
 * Prisma-based Database Service Layer
 * Production-ready database abstraction using Prisma ORM
 */

import { PrismaClient } from '@prisma/client';
import { getLogger } from '@political-sphere/shared';

const logger = getLogger({ service: 'database' });

// Initialize Prisma client with connection pooling and logging
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

// Log database queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', e => {
    logger.debug('Database query', {
      query: e.query,
      params: e.params,
      duration: e.duration,
    });
  });
}

prisma.$on('info', e => logger.info('Database info', { message: e.message }));
prisma.$on('warn', e => logger.warn('Database warning', { message: e.message }));
prisma.$on('error', e => logger.error('Database error', { message: e.message }));

/**
 * Generic CRUD operations using Prisma
 */
class PrismaDatabaseService {
  /**
   * Create a new record
   */
  async create(model: string, data: any) {
    try {
      const result = await (prisma as any)[model].create({ data });
      logger.debug('Record created', { model, id: result.id });
      return result;
    } catch (error) {
      logger.error('Failed to create record', { model, error: error.message, data });
      throw error;
    }
  }

  /**
   * Find a record by ID
   */
  async findById(model: string, id: string) {
    try {
      const result = await (prisma as any)[model].findUnique({
        where: { id },
      });
      return result;
    } catch (error) {
      logger.error('Failed to find record by ID', { model, id, error: error.message });
      throw error;
    }
  }

  /**
   * Find records matching criteria
   */
  async findMany(model: string, where: any = {}, options: any = {}) {
    try {
      const result = await (prisma as any)[model].findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy,
      });
      return result;
    } catch (error) {
      logger.error('Failed to find records', { model, where, options, error: error.message });
      throw error;
    }
  }

  /**
   * Count records matching criteria
   */
  async count(model: string, where: any = {}) {
    try {
      return await (prisma as any)[model].count({ where });
    } catch (error) {
      logger.error('Failed to count records', { model, where, error: error.message });
      throw error;
    }
  }

  /**
   * Update a record
   */
  async update(model: string, id: string, data: any) {
    try {
      const result = await (prisma as any)[model].update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
      logger.debug('Record updated', { model, id });
      return result;
    } catch (error) {
      logger.error('Failed to update record', { model, id, data, error: error.message });
      throw error;
    }
  }

  /**
   * Delete a record
   */
  async delete(model: string, id: string) {
    try {
      await (prisma as any)[model].delete({
        where: { id },
      });
      logger.debug('Record deleted', { model, id });
      return true;
    } catch (error) {
      logger.error('Failed to delete record', { model, id, error: error.message });
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction(callback: (tx: any) => Promise<any>) {
    try {
      return await prisma.$transaction(async tx => {
        return await callback(tx);
      });
    } catch (error) {
      logger.error('Transaction failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if a record exists
   */
  async exists(model: string, where: any) {
    try {
      const count = await this.count(model, where);
      return count > 0;
    } catch (error) {
      logger.error('Failed to check record existence', { model, where, error: error.message });
      throw error;
    }
  }

  /**
   * Get Prisma client for advanced operations
   */
  getClient() {
    return prisma;
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  }
}

// Export singleton instance
export const prismaDb = new PrismaDatabaseService();

// Parliament-specific operations
export const ParliamentDB = {
  createChamber: (data: any) => prismaDb.create('chamber', data),
  getChamber: (id: string) => prismaDb.findById('chamber', id),
  listChambers: (where: any = {}, options: any = {}) =>
    prismaDb.findMany('chamber', where, options),

  createMotion: (data: any) => prismaDb.create('motion', data),
  getMotion: (id: string) => prismaDb.findById('motion', id),
  listMotions: (where: any = {}, options: any = {}) => prismaDb.findMany('motion', where, options),
  updateMotion: (id: string, data: any) => prismaDb.update('motion', id, data),

  createDebate: (data: any) => prismaDb.create('debate', data),
  getDebate: (id: string) => prismaDb.findById('debate', id),

  createVote: (data: any) => prismaDb.create('vote', data),
  listVotes: (where: any = {}) => prismaDb.findMany('vote', where),
  voteExists: (where: any) => prismaDb.exists('vote', where),
};

// Government-specific operations
export const GovernmentDB = {
  createGovernment: (data: any) => prismaDb.create('government', data),
  getGovernment: (id: string) => prismaDb.findById('government', id),
  listGovernments: (where: any = {}, options: any = {}) =>
    prismaDb.findMany('government', where, options),
  updateGovernment: (id: string, data: any) => prismaDb.update('government', id, data),

  createMinister: (data: any) => prismaDb.create('minister', data),
  getMinister: (id: string) => prismaDb.findById('minister', id),
  listMinisters: (where: any = {}) => prismaDb.findMany('minister', where),
  updateMinister: (id: string, data: any) => prismaDb.update('minister', id, data),

  createExecutiveAction: (data: any) => prismaDb.create('executiveAction', data),
  getExecutiveAction: (id: string) => prismaDb.findById('executiveAction', id),
  listExecutiveActions: (where: any = {}) => prismaDb.findMany('executiveAction', where),

  createCabinetMeeting: (data: any) => prismaDb.create('cabinetMeeting', data),
  getCabinetMeeting: (id: string) => prismaDb.findById('cabinetMeeting', id),
};

// Judiciary-specific operations
export const JudiciaryDB = {
  createCase: (data: any) => prismaDb.create('case', data),
  getCase: (id: string) => prismaDb.findById('case', id),
  listCases: (where: any = {}, options: any = {}) => prismaDb.findMany('case', where, options),
  updateCase: (id: string, data: any) => prismaDb.update('case', id, data),

  createJudge: (data: any) => prismaDb.create('judge', data),
  getJudge: (id: string) => prismaDb.findById('judge', id),
  listJudges: (where: any = {}) => prismaDb.findMany('judge', where),
  updateJudge: (id: string, data: any) => prismaDb.update('judge', id, data),

  createRuling: (data: any) => prismaDb.create('ruling', data),
  getRuling: (id: string) => prismaDb.findById('ruling', id),
  listRulings: (where: any = {}) => prismaDb.findMany('ruling', where),

  createReview: (data: any) => prismaDb.create('review', data),
  getReview: (id: string) => prismaDb.findById('review', id),
  listReviews: (where: any = {}, options: any = {}) => prismaDb.findMany('review', where, options),

  createPrecedent: (data: any) => prismaDb.create('precedent', data),
  listPrecedents: (where: any = {}) => prismaDb.findMany('precedent', where),
};

// Media-specific operations
export const MediaDB = {
  createPressRelease: (data: any) => prismaDb.create('pressRelease', data),
  getPressRelease: (id: string) => prismaDb.findById('pressRelease', id),
  listPressReleases: (where: any = {}, options: any = {}) =>
    prismaDb.findMany('pressRelease', where, options),
  updatePressRelease: (id: string, data: any) => prismaDb.update('pressRelease', id, data),

  createPoll: (data: any) => prismaDb.create('poll', data),
  getPoll: (id: string) => prismaDb.findById('poll', id),
  listPolls: (where: any = {}, options: any = {}) => prismaDb.findMany('poll', where, options),
  updatePoll: (id: string, data: any) => prismaDb.update('poll', id, data),

  createPollVote: (data: any) => prismaDb.create('pollVote', data),
  pollVoteExists: (where: any) => prismaDb.exists('pollVote', where),

  createCoverage: (data: any) => prismaDb.create('coverage', data),
  listCoverage: (where: any = {}, options: any = {}) =>
    prismaDb.findMany('coverage', where, options),

  createNarrative: (data: any) => prismaDb.create('narrative', data),
  getNarrative: (id: string) => prismaDb.findById('narrative', id),
  listNarratives: (where: any = {}, options: any = {}) =>
    prismaDb.findMany('narrative', where, options),

  getApprovalRating: async (key: string) => {
    // For approval ratings, we use a composite key approach
    const [entityId, entityType] = key.split(':');
    return await prismaDb
      .findMany(
        'approvalRating',
        {
          entityId,
          entityType,
        },
        { orderBy: { measuredAt: 'desc' }, take: 1 }
      )
      .then(r => r[0]);
  },

  setApprovalRating: async (key: string, data: any) => {
    const [entityId, entityType] = key.split(':');
    return await prismaDb.create('approvalRating', {
      entityId,
      entityType,
      ...data,
    });
  },

  listApprovalRatings: (where: any = {}) => prismaDb.findMany('approvalRating', where),
};

// Elections-specific operations
export const ElectionsDB = {
  createElection: (data: any) => prismaDb.create('election', data),
  getElection: (id: string) => prismaDb.findById('election', id),
  listElections: (where: any = {}, options: any = {}) =>
    prismaDb.findMany('election', where, options),
  updateElection: (id: string, data: any) => prismaDb.update('election', id, data),

  createCampaign: (data: any) => prismaDb.create('campaign', data),
  listCampaigns: (where: any = {}) => prismaDb.findMany('campaign', where),

  createConstituency: (data: any) => prismaDb.create('constituency', data),
  getConstituency: (id: string) => prismaDb.findById('constituency', id),
  listConstituencies: (where: any = {}) => prismaDb.findMany('constituency', where),
  updateConstituency: (id: string, data: any) => prismaDb.update('constituency', id, data),

  createCandidate: (data: any) => prismaDb.create('candidate', data),
  getCandidate: (id: string) => prismaDb.findById('candidate', id),
  listCandidates: (where: any = {}) => prismaDb.findMany('candidate', where),
  updateCandidate: (id: string, data: any) => prismaDb.update('candidate', id, data),

  createVote: (data: any) => prismaDb.create('electionVote', data),
  voteExists: (where: any) => prismaDb.exists('electionVote', where),
};
