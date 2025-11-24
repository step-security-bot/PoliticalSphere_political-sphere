import assert from 'node:assert';

import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

import { bearer } from '../../tests/helpers/auth-token.mjs';
import authRoutes from '../auth/auth.routes.ts';
import { closeDatabase, getDatabase } from '../stores/index.ts';
import billsRouter from './bills.ts';
import usersRouter from './users.js';

// Mock database operations to avoid hanging
const mockBills = [];
vi.mock('../stores/index.ts', () => ({
  getDatabase: () => ({
    users: {
      create: user => Promise.resolve({ ...user }),
      getById: id => (id === 'test-user-id' ? { id, username: 'testuser' } : null),
    },
    bills: {
      create: bill => {
        const newBill = {
          ...bill,
          status: bill.status || 'proposed',
          id: `test-bill-id-${mockBills.length}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockBills.push(newBill);
        return Promise.resolve(newBill);
      },
      getById: id => Promise.resolve(mockBills.find(b => b.id === id) || null),
      getAll: () => Promise.resolve([...mockBills]),
      getCount: () => Promise.resolve(mockBills.length),
      getPaginated: () => Promise.resolve([...mockBills]),
    },
  }),
  closeDatabase: () => {},
}));

vi.mock('@political-sphere/shared', () => ({
  CreateBillSchema: {
    parse: data => data,
  },
  UpdateBillSchema: {
    parse: data => data,
  },
  parsePaginationQuery: () => ({ limit: 10, offset: 0 }),
  createPaginatedResponse: (data, total, options) => ({
    data,
    total,
    limit: options.limit,
    offset: options.offset,
  }),
  getOffset: options => options.offset || 0,
  getLogger: () => ({
    error: () => {},
    info: () => {},
    warn: () => {},
    debug: () => {},
  }),
}));

describe('Bills Routes', () => {
  let app;
  let authToken;
  const prevForceAuth = process.env.FORCE_AUTH;
  const prevNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Don't force auth in this test - let it bypass
    process.env.FORCE_AUTH = '0';
    process.env.NODE_ENV = 'test';
    mockBills.length = 0; // Clear mock bills
    getDatabase();
    app = express();
    app.use(express.json());
    app.use('/api', usersRouter);
    app.use('/api', billsRouter);
    app.use('/auth', authRoutes);

    // Use a mock token for testing (auth is bypassed in test env)
    authToken = 'mock-jwt-token-for-testing';

    // Ensure test user exists in database
    // Don't create user since mock already handles it
  });

  afterEach(() => {
    process.env.FORCE_AUTH = prevForceAuth;
    process.env.NODE_ENV = prevNodeEnv;
    closeDatabase();
  });

  function createUser() {
    // Return a fixed user ID for testing - assume user exists
    return 'test-user-id';
  }

  describe('POST /api/bills', () => {
    it('should create a new bill', async () => {
      const timestamp = Date.now();
      const userId = await createUser(timestamp);

      const response = await request(app)
        .post('/api/bills')
        .set(bearer(authToken))
        .send({
          title: `Test Bill ${timestamp}`,
          description: 'A test bill description',
          proposerId: userId,
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
      const response = await request(app).post('/api/bills').set(bearer(authToken)).send({
        title: 'Test Bill',
        description: 'A test bill description',
        proposerId: 'non-existent-id',
      });

      assert.strictEqual(response.status, 400);
      assert(response.body.error);
    });
  });

  describe('GET /api/bills/:id', () => {
    it('should return bill by id', async () => {
      const timestamp = Date.now();
      const userId = await createUser(timestamp);

      const billResponse = await request(app)
        .post('/api/bills')
        .set(bearer(authToken))
        .send({
          title: `Test Bill ${timestamp}`,
          description: 'A test bill description',
          proposerId: userId,
        });
      assert.strictEqual(billResponse.status, 201);

      const getResponse = await request(app)
        .get(`/api/bills/${billResponse.body.id}`)
        .set(bearer(authToken));

      assert.strictEqual(getResponse.status, 200);
      assert.deepStrictEqual(getResponse.body, billResponse.body);
    });

    it('should return 404 for non-existent bill', async () => {
      const response = await request(app).get('/api/bills/non-existent-id').set(bearer(authToken));

      assert.strictEqual(response.status, 404);
      assert.strictEqual(response.body.error, 'Bill not found');
    });
  });

  describe('GET /api/bills', () => {
    it('should return all bills', async () => {
      const userId = await createUser();

      const bill1Response = await request(app).post('/api/bills').set(bearer(authToken)).send({
        title: 'Bill 1',
        description: 'First bill',
        proposerId: userId,
      });
      assert.strictEqual(bill1Response.status, 201);

      const bill2Response = await request(app).post('/api/bills').set(bearer(authToken)).send({
        title: 'Bill 2',
        description: 'Second bill',
        proposerId: userId,
      });
      assert.strictEqual(bill2Response.status, 201);

      const getResponse = await request(app).get('/api/bills').set(bearer(authToken));

      assert.strictEqual(getResponse.status, 200);
      assert(Array.isArray(getResponse.body.data));
      assert(getResponse.body.data.some(b => b.id === bill1Response.body.id));
      assert(getResponse.body.data.some(b => b.id === bill2Response.body.id));
    });
  });
});
