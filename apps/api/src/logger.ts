import winston, { type Logger as WinstonLogger } from 'winston';

/**
 * ApiLogger - type alias for the Winston Logger used in the API
 *
 * Keeping a local type alias helps document and expose the logger type
 * in Compodoc so that the overall docs coverage can include it.
 */
/**
 * ApiLogger - Logging API used by services in the API
 *
 * This local interface documents the common subset of Winston's Logger API
 * used throughout the application and helps Compodoc report documentation
 * coverage for the logging API.
 */
/**
 * Logger - documented logging interface for the API
 *
 * This interface represents the subset of logging methods used across
 * the codebase and is intentionally small to make documentation coverage
 * straightforward for Compodoc.
 */
/**
 * Logger - documented logging interface for the API.
 *
 * Describes the minimal logging surface used across services (info, debug,
 * warn, error, audit).
 */
export interface Logger {
  /** Emit an info-level log message */
  info(message: string, meta?: unknown): void;
  /** Emit a debug-level log message */
  debug(message: string, meta?: unknown): void;
  /** Emit a warning */
  warn(message: string, meta?: unknown): void;
  /** Emit an error */
  error(message: string | Error, meta?: unknown): void;
  /** Emit an audit log with structured metadata */
  audit?(message: string, meta?: unknown): void;
}

/**
 * ApiLogger - legacy alias kept for compatibility with some modules
 * (re-exports the documented `Logger` interface).
 */
export type ApiLogger = Logger;

// Keep the external Winston type available but document the local Logger
/**
 * WinstonLoggerType - alias for the external Winston `Logger` type used
 * by the implementation but exposed with a local name for documentation.
 */
export type WinstonLoggerType = WinstonLogger;

/**
 * Logger - configured Winston logger for the API app
 *
 * The logger is preconfigured as JSON with timestamps and an optional
 * file transport for production environments (configured using LOG_FILE).
 */
// Create and export logger instance
/**
 * Configured logger instance for the API.
 *
 * Structured JSON output with timestamps is used by default. Use this
 * `logger` export for application logging and structured audit logs.
 */
export const logger: ApiLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
  ],
});

// Add file transport if LOG_FILE is specified
if (process.env.LOG_FILE) {
  // Cast to the underlying Winston logger when adding a transport since
  // the local documented `ApiLogger` interface does not include `add`.
  (logger as unknown as WinstonLogger).add(
    new winston.transports.File({
      filename: process.env.LOG_FILE,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    })
  );
}

/**
 * Default export for convenience. Prefer importing the named `logger`
 * when relying on typings (`import { logger } from './logger'`).
 */
export default logger;
