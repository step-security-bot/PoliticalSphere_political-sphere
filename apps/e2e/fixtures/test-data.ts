/**
 * Test Data Fixtures for Political Sphere E2E Tests
 *
 * Provides comprehensive test data seeding utilities for all application domains
 */

import { faker } from '@faker-js/faker';

// Local type definitions for test data (mirroring API types)
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
  description?: string;
  proposerId: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

// Mock TestDatabase class for E2E testing (simplified version)
export class TestDatabase {
  private connection: any = null;

  async setup(): Promise<any> {
    // In E2E tests, we'll use API calls instead of direct DB access
    this.connection = {};
    return this.connection;
  }

  async teardown(): Promise<void> {
    this.connection = null;
  }

  getConnection(): any {
    if (!this.connection) {
      throw new Error('Database not initialized. Call setup() first.');
    }
    return this.connection;
  }

  // Mock implementations - in real E2E tests, these would make API calls
  async createTestUser(overrides: Partial<TestUser> = {}): Promise<TestUser> {
    return {
      id: faker.string.uuid(),
      username: faker.internet.username(),
      email: faker.internet.email(),
      ...overrides,
    } as TestUser;
  }

  async createTestParty(overrides: Partial<TestParty> = {}): Promise<TestParty> {
    return {
      id: faker.string.uuid(),
      name: faker.company.name() + ' Party',
      description: faker.lorem.sentences(2),
      color: faker.color.rgb({ format: 'hex' }),
      ...overrides,
    } as TestParty;
  }

  async createTestBill(overrides: Partial<TestBill> = {}): Promise<TestBill> {
    return {
      id: faker.string.uuid(),
      title: faker.lorem.sentence({ min: 5, max: 15 }),
      description: faker.lorem.paragraphs(2),
      status: 'proposed',
      ...overrides,
    } as TestBill;
  }
}

export interface TestFixtureData {
  users: TestUser[];
  parties: TestParty[];
  bills: TestBill[];
  votes: any[];
  parliament: any[];
  judiciary: any[];
  media: any[];
  elections: any[];
}

/**
 * Test Data Generator
 * Generates realistic test data for all application domains
 */
export class TestDataGenerator {
  private db: TestDatabase;

  constructor(db: TestDatabase) {
    this.db = db;
  }

  /**
   * Generate a complete test user with authentication details
   */
  generateUser(overrides: Partial<TestUser> = {}): TestUser & { password: string } {
    const password = faker.internet.password({ length: 12, memorable: true });
    return {
      username: faker.internet.username(),
      email: faker.internet.email(),
      password,
      role: 'citizen',
      ...overrides,
    };
  }

  /**
   * Generate a political party
   */
  generateParty(overrides: Partial<TestParty> = {}): TestParty {
    return {
      name: faker.company.name() + ' Party',
      description: faker.lorem.sentences(2),
      color: faker.color.rgb({ format: 'hex' }),
      ...overrides,
    };
  }

  /**
   * Generate a bill proposal
   */
  generateBill(proposerId: string, overrides: Partial<TestBill> = {}): TestBill {
    return {
      title: faker.lorem.sentence({ min: 5, max: 15 }),
      description: faker.lorem.paragraphs(2),
      proposerId,
      status: 'proposed',
      ...overrides,
    };
  }

  /**
   * Generate election data
   */
  generateElection(overrides: any = {}): any {
    return {
      title: `${faker.date.future().getFullYear()} General Election`,
      description: faker.lorem.sentences(3),
      startDate: faker.date.future(),
      endDate: faker.date.future({ refDate: faker.date.future() }),
      type: 'general',
      status: 'upcoming',
      ...overrides,
    };
  }

  /**
   * Generate media content
   */
  generateMediaContent(overrides: any = {}): any {
    return {
      title: faker.lorem.sentence({ min: 5, max: 10 }),
      content: faker.lorem.paragraphs(3),
      type: faker.helpers.arrayElement(['news', 'poll', 'analysis']),
      publishedAt: faker.date.recent(),
      authorId: overrides.authorId,
      ...overrides,
    };
  }

