#!/usr/bin/env node

/**
 * DEPRECATED: tools/tests/ui-visual-testing.js
 *
 * This legacy simulation has been replaced by a Playwright-backed runner.
 * Please use: `npm run test:visual`
 */

console.log('⚠️  Deprecated: use `npm run test:visual` (Playwright)');
await import('./run-visual-regression.mjs');
