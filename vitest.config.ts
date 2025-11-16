import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { UserConfig } from 'vitest/config';
import { defineConfig } from 'vitest/config';

// Vitest modes (driven by env):
// - CI truthy (1/true/yes): single-threaded, default reporter, full run, fail on no tests.
// - VITEST_SCOPE=shared: only shared lib tests + AI system integration.
// - VITEST_ENV=node|jsdom|happy-dom (case-insensitive): select test environment.
// - VITEST_CHANGED=1/true/yes (non-CI only): run only changed tests in dev.

const projectRoot = fileURLToPath(new URL('.', import.meta.url)); // Works where __dirname is undefined (Vitest extension, ESM)

// Helper for truthy environment variables
const isTruthyEnv = (value: string | undefined | null) =>
  ['1', 'true', 'yes'].includes((value || '').toLowerCase());

// Normalize environment variables to avoid typos and case issues
const env = (process.env.VITEST_ENV || '').toLowerCase();
const scope = (process.env.VITEST_SCOPE || '').toLowerCase();
const isCI = isTruthyEnv(process.env.CI);
const isChanged = isTruthyEnv(process.env.VITEST_CHANGED);

// Normalize environment for Vitest
const environment = env === 'jsdom' || env === 'happy-dom' ? env : 'node';

// Shared exclude patterns to avoid duplication
const baseExclude = [
  '**/node_modules/**',
  '**/.git/**',
  '**/.idea/**',
  '**/.vscode/**',
  '**/.DS_Store',
  '**/.nx/**',
  '**/.vitest/**',
  '**/.playwright/**',
  '**/.turbo/**',
  '**/.temp/**',
  '**/.bh/**',
  '**/.biome-home/**',
  '**/dist/**',
  '**/coverage/**',
  '**/test-results/**',
  '**/reports/**',
  '**/logs/**',
  '**/app-audit/**',
  '**/github-audit/**',
  '**/openapi-audit/**',
  '**/devcontainer-audit/**',
  '**/*.log',
  '**/*.db',
  '**/*.db-shm',
  '**/*.db-wal',
];

const e2eExclude = ['**/e2e/**', '**/playwright.config.js'];

const testFileExclude = [
  // Exclude Playwright tests, a11y suites and tooling tests from Vitest collector
  // EXCEPT: Include ai-system.integration.test.* (Vitest uses micromatch extglob: "!(pattern)" = anything except pattern)
  'tools/**/!(ai-system.integration.test).{js,mjs,cjs,ts}',
  'tools/**/*.config.{js,mjs,cjs,ts}',
  // Exclude Node.js native test runner files (use node:test instead)
  'libs/shared/src/path-security.test.mjs',
];

const watchExtraExclude = ['tools/**'];

const config: UserConfig = {
  test: {
    globals: false,
    environment,
    testTimeout: 10000,
    exclude: [...baseExclude, ...e2eExclude, ...testFileExclude],
    include:
      scope === 'shared'
        ? [
            'libs/shared/src/__tests__/**/*.{test,spec}.{js,mjs,ts,tsx,jsx}',
            // Explicitly include the AI system integration test under tools/**
            'tools/**/ai-system.integration.test.{js,mjs,cjs,ts}',
          ]
        : [
            'apps/*/src/**/*.{test,spec}.{js,mjs,ts,tsx,jsx}',
            'libs/*/src/**/*.{test,spec}.{js,mjs,ts,tsx,jsx}',
            // Explicitly include the AI system integration test under tools/**
            'tools/**/ai-system.integration.test.{js,mjs,cjs,ts}',
          ],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      // Measure coverage across the entire codebase for full project assessment
      all: true,
      // Include all source files across apps and libs
      include: ['apps/*/src/**/*.{js,ts,jsx,tsx}', 'libs/*/src/**/*.{js,ts,jsx,tsx}'],
      exclude: [
        ...baseExclude,
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        // TODO: tools/** contains logic-heavy scripts; consider adding targeted coverage later.
        'tools/**',
        'ai/**',
        'docs/**',
        '**/__tests__/**',
        '**/tests/**',
        '**/*.test.{js,ts,jsx,tsx}',
        '**/*.spec.{js,ts,jsx,tsx}',
        // Exclude migration and setup files
        '**/migrations/**',
        '**/migrations.{js,ts}',
        // Temporarily exclude frontend until a JS/TS + JSX coverage pipeline is properly configured
        'apps/frontend/**',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    // Use threads for better performance while maintaining isolation
    // Serial in CI for determinism; parallel locally for speed
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: isCI,
        isolate: true,
      },
    },
    // Automatic mock cleanup between tests
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
    setupFiles: ['./tools/testing/test-env-setup.ts'],
    // Performance: disable unnecessary features
    reporters: isCI ? ['default'] : ['verbose'],
    silent: false,
    ui: false,
    open: false,
    // Enable parallel execution for faster test runs
    sequence: {
      hooks: 'parallel',
    },
    // Add caching to speed up repeated test runs (use Vite's cacheDir)
    // NOTE: Vitest deprecated test.cache.dir; use top-level cacheDir instead.
    // We'll set cacheDir at the root of this config object below.
    // Enable changed mode for faster development feedback
    // Default to disabled to ensure CI and coverage runs execute all tests.
    // Opt-in by setting VITEST_CHANGED=1 in dev tasks.
    // In CI, always run full suite for reliability.
    changed: isChanged && !isCI,
    // Fail CI if no tests run (catches glob issues or missing tests)
    passWithNoTests: !isCI,
    // Mirror test.exclude to reduce watch noise
    // Additional exclusions for watch mode
    watchExclude: [...baseExclude, ...e2eExclude, ...watchExtraExclude],
  },
  // Use Vite's cache directory; Vitest will nest under this path automatically
  // Explicitly root it to avoid surprises if process.cwd() changes
  cacheDir: resolve(projectRoot, '.vitest/cache'),
  resolve: {
    alias: {
      // NOTE: shared is tested against the built CJS bundle to mirror production usage.
      '@political-sphere/shared': resolve(projectRoot, 'libs/shared/cjs-shared.cjs'),
      '@political-sphere/ui': resolve(projectRoot, 'libs/ui/src'),
      '@political-sphere/platform': resolve(projectRoot, 'libs/platform/src'),
      '@political-sphere/ci-utils': resolve(projectRoot, 'libs/ci/src'),
      '@political-sphere/infrastructure': resolve(projectRoot, 'libs/infrastructure/src'),
      '@political-sphere/game-engine': resolve(projectRoot, 'libs/game-engine/src'),
    },
  },
};

export default defineConfig(config);
