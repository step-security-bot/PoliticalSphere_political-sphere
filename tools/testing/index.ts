/**
 * Testing Infrastructure Index
 *
 * Central export point for all testing utilities and infrastructure.
 */

// Core testing utilities
export * from './test-utils.js';

// Test environment setup
export * from './test-env-setup.js';
export * from './global-setup.js';

// Database testing
export * from './testcontainers.js';

// API mocking
export * from './msw/index.ts';

// Re-export Vitest globals for convenience
export { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
