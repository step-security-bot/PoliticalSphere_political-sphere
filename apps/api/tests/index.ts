/**
 * Test utilities index - Re-exports database utilities for route tests
 *
 * This file provides a convenient import path for test files to access
 * database setup and teardown utilities without needing to know the
 * exact source location.
 */

export { getDatabase, closeDatabase } from '../src/stores/index.ts';
