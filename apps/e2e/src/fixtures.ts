import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { setupMockApi } from './mock-api';

const test = base.extend({
  page: async ({ page }, use) => {
    await setupMockApi(page);
    await use(page);
  },
});

export { test, expect };
export type { Page };
