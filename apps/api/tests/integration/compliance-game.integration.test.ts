import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
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

describe('Compliance and Game Service Integration', () => {
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Game Creation and Compliance Logging', () => {
    it('should log compliance event when game is created', async () => {
      const mockGame = {
        id: 'game-123',
        name: 'Test Game',
        state: { id: 'game-123', name: 'Test Game' },
      };

      mockPrisma.game.create.mockResolvedValue(mockGame);
      mockPrisma.auditLog.create.mockResolvedValue({
        id: 'audit-123',
        timestamp: new Date(),
        category: 'game_management',
        action: 'game_created',
      });

      await gameService.createGame('creator-123', 'Creator', 'Test Game');

      // Verify compliance event was logged
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: 'game_management',
            action: 'game_created',
            userId: 'creator-123',
          }),
        })
      );
    });

    it('should log player join events', async () => {
      const mockGame = {
        id: 'game-123',
        status: 'waiting',
        players: [{ id: 'creator', username: 'Creator' }],
        settings: { maxPlayers: 4 },
        ageVerificationRequired: false,
      };

      mockPrisma.game.findUnique.mockResolvedValue({ state: mockGame });
      mockPrisma.game.update.mockResolvedValue({
        state: {
          ...mockGame,
          players: [...mockGame.players, { id: 'player-123', username: 'Player' }],
        },
      });
      mockPrisma.auditLog.create.mockResolvedValue({
        id: 'audit-124',
        timestamp: new Date(),
        category: 'game_management',
        action: 'player_joined',
      });

      await gameService.joinGame('game-123', 'player-123', 'Player');

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: 'game_management',
            action: 'player_joined',
            userId: 'player-123',
          }),
        })
      );
    });
  });

  describe('Content Moderation Integration', () => {
    beforeEach(() => {
      vi.mocked(global.fetch).mockClear();
    });

    it('should log moderation checks for remote API calls', async () => {
      process.env.API_MODERATION_URL = 'http://moderation.example.com/analyze';

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { isSafe: true, reasons: [] } }),
      } as unknown as Response);

      mockPrisma.auditLog.create.mockResolvedValue({
        id: 'audit-125',
        timestamp: new Date(),
        category: 'content_moderation',
        action: 'moderation_checked',
      });

      await (
        gameService as unknown as {
          remoteModeration: (content: string, userId: string) => Promise<unknown>;
        }
      ).remoteModeration('safe content', 'user-123');

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: 'content_moderation',
            action: 'moderation_checked',
            userId: 'user-123',
          }),
        })
      );
    });

    it('should log moderation API failures', async () => {
      process.env.API_MODERATION_URL = 'http://moderation.example.com/analyze';

      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      mockPrisma.auditLog.create.mockResolvedValue({
        id: 'audit-126',
        timestamp: new Date(),
        category: 'content_moderation',
        action: 'moderation_api_failure',
      });

      await (
        gameService as unknown as {
          remoteModeration: (content: string, userId?: string) => Promise<unknown>;
        }
      ).remoteModeration('test content');

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: 'content_moderation',
            action: 'moderation_api_failure',
            userId: 'system',
          }),
        })
      );
    });
  });

  describe('Proposal Review and Compliance', () => {
    it('should log proposal approval events', async () => {
      const mockGame = {
        id: 'game-123',
        proposals: [{ id: 'prop-1', status: 'flagged', flaggedReasons: ['inappropriate'] }],
      };

      mockPrisma.game.findUnique.mockResolvedValue({ state: mockGame });
      mockPrisma.game.update.mockResolvedValue({ state: mockGame });
      mockPrisma.auditLog.create.mockResolvedValue({
        id: 'audit-127',
        timestamp: new Date(),
        category: 'content_moderation',
        action: 'proposal_approved',
      });

      await gameService.reviewFlaggedProposal(
        'game-123',
        'prop-1',
        'moderator-123',
        'approve',
        'Approved after review'
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: 'content_moderation',
            action: 'proposal_approved',
            userId: 'moderator-123',
          }),
        })
      );
    });

    it('should log proposal rejection events', async () => {
      const mockGame = {
        id: 'game-123',
        proposals: [{ id: 'prop-1', status: 'flagged', flaggedReasons: ['inappropriate'] }],
      };

      mockPrisma.game.findUnique.mockResolvedValue({ state: mockGame });
      mockPrisma.game.update.mockResolvedValue({ state: mockGame });
      mockPrisma.auditLog.create.mockResolvedValue({
        id: 'audit-128',
        timestamp: new Date(),
        category: 'content_moderation',
        action: 'proposal_rejected',
      });

      await gameService.reviewFlaggedProposal(
        'game-123',
        'prop-1',
        'moderator-123',
        'reject',
        'Rejected due to policy violation'
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: 'content_moderation',
            action: 'proposal_rejected',
            userId: 'moderator-123',
          }),
        })
      );
    });
  });

  describe('Age Verification Integration', () => {
    beforeEach(() => {
      vi.mocked(global.fetch).mockClear();
    });

    it('should handle age verification API calls during game join', async () => {
      process.env.API_BASE_URL = 'http://api.example.com';

      const mockGame = {
        id: 'game-123',
        status: 'waiting',
        players: [{ id: 'creator', username: 'Creator' }],
        settings: { maxPlayers: 4 },
        ageVerificationRequired: true,
      };

      mockPrisma.game.findUnique.mockResolvedValue({ state: mockGame });
      mockPrisma.game.update.mockResolvedValue({
        state: {
          ...mockGame,
          players: [...mockGame.players, { id: 'player-123', username: 'Player' }],
        },
      });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { verified: true, age: 25 } }),
      } as unknown as Response);

      await gameService.joinGame('game-123', 'player-123', 'Player');

      expect(vi.mocked(global.fetch)).toHaveBeenCalledWith(
        'http://api.example.com/api/age/status',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer player-123',
          }),
        })
      );
    });

    it('should deny game join when age verification fails', async () => {
      process.env.API_BASE_URL = 'http://api.example.com';

      const mockGame = {
        id: 'game-123',
        status: 'waiting',
        players: [{ id: 'creator', username: 'Creator' }],
        settings: { maxPlayers: 4 },
        ageVerificationRequired: true,
      };

      mockPrisma.game.findUnique.mockResolvedValue({ state: mockGame });

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { verified: false } }),
      } as unknown as Response);

      await expect(gameService.joinGame('game-123', 'player-123', 'Player')).rejects.toThrow(
        'Age verification required'
      );
    });
  });

  describe('Content Access Control Integration', () => {
    beforeEach(() => {
      vi.mocked(global.fetch).mockClear();
    });

    it('should check content access for age-restricted content', async () => {
      process.env.API_BASE_URL = 'http://api.example.com';

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { canAccess: true } }),
      } as unknown as Response);

      const result = await (
        gameService as unknown as {
          checkContentAccess: (userId: string, rating: string) => Promise<boolean>;
        }
      ).checkContentAccess('user-123', 'R');

      expect(result).toBe(true);
      expect(vi.mocked(global.fetch)).toHaveBeenCalledWith(
        'http://api.example.com/api/age/check-access',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer user-123',
          }),
          body: JSON.stringify({ contentRating: 'R' }),
        })
      );
    });

    it('should deny access when age check fails', async () => {
      process.env.API_BASE_URL = 'http://api.example.com';

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { canAccess: false } }),
      } as unknown as Response);

      const result = await (
        gameService as unknown as {
          checkContentAccess: (userId: string, rating: string) => Promise<boolean>;
        }
      ).checkContentAccess('user-123', 'R');

      expect(result).toBe(false);
    });
  });

  describe('Compliance Dashboard Integration', () => {
    it('should aggregate compliance data from multiple sources', async () => {
      const mockAuditEntries = [
        {
          id: 'audit-1',
          timestamp: new Date(),
          category: 'game_management',
          action: 'game_created',
          userId: 'user-1',
          complianceFrameworks: ['DSA'],
        },
        {
          id: 'audit-2',
          timestamp: new Date(),
          category: 'content_moderation',
          action: 'moderation_checked',
          userId: 'user-2',
          complianceFrameworks: ['GDPR'],
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockAuditEntries);

      const dashboard = await complianceService.getComplianceDashboard();

      expect(dashboard.totalEvents).toBe(2);
      expect(dashboard.eventsByCategory.game_management).toBe(1);
      expect(dashboard.eventsByCategory.content_moderation).toBe(1);
    });

    it('should calculate compliance score based on alerts', async () => {
      // Add some alerts
      (
        complianceService as unknown as {
          alerts: Array<{ id: string; status: string; severity: string }>;
        }
      ).alerts = [
        { id: 'alert-1', status: 'active', severity: 'high' },
        { id: 'alert-2', status: 'resolved', severity: 'medium' },
      ];

      const dashboard = await complianceService.getComplianceDashboard();

      expect(dashboard.activeAlerts).toBe(1);
      expect(dashboard.resolvedAlerts).toBe(1);
      expect(dashboard.complianceScore).toBeDefined();
    });
  });

  describe('Subject Rights Request Processing', () => {
    it('should process data access requests end-to-end', async () => {
      // Create request
      const requestId = complianceService.requestDataAccess('user-123');

      // Process request
      const processed = complianceService.processSubjectRightsRequest(
        requestId,
        'approve',
        'admin-123',
        'Access granted'
      );

      expect(processed).toBe(true);

      // Verify request status
      const requests = complianceService.getSubjectRightsRequests({ userId: 'user-123' });
      expect(requests[0].status).toBe('completed');
    });

    it('should handle data deletion requests', async () => {
      const requestId = complianceService.requestDataDeletion(
        'user-123',
        'User requested deletion'
      );

      const processed = complianceService.processSubjectRightsRequest(
        requestId,
        'approve',
        'admin-123',
        'Deletion approved'
      );

      expect(processed).toBe(true);

      const requests = complianceService.getSubjectRightsRequests({ requestType: 'deletion' });
      expect(requests[0].status).toBe('completed');
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle database failures gracefully', async () => {
      mockPrisma.game.create.mockRejectedValue(new Error('Database connection failed'));

      await expect(gameService.createGame('creator-123', 'Creator', 'Test Game')).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should handle API timeouts', async () => {
      process.env.API_MODERATION_URL = 'http://moderation.example.com/analyze';

      vi.mocked(global.fetch).mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 11000);
          })
      );

      const result = await (
        gameService as unknown as {
          remoteModeration: (content: string, userId?: string) => Promise<unknown>;
        }
      ).remoteModeration('test content');

      expect(result).toBeNull();
    });

    it('should continue operation when compliance logging fails', async () => {
      mockPrisma.auditLog.create.mockRejectedValue(new Error('Audit log failed'));

      const mockGame = {
        id: 'game-123',
        name: 'Test Game',
        state: { id: 'game-123', name: 'Test Game' },
      };

      mockPrisma.game.create.mockResolvedValue(mockGame);

      // Should still succeed despite audit logging failure
      const result = await gameService.createGame('creator-123', 'Creator', 'Test Game');

      expect(result).toBeDefined();
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple concurrent game operations', async () => {
      const mockGame = {
        id: 'game-123',
        status: 'active',
        players: [{ id: 'player-123', username: 'Player' }],
        proposals: [],
        votes: [],
        economy: { treasury: 1000 },
        turn: { turnNumber: 1, phase: 'lobby' },
        currentTurn: 1,
        phase: 'legislative',
      };

      mockPrisma.game.findUnique.mockResolvedValue({ state: mockGame });
      mockPrisma.game.update.mockResolvedValue({ state: mockGame });
      mockAdvanceGameState.mockReturnValue(mockGame);

      const actions = Array(10).fill({
        type: 'propose' as const,
        playerId: 'player-123',
        payload: { title: 'Test Proposal' },
      });

      // Execute multiple actions concurrently
      const promises = actions.map(action => gameService.processAction('game-123', action));

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('should handle large audit log exports', async () => {
      const mockEntries = Array(1000)
        .fill(null)
        .map((_, i) => ({
          id: `audit-${i}`,
          timestamp: new Date(),
          category: 'test',
          action: 'test_action',
          userId: `user-${i % 10}`,
          resource: 'test',
          details: { index: i },
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          complianceFrameworks: ['GDPR'],
          user: null,
        }));

      mockPrisma.auditLog.findMany.mockResolvedValue(mockEntries);

      const exported = await complianceService.exportAuditLog();

      expect(exported).toHaveLength(1000);
    });
  });
});
