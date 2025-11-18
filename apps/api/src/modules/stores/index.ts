import type Database from 'better-sqlite3';

import { CacheService } from '../../utils/cache.ts'; // eslint-disable-line no-restricted-imports
import { initializeDatabase, runMigrations } from './migrations.ts';

import { BillStore } from './bill-store.ts';
import { PartyStore } from './party-store.ts';
import { UserStore } from './user-store.ts';
import { VoteStore } from './vote-store.ts';

interface DatabaseOptions {
  cache?: CacheService;
  enableCache?: boolean;
}

function shouldEnableCache(): boolean {
  if (process.env.NODE_ENV === 'test') {
    return false;
  }
  if (process.env.API_ENABLE_CACHE === 'true') {
    return true;
  }
  if (process.env.API_ENABLE_CACHE === 'false') {
    return false;
  }
  return Boolean(process.env.REDIS_URL);
}

export class DatabaseConnection {
  private db: Database.Database;
  private cache?: CacheService;
  private ownsCache = false;
  public users: UserStore;
  public parties: PartyStore;
  public bills: BillStore;
  public votes: VoteStore;

  constructor(options: DatabaseOptions = {}) {
    // Use file-based database from migrations.ts (uses :memory: for tests, file for dev/prod)
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

    this.users = new UserStore(this.db, this.cache);
    this.parties = new PartyStore(this.db, this.cache);
    this.bills = new BillStore(this.db, this.cache);
    this.votes = new VoteStore(this.db, this.cache);
  }

  close(): void {
    this.db.close();
    if (this.ownsCache && this.cache) {
      void this.cache.close();
    }
  }
}

// Singleton pattern for database connection (disabled in tests)
let dbConnection: DatabaseConnection | null = null;

export function getDatabase(options: DatabaseOptions = {}): DatabaseConnection {
  // In test environment, always create a new connection to avoid interference
  if (process.env.NODE_ENV === 'test') {
    return new DatabaseConnection(options);
  }

  if (!dbConnection) {
    dbConnection = new DatabaseConnection(options);
  }
  return dbConnection;
}

export function closeDatabase(): void {
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

export type { DatabaseOptions };
