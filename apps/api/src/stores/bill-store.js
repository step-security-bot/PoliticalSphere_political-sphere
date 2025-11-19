import { v4 as uuidv4 } from 'uuid';

// eslint-disable-next-line no-restricted-imports
import { CACHE_TTL, cacheKeys } from '../utils/cache.ts';
// eslint-disable-next-line no-restricted-imports
import { DatabaseError, retryWithBackoff } from '../utils/error-handler.js';

/**
 * @typedef {import('../utils/cache.ts').CacheService} CacheService
 */

class BillStore {
  /**
   * @param {unknown} db
   * @param {CacheService | null} [cache]
   */
  constructor(db, cache = null) {
    this.db = db;
    this.cache = cache;
  }

  async create(billData) {
    try {
      return await retryWithBackoff(async () => {
        const id = uuidv4();
        const status = billData.status || 'proposed';

        const stmt = this.db.prepare(`
          INSERT INTO bills (id, title, description, proposer_id, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `);

        stmt.run(id, billData.title, billData.description ?? null, billData.proposerId, status);

        const result = {
          id,
          title: billData.title,
          description: billData.description ?? undefined,
          proposerId: billData.proposerId,
          status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (this.cache) {
          // Fire and forget cache invalidation to avoid blocking writes
          void this.cache.del(cacheKeys.bills());
        }

        return result;
      });
    } catch (error) {
      throw new DatabaseError(`Failed to create bill: ${error.message}`);
    }
  }

  async getById(id) {
    return retryWithBackoff(async () => {
      if (this.cache) {
        const cached = await this.cache.get(cacheKeys.bill(id));
        if (cached) {
          return {
            id: cached.id,
            title: cached.title,
            description: cached.description,
            proposerId: cached.proposerId ?? cached.proposer_id,
            status: cached.status,
            createdAt: new Date(cached.createdAt ?? cached.created_at),
            updatedAt: new Date(cached.updatedAt ?? cached.updated_at),
          };
        }
      }

      const bill = await prisma.bill.findUnique({
        where: { id },
      });

      if (!bill) return null;

      const result = {
        id: bill.id,
        title: bill.title,
        description: bill.description,
        proposerId: bill.proposerId,
        status: bill.status,
        createdAt: bill.createdAt,
        updatedAt: bill.updatedAt,
      };

      if (this.cache) {
        // Fire and forget cache set to avoid blocking reads
        void this.cache.set(cacheKeys.bill(id), result, CACHE_TTL.BILL);
      }

      return result;
    });
  }

  async getAll() {
    return retryWithBackoff(async () => {
      if (this.cache) {
        const cached = await this.cache.get(cacheKeys.bills());
        if (cached) {
          return cached.map(c => ({
            id: c.id,
            title: c.title,
            description: c.description,
            proposerId: c.proposerId ?? c.proposer_id,
            status: c.status,
            createdAt: new Date(c.createdAt ?? c.created_at),
            updatedAt: new Date(c.updatedAt ?? c.updated_at),
          }));
        }
      }

      const bills = await prisma.bill.findMany({
        orderBy: { createdAt: 'desc' },
      });

      const result = bills.map(bill => ({
        id: bill.id,
        title: bill.title,
        description: bill.description,
        proposerId: bill.proposerId,
        status: bill.status,
        createdAt: bill.createdAt,
        updatedAt: bill.updatedAt,
      }));

      if (this.cache) {
        // Fire and forget cache set to avoid blocking reads
        void this.cache.set(cacheKeys.bills(), result, CACHE_TTL.BILLS_LIST);
      }

      return result;
    });
  }

  async getCount() {
    return retryWithBackoff(async () => {
      const count = await prisma.bill.count();
      return count;
    });
  }

  async getPaginated(limit, offset = 0) {
    return retryWithBackoff(async () => {
      const bills = await prisma.bill.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return bills.map(bill => ({
        id: bill.id,
        title: bill.title,
        description: bill.description,
        proposerId: bill.proposerId,
        status: bill.status,
        createdAt: bill.createdAt,
        updatedAt: bill.updatedAt,
      }));
    });
  }

  async update(id, updates) {
    return retryWithBackoff(async () => {
      try {
        const bill = await prisma.bill.update({
          where: { id },
          data: updates,
        });

        // Invalidate cache
        if (this.cache) {
          // Fire and forget cache invalidation to avoid blocking writes
          void this.cache.del(cacheKeys.bill(id));
          void this.cache.del(cacheKeys.bills());
        }

        return {
          id: bill.id,
          title: bill.title,
          description: bill.description,
          proposerId: bill.proposerId,
          status: bill.status,
          createdAt: bill.createdAt,
          updatedAt: bill.updatedAt,
        };
      } catch (error) {
        if (error.code === 'P2025') {
          return null; // Not found
        }
        throw error;
      }
    });
  }

  async delete(id) {
    return retryWithBackoff(async () => {
      try {
        await prisma.bill.delete({
          where: { id },
        });

        // Invalidate cache
        if (this.cache) {
          // Fire and forget cache invalidation to avoid blocking writes
          void this.cache.del(cacheKeys.bill(id));
          void this.cache.del(cacheKeys.bills());
        }

        return true;
      } catch (error) {
        if (error.code === 'P2025') {
          return false; // Not found
        }
        throw error;
      }
    });
  }
}

export { BillStore };
