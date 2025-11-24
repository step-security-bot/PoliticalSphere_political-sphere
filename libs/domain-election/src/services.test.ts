import { describe, it, expect, beforeEach } from 'vitest';
import { ElectionService, VoteService } from './services.js';
import type { CreateElectionInput, CreateVoteInput } from './types.js';

describe('ElectionService', () => {
  let electionService: ElectionService;

  beforeEach(() => {
    electionService = new ElectionService();
  });

  describe('createElection', () => {
    it('should create an election with valid input', async () => {
      const input: CreateElectionInput = {
        worldId: 'world-123',
        constituencyId: 'constituency-456',
      };

      const result = await electionService.createElection(input);

      expect(result).toBeDefined();
      expect(result.worldId).toBe(input.worldId);
      expect(result.constituencyId).toBe(input.constituencyId);
      expect(result.status).toBe('ANNOUNCED');
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('getElection', () => {
    it('should return null for non-existent election', async () => {
      const result = await electionService.getElection('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle empty string input', async () => {
      const result = await electionService.getElection('');
      expect(result).toBeNull();
    });
  });

  describe('updateElectionStatus', () => {
    it('should return null for non-existent election', async () => {
      const result = await electionService.updateElectionStatus('non-existent-id', 'POLLING');
      expect(result).toBeNull();
    });

    it('should handle invalid status', async () => {
      const result = await electionService.updateElectionStatus('test-id', 'INVALID' as any);
      expect(result).toBeNull();
    });
  });
});

describe('VoteService', () => {
  let voteService: VoteService;

  beforeEach(() => {
    voteService = new VoteService();
  });

  describe('castVote', () => {
    it('should cast a vote with valid input', async () => {
      const input: CreateVoteInput = {
        proposalId: 'proposal-123',
        playerId: 'player-456',
        choice: 'for',
      };

      const result = await voteService.castVote(input);

      expect(result).toBeDefined();
      expect(result.proposalId).toBe(input.proposalId);
      expect(result.playerId).toBe(input.playerId);
      expect(result.choice).toBe(input.choice);
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('getVoteById', () => {
    it('should return null for non-existent vote', async () => {
      const result = await voteService.getVoteById('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle empty string input', async () => {
      const result = await voteService.getVoteById('');
      expect(result).toBeNull();
    });
  });

  describe('getBillVotes', () => {
    it('should return empty array for non-existent bill', async () => {
      const result = await voteService.getBillVotes('non-existent-bill');
      expect(result).toEqual([]);
    });

    it('should handle empty string input', async () => {
      const result = await voteService.getBillVotes('');
      expect(result).toEqual([]);
    });
  });

  describe('getVoteCounts', () => {
    it('should return zero counts for non-existent bill', async () => {
      const result = await voteService.getVoteCounts('non-existent-bill');
      expect(result).toEqual({ aye: 0, nay: 0, abstain: 0 });
    });

    it('should handle empty string input', async () => {
      const result = await voteService.getVoteCounts('');
      expect(result).toEqual({ aye: 0, nay: 0, abstain: 0 });
    });
  });

  describe('getVoteResults', () => {
    it('should return zero results for non-existent bill', async () => {
      const result = await voteService.getVoteResults('non-existent-bill');
      expect(result).toEqual({
        total: 0,
        aye: 0,
        nay: 0,
        abstain: 0,
      });
    });

    it('should handle empty string input', async () => {
      const result = await voteService.getVoteResults('');
      expect(result).toEqual({
        total: 0,
        aye: 0,
        nay: 0,
        abstain: 0,
      });
    });
  });
});
