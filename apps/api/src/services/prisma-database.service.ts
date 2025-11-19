/**
 * Prisma-based Database Service Layer
 * Production-ready database abstraction using Prisma ORM
 */

import { getLogger } from '@political-sphere/shared';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const logger = getLogger({ service: 'database' });

// Type definitions for database operations
export type DatabaseRecord = Record<string, unknown>;
export type WhereClause = Record<string, unknown>;
export type QueryOptions = {
  skip?: number;
  take?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
};

// Type-safe access to Prisma models
type _PrismaModels = {
  [K in keyof PrismaClient]: PrismaClient[K] extends {
    create: (args: unknown) => unknown;
    findUnique: (args: unknown) => unknown;
  }
    ? PrismaClient[K]
    : never;
};

// Ensure test DATABASE_URL is set as Prisma requires a file: URL for SQLite
// This default is safe for test runs only and will not override an existing env var.
if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'test') {
  const dbPath = path.join(process.cwd(), 'test.db');
  process.env.DATABASE_URL = `file:${dbPath}`;
}

// Initialize Prisma client with connection pooling and logging
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
  // Connection pooling configuration for PostgreSQL
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
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

// Export the raw Prisma client for direct use
export { prisma };

/**
 * Generic CRUD operations using Prisma
 */
class PrismaDatabaseService {
  /**
   * Create a new record
   */
  async create(model: string, data: DatabaseRecord): Promise<DatabaseRecord> {
    try {
      const modelClient = (
        prisma as unknown as Record<
          string,
          { create: (args: { data: DatabaseRecord }) => Promise<DatabaseRecord> }
        >
      )[model];
      if (!modelClient) {
        throw new Error(`Model ${model} not found`);
      }
      const result = await modelClient.create({ data });
      logger.debug('Record created', { model, id: result.id });
      return result;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to create record', { model, error: err.message, data });
      throw error;
    }
  }

  /**
   * Find a record by ID
   */
  async findById(model: string, id: string): Promise<DatabaseRecord | null> {
    try {
      const modelClient = (
        prisma as unknown as Record<
          string,
          { findUnique: (args: { where: { id: string } }) => Promise<DatabaseRecord | null> }
        >
      )[model];
      if (!modelClient) {
        throw new Error(`Model ${model} not found`);
      }
      const result = await modelClient.findUnique({
        where: { id },
      });
      return result;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to find record by ID', { model, id, error: err.message });
      throw error;
    }
  }

