/**
 * Test-specific database utilities
 *
 * Provides a clean abstraction for tests to interact with the database
 * without directly importing from internal store modules.
 *
 * This module is designed specifically for testing and should not be used
 * in production code.
 */

import { type DatabaseConnection, getDatabase, closeDatabase } from '../stores/index.js';

// Test data type definitions
export interface TestUser {
  id?: string;
  username: string;
  email: string;
  password_hash?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TestParty {
  id?: string;
  name: string;
  description?: string;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TestBill {
  id?: string;
  title: string;
  description?: string | null;
  proposerId: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Database test interface
 * Provides methods for setting up, tearing down, and interacting with test databases
 */
export class TestDatabase {
  private connection: DatabaseConnection | null = null;

  /**
   * Initialize database for tests
   * @returns Database connection instance
   */
  async setup(): Promise<DatabaseConnection> {
    // Use a unique database file for each test to avoid conflicts
    const fs = await import('node:fs');
    const path = await import('node:path');
    const dbPath = path.join(process.cwd(), `test-${Date.now()}-${Math.random()}.db`);

    // Set DATABASE_URL to the unique file
    process.env.DATABASE_URL = `file:${dbPath}`;

    this.connection = getDatabase();

    // Disconnect and reconnect Prisma to ensure it uses the new database
    const { prisma } = await import('../services/prisma-database.service.ts');
    await prisma.$disconnect();
    await prisma.$connect();

    return this.connection;
  }

  /**
   * Clean up database after tests
   */
  async teardown(): Promise<void> {
    // Disconnect Prisma to ensure clean state for next test
    const { prisma } = await import('../services/prisma-database.service.ts');
    await prisma.$disconnect();
    closeDatabase();
    this.connection = null;
  }

  /**
   * Get the current database connection
   * @throws Error if database is not initialized
   */
  getConnection(): DatabaseConnection {
    if (!this.connection) {
      throw new Error('Database not initialized. Call setup() first.');
    }
    return this.connection;
  }

  /**
   * Create a test user with default values
   * @param overrides - Properties to override defaults
   * @returns Created user
   */
  async createTestUser(overrides: Partial<TestUser> = {}): Promise<TestUser> {
    const db = this.getConnection();
    const userData = {
      username: `testuser_${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      ...overrides,
    };
    return db.users.create(userData);
  }

  /**
   * Create a test party with default values
   * @param overrides - Properties to override defaults
   * @returns Created party
   */
  async createTestParty(overrides: Partial<TestParty> = {}): Promise<TestParty> {
    const db = this.getConnection();
    const partyData = {
      name: `Test Party ${Date.now()}`,
      description: 'A test political party',
      color: '#FF6B6B',
      ...overrides,
    };
    return db.parties.create(partyData);
  }

  /**
   * Create a test bill with default values
   * @param overrides - Properties to override defaults
   * @returns Created bill
   */
  async createTestBill(overrides: Partial<TestBill> = {}): Promise<TestBill> {
    const db = this.getConnection();
    const billData = {
      title: `Test Bill ${Date.now()}`,
      description: 'A test bill for political simulation',
      proposerId: overrides.proposerId || (await this.createTestUser()).id,
      ...overrides,
    };
    return db.bills.create(billData);
  }
}

/**
 * Singleton instance for convenience
 */
let testDbInstance: TestDatabase | null = null;

/**
 * Get or create the test database instance
 */
export function getTestDatabase(): TestDatabase {
  if (!testDbInstance) {
    testDbInstance = new TestDatabase();
  }
  return testDbInstance;
}

/**
 * Reset the test database instance
 * Useful for ensuring clean state between test suites
 */
export function resetTestDatabase(): void {
  testDbInstance = null;
}
