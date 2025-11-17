// os is not required when using in-memory DB for tests
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Database from 'better-sqlite3';

// Support both ESM and CommonJS environments
const getDbPath = () => {
  if (typeof __dirname !== 'undefined') {
    // CommonJS or transformed code
    // From apps/api/src/modules/stores/ go up 5 levels to repo root
    return path.join(__dirname, '../../../../../data/runtime/political_sphere.db');
  } else {
    // Pure ESM
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    // From apps/api/src/modules/stores/ go up 5 levels to repo root
    return path.join(__dirname, '../../../../../data/runtime/political_sphere.db');
  }
};

let DB_PATH = getDbPath();

// Export for debugging
export { DB_PATH };

// For test runs, prefer an in-memory database to avoid filesystem locking and
// interference between parallel test runs. Use a file-backed DB only outside tests.
if (process.env.NODE_ENV === 'test') {
  DB_PATH = ':memory:';
}

export function initializeDatabase(): Database.Database {
  // Log the database path for debugging
  console.log('🗄️  Initializing database at path:', DB_PATH);

  // If using a file-backed DB, ensure the directory exists before opening it.
  if (DB_PATH !== ':memory:') {
    const dir = path.dirname(DB_PATH);
    console.log('📁 Ensuring directory exists:', dir);
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // If for some reason directory creation fails, let better-sqlite3 report the error
    }
  }

  // Open the database. For in-memory DBs, better-sqlite3 accepts ':memory:'.
  const db = new Database(DB_PATH);
  console.log('✅ Database opened successfully');

  // Enable WAL mode for better concurrency on file-backed DBs only. WAL is not
  // applicable for in-memory databases and can cause errors or be ignored.
  if (DB_PATH !== ':memory:') {
    try {
      db.pragma('journal_mode = WAL');
    } catch {
      // Ignore pragma failures; concurrency will be lower but tests should proceed.
    }
  }

  // Always enable foreign keys enforcement where supported.
  try {
    db.pragma('foreign_keys = ON');
  } catch {
    // Ignore if pragma not supported in some environments
  }

  return db;
}

export function runMigrations(db: Database.Database): void {
  // Write to log file for debugging
  try {
    const logPath = path.join(process.cwd(), 'migration-debug.log');
    fs.appendFileSync(logPath, `\n[${new Date().toISOString()}] Starting migrations\n`);
    fs.appendFileSync(logPath, `DB_PATH: ${DB_PATH}\n`);
    fs.appendFileSync(logPath, `CWD: ${process.cwd()}\n`);
  } catch {
    // Ignore logging errors
  }

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'VIEWER' CHECK(role IN ('ADMIN', 'MODERATOR', 'VIEWER')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrate existing users table if it exists without password_hash column
  // Check if password_hash column exists, add it if missing
  const userTableInfo = db.pragma('table_info(users)') as Array<{ name: string }>;
  const hasPasswordHash = userTableInfo.some(col => col.name === 'password_hash');
  const hasRole = userTableInfo.some(col => col.name === 'role');

  if (!hasPasswordHash) {
    db.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT;`);
  }
  if (!hasRole) {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'VIEWER';`);
  }

  // Create parties table
  db.exec(`
    CREATE TABLE IF NOT EXISTS parties (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create bills table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      proposer_id TEXT NOT NULL,
      status TEXT CHECK(status IN ('proposed', 'debating', 'passed', 'rejected')) DEFAULT 'proposed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (proposer_id) REFERENCES users(id)
    );
  `);

  // Create votes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      bill_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      vote TEXT CHECK(vote IN ('aye', 'nay', 'abstain')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bill_id) REFERENCES bills(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(bill_id, user_id)
    );
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_bills_proposer_id ON bills(proposer_id);
    CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
    CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at);
    CREATE INDEX IF NOT EXISTS idx_votes_bill_id ON votes(bill_id);
    CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
    CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_parties_name ON parties(name);
  `);
}
