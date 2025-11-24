#!/usr/bin/env node

/**
 * Data Migration Script: SQLite to PostgreSQL
 *
 * This script migrates existing data from the SQLite database to PostgreSQL.
 * Run this after setting up the PostgreSQL database and before switching the application.
 */

import { Database } from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Database paths
const SQLITE_DB_PATH = path.join(__dirname, '../../../prisma/test.db');

console.log('🚀 Starting data migration from SQLite to PostgreSQL...');

// Initialize databases
let sqliteDb;
let prisma;

try {
  // Check if SQLite database exists
  if (!fs.existsSync(SQLITE_DB_PATH)) {
    console.log('ℹ️  No SQLite database found at', SQLITE_DB_PATH);
    console.log('✅ Migration complete (no data to migrate)');
    process.exit(0);
  }

  console.log('📖 Opening SQLite database...');
  sqliteDb = new Database(SQLITE_DB_PATH, { readonly: true });

  console.log('🔌 Connecting to PostgreSQL...');
  prisma = new PrismaClient();

  // Test connections
  await prisma.$connect();
  console.log('✅ Connected to PostgreSQL');

  // Get all tables from SQLite
  const tables = sqliteDb
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all();
  console.log(
    `📋 Found ${tables.length} tables to migrate:`,
    tables.map(t => t.name)
  );

  let totalMigrated = 0;

  // Migrate each table
  for (const table of tables) {
    const tableName = table.name;
    console.log(`\n🔄 Migrating table: ${tableName}`);

    try {
      // Get all data from SQLite table
      const rows = sqliteDb.prepare(`SELECT * FROM ${tableName}`).all();
      console.log(`   Found ${rows.length} rows`);

      if (rows.length === 0) {
        console.log(`   ⏭️  Skipping empty table`);
        continue;
      }

      // Map table names to Prisma models
      const modelMap = {
        users: 'user',
        games: 'game',
        bills: 'bill',
        votes: 'vote',
        parties: 'party',
        chambers: 'chamber',
        motions: 'motion',
        debates: 'debate',
        debate_votes: 'debateVote',
        governments: 'government',
        ministers: 'minister',
        executive_actions: 'executiveAction',
        cabinet_meetings: 'cabinetMeeting',
        cases: 'case',
        judges: 'judge',
        rulings: 'ruling',
        reviews: 'review',
        precedents: 'precedent',
        press_releases: 'pressRelease',
        polls: 'poll',
        poll_votes: 'pollVote',
        coverage: 'coverage',
        narratives: 'narrative',
        approval_ratings: 'approvalRating',
        elections: 'election',
        campaigns: 'campaign',
        constituencies: 'constituency',
        candidates: 'candidate',
        election_votes: 'electionVote',
      };

      const prismaModel = modelMap[tableName];
      if (!prismaModel) {
        console.log(`   ⚠️  No Prisma model mapping for table ${tableName}, skipping`);
        continue;
      }

      // Check if table already has data (recovery mechanism)
      const existingCount = await prisma[prismaModel].count();
      if (existingCount > 0) {
        console.log(
          `   ⏭️  Table ${tableName} already has ${existingCount} records, skipping migration`
        );
        continue;
      }

      // Migrate data in batches within a transaction
      const batchSize = 100;
      let migrated = 0;

      try {
        await prisma.$transaction(async tx => {
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);

            // Transform data for Prisma
            const transformedBatch = batch.map(row => {
              const transformed = { ...row };

              // Handle JSON fields
              if (tableName === 'games' && row.state) {
                transformed.state = JSON.parse(row.state);
              }

              // Convert SQLite datetime strings to Date objects where needed
              // Prisma handles this automatically for most fields

              return transformed;
            });

            // Insert batch into PostgreSQL
            await tx[prismaModel].createMany({
              data: transformedBatch,
              skipDuplicates: true, // Skip if already exists
            });
            migrated += batch.length;
            console.log(
              `   ✅ Migrated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(rows.length / batchSize)} (${batch.length} rows)`
            );
          }
        });

        console.log(`   ✅ Completed ${tableName}: ${migrated}/${rows.length} rows migrated`);
        totalMigrated += migrated;
      } catch (error) {
        console.error(`   ❌ Failed to migrate table ${tableName}:`, error.message);
        // Transaction rolled back, continue with next table
      }
    } catch (error) {
      console.error(`   ❌ Failed to migrate table ${tableName}:`, error.message);
      // Continue with next table
    }
  }

  console.log(`\n🎉 Migration completed!`);
  console.log(`📊 Total records migrated: ${totalMigrated}`);

  // Additional migration for in-memory data
  console.log('\n🔄 Checking for in-memory data to migrate...');

  // Note: In a real migration, you would need to export in-memory data first
  // For now, we'll just note that audit logs and sessions need to be handled separately
  console.log('ℹ️  Note: Audit logs and user sessions were previously stored in-memory.');
  console.log('ℹ️  These will be created fresh in PostgreSQL as the application runs.');
  console.log('ℹ️  If you have critical audit data, implement custom export/import logic.');
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  if (sqliteDb) {
    sqliteDb.close();
    console.log('🔒 SQLite database closed');
  }
  if (prisma) {
    await prisma.$disconnect();
    console.log('🔌 PostgreSQL connection closed');
  }
}
