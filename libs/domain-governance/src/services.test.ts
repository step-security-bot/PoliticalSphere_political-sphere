import { describe, it, expect, beforeEach } from 'vitest';
import { GovernmentService, ParliamentService } from './services.js';
import type {
  CreateGovernmentInput,
  CreateMinisterInput,
  CreateExecutiveActionInput,
  CreateCabinetMeetingInput,
} from './types.js';

describe('GovernmentService', () => {
  let governmentService: GovernmentService;

  beforeEach(() => {
    governmentService = new GovernmentService();
  });

  describe('createGovernment', () => {
    it('should create a government with valid input', async () => {
      const input: CreateGovernmentInput = {
        name: 'Test Government',
        leaderId: 'user-123',
      };

      const result = await governmentService.createGovernment(input);

      expect(result).toBeDefined();
      expect(result.name).toBe(input.name);
      expect(result.leaderId).toBe(input.leaderId);
      expect(result.status).toBe('active');
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('getGovernment', () => {
    it('should return null for non-existent government', async () => {
      const result = await governmentService.getGovernment('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle empty string input', async () => {
      const result = await governmentService.getGovernment('');
      expect(result).toBeNull();
    });
  });

  describe('dissolveGovernment', () => {
    it('should return null for non-existent government', async () => {
      const result = await governmentService.dissolveGovernment('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle empty string input', async () => {
      const result = await governmentService.dissolveGovernment('');
      expect(result).toBeNull();
    });
  });

  describe('getMinister', () => {
    it('should return null for non-existent minister', async () => {
      const result = await governmentService.getMinister('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle empty string input', async () => {
      const result = await governmentService.getMinister('');
      expect(result).toBeNull();
    });
  });

  describe('signExecutiveAction', () => {
    it('should return null for non-existent executive action', async () => {
      const result = await governmentService.signExecutiveAction('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle empty string input', async () => {
      const result = await governmentService.signExecutiveAction('');
      expect(result).toBeNull();
    });
  });

  describe('createMinister', () => {
    it('should create a minister with valid input', async () => {
      const input: CreateMinisterInput = {
        userId: 'user-123',
        governmentId: 'government-456',
        portfolio: 'Finance',
      };

      const result = await governmentService.createMinister(input);

      expect(result).toBeDefined();
      expect(result.userId).toBe(input.userId);
      expect(result.governmentId).toBe(input.governmentId);
      expect(result.portfolio).toBe(input.portfolio);
      expect(result.id).toBeDefined();
      expect(result.appointedAt).toBeInstanceOf(Date);
    });
  });

  describe('createExecutiveAction', () => {
    it('should create an executive action with valid input', async () => {
      const input: CreateExecutiveActionInput = {
        title: 'Budget Decree',
        description: 'Emergency budget allocation',
        type: 'decree',
      };

      const result = await governmentService.createExecutiveAction(input);

      expect(result).toBeDefined();
      expect(result.title).toBe(input.title);
      expect(result.description).toBe(input.description);
      expect(result.type).toBe(input.type);
      expect(result.status).toBe('proposed');
      expect(result.id).toBeDefined();
    });
  });

  describe('createCabinetMeeting', () => {
    it('should create a cabinet meeting with valid input', async () => {
      const input: CreateCabinetMeetingInput = {
        title: 'Weekly Cabinet Meeting',
        agenda: 'Discuss budget and policy',
        scheduledAt: new Date(),
      };

      const result = await governmentService.createCabinetMeeting(input);

      expect(result).toBeDefined();
      expect(result.title).toBe(input.title);
      expect(result.agenda).toBe(input.agenda);
      expect(result.scheduledAt).toBe(input.scheduledAt);
      expect(result.status).toBe('scheduled');
      expect(result.id).toBeDefined();
    });
  });
});

describe('ParliamentService', () => {
  let parliamentService: ParliamentService;

  beforeEach(() => {
    parliamentService = new ParliamentService();
  });

  describe('createChamber', () => {
    it('should create a chamber with valid input', async () => {
      const input = {
        gameId: 'game-123',
        type: 'commons' as const,
        name: 'House of Commons',
        maxSeats: 650,
        quorumPercentage: 40,
      };

      const result = await parliamentService.createChamber(input);

      expect(result).toBeDefined();
      expect(result.gameId).toBe(input.gameId);
      expect(result.name).toBe(input.name);
      expect(result.type).toBe(input.type);
      expect(result.maxSeats).toBe(input.maxSeats);
      expect(result.quorumPercentage).toBe(input.quorumPercentage);
      expect(result.id).toBeDefined();
    });
  });

  describe('getChamber', () => {
    it('should return null for non-existent chamber', async () => {
      const result = await parliamentService.getChamber('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle empty string input', async () => {
      const result = await parliamentService.getChamber('');
      expect(result).toBeNull();
    });
  });

  describe('getMotion', () => {
    it('should return null for non-existent motion', async () => {
      const result = await parliamentService.getMotion('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle empty string input', async () => {
      const result = await parliamentService.getMotion('');
      expect(result).toBeNull();
    });
  });

  describe('startVoting', () => {
    it('should return null for non-existent motion', async () => {
      const result = await parliamentService.startVoting('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle empty string input', async () => {
      const result = await parliamentService.startVoting('');
      expect(result).toBeNull();
    });
  });

  describe('closeVoting', () => {
    it('should return null for non-existent motion', async () => {
      const result = await parliamentService.closeVoting('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle empty string input', async () => {
      const result = await parliamentService.closeVoting('');
      expect(result).toBeNull();
    });
  });

  describe('createMotion', () => {
    it('should create a motion with valid input', async () => {
      const input = {
        gameId: 'game-123',
        chamberId: 'chamber-456',
        proposerId: 'user-789',
        type: 'debate' as const,
        title: 'Budget Debate',
        description: 'Debate on the annual budget',
      };

      const result = await parliamentService.createMotion(input);

      expect(result).toBeDefined();
      expect(result.gameId).toBe(input.gameId);
      expect(result.chamberId).toBe(input.chamberId);
      expect(result.proposerId).toBe(input.proposerId);
      expect(result.type).toBe(input.type);
      expect(result.title).toBe(input.title);
      expect(result.description).toBe(input.description);
      expect(result.status).toBe('proposed');
      expect(result.id).toBeDefined();
    });
  });

  describe('scheduleDebate', () => {
    it('should schedule a debate with valid input', async () => {
      const input = {
        motionId: 'motion-123',
        startTime: new Date(),
        duration: 3600,
        speakingOrder: ['user-1', 'user-2'],
        timePerSpeaker: 300,
      };

      const result = await parliamentService.scheduleDebate(input);

      expect(result).toBeDefined();
      expect(result.motionId).toBe(input.motionId);
      expect(result.startTime).toBe(input.startTime);
      expect(result.duration).toBe(input.duration);
      expect(result.speakingOrder).toEqual(input.speakingOrder);
      expect(result.timePerSpeaker).toBe(input.timePerSpeaker);
      expect(result.status).toBe('scheduled');
      expect(result.id).toBeDefined();
    });
  });

  describe('castVote', () => {
    it('should cast a parliament vote with valid input', async () => {
      const input = {
        motionId: 'motion-123',
        userId: 'user-456',
        vote: 'aye' as const,
      };

      const result = await parliamentService.castVote(input);

      expect(result).toBeDefined();
      expect(result.motionId).toBe(input.motionId);
      expect(result.userId).toBe(input.userId);
      expect(result.vote).toBe(input.vote);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('getVoteResults', () => {
    it('should return zero results for non-existent motion', async () => {
      const result = await parliamentService.getVoteResults('non-existent-motion');
      expect(result).toEqual({
        total: 0,
        aye: 0,
        no: 0,
        abstain: 0,
      });
    });
  });
});
