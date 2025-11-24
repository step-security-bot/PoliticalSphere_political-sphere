/**
 * Prisma-based Database Service Layer
 * Production-ready database abstraction using Prisma ORM
 */

import { getLogger } from '@political-sphere/shared';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { Pool } from 'pg';

const logger = getLogger({ service: 'database' });

// Type definitions for database operations
/**
 * DatabaseRecord represents a generic database row with arbitrary fields.
 * It is intentionally permissive to support dynamic model shapes used across
 * the application. Prefer narrowing to concrete interfaces in higher-level
 * services when working with well-known models.
 */
export type DatabaseRecord = Record<string, unknown>;

/**
 * WhereClause is a generic filter used for querying models. For complex
 * queries prefer using Prisma's type-safe filters at the callsite.
 */
export type WhereClause = Record<string, unknown>;

/**
 * QueryOptions controls pagination and sorting for list queries.
 */
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

// Initialize Prisma client with adapter for Prisma 7
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

let adapter: PrismaPg | PrismaLibSQL;
try {
  if (connectionString.startsWith('file:')) {
    // Use LibSQL adapter for SQLite files (used in tests)
    adapter = new PrismaLibSQL({ url: connectionString });
  } else {
    // Use PostgreSQL adapter for production
    const pool = new Pool({ connectionString });
    adapter = new PrismaPg(pool);
  }
} catch (err) {
  // Redact password from connection string for logging
  const safeConnStr = connectionString.replace(
    /(postgresql:\/\/)([^:]+):([^@]+)@/,
    '$1$2:<redacted>@'
  );
  logger.error(
    'Failed to initialize database adapter. Check your DATABASE_URL and database configuration.',
    {
      error: err,
      connectionString: safeConnStr,
    }
  );
  throw new Error('Database adapter initialization failed. See logs for details.');
}

