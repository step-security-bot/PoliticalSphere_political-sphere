/**
 * Graceful Shutdown Middleware
 *
 * Implements 12-Factor App Factor IX: Disposability
 * Ensures fast startup and graceful shutdown for optimal resilience
 *
 * Based on Node.js Best Practice 2.6: Graceful shutdown
 *
 * Features:
 * - Stops accepting new connections
 * - Completes in-flight requests
 * - Closes database connections
 * - Flushes logs and metrics
 * - Forces shutdown after timeout to prevent hang
 *
 * Usage:
 * ```typescript
 * import { setupGracefulShutdown } from '@political-sphere/shared';
 *
 * const server = http.createServer(app);
 * const cleanup = setupGracefulShutdown(server, {
 *   onShutdown: async () => {
 *     await db.close();
 *     await cache.disconnect();
 *   }
 * });
 * ```
 */

import type { Server } from 'node:http';

export interface GracefulShutdownOptions {
  /**
   * Timeout in milliseconds before forcing shutdown
   * @default 10000 (10 seconds)
   */
  timeout?: number;

  /**
   * Async cleanup function to run before shutdown
   */
  onShutdown?: () => Promise<void>;

  /**
   * Logger function for shutdown events
   */
  logger?: {
    info: (message: string, meta?: Record<string, unknown>) => void;
    warn: (message: string, meta?: Record<string, unknown>) => void;
    error: (message: string, meta?: Record<string, unknown>) => void;
  };

  /**
   * Signals to listen for
   * @default ['SIGTERM', 'SIGINT']
   */
  signals?: NodeJS.Signals[];
}

/**
 * Setup graceful shutdown handlers for an HTTP server
 *
 * @param server - HTTP server instance
 * @param options - Shutdown configuration options
 * @returns Cleanup function to remove signal handlers
 */
export function setupGracefulShutdown(
  server: Server,
  options: GracefulShutdownOptions = {}
): () => void {
  const {
    timeout = 10000,
    onShutdown,
    logger = console,
    signals = ['SIGTERM', 'SIGINT'],
  } = options;

  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) {
      logger.warn('Shutdown already in progress, ignoring signal', { signal });
      return;
    }

    isShuttingDown = true;
    logger.info('Received shutdown signal, starting graceful shutdown', { signal });

    // Setup forced shutdown timeout
    const forceShutdownTimer = setTimeout(() => {
      logger.error('Graceful shutdown timeout exceeded, forcing exit', {
        timeout,
        signal,
      });
      process.exit(1);
    }, timeout);

    // Prevent the timeout from keeping the process alive
    forceShutdownTimer.unref();

    try {
      // Stop accepting new connections
      await new Promise<void>((resolve, reject) => {
        server.close(err => {
          if (err) {
            logger.error('Error closing HTTP server', { error: err.message });
            reject(err);
          } else {
            logger.info('HTTP server closed, no longer accepting connections');
            resolve();
          }
        });
      });

      // Run custom cleanup logic
      if (onShutdown) {
        logger.info('Running custom shutdown handlers');
        await onShutdown();
        logger.info('Custom shutdown handlers completed');
      }

      clearTimeout(forceShutdownTimer);
      logger.info('Graceful shutdown completed successfully');
      process.exit(0);
    } catch (error) {
      clearTimeout(forceShutdownTimer);
      logger.error('Error during graceful shutdown', {
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    }
  };

  // Register signal handlers
  const handlers = new Map<NodeJS.Signals, () => void>();

  for (const signal of signals) {
    const handler = () => shutdown(signal);
    handlers.set(signal, handler);
    process.on(signal, handler);
  }

  // Return cleanup function
  return () => {
    for (const [signal, handler] of handlers.entries()) {
      process.off(signal, handler);
    }
    handlers.clear();
  };
}

/**
 * Wrapper for async operations with graceful degradation
 *
 * Ensures operations complete or timeout gracefully during shutdown
 */
export async function withGracefulTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  fallback: T
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
}

/**
 * Track active connections for graceful shutdown
 */
export class ConnectionTracker {
  private activeConnections = new Set<string>();
  private connectionCounter = 0;

  /**
   * Register a new connection
   * @returns Connection ID for tracking
   */
  register(): string {
    const id = `conn-${++this.connectionCounter}-${Date.now()}`;
    this.activeConnections.add(id);
    return id;
  }

  /**
   * Unregister a completed connection
   */
  unregister(id: string): void {
    this.activeConnections.delete(id);
  }

  /**
   * Get count of active connections
   */
  get count(): number {
    return this.activeConnections.size;
  }

  /**
   * Wait for all connections to complete (with timeout)
   */
  async waitForCompletion(timeoutMs: number): Promise<boolean> {
    const startTime = Date.now();

    while (this.activeConnections.size > 0) {
      if (Date.now() - startTime > timeoutMs) {
        return false; // Timeout
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return true; // All connections completed
  }

  /**
   * Get list of active connection IDs
   */
  getActiveConnections(): string[] {
    return Array.from(this.activeConnections);
  }
}
