import * as fs from 'node:fs';
import * as path from 'node:path';

import type BetterSqlite3 from 'better-sqlite3';

import { validateFilename, safeJoin } from '../../../../libs/shared/src/path-security.mjs';

import { withTransaction } from './database-transactions.mjs';
import * as loggerModule from './logger.js';

const logger = loggerModule.default || loggerModule;

/**
 * Database Seeder
 * Provides seeding functionality for development and testing environments
 * @see docs/architecture/decisions/adr-0003-database-seeding.md
 */

interface SeederOptions {
  environment?: string;
  force?: boolean;
  dryRun?: boolean;
}

interface SeederResult {
  name: string;
  success: boolean;
  duration: number;
  dryRun: boolean;
  error?: string;
}

interface SeedingResults {
  success: boolean;
  seeders: Array<{ name: string; status: string; dryRun?: boolean; reason?: string }>;
  errors: Array<{ name: string; error: string; stack?: string }>;
  duration: number;
}

// Transaction object from database-transactions.mjs has these properties
interface Transaction {
  isActive: boolean;
  connection: DatabaseConnectionWrapper;
  savepoint: (name: string) => Promise<void>;
  rollbackToSavepoint: (name: string) => Promise<void>;
  releaseSavepoint: (name: string) => Promise<void>;
}

// DatabaseConnection wrapper from database-connection.mjs
interface DatabaseConnectionWrapper {
  db: BetterSqlite3.Database;
  getConnection: () => BetterSqlite3.Database;
  prepare: (sql: string) => BetterSqlite3.Statement;
  close: () => void;
}

type SeederFunction = (
  transaction: Transaction,
  connection: DatabaseConnectionWrapper
) => Promise<void>;

/**
 * Database Seeder
 *
 * Manages database seeding operations for development and testing environments.
 * Provides transactional seeding with rollback capabilities and supports
 * multiple seeders for different data types and scenarios.
 */
class DatabaseSeeder {
  private seeders: Map<string, SeederFunction>;
  private isSeeded: boolean;

  constructor() {
    this.seeders = new Map();
    this.isSeeded = false;
  }

  /**
   * Register a seeder function
   * @param {string} name - Seeder name
   * @param {Function} seederFn - Seeder function that receives transaction and connection
   */
  register(name: string, seederFn: SeederFunction): void {
    if (typeof seederFn !== 'function') {
      throw new Error(`Seeder ${name} must be a function`);
    }
    this.seeders.set(name, seederFn);
    logger.debug('Seeder registered', { name });
  }

  /**
   * Load seeders from files
   * @param {string} seedersDir - Directory containing seeder files
   */
  loadFromDirectory(seedersDir: string): void {
    if (!fs.existsSync(seedersDir)) {
      logger.warn('Seeders directory does not exist', { seedersDir });
      return;
    }

    const files = fs
      .readdirSync(seedersDir)
      .filter(file => file.endsWith('.js') && file !== 'index.js')
      .sort();

    for (const file of files) {
      let filePath: string = ''; // Declare with explicit type
      try {
        // Validate filename before joining to prevent path traversal
        const sanitizedFile = validateFilename(file);
        filePath = safeJoin(seedersDir, sanitizedFile);
        const seederModule = require(filePath);

        if (typeof seederModule === 'function') {
          const name = path.basename(sanitizedFile, '.js');
          this.register(name, seederModule);
        } else if (seederModule.default && typeof seederModule.default === 'function') {
          const name = path.basename(sanitizedFile, '.js');
          this.register(name, seederModule.default);
        } else {
          logger.warn('Seeder file does not export a function', {
            file: filePath,
          });
        }
      } catch (error) {
        logger.error('Failed to load seeder', {
          file: filePath,
          error: (error as Error).message,
        });
      }
    }

    logger.info('Seeders loaded from directory', {
      seedersDir,
      count: this.seeders.size,
    });
  }

