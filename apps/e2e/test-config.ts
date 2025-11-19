/**
 * E2E Test Configuration
 *
 * Centralized configuration for all E2E test suites
 */

export const TestConfig = {
  // Base URLs for different environments
  environments: {
    development: {
      baseURL: 'http://localhost:3001',
      apiURL: 'http://localhost:4000',
      wsURL: 'ws://localhost:4000',
    },
    staging: {
      baseURL: process.env.STAGING_BASE_URL || 'https://staging.political-sphere.com',
      apiURL: process.env.STAGING_API_URL || 'https://api-staging.political-sphere.com',
      wsURL: process.env.STAGING_WS_URL || 'wss://api-staging.political-sphere.com',
    },
    production: {
      baseURL: process.env.PROD_BASE_URL || 'https://political-sphere.com',
      apiURL: process.env.PROD_API_URL || 'https://api.political-sphere.com',
      wsURL: process.env.PROD_WS_URL || 'wss://api.political-sphere.com',
    },
  },

  // Test timeouts
  timeouts: {
    action: 5000,
    navigation: 10000,
    expectation: 10000,
    pageLoad: 30000,
    apiRequest: 10000,
  },

  // Test data configuration
  testData: {
    users: {
      count: 20,
      defaultPassword: 'SecurePass123!',
    },
    parties: {
      count: 5,
      maxMembers: 50,
    },
    bills: {
      count: 15,
      votingPeriodDays: 7,
    },
    elections: {
      count: 2,
      candidatesPerElection: 5,
    },
  },

  // Browser configurations
  browsers: {
    chromium: {
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
      hasTouch: false,
      isMobile: false,
    },
    firefox: {
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
    },
    webkit: {
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
    },
    mobile: {
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
      hasTouch: true,
      isMobile: true,
    },
  },

  // Test suites configuration
  testSuites: {
    auth: {
      enabled: true,
      tests: [
        'user-registration',
        'user-login',
        'password-reset',
        'session-management',
        'security-validation',
      ],
    },
    parliament: {
      enabled: true,
      tests: ['bill-creation', 'parliament-viewing', 'debate-participation', 'session-management'],
    },
    voting: {
      enabled: true,
      tests: [
        'vote-casting',
        'vote-results',
        'voting-restrictions',
        'election-voting',
        'vote-security',
      ],
    },
    parties: {
      enabled: true,
      tests: [
        'party-creation',
        'party-membership',
        'party-information',
        'party-interactions',
        'party-administration',
      ],
    },
    government: {
      enabled: true,
      tests: [
        'government-dashboard',
        'minister-roles',
        'cabinet-operations',
        'executive-decisions',
        'government-performance',
        'transparency',
        'emergency-management',
      ],
    },
    judiciary: {
      enabled: true,
      tests: [
        'case-filing',
        'case-viewing',
        'legal-proceedings',
        'ruling-issuance',
        'judicial-oversight',
      ],
    },
    media: {
      enabled: true,
      tests: ['news-viewing', 'poll-tracking', 'approval-monitoring', 'media-interactions'],
    },
    realtime: {
      enabled: true,
      tests: [
        'websocket-connections',
        'live-updates',
        'notification-system',
        'real-time-collaboration',
      ],
    },
    admin: {
      enabled: true,
      tests: [
        'user-management',
        'system-monitoring',
        'content-moderation',
        'system-administration',
      ],
    },
  },

  // Performance thresholds
  performance: {
    pageLoadTime: 3000, // ms
    apiResponseTime: 1000, // ms
    lighthouseScores: {
      performance: 85,
      accessibility: 90,
      bestPractices: 85,
      seo: 85,
    },
  },

  // Accessibility standards
  accessibility: {
    standards: ['WCAG2AA'],
    includeRules: ['color-contrast', 'keyboard-navigation', 'screen-reader'],
    excludeRules: ['experimental'],
  },

  // Visual regression settings
  visualRegression: {
    threshold: 0.2,
    maxDiffPixels: 100,
    animations: 'disabled',
    viewport: { width: 1280, height: 720 },
  },

  // Database seeding options
  database: {
    isolation: 'transaction', // 'transaction' or 'schema'
    cleanup: 'truncate', // 'truncate' or 'delete'
    seedData: true,
    preserveData: false,
  },

  // Reporting configuration
  reporting: {
    formats: ['html', 'json', 'junit', 'github'],
    outputDir: 'reports/e2e',
    screenshots: {
      onFailure: true,
      onSuccess: false,
      fullPage: true,
    },
    videos: {
      onFailure: true,
      onSuccess: false,
    },
    traces: {
      onFailure: true,
      onFirstRetry: true,
    },
  },

  // CI/CD configuration
  ci: {
    shardCount: 4,
    parallelWorkers: 2,
    retryCount: 2,
    timeoutMinutes: 30,
  },

  // Notification settings
  notifications: {
    onFailure: true,
    onSuccess: false,
    channels: ['slack', 'github'],
  },
};

/**
 * Get current environment configuration
 */
export function getCurrentEnvironment() {
  const env = process.env.E2E_ENVIRONMENT || 'development';
  return TestConfig.environments[env as keyof typeof TestConfig.environments];
}

/**
 * Get test configuration for specific suite
 */
export function getTestSuiteConfig(suiteName: string) {
  return TestConfig.testSuites[suiteName as keyof typeof TestConfig.testSuites];
}

/**
 * Check if test suite is enabled
 */
export function isTestSuiteEnabled(suiteName: string): boolean {
  const suite = TestConfig.testSuites[suiteName as keyof typeof TestConfig.testSuites];
  return suite?.enabled ?? false;
}

/**
 * Get performance thresholds
 */
export function getPerformanceThresholds() {
  return TestConfig.performance;
}

/**
 * Get accessibility configuration
 */
export function getAccessibilityConfig() {
  return TestConfig.accessibility;
}

/**
 * Get visual regression settings
 */
export function getVisualRegressionConfig() {
  return TestConfig.visualRegression;
}

/**
 * Get database configuration
 */
export function getDatabaseConfig() {
  return TestConfig.database;
}

/**
 * Get reporting configuration
 */
export function getReportingConfig() {
  return TestConfig.reporting;
}

/**
 * Get CI/CD configuration
 */
export function getCIConfig() {
  return TestConfig.ci;
}
