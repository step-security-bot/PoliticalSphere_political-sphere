/**
 * MSW Server Setup for Testing
 *
 * Configures Mock Service Worker for API mocking in tests.
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Create MSW server instance
export const server = setupServer(...handlers);

/**
 * Start MSW server before tests
 */
export const startMSW = () => {
  server.listen({
    onUnhandledRequest: 'warn', // Log unhandled requests instead of erroring
  });
};

/**
 * Stop MSW server after tests
 */
export const stopMSW = () => {
  server.close();
};

/**
 * Reset request handlers between tests
 */
export const resetMSW = () => {
  server.resetHandlers();
};

/**
 * Add custom handlers for specific test scenarios
 */
export const addMSWHandlers = (...customHandlers: any[]) => {
  server.use(...customHandlers);
};

/**
 * Remove custom handlers
 */
export const removeMSWHandlers = (...customHandlers: any[]) => {
  server.resetHandlers();
  // Re-add original handlers
  server.use(...handlers);
};
