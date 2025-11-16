import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for visual regression testing
 *
 * Captures screenshots of UI components and compares them against baseline images
 * to detect unexpected visual changes.
 *
 * @see https://playwright.dev/docs/test-snapshots
 */

export default defineConfig({
  testDir: './tests/visual',
  testMatch: '**/*.visual.spec.ts',

  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}{ext}',

  fullyParallel: false, // Sequential for consistent screenshots
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for deterministic screenshots

  timeout: 30 * 1000,

  reporter: [
    ['html', { outputFolder: 'playwright-report/visual' }],
    ['json', { outputFile: 'test-results/visual-results.json' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',

    // Consistent screenshot settings
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,

    // Disable animations for consistent screenshots
    actionTimeout: 10000,
  },

  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100, // Allow small differences
      threshold: 0.2, // 20% tolerance for anti-aliasing differences
      animations: 'disabled',
    },
  },

  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:4200',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
      },
});
