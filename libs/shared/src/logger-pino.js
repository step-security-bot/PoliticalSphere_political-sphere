/**
 * Pino-based Structured Logging for Political Sphere
 * Production-ready logging with JSON output, correlation IDs, and performance optimization
 *
 * @see Node.js Best Practice 3.1: Use structured logging (Pino)
 * @see Node.js Best Practice 3.2: Log with appropriate levels
 * @see 12-Factor App XI: Treat logs as event streams
 */

import { AsyncLocalStorage } from 'node:async_hooks';
import pino from 'pino';

// Async local storage for request context (correlation IDs)
const asyncLocalStorage = new AsyncLocalStorage();

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
function createPinoLogger(options = {}) {
  const {
    level = process.env.LOG_LEVEL || 'info',
    service = 'political-sphere',
    environment = process.env.NODE_ENV || 'development',
    prettyPrint = environment === 'development',
    destination,
  } = options;

  const pinoOptions = {
    level,
    base: {
      service,
      environment,
      pid: process.pid,
      hostname: process.env.HOSTNAME || 'unknown',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: label => ({ level: label }),
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
  const transport = prettyPrint
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
    return pino(pinoOptions, pino.transport(transport));
  }

  return pino(pinoOptions);
}

/**
 * Enhanced Logger class with correlation ID support
 */
class Logger {
  constructor(options = {}) {
    this.pino = createPinoLogger(options);
    this.service = options.service || 'political-sphere';
  }

  /**
   * Get current correlation ID from async context
   */
  #getCorrelationId() {
    const store = asyncLocalStorage.getStore();
    return store?.correlationId;
  }

  /**
   * Add correlation ID to log metadata
   */
  #enrichMeta(meta = {}) {
    const correlationId = this.#getCorrelationId();
    return correlationId ? { ...meta, correlationId } : meta;
  }

  debug(message, meta = {}) {
    this.pino.debug(this.#enrichMeta(meta), message);
  }

  info(message, meta = {}) {
    this.pino.info(this.#enrichMeta(meta), message);
  }

  warn(message, meta = {}) {
    this.pino.warn(this.#enrichMeta(meta), message);
  }

  error(message, meta = {}) {
    this.pino.error(this.#enrichMeta(meta), message);
  }

  fatal(message, meta = {}) {
    this.pino.fatal(this.#enrichMeta(meta), message);
  }

  /**
   * HTTP request logging with automatic log level selection
   */
  logRequest(req, res, duration) {
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
      ip: req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown',
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
  logSecurityEvent(details) {
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
  logError(error, context = {}) {
    const meta = {
      err: error,
      ...context,
    };

    this.pino.error(this.#enrichMeta(meta), 'Application error');
  }

  /**
   * Create child logger with additional context
   */
  child(bindings) {
    const childLogger = new Logger({ service: this.service });
    childLogger.pino = this.pino.child(bindings);
    return childLogger;
  }

  /**
   * Flush logs (for graceful shutdown)
   */
  async flush() {
    return new Promise(resolve => {
      this.pino.flush(() => resolve());
    });
  }

  /**
   * Close logger (for graceful shutdown)
   */
  close() {
    // Pino doesn't require explicit close in most cases
    // But we'll flush to ensure all logs are written
    this.flush().catch(err => {
      console.error('Failed to flush logs on close:', err);
    });
  }
}

/**
 * Singleton instance for backward compatibility
 */
let defaultLogger = null;

/**
 * Get or create default logger instance
 */
export function getLogger(options) {
  if (!defaultLogger) {
    defaultLogger = new Logger(options);
  }
  return defaultLogger;
}

/**
 * Create new logger instance
 */
export function createLogger(options) {
  return new Logger(options);
}

/**
 * Set correlation ID for current async context
 * Use this in request middleware to track requests across logs
 */
export function setCorrelationId(correlationId, callback) {
  return asyncLocalStorage.run({ correlationId }, callback);
}

/**
 * Generate correlation ID (UUID-like)
 */
export function generateCorrelationId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Express middleware to add correlation ID to requests
 */
export function correlationIdMiddleware(req, res, next) {
  const correlationId =
    req.headers['x-correlation-id'] || req.headers['x-request-id'] || generateCorrelationId();

  // Add to response headers
  res.setHeader('X-Correlation-ID', correlationId);

  // Run next middleware within correlation context
  setCorrelationId(correlationId, () => next());
}

// Export Logger class
export { Logger };
