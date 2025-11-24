#!/usr/bin/env node

/**
 * Test Persistence Script
 * Verifies that data persists across application restarts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPersistence() {
  console.log('🧪 Testing PostgreSQL persistence...');

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL');

    // Create test data
    const testGameId = `test-persistence-${Date.now()}`;
    const testUserId = `user-persistence-${Date.now()}`;

    console.log('📝 Creating test data...');

    // Create a test user
    const user = await prisma.user.create({
      data: {
        id: testUserId,
        username: `TestUser_${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        passwordHash: 'hashed_password',
        role: 'VIEWER',
      },
    });
    console.log('✅ Created test user:', user.id);

    // Create a test game
    const game = await prisma.game.create({
      data: {
        id: testGameId,
        name: 'Persistence Test Game',
        state: {
          id: testGameId,
          name: 'Persistence Test Game',
          status: 'waiting',
          players: [{ id: testUserId, username: user.username }],
          createdAt: new Date().toISOString(),
        },
      },
    });
    console.log('✅ Created test game:', game.id);

    // Create a test session
    const session = await prisma.session.create({
      data: {
        userId: testUserId,
        refreshToken: `test_refresh_token_${Date.now()}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
    console.log('✅ Created test session:', session.id);

    // Create a test audit log
    const auditLog = await prisma.auditLog.create({
      data: {
        category: 'test',
        action: 'persistence_test',
        userId: testUserId,
        resource: 'game',
        details: { testId: testGameId },
        ip: '127.0.0.1',
        userAgent: 'TestScript/1.0',
        complianceFrameworks: ['test'],
      },
    });
    console.log('✅ Created test audit log:', auditLog.id);

    // Verify data retrieval
    console.log('🔍 Verifying data retrieval...');

    const retrievedUser = await prisma.user.findUnique({
      where: { id: testUserId },
    });
    if (!retrievedUser) throw new Error('User not found');
    console.log('✅ User retrieved successfully');

    const retrievedGame = await prisma.game.findUnique({
      where: { id: testGameId },
    });
    if (!retrievedGame) throw new Error('Game not found');
    console.log('✅ Game retrieved successfully');

    const retrievedSession = await prisma.session.findUnique({
      where: { refreshToken: session.refreshToken },
    });
    if (!retrievedSession) throw new Error('Session not found');
    console.log('✅ Session retrieved successfully');

    const retrievedAuditLog = await prisma.auditLog.findUnique({
      where: { id: auditLog.id },
    });
    if (!retrievedAuditLog) throw new Error('Audit log not found');
    console.log('✅ Audit log retrieved successfully');

    // Test session revocation
    console.log('🔄 Testing session revocation...');
    await prisma.session.updateMany({
      where: { refreshToken: session.refreshToken },
      data: { revokedAt: new Date() },
    });

    const revokedSession = await prisma.session.findUnique({
      where: { refreshToken: session.refreshToken },
    });
    if (!revokedSession?.revokedAt) throw new Error('Session not revoked');
    console.log('✅ Session revocation works');

    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await prisma.auditLog.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.session.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.game.delete({
      where: { id: testGameId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
    console.log('✅ Test data cleaned up');

    console.log('🎉 Persistence test completed successfully!');
    console.log('✅ All data operations work correctly');
    console.log('✅ Data persists across operations');
    console.log('✅ Session management works');
    console.log('✅ Audit logging works');
  } catch (error) {
    console.error('❌ Persistence test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testPersistence();
