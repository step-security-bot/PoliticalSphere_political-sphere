import assert from 'node:assert';

import express from 'express';
import { afterEach, beforeEach, describe, it } from 'vitest';

import { bearer, getTestToken } from '../../tests/helpers/auth-token.mjs';
import { dispatchRequest } from '../../tests/utils/express-request.js';
import authRoutes from '../auth/auth.routes.ts';
import { closeDatabase, getDatabase } from '../stores/index.ts';
import partiesRouter from './parties.js';

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
      // Compare individual fields instead of deep equality to avoid timestamp precision issues
      assert.strictEqual(getResponse.body.party.id, createResponse.body.data.id);
      assert.strictEqual(getResponse.body.party.name, createResponse.body.data.name);
      assert.strictEqual(getResponse.body.party.description, createResponse.body.data.description);
      assert.strictEqual(getResponse.body.party.color, createResponse.body.data.color);
      // createdAt should exist and be a valid date string
      assert(getResponse.body.party.createdAt);
      assert(typeof getResponse.body.party.createdAt === 'string');
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
