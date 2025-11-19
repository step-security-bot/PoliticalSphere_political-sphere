import assert from 'node:assert';

import express from 'express';
import { afterEach, beforeEach, describe, it } from 'vitest';

import { bearer, getTestToken } from '../../tests/helpers/auth-token.mjs';
import { dispatchRequest } from '../../tests/utils/express-request.js';
import authRoutes from '../auth/auth.routes.ts';
import { closeDatabase, getDatabase } from '../stores/index.ts';
import billsRouter from './bills.js';
import usersRouter from './users.js';
import votesRouter from './votes.js';

describe('Votes Routes', () => {
  let app;
  let authToken;

  beforeEach(async () => {
    getDatabase();
    app = express();
    app.use('/api', usersRouter);
    app.use('/api', billsRouter);
    app.use('/api', votesRouter);
    app.use('/auth', authRoutes);

    // Acquire auth token
    const { token } = await getTestToken(app);
    authToken = token;
  });

  afterEach(() => {
    closeDatabase();
  });

  async function createUser() {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const response = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/users',
      headers: bearer(authToken),
      body: {
        username: `user-${uniqueId}`,
        email: `test-${uniqueId}@example.com`,
      },
    });
    assert.strictEqual(response.status, 201);
    return response.body.data.id;
  }

  async function createBill(proposerId) {
    const response = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/bills',
      headers: bearer(authToken),
      body: {
        title: `Bill-${Date.now()}`,
        description: 'A test bill',
        proposerId,
      },
    });
    assert.strictEqual(response.status, 201);
    return response.body.id;
  }

  describe('POST /api/votes', () => {
    it('should create a new vote', async () => {
      const userId = await createUser();
      const billId = await createBill(userId);

      const response = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/votes',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        body: {
          billId,
          userId,
          vote: 'aye',
        },
      });

      assert.strictEqual(response.status, 201);
      assert(response.body.id);
      assert.strictEqual(response.body.billId, billId);
      assert.strictEqual(response.body.userId, userId);
      assert.strictEqual(response.body.vote, 'aye');
    });

    it('should return 400 for duplicate vote', async () => {
      const userId = await createUser();
      const billId = await createBill(userId);

      const first = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/votes',
        headers: bearer(authToken),
        body: {
          billId,
          userId,
          vote: 'aye',
        },
      });
      assert.strictEqual(first.status, 201);

      const response = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/votes',
        headers: bearer(authToken),
        body: {
          billId,
          userId,
          vote: 'nay',
        },
      });
      assert.strictEqual(response.status, 400);
      assert(response.body.error);
    });
  });

  describe('GET /api/bills/:id/votes', () => {
    it('should return votes for a bill', async () => {
      const user1 = await createUser();
      const user2 = await createUser();
      const billId = await createBill(user1);

      const vote1 = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/votes',
        headers: bearer(authToken),
        body: {
          billId,
          userId: user1,
          vote: 'aye',
        },
      });
      assert.strictEqual(vote1.status, 201);

      const vote2 = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/votes',
        headers: bearer(authToken),
        body: {
          billId,
          userId: user2,
          vote: 'nay',
        },
      });
      assert.strictEqual(vote2.status, 201);

      const getResponse = await dispatchRequest(app, {
        method: 'GET',
        url: `/api/bills/${billId}/votes`,
        headers: bearer(authToken),
      });
      assert.strictEqual(getResponse.status, 200);
      assert(Array.isArray(getResponse.body));
      assert.strictEqual(getResponse.body.length, 2);
      const ids = getResponse.body.map(v => v.id);
      assert(ids.includes(vote1.body.id));
      assert(ids.includes(vote2.body.id));
    });
  });

  describe('GET /api/bills/:id/vote-counts', () => {
    it('should return vote counts for a bill', async () => {
      const user1 = await createUser();
      const user2 = await createUser();
      const user3 = await createUser();
      const billId = await createBill(user1);

      const votes = [
        { userId: user1, vote: 'aye' },
        { userId: user2, vote: 'aye' },
        { userId: user3, vote: 'nay' },
      ];

      for (const entry of votes) {
        const response = await dispatchRequest(app, {
          method: 'POST',
          url: '/api/votes',
          body: { billId, ...entry },
        });
        assert.strictEqual(response.status, 201);
      }

      const countsResponse = await dispatchRequest(app, {
        method: 'GET',
        url: `/api/bills/${billId}/vote-counts`,
      });
      assert.strictEqual(countsResponse.status, 200);
      assert.strictEqual(countsResponse.body.aye, 2);
      assert.strictEqual(countsResponse.body.nay, 1);
      assert.strictEqual(countsResponse.body.abstain, 0);
    });
  });
});
