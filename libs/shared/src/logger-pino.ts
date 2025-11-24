/**
 * Pino-based Structured Logging for Political Sphere
 * Production-ready logging with JSON output, correlation IDs, and performance optimization
 *
 * @see Node.js Best Practice 3.1: Use structured logging (Pino)
 * @see Node.js Best Practice 3.2: Log with appropriate levels
 * @see 12-Factor App XI: Treat logs as event streams
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import type { Request, Response, NextFunction } from 'express';
import pino from 'pino';
import type {
  Logger as PinoLogger,
  DestinationStream,
  LoggerOptions as PinoLoggerOptions,
  TransportSingleOptions,
} from 'pino';

// Async local storage for request context (correlation IDs)
const asyncLocalStorage = new AsyncLocalStorage<{ correlationId?: string }>();

/**
 * Log level mapping for backward compatibility
 */
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal',
};

/**
 * Create Pino logger instance with production-ready configuration
 */
interface LoggerOptions {
  level?: string;
  service?: string;
  environment?: string;
  prettyPrint?: boolean;
  destination?: string | DestinationStream;
}

function createPinoLogger(options: LoggerOptions = {}): PinoLogger {
  const {
    level = process.env.LOG_LEVEL || 'info',
    service = 'political-sphere',
    environment = process.env.NODE_ENV || 'development',
    prettyPrint = environment === 'development',
    destination,
  } = options;

  const pinoOptions: PinoLoggerOptions = {
    level,
    base: {
      service,
      environment,
      pid: process.pid,
      hostname: process.env.HOSTNAME || 'unknown',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label: number | string) => ({ level: String(label) }),
    },
    // Redact sensitive fields
    redact: {
      paths: [
        'password',
        'authorization',
        'cookie',
        'accessToken',
        'refreshToken',
        'secret',
        'apiKey',
        'token',
        '*.password',
        '*.authorization',
        '*.token',
      ],
      remove: true,
    },
    // Custom serializers for common objects
    serializers: {
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
      err: pino.stdSerializers.err,
    },
  };

  // Pretty printing for development
  const transport: TransportSingleOptions<Record<string, unknown>> | undefined = prettyPrint
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined;

  // Create logger with optional file destination
  if (destination) {
    return pino(pinoOptions, pino.destination(destination));
  }

  if (transport) {
    return pino(pinoOptions, pino.transport(transport as any));
  }

  return pino(pinoOptions);
}

/**
 * Enhanced Logger class with correlation ID support
 */
class Logger {
  pino: PinoLogger;
  service: string;

  constructor(options: LoggerOptions = {}) {
    this.pino = createPinoLogger(options);
    this.service = options.service || 'political-sphere';
  }

