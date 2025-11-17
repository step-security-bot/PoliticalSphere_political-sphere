/**
 * Type definitions for Pino-based logger
 * Provides TypeScript support for the logger-pino.js implementation
 */

import type { NextFunction, Request, Response } from 'express';
import type { Logger as PinoLogger } from 'pino';

/**
 * Log level constants for backward compatibility
 */
export const LOG_LEVELS: {
  readonly DEBUG: 'debug';
  readonly INFO: 'info';
  readonly WARN: 'warn';
  readonly ERROR: 'error';
  readonly FATAL: 'fatal';
};

/**
 * Logger configuration options
 */
export interface LoggerOptions {
  /** Log level (debug, info, warn, error, fatal) */
  level?: string;
  /** Service name for log metadata */
  service?: string;
  /** Environment (development, staging, production) */
  environment?: string;
  /** Enable pretty printing for development */
  prettyPrint?: boolean;
}

/**
 * HTTP request metadata for logging
 */
export interface RequestMetadata {
  method: string;
  url: string;
  headers?: Record<string, string | string[] | undefined>;
}

/**
 * HTTP response metadata for logging
 */
export interface ResponseMetadata {
  statusCode?: number;
}

/**
 * Security event details
 */
export interface SecurityEventDetails {
  event: string;
  reason?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: unknown;
}

/**
 * Structured logger class wrapping Pino
 */
export class Logger {
  /** Underlying Pino logger instance */
  readonly pino: PinoLogger;

  constructor(options?: LoggerOptions);

  /**
   * Log debug message
   */
  debug(message: string, metadata?: Record<string, unknown>): void;

  /**
   * Log info message
   */
  info(message: string, metadata?: Record<string, unknown>): void;

  /**
   * Log warning message
   */
  warn(message: string, metadata?: Record<string, unknown>): void;

  /**
   * Log error message
   */
  error(message: string, metadata?: Record<string, unknown>): void;

  /**
   * Log fatal error message
   */
  fatal(message: string, metadata?: Record<string, unknown>): void;

  /**
   * Log HTTP request with automatic level selection
   * - 200-399: info
   * - 400-499: warn
   * - 500+: error
   */
  logRequest(
    req: RequestMetadata,
    res: ResponseMetadata,
    duration: number,
    metadata?: Record<string, unknown>
  ): void;

  /**
   * Log security-related events
   */
  logSecurityEvent(details: SecurityEventDetails): void;

  /**
   * Log error with stack trace
   */
  logError(error: Error, context?: Record<string, unknown>, message?: string): void;

  /**
   * Create child logger with persistent bindings
   */
  child(bindings: Record<string, unknown>): Logger;

  /**
   * Flush all buffered logs (for graceful shutdown)
   */
  flush(): Promise<void>;

  /**
   * Close logger and release resources
   */
  close(): void;
}

/**
 * Create new logger instance
 */
export function createLogger(options?: LoggerOptions): Logger;

/**
 * Get singleton logger instance (creates one if not exists)
 */
export function getLogger(options?: LoggerOptions): Logger;

/**
 * Set correlation ID for current async context
 * Use this in request middleware to track requests across logs
 */
export function setCorrelationId(correlationId: string, callback: () => void): void;

/**
 * Generate correlation ID (UUID-like format)
 */
export function generateCorrelationId(): string;

/**
 * Express middleware to add correlation ID to requests
 * Reads from X-Correlation-ID or X-Request-ID headers, generates new if missing
 * Sets X-Correlation-ID response header
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void;