  /**
   * Find records matching criteria
   */
  async findMany(
    model: string,
    where: WhereClause = {},
    options: QueryOptions = {},
  ): Promise<DatabaseRecord[]> {
    try {
      const modelClient = (
        prisma as unknown as Record<
          string,
          {
            findMany: (args: {
              where?: WhereClause;
              skip?: number;
              take?: number;
              orderBy?: Record<string, string>;
            }) => Promise<DatabaseRecord[]>;
          }
        >
      )[model];
      if (!modelClient) {
        throw new Error(`Model ${model} not found`);
      }
      const result = await modelClient.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: options.orderBy,
      });
      return result;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to find records', { model, where, options, error: err.message });
      throw error;
    }
  }

  /**
   * Count records matching criteria
   */
  async count(model: string, where: WhereClause = {}): Promise<number> {
    try {
      const modelClient = (
        prisma as unknown as Record<
          string,
          { count: (args: { where?: WhereClause }) => Promise<number> }
        >
      )[model];
      if (!modelClient) {
        throw new Error(`Model ${model} not found`);
      }
      return await modelClient.count({ where });
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to count records', { model, where, error: err.message });
      throw error;
    }
  }

  /**
   * Update a record
   */
  async update(model: string, id: string, data: DatabaseRecord): Promise<DatabaseRecord> {
    try {
      const modelClient = (
        prisma as unknown as Record<
          string,
          {
            update: (args: {
              where: { id: string };
              data: DatabaseRecord;
            }) => Promise<DatabaseRecord>;
          }
        >
      )[model];
      if (!modelClient) {
        throw new Error(`Model ${model} not found`);
      }
      const result = await modelClient.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
      logger.debug('Record updated', { model, id });
      return result;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to update record', { model, id, data, error: err.message });
      throw error;
    }
  }

  /**
   * Delete a record
   */
  async delete(model: string, id: string) {
    try {
      const modelClient = (
        prisma as unknown as Record<
          string,
          { delete: (args: { where: { id: string } }) => Promise<void> }
        >
      )[model];
      if (!modelClient) {
        throw new Error(`Model ${model} not found`);
      }
      await modelClient.delete({
        where: { id },
      });
      logger.debug('Record deleted', { model, id });
      return true;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to delete record', { model, id, error: err.message });
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(
    callback: (
      tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>,
    ) => Promise<T>,
  ): Promise<T> {
    try {
      return await prisma.$transaction(async tx => {
        return await callback(tx);
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Transaction failed', { error: err.message });
      throw error;
    }
  }

  /**
   * Check if a record exists
   */
  async exists(model: string, where: WhereClause): Promise<boolean> {
    try {
      const count = await this.count(model, where);
      return count > 0;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to check record existence', { model, where, error: err.message });
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
  createChamber: (data: DatabaseRecord) => prismaDb.create('chamber', data),
  getChamber: (id: string) => prismaDb.findById('chamber', id),
  listChambers: (where: WhereClause = {}, options: QueryOptions = {}) =>
    prismaDb.findMany('chamber', where, options),

  createMotion: (data: DatabaseRecord) => prismaDb.create('motion', data),
  getMotion: (id: string) => prismaDb.findById('motion', id),
  listMotions: (where: WhereClause = {}, options: QueryOptions = {}) =>
    prismaDb.findMany('motion', where, options),
  updateMotion: (id: string, data: DatabaseRecord) => prismaDb.update('motion', id, data),

  createDebate: (data: DatabaseRecord) => prismaDb.create('debate', data),
  getDebate: (id: string) => prismaDb.findById('debate', id),
  updateDebate: (id: string, data: DatabaseRecord) => prismaDb.update('debate', id, data),

  createVote: (data: DatabaseRecord) => prismaDb.create('vote', data),
  listVotes: (where: WhereClause = {}) => prismaDb.findMany('vote', where),
  voteExists: (where: WhereClause) => prismaDb.exists('vote', where),
  countVotes: (where: WhereClause = {}) => prismaDb.count('vote', where),
};

// Government-specific operations
export const GovernmentDB = {
  createGovernment: (data: DatabaseRecord) => prismaDb.create('government', data),
  getGovernment: (id: string) => prismaDb.findById('government', id),
  listGovernments: (where: WhereClause = {}, options: QueryOptions = {}) =>
    prismaDb.findMany('government', where, options),
  updateGovernment: (id: string, data: DatabaseRecord) => prismaDb.update('government', id, data),

  createMinister: (data: DatabaseRecord) => prismaDb.create('minister', data),
  getMinister: (id: string) => prismaDb.findById('minister', id),
  listMinisters: (where: WhereClause = {}) => prismaDb.findMany('minister', where),
  updateMinister: (id: string, data: DatabaseRecord) => prismaDb.update('minister', id, data),

  createExecutiveAction: (data: DatabaseRecord) => prismaDb.create('executiveAction', data),
  getExecutiveAction: (id: string) => prismaDb.findById('executiveAction', id),
  listExecutiveActions: (where: WhereClause = {}, options: QueryOptions = {}) =>
    prismaDb.findMany('executiveAction', where, options),
  updateExecutiveAction: (id: string, data: DatabaseRecord) =>
    prismaDb.update('executiveAction', id, data),

  createCabinetMeeting: (data: DatabaseRecord) => prismaDb.create('cabinetMeeting', data),
  getCabinetMeeting: (id: string) => prismaDb.findById('cabinetMeeting', id),
  updateCabinetMeeting: (id: string, data: DatabaseRecord) =>
    prismaDb.update('cabinetMeeting', id, data),
};

// Judiciary-specific operations
export const JudiciaryDB = {
  createCase: (data: DatabaseRecord) => prismaDb.create('case', data),
  getCase: (id: string) => prismaDb.findById('case', id),
  listCases: (where: WhereClause = {}, options: QueryOptions = {}) =>
    prismaDb.findMany('case', where, options),
  updateCase: (id: string, data: DatabaseRecord) => prismaDb.update('case', id, data),

  createJudge: (data: DatabaseRecord) => prismaDb.create('judge', data),
  getJudge: (id: string) => prismaDb.findById('judge', id),
  listJudges: (where: WhereClause = {}) => prismaDb.findMany('judge', where),
  updateJudge: (id: string, data: DatabaseRecord) => prismaDb.update('judge', id, data),

  createRuling: (data: DatabaseRecord) => prismaDb.create('ruling', data),
  getRuling: (id: string) => prismaDb.findById('ruling', id),
  listRulings: (where: WhereClause = {}) => prismaDb.findMany('ruling', where),

  createReview: (data: DatabaseRecord) => prismaDb.create('review', data),
  getReview: (id: string) => prismaDb.findById('review', id),
  listReviews: (where: WhereClause = {}, options: QueryOptions = {}) =>
    prismaDb.findMany('review', where, options),
  updateReview: (id: string, data: DatabaseRecord) => prismaDb.update('review', id, data),

  createPrecedent: (data: DatabaseRecord) => prismaDb.create('precedent', data),
  listPrecedents: (where: WhereClause = {}) => prismaDb.findMany('precedent', where),
};

// Media-specific operations
export const MediaDB = {
  createPressRelease: (data: DatabaseRecord) => prismaDb.create('pressRelease', data),
  getPressRelease: (id: string) => prismaDb.findById('pressRelease', id),
  listPressReleases: (where: WhereClause = {}, options: QueryOptions = {}) =>
    prismaDb.findMany('pressRelease', where, options),
  updatePressRelease: (id: string, data: DatabaseRecord) =>
    prismaDb.update('pressRelease', id, data),

  createPoll: (data: DatabaseRecord) => prismaDb.create('poll', data),
  getPoll: (id: string) => prismaDb.findById('poll', id),
  listPolls: (where: WhereClause = {}, options: QueryOptions = {}) =>
    prismaDb.findMany('poll', where, options),
  updatePoll: (id: string, data: DatabaseRecord) => prismaDb.update('poll', id, data),

  createPollVote: (data: DatabaseRecord) => prismaDb.create('pollVote', data),
  pollVoteExists: (where: WhereClause) => prismaDb.exists('pollVote', where),

  createCoverage: (data: DatabaseRecord) => prismaDb.create('coverage', data),
  listCoverage: (where: WhereClause = {}, options: QueryOptions = {}) =>
    prismaDb.findMany('coverage', where, options),

  createNarrative: (data: DatabaseRecord) => prismaDb.create('narrative', data),
  getNarrative: (id: string) => prismaDb.findById('narrative', id),
  listNarratives: (where: WhereClause = {}, options: QueryOptions = {}) =>
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
        { orderBy: { measuredAt: 'desc' }, take: 1 },
      )
      .then(r => r[0]);
  },

  setApprovalRating: async (key: string, data: DatabaseRecord) => {
    const [entityId, entityType] = key.split(':');
    return await prismaDb.create('approvalRating', {
      entityId,
      entityType,
      ...data,
    });
  },

  listApprovalRatings: (where: WhereClause = {}) => prismaDb.findMany('approvalRating', where),
};

// Elections-specific operations
export const ElectionsDB = {
  createElection: (data: DatabaseRecord) => prismaDb.create('election', data),
  getElection: (id: string) => prismaDb.findById('election', id),
  listElections: (where: WhereClause = {}, options: QueryOptions = {}) =>
    prismaDb.findMany('election', where, options),
  updateElection: (id: string, data: DatabaseRecord) => prismaDb.update('election', id, data),

  createCampaign: (data: DatabaseRecord) => prismaDb.create('campaign', data),
  listCampaigns: (where: WhereClause = {}) => prismaDb.findMany('campaign', where),

  createConstituency: (data: DatabaseRecord) => prismaDb.create('constituency', data),
  getConstituency: (id: string) => prismaDb.findById('constituency', id),
  listConstituencies: (where: WhereClause = {}) => prismaDb.findMany('constituency', where),
  updateConstituency: (id: string, data: DatabaseRecord) =>
    prismaDb.update('constituency', id, data),

  createCandidate: (data: DatabaseRecord) => prismaDb.create('candidate', data),
  getCandidate: (id: string) => prismaDb.findById('candidate', id),
  listCandidates: (where: WhereClause = {}) => prismaDb.findMany('candidate', where),
  updateCandidate: (id: string, data: DatabaseRecord) => prismaDb.update('candidate', id, data),

  createVote: (data: DatabaseRecord) => prismaDb.create('electionVote', data),
  voteExists: (where: WhereClause) => prismaDb.exists('electionVote', where),
};
