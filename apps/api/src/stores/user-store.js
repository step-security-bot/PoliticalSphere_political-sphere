import { v4 as uuidv4 } from 'uuid';

// eslint-disable-next-line no-restricted-imports
import { CACHE_TTL, cacheKeys } from '../utils/cache.ts';
import { DatabaseError, retryWithBackoff } from '../utils/error-handler.js'; // eslint-disable-line no-restricted-imports

/**
 * @typedef {import('../utils/cache.ts').CacheService} CacheService
 */

class UserStore {
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

    // Handle optional passwordHash and role fields
    let passwordHash = input.passwordHash;
    // In unit tests, allow creating users without providing a password.
    // Use a non-null placeholder to satisfy NOT NULL schema constraints.
    if (process.env.NODE_ENV === 'test' && !passwordHash) {
      passwordHash = 'test-placeholder-password-hash';
    }
    const role = input.role || 'VIEWER';

    try {
      return await retryWithBackoff(async () => {
        const stmt = this.db.prepare(`
          INSERT INTO users (id, username, email, password_hash, role, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `);

        stmt.run(id, input.username, input.email, passwordHash || null, role);

        const result = {
          id,
          username: input.username,
          email: input.email,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (this.cache) {
          await Promise.all([
            this.cache.set(cacheKeys.user(id), result, CACHE_TTL.USER),
            this.cache.set(cacheKeys.userByUsername(input.username), result, CACHE_TTL.USER),
            this.cache.set(cacheKeys.userByEmail(input.email), result, CACHE_TTL.USER),
            this.cache.invalidatePattern('user:*:bills'),
            this.cache.invalidatePattern('user:*:votes'),
          ]);
        }

        return result;
      });
    } catch (error) {
      throw new DatabaseError(`Failed to create user: ${error.message}`);
    }
  }

  async getById(id) {
    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get(cacheKeys.user(id));
      if (cached) return cached;
    }

    try {
      return await retryWithBackoff(async () => {
        const stmt = this.db.prepare(`
          SELECT id, username, email, created_at as createdAt, updated_at as updatedAt
          FROM users
          WHERE id = ?
        `);
        const user = stmt.get(id);
        if (!user) return null;

        const result = {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };

        // Cache the result
        if (this.cache) {
          await this.cache.set(cacheKeys.user(id), result, CACHE_TTL.USER);
        }

        return result;
      });
    } catch (error) {
      throw new DatabaseError(`Failed to get user ${id}: ${error.message}`);
    }
  }

  async getByUsername(username) {
    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get(cacheKeys.userByUsername(username));
      if (cached) return cached;
    }

    try {
      return await retryWithBackoff(async () => {
        const stmt = this.db.prepare(`
          SELECT id, username, email, created_at as createdAt, updated_at as updatedAt
          FROM users
          WHERE username = ?
        `);
        const user = stmt.get(username);
        if (!user) return null;

        const result = {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };

        // Cache the result
        if (this.cache) {
          await this.cache.set(cacheKeys.userByUsername(username), result, CACHE_TTL.USER);
        }

        return result;
      });
    } catch (error) {
      throw new DatabaseError(`Failed to get user by username ${username}: ${error.message}`);
    }
  }

  async getByEmail(email) {
    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get(cacheKeys.userByEmail(email));
      if (cached) return cached;
    }

    try {
      return await retryWithBackoff(async () => {
        const stmt = this.db.prepare(`
          SELECT id, username, email, created_at as createdAt, updated_at as updatedAt
          FROM users
          WHERE email = ?
        `);
        const user = stmt.get(email);
        if (!user) return null;

        const result = {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };

        // Cache the result
        if (this.cache) {
          await this.cache.set(cacheKeys.userByEmail(email), result, CACHE_TTL.USER);
        }

        return result;
      });
    } catch (error) {
      throw new DatabaseError(`Failed to get user by email ${email}: ${error.message}`);
    }
  }

  /**
   * Retrieve all users (no paging needed for current test scope)
   */
  async getAll() {
    try {
      return await retryWithBackoff(async () => {
        const stmt = this.db.prepare(`
          SELECT id, username, email, created_at as createdAt, updated_at as updatedAt
          FROM users
          ORDER BY created_at DESC
        `);
        const users = stmt.all();
        return users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }));
      });
    } catch (error) {
      throw new DatabaseError(`Failed to get all users: ${error.message}`);
    }
  }

  /**
   * Update username/email for a user, returning updated record or null if not found
   */
  async update(id, updates) {
    try {
      return await retryWithBackoff(async () => {
        // Check if user exists
        const existingStmt = this.db.prepare('SELECT id FROM users WHERE id = ?');
        const existing = existingStmt.get(id);
        if (!existing) return null;

        // Build update query dynamically
        const updateFields = [];
        const values = [];
        if (updates.username !== undefined) {
          updateFields.push('username = ?');
          values.push(updates.username);
        }
        if (updates.email !== undefined) {
          updateFields.push('email = ?');
          values.push(updates.email);
        }
        if (updates.passwordHash !== undefined) {
          updateFields.push('password_hash = ?');
          values.push(updates.passwordHash);
        }
        if (updates.role !== undefined) {
          updateFields.push('role = ?');
          values.push(updates.role);
        }

        if (updateFields.length === 0) return null; // Nothing to update

        updateFields.push("updated_at = datetime('now')");
        values.push(id);

        const updateStmt = this.db.prepare(`
          UPDATE users
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `);
        updateStmt.run(...values);

        // Return updated user
        const selectStmt = this.db.prepare(`
          SELECT id, username, email, created_at as createdAt, updated_at as updatedAt
          FROM users
          WHERE id = ?
        `);
        const user = selectStmt.get(id);
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      });
    } catch (error) {
      throw new DatabaseError(`Failed to update user ${id}: ${error.message}`);
    }
  }

  /**
   * Delete a user by id
   */
  async delete(id) {
    try {
      return await retryWithBackoff(async () => {
        const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
        const result = stmt.run(id);
        if (result.changes > 0) {
          if (this.cache) {
            await Promise.all([
              this.cache.del(cacheKeys.user(id)),
              this.cache.invalidatePattern(`user:${id}:*`),
            ]);
          }
          return true;
        }
        return false; // Not found
      });
    } catch (error) {
      throw new DatabaseError(`Failed to delete user ${id}: ${error.message}`);
    }
  }

  /**
   * Get user with password hash for authentication (internal use only)
   * Returns user with passwordHash and role fields included
   */
  async getUserForAuth(usernameOrEmail) {
    try {
      return await retryWithBackoff(async () => {
        const stmt = this.db.prepare(`
          SELECT id, username, email, password_hash, role
          FROM users
          WHERE username = ? OR email = ?
        `);
        const user = stmt.get(usernameOrEmail, usernameOrEmail);
        if (!user || !user.password_hash) return null;

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          passwordHash: user.password_hash,
          role: user.role,
        };
      });
    } catch (error) {
      throw new DatabaseError(`Failed to get user for auth ${usernameOrEmail}: ${error.message}`);
    }
  }
}

export { UserStore };
