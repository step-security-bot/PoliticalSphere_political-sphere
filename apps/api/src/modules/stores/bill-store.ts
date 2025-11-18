import type Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

// eslint-disable-next-line no-restricted-imports
import { CACHE_TTL, type CacheService, cacheKeys } from '../../utils/cache.ts';
// eslint-disable-next-line no-restricted-imports
import { retryWithBackoff } from '../../utils/error-handler.js';

interface BillRow {
  id: string;
  title: string;
  description: string | null;
  proposer_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export class BillStore {
  constructor(
    private db: Database.Database,
    private cache?: CacheService
  ) {}

  async create(billData: {
    title: string;
    description?: string;
    proposerId: string;
    status?: string;
  }) {
    return retryWithBackoff(async () => {
      const id = uuidv4();
      const nowDate = new Date();
      const now = nowDate.toISOString();
      const status = billData.status || 'proposed';
      const proposerId = billData.proposerId;

      const stmt = this.db.prepare(`
        INSERT INTO bills (id, title, description, proposer_id, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(id, billData.title, billData.description ?? null, proposerId, status, now, now);

      if (this.cache) {
        // Fire and forget cache invalidation to avoid blocking writes
        void this.cache.del(cacheKeys.bills());
      }

      return {
        id,
        title: billData.title,
        description: billData.description ?? null,
        proposerId,
        status,
        createdAt: nowDate,
        updatedAt: nowDate,
      };
    });
  }

  async getById(id: string) {
    return retryWithBackoff(async () => {
      if (this.cache) {
        const cached = await this.cache.get<{
          id: string;
          title: string;
          description: string | null;
          proposerId?: string;
          proposer_id?: string;
          status: string;
          createdAt?: string | Date;
          created_at?: string;
          updatedAt?: string | Date;
          updated_at?: string;
        } | null>(cacheKeys.bill(id));
        if (cached) {
          return {
            id: cached.id,
            title: cached.title,
            description: cached.description,
            proposerId: cached.proposerId ?? (cached.proposer_id as string),
            status: cached.status,
            createdAt: new Date((cached.createdAt as string) ?? (cached.created_at as string)),
            updatedAt: new Date((cached.updatedAt as string) ?? (cached.updated_at as string)),
          };
        }
      }

      // Time the DB query
      const startTime = process.hrtime.bigint();
      const stmt = this.db.prepare('SELECT * FROM bills WHERE id = ?');
      const row = stmt.get(id) as BillRow | undefined;
      const endTime = process.hrtime.bigint();
      const queryTimeMs = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds

      if (!row) return null;

      const bill = {
        id: row.id,
        title: row.title,
        description: row.description,
        proposerId: row.proposer_id,
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      };

      // Only cache if query took longer than 0.1ms (threshold for slow queries)
      if (this.cache && queryTimeMs > 0.1) {
        // Fire and forget cache set to avoid blocking reads
        void this.cache.set(cacheKeys.bill(id), bill, CACHE_TTL.BILL);
      }

      return bill;
    });
  }

  async getAll() {
    return retryWithBackoff(async () => {
      if (this.cache) {
        const cached = await this.cache.get<Array<{
          id: string;
          title: string;
          description: string | null;
          proposerId?: string;
          proposer_id?: string;
          status: string;
          createdAt?: string | Date;
          created_at?: string;
          updatedAt?: string | Date;
          updated_at?: string;
        }> | null>(cacheKeys.bills());
        if (cached) {
          return cached.map(c => ({
            id: c.id,
            title: c.title,
            description: c.description,
            proposerId: c.proposerId ?? (c.proposer_id as string),
            status: c.status,
            createdAt: new Date((c.createdAt as string) ?? (c.created_at as string)),
            updatedAt: new Date((c.updatedAt as string) ?? (c.updated_at as string)),
          }));
        }
      }

      // Time the DB query
      const startTime = process.hrtime.bigint();
      const stmt = this.db.prepare('SELECT * FROM bills ORDER BY created_at DESC');
      const rows = stmt.all() as BillRow[];
      const endTime = process.hrtime.bigint();
      const queryTimeMs = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds

      const bills = rows.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        proposerId: r.proposer_id,
        status: r.status,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      }));

      // Only cache if query took longer than 0.5ms (getAll might be slower)
      if (this.cache && queryTimeMs > 0.5) {
        // Fire and forget cache set to avoid blocking reads
        void this.cache.set(cacheKeys.bills(), bills, CACHE_TTL.BILLS_LIST);
      }

      return bills;
    });
  }

  async update(
    id: string,
    updates: Partial<{
      title: string;
      description: string;
      status: string;
    }>
  ) {
    return retryWithBackoff(async () => {
      const now = new Date().toISOString();

      const setClause = Object.keys(updates)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(updates), now, id];

      const stmt = this.db.prepare(`
        UPDATE bills SET ${setClause}, updated_at = ? WHERE id = ?
      `);

      const result = stmt.run(...values) as { changes: number };

      if (result.changes === 0) {
        return null;
      }

      // Invalidate cache
      if (this.cache) {
        // Fire and forget cache invalidation to avoid blocking writes
        void this.cache.del(cacheKeys.bill(id));
        void this.cache.del(cacheKeys.bills());
      }

      return this.getById(id);
    });
  }

  async delete(id: string) {
    return retryWithBackoff(async () => {
      const stmt = this.db.prepare('DELETE FROM bills WHERE id = ?');
      const result = stmt.run(id);

      // Invalidate cache
      if (this.cache) {
        // Fire and forget cache invalidation to avoid blocking writes
        void this.cache.del(cacheKeys.bill(id));
        void this.cache.del(cacheKeys.bills());
      }

      return result.changes > 0;
    });
  }
}
