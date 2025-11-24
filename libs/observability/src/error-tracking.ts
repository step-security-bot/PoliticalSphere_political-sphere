/**
 * Error Tracking and Reporting
 *
 * Basic error tracking interface that can be extended with specific providers
 * like Sentry, Rollbar, or Bugsnag.
 */

/* eslint-disable no-console */

import type { ErrorTrackingConfig } from './types.js';

interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  component?: string;
  operation?: string;
  [key: string]: unknown; // Avoid any; arbitrary metadata keys
}

class ErrorTracker {
  private config: Required<ErrorTrackingConfig>;
  private initialized = false;
  private errorBuffer: Array<{ error: Error; context?: ErrorContext; timestamp: Date }> = [];
  // biome-ignore lint/suspicious/noExplicitAny: Sentry types are complex and optional
  private sentry: any = null;

  constructor(config: ErrorTrackingConfig = {}) {
    this.config = {
      dsn: config.dsn || process.env.SENTRY_DSN || '',
      environment: config.environment || process.env.NODE_ENV || 'development',
      release: config.release || process.env.RELEASE_VERSION || '',
      sampleRate: config.sampleRate || 1.0,
    };
  }

  /**
   * Initialize error tracking
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    if (!this.config.dsn) {
      console.warn('Error tracking DSN not configured, using console logging');
      this.initialized = true;
      return;
    }

    try {
      // Try to initialize Sentry if available
      const Sentry = await import('@sentry/node').catch(() => null);
      if (Sentry) {
        Sentry.init({
          dsn: this.config.dsn,
          environment: this.config.environment,
          release: this.config.release,
          sampleRate: this.config.sampleRate,
          // biome-ignore lint/suspicious/noExplicitAny: Cast to satisfy Sentry callback type
          beforeSend: (event, _hint) => this.sanitizeEvent(event) as any,
        });
        console.log('✅ Sentry error tracking initialized');
      } else {
        console.warn('Sentry not available, using console logging for errors');
      }
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize error tracking, using console logging:', error);
      this.initialized = true; // Still mark as initialized to use console fallback
    }
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: ErrorContext): void {
    if (!this.initialized) {
      // Buffer errors until initialized
      this.errorBuffer.push({ error, ...(context && { context }), timestamp: new Date() });
      return;
    }

    // Process buffered errors first
    if (this.errorBuffer.length > 0) {
      this.errorBuffer.forEach(({ error: bufferedError, context: bufferedContext }) => {
        this.processError(bufferedError, bufferedContext);
      });
      this.errorBuffer = [];
    }

    this.processError(error, context);
  }

  /**
   * Capture a message
   */
  captureMessage(
    message: string,
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
    context?: ErrorContext
  ): void {
    if (!this.initialized) return;

    try {
      const Sentry = this.getSentry();
      if (Sentry) {
        Sentry.withScope(
          (scope: {
            setLevel: (level: string) => void;
            setTag: (key: string, value: unknown) => void;
          }) => {
            scope.setLevel(level);
            if (context) {
              Object.keys(context).forEach(key => {
                scope.setTag(key, context[key]);
              });
            }
            Sentry.captureMessage(message);
          }
        );
      } else {
        console.error(`[${level.toUpperCase()}] ${message}`, context);
      }
    } catch (err) {
      console.error('Failed to capture message:', err);
    }
  }

  /**
   * Set user context
   */
  setUser(user: { id?: string; email?: string; username?: string }): void {
    if (!this.initialized) return;

    try {
      const Sentry = this.getSentry();
      if (Sentry) {
        Sentry.setUser(user);
      }
    } catch (err) {
      console.error('Failed to set user context:', err);
    }
  }

  /**
   * Set extra context
   */
  setExtra(key: string, value: unknown): void {
    if (!this.initialized) return;

    try {
      const Sentry = this.getSentry();
      if (Sentry) {
        Sentry.setExtra(key, value);
      }
    } catch (err) {
      console.error('Failed to set extra context:', err);
    }
  }

  /**
   * Set tag
   */
  setTag(key: string, value: string): void {
    if (!this.initialized) return;

    try {
      const Sentry = this.getSentry();
      if (Sentry) {
        Sentry.setTag(key, value);
      }
    } catch (err) {
      console.error('Failed to set tag:', err);
    }
  }

  /**
   * Check if error tracking is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get Sentry instance if available
   */
  // biome-ignore lint/suspicious/noExplicitAny: Sentry types are optional; use any for flexibility
  private getSentry(): any {
    return this.sentry;
  }

  /**
   * Process an error through available tracking mechanisms
   */
  private processError(error: Error, context?: ErrorContext): void {
    try {
      const Sentry = this.getSentry();
      if (Sentry) {
        Sentry.withScope((scope: { setTag: (key: string, value: unknown) => void }) => {
          if (context) {
            Object.keys(context).forEach(key => {
              scope.setTag(key, context[key]);
            });
          }
          Sentry.captureException(error);
        });
      } else {
        console.error('Error captured:', error.message, {
          stack: error.stack,
          context,
        });
      }
    } catch (err) {
      console.error('Failed to process error:', err);
    }
  }

  /**
   * Sanitize sensitive data from error events
   */
  // Event shape depends on provider; use unknown and narrow where possible
  private sanitizeEvent(event: unknown): unknown {
    if (!event || typeof event !== 'object') return event;
    const evt = event as {
      breadcrumbs?: Array<{ data?: Record<string, unknown> }>;
      exception?: {
        values?: Array<{ stacktrace?: { frames?: Array<{ vars?: Record<string, unknown> }> } }>;
      };
    };
    // Basic sanitization - remove sensitive data from breadcrumbs and exception data
    if (evt.breadcrumbs) {
      evt.breadcrumbs.forEach(breadcrumb => {
        if (breadcrumb.data) {
          this.sanitizeObject(breadcrumb.data);
        }
      });
    }
    if (evt.exception?.values) {
      evt.exception.values.forEach(exception => {
        const frames = exception.stacktrace?.frames;
        if (frames) {
          frames.forEach(frame => {
            if (frame.vars) {
              this.sanitizeObject(frame.vars);
            }
          });
        }
      });
    }
    return evt;
  }

  /**
   * Sanitize an object by removing sensitive keys
   */
  private sanitizeObject(obj: unknown): void {
    if (!obj || typeof obj !== 'object') return;
    const o = obj as Record<string, unknown>;
    Object.keys(o).forEach(key => {
      if (this.isSensitiveKey(key)) {
        o[key] = '[REDACTED]';
      } else if (typeof o[key] === 'object') {
        this.sanitizeObject(o[key]);
      }
    });
  }

  /**
   * Check if a key contains sensitive information
   */
  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'key',
      'api_key',
      'apikey',
      'authorization',
      'auth',
      'session',
      'cookie',
      'credit_card',
      'ssn',
      'social_security',
    ];

    return sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey));
  }
}

// Singleton instance
let errorTrackerInstance: ErrorTracker | null = null;

/**
 * Get error tracker instance
 */
export function getErrorTracker(config?: ErrorTrackingConfig): ErrorTracker {
  if (!errorTrackerInstance) {
    errorTrackerInstance = new ErrorTracker(config);
  }
  return errorTrackerInstance;
}

/**
 * Initialize error tracking
 */
export async function initializeErrorTracking(config?: ErrorTrackingConfig): Promise<ErrorTracker> {
  const tracker = getErrorTracker(config);
  await tracker.initialize();
  return tracker;
}

export { ErrorTracker };
export type { ErrorContext };
export default getErrorTracker;
