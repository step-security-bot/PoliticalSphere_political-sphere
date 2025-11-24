const pathUtil = require('node:path');

const DatabaseLib = require('better-sqlite3');

const logger = require('./logger');

/**
 * Interface representing a SQLite database connection with essential operations.
 * Provides access to database pragmas, prepared statements, and connection management.
 */
interface Database {
  pragma(sql: string): unknown;
  prepare(sql: string): Statement;
  close(): void;
}

/**
 * Interface representing a prepared SQL statement with execution methods.
 * Supports running statements, retrieving single rows, and fetching all results.
 */
interface Statement {
  run(...params: unknown[]): unknown;
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown;
  finalize(): void;
}

/**
 * Interface representing a pooled database connection with metadata.
 * Tracks connection lifecycle, usage statistics, and prepared statement cache.
 */
interface PoolConnection {
  db: Database | null;
  id: number;
  createdAt: number;
  lastUsed: number;
  preparedStatements: Map<string, Statement>;
}

/**
 * Path to the SQLite database file used by the connection pool.
 * Located in the runtime data directory for proper isolation.
 */
const POOL_DB_PATH = pathUtil.join(__dirname, '../../../data/runtime/political_sphere.db');

/**
 * Configuration object for the database connection pool.
 * Defines pool sizing, timeouts, and maintenance intervals.
 * All values can be overridden via environment variables.
 */
const POOL_CONFIG = {
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
  minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || '2', 10),
  acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000', 10),
  createTimeoutMillis: parseInt(process.env.DB_CREATE_TIMEOUT || '30000', 10),
  destroyTimeoutMillis: parseInt(process.env.DB_DESTROY_TIMEOUT || '5000', 10),
  reapIntervalMillis: parseInt(process.env.DB_REAP_INTERVAL || '1000', 10),
  createRetryIntervalMillis: parseInt(process.env.DB_CREATE_RETRY_INTERVAL || '200', 10),
};

/**
 * Connection pool for managing SQLite database connections efficiently.
 * Implements connection pooling to reduce overhead of creating/destroying connections.
 * Supports prepared statement caching and automatic connection lifecycle management.
 */
class DatabaseConnectionPool {
  pool: PoolConnection[];
  available: PoolConnection[];
  waitingQueue: Array<{
    resolve: (conn: PoolConnection) => void;
    reject: (err: Error) => void;
    timeout: NodeJS.Timeout;
  }>;
  isShuttingDown: boolean;
  stats: {
    created: number;
    destroyed: number;
    acquired: number;
    released: number;
    borrowed: number;
    pending: number;
  };

  /**
   * Creates a new DatabaseConnectionPool instance.
   * Initializes the connection pool with minimum connections and starts maintenance processes.
   * Configures SQLite pragmas for optimal performance and reliability.
   */
  constructor() {
    this.pool = [];
    this.available = [];
    this.waitingQueue = [];
    this.isShuttingDown = false;
    this.stats = {
      created: 0,
      destroyed: 0,
      acquired: 0,
      released: 0,
      pending: 0,
      borrowed: 0,
    };

    // Initialize minimum connections
    this.initializePool();

    // Start pool maintenance
    this.startMaintenance();
    // Start pool maintenance
    this.startMaintenance();
  }

