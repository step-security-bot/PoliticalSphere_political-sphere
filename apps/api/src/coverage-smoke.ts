// Smoke test for coverage - simple module that can be imported

/**
 * Lightweight smoke utility used by tests and the docs pipeline.
 *
 * The function is intentionally tiny and used to ensure simple imports exercise
 * the module during coverage and docs generation.
 */
export function smoke() {
  return 42;
}

/**
 * Module version used for quick sanity checks in test harnesses.
 */
export const version = '1.0.0';

/**
 * Simple boolean used by smoke tests to indicate the module loaded correctly.
 */
export const isWorking = true;
