import { v4 as uuidv4 } from 'uuid';

// eslint-disable-next-line no-restricted-imports
import { CACHE_TTL, cacheKeys } from '../utils/cache.ts';
// eslint-disable-next-line no-restricted-imports
import { DatabaseError, retryWithBackoff } from '../utils/error-handler.ts';

// Use centralized Prisma client to avoid multiple connections and to respect
// test-time environment variables (DATABASE_URL) set in the test setup.
// eslint-disable-next-line no-restricted-imports
import { prisma } from '../services/prisma-database.service.ts';

const usePrisma = process.env.NODE_ENV !== 'test' || process.env.USE_PRISMA_FOR_TESTS === '1';

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
      const mapBill = bill => ({
        id: bill.id,
        title: bill.title,
        description: bill.description ?? undefined,
        proposerId: bill.proposerId ?? bill.proposer_id,
        status: bill.status,
        createdAt: new Date(bill.createdAt ?? bill.created_at).toISOString(),
        updatedAt: new Date(bill.updatedAt ?? bill.updated_at).toISOString(),
      });

      if (this.cache) {
        const cached = await this.cache.get(cacheKeys.bill(id));
        if (cached) {
          return mapBill(cached);
        }
      }

      let bill;
      if (usePrisma) {
        // eslint-disable-next-line no-undef
        bill = await prisma.bill.findUnique({
          where: { id },
        });
      } else {
        const stmt = this.db.prepare(
          'SELECT id, title, description, proposer_id as proposerId, status, created_at as createdAt, updated_at as updatedAt FROM bills WHERE id = ?'
        );
        bill = stmt.get(id);
      }

      if (!bill) return null;

      const result = mapBill(bill);

      if (this.cache) {
        // Fire and forget cache set to avoid blocking reads
        void this.cache.set(cacheKeys.bill(id), result, CACHE_TTL.BILL);
      }

      return result;
    });
  }

  async getAll() {
    return retryWithBackoff(async () => {
      const mapBill = bill => ({
        id: bill.id,
        title: bill.title,
        description: bill.description ?? undefined,
        proposerId: bill.proposerId ?? bill.proposer_id,
        status: bill.status,
        createdAt: new Date(bill.createdAt ?? bill.created_at).toISOString(),
        updatedAt: new Date(bill.updatedAt ?? bill.updated_at).toISOString(),
      });

      if (this.cache) {
        const cached = await this.cache.get(cacheKeys.bills());
        if (cached) {
          return cached.map(mapBill);
        }
      }

      let bills;
      if (usePrisma) {
        // eslint-disable-next-line no-undef
        bills = await prisma.bill.findMany({
          orderBy: { createdAt: 'desc' },
        });
      } else {
        const stmt = this.db.prepare(
          'SELECT id, title, description, proposer_id as proposerId, status, created_at as createdAt, updated_at as updatedAt FROM bills ORDER BY created_at DESC'
        );
        bills = stmt.all();
      }

      const result = bills.map(mapBill);

      if (this.cache) {
        // Fire and forget cache set to avoid blocking reads
        void this.cache.set(cacheKeys.bills(), result, CACHE_TTL.BILLS_LIST);
      }

      return result;
    });
  }

  async getCount() {
    return retryWithBackoff(async () => {
      if (usePrisma) {
        // eslint-disable-next-line no-undef
        return prisma.bill.count();
      }
      const stmt = this.db.prepare('SELECT COUNT(*) as total FROM bills');
      const result = stmt.get();
      return result.total ?? 0;
    });
  }

  async getPaginated(limit, offset = 0) {
    return retryWithBackoff(async () => {
      let bills;
      if (usePrisma) {
        // eslint-disable-next-line no-undef
        bills = await prisma.bill.findMany({
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        });
      } else {
        const stmt = this.db.prepare(
          'SELECT id, title, description, proposer_id as proposerId, status, created_at as createdAt, updated_at as updatedAt FROM bills ORDER BY created_at DESC LIMIT ? OFFSET ?'
        );
        bills = stmt.all(limit, offset);
      }

      return bills.map(bill => ({
        id: bill.id,
        title: bill.title,
        description: bill.description ?? undefined,
        proposerId: bill.proposerId ?? bill.proposer_id,
        status: bill.status,
        createdAt: new Date(bill.createdAt ?? bill.created_at).toISOString(),
        updatedAt: new Date(bill.updatedAt ?? bill.updated_at).toISOString(),
      }));
    });
  }

  async update(id, updates) {
    return retryWithBackoff(async () => {
      try {
        let bill;

        if (usePrisma) {
          // eslint-disable-next-line no-undef
          bill = await prisma.bill.update({
            where: { id },
            data: updates,
          });
        } else {
          const fields = [];
          const values = [];

          if (updates.title !== undefined) {
            fields.push('title = ?');
            values.push(updates.title);
          }
          if (updates.description !== undefined) {
            fields.push('description = ?');
            values.push(updates.description ?? null);
          }
          if (updates.status !== undefined) {
            fields.push('status = ?');
            values.push(updates.status);
          }

          if (fields.length === 0) return null;

          values.push(id);
          const updateStmt = this.db.prepare(
            `UPDATE bills SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ?`
          );
          const result = updateStmt.run(...values);
          if (result.changes === 0) return null;

          const selectStmt = this.db.prepare(
            'SELECT id, title, description, proposer_id as proposerId, status, created_at as createdAt, updated_at as updatedAt FROM bills WHERE id = ?'
          );
          bill = selectStmt.get(id);
        }

        // Invalidate cache
        if (this.cache) {
          // Fire and forget cache invalidation to avoid blocking writes
          void this.cache.del(cacheKeys.bill(id));
          void this.cache.del(cacheKeys.bills());
        }

        return {
          id: bill.id,
          title: bill.title,
          description: bill.description ?? undefined,
          proposerId: bill.proposerId ?? bill.proposer_id,
          status: bill.status,
          createdAt: new Date(bill.createdAt ?? bill.created_at).toISOString(),
          updatedAt: new Date(bill.updatedAt ?? bill.updated_at).toISOString(),
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
        if (usePrisma) {
          // eslint-disable-next-line no-undef
          await prisma.bill.delete({
            where: { id },
          });
        } else {
          const stmt = this.db.prepare('DELETE FROM bills WHERE id = ?');
          const result = stmt.run(id);
          if (result.changes === 0) return false;
        }

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