  /**
   * Run all registered seeders
   * @param {Object} options - Seeding options
   * @returns {Promise<Object>} Seeding results
   */
  async runAll(
    options: SeederOptions = {}
  ): Promise<SeedingResults | { skipped: boolean; reason: string }> {
    const {
      environment = process.env.NODE_ENV || 'development',
      force = false,
      dryRun = false,
    } = options;

    if (environment === 'production' && !force) {
      throw new Error('Seeding is disabled in production. Use force=true to override.');
    }

    if (this.isSeeded && !force) {
      logger.info('Database already seeded, skipping');
      return { skipped: true, reason: 'already_seeded' };
    }

    const results: SeedingResults = {
      success: true,
      seeders: [],
      errors: [],
      duration: 0,
    };

    const startTime = Date.now();

    try {
      await withTransaction(async (transaction: Transaction, connection: unknown) => {
        for (const [name, seederFn] of this.seeders) {
          try {
            logger.info('Running seeder', { name, dryRun });

            if (!dryRun) {
              await seederFn(transaction, connection as DatabaseConnectionWrapper);
            }

            results.seeders.push({
              name,
              status: 'completed',
              dryRun,
            });

            logger.info('Seeder completed', { name });
          } catch (error) {
            logger.error('Seeder failed', { name, error: (error as Error).message });

            const err = error as Error;
            results.errors.push({
              name,
              error: err.message,
              stack: err.stack,
            });

            results.success = false;

            // Continue with other seeders unless it's a critical error
            if ((error as Error).message.includes('UNIQUE constraint failed')) {
              logger.warn('Skipping seeder due to constraint violation', {
                name,
              });
              results.seeders.push({
                name,
                status: 'skipped',
                reason: 'constraint_violation',
              });
            } else {
              throw error; // Re-throw to rollback transaction
            }
          }
        }
      });

      this.isSeeded = !dryRun;
    } catch (error) {
      const err = error as Error;
      results.success = false;
      results.errors.push({
        name: 'transaction',
        error: err.message,
        stack: err.stack,
      });
      logger.error('Seeding failed', { error: err.message });
    }

    results.duration = Date.now() - startTime;

    logger.info('Seeding completed', {
      success: results.success,
      seedersRun: results.seeders.length,
      errors: results.errors.length,
      duration: results.duration,
      dryRun,
    });

    return results;
  }

