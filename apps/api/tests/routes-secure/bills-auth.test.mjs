import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getTestDatabase, resetTestDatabase } from '../../src/test-support/database.ts';
import authRouter from '../../src/routes/auth.js';
import billsRouter from '../../src/routes/bills.js';

// Helper to register + login and return { token, user }
async function registerAndLogin(app, email = `user+${Date.now()}@example.com`) {
  const username = `tester_${Date.now()}`;
  const password = 'Password123';

  // Register
  const reg = await request(app)
    .post('/register')
    .send({ username, email, password })
    .set('Content-Type', 'application/json');
  expect(reg.status).toBe(201);

  // Login
  const login = await request(app)
    .post('/login')
    .send({ email, password })
    .set('Content-Type', 'application/json');
  expect(login.status).toBe(200);
  return { token: login.body.data.token, user: login.body.data.user };
}

describe('bills routes (auth enforced)', () => {
  let app;
  let testDb;
  const prev = process.env.FORCE_AUTH;

  beforeEach(async () => {
    // Enforce auth paths in test
    process.env.FORCE_AUTH = '1';
    resetTestDatabase();
    testDb = getTestDatabase();
    await testDb.setup();

    app = express();
    app.use(express.json());
    app.use('/', authRouter);
    app.use('/', billsRouter);
  });

  afterEach(async () => {
    process.env.FORCE_AUTH = prev;
    await testDb.teardown();
  });

  it('creates a bill with valid token (POST /bills)', async () => {
    const { token, user } = await registerAndLogin(app);

    const res = await request(app)
      .post('/bills')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Auth Bill', description: 'Bill via auth', proposerId: user.id })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Auth Bill');
  });
});
