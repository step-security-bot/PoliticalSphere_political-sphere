import assert from 'node:assert';

import express from 'express';

import { closeDatabase, getDatabase } from '../../src/stores/index.ts';
import billsRouter from '../../src/routes/bills.js';
import partiesRouter from '../../src/routes/parties.js';
import usersRouter from '../../src/routes/users.js';
import votesRouter from '../../src/routes/votes.js';
import { dispatchRequest } from '../utils/express-request.js';

describe('Demo Flow Integration Test', () => {
  let app;

  beforeEach(() => {
    getDatabase();
    app = express();
    app.use('/api', usersRouter);
    app.use('/api', partiesRouter);
    app.use('/api', billsRouter);
    app.use('/api', votesRouter);
  });

  afterEach(() => {
    closeDatabase();
  });

  it('should complete the full demo flow: create user → propose bill → vote', async () => {
    const timestamp = Date.now();

    const userResponse = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/users',
      body: {
        username: `alice${timestamp}`,
        email: `alice-${timestamp}@example.com`,
      },
    });
    assert.strictEqual(userResponse.status, 201);

    const partyResponse = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/parties',
      body: {
        name: `Progressive Party ${timestamp}`,
        description: 'A party focused on social progress and equality',
        color: '#FF6B6B',
      },
    });
    assert.strictEqual(partyResponse.status, 201);

    const billResponse = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/bills',
      body: {
        title: `Environmental Protection Act ${timestamp}`,
        description: 'A comprehensive bill to protect our environment and reduce carbon emissions',
        proposerId: userResponse.body.data.id,
      },
    });
    assert.strictEqual(billResponse.status, 201);

    const user2Response = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/users',
      body: {
        username: `bob${timestamp}`,
        email: `bob-${timestamp}@example.com`,
      },
    });
    assert.strictEqual(user2Response.status, 201);

    const vote1Response = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/votes',
      body: {
        billId: billResponse.body.id,
        userId: userResponse.body.data.id,
        vote: 'aye',
      },
    });
    assert.strictEqual(vote1Response.status, 201);

    const vote2Response = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/votes',
      body: {
        billId: billResponse.body.id,
        userId: user2Response.body.data.id,
        vote: 'nay',
      },
    });
    assert.strictEqual(vote2Response.status, 201);

    const countsResponse = await dispatchRequest(app, {
      method: 'GET',
      url: `/api/bills/${billResponse.body.id}/vote-counts`,
    });
    assert.strictEqual(countsResponse.status, 200);
    assert.strictEqual(countsResponse.body.aye, 1);
    assert.strictEqual(countsResponse.body.nay, 1);
    assert.strictEqual(countsResponse.body.abstain, 0);

    const billDetailsResponse = await dispatchRequest(app, {
      method: 'GET',
      url: `/api/bills/${billResponse.body.id}`,
    });
    assert.strictEqual(billDetailsResponse.status, 200);
    assert.strictEqual(billDetailsResponse.body.title, `Environmental Protection Act ${timestamp}`);
    assert.strictEqual(billDetailsResponse.body.status, 'proposed');

    const votesResponse = await dispatchRequest(app, {
      method: 'GET',
      url: `/api/bills/${billResponse.body.id}/votes`,
    });
    assert.strictEqual(votesResponse.status, 200);
    assert(Array.isArray(votesResponse.body));
    assert.strictEqual(votesResponse.body.length, 2);
  });
});
