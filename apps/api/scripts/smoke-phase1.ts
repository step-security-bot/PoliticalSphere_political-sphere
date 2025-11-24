#!/usr/bin/env ts-node
/**
 * @ignore
 * Phase 1 Smoke Script
 * Verifies health, register/login, game create/list endpoints without Vitest overhead.
 */
import request from 'supertest';

import { createApp } from '../src/app';

/**
 * run - Phase 1 smoke script which verifies a subset of critical endpoints
 * such as health, register/login, and basic gameplay flows.
 *
 * Exported for documentation and programmatic use in maintenance tooling.
 */
export async function run() {
  const app = createApp();
  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  const agent = request(server);
  const results: Record<string, unknown> = { port };

  try {
    // Health
    const health = await agent.get('/health');
    results.health = { status: health.status, body: health.body };

    // Register
    const username = `alpha-${Date.now()}`;
    const password = 'alphapass123';
    const reg = await agent
      .post('/auth/register')
      .send({ username, password })
      .set('Content-Type', 'application/json');
    results.register = {
      status: reg.status,
      accessToken: reg.body?.tokens?.accessToken ? 'present' : 'missing',
    };
    const token = reg.body?.tokens?.accessToken as string | undefined;

    // Login
    const login = await agent
      .post('/auth/login')
      .send({ username, password })
      .set('Content-Type', 'application/json');
    results.login = {
      status: login.status,
      accessToken: login.body?.tokens?.accessToken ? 'present' : 'missing',
    };

    // Create game
    if (token) {
      const gameCreate = await agent
        .post('/game/create')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Game' });
      const gameId = gameCreate.body?.game?.id as string | undefined;
      results.gameCreate = {
        status: gameCreate.status,
        gameId: gameId ? 'present' : 'missing',
      };

      // List games
      const list = await agent.get('/game/list').set('Authorization', `Bearer ${token}`);
      results.gameList = {
        status: list.status,
        count: Array.isArray(list.body?.games) ? list.body.games.length : -1,
      };
    }
  } catch (err) {
    results.error = (err as Error).message;
  } finally {
    server.close();
  }

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(results, null, 2));
}

run();