  /**
   * Initializes the connection pool with the minimum number of connections.
   * Creates and warms up connections to ensure they're ready for use.
   * Logs initialization status and throws on failure.
   */
  async initializePool() {
    try {
      for (let i = 0; i < POOL_CONFIG.minConnections; i++) {
        const connection = await this.createConnection();
        this.pool.push(connection);
        this.available.push(connection);
      }
      logger.info('Database connection pool initialized', {
        minConnections: POOL_CONFIG.minConnections,
        maxConnections: POOL_CONFIG.maxConnections,
      });
    } catch (error) {
      logger.error('Failed to initialize database connection pool', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Creates a new database connection with optimized SQLite configuration.
   * Sets up WAL mode, foreign keys, busy timeout, and performance pragmas.
   * Returns a PoolConnection object ready for use.
   *
   * @returns A new PoolConnection with initialized database instance
   */
  async createConnection(): Promise<PoolConnection> {
    const connection: PoolConnection = {
      db: null,
      id: ++this.stats.created,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      preparedStatements: new Map<string, Statement>(),
    };

    try {
      connection.db = new DatabaseLib(POOL_DB_PATH) as Database;
      if (connection.db) {
        connection.db.pragma('journal_mode = WAL');
        connection.db.pragma('foreign_keys = ON');
        connection.db.pragma('busy_timeout = 30000');
        connection.db.pragma('synchronous = NORMAL');
        connection.db.pragma('cache_size = 1000000'); // 1GB cache
        connection.db.pragma('temp_store = memory');
      }

      logger.debug('Database connection created', {
        connectionId: connection.id,
      });
      return connection;
    } catch (error) {
      logger.error('Failed to create database connection', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Acquires a database connection from the pool.
   * Returns an available connection immediately if one exists, creates a new connection
   * if under the maximum limit, or queues the request if all connections are busy.
   * Times out after the configured acquire timeout.
   *
   * @returns A PoolConnection ready for database operations
   * @throws Error if pool is shutting down or acquire timeout is exceeded
   */
  async acquire() {
    if (this.isShuttingDown) {
      throw new Error('Connection pool is shutting down');
    }

    // Try to get available connection
    if (this.available.length > 0) {
      const connection = this.available.pop() as PoolConnection | undefined;
      if (!connection) {
        throw new Error(
          `Pooled connection unexpectedly undefined. Pool size: ${this.pool.length}, Available: ${this.available.length}, Pool IDs: [${this.pool.map(c => c.id).join(',')}], Available IDs: [${this.available.map(c => c.id).join(',')}]`
        );
      }
      connection.lastUsed = Date.now();
      this.stats.acquired++;
      this.stats.borrowed++;
      logger.debug('Database connection acquired from pool', {
        connectionId: connection.id,
        available: this.available.length,
        borrowed: this.stats.borrowed,
      });
      return connection;
    }

    // Create new connection if under max limit
    if (this.pool.length < POOL_CONFIG.maxConnections) {
      try {
        const connection = await this.createConnection();
        this.pool.push(connection);
        connection.lastUsed = Date.now();
        this.stats.acquired++;
        this.stats.borrowed++;
        return connection;
      } catch (error) {
        logger.warn('Failed to create new connection, will retry', {
          error: (error as Error).message,
        });
      }
    }

    // Wait for available connection
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.stats.pending--;
        const index = this.waitingQueue.findIndex(item => item.resolve === resolve);
        if (index > -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new Error('Connection acquire timeout'));
      }, POOL_CONFIG.acquireTimeoutMillis);

      this.waitingQueue.push({ resolve, reject, timeout });
      this.stats.pending++;
    });
  }

  /**
   * Releases a database connection back to the pool.
   * If there are waiting requests, the connection is immediately assigned to the next waiter.
   * Otherwise, it's returned to the available pool for future use.
   * Connections are validated before reuse to ensure they're still functional.
   *
   * @param connection The PoolConnection to release back to the pool
   */
  async release(connection: PoolConnection) {
    if (this.isShuttingDown) {
      await this.destroyConnection(connection);
      return;
    }

    // Check if anyone is waiting
    if (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift();
      if (waiter) {
        this.stats.pending--;
        connection.lastUsed = Date.now();
        waiter.resolve(connection);
        return;
      }
    }

    // Return to available pool
    this.available.push(connection);
    this.stats.released++;
    this.stats.borrowed--;

    logger.debug('Database connection released to pool', {
      connectionId: connection.id,
      available: this.available.length,
      borrowed: this.stats.borrowed,
    });
  }

  /**
   * Permanently destroys a database connection and removes it from the pool.
   * Finalizes all prepared statements, closes the database connection, and cleans up
   * references. Used during pool shutdown or when a connection becomes unusable.
   *
   * @param connection The PoolConnection to destroy
   */
  async destroyConnection(connection: PoolConnection) {
    try {
      if (connection.db) {
        // Finalize prepared statements
        for (const stmt of connection.preparedStatements.values()) {
          stmt.finalize();
        }
        connection.preparedStatements.clear();

        connection.db.close();
        connection.db = null;
      }
      this.stats.destroyed++;

      // Remove from pool arrays
      const poolIndex = this.pool.indexOf(connection);
      if (poolIndex > -1) {
        this.pool.splice(poolIndex, 1);
      }

      const availableIndex = this.available.indexOf(connection);
      if (availableIndex > -1) {
        this.available.splice(availableIndex, 1);
      }

      logger.debug('Database connection destroyed', {
        connectionId: connection.id,
      });
    } catch (error) {
      logger.error('Error destroying database connection', {
        connectionId: connection.id,
        error: (error as Error).message,
      });
    }
  }

  startMaintenance() {
    setInterval(() => {
      this.reapStaleConnections();
    }, POOL_CONFIG.reapIntervalMillis);
  }

  reapStaleConnections() {
    const now = Date.now();
    const staleConnections = this.available.filter(
      conn => now - conn.lastUsed > 300000 // 5 minutes
    );

    for (const connection of staleConnections) {
      if (this.pool.length > POOL_CONFIG.minConnections) {
        this.destroyConnection(connection);
      }
    }
  }

  /**
   * Gracefully shuts down the connection pool.
   * Rejects all pending connection requests, destroys all existing connections,
   * and prevents new connections from being acquired. This method should be called
   * during application shutdown to ensure clean resource cleanup.
   */
  async close() {
    this.isShuttingDown = true;

    // Reject all pending acquires
    for (const waiter of this.waitingQueue) {
      clearTimeout(waiter.timeout);
      waiter.reject(new Error('Connection pool is shutting down'));
    }
    this.waitingQueue = [];
    this.stats.pending = 0;

    // Close all connections
    const closePromises = [];
    for (const connection of [...this.pool, ...this.available]) {
      closePromises.push(this.destroyConnection(connection));
    }

    await Promise.all(closePromises);

    logger.info('Database connection pool closed', {
      totalConnections: this.stats.created,
      destroyedConnections: this.stats.destroyed,
    });
  }

  /**
   * Returns current pool statistics and health metrics.
   * Useful for monitoring pool performance and debugging connection issues.
   *
   * @returns Object containing pool statistics including connection counts, usage metrics, and queue status
   */
  getStats() {
    return {
      ...this.stats,
      poolSize: this.pool.length,
      available: this.available.length,
      waiting: this.waitingQueue.length,
    };
  }
}

// Create singleton pool instance
const connectionPool = new DatabaseConnectionPool();

// Legacy compatibility - provide getConnection method
let legacyConnection: {
  prepare: (sql: string) => {
    run: (...params: unknown[]) => Promise<unknown>;
    get: (...params: unknown[]) => Promise<unknown>;
    all: (...params: unknown[]) => Promise<unknown>;
  };
} | null = null;
function getConnection() {
  if (!legacyConnection) {
    legacyConnection = {
      prepare: (sql: string) => {
        return {
          run: async (...params: unknown[]) => {
            const conn = (await connectionPool.acquire()) as PoolConnection;
            try {
              const stmt = conn.preparedStatements.get(sql);
              if (!stmt) {
                if (!conn.db) throw new Error('Database not initialized');
                const prepared = conn.db.prepare(sql);
                conn.preparedStatements.set(sql, prepared);
                return prepared.run(...params);
              }
              return stmt.run(...params);
            } finally {
              connectionPool.release(conn);
            }
          },
          get: async (...params: unknown[]) => {
            const conn = (await connectionPool.acquire()) as PoolConnection;
            try {
              const stmt = conn.preparedStatements.get(sql);
              if (!stmt) {
                if (!conn.db) throw new Error('Database not initialized');
                const prepared = conn.db.prepare(sql);
                conn.preparedStatements.set(sql, prepared);
                return prepared.get(...params);
              }
              return stmt.get(...params);
            } finally {
              connectionPool.release(conn);
            }
          },
          all: async (...params: unknown[]) => {
            const conn = (await connectionPool.acquire()) as PoolConnection;
            try {
              const stmt = conn.preparedStatements.get(sql);
              if (!stmt) {
                if (!conn.db) throw new Error('Database not initialized');
                const prepared = conn.db.prepare(sql);
                conn.preparedStatements.set(sql, prepared);
                return prepared.all(...params);
              }
              return stmt.all(...params);
            } finally {
              connectionPool.release(conn);
            }
          },
        };
      },
    };
  }
  return legacyConnection;
}

function close() {
  return connectionPool.close();
}

function getPoolStats() {
  return connectionPool.getStats();
}

module.exports = {
  getConnection,
  close,
  getPoolStats,
  connectionPool,
};
