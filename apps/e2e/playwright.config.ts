import { defineConfig } from '@playwright/test';

// Playwright configuration
// Notes:
//  - Simplified to a single API and web server start for reliability.
//  - Added retries and higher timeouts for flaky CI environment.
//  - Ensured servers reuse existing instances when possible.

const API_PORT = Number(process.env.API_PORT || 4000);
const API_COMMAND = process.env.API_E2E_COMMAND || 'npm run start:api';
const WEB_PORT = Number(process.env.WEB_PORT || 3001);
// Use dev server for faster startup instead of preview
const WEB_COMMAND = process.env.WEB_E2E_COMMAND || 'npm run dev:web';

export default defineConfig({
  timeout: 30000, // Reduced from 60s - most tests should complete faster
  retries: process.env.CI ? 2 : 0, // Retry twice in CI
  use: {
    baseURL: process.env.WEB_BASE_URL || process.env.BASE_URL || `http://localhost:${WEB_PORT}`,
    headless: !process.env.HEADED, // Headless by default, allow headed with HEADED=1
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Reduce action timeouts for faster tests
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  fullyParallel: true,
  workers: process.env.CI ? 1 : 4, // Limit to 4 workers for better resource usage
  shard: process.env.SHARD
    ? {
        current: parseInt(process.env.SHARD_INDEX || '1', 10),
        total: parseInt(process.env.SHARD_TOTAL || '1', 10),
      }
    : undefined,
  webServer: [
    {
      command: API_COMMAND,
      port: API_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 30000, // Reduced from 60s
      env: {
        API_BASE_URL: `http://localhost:${API_PORT}`,
        DATABASE_URL: 'file:./test.db',
      },
    },
    {
      command: WEB_COMMAND,
      port: WEB_PORT,
      reuseExistingServer: !process.env.CI,
      timeout: 30000, // Reduced from 90s - dev server starts faster
      env: {
        WEB_BASE_URL: `http://localhost:${WEB_PORT}`,
        // Ensure dev server uses correct port
        PORT: WEB_PORT.toString(),
      },
    },
  ],
});
