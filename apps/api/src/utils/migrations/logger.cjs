/* eslint-disable no-console */
/**
 * Simple logger for database migrations
 * Uses console logging since migrations run outside the main application context
 */

const info = (message, ...args) => {
  console.log(`[MIGRATION INFO] ${message}`, ...args);
};

const error = (message, ...args) => {
  console.error(`[MIGRATION ERROR] ${message}`, ...args);
};

const warn = (message, ...args) => {
  console.warn(`[MIGRATION WARN] ${message}`, ...args);
};

module.exports = {
  info,
  error,

  warn,
};
