// CommonJS shim for @political-sphere/observability used in tests
// This provides minimal implementations for testing purposes

// Mock implementations for testing
function getHealthCheckService() {
  return {
    register: () => {},
    unregister: () => {},
    runAllChecks: async () => [],
    getOverallHealth: async () => ({ status: 'healthy', checks: [] }),
  };
}

function getErrorTracker() {
  return {
    initialize: async () => {},
    captureException: () => {},
    captureMessage: () => {},
    setUser: () => {},
    setContext: () => {},
  };
}

function initializeMetrics() {
  return {
    recordHttpRequest: () => {},
    setMemoryUsage: () => {},
    setActiveConnections: () => {},
    recordBusinessLogicError: () => {},
    increment: () => {},
    gauge: () => {},
    histogram: () => {},
    timing: () => {},
  };
}

function initializeLogging() {
  return {
    info: () => {},
    error: () => {},
    warn: () => {},
    debug: () => {},
    logRequest: () => {},
  };
}

function createDatabaseHealthCheck() {
  return {
    name: 'database',
    check: async () => ({ status: 'healthy', duration: 0 }),
  };
}

function createSystemResourceHealthCheck() {
  return {
    name: 'system',
    check: async () => ({ status: 'healthy', duration: 0 }),
  };
}

module.exports = {
  getHealthCheckService,
  getErrorTracker,
  initializeMetrics,
  initializeLogging,
  createDatabaseHealthCheck,
  createSystemResourceHealthCheck,
};