  /**
   * Get current correlation ID from async context
   */
  #getCorrelationId(): string | undefined {
    const store = asyncLocalStorage.getStore();
    return store?.correlationId;
  }

  /**
   * Add correlation ID to log metadata
   */
  #enrichMeta(meta: Record<string, unknown> = {}): Record<string, unknown> {
    const correlationId = this.#getCorrelationId();
    return correlationId ? { ...meta, correlationId } : meta;
  }

  debug(message: string | Record<string, unknown>, meta: Record<string, unknown> = {}): void {
    if (typeof message === 'string') {
      this.pino.debug(this.#enrichMeta(meta), message);
    } else {
      this.pino.debug(this.#enrichMeta(meta), JSON.stringify(message));
    }
  }

  info(message: string | Record<string, unknown>, meta: Record<string, unknown> = {}): void {
    if (typeof message === 'string') {
      this.pino.info(this.#enrichMeta(meta), message);
    } else {
      this.pino.info(this.#enrichMeta(meta), JSON.stringify(message));
    }
  }

  warn(message: string | Record<string, unknown>, meta: Record<string, unknown> = {}): void {
    if (typeof message === 'string') {
      this.pino.warn(this.#enrichMeta(meta), message);
    } else {
      this.pino.warn(this.#enrichMeta(meta), JSON.stringify(message));
    }
  }

  error(message: string | Record<string, unknown>, meta: Record<string, unknown> = {}): void {
    if (typeof message === 'string') {
      this.pino.error(this.#enrichMeta(meta), message);
    } else {
      this.pino.error(this.#enrichMeta(meta), JSON.stringify(message));
    }
  }

  fatal(message: string | Record<string, unknown>, meta: Record<string, unknown> = {}): void {
    if (typeof message === 'string') {
      this.pino.fatal(this.#enrichMeta(meta), message);
    } else {
      this.pino.fatal(this.#enrichMeta(meta), JSON.stringify(message));
    }
  }

  /**
   * HTTP request logging with automatic log level selection
   */
  logRequest(
    req: {
      method: string;
      url: string;
      headers: Record<string, string | string[] | undefined>;
      socket?: { remoteAddress?: string };
    },
    res: { statusCode: number },
    duration: number
  ): void {
    const xff = Array.isArray(req.headers['x-forwarded-for'])
      ? req.headers['x-forwarded-for'][0]
      : req.headers['x-forwarded-for'];
    const ip = xff?.split(',')[0] || req.socket?.remoteAddress || 'unknown';

    const meta = {
      req: {
        method: req.method,
        url: req.url,
        headers: {
          'user-agent': req.headers['user-agent'],
        },
      },
      res: {
        statusCode: res.statusCode,
      },
      duration,
      ip,
    };

    const enrichedMeta = this.#enrichMeta(meta);

    if (res.statusCode >= 500) {
      this.pino.error(enrichedMeta, 'HTTP request failed');
    } else if (res.statusCode >= 400) {
      this.pino.warn(enrichedMeta, 'HTTP client error');
    } else {
      this.pino.info(enrichedMeta, 'HTTP request');
    }
  }

  /**
   * Security event logging
   */
  logSecurityEvent(details: {
    event: string;
    reason?: string;
    ip?: string;
    userAgent?: string;
    [key: string]: unknown;
  }): void {
    const meta = {
      securityEvent: details.event,
      reason: details.reason,
      ip: details.ip || 'unknown',
      userAgent: details.userAgent,
      ...details,
    };

    this.pino.warn(this.#enrichMeta(meta), 'SECURITY_EVENT');
  }

  /**
   * Error logging with stack trace
   */
  logError(error: unknown, context: Record<string, unknown> = {}): void {
    const meta = {
      err: error,
      ...context,
    };

    this.pino.error(this.#enrichMeta(meta), 'Application error');
  }

  /**
   * Create child logger with additional context
   */
  child(bindings: Record<string, unknown>): Logger {
    const childLogger = new Logger({ service: this.service });
    childLogger.pino = this.pino.child(bindings);
    return childLogger;
  }

  /**
   * Flush logs (for graceful shutdown)
   */
  async flush(): Promise<void> {
    return new Promise<void>(resolve => {
      // pino.flush may accept a callback with (err?: Error)
      (this.pino as unknown as { flush?: (cb: () => void) => void }).flush?.(() => resolve());
    });
  }

  /**
   * Close logger (for graceful shutdown)
   */
  close() {
    // Pino doesn't require explicit close in most cases
    // But we'll flush to ensure all logs are written
    this.flush().catch(err => {
      // Use pino's logger for errors instead of console to satisfy linting rules
      try {
        this.pino.error({ err }, 'Failed to flush logs on close');
      } catch {
        // As a last resort, fallback to console if pino is unavailable
        // Note: console is intentionally used only as a fallback path
        // eslint-disable-next-line no-console
        console.error('Failed to flush logs on close (fallback):', err);
      }
    });
  }
}

/**
 * Singleton instance for backward compatibility
 */
let defaultLogger: Logger | null = null;

/**
 * Get or create default logger instance
 */
export function getLogger(options?: LoggerOptions): Logger {
  if (!defaultLogger) {
    defaultLogger = new Logger(options);
  }
  return defaultLogger as Logger;
}

/**
 * Create new logger instance
 */
export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options);
}

/**
 * Set correlation ID for current async context
 * Use this in request middleware to track requests across logs
 */
export function setCorrelationId(
  correlationId: string,
  callback: (...args: unknown[]) => unknown
): unknown {
  return asyncLocalStorage.run({ correlationId }, callback);
}

/**
 * Generate correlation ID (UUID-like)
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Express middleware to add correlation ID to requests
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId =
    (req.headers['x-correlation-id'] as string | undefined) ||
    (req.headers['x-request-id'] as string | undefined) ||
    generateCorrelationId();

  // Add to response headers
  res.setHeader('X-Correlation-ID', correlationId);

  // Run next middleware within correlation context
  setCorrelationId(correlationId, () => next());
}

// Export Logger class
export { Logger };
