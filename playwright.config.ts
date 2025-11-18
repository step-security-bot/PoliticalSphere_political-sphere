import { defineConfig, devices } from '@playwright/test';

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
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),

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
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile viewports (optional - uncomment to test)
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // Web server configuration for local testing (only in non-CI environments)
  ...(!process.env.CI && {
    webServer: {
      command: 'npm run serve:web',
      port: 3001,
      timeout: 120 * 1000,
      reuseExistingServer: true,
    },
  }),
});
