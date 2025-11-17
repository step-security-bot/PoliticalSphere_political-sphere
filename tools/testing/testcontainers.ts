/**
 * Testcontainers Configuration for Isolated Database Testing
 *
 * Provides utilities for:
 * - In-memory SQLite databases for fast unit tests
 * - Containerized PostgreSQL databases for integration tests
 * - Database migration and seeding utilities
 */

import { GenericContainer, StartedTestContainer } from 'testcontainers';
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface DatabaseConfig {
  type: 'sqlite' | 'postgresql';
  database?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
}

export interface TestDatabase {
  config: DatabaseConfig;
  container?: StartedTestContainer;
  sqliteDb?: Database.Database;
  close: () => Promise<void>;
}

/**
 * Create an in-memory SQLite database for fast unit testing
 */
export async function createSQLiteDatabase(
  schemaPath?: string,
  seedData?: string[]
): Promise<TestDatabase> {
  const db = new Database(':memory:');

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Load schema if provided
  if (schemaPath) {
    const schema = await fs.readFile(schemaPath, 'utf-8');
    db.exec(schema);
  }

  // Seed data if provided
  if (seedData) {
    for (const seed of seedData) {
      db.exec(seed);
    }
  }

  return {
    config: { type: 'sqlite' },
    sqliteDb: db,
    close: async () => {
      db.close();
    },
  };
}

/**
 * Create a PostgreSQL container for integration testing
 */
export async function createPostgreSQLDatabase(
  databaseName = 'test_db',
  schemaPath?: string,
  seedData?: string[]
): Promise<TestDatabase> {
  const container = await new GenericContainer('postgres:15-alpine')
    .withEnvironment({
      POSTGRES_DB: databaseName,
      POSTGRES_USER: 'testuser',
      POSTGRES_PASSWORD: 'testpass',
    })
    .withExposedPorts(5432)
    .start();

  const config: DatabaseConfig = {
    type: 'postgresql',
    database: databaseName,
    host: container.getHost(),
    port: container.getMappedPort(5432),
    username: 'testuser',
    password: 'testpass',
  };

  // Wait for database to be ready
  await waitForPostgresReady(config);

  // Load schema if provided
  if (schemaPath) {
    await loadPostgresSchema(config, schemaPath);
  }

  // Seed data if provided
  if (seedData) {
    await seedPostgresData(config, seedData);
  }

  return {
    config,
    container,
    close: async () => {
      await container.stop();
    },
  };
}

/**
 * Wait for PostgreSQL to be ready
 */
async function waitForPostgresReady(config: DatabaseConfig): Promise<void> {
  const { Client } = await import('pg');
  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
  });

  let retries = 30;
  while (retries > 0) {
    try {
      await client.connect();
      await client.end();
      return;
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Load schema into PostgreSQL database
 */
async function loadPostgresSchema(config: DatabaseConfig, schemaPath: string): Promise<void> {
  const { Client } = await import('pg');
  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
  });

  await client.connect();
  try {
    const schema = await fs.readFile(schemaPath, 'utf-8');
    await client.query(schema);
  } finally {
    await client.end();
  }
}

/**
 * Seed data into PostgreSQL database
 */
async function seedPostgresData(config: DatabaseConfig, seedData: string[]): Promise<void> {
  const { Client } = await import('pg');
  const client = new Client({
    host: config.host,
    port: config.port,
    user: config.username,
    password: config.password,
    database: config.database,
  });

  await client.connect();
  try {
    for (const seed of seedData) {
      await client.query(seed);
    }
  } finally {
    await client.end();
  }
}

/**
 * Database migration utilities
 */
export class DatabaseMigrator {
  constructor(private db: TestDatabase) {}

  async runMigrations(migrationsPath: string): Promise<void> {
    const migrationFiles = await fs.readdir(migrationsPath);
    const sqlFiles = migrationFiles.filter(file => file.endsWith('.sql')).sort();

    for (const file of sqlFiles) {
      const migrationSQL = await fs.readFile(path.join(migrationsPath, file), 'utf-8');

      if (this.db.config.type === 'sqlite' && this.db.sqliteDb) {
        this.db.sqliteDb.exec(migrationSQL);
      } else if (this.db.config.type === 'postgresql') {
        const { Client } = await import('pg');
        const client = new Client({
          host: this.db.config.host,
          port: this.db.config.port,
          user: this.db.config.username,
          password: this.db.config.password,
          database: this.db.config.database,
        });

        await client.connect();
        try {
          await client.query(migrationSQL);
        } finally {
          await client.end();
        }
      }
    }
  }

  async seedDatabase(seedPath: string): Promise<void> {
    const seedFiles = await fs.readdir(seedPath);
    const sqlFiles = seedFiles.filter(file => file.endsWith('.sql')).sort();

    for (const file of sqlFiles) {
      const seedSQL = await fs.readFile(path.join(seedPath, file), 'utf-8');

      if (this.db.config.type === 'sqlite' && this.db.sqliteDb) {
        this.db.sqliteDb.exec(seedSQL);
      } else if (this.db.config.type === 'postgresql') {
        const { Client } = await import('pg');
        const client = new Client({
          host: this.db.config.host,
          port: this.db.config.port,
          user: this.db.config.username,
          password: this.db.config.password,
          database: this.db.config.database,
        });

        await client.connect();
        try {
          await client.query(seedSQL);
        } finally {
          await client.end();
        }
      }
    }
  }
}

/**
 * Test database factory
 */
export class TestDatabaseFactory {
  static async createSQLite(
    options: {
      schemaPath?: string;
      seedData?: string[];
      migrationsPath?: string;
      seedPath?: string;
    } = {}
  ): Promise<TestDatabase> {
    const db = await createSQLiteDatabase(options.schemaPath, options.seedData);

    if (options.migrationsPath || options.seedPath) {
      const migrator = new DatabaseMigrator(db);
      if (options.migrationsPath) {
        await migrator.runMigrations(options.migrationsPath);
      }
      if (options.seedPath) {
        await migrator.seedDatabase(options.seedPath);
      }
    }

    return db;
  }

  static async createPostgreSQL(
    options: {
      databaseName?: string;
      schemaPath?: string;
      seedData?: string[];
      migrationsPath?: string;
      seedPath?: string;
    } = {}
  ): Promise<TestDatabase> {
    const db = await createPostgreSQLDatabase(
      options.databaseName,
      options.schemaPath,
      options.seedData
    );

    if (options.migrationsPath || options.seedPath) {
      const migrator = new DatabaseMigrator(db);
      if (options.migrationsPath) {
        await migrator.runMigrations(options.migrationsPath);
      }
      if (options.seedPath) {
        await migrator.seedDatabase(options.seedPath);
      }
    }

    return db;
  }
}