  /**
   * Generate judiciary case
   */
  generateJudiciaryCase(plaintiffId: string, defendantId: string, overrides: any = {}): any {
    return {
      title: faker.lorem.sentence({ min: 8, max: 20 }),
      description: faker.lorem.paragraphs(2),
      plaintiffId,
      defendantId,
      status: 'filed',
      caseType: faker.helpers.arrayElement([
        'constitutional',
        'administrative',
        'criminal',
        'civil',
      ]),
      filedAt: faker.date.recent(),
      ...overrides,
    };
  }
}

/**
 * Test Data Seeder
 * Seeds the database with comprehensive test data for E2E testing
 */
export class TestDataSeeder {
  private db: TestDatabase;
  private generator: TestDataGenerator;

  constructor(db: TestDatabase) {
    this.db = db;
    this.generator = new TestDataGenerator(db);
  }

  /**
   * Seed complete test scenario with all domains
   */
  async seedCompleteScenario(): Promise<TestFixtureData> {
    // Create users
    const users = await this.seedUsers(20);

    // Create parties
    const parties = await this.seedParties(5);

    // Assign users to parties
    await this.assignUsersToParties(users, parties);

    // Create bills
    const bills = await this.seedBills(users, 15);

    // Create parliament sessions
    const parliament = await this.seedParliamentSessions(bills);

    // Create votes on bills
    const votes = await this.seedVotes(bills, users);

    // Create judiciary cases
    const judiciary = await this.seedJudiciaryCases(users);

    // Create media content
    const media = await this.seedMediaContent(users);

    // Create elections
    const elections = await this.seedElections();

    return {
      users,
      parties,
      bills,
      votes,
      parliament,
      judiciary,
      media,
      elections,
    };
  }

  /**
   * Seed test users
   */
  async seedUsers(count: number): Promise<TestUser[]> {
    const users: TestUser[] = [];
    for (let i = 0; i < count; i++) {
      const userData = this.generator.generateUser();
      const user = await this.db.createTestUser({
        username: userData.username,
        email: userData.email,
        // Note: In real implementation, password would be hashed
        // For testing, we might need to handle this differently
      });
      users.push(user);
    }
    return users;
  }

  /**
   * Seed political parties
   */
  async seedParties(count: number): Promise<TestParty[]> {
    const parties: TestParty[] = [];
    for (let i = 0; i < count; i++) {
      const partyData = this.generator.generateParty();
      const party = await this.db.createTestParty(partyData);
      parties.push(party);
    }
    return parties;
  }

  /**
   * Assign users to parties randomly
   */
  async assignUsersToParties(users: TestUser[], parties: TestParty[]): Promise<void> {
    for (const user of users) {
      // 70% of users join a party
      if (faker.datatype.boolean({ probability: 0.7 })) {
        const party = faker.helpers.arrayElement(parties);
        // Implementation would depend on actual party membership API
        // await this.db.assignUserToParty(user.id, party.id);
      }
    }
  }

  /**
   * Seed bill proposals
   */
  async seedBills(users: TestUser[], count: number): Promise<TestBill[]> {
    const bills: TestBill[] = [];
    for (let i = 0; i < count; i++) {
      const proposer = faker.helpers.arrayElement(users);
      const billData = this.generator.generateBill(proposer.id!);
      const bill = await this.db.createTestBill(billData);
      bills.push(bill);
    }
    return bills;
  }

  /**
   * Seed parliament sessions and debates
   */
  async seedParliamentSessions(bills: TestBill[]): Promise<any[]> {
    // Implementation would create parliament sessions
    // This is a placeholder for the actual implementation
    return bills.map(bill => ({
      id: faker.string.uuid(),
      billId: bill.id,
      status: faker.helpers.arrayElement(['scheduled', 'in_progress', 'completed']),
      scheduledAt: faker.date.future(),
    }));
  }

