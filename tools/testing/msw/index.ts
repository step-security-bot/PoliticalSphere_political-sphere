/**
 * MSW Testing Utilities
 *
 * Provides easy-to-use utilities for setting up MSW in tests.
 */

import { beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import { startMSW, stopMSW, resetMSW } from './server';

export { server, startMSW, stopMSW, resetMSW, addMSWHandlers, removeMSWHandlers } from './server';
export { handlers } from './handlers';

// Test utilities for MSW
export const mswTestUtils = {
  /**
   * Setup MSW for a test suite
   */
  setup: () => {
    beforeAll(() => startMSW());
    afterEach(() => resetMSW());
    afterAll(() => stopMSW());
  },

  /**
   * Setup MSW for a single test
   */
  setupTest: () => {
    beforeEach(() => startMSW());
    afterEach(() => {
      resetMSW();
      stopMSW();
    });
  },
};
