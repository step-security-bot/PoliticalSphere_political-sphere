/**
 * Global Test Setup for Vitest
 *
 * Handles global test environment initialization and cleanup.
 * This runs once before all tests and once after all tests.
 */

import { beforeAll, afterAll } from 'vitest';

// Global setup - runs once before all test suites
export async function setup() {
  // Initialize global test environment
  console.log('🚀 Initializing global test environment...');

  // Set up any global test infrastructure here
  // This could include:
  // - Starting test databases
  // - Setting up mock servers
  // - Initializing test caches
  // - Setting global environment variables

  console.log('✅ Global test environment initialized');
}

// Global teardown - runs once after all test suites
export async function teardown() {
  console.log('🧹 Cleaning up global test environment...');

  // Clean up global test infrastructure
  // This could include:
  // - Stopping test databases
  // - Cleaning up mock servers
  // - Clearing test caches
  // - Resetting global state

  console.log('✅ Global test environment cleaned up');
}

// Export for Vitest globalSetup
export default async function globalSetup() {
  await setup();
  return teardown;
}
