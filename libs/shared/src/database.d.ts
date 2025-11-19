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
export function executeQuery<T = any>(query: string, params?: any[]): T[];

/**
 * Execute a single-row query
 */
export function executeQuerySingle<T = any>(query: string, params?: any[]): T | undefined;

/**
 * Execute an insert/update/delete query
 */
export function executeMutation(
  query: string,
  params?: any[]
): Database.RunResult;

/**
 * Execute multiple queries in a transaction
 */
export function executeTransaction(
  queries: Array<{ query: string; params?: any[] }>
): Database.RunResult[];

/**
 * User database operations
 */
export const userQueries: {
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
export const sessionQueries: {
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
export const rateLimitQueries: {
  check: string;
  increment: string;
  cleanup: string;
};

/**
 * Audit logging operations
 */
export const auditQueries: {
  log: string;
  getUserActivity: string;
  getRecentActivity: string;
};
