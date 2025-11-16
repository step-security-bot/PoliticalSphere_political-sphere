import assert from 'node:assert';

import express from 'express';
import { afterEach, beforeEach, describe, it } from 'vitest';

import authRoutes from '../../src/auth/auth.routes.ts';
import { closeDatabase, getDatabase } from '../../src/modules/stores/index.ts';
import partiesRouter from '../../src/routes/parties.js';
import { bearer, getTestToken } from '../helpers/auth-token.mjs';
import { dispatchRequest } from '../utils/express-request.js';

describe('Parties Routes', () => {
  let app;
  let authToken;

  beforeEach(async () => {
    getDatabase();
    app = express();
    app.use('/api', partiesRouter);
    app.use('/auth', authRoutes);

    // Acquire test auth token
    const { token } = await getTestToken(app);
    authToken = token;
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('POST /api/parties', () => {
    it('should create a new party', async () => {
      const timestamp = Date.now();
      const response = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/parties',
        headers: bearer(authToken),
        body: {
          name: `Test Party ${timestamp}`,
          description: 'A test party description',
          color: '#FF0000',
        },
      });

      assert.strictEqual(response.status, 201);
      assert(response.body.success);
      assert(response.body.data.id);
      assert.strictEqual(response.body.data.name, `Test Party ${timestamp}`);
      assert.strictEqual(response.body.data.description, 'A test party description');
      assert.strictEqual(response.body.data.color, '#FF0000');
      // createdAt is expected; updatedAt is not part of current Party schema
      assert(response.body.data.createdAt);
    });

    it('should return 400 for invalid input', async () => {
      const response = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/parties',
        headers: bearer(authToken),
        body: {
          name: '',
          description: 'Valid description',
          color: '#FF0000',
        },
      });
      assert.strictEqual(response.status, 400);
      assert(response.body.error);
    });

    it('should return 400 for duplicate party name', async () => {
      const timestamp = Date.now();
      const first = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/parties',
        headers: bearer(authToken),
        body: {
          name: `Test Party ${timestamp}`,
          description: 'First party',
          color: '#FF0000',
        },
      });
      assert.strictEqual(first.status, 201);

      const response = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/parties',
        headers: bearer(authToken),
        body: {
          name: `Test Party ${timestamp}`,
          description: 'Duplicate party',
          color: '#00FF00',
        },
      });
      assert.strictEqual(response.status, 400);
      assert(response.body.error);
    });
  });

  describe('GET /api/parties/:id', () => {
    it('should return party by id', async () => {
      const timestamp = Date.now();
      const createResponse = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/parties',
        headers: bearer(authToken),
        body: {
          name: `Test Party ${timestamp}`,
          description: 'A test party',
          color: '#FF0000',
        },
      });
      assert.strictEqual(createResponse.status, 201);

      const partyId = createResponse.body.data.id;

      const getResponse = await dispatchRequest(app, {
        method: 'GET',
        url: `/api/parties/${partyId}`,
        headers: bearer(authToken),
      });
      assert.strictEqual(getResponse.status, 200);
      assert.deepStrictEqual(getResponse.body.party, createResponse.body.data);
    });

    it('should return 404 for non-existent party', async () => {
      const response = await dispatchRequest(app, {
        method: 'GET',
        url: '/api/parties/non-existent-id',
        headers: bearer(authToken),
      });
      assert.strictEqual(response.status, 404);
      assert.strictEqual(response.body.error, 'Party not found');
    });
  });

  describe('GET /api/parties', () => {
    it('should return all parties', async () => {
      const party1Response = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/parties',
        headers: bearer(authToken),
        body: {
          name: 'Party 1',
          description: 'First party',
          color: '#FF0000',
        },
      });
      assert.strictEqual(party1Response.status, 201);

      const party2Response = await dispatchRequest(app, {
        method: 'POST',
        url: '/api/parties',
        headers: bearer(authToken),
        body: {
          name: 'Party 2',
          description: 'Second party',
          color: '#00FF00',
        },
      });
      assert.strictEqual(party2Response.status, 201);

      const getResponse = await dispatchRequest(app, {
        method: 'GET',
        url: '/api/parties',
        headers: bearer(authToken),
      });

      assert.strictEqual(getResponse.status, 200);
      assert(Array.isArray(getResponse.body.parties));
      assert(getResponse.body.parties.some(p => p.id === party1Response.body.data.id));
      assert(getResponse.body.parties.some(p => p.id === party2Response.body.data.id));
    });
  });
});
