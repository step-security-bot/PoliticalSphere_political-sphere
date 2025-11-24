import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import partiesRouter from '../../src/routes/parties.ts';
import { closeDatabase, getDatabase } from '../index.js';
import { describeHttp, shouldSkipHttpTests } from '../utils/http-test-guard.ts';

const suite = shouldSkipHttpTests ? describe.skip : describeHttp;

suite('parties routes', () => {
  let app;

  beforeEach(() => {
    // Initialize fresh database connection for this test
    getDatabase();
    app = express();
    app.use(express.json());
    app.use('/', partiesRouter);
  });

  afterEach(() => {
    // Close database connection to reset for next test
    closeDatabase();
  });

  it('creates a party (POST /parties)', async () => {
    const uniqueName = `Test Party ${Date.now()}`;
    const res = await request(app)
      .post('/parties')
      .send({
        name: uniqueName,
        description: 'test party',
        color: '#FF5733', // Required by CreatePartySchema
      })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.name).toBe(uniqueName);
  });

  it('GET /parties/:id returns 404 for missing', async () => {
    const res = await request(app).get('/parties/missing');
    expect(res.status).toBe(404);
  });

  it('GET /parties returns list', async () => {
    const res = await request(app).get('/parties');
    expect(res.status).toBe(200);
    // Response structure is { parties: [...], total: N }
    expect(res.body).toHaveProperty('parties');
    expect(Array.isArray(res.body.parties)).toBe(true);
    // May be empty or have parties from other tests, just verify structure
  });
});
