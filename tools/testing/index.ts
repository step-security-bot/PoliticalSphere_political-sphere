/**
 * Testing Infrastructure Index
 *
 * Central export point for all testing utilities and infrastructure.
 */

// Core testing utilities
export * from './test-utils';

// Test environment setup
export * from './test-env-setup';
export * from './global-setup';

// Database testing
export * from './testcontainers';

// API mocking
export * from './msw';

// Re-export Vitest globals for convenience
export { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
