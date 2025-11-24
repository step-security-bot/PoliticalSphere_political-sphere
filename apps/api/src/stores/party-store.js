import { v4 as uuidv4 } from 'uuid';

import { CACHE_TTL, cacheKeys } from '../utils/cache.ts'; // eslint-disable-line no-restricted-imports
import { DatabaseError, retryWithBackoff } from '../utils/error-handler.ts'; // eslint-disable-line no-restricted-imports

/**
 * @typedef {import('../utils/cache.ts').CacheService} CacheService
 */

class PartyStore {
  /**
   * @param {unknown} db
   * @param {CacheService | null} [cache]
   */
  constructor(db, cache = null) {
    this.db = db;
    this.cache = cache;
  }

  async create(input) {
    const id = uuidv4();

    try {
      return await retryWithBackoff(async () => {
        const stmt = this.db.prepare(`
          INSERT INTO parties (id, name, description, color, created_at)
          VALUES (?, ?, ?, ?, datetime('now'))
        `);

        stmt.run(id, input.name, input.description || null, input.color);

        // Select back to get exact timestamps
        const selectStmt = this.db.prepare(`
          SELECT id, name, description, color, created_at as createdAt
          FROM parties
          WHERE id = ?
        `);
        const dbParty = selectStmt.get(id);
        const result = {
          id: dbParty.id,
          name: dbParty.name,
          description: dbParty.description ?? undefined,
          color: dbParty.color,
          createdAt: new Date(dbParty.createdAt).toISOString(),
        };

        if (this.cache) {
          await Promise.all([
            this.cache.del(cacheKeys.party(id)),
            this.cache.del(cacheKeys.partyByName(input.name)),
            this.cache.invalidatePattern('parties:list:*'),
          ]);
        }

        return result;
      });
    } catch (error) {
      throw new DatabaseError(`Failed to create party: ${error.message}`);
    }
  }

  async getById(id) {
    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get(cacheKeys.party(id));
      if (cached) return cached;
    }

    try {
      return await retryWithBackoff(async () => {
        const stmt = this.db.prepare(`
          SELECT id, name, description, color, created_at as createdAt
          FROM parties
          WHERE id = ?
        `);
        const party = stmt.get(id);
        if (!party) return null;

        const result = {
          id: party.id,
          name: party.name,
          description: party.description ?? undefined,
          color: party.color,
          createdAt: new Date(party.createdAt).toISOString(),
        };

        // Cache the result
        if (this.cache) {
          await this.cache.set(cacheKeys.party(id), result, CACHE_TTL.PARTY);
        }

        return result;
      });
    } catch (error) {
      throw new DatabaseError(`Failed to get party ${id}: ${error.message}`);
    }
  }

  async getByName(name) {
    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get(cacheKeys.partyByName(name));
      if (cached) return cached;
    }

    try {
      return await retryWithBackoff(async () => {
        const stmt = this.db.prepare(`
          SELECT id, name, description, color, created_at as createdAt
          FROM parties
          WHERE name = ?
        `);
        const party = stmt.get(name);
        if (!party) return null;

        const result = {
          id: party.id,
          name: party.name,
          description: party.description ?? undefined,
          color: party.color,
          createdAt: party.createdAt,
        };

        // Cache the result
        if (this.cache) {
          await this.cache.set(cacheKeys.partyByName(name), result, CACHE_TTL.PARTY);
        }

        return result;
      });
    } catch (error) {
      throw new DatabaseError(`Failed to get party by name ${name}: ${error.message}`);
    }
  }

  async getAll(page = 1, limit = 10) {
    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get(cacheKeys.parties());
      if (cached) return cached;
    }

    try {
      return await retryWithBackoff(async () => {
        const offset = (page - 1) * limit;

        const partiesStmt = this.db.prepare(`
          SELECT id, name, description, color, created_at as createdAt
          FROM parties
          ORDER BY created_at DESC
          LIMIT ? OFFSET ?
        `);

        const countStmt = this.db.prepare(`
          SELECT COUNT(*) as total FROM parties
        `);

        const parties = partiesStmt.all(limit, offset);
        const countResult = countStmt.get();
        const total = countResult.total;

        const result = {
          parties: parties.map(party => ({
            id: party.id,
            name: party.name,
            description: party.description ?? undefined,
            color: party.color,
            createdAt: party.createdAt,
          })),
          total,
        };

        // Cache the result
        if (this.cache) {
          await this.cache.set(cacheKeys.parties(), result, CACHE_TTL.PARTY);
        }

        return result;
      });
    } catch (error) {
      throw new DatabaseError(`Failed to get all parties: ${error.message}`);
    }
  }

  /**
   * Update a party by id
   * @param {string} id
   * @param {{ name?: string; description?: string; color?: string }} updates
   */
  async update(id, updates) {
    try {
      return await retryWithBackoff(async () => {
        const existingStmt = this.db.prepare('SELECT id FROM parties WHERE id = ?');
        const existing = existingStmt.get(id);
        if (!existing) return null;

        const fields = [];
        const values = [];
        if (updates.name !== undefined) {
          fields.push('name = ?');
          values.push(updates.name);
        }
        if (updates.description !== undefined) {
          fields.push('description = ?');
          values.push(updates.description ?? null);
        }
        if (updates.color !== undefined) {
          fields.push('color = ?');
          values.push(updates.color);
        }
        if (fields.length === 0) return null;

        values.push(id);
        const updateStmt = this.db.prepare(`UPDATE parties SET ${fields.join(', ')} WHERE id = ?`);
        updateStmt.run(...values);

        const selectStmt = this.db.prepare(
          'SELECT id, name, description, color, created_at as createdAt FROM parties WHERE id = ?'
        );
        const party = selectStmt.get(id);
        return {
          id: party.id,
          name: party.name,
          description: party.description ?? undefined,
          color: party.color,
          createdAt: party.createdAt,
        };
      });
    } catch (error) {
      throw new DatabaseError(`Failed to update party ${id}: ${error.message}`);
    }
  }

  /**
   * Delete a party by id
   * @param {string} id
   */
  async delete(id) {
    try {
      return await retryWithBackoff(async () => {
        const stmt = this.db.prepare('DELETE FROM parties WHERE id = ?');
        const result = stmt.run(id);
        if (result.changes > 0) {
          if (this.cache) {
            await Promise.all([
              this.cache.del(cacheKeys.party(id)),
              this.cache.invalidatePattern('parties:list:*'),
            ]);
          }
          return true;
        }
        return false;
      });
    } catch (error) {
      throw new DatabaseError(`Failed to delete party ${id}: ${error.message}`);
    }
  }
}

export { PartyStore };
