import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Configure React plugin for JSX
const reactPlugin = react({
  jsxRuntime: 'automatic',
});

// Vitest modes (driven by env):
// - CI truthy (1/true/yes): single-threaded, default reporter, full run, fail on no tests.
// - VITEST_SCOPE=shared: only shared lib tests + AI system integration.
// - VITEST_ENV=node|jsdom|happy-dom (case-insensitive): select test environment.
// - VITEST_CHANGED=1/true/yes (non-CI only): run only changed tests in dev.
// - VITEST_COVERAGE=1/true/yes: enable enhanced coverage reporting.
// - VITEST_RETRY=N: retry flaky tests up to N times (default: 0, CI recommended: 2).

const projectRoot = fileURLToPath(new URL('.', import.meta.url)); // Works where __dirname is undefined (Vitest extension, ESM)

// Helper for truthy environment variables
const isTruthyEnv = (value: string | undefined | null) =>
  ['1', 'true', 'yes'].includes((value || '').toLowerCase());

// Normalize environment variables to avoid typos and case issues
const env = (process.env.VITEST_ENV || '').toLowerCase();
const scope = (process.env.VITEST_SCOPE || '').toLowerCase();
const isCI = isTruthyEnv(process.env.CI);
const isChanged = isTruthyEnv(process.env.VITEST_CHANGED);
const retryCount = parseInt(process.env.VITEST_RETRY || '0', 10);

// Normalize environment for Vitest - support node, jsdom, happy-dom
const environment = ['node', 'jsdom', 'happy-dom'].includes(env) ? env : 'node';

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

// Base test configuration shared across all projects
const createBaseTestConfig = () => ({
  globals: false,
  environment,
  testTimeout: 10000,
  // Retry flaky tests in CI (configurable via VITEST_RETRY env var)
  retry: retryCount,
  exclude: [...baseExclude, ...e2eExclude, ...testFileExclude],
  // Inline React dependencies to prevent version mismatch
  server: {
    deps: {
      inline: ['react', 'react-dom', '@testing-library/react'],
    },
  },
  // Use threads for better performance while maintaining isolation
  // Serial in CI for determinism; parallel locally for speed
  pool: 'threads' as const,
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
  globalSetup: ['./tools/testing/global-setup.ts'],
  // Performance: disable unnecessary features
  reporters: isCI ? ['default'] : ['verbose'],
  silent: false,
  ui: false,
  open: false,
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
});

// Factory function to create project configurations
const createProject = (name: string, include: string[]) => ({
  name,
  test: {
    ...createBaseTestConfig(),
    include,
  },
  esbuild: {
    jsx: 'automatic' as const,
    jsxImportSource: 'react',
  },
});

// Define projects to group related test suites and reduce extension detection overhead
const projects =
  scope === 'shared'
    ? [
        createProject('shared-libs', [
          'libs/shared/src/__tests__/**/*.{test,spec}.{js,mjs,ts,tsx,jsx}',
        ]),
        createProject('ai-integration', ['tools/**/ai-system.integration.test.{js,mjs,cjs,ts}']),
      ]
    : [
        createProject('apps', ['apps/*/src/**/*.{test,spec}.{js,mjs,ts,tsx,jsx}']),
        createProject('libs', ['libs/*/src/**/*.{test,spec}.{js,mjs,ts,tsx,jsx}']),
        createProject('ai-integration', ['tools/**/ai-system.integration.test.{js,mjs,cjs,ts}']),
      ];

const config = {
  plugins: [reactPlugin],
  test: {
    projects,
    globals: true, // Enable global test functions
    environment: 'jsdom', // Default to jsdom for React tests
  },
  esbuild: {
    jsx: 'automatic' as const,
    jsxImportSource: 'react',
  },
  // Use Vite's cache directory; Vitest will nest under this path automatically
  // Explicitly root it to avoid surprises if process.cwd() changes
  cacheDir: resolve(projectRoot, '.vitest/cache'),
  resolve: {
    alias: {
      // Ensure single React version across all tests
      react: resolve(projectRoot, 'node_modules/react'),
      'react-dom': resolve(projectRoot, 'node_modules/react-dom'),
      'react/jsx-runtime': resolve(projectRoot, 'node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime': resolve(projectRoot, 'node_modules/react/jsx-dev-runtime.js'),
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
