/**
 * Comprehensive Test Utilities
 *
 * Provides factories, helpers, and utilities for testing.
 */

import { faker } from '@faker-js/faker';
import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { TestDatabaseFactory } from './testcontainers';
import { mswTestUtils } from './msw';

// Re-export commonly used testing utilities
export { faker } from '@faker-js/faker';
export { TestDatabaseFactory } from './testcontainers';
export { mswTestUtils } from './msw';

/**
 * Test Data Factories
 */
export const factories = {
  /**
   * User factory
   */
  user: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    username: faker.internet.username(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    avatar: faker.image.avatar(),
    role: faker.helpers.arrayElement(['user', 'moderator', 'admin']),
    partyId: faker.string.uuid(),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  }),

  /**
   * Bill factory
   */
  bill: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    status: faker.helpers.arrayElement(['draft', 'active', 'passed', 'failed']),
    category: faker.helpers.arrayElement(['environment', 'healthcare', 'economy', 'education']),
    sponsorId: faker.string.uuid(),
    coSponsors: faker.helpers.arrayElements([faker.string.uuid()], { min: 0, max: 3 }),
    content: faker.lorem.paragraphs(3),
    tags: faker.helpers.arrayElements(['climate', 'healthcare', 'economy', 'education', 'reform'], {
      min: 1,
      max: 3,
    }),
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  }),

  /**
   * Vote factory
   */
  vote: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    billId: faker.string.uuid(),
    userId: faker.string.uuid(),
    vote: faker.helpers.arrayElement(['yes', 'no', 'abstain']),
    createdAt: faker.date.recent().toISOString(),
    ...overrides,
  }),

  /**
   * Party factory
   */
  party: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    name: faker.company.name(),
    description: faker.lorem.sentence(),
    color: faker.color.rgb({ format: 'hex' }),
    logo: faker.image.url(),
    leaderId: faker.string.uuid(),
    memberCount: faker.number.int({ min: 10, max: 500 }),
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  }),

  /**
   * News article factory
   */
  newsArticle: (overrides: Partial<any> = {}) => ({
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(5),
    summary: faker.lorem.sentence(),
    category: faker.helpers.arrayElement(['politics', 'healthcare', 'economy', 'environment']),
    authorId: faker.string.uuid(),
    tags: faker.helpers.arrayElements(['politics', 'healthcare', 'economy', 'environment'], {
      min: 1,
      max: 3,
    }),
    publishedAt: faker.date.recent().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  }),
};

/**
 * Test Helpers
 */
export const helpers = {
  /**
   * Generate array of items using a factory
   */
  generate: <T>(
    factory: (overrides?: Partial<T>) => T,
    count: number,
    overrides?: Partial<T>
  ): T[] => {
    return Array.from({ length: count }, () => factory(overrides));
  },

  /**
   * Create authenticated user context for tests
   */
  createAuthContext: (userOverrides?: Partial<any>) => {
    const user = factories.user(userOverrides);
    const token = faker.string.alphanumeric(32);

    // Mock localStorage/sessionStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => {
          if (key === 'auth_token') return token;
          if (key === 'user') return JSON.stringify(user);
          return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });

    return { user, token };
  },

  /**
   * Mock fetch API for testing
   */
  mockFetch: (response: any, status = 200) => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(response),
        text: () => Promise.resolve(JSON.stringify(response)),
      } as Response)
    );
  },

  /**
   * Mock timers for testing
   */
  mockTimers: () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });
  },

  /**
   * Wait for next tick in async tests
   */
  nextTick: () => new Promise(resolve => setTimeout(resolve, 0)),

  /**
   * Create test database with seeded data
   */
  createTestDb: async (options?: {
    type?: 'sqlite' | 'postgresql';
    schemaPath?: string;
    seedData?: any[];
  }) => {
    const { type = 'sqlite' } = options || {};

    if (type === 'sqlite') {
      return TestDatabaseFactory.createSQLite(options);
    } else {
      return TestDatabaseFactory.createPostgreSQL(options);
    }
  },

  /**
   * Setup MSW for tests
   */
  setupMSW: mswTestUtils.setup,

  /**
   * Setup MSW for single test
   */
  setupMSWTest: mswTestUtils.setupTest,
};

/**
 * Custom matchers for Vitest
 */
export const customMatchers = {
  /**
   * Check if object has required properties
   */
  toHaveRequiredProperties: (received: any, requiredProps: string[]) => {
    const missing = requiredProps.filter(prop => !(prop in received));

    return {
      pass: missing.length === 0,
      message: () => `Expected object to have properties: ${missing.join(', ')}`,
    };
  },

  /**
   * Check if date string is valid ISO format
   */
  toBeValidISODate: (received: string) => {
    const date = new Date(received);
    const isValid = !isNaN(date.getTime()) && received === date.toISOString();

    return {
      pass: isValid,
      message: () => `Expected "${received}" to be a valid ISO date string`,
    };
  },
};

/**
 * Test lifecycle hooks
 */
export const lifecycle = {
  /**
   * Setup common test environment
   */
  setupTestEnvironment: () => {
    beforeAll(async () => {
      // Global test setup
    });

    afterAll(async () => {
      // Global test cleanup
    });

    beforeEach(() => {
      // Reset mocks between tests
      vi.clearAllMocks();
    });

    afterEach(() => {
      // Cleanup after each test
    });
  },

  /**
   * Setup database test environment
   */
  setupDatabaseTest: (dbType: 'sqlite' | 'postgresql' = 'sqlite') => {
    let testDb: any;

    beforeAll(async () => {
      testDb = await helpers.createTestDb({ type: dbType });
    });

    afterAll(async () => {
      await testDb?.close();
    });

    return {
      getDb: () => testDb,
    };
  },
};

// Export everything as a single object for convenience
export const testUtils = {
  factories,
  helpers,
  customMatchers,
  lifecycle,
};
