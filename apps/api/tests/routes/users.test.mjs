import assert from 'node:assert';

import express from 'express';
import { afterEach, beforeEach, describe, it } from 'vitest';

import authRoutes from '../../src/auth/auth.routes.ts';
import { closeDatabase, getDatabase } from '../../src/modules/stores/index.ts';
import usersRouter from '../../src/routes/users.js';
import { bearer, getTestToken } from '../helpers/auth-token.mjs';
import { dispatchRequest } from '../utils/express-request.js';

describe('Users Routes', () => {
  let app;
  let authToken;

  beforeEach(async () => {
    getDatabase();
    app = express();
    app.use('/api', usersRouter);
    app.use('/auth', authRoutes);

    // Acquire test auth token via helper
    const { token } = await getTestToken(app);
    authToken = token;
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const timestamp = Date.now();
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
      assert(response.body.data.id);
      assert.strictEqual(response.body.data.username, `user${timestamp}`);
      assert.strictEqual(response.body.data.email, `test-${timestamp}@example.com`);
      assert(response.body.data.createdAt);
      assert(response.body.data.updatedAt);
    });

    it('should return 400 for invalid input', async () => {
      const response = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/users',
        headers: bearer(authToken),
        body: {
          username: '',
          email: 'invalid-email',
        },
      });
      assert.strictEqual(response.status, 400);
      assert(response.body.error);
    });

    it('should return 400 for duplicate username', async () => {
      const timestamp = Date.now();
      const first = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/users',
        headers: bearer(authToken),
        body: {
          username: `user${timestamp}`,
          email: `test-${timestamp}@example.com`,
        },
      });
      assert.strictEqual(first.status, 201);

      const response = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/users',
        headers: bearer(authToken),
        body: {
          username: `user${timestamp}`,
          email: `test2-${timestamp}@example.com`,
        },
      });
      assert.strictEqual(response.status, 400);
      assert(response.body.error);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      const timestamp = Date.now();
      const createResponse = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/users',
        headers: bearer(authToken),
        body: {
          username: `user${timestamp}`,
          email: `test-${timestamp}@example.com`,
        },
      });
      assert.strictEqual(createResponse.status, 201);

      const userId = createResponse.body.data.id;

      const getResponse = await dispatchRequest(app, {
        method: 'GET',
        url: `/api/users/${userId}`,
        headers: bearer(authToken),
      });
      assert.strictEqual(getResponse.status, 200);
      assert.deepStrictEqual(getResponse.body, createResponse.body.data);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await dispatchRequest(app, {
        method: 'GET',
        url: '/api/users/non-existent-id',
      });
      assert.strictEqual(response.status, 404);
      assert.strictEqual(response.body.error, 'User not found');
    });
  });
});