  /**
   * Run a specific seeder
   * @param {string} name - Seeder name
   * @param {Object} options - Seeding options
   * @returns {Promise<Object>} Seeding result
   */
  async runSeeder(name: string, options: SeederOptions = {}): Promise<SeederResult> {
    const seederFn = this.seeders.get(name);
    if (!seederFn) {
      throw new Error(`Seeder ${name} not found`);
    }

    const {
      environment = process.env.NODE_ENV || 'development',
      force = false,
      dryRun = false,
    } = options;

    if (environment === 'production' && !force) {
      throw new Error('Seeding is disabled in production. Use force=true to override.');
    }

    const result: SeederResult = {
      name,
      success: true,
      duration: 0,
      dryRun,
    };

    const startTime = Date.now();

    try {
      await withTransaction(async (transaction: Transaction, connection: unknown) => {
        logger.info('Running seeder', { name, dryRun });

        if (!dryRun) {
          await seederFn(transaction, connection as DatabaseConnectionWrapper);
        }

        logger.info('Seeder completed', { name });
      });
    } catch (error) {
      result.success = false;
      result.error = (error as Error).message;
      logger.error('Seeder failed', { name, error: (error as Error).message });
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Clear seeded data
   * @param {Array<string>} tables - Tables to clear
   * @returns {Promise<void>}
   */
  async clear(tables: string[] = []): Promise<void> {
    const defaultTables = ['votes', 'bills', 'parties', 'users'];

    await withTransaction(async (_transaction: Transaction, connection: unknown) => {
      const conn = connection as DatabaseConnectionWrapper;
      // Build allowlist of existing tables to avoid SQL injection via table names
      const isValidIdentifier = (name: string): boolean =>
        /^[A-Za-z_][A-Za-z0-9_]*$/.test(String(name));
      let existingTables = new Set();
      try {
        const rows = conn.db
          .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
          .all() as Array<{ name: string }>;
        existingTables = new Set(rows.map(r => r.name));
      } catch {
        // Database query failed, existingTables remains empty Set
      }
      const tablesToClear = tables.length > 0 ? tables : defaultTables;

      for (const table of tablesToClear) {
        if (!isValidIdentifier(table) || !existingTables.has(table)) {
          logger.warn('Skipping clear for invalid or unknown table', { table });
          continue;
        }
        try {
          conn.db.exec(`DELETE FROM ${table}`);
          logger.debug('Table cleared', { table });
        } catch (error) {
          logger.warn('Failed to clear table', { table, error: (error as Error).message });
        }
      }

      // Reset auto-increment counters
      try {
        conn.db.exec('DELETE FROM sqlite_sequence');
        logger.debug('Auto-increment counters reset');
      } catch {
        // Ignore if table doesn't exist
      }
    });

    this.isSeeded = false;
    logger.info('Seeded data cleared', {
      tables: tables.length > 0 ? tables : defaultTables,
    });
  }

  /**
   * Get list of registered seeders
   * @returns {Array<string>} Seeder names
   */
  listSeeders(): string[] {
    return Array.from(this.seeders.keys());
  }

  /**
   * Check if database has been seeded
   * @returns {boolean} Seeding status
   */
  isDatabaseSeeded(): boolean {
    return this.isSeeded;
  }
}

// Create singleton instance
const seeder = new DatabaseSeeder();

// Register default seeders
seeder.register('users', async (_transaction, connection) => {
  const users = [
    { id: 'user-1', username: 'alice', email: 'alice@example.com' },
    { id: 'user-2', username: 'bob', email: 'bob@example.com' },
    { id: 'user-3', username: 'charlie', email: 'charlie@example.com' },
  ];

  const stmt = connection.db.prepare(`
		INSERT OR REPLACE INTO users (id, username, email, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?)
	`);

  for (const user of users) {
    const now = new Date().toISOString();
    stmt.run(user.id, user.username, user.email, now, now);
  }
});

seeder.register('parties', async (_transaction, connection) => {
  const parties = [
    {
      id: 'party-1',
      name: 'Democratic Party',
      description: 'Progressive policies',
      color: '#0015BC',
    },
    {
      id: 'party-2',
      name: 'Republican Party',
      description: 'Conservative policies',
      color: '#E9141D',
    },
    {
      id: 'party-3',
      name: 'Green Party',
      description: 'Environmental focus',
      color: '#0B9A4A',
    },
  ];

  const stmt = connection.db.prepare(`
		INSERT OR REPLACE INTO parties (id, name, description, color, created_at)
		VALUES (?, ?, ?, ?, ?)
	`);

  for (const party of parties) {
    const now = new Date().toISOString();
    stmt.run(party.id, party.name, party.description, party.color, now);
  }
});

seeder.register('bills', async (_transaction, connection) => {
  const bills = [
    {
      id: 'bill-1',
      title: 'Environmental Protection Act',
      description: 'Strengthen environmental regulations',
      proposerId: 'user-1',
      status: 'proposed',
    },
    {
      id: 'bill-2',
      title: 'Healthcare Reform',
      description: 'Universal healthcare coverage',
      proposerId: 'user-2',
      status: 'debating',
    },
    {
      id: 'bill-3',
      title: 'Education Funding',
      description: 'Increase education budget',
      proposerId: 'user-3',
      status: 'passed',
    },
  ];

  const stmt = connection.db.prepare(`
		INSERT OR REPLACE INTO bills (id, title, description, proposer_id, status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`);

  for (const bill of bills) {
    const now = new Date().toISOString();
    stmt.run(bill.id, bill.title, bill.description, bill.proposerId, bill.status, now, now);
  }
});

seeder.register('votes', async (_transaction, connection) => {
  const votes = [
    { billId: 'bill-1', userId: 'user-2', vote: 'aye' },
    { billId: 'bill-1', userId: 'user-3', vote: 'nay' },
    { billId: 'bill-2', userId: 'user-1', vote: 'aye' },
    { billId: 'bill-2', userId: 'user-3', vote: 'aye' },
    { billId: 'bill-3', userId: 'user-1', vote: 'aye' },
    { billId: 'bill-3', userId: 'user-2', vote: 'aye' },
  ];

  const stmt = connection.db.prepare(`
		INSERT OR REPLACE INTO votes (bill_id, user_id, vote, created_at)
		VALUES (?, ?, ?, ?)
	`);

  for (const vote of votes) {
    const now = new Date().toISOString();
    stmt.run(vote.billId, vote.userId, vote.vote, now);
  }
});

export { DatabaseSeeder, seeder };
