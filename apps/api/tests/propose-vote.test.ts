import { describe, it, expect, beforeEach } from 'vitest';

type User = { username: string; password: string; email: string };
type Game = { id: string; name: string; proposals: Proposal[]; votes: Vote[] };
type Proposal = { id: string; title: string; description: string; status?: string };
type Vote = { playerId: string; proposalId: string; choice: string };

const createMockApi = () => {
  const users = new Map<string, User>();
  const games = new Map<string, Game>();

  const register = (username: string, password: string): string => {
    const email = `${username}@example.com`;
    users.set(username, { username, password, email });
    return 'mock-access-token';
  };

  const createGame = (token: string, name: string): Game => {
    if (!token) throw new Error('Missing token');
    const game: Game = { id: `game-${games.size + 1}`, name, proposals: [], votes: [] };
    games.set(game.id, game);
    return game;
  };

  const joinGame = (token: string, gameId: string) => {
    if (!token || !games.has(gameId)) {
      throw new Error('Invalid join');
    }
    return true;
  };

  const propose = (
    token: string,
    gameId: string,
    payload: { title: string; description: string }
  ) => {
    if (!token) throw new Error('Missing token');
    const game = games.get(gameId);
    if (!game) throw new Error('Game not found');
    const proposal: Proposal = {
      id: `proposal-${game.proposals.length + 1}`,
      title: payload.title,
      description: payload.description,
    };
    game.proposals.push(proposal);
    return proposal;
  };

  const vote = (token: string, gameId: string, payload: { proposalId: string; choice: string }) => {
    if (!token) throw new Error('Missing token');
    const game = games.get(gameId);
    if (!game) throw new Error('Game not found');
    const voteEntry: Vote = {
      playerId: `player-${token}`,
      proposalId: payload.proposalId,
      choice: payload.choice,
    };
    game.votes.push(voteEntry);
    return voteEntry;
  };

  return { register, createGame, joinGame, propose, vote, games };
};

let api: ReturnType<typeof createMockApi>;

beforeEach(() => {
  api = createMockApi();
});

describe('Proposal & Voting flow', () => {
  it('allows a proposal and a vote to be processed', async () => {
    const userA = `userA-${Date.now()}`;
    const userB = `userB-${Date.now()}`;
    const pass = 'pass12345';

    const tokenA = api.register(userA, pass);
    const tokenB = api.register(userB, pass);

    // User A creates game
    const game = api.createGame(tokenA, 'Voting Test');
    const gameId = game.id;

    // User B joins game
    expect(api.joinGame(tokenB, gameId)).toBe(true);

    // User A proposes
    const proposal = api.propose(tokenA, gameId, {
      title: 'Tax Reform',
      description: 'Adjust brackets',
    });
    expect(proposal.id).toBeDefined();

    // User B votes FOR
    const vote = api.vote(tokenB, gameId, {
      proposalId: proposal.id,
      choice: 'for',
    });

    expect(vote.proposalId).toBe(proposal.id);

    const finalGame = api.games.get(gameId)!;
    expect(finalGame.proposals.length).toBeGreaterThan(0);
    expect(finalGame.votes.length).toBeGreaterThan(0);
  });
});
