import { v4 as uuidv4 } from 'uuid';

// eslint-disable-next-line no-restricted-imports
import { CACHE_TTL, cacheKeys } from '../utils/cache.ts';
// eslint-disable-next-line no-restricted-imports
import { DatabaseError, retryWithBackoff } from '../utils/error-handler.js';

// Use centralized Prisma client to avoid multiple connections and to respect
// test-time environment variables (DATABASE_URL) set in the test setup.
// eslint-disable-next-line no-restricted-imports
import { prisma } from '../services/prisma-database.service.ts';

/**
 * @typedef {import('../utils/cache.ts').CacheService} CacheService
 */

class VoteStore {
  /**
   * @param {CacheService | null} [cache]
   */
  constructor(cache = null) {
    this.cache = cache;
  }

  async create(input) {
    const id = uuidv4();

    const vote = await prisma.vote.create({
      data: {
        id,
        billId: input.billId,
        userId: input.userId,
        vote: input.vote,
      },
    });

    const result = {
      id: vote.id,
      billId: vote.billId,
      userId: vote.userId,
      vote: vote.vote,
      createdAt: vote.createdAt,
    };

    if (this.cache) {
      await Promise.all([
        this.cache.del(cacheKeys.billVotes(input.billId)),
        this.cache.del(cacheKeys.userVotes(input.userId)),
        this.cache.del(`bill:${input.billId}:voteCounts`),
      ]);
    }

    return result;
  }

  async getById(id) {
    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get(cacheKeys.vote(id));
      if (cached) return cached;
    }

    try {
      return await retryWithBackoff(async () => {
        const vote = await prisma.vote.findUnique({
          where: { id },
        });
        if (!vote) return null;

        const result = {
          id: vote.id,
          billId: vote.billId,
          userId: vote.userId,
          vote: vote.vote,
          createdAt: vote.createdAt,
        };

        // Cache the result
        if (this.cache) {
          await this.cache.set(cacheKeys.vote(id), result, CACHE_TTL.VOTES);
        }

        return result;
      });
    } catch (error) {
      throw new DatabaseError(`Failed to get vote ${id}: ${error.message}`);
    }
  }

  async getByBillId(billId) {
    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get(cacheKeys.votesByBill(billId));
      if (cached) return cached;
    }

    try {
      return await retryWithBackoff(async () => {
        const votes = await prisma.vote.findMany({
          where: { billId },
          orderBy: { createdAt: 'desc' },
        });

        const result = votes.map(vote => ({
          id: vote.id,
          billId: vote.billId,
          userId: vote.userId,
          vote: vote.vote,
          createdAt: vote.createdAt,
        }));

        // Cache the result
        if (this.cache) {
          await this.cache.set(cacheKeys.votesByBill(billId), result, CACHE_TTL.VOTES);
        }

        return result;
      });
    } catch (error) {
      throw new DatabaseError(`Failed to get votes for bill ${billId}: ${error.message}`);
    }
  }

  async getByUserId(userId) {
    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get(cacheKeys.votesByUser(userId));
      if (cached) return cached;
    }

    try {
      return await retryWithBackoff(async () => {
        const votes = await prisma.vote.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });

        const result = votes.map(vote => ({
          id: vote.id,
          billId: vote.billId,
          userId: vote.userId,
          vote: vote.vote,
          createdAt: vote.createdAt,
        }));

        // Cache the result
        if (this.cache) {
          await this.cache.set(cacheKeys.votesByUser(userId), result, CACHE_TTL.VOTES);
        }

        return result;
      });
    } catch (error) {
      throw new DatabaseError(`Failed to get votes for user ${userId}: ${error.message}`);
    }
  }

  async hasUserVotedOnBill(userId, billId) {
    try {
      return await retryWithBackoff(async () => {
        const count = await prisma.vote.count({
          where: {
            userId,
            billId,
          },
        });
        return count > 0;
      });
    } catch (error) {
      throw new DatabaseError(
        `Failed to check vote for user ${userId} on bill ${billId}: ${error.message}`,
      );
    }
  }

  async getVoteCounts(billId) {
    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get(`bill:${billId}:voteCounts`);
      if (cached) return cached;
    }

    try {
      return await retryWithBackoff(async () => {
        const votes = await prisma.vote.findMany({
          where: { billId },
          select: { vote: true },
        });

        const counts = votes.reduce(
          (acc, v) => {
            acc[v.vote] = (acc[v.vote] || 0) + 1;
            return acc;
          },
          { aye: 0, nay: 0, abstain: 0 },
        );

        counts.total = votes.length;

        // Cache the result
        if (this.cache) {
          await this.cache.set(`bill:${billId}:voteCounts`, counts, CACHE_TTL.VOTES);
        }

        return counts;
      });
    } catch (error) {
      throw new DatabaseError(`Failed to get vote counts for bill ${billId}: ${error.message}`);
    }
  }

  // Compatibility methods for tests and legacy repository-style DB adapters
  async update(id, data) {
    try {
      const vote = await prisma.vote.update({
        where: { id },
        data,
      });
      return {
        id: vote.id,
        billId: vote.billId,
        userId: vote.userId,
        vote: vote.vote,
        createdAt: vote.createdAt,
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new DatabaseError('Vote not found');
      }
      throw error;
    }
  }

  async delete(id) {
    try {
      await prisma.vote.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      if (error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  async getAll(filter = {}) {
    const votes = await prisma.vote.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
    });
    return votes.map(vote => ({
      id: vote.id,
      billId: vote.billId,
      userId: vote.userId,
      vote: vote.vote,
      createdAt: vote.createdAt,
    }));
  }

  validateVoteData(data) {
    if (!data.billId || !data.userId) throw new Error('Missing required fields');
    const allowed = ['aye', 'nay', 'abstain', 'yes', 'no'];
    if (!data.vote || !allowed.includes(String(data.vote))) {
      throw new Error('Invalid vote type');
    }
  }
}

export { VoteStore };
