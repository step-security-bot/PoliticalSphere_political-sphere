import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '../../..');
const METRICS_DIR_CANDIDATES = [
  path.join(REPO_ROOT, 'ai', 'metrics'),
  path.join(REPO_ROOT, 'ai-metrics'),
  path.join(REPO_ROOT, 'ai', 'ai-metrics'),
];

function resolveMetricsDir() {
  for (const dir of METRICS_DIR_CANDIDATES) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (dir !== METRICS_DIR_CANDIDATES[0]) {
        console.warn('[analytics] using legacy metrics directory', dir);
      }
      return dir;
    } catch (_error) {
      console.warn('[analytics] unable to initialise metrics directory', dir, error.message);
    }
  }
  throw new Error('Unable to initialise AI metrics directory');
}

const DB_DIR = resolveMetricsDir();
const DB_PATH = path.join(DB_DIR, 'analytics.db');
let sqliteAvailable = true;

async function getDatabaseHandle() {
  if (!sqliteAvailable) return null;

  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    const { default: Database } = await import('better-sqlite3');
    const db = new Database(DB_PATH);
    db.exec(`
      CREATE TABLE IF NOT EXISTS ai_script_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        script TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        duration_ms INTEGER DEFAULT NULL,
        payload TEXT
      );
    `);
    return db;
  } catch (_error) {
    sqliteAvailable = false;
    console.warn('[analytics] better-sqlite3 unavailable; using JSONL fallback.');
    return null;
  }
}

function writeJsonFallback(script, { durationMs, payload }) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const fallbackPath = path.join(DB_DIR, 'analytics-fallback.jsonl');
  const entry = {
    script,
    timestamp: new Date().toISOString(),
    durationMs,
    payload,
  };
  fs.appendFileSync(fallbackPath, `${JSON.stringify(entry)}\n`, 'utf8');
}

export async function recordScriptEvent(script, { durationMs = null, payload = null } = {}) {
  const db = await getDatabaseHandle();
  if (!db) {
    writeJsonFallback(script, { durationMs, payload });
    return;
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO ai_script_events (script, timestamp, duration_ms, payload)
      VALUES (@script, @timestamp, @duration_ms, @payload)
    `);
    stmt.run({
      script,
      timestamp: new Date().toISOString(),
      duration_ms: durationMs,
      payload: payload ? JSON.stringify(payload) : null,
    });
  } catch (_error) {
    console.warn('Failed to record script event:', error.message);
    writeJsonFallback(script, { durationMs, payload });
  } finally {
    db.close();
  }
}

export async function getDatabasePath() {
  const db = await getDatabaseHandle();
  if (db) {
    db.close();
    return DB_PATH;
  }
  return path.join(DB_DIR, 'analytics-fallback.jsonl');
}