  /**
   * Seed votes on bills
   */
  async seedVotes(bills: TestBill[], users: TestUser[]): Promise<any[]> {
    const votes: any[] = [];
    for (const bill of bills) {
      // Each bill gets votes from random subset of users
      const voters = faker.helpers.arrayElements(users, faker.number.int({ min: 5, max: 15 }));
      for (const voter of voters) {
        votes.push({
          billId: bill.id,
          userId: voter.id,
          vote: faker.helpers.arrayElement(['yes', 'no', 'abstain']),
          votedAt: faker.date.recent(),
        });
      }
    }
    return votes;
  }

  /**
   * Seed judiciary cases
   */
  async seedJudiciaryCases(users: TestUser[]): Promise<any[]> {
    const cases: any[] = [];
    // Create some legal cases between users
    const caseCount = Math.floor(users.length / 4);
    for (let i = 0; i < caseCount; i++) {
      const [plaintiff, defendant] = faker.helpers.arrayElements(users, 2);
      if (!plaintiff?.id || !defendant?.id) {
        continue;
      }
      const caseData = this.generator.generateJudiciaryCase(plaintiff.id, defendant.id);
      cases.push({
        id: faker.string.uuid(),
        ...caseData,
      });
    }
    return cases;
  }

  /**
   * Seed media content
   */
  async seedMediaContent(users: TestUser[]): Promise<any[]> {
    const media: any[] = [];
    const authors = users.filter(() => faker.datatype.boolean({ probability: 0.3 })); // 30% are journalists

    for (let i = 0; i < 10; i++) {
      const author = faker.helpers.arrayElement(authors);
      const content = this.generator.generateMediaContent({ authorId: author.id });
      media.push({
        id: faker.string.uuid(),
        ...content,
      });
    }
    return media;
  }

  /**
   * Seed elections
   */
  async seedElections(): Promise<any[]> {
    const elections: any[] = [];
    // Create current and upcoming elections
    elections.push(
      this.generator.generateElection({
        id: faker.string.uuid(),
        status: 'active',
      })
    );

    elections.push(
      this.generator.generateElection({
        id: faker.string.uuid(),
        status: 'upcoming',
      })
    );

    return elections;
  }

  /**
   * Clean up all test data
   */
  async cleanup(): Promise<void> {
    // Implementation would truncate all test tables
    // This is a placeholder for the actual cleanup logic
  }
}

/**
 * Test Scenario Presets
 * Pre-configured scenarios for different testing needs
 */
export class TestScenarios {
  private seeder: TestDataSeeder;

  constructor(seeder: TestDataSeeder) {
    this.seeder = seeder;
  }

  /**
   * Basic authentication scenario
   */
  async authOnly(): Promise<TestFixtureData> {
    const users = await this.seeder.seedUsers(5);
    return {
      users,
      parties: [],
      bills: [],
      votes: [],
      parliament: [],
      judiciary: [],
      media: [],
      elections: [],
    };
  }

  /**
   * Parliament-focused scenario
   */
  async parliamentScenario(): Promise<TestFixtureData> {
    const users = await this.seeder.seedUsers(10);
    const parties = await this.seeder.seedParties(3);
    await this.seeder.assignUsersToParties(users, parties);
    const bills = await this.seeder.seedBills(users, 8);
    const parliament = await this.seeder.seedParliamentSessions(bills);
    const votes = await this.seeder.seedVotes(bills, users);

    return {
      users,
      parties,
      bills,
      votes,
      parliament,
      judiciary: [],
      media: [],
      elections: [],
    };
  }

  /**
   * Full simulation scenario
   */
  async fullSimulation(): Promise<TestFixtureData> {
    return this.seeder.seedCompleteScenario();
  }
}
