import type Database from 'better-sqlite3';
import { CacheService } from '../utils/cache.ts'; // eslint-disable-line no-restricted-imports
import { DB_PATH, initializeDatabase, runMigrations } from './migrations.js';

import { BillStore } from './bill-store.js';
import { PartyStore } from './party-store.js';
import { UserStore } from './user-store.js';
import { VoteStore } from './vote-store.js';

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
    this.users = new UserStore(this.db, null);
    this.parties = new PartyStore(this.db, null);
    this.bills = new BillStore(null);
    this.votes = new VoteStore(null);
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

export function getDatabase(
  options: { cache?: CacheService; enableCache?: boolean } = {},
): DatabaseConnection {
  // In test environment, always create a new connection to avoid interference
  if (process.env.NODE_ENV === 'test') {
    return new DatabaseConnection(options);
  }

  if (!dbConnection) {
    dbConnection = new DatabaseConnection(options);
  }
  return dbConnection;
}

export function closeDatabase() {
  if (process.env.NODE_ENV === 'test') {
    // In test environment, getDatabase() returns a new instance each time,
    // so we need to close the specific instance. But since tests call this
    // in afterEach, and getDatabase() creates new instances, we can't track them.
    // Instead, rely on garbage collection or let the process end.
    return;
  }

  if (dbConnection) {
    dbConnection.close();
    dbConnection = null;
  }
}
