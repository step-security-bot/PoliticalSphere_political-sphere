import type Database from 'better-sqlite3';
import { CacheService } from '../utils/cache.ts'; // eslint-disable-line no-restricted-imports
import { DB_PATH, initializeDatabase, runMigrations } from './migrations.js';

import { BillStore } from './bill-store.js';
import { PartyStore } from './party-store.js';
import { UserStore } from './user-store.js';
import { VoteStore } from './vote-store.js';

/**
 * Determine if cache should be enabled for the current environment.
 * Returns true only when cache is explicitly enabled and not in test or in-memory DB contexts.
 */
function shouldEnableCache() {
  if (process.env.NODE_ENV === 'test') {
    return false;
  }
  if (DB_PATH === ':memory:') {
    return false;
  }
  if (process.env.API_ENABLE_CACHE === 'false') {
    return false;
  }
  // Only enable cache if explicitly requested AND Redis is available
  // This prevents automatic enabling which can hurt performance
  return process.env.API_ENABLE_CACHE === 'true' && Boolean(process.env.REDIS_URL);
}

/**
 * Database Connection wrapper that provides typed store instances and manages cache lifecycle.
 */
export class DatabaseConnection {
  db: Database.Database;
  cache?: CacheService;
  ownsCache = false;
  users: UserStore;
  parties: PartyStore;
  bills: BillStore;
  votes: VoteStore;

  constructor(options: { cache?: CacheService; enableCache?: boolean } = {}) {
    // Use file-based database from migrations.js (uses :memory: for tests, file for dev/prod)
    this.db = initializeDatabase();

    // Run migrations to ensure schema is up to date
    // This is synchronous during initialization to prevent race conditions
    runMigrations(this.db);

    if (options.cache) {
      this.cache = options.cache;
    } else if (options.enableCache ?? shouldEnableCache()) {
      this.cache = new CacheService();
      this.ownsCache = true;
    }

    // Stores accept specific constructor signatures
    this.users = new UserStore(this.db, this.cache ?? null);
    this.parties = new PartyStore(this.db, this.cache ?? null);
    this.bills = new BillStore(this.db, this.cache ?? null);
    this.votes = new VoteStore(this.cache ?? null);
  }

  close() {
    this.db.close();
    if (this.ownsCache && this.cache) {
      void this.cache.close();
    }
  }
}

// Singleton pattern for database connection (disabled in tests)
let dbConnection: DatabaseConnection | null = null;

/**
 * Get a singleton DatabaseConnection instance. Creates the connection and runs migrations if needed.
 * @param options - Optional cache or enableCache overrides
 */
export function getDatabase(
  options: { cache?: CacheService; enableCache?: boolean } = {}
): DatabaseConnection {
  // Use a singleton even in tests; tests call closeDatabase() between cases
  if (!dbConnection) {
    dbConnection = new DatabaseConnection(options);
  }
  return dbConnection;
}

/**
 * Close the current database connection and free resources. Meant for cleanup in tests or shutdown.
 */
export function closeDatabase() {
  if (dbConnection) {
    dbConnection.close();
    dbConnection = null;
  }
}
