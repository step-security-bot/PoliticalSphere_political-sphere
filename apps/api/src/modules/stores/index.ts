// Re-export the real database connection for module-based imports used in tests
// The direct import path is intentional to ensure tests use the real store wiring.
// eslint-disable-next-line no-restricted-imports
export { DatabaseConnection, getDatabase, closeDatabase } from '../../stores/index.js';
