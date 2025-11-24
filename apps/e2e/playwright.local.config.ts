import { defineConfig, devices } from '@playwright/test';
import os from 'os';

// Fast local profile: single browser, no retries/artifacts, reuse existing server when present.
const cpuCount =
  (os as { availableParallelism?: () => number }).availableParallelism?.() || os.cpus().length || 2;
const workerCount =
  Number(process.env.PW_WORKERS) || Math.max(2, Math.min(6, Math.floor(cpuCount / 2)));

export default defineConfig({
  testDir: './apps/e2e/src',
  timeout: 20_000,
  retries: 0,
  workers: workerCount,
  reporter: [['list']],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:3001',
    headless: true,
    trace: 'off',
    video: 'off',
    screenshot: 'off',
    actionTimeout: 5_000,
    navigationTimeout: 15_000,
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER
    ? undefined
    : {
        command: 'npm run serve:web -- --host 127.0.0.1',
        url: 'http://127.0.0.1:3001',
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