const prisma = new PrismaClient({
  adapter,
  log: [
    { level: 'query', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});

// Configure connection pool settings via environment variables
if (process.env.DATABASE_URL?.startsWith('postgresql://')) {
  // PostgreSQL connection pool settings
  process.env.PRISMA_CONNECTION_POOL_SIZE = process.env.PRISMA_CONNECTION_POOL_SIZE || '10';
  process.env.PRISMA_CONNECTION_IDLE_TIMEOUT =
    process.env.PRISMA_CONNECTION_IDLE_TIMEOUT || '300000'; // 5 minutes
  process.env.PRISMA_CONNECTION_MAX_LIFETIME =
    process.env.PRISMA_CONNECTION_MAX_LIFETIME || '600000'; // 10 minutes
}

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
 * The raw `PrismaClient` instance used by the repository layer.
 *
 * This export is provided for advanced callers that need direct access to
 * Prisma's API (for example, running ad-hoc queries or working with a
 * migration script). Prefer using the higher-level `PrismaDatabaseService`
 * and the model-specific helpers (`ParliamentDB`, `GovernmentDB`, etc.)
 * for application code to preserve encapsulation and easier testing.
 */
export { prisma };

/**
 * Generic CRUD operations using Prisma
 */
/**
 * High-level database service wrapping the `PrismaClient` with a small set
 * of generic, model-agnostic CRUD operations and transaction helpers.
 *
 * - Methods accept model names as strings to keep this service generic and
 *   easily mockable in tests.
 * - For domain logic prefer using model-specific helper objects exported at
 *   the bottom of this file (e.g., `ParliamentDB`, `ElectionsDB`).
 */
/**
 * PrismaDatabaseService wraps the `PrismaClient` to provide a small set of
 * generic, model-agnostic CRUD and transaction helpers that can be used by
 * higher-level domain services. Use model-specific helpers (exported at the
 * bottom of this file) for more convenient and type-aware operations.
 */
export class PrismaDatabaseService {
  /**
   * Create a new record
   */
  /**
   * Creates a new record in the specified model.
   * @param model - The Prisma model name (e.g., 'user', 'bill', 'vote')
   * @param data - The data to create the record with
   * @returns Promise resolving to the created record
   * @throws Error if the model doesn't exist or creation fails
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
   * Finds a single record by its ID in the specified model.
   * @param model - The Prisma model name (e.g., 'user', 'bill', 'vote')
   * @param id - The unique identifier of the record to find
   * @returns Promise resolving to the found record or null if not found
   * @throws Error if the model doesn't exist or query fails
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
   * Finds multiple records matching the specified criteria with optional pagination and sorting.
   * @param model - The Prisma model name (e.g., 'user', 'bill', 'vote')
   * @param where - Filter criteria to match records against
   * @param options - Query options for pagination and sorting
   * @param options.skip - Number of records to skip (for pagination)
   * @param options.take - Maximum number of records to return
   * @param options.orderBy - Sort order specification
   * @returns Promise resolving to array of matching records
   * @throws Error if the model doesn't exist or query fails
   */
  async findMany(
    model: string,
    where: WhereClause = {},
    options: QueryOptions = {}
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
   * Counts the number of records matching the specified criteria.
   * @param model - The Prisma model name (e.g., 'user', 'bill', 'vote')
   * @param where - Filter criteria to count records against
   * @returns Promise resolving to the count of matching records
   * @throws Error if the model doesn't exist or query fails
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
   * Updates a single record by ID with the provided data.
   * @param model - The Prisma model name (e.g., 'user', 'bill', 'vote')
   * @param id - The unique identifier of the record to update
   * @param data - The data to update the record with
   * @returns Promise resolving to the updated record
   * @throws Error if the model doesn't exist, record not found, or update fails
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
   * Deletes a single record by ID.
   * @param model - The Prisma model name (e.g., 'user', 'bill', 'vote')
   * @param id - The unique identifier of the record to delete
   * @returns Promise resolving to true if deletion was successful
   * @throws Error if the model doesn't exist, record not found, or deletion fails
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
   * Execute a transaction with automatic rollback on failure.
   * All database operations within the callback function are executed atomically.
   * @param callback - Function containing database operations to execute within the transaction
   * @returns Promise resolving to the result of the callback function
   * @throws Error if the transaction fails or any operation within it fails
   */
  async transaction<T>(
    callback: (
      tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>
    ) => Promise<T>
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
   * Checks if any records exist matching the specified criteria.
   * @param model - The Prisma model name (e.g., 'user', 'bill', 'vote')
   * @param where - Filter criteria to check for record existence
   * @returns Promise resolving to true if at least one matching record exists, false otherwise
   * @throws Error if the model doesn't exist or query fails
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
   * Gets the Prisma client instance for advanced database operations.
   * Use this method when you need direct access to Prisma's full API.
   * @returns The PrismaClient instance configured for the current environment
   */
  getClient() {
    return prisma;
  }

  /**
   * Disconnects from the database and closes all connections.
   * This should be called when shutting down the application to ensure
   * proper cleanup of database connections.
   * @returns Promise that resolves when disconnection is complete
   */
  async disconnect() {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  }
}

// Export singleton instance
/**
 * Singleton instance of `PrismaDatabaseService` used by route handlers and
 * domain services. Import this when you need the shared, configured
 * database service for CRUD and transaction operations.
 */
/**
 * Shared `prismaDb` singleton instance of `PrismaDatabaseService` used by
 * domain services and route handlers. Prefer the named export for typing.
 */
export const prismaDb = new PrismaDatabaseService();

// Parliament-specific operations
/**
 * Parliament database operations service.
 * Provides CRUD operations for parliamentary entities like chambers, motions, debates, and votes.
 */
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
/**
 * Government database operations service.
 * Provides CRUD operations for government entities like governments, ministers, executive actions, and cabinet meetings.
 */
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
/**
 * Judiciary database operations service.
 * Provides CRUD operations for judicial entities like cases, judges, rulings, reviews, and legal precedents.
 */
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
/**
 * Media database operations service.
 * Provides CRUD operations for media entities like press releases, polls, coverage, narratives, and approval ratings.
 */
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
        { orderBy: { measuredAt: 'desc' }, take: 1 }
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
/**
 * Elections database operations service.
 * Provides CRUD operations for election entities like elections, campaigns, constituencies, and candidates.
 */
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
