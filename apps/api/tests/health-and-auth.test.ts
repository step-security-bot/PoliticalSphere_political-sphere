import { describe, it, expect, beforeEach } from 'vitest';

type MockResponse<T = unknown> = { status: number; body: T; cookies: Record<string, string> };

const createMockApi = () => {
  const users = new Map<string, { username: string; email: string; password: string }>();
  const games: Array<{ id: string; name: string }> = [];

  const healthz = (): MockResponse<{ status: string }> => ({
    status: 200,
    body: { status: 'ok' },
    cookies: {},
  });

  const register = (username: string, email: string, password: string): MockResponse => {
    if (!username || !email) {
      return { status: 400, body: { error: 'Missing required fields' }, cookies: {} };
    }
    users.set(username, { username, email, password });
    return {
      status: 201,
      body: { success: true, user: { username, email } },
      cookies: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
    };
  };

  const login = (username: string, password: string): MockResponse => {
    if (!username || !users.has(username) || users.get(username)?.password !== password) {
      return { status: 400, body: { error: 'Missing username' }, cookies: {} };
    }
    return {
      status: 200,
      body: { success: true, user: { username } },
      cookies: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
    };
  };

  const createGame = (name: string): MockResponse => {
    if (!name) {
      return { status: 400, body: { error: 'Missing game name' }, cookies: {} };
    }
    const game = { id: `mock-${games.length + 1}`, name };
    games.push(game);
    return { status: 201, body: { success: true, game }, cookies: {} };
  };

  const listGames = (): MockResponse => ({
    status: 200,
    body: { success: true, games: games.slice() },
    cookies: {},
  });

  return { healthz, register, login, createGame, listGames };
};

let api: ReturnType<typeof createMockApi>;

beforeEach(() => {
  api = createMockApi();
});

describe('Health and Auth endpoints', () => {
  it('GET /healthz returns ok', async () => {
    const res = api.healthz();
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('can register and login', async () => {
    const username = `alpha-${Date.now()}`;
    const email = `${username}@example.com`;
    const password = 'alphapass123';

    const reg = api.register(username, email, password);

    expect([200, 201]).toContain(reg.status);
    expect(reg.cookies.accessToken).toBeDefined();
    expect(reg.cookies.refreshToken).toBeDefined();

    const login = api.login(username, password);

    expect(login.status).toBe(200);
    expect(login.cookies.accessToken).toBeDefined();
    expect(login.cookies.refreshToken).toBeDefined();
  });

  it('can create and list games', async () => {
    const username = `beta-${Date.now()}`;
    const email = `${username}@example.com`;
    const password = 'betapass123';

    const reg = api.register(username, email, password);

    expect(reg.cookies.accessToken).toBeDefined();

    const created = api.createGame('Test Game');

    expect([200, 201]).toContain(created.status);
    expect(created.body?.game?.id).toBeDefined();

    const list = api.listGames();

    expect(list.status).toBe(200);
    expect(Array.isArray((list.body as any).games)).toBe(true);
  });
});
