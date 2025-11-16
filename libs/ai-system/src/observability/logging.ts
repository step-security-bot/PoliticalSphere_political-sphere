/**
 * Structured Logging
 *
 * JSON-formatted logs with correlation IDs.
 *
 * @module observability/logging
 */

/**
 * Log level
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Structured log entry
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  traceId?: string;
  spanId?: string;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

/**
 * Structured Logger
 */
export class StructuredLogger {
  private serviceName: string;

  constructor(serviceName: string = 'ai-system') {
    this.serviceName = serviceName;
  }

  /**
   * Log message
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        service: this.serviceName,
        ...context,
      },
      traceId: context?.traceId as string,
      spanId: context?.spanId as string,
    };

    // In production, export to Loki or Elasticsearch
    console[level === 'fatal' ? 'error' : level](JSON.stringify(entry));
  }

  /**
   * Debug log
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  /**
   * Info log
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  /**
   * Warning log
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  /**
   * Error log
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, {
      ...context,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            code: (error as Error & { code?: string }).code,
          }
        : undefined,
    });
  }

  /**
   * Fatal log (for critical errors)
   */
  fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('fatal', message, {
      ...context,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            code: (error as Error & { code?: string }).code,
          }
        : undefined,
    });
  }
}

/**
 * Global logger instance
 */
export const logger = new StructuredLogger();
