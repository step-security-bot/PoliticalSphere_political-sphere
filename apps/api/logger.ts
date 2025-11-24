/* eslint-disable no-console */

/**
 * Logger - Minimal logging interface used by local tooling and tests.
 *
 * Implementations should provide structured logging in production (pino/winston).
 */
interface Logger {
  /** Log informational messages. */
  info: (msg: string, ctx?: Record<string, unknown>) => void;
  /** Log warnings. */
  warn: (msg: string, ctx?: Record<string, unknown>) => void;
  /** Log errors. */
  error: (msg: string, ctx?: Record<string, unknown>) => void;
  /** Audit-level log events. */
  audit: (msg: string, ctx?: Record<string, unknown>) => void;
}

/**
 * Minimal logger shim for tests and local runs.
 *
 * Production deployments should replace this with a structured logger
 * that includes context and sampling (for example, `pino` or `winston`).
 */
const logger: Logger = {
  info: (msg, ctx) => {
    if (ctx) console.info('[INFO]', msg, JSON.stringify(ctx));
    else console.info('[INFO]', msg);
  },
  warn: (msg, ctx) => {
    if (ctx) console.warn('[WARN]', msg, JSON.stringify(ctx));
    else console.warn('[WARN]', msg);
  },
  error: (msg, ctx) => {
    if (ctx) console.error('[ERROR]', msg, JSON.stringify(ctx));
    else console.error('[ERROR]', msg);
  },
  audit: (msg, ctx) => {
    // Audit-level logs - keep as info in tests
    if (ctx) console.log('[AUDIT]', msg, JSON.stringify(ctx));
    else console.log('[AUDIT]', msg);
  },
};

/**
 * Default logger export used across local tooling and tests.
 *
 * NOTE: Replace with a production-grade logger in real deployments.
 */
export default logger;
