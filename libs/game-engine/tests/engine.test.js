import { describe, it, expect, beforeEach } from 'vitest';
import { advanceGameState, deterministicId, mulberry32 } from '../src/engine.js';

describe('Game Engine', () => {
  let initialGameState;

  beforeEach(() => {
    initialGameState = {
      id: 'game-1',
      players: [
        { id: 'player1', name: 'Alice' },
        { id: 'player2', name: 'Bob' },
        { id: 'player3', name: 'Charlie' },
      ],
      proposals: [],
      votes: [],
      debates: [],
      speeches: [],
      economy: {
        treasury: 100000,
        inflationRate: 0.02,
        unemploymentRate: 0.05,
      },
      turn: { turnNumber: 0, phase: 'lobby' },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
  });

  describe('advanceGameState', () => {
    it('should return a new state object without mutating the original', () => {
      const actions = [{ type: 'propose', payload: { title: 'Test Proposal' } }];
      const newState = advanceGameState(initialGameState, actions, 123);

      expect(newState).not.toBe(initialGameState);
      expect(newState.proposals).not.toBe(initialGameState.proposals);
      expect(newState.proposals.length).toBe(1);
      expect(initialGameState.proposals.length).toBe(0);
    });

    it('should handle empty actions array', () => {
      const newState = advanceGameState(initialGameState, [], 123);
      expect(newState.proposals).toEqual([]);
      expect(newState.updatedAt).not.toBe(initialGameState.updatedAt);
    });

    it('should update the updatedAt timestamp', () => {
      const newState = advanceGameState(initialGameState, [], 123);
      expect(new Date(newState.updatedAt).getTime()).toBeGreaterThan(
        new Date(initialGameState.updatedAt).getTime()
      );
    });
  });

  describe('propose action', () => {
    it('should create a new proposal with correct structure', () => {
      const actions = [
        {
          type: 'propose',
          payload: {
            title: 'Build a new school',
            description: 'We need better education facilities',
            proposerId: 'player1',
          },
        },
      ];

      const newState = advanceGameState(initialGameState, actions, 123);

      expect(newState.proposals).toHaveLength(1);
      const proposal = newState.proposals[0];
      expect(proposal).toMatchObject({
        title: 'Build a new school',
        description: 'We need better education facilities',
        proposerId: 'player1',
        status: 'proposed',
        debateId: null,
      });
      expect(proposal.id).toMatch(/^proposal-/);
      expect(proposal.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should use default values when payload is incomplete', () => {
      const actions = [{ type: 'propose', payload: {} }];

      const newState = advanceGameState(initialGameState, actions, 123);

      const proposal = newState.proposals[0];
      expect(proposal.title).toBe('Untitled');
      expect(proposal.description).toBe('');
      expect(proposal.proposerId).toBe('unknown');
    });

    it('should generate deterministic IDs based on seed', () => {
      const actions = [{ type: 'propose', payload: { title: 'Test' } }];

      const state1 = advanceGameState(initialGameState, actions, 123);
      const state2 = advanceGameState(initialGameState, actions, 123);

      expect(state1.proposals[0].id).toBe(state2.proposals[0].id);
    });

    it('should generate different IDs with different seeds', () => {
      const actions = [{ type: 'propose', payload: { title: 'Test' } }];

      const state1 = advanceGameState(initialGameState, actions, 123);
      const state2 = advanceGameState(initialGameState, actions, 456);

      expect(state1.proposals[0].id).not.toBe(state2.proposals[0].id);
    });
  });

  describe('start_debate action', () => {
    let gameWithProposal;

    beforeEach(() => {
      const actions = [
        {
          type: 'propose',
          payload: {
            title: 'Test Proposal',
            proposerId: 'player1',
          },
        },
      ];
      gameWithProposal = advanceGameState(initialGameState, actions, 123);
    });

    it('should create a debate for a proposed proposal', () => {
      const actions = [
        {
          type: 'start_debate',
          payload: {
            proposalId: gameWithProposal.proposals[0].id,
            speakingOrder: ['player1', 'player2', 'player3'],
          },
        },
      ];

      const newState = advanceGameState(gameWithProposal, actions, 456);

      expect(newState.debates).toHaveLength(1);
      const debate = newState.debates[0];
      expect(debate).toMatchObject({
        proposalId: gameWithProposal.proposals[0].id,
        speakingOrder: ['player1', 'player2', 'player3'],
        currentSpeakerIndex: 0,
        timeLimit: 300000,
        status: 'active',
      });
      expect(debate.id).toMatch(/^debate-/);
      expect(newState.proposals[0].status).toBe('debate');
      expect(newState.proposals[0].debateId).toBe(debate.id);
    });

    it('should use default speaking order from players', () => {
      const actions = [
        {
          type: 'start_debate',
          payload: { proposalId: gameWithProposal.proposals[0].id },
        },
      ];

      const newState = advanceGameState(gameWithProposal, actions, 456);

      expect(newState.debates[0].speakingOrder).toEqual(['player1', 'player2', 'player3']);
    });

    it('should not create debate for non-existent proposal', () => {
      const actions = [
        {
          type: 'start_debate',
          payload: { proposalId: 'non-existent' },
        },
      ];

      const newState = advanceGameState(gameWithProposal, actions, 456);

      expect(newState.debates).toHaveLength(0);
    });

    it('should not create debate for proposal not in proposed status', () => {
      // Change proposal status to enacted
      const enactedGame = {
        ...gameWithProposal,
        proposals: [
          {
            ...gameWithProposal.proposals[0],
            status: 'enacted',
          },
        ],
      };

      const actions = [
        {
          type: 'start_debate',
          payload: { proposalId: enactedGame.proposals[0].id },
        },
      ];

      const newState = advanceGameState(enactedGame, actions, 789);

      expect(newState.debates).toHaveLength(0);
    });
  });

  describe('speak action', () => {
    let gameWithDebate;

    beforeEach(() => {
      const actions = [
        { type: 'propose', payload: { title: 'Test', proposerId: 'player1' } },
        {
          type: 'start_debate',
          payload: { proposalId: 'proposal-5ga8al', speakingOrder: ['player1', 'player2'] },
        },
      ];
      gameWithDebate = advanceGameState(initialGameState, actions, 123);
    });

    it('should add a speech to an active debate', () => {
      const debateId = gameWithDebate.debates[0].id;
      const actions = [
        {
          type: 'speak',
          payload: {
            debateId,
            speakerId: 'player1',
            content: 'I support this proposal because...',
          },
        },
      ];

      const newState = advanceGameState(gameWithDebate, actions, 456);

      expect(newState.speeches).toHaveLength(1);
      const speech = newState.speeches[0];
      expect(speech).toMatchObject({
        debateId,
        speakerId: 'player1',
        content: 'I support this proposal because...',
      });
      expect(speech.id).toMatch(/^speech-/);
      expect(newState.debates[0].currentSpeakerIndex).toBe(1);
    });

    it('should advance to next speaker', () => {
      const debateId = gameWithDebate.debates[0].id;
      const actions = [
        { type: 'speak', payload: { debateId, speakerId: 'player1', content: 'Speech 1' } },
        { type: 'speak', payload: { debateId, speakerId: 'player2', content: 'Speech 2' } },
      ];

      const newState = advanceGameState(gameWithDebate, actions, 456);

      expect(newState.speeches).toHaveLength(2);
      expect(newState.debates[0].currentSpeakerIndex).toBe(0); // Back to start
      expect(newState.debates[0].status).toBe('completed');
    });

    it('should not add speech to inactive debate', () => {
      // Complete the debate first
      const debateId = gameWithDebate.debates[0].id;
      const completeActions = [
        { type: 'speak', payload: { debateId, speakerId: 'player1', content: 'Speech 1' } },
        { type: 'speak', payload: { debateId, speakerId: 'player2', content: 'Speech 2' } },
      ];
      const completedGame = advanceGameState(gameWithDebate, completeActions, 456);

      const actions = [
        {
          type: 'speak',
          payload: { debateId, speakerId: 'player1', content: 'Late speech' },
        },
      ];

      const newState = advanceGameState(completedGame, actions, 789);

      expect(newState.speeches).toHaveLength(2); // No new speech added
    });
  });

  describe('vote action', () => {
    let gameWithProposal;

    beforeEach(() => {
      const actions = [
        {
          type: 'propose',
          payload: { title: 'Test Proposal', proposerId: 'player1' },
        },
      ];
      gameWithProposal = advanceGameState(initialGameState, actions, 123);
    });

    it('should record a vote correctly', () => {
      const actions = [
        {
          type: 'vote',
          payload: {
            proposalId: gameWithProposal.proposals[0].id,
            playerId: 'player1',
            choice: 'for',
          },
        },
      ];

      const newState = advanceGameState(gameWithProposal, actions, 456);

      expect(newState.votes).toHaveLength(1);
      const vote = newState.votes[0];
      expect(vote).toMatchObject({
        playerId: 'player1',
        proposalId: gameWithProposal.proposals[0].id,
        choice: 'for',
      });
      expect(vote.id).toMatch(/^vote-/);
      expect(vote.createdAt).toBeDefined();
    });

    it('should handle vote from action.playerId when not in payload', () => {
      const actions = [
        {
          type: 'vote',
          playerId: 'player2',
          payload: {
            proposalId: gameWithProposal.proposals[0].id,
            choice: 'against',
          },
        },
      ];

      const newState = advanceGameState(gameWithProposal, actions, 456);

      expect(newState.votes[0].playerId).toBe('player2');
    });

    it('should not record vote with missing required fields', () => {
      const actions = [
        { type: 'vote', payload: { proposalId: 'missing-player' } },
        { type: 'vote', payload: { playerId: 'player1' } },
        { type: 'vote', payload: { playerId: 'player1', proposalId: 'test' } },
      ];

      const newState = advanceGameState(gameWithProposal, actions, 456);

      expect(newState.votes).toHaveLength(0);
    });
  });

  describe('advance_turn action', () => {
    it('should increment turn number', () => {
      const actions = [{ type: 'advance_turn' }];

      const newState = advanceGameState(initialGameState, actions, 123);

      expect(newState.turn.turnNumber).toBe(1);
    });

    it('should initialize turn if not present', () => {
      const gameWithoutTurn = { ...initialGameState };
      delete gameWithoutTurn.turn;

      const actions = [{ type: 'advance_turn' }];
      const newState = advanceGameState(gameWithoutTurn, actions, 123);

      expect(newState.turn).toEqual({ turnNumber: 1, phase: 'lobby' });
    });

    it('should move proposals from debate to voting when debate is completed', () => {
      const actions = [
        { type: 'propose', payload: { title: 'Test', proposerId: 'player1' } },
        {
          type: 'start_debate',
          payload: { proposalId: 'proposal-123', speakingOrder: ['player1'] },
        },
        {
          type: 'speak',
          payload: { debateId: 'debate-123', speakerId: 'player1', content: 'Done' },
        },
        { type: 'advance_turn' },
      ];

      const newState = advanceGameState(initialGameState, actions, 123);

      expect(newState.proposals[0].status).toBe('voting');
    });
  });

  describe('voting resolution', () => {
    let gameWithVotingProposal;

    beforeEach(() => {
      const actions = [
        { type: 'propose', payload: { title: 'Test Proposal', proposerId: 'player1' } },
        {
          type: 'start_debate',
          payload: { proposalId: 'proposal-123', speakingOrder: ['player1'] },
        },
        {
          type: 'speak',
          payload: { debateId: 'debate-123', speakerId: 'player1', content: 'Done' },
        },
        { type: 'advance_turn' },
      ];
      gameWithVotingProposal = advanceGameState(initialGameState, actions, 123);
    });

    it('should enact proposal when votes for > votes against', () => {
      const proposalId = gameWithVotingProposal.proposals[0].id;
      const actions = [
        { type: 'vote', payload: { proposalId, playerId: 'player1', choice: 'for' } },
        { type: 'vote', payload: { proposalId, playerId: 'player2', choice: 'for' } },
        { type: 'vote', payload: { proposalId, playerId: 'player3', choice: 'against' } },
      ];

      const newState = advanceGameState(gameWithVotingProposal, actions, 456);

      expect(newState.proposals[0].status).toBe('enacted');
    });

    it('should reject proposal when votes against >= votes for', () => {
      const proposalId = gameWithVotingProposal.proposals[0].id;
      const actions = [
        { type: 'vote', payload: { proposalId, playerId: 'player1', choice: 'for' } },
        { type: 'vote', payload: { proposalId, playerId: 'player2', choice: 'against' } },
        { type: 'vote', payload: { proposalId, playerId: 'player3', choice: 'against' } },
      ];

      const newState = advanceGameState(gameWithVotingProposal, actions, 456);

      expect(newState.proposals[0].status).toBe('rejected');
    });

    it('should only resolve proposals that existed before the current advance call', () => {
      const actions = [
        {
          type: 'vote',
          payload: {
            proposalId: gameWithVotingProposal.proposals[0].id,
            playerId: 'player1',
            choice: 'for',
          },
        },
        { type: 'propose', payload: { title: 'New Proposal', proposerId: 'player2' } },
      ];

      const newState = advanceGameState(gameWithVotingProposal, actions, 456);

      expect(newState.proposals[0].status).toBe('enacted'); // Existing proposal resolved
      expect(newState.proposals[1].status).toBe('proposed'); // New proposal not resolved
    });
  });

  describe('economy simulation', () => {
    it('should simulate economy with enacted policies', () => {
      const gameWithEconomy = {
        ...initialGameState,
        proposals: [
          {
            id: 'proposal-1',
            title: 'Tax Cut Policy',
            status: 'voting',
          },
        ],
        votes: [
          { proposalId: 'proposal-1', choice: 'for' },
          { proposalId: 'proposal-1', choice: 'for' },
        ],
      };

      const newState = advanceGameState(gameWithEconomy, [], 123);

      expect(newState.economy.treasury).toBeGreaterThan(initialGameState.economy.treasury);
      expect(newState.economy.inflationRate).toBeGreaterThan(
        initialGameState.economy.inflationRate
      );
    });

    it('should apply tax policy effects', () => {
      const gameWithTaxPolicy = {
        ...initialGameState,
        proposals: [
          {
            id: 'proposal-1',
            title: 'Lower Taxes',
            status: 'enacted',
          },
        ],
        economy: { treasury: 100000, inflationRate: 0.02, unemploymentRate: 0.05 },
      };

      const newState = advanceGameState(gameWithTaxPolicy, [], 123);

      expect(newState.economy.treasury).toBe(100000 + 10000 + 5000); // base + tax effect
      expect(newState.economy.inflationRate).toBeGreaterThan(0.02);
    });

    it('should apply welfare policy effects', () => {
      const gameWithWelfarePolicy = {
        ...initialGameState,
        proposals: [
          {
            id: 'proposal-1',
            title: 'Welfare Program',
            status: 'enacted',
          },
        ],
        economy: { treasury: 100000, inflationRate: 0.02, unemploymentRate: 0.05 },
      };

      const newState = advanceGameState(gameWithWelfarePolicy, [], 123);

      expect(newState.economy.treasury).toBe(100000 + 10000 - 2000); // base - welfare cost
      expect(newState.economy.unemploymentRate).toBeLessThan(0.05);
    });

    it('should not simulate economy without enacted policies', () => {
      const newState = advanceGameState(initialGameState, [], 123);

      expect(newState.economy).toEqual(initialGameState.economy);
    });
  });

  describe('unknown actions', () => {
    it('should ignore unknown action types', () => {
      const actions = [
        { type: 'unknown_action', payload: { some: 'data' } },
        { type: 'propose', payload: { title: 'Valid Proposal' } },
      ];

      const newState = advanceGameState(initialGameState, actions, 123);

      expect(newState.proposals).toHaveLength(1);
      expect(newState.proposals[0].title).toBe('Valid Proposal');
    });
  });

  describe('deterministic behavior', () => {
    it('should produce identical results with same seed', () => {
      const actions = [
        { type: 'propose', payload: { title: 'Test 1' } },
        { type: 'propose', payload: { title: 'Test 2' } },
        {
          type: 'vote',
          payload: { proposalId: 'proposal-123', playerId: 'player1', choice: 'for' },
        },
      ];

      const state1 = advanceGameState(initialGameState, actions, 42);
      const state2 = advanceGameState(initialGameState, actions, 42);

      expect(state1).toEqual(state2);
    });

    it('should produce different results with different seeds', () => {
      const actions = [{ type: 'propose', payload: { title: 'Test' } }];

      const state1 = advanceGameState(initialGameState, actions, 42);
      const state2 = advanceGameState(initialGameState, actions, 43);

      expect(state1.proposals[0].id).not.toBe(state2.proposals[0].id);
    });
  });

  describe('error handling', () => {
    it('should handle malformed game state gracefully', () => {
      const malformedGame = { id: 'test' }; // Missing required arrays

      const newState = advanceGameState(malformedGame, [], 123);

      expect(newState.proposals).toEqual([]);
      expect(newState.votes).toEqual([]);
      expect(newState.debates).toEqual([]);
      expect(newState.speeches).toEqual([]);
    });

    it('should handle null/undefined actions', () => {
      const actions = [null, undefined, { type: 'propose', payload: { title: 'Test' } }];

      expect(() => advanceGameState(initialGameState, actions, 123)).not.toThrow();
    });
  });

  describe('utility functions', () => {
    describe('deterministicId', () => {
      it('should generate deterministic IDs', () => {
        const rng = mulberry32(42);
        const id1 = deterministicId('test', rng);
        const id2 = deterministicId('test', mulberry32(42));

        expect(id1).toBe(id2);
        expect(id1).toMatch(/^test-/);
      });
    });

    describe('mulberry32', () => {
      it('should generate deterministic random numbers', () => {
        const rng = mulberry32(123);
        const values1 = [rng(), rng(), rng()];
        const rng2 = mulberry32(123);
        const values2 = [rng2(), rng2(), rng2()];

        expect(values1).toEqual(values2);
      });

      it('should generate values between 0 and 1', () => {
        const rng = mulberry32(42);
        for (let i = 0; i < 100; i++) {
          const value = rng();
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThan(1);
        }
      });
    });
  });

  describe('performance and edge cases', () => {
    it('should handle large number of actions', () => {
      const actions = Array.from({ length: 1000 }, (_, i) => ({
        type: 'propose',
        payload: { title: `Proposal ${i}`, proposerId: 'player1' },
      }));

      const newState = advanceGameState(initialGameState, actions, 123);

      expect(newState.proposals).toHaveLength(1000);
    });

    it('should handle concurrent modifications safely', () => {
      const actions = [
        { type: 'propose', payload: { title: 'Concurrent 1' } },
        { type: 'propose', payload: { title: 'Concurrent 2' } },
      ];

      // Simulate multiple calls
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(advanceGameState(initialGameState, actions, 123 + i));
      }

      // All results should have 2 proposals
      results.forEach(state => {
        expect(state.proposals).toHaveLength(2);
      });
    });

    it('should handle game state corruption gracefully', () => {
      const corruptedGame = {
        ...initialGameState,
        proposals: null, // Corrupted
        votes: undefined, // Corrupted
      };

      const newState = advanceGameState(
        corruptedGame,
        [{ type: 'propose', payload: { title: 'Test' } }],
        123
      );

      expect(newState.proposals).toHaveLength(1);
      expect(newState.votes).toEqual([]);
    });
  });
});
