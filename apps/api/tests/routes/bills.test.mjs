import assert from 'node:assert';

import express from 'express';
import { afterEach, beforeEach, describe, it } from 'vitest';

import authRoutes from '../../src/auth/auth.routes.ts';
import { closeDatabase, getDatabase } from '../../src/modules/stores/index.ts';
import billsRouter from '../../src/routes/bills.js';
import usersRouter from '../../src/routes/users.js';
import { bearer, getTestToken } from '../helpers/auth-token.mjs';
import { dispatchRequest } from '../utils/express-request.js';

describe('Bills Routes', () => {
  let app;
  let authToken;

  beforeEach(async () => {
    getDatabase();
    app = express();
    app.use('/api', usersRouter);
    app.use('/api', billsRouter);
    app.use('/auth', authRoutes);

    // Acquire test auth token
    const { token } = await getTestToken(app);
    authToken = token;
  });

  afterEach(() => {
    closeDatabase();
  });

  async function createUser(timestamp = Date.now()) {
    const response = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/users',
      headers: bearer(authToken),
      body: {
        username: `user${timestamp}`,
        email: `test-${timestamp}@example.com`,
      },
    });
    assert.strictEqual(response.status, 201);
    return response.body.data.id;
  }

  describe('POST /api/bills', () => {
    it('should create a new bill', async () => {
      const timestamp = Date.now();
      const userId = await createUser(timestamp);

      const response = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/bills',
        headers: bearer(authToken),
        body: {
          title: `Test Bill ${timestamp}`,
          description: 'A test bill description',
          proposerId: userId,
        },
      });

      assert.strictEqual(response.status, 201);
      assert(response.body.id);
      assert.strictEqual(response.body.title, `Test Bill ${timestamp}`);
      assert.strictEqual(response.body.description, 'A test bill description');
      assert.strictEqual(response.body.proposerId, userId);
      assert.strictEqual(response.body.status, 'proposed');
      assert(response.body.createdAt);
      assert(response.body.updatedAt);
    });

    it('should return 400 for non-existent proposer', async () => {
      const response = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/bills',
        headers: bearer(authToken),
        body: {
          title: 'Test Bill',
          description: 'A test bill description',
          proposerId: 'non-existent-id',
        },
      });

      assert.strictEqual(response.status, 400);
      assert(response.body.error);
    });
  });

  describe('GET /api/bills/:id', () => {
    it('should return bill by id', async () => {
      const timestamp = Date.now();
      const userId = await createUser(timestamp);

      const billResponse = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/bills',
        headers: bearer(authToken),
        body: {
          title: `Test Bill ${timestamp}`,
          description: 'A test bill description',
          proposerId: userId,
        },
      });
      assert.strictEqual(billResponse.status, 201);

      const getResponse = await dispatchRequest(app, {
        method: 'GET',
        url: `/api/bills/${billResponse.body.id}`,
        headers: bearer(authToken),
      });

      assert.strictEqual(getResponse.status, 200);
      assert.deepStrictEqual(getResponse.body, billResponse.body);
    });

    it('should return 404 for non-existent bill', async () => {
      const response = await dispatchRequest(app, {
        method: 'GET',
        url: '/api/bills/non-existent-id',
        headers: bearer(authToken),
      });

      assert.strictEqual(response.status, 404);
      assert.strictEqual(response.body.error, 'Bill not found');
    });
  });

  describe('GET /api/bills', () => {
    it('should return all bills', async () => {
      const userId = await createUser();

      const bill1Response = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/bills',
        headers: bearer(authToken),
        body: {
          title: 'Bill 1',
          description: 'First bill',
          proposerId: userId,
        },
      });
      assert.strictEqual(bill1Response.status, 201);

      const bill2Response = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/bills',
        headers: bearer(authToken),
        body: {
          title: 'Bill 2',
          description: 'Second bill',
          proposerId: userId,
        },
      });
      assert.strictEqual(bill2Response.status, 201);

      const getResponse = await dispatchRequest(app, {
        method: 'GET',
        url: '/api/bills',
        headers: bearer(authToken),
      });

      assert.strictEqual(getResponse.status, 200);
      assert(Array.isArray(getResponse.body));
      assert(getResponse.body.some(b => b.id === bill1Response.body.id));
      assert(getResponse.body.some(b => b.id === bill2Response.body.id));
    });
  });
});
