/**
 * Type declarations for database.js module
 * Provides TypeScript support for database operations
 */

import type Database from 'better-sqlite3';

/**
 * Get database connection (singleton pattern)
 */
export function getDatabase(): Database.Database;

/**
 * Close database connection
 */
export function closeDatabase(): void;

/**
 * Execute a query returning multiple rows
 */
export function executeQuery<T = unknown>(query: string, params?: unknown[]): T[];

/**
 * Execute a single-row query
 */
export function executeQuerySingle<T = unknown>(query: string, params?: unknown[]): T | undefined;

/**
 * Execute an insert/update/delete query
 */
export function executeMutation(query: string, params?: unknown[]): Database.RunResult;

/**
 * Execute multiple queries in a transaction
 */
export function executeTransaction(
  queries: Array<{ query: string; params?: ReadonlyArray<unknown> }>
): Database.RunResult[];

/**
 * User database operations
 */
export declare const userQueries: {
  create: string;
  findByEmail: string;
  findById: string;
  updateLastLogin: string;
  incrementLoginAttempts: string;
  resetLoginAttempts: string;
  updatePassword: string;
  addPasswordHistory: string;
  checkPasswordHistory: string;
  deactivateUser: string;
  activateUser: string;
};

/**
 * Session database operations
 */
export declare const sessionQueries: {
  create: string;
  findById: string;
  updateActivity: string;
  delete: string;
  cleanupExpired: string;
  deleteUserSessions: string;
};

/**
 * Rate limiting operations
 */
export declare const rateLimitQueries: {
  check: string;
  increment: string;
  cleanup: string;
};

/**
 * Audit logging operations
 */
export declare const auditQueries: {
  log: string;
  getUserActivity: string;
  getRecentActivity: string;
};
