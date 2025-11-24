// Structured logging utility for Political Sphere using Pino
// Implements best practices for production logging

import pino from 'pino';
import type { IncomingMessage, ServerResponse } from 'node:http';

export interface LoggerOptions {
  level?: string;
  service?: string;
  environment?: string;
  file?: string;
}

export interface LogMeta {
  [key: string]: unknown;
}

/**
 * Structured logger wrapper around Pino with convenience helpers for HTTP, security and error logs.
 */
export class Logger {
  private logger: pino.Logger;

  constructor(options: LoggerOptions = {}) {
    const level = options.level ?? process.env.LOG_LEVEL ?? 'info';
    const service = options.service ?? 'political-sphere';
    const environment = options.environment ?? process.env['NODE_ENV'] ?? 'development';

    const pinoConfig: pino.LoggerOptions = {
      level,
      formatters: {
        level: label => {
          return { level: label };
        },
      },
      serializers: {
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
        err: pino.stdSerializers.err,
      },
      base: {
        service,
        environment,
      },
    };

    // Add file transport if specified
    if (options.file) {
      pinoConfig.transport = {
        targets: [
          {
            target: 'pino/file',
            options: { destination: options.file },
            level,
          },
        ],
      };
    }

    this.logger = pino(pinoConfig);
  }

  debug(message: string, meta?: LogMeta): void {
    this.logger.debug(meta, message);
  }

  info(message: string, meta?: LogMeta): void {
    this.logger.info(meta, message);
  }

  warn(message: string, meta?: LogMeta): void {
    this.logger.warn(meta, message);
  }

  error(message: string, meta?: LogMeta): void {
    this.logger.error(meta, message);
  }

  fatal(message: string, meta?: LogMeta): void {
    this.logger.fatal(meta, message);
  }

  // HTTP request logging
  logRequest(req: IncomingMessage, res: ServerResponse, duration: number): void {
    const statusCode = (res as ServerResponse & { statusCode: number }).statusCode;
    const meta: LogMeta = {
      method: req.method,
      url: req.url,
      statusCode,
      duration: `${duration}ms`,
      ip: req.headers['x-forwarded-for']?.toString().split(',')[0] ?? req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    if (statusCode >= 500) {
      this.error('HTTP request failed', meta);
    } else if (statusCode >= 400) {
      this.warn('HTTP client error', meta);
    } else {
      this.info('HTTP request', meta);
    }
  }

  // Security event logging
  logSecurityEvent(event: string, details: LogMeta, req?: IncomingMessage): void {
    const meta: LogMeta = {
      event,
      ...details,
      ip: req?.headers?.['x-forwarded-for']?.toString().split(',')[0] ?? req?.socket?.remoteAddress,
      userAgent: req?.headers?.['user-agent'],
    };

    this.warn('SECURITY_EVENT', meta);
  }

  // Error logging with stack trace
  logError(error: Error, context: LogMeta = {}): void {
    this.logger.error({ err: error, ...context }, 'Application error');
  }

  close(): void {
    // Pino handles cleanup automatically
  }
}

// Singleton instance
let defaultLogger: Logger | null = null;

/**
 * Get a singleton logger instance for the application. Use for most modules to ensure consistent configuration.
 */
export function getLogger(options?: LoggerOptions): Logger {
  if (!defaultLogger) {
    defaultLogger = new Logger(options);
  }
  return defaultLogger;
}

/**
 * Create a new Logger instance. Useful for creating dedicated loggers for specific subsystems.
 */
export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options);
}
