import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';

import { Logger } from '@political-sphere/shared';

const logger = new Logger({ service: 'game-server-db' });

/**
 * Game data structure stored in the database
 */
interface GameData {
  [key: string]: unknown;
}

/**
 * Audit event record
 */
interface AuditRecord {
  id: string;
  ts: number;
  contentId: string;
  event: string;
}

/**
 * Database adapter interface
 */
interface DatabaseAdapter {
  getAllGames(): Promise<Map<string, GameData>>;
  getGame(id: string): Promise<GameData | null>;
  upsertGame(id: string, obj: GameData): Promise<void>;
  deleteGame(id: string): Promise<void>;
  logAudit(contentId: string, event: string): Promise<void>;
}

const DB_PATH: string =
  process.env.GAME_SERVER_DB || path.join(__dirname, '..', 'data', 'games.db');

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fsSync.existsSync(dir)) {
    fsSync.mkdirSync(dir, { recursive: true });
  }
}

// Simple connection pool for sqlite3
class SqlitePool {
  private connections: any[] = [];
  private poolSize: number;
  private dbPath: string;
  private initialized = false;

  constructor(dbPath: string, poolSize = 5) {
    this.dbPath = dbPath;
    this.poolSize = poolSize;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    const sqlite3 = await import('sqlite3');
    for (let i = 0; i < this.poolSize; i++) {
      const db = new sqlite3.default.Database(this.dbPath);
      this.connections.push(db);
    }
    // Create tables
    await this.run('CREATE TABLE IF NOT EXISTS games (id TEXT PRIMARY KEY, json TEXT NOT NULL)');
    await this.run(
      'CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY, ts INTEGER NOT NULL, contentId TEXT NOT NULL, event TEXT NOT NULL)',
    );
    this.initialized = true;
  }

  private getConnection(): any {
    // Simple round-robin
    const conn = this.connections.shift();
    this.connections.push(conn);
    return conn;
  }

  async run(sql: string, params: unknown[] = []): Promise<{ lastID: number; changes: number }> {
    const conn = this.getConnection();
    return new Promise((resolve, reject) => {
      conn.run(
        sql,
        params,
        function (this: { lastID: number; changes: number }, err: Error | null) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        },
      );
    });
  }

  async all(sql: string, params: unknown[] = []): Promise<unknown[]> {
    const conn = this.getConnection();
    return new Promise((resolve, reject) => {
      conn.all(sql, params, (err: Error | null, rows: unknown[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  close(): void {
    this.connections.forEach(conn => conn.close());
  }
}

async function initWithSqlite3(): Promise<DatabaseAdapter> {
  ensureDir(DB_PATH);
  const pool = new SqlitePool(DB_PATH, 5);
  await pool.init();

  return {
    async getAllGames(): Promise<Map<string, GameData>> {
      const rows = (await pool.all('SELECT id, json FROM games')) as Array<{
        id: string;
        json: string;
      }>;
      const map = new Map<string, GameData>();
      rows.forEach(r => {
        map.set(r.id, JSON.parse(r.json) as GameData);
      });
      return map;
    },
    async getGame(id: string): Promise<GameData | null> {
      const rows = (await pool.all('SELECT json FROM games WHERE id = ?', [id])) as Array<{
        json: string;
      }>;
      return rows[0] ? (JSON.parse(rows[0].json) as GameData) : null;
    },
    async upsertGame(id: string, obj: GameData): Promise<void> {
      const json = JSON.stringify(obj);
      await pool.run(
        'INSERT INTO games (id, json) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET json = excluded.json',
        [id, json],
      );
    },
    async deleteGame(id: string): Promise<void> {
      await pool.run('DELETE FROM games WHERE id = ?', [id]);
    },
    async logAudit(contentId: string, event: string): Promise<void> {
      const ts = Date.now();
      const eid = `audit_${ts}_${Math.random().toString(36).slice(2, 9)}`;
      await pool.run('INSERT INTO audit (id, ts, contentId, event) VALUES (?, ?, ?, ?)', [
        eid,
        ts,
        contentId,
        event,
      ]);
    },
  };
}

async function initJsonFallback(): Promise<DatabaseAdapter> {
  const DATA_FILE = path.join(__dirname, '..', 'data', 'games.json');
  const AUDIT_FILE = path.join(__dirname, '..', 'data', 'audit.json');

  let gamesCache: Map<string, GameData> | null = null;
  let cacheLoaded = false;
  let saveTimeout: NodeJS.Timeout | null = null;

  async function loadGames(): Promise<Map<string, GameData>> {
    if (gamesCache && cacheLoaded) return gamesCache;
    try {
      const raw = await fs.readFile(DATA_FILE, 'utf8');
      const obj = JSON.parse(raw) as Record<string, GameData>;
      gamesCache = new Map(Object.entries(obj));
      cacheLoaded = true;
      return gamesCache;
    } catch {
      gamesCache = new Map();
      cacheLoaded = true;
      return gamesCache;
    }
  }

  function scheduleSave(): void {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      if (!gamesCache) return;
      try {
        const obj = Object.fromEntries(gamesCache);
        const dir = path.dirname(DATA_FILE);
        if (!fsSync.existsSync(dir)) {
          fsSync.mkdirSync(dir, { recursive: true });
        }
        await fs.writeFile(DATA_FILE, JSON.stringify(obj, null, 2), 'utf8');
      } catch (err) {
        const error = err as Error;
        logger.warn('Failed to persist games store (fallback)', {
          error: error.message || String(error),
        });
      }
    }, 100); // Debounce saves
  }

  async function logAuditRecord(contentId: string, event: string): Promise<void> {
    try {
      const dir = path.dirname(AUDIT_FILE);
      if (!fsSync.existsSync(dir)) {
        fsSync.mkdirSync(dir, { recursive: true });
      }
      const rec: AuditRecord = {
        id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        ts: Date.now(),
        contentId,
        event,
      };
      const line = JSON.stringify(rec) + '\n';
      await fs.appendFile(AUDIT_FILE, line, 'utf8');
    } catch {
      // swallow
    }
  }

  return {
    async getAllGames(): Promise<Map<string, GameData>> {
      return await loadGames();
    },
    async getGame(id: string): Promise<GameData | null> {
      const m = await loadGames();
      return m.get(id) || null;
    },
    async upsertGame(id: string, obj: GameData): Promise<void> {
      const m = await loadGames();
      m.set(id, obj);
      scheduleSave();
    },
    async deleteGame(id: string): Promise<void> {
      const m = await loadGames();
      m.delete(id);
      scheduleSave();
    },
    async logAudit(contentId: string, event: string): Promise<void> {
      await logAuditRecord(contentId, event);
    },
  };
}

// Initialize appropriate adapter without top-level await
const adapterPromise: Promise<DatabaseAdapter> = (async () => {
  try {
    await import('sqlite3');
    return await initWithSqlite3();
  } catch (err) {
    const error = err as Error;
    logger.warn('sqlite3 not available, using async JSON file fallback for persistence', {
      error: error?.message ?? String(error),
    });
    return await initJsonFallback();
  }
})();

export default adapterPromise;
