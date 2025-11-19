/**
 * Centralized Test Environment Setup
 *
 * Initializes all required environment variables for test execution.
 * Replaces scattered initialization in scripts/test-setup.ts, tools/config/jest.env.js, etc.
 *
 * Usage: Import at the top of test files or in Vitest/Jest setup configuration.
 */

import { randomBytes } from 'node:crypto';

// Generate consistent test secrets FIRST (minimum 32 characters as enforced by auth modules)
// These MUST be set before any modules that validate them are imported
process.env.JWT_SECRET =
  process.env.JWT_SECRET || `test-jwt-secret-${randomBytes(32).toString('hex')}`;

process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || `test-refresh-secret-${randomBytes(32).toString('hex')}`;

// Ensure test secrets are different (required by auth.service.ts validation)
if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
  process.env.JWT_REFRESH_SECRET = `test-refresh-${randomBytes(32).toString('hex')}`;
}

// Token expiry defaults for tests
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Database configuration for tests
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

// Disable external service calls in tests
process.env.DISABLE_EXTERNAL_SERVICES = 'true';

// Export for programmatic access if needed
export const testEnv = {
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
};

// Import jest-dom matchers for DOM testing (at the end, after env setup)
// Note: Using dynamic import without await - matchers will be available but import is non-blocking
// This prevents setup file from hanging on async operations
import('@testing-library/jest-dom/vitest').catch(() => {
  // Silently ignore if not available (for non-DOM test environments)
});
