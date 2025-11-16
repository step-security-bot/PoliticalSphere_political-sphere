import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for accessibility testing
 *
 * This config runs axe-core accessibility scans against all frontend applications
 * to validate WCAG 2.2 AA compliance.
 *
 * @see https://playwright.dev/docs/test-configuration
 * @see https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright
 */

export default defineConfig({
  testDir: './tests/accessibility',
  testMatch: '**/*.a11y.spec.ts',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/accessibility-results.json' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
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
