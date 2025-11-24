/**
 * @ignore
 * API Smoke Test
 * Verifies auth and game routes end-to-end without manual server control.
 */
import request from 'supertest';

import { app } from '../src/index';

/**
 * run - Execute a basic API smoke-test covering health, auth, and game endpoints
 *
 * Exported for tooling and documentation so compodoc can reference the
 * smoke test behavior as part of the API maintenance tooling.
 */
export async function run() {
  const username = `user_${Date.now().toString(36)}`;
  const password = 'passw0rd123';

  // Health
  const health = await request(app).get('/health');
  if (health.status !== 200) throw new Error('Health check failed');

  // Register
  const reg = await request(app)
    .post('/auth/register')
    .send({ username, password })
    .set('Content-Type', 'application/json');
  if (reg.status !== 201) throw new Error(`Register failed: ${reg.text}`);

  // Login
  const login = await request(app)
    .post('/auth/login')
    .send({ username, password })
    .set('Content-Type', 'application/json');
  if (login.status !== 200) throw new Error(`Login failed: ${login.text}`);
  const accessToken: string = login.body.tokens.accessToken;

  const authHeader = { Authorization: `Bearer ${accessToken}` };

  // Create Game
  const created = await request(app)
    .post('/game/create')
    .set(authHeader)
    .send({ name: 'Smoke Test Game' })
    .set('Content-Type', 'application/json');
  if (created.status !== 201) throw new Error(`Create game failed: ${created.text}`);
  const gameId: string = created.body.game.id;

  // List Games
  const list = await request(app).get('/game/list').set(authHeader);
  if (list.status !== 200) throw new Error(`List games failed: ${list.text}`);

  // Join Game (skip error if already joined)
  const join = await request(app).post(`/game/${gameId}/join`).set(authHeader);
  if (join.status !== 200 && !/Already in this game/.test(join.text)) {
    throw new Error(`Join game failed: ${join.text}`);
  }

  // Propose Action
  const propose = await request(app)
    .post(`/game/${gameId}/action`)
    .set(authHeader)
    .send({ type: 'propose', payload: { title: 'Test Proposal', description: 'Smoke test' } })
    .set('Content-Type', 'application/json');
  if (propose.status !== 200) throw new Error(`Propose failed: ${propose.text}`);

  // eslint-disable-next-line no-console
  console.log('SMOKE PASS:', {
    user: username,
    gameId,
    proposals: (propose.body.game?.proposals || []).length,
  });
}

run().catch(err => {
  // eslint-disable-next-line no-console
  console.error('SMOKE FAIL:', err.message);
  process.exit(1);
});
