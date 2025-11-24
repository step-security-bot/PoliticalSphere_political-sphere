/**
 * Enhanced Logging System
 *
 * Structured logging with aggregation capabilities and log shipping support.
 */

import winston from 'winston';
import type { LoggingConfig } from './types.js';

interface RequestLike {
  method: string;
  url: string;
  get(header: string): string | undefined;
  ip?: string;
  connection?: { remoteAddress?: string };
}

interface ResponseLike {
  statusCode: number;
}

class Logger {
  private logger: winston.Logger;
  private config: Required<LoggingConfig>;

  constructor(config: LoggingConfig = {}) {
    this.config = {
      level: config.level || process.env.LOG_LEVEL || 'info',
      format: config.format || 'json',
      transports: config.transports || [
        {
          type: 'console',
          options: {
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.errors({ stack: true }),
              winston.format.json()
            ),
          },
        },
      ],
    };

    this.logger = this.createLogger();
  }

  /**
   * Create the Winston logger instance
   */
  private createLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    this.config.transports.forEach(transportConfig => {
      switch (transportConfig.type) {
        case 'console':
          transports.push(
            new winston.transports.Console({
              level: this.config.level,
              format:
                (transportConfig.options?.format as winston.Logform.Format) ||
                this.getDefaultFormat(),
            })
          );
          break;
        case 'file':
          transports.push(
            new winston.transports.File({
              level: this.config.level,
              filename: (transportConfig.options?.filename as string) || 'app.log',
              format:
                (transportConfig.options?.format as winston.Logform.Format) ||
                this.getDefaultFormat(),
            })
          );
          break;
        case 'http':
          transports.push(
            new winston.transports.Http({
              level: this.config.level,
              host: (transportConfig.options?.host as string) || 'localhost',
              port: (transportConfig.options?.port as number) || 8080,
              path: (transportConfig.options?.path as string) || '/logs',
              format: winston.format.json(),
            })
          );
          break;
      }
    });

    return winston.createLogger({
      level: this.config.level,
      format: this.getDefaultFormat(),
      defaultMeta: { service: 'political-sphere-api' },
      transports,
    });
  }

  /**
   * Get default log format
   */
  private getDefaultFormat(): winston.Logform.Format {
    if (this.config.format === 'simple') {
      return winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        winston.format.simple()
      );
    }

    return winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );
  }

  /**
   * Log an info message
   */
  info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    const logData = { ...meta };
    if (error) {
      logData.error = {
        message: error.message,
        stack: error.stack,
        name: error.name,
      };
    }
    this.logger.error(message, logData);
  }

  /**
   * Log a warning message
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  /**
   * Log a debug message
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  /**
   * Log an HTTP request
   */
  logRequest(
    req: RequestLike,
    res: ResponseLike,
    responseTime: number,
    meta?: Record<string, unknown>
  ): void {
    const logData: Record<string, unknown> = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip || req.connection?.remoteAddress,
      ...meta,
    };
    this.logger.info('HTTP Request', logData);
  }

  /**
   * Log a database operation
   */
  logDatabase(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    meta?: Record<string, unknown>
  ): void {
    const logData = {
      operation,
      table,
      duration,
      success,
      ...meta,
    };

    if (success) {
      this.logger.debug('Database Operation', logData);
    } else {
      this.logger.error('Database Operation Failed', logData);
    }
  }

  /**
   * Log a business logic operation
   */
  logBusinessLogic(
    operation: string,
    userId?: string,
    duration?: number,
    success: boolean = true,
    meta?: Record<string, unknown>
  ): void {
    const logData = {
      operation,
      userId,
      duration,
      success,
      ...meta,
    };

    if (success) {
      this.logger.info('Business Logic', logData);
    } else {
      this.logger.error('Business Logic Failed', logData);
    }
  }

  /**
   * Log security events
   */
  logSecurity(event: string, userId?: string, ip?: string, meta?: Record<string, unknown>): void {
    const logData = {
      event,
      userId,
      ip,
      ...meta,
    };

    this.logger.info('Security Event', logData);
  }

  /**
   * Add a custom transport
   */
  addTransport(transport: winston.transport): void {
    this.logger.add(transport);
  }

  /**
   * Remove all transports
   */
  clearTransports(): void {
    this.logger.clear();
  }

  /**
   * Get the underlying Winston logger
   */
  getWinstonLogger(): winston.Logger {
    return this.logger;
  }
}

// Singleton instance
let loggerInstance: Logger | null = null;

/**
 * Get logger instance
 */
export function getLogger(config?: LoggingConfig): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger(config);
  }
  return loggerInstance;
}

/**
 * Initialize logging system
 */
export function initializeLogging(config?: LoggingConfig): Logger {
  return getLogger(config);
}

export { Logger };
export default getLogger;
