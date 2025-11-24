import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

const browserDevices = {
  chromium: devices['Desktop Chrome'],
  firefox: devices['Desktop Firefox'],
  webkit: devices['Desktop Safari'],
};

const browserKeys = Object.keys(browserDevices) as Array<keyof typeof browserDevices>;

const parseBrowserEnv = (value?: string): Array<keyof typeof browserDevices> | null => {
  const requested = value
    ?.split(',')
    .map(name => name.trim())
    .filter(Boolean);

  const valid = requested?.filter(
    (name): name is keyof typeof browserDevices => name in browserDevices
  );

  return valid && valid.length > 0 ? valid : null;
};

const defaultBrowsers: Array<keyof typeof browserDevices> = isCI ? browserKeys : ['chromium'];
const browsersToRun = parseBrowserEnv(process.env.E2E_BROWSERS) ?? defaultBrowsers;

/**
 * Playwright Configuration for Political Sphere E2E Testing
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './apps/e2e/src',

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Test execution settings
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  ...(isCI ? { workers: 1 } : {}),

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'reports/e2e-html', open: 'never' }],
    ['json', { outputFile: 'reports/e2e/results.json' }],
    ['junit', { outputFile: 'reports/e2e/junit.xml' }],
    ['list'],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for tests
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3001',

    // Collect trace on failure for debugging
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Navigation timeout
    navigationTimeout: 10 * 1000,

    // Action timeout
    actionTimeout: 5 * 1000,
  },

  // Visual regression testing configuration
  expect: {
    toHaveScreenshot: {
      // Maximum number of pixels that can differ
      maxDiffPixels: 100,

      // Threshold for pixel difference (0-1)
      threshold: 0.2,

      // Animations should be disabled for consistency
      animations: 'disabled' as const,
    },
  },

  // Configure projects for major browsers
  // Set browsers via E2E_BROWSERS=chromium,firefox,... (defaults to chromium locally, all in CI)
  projects: browsersToRun.map(name => ({
    name,
    use: { ...browserDevices[name] },
  })),

  // Web server configuration for local testing (only in non-CI environments)
  ...(!isCI && {
    webServer: {
      command: 'npm run serve:web -- --host 127.0.0.1',
      url: 'http://127.0.0.1:3001',
      timeout: 120 * 1000,
      reuseExistingServer: true,
    },
  }),
});
