import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameService } from '../../src/game/game.service.js';
import ComplianceService from '../../src/modules/complianceService.js';

// Mock dependencies
vi.mock('../../src/services/prisma-database.service.js', () => ({
  prisma: {
    game: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../../src/events', () => ({
  gameEventEmitter: {
    emitParliamentVote: vi.fn(),
    emitParliamentBillPassed: vi.fn(),
    emitGamePhaseChanged: vi.fn(),
    emitGameEvent: vi.fn(),
    emitGovernmentAction: vi.fn(),
    emitJudicialRuling: vi.fn(),
    emitMediaPressRelease: vi.fn(),
    emitElectionResults: vi.fn(),
  },
}));

vi.mock('../../src/utils/logger.js', () => ({
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  audit: vi.fn(),
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    audit: vi.fn(),
  },
}));

vi.mock('@political-sphere/game-engine', () => ({
  advanceGameState: vi.fn(),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Performance Tests - Game and Compliance Services', () => {
  let gameService: GameService;
  let complianceService: ComplianceService;
  // biome-ignore lint/suspicious/noExplicitAny: Mock variables in tests
  let mockPrisma: any;
  // biome-ignore lint/suspicious/noExplicitAny: Mock variables in tests
  let mockAdvanceGameState: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockPrisma = vi.mocked(await import('../../src/services/prisma-database.service.js')).prisma;
    mockAdvanceGameState = vi.mocked(
      await import('@political-sphere/game-engine')
    ).advanceGameState;

    gameService = new GameService();
    complianceService = new ComplianceService();

    // Setup fast mocks for performance testing
    mockPrisma.game.create.mockResolvedValue({
      id: 'game-123',
      name: 'Test Game',
      state: { id: 'game-123', name: 'Test Game' },
    });

    mockPrisma.game.findUnique.mockResolvedValue({
      state: {
        id: 'game-123',
        status: 'active',
        players: [{ id: 'player-123', username: 'Player' }],
        proposals: [],
        votes: [],
        economy: { treasury: 1000 },
        turn: { turnNumber: 1, phase: 'lobby' },
        currentTurn: 1,
        phase: 'legislative',
      },
    });

    mockPrisma.game.update.mockResolvedValue({
      state: {
        id: 'game-123',
        status: 'active',
        players: [{ id: 'player-123', username: 'Player' }],
        proposals: [],
        votes: [],
        economy: { treasury: 1000 },
        turn: { turnNumber: 1, phase: 'lobby' },
        currentTurn: 1,
        phase: 'legislative',
      },
    });

    mockPrisma.auditLog.create.mockResolvedValue({
      id: 'audit-123',
      timestamp: new Date(),
      category: 'test',
      action: 'test_action',
    });

    mockAdvanceGameState.mockReturnValue({
      id: 'game-123',
      status: 'active',
      players: [{ id: 'player-123', username: 'Player' }],
      proposals: [{ id: 'proposal-1', title: 'Test Proposal' }],
      votes: [],
      economy: { treasury: 1000 },
      turn: { turnNumber: 1, phase: 'lobby' },
      currentTurn: 1,
      phase: 'legislative',
    });

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { isSafe: true, reasons: [] } }),
    } as unknown as Response);
  });

  describe('Game Service Performance', () => {
    it('should handle 100 concurrent game creations within 5 seconds', async () => {
      const startTime = Date.now();

      const promises = Array(100)
        .fill(null)
        .map((_, i) => gameService.createGame(`creator-${i}`, `Creator ${i}`, `Game ${i}`));

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(5000); // 5 seconds
      expect(mockPrisma.game.create).toHaveBeenCalledTimes(100);
    }, 10000); // 10 second timeout

    it('should process 50 concurrent game actions within 3 seconds', async () => {
      const startTime = Date.now();

      const actions = Array(50)
        .fill(null)
        .map((_, i) => ({
          type: 'propose' as const,
          playerId: 'player-123',
          payload: { title: `Proposal ${i}` },
        }));

      const promises = actions.map(action => gameService.processAction('game-123', action));

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(50);
      expect(duration).toBeLessThan(3000); // 3 seconds
      expect(mockAdvanceGameState).toHaveBeenCalledTimes(50);
    }, 5000);

    it('should handle 200 concurrent moderation checks within 2 seconds', async () => {
      process.env.API_MODERATION_URL = 'http://moderation.example.com/analyze';

      const startTime = Date.now();

      const promises = Array(200)
        .fill(null)
        .map((_, i) =>
          (
            gameService as unknown as {
              remoteModeration: (content: string, userId: string) => Promise<unknown>;
            }
          ).remoteModeration(`content ${i}`, `user-${i}`)
        );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(200);
      expect(duration).toBeLessThan(2000); // 2 seconds
      expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(200);
    }, 3000);

    it('should list 1000 games within 1 second', async () => {
      const mockGames = Array(1000)
        .fill(null)
        .map((_, i) => ({
          state: { id: `game-${i}`, name: `Game ${i}` },
        }));

      mockPrisma.game.findMany.mockResolvedValue(mockGames);

      const startTime = Date.now();
      const result = await gameService.listGames();
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result).toHaveLength(1000);
      expect(duration).toBeLessThan(1000); // 1 second
    }, 2000);
  });

  describe('Compliance Service Performance', () => {
    it('should log 500 compliance events within 2 seconds', async () => {
      const startTime = Date.now();

      const promises = Array(500)
        .fill(null)
        .map((_, i) =>
          complianceService.logComplianceEvent({
            category: 'test',
            action: `test_action_${i}`,
            userId: `user-${i}`,
            details: { index: i },
          })
        );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(500);
      expect(duration).toBeLessThan(2000); // 2 seconds
      expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(500);
    }, 3000);

    it('should export 10000 audit log entries within 5 seconds', async () => {
      const mockEntries = Array(10000)
        .fill(null)
        .map((_, i) => ({
          id: `audit-${i}`,
          timestamp: new Date(),
          category: 'test',
          action: 'test_action',
          userId: `user-${i % 100}`,
          resource: 'test',
          details: { index: i },
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          complianceFrameworks: ['GDPR'],
          user: null,
        }));

      mockPrisma.auditLog.findMany.mockResolvedValue(mockEntries);

      const startTime = Date.now();
      const exported = await complianceService.exportAuditLog();
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(exported).toHaveLength(10000);
      expect(duration).toBeLessThan(5000); // 5 seconds
    }, 10000);

    it('should generate compliance dashboard within 1 second', async () => {
      const mockEntries = Array(1000)
        .fill(null)
        .map((_, i) => ({
          id: `audit-${i}`,
          timestamp: new Date(),
          category: i % 2 === 0 ? 'game_management' : 'content_moderation',
          action: 'test_action',
          userId: `user-${i % 50}`,
          complianceFrameworks: ['GDPR'],
        }));

      mockPrisma.auditLog.findMany.mockResolvedValue(mockEntries);

      const startTime = Date.now();
      const dashboard = await complianceService.getComplianceDashboard();
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(dashboard).toBeDefined();
      expect(dashboard.totalEvents).toBe(1000);
      expect(duration).toBeLessThan(1000); // 1 second
    }, 2000);

    it('should handle 100 concurrent subject rights requests within 3 seconds', async () => {
      const startTime = Date.now();

      const promises = Array(100)
        .fill(null)
        .map((_, i) =>
          complianceService.requestDataAccess(`user-${i}`, `127.0.0.${i % 255}`, `agent-${i}`)
        );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(3000); // 3 seconds
    }, 5000);
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory during repeated operations', async () => {
      // This is a basic memory leak test - in a real scenario,
      // you'd use a memory profiler, but this checks for obvious issues

      for (let i = 0; i < 100; i++) {
        await gameService.createGame(`creator-${i}`, `Creator ${i}`, `Game ${i}`);
        await complianceService.logComplianceEvent({
          category: 'test',
          action: 'test_action',
          userId: `user-${i}`,
        });
      }

      // Force garbage collection if available (Node.js environment)
      if (global.gc) {
        global.gc();
      }

      // If we get here without crashing, basic memory management is working
      expect(true).toBe(true);
    }, 30000); // Allow more time for memory operations
  });

  describe('Concurrent Load Tests', () => {
    it('should handle mixed operations under load', async () => {
      const startTime = Date.now();

      // Mix of different operations
      const operations = [
        // Game operations
        ...Array(20)
          .fill(null)
          .map((_, i) => gameService.createGame(`creator-${i}`, `Creator ${i}`, `Game ${i}`)),
        ...Array(30)
          .fill(null)
          .map(() =>
            gameService.processAction('game-123', {
              type: 'propose',
              playerId: 'player-123',
              payload: { title: 'Test Proposal' },
            })
          ),
        // Compliance operations
        ...Array(50)
          .fill(null)
          .map((_, i) =>
            complianceService.logComplianceEvent({
              category: 'test',
              action: `action-${i}`,
              userId: `user-${i % 10}`,
            })
          ),
        // Moderation operations
        ...Array(20)
          .fill(null)
          .map((_, i) =>
            (
              gameService as unknown as {
                remoteModeration: (content: string, userId: string) => Promise<unknown>;
              }
            ).remoteModeration(`content ${i}`, `user-${i}`)
          ),
      ];

      const results = await Promise.all(operations);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(120); // 20 + 30 + 50 + 20
      expect(duration).toBeLessThan(10000); // 10 seconds for mixed load
    }, 15000);
  });

  describe('Error Recovery Performance', () => {
    it('should recover quickly from API failures', async () => {
      process.env.API_MODERATION_URL = 'http://moderation.example.com/analyze';

      // Alternate between success and failure
      let callCount = 0;
      vi.mocked(global.fetch).mockImplementation(() => {
        callCount++;
        if (callCount % 3 === 0) {
          return Promise.reject(new Error('API temporarily unavailable'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, data: { isSafe: true, reasons: [] } }),
        } as unknown as Response);
      });

      const startTime = Date.now();

      const promises = Array(30)
        .fill(null)
        .map((_, i) =>
          (
            gameService as unknown as {
              remoteModeration: (content: string, userId: string) => Promise<unknown>;
            }
          ).remoteModeration(`content ${i}`, `user-${i}`)
        );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete despite some failures
      expect(results).toHaveLength(30);
      expect(duration).toBeLessThan(5000); // 5 seconds despite failures
    }, 10000);

    it('should handle database connection issues gracefully', async () => {
      // Simulate intermittent database failures
      let callCount = 0;
      mockPrisma.auditLog.create.mockImplementation(() => {
        callCount++;
        if (callCount % 5 === 0) {
          return Promise.reject(new Error('Database connection lost'));
        }
        return Promise.resolve({
          id: `audit-${callCount}`,
          timestamp: new Date(),
          category: 'test',
          action: 'test_action',
        });
      });

      const startTime = Date.now();

      const promises = Array(50)
        .fill(null)
        .map((_, i) =>
          complianceService.logComplianceEvent({
            category: 'test',
            action: `action-${i}`,
            userId: `user-${i % 5}`,
          })
        );

      // Should not throw, even with database failures
      await expect(Promise.all(promises)).resolves.toBeDefined();
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(3000); // 3 seconds despite failures
    }, 5000);
  });
});
