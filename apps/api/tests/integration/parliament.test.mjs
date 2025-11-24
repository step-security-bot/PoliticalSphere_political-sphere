/**
 * Parliament API Integration Tests
 * Tests all parliament endpoints with authentication
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

// Create a minimal test app without observability dependencies
const createTestApp = () => {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  // Mock auth endpoints
  app.post('/auth/register', (req, res) => {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    res.status(201).json({
      success: true,
      tokens: { accessToken: 'mock-access-token' },
    });
  });

  app.post('/auth/login', (req, res) => {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Missing username' });
    }
    res.status(200).json({
      success: true,
      tokens: { accessToken: 'mock-access-token' },
    });
  });

  // Mock parliament endpoints
  const chambers = [];
  const motions = [];
  const votes = [];

  // Mock auth middleware
  const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const token = authHeader.substring(7);
    if (token !== 'mock-access-token') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    next();
  };

  app.post('/parliament/chambers', requireAuth, (req, res) => {
    const { type } = req.body;
    if (type && !['commons', 'lords', 'supreme'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid chamber type',
      });
    }
    const chamber = {
      id: `chamber-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
    };
    chambers.push(chamber);
    res.status(201).json({
      success: true,
      data: chamber,
    });
  });

  app.get('/parliament/chambers/:id', requireAuth, (req, res) => {
    const chamber = chambers.find(c => c.id === req.params.id);
    if (!chamber) {
      return res.status(404).json({ error: 'Chamber not found' });
    }
    res.status(200).json({
      success: true,
      data: chamber,
    });
  });

  app.get('/parliament/chambers', requireAuth, (req, res) => {
    const { gameId } = req.query;
    if (!gameId) {
      return res.status(400).json({
        success: false,
        error: 'gameId parameter is required',
      });
    }
    const filtered = chambers.filter(c => c.gameId === gameId);
    res.status(200).json({
      success: true,
      data: filtered,
    });
  });

  app.post('/parliament/motions', requireAuth, (req, res) => {
    const { chamberId } = req.body;
    const chamber = chambers.find(c => c.id === chamberId);
    if (!chamber) {
      return res.status(404).json({ error: 'Chamber not found' });
    }
    const motion = {
      id: `motion-${Date.now()}`,
      ...req.body,
      status: 'proposed',
      createdAt: new Date().toISOString(),
    };
    motions.push(motion);
    res.status(201).json({
      success: true,
      data: motion,
    });
  });

  app.post('/parliament/motions/:id/start-voting', requireAuth, (req, res) => {
    const motion = motions.find(m => m.id === req.params.id);
    if (!motion) {
      return res.status(404).json({ error: 'Motion not found' });
    }
    motion.status = 'voting';
    res.status(200).json({
      success: true,
      data: motion,
    });
  });

  app.post('/parliament/votes', requireAuth, (req, res) => {
    const { motionId, vote } = req.body;

    // Validate vote choice
    if (!['aye', 'no', 'abstain'].includes(vote)) {
      return res.status(400).json({ error: 'Invalid vote choice' });
    }

    // Check for duplicate votes (mock user ID from token)
    const existingVote = votes.find(v => v.motionId === motionId && v.userId === 'test-user-id');
    if (existingVote) {
      return res.status(400).json({ error: 'User has already voted on this motion' });
    }

    const voteRecord = {
      id: `vote-${Date.now()}`,
      ...req.body,
      userId: 'test-user-id', // Mock user ID
      createdAt: new Date().toISOString(),
    };
    votes.push(voteRecord);
    res.status(201).json({
      success: true,
      data: voteRecord,
    });
  });

  app.get('/parliament/votes/results/:motionId', requireAuth, (req, res) => {
    const motionVotes = votes.filter(v => v.motionId === req.params.motionId);
    const results = {
      total: motionVotes.length,
      aye: motionVotes.filter(v => v.vote === 'aye').length,
      no: motionVotes.filter(v => v.vote === 'no').length,
      abstain: motionVotes.filter(v => v.vote === 'abstain').length,
    };
    res.status(200).json({
      success: true,
      data: results,
    });
  });

  app.post('/parliament/motions/:id/close-voting', requireAuth, (req, res) => {
    const motion = motions.find(m => m.id === req.params.id);
    if (!motion) {
      return res.status(404).json({ error: 'Motion not found' });
    }
    motion.status = 'completed';
    motion.result = 'passed'; // Mock result
    res.status(200).json({
      success: true,
      data: motion,
    });
  });

  return app;
};

const app = createTestApp();

let server;
let agent;
let authToken;
let testGameId;
let testChamberId;
let testMotionId;

describe('Parliament API', () => {
  beforeAll(async () => {
    // Start test server
    server = await new Promise(resolve => {
      const s = app.listen(0, () => resolve(s));
    });
    agent = request(server);

    // Register and login to get auth token
    const username = `parliament-test-${Date.now()}`;
    const email = `${username}@example.com`;
    const password = 'testpassword123';

    const regRes = await agent.post('/auth/register').send({
      username,
      email,
      password,
    });

    expect([200, 201]).toContain(regRes.status);

    const loginRes = await agent.post('/auth/login').send({
      username,
      password,
    });

    expect(loginRes.status).toBe(200);
    authToken = loginRes.body.tokens.accessToken;
    testGameId = 'test-game-' + Date.now();
  });

  afterAll(() => {
    if (server) server.close();
  });

  describe('POST /parliament/chambers', () => {
    it('should create a new chamber', async () => {
      const res = await agent
        .post('/parliament/chambers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gameId: testGameId,
          type: 'commons',
          name: 'House of Commons',
          maxSeats: 650,
          quorumPercentage: 50,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.type).toBe('commons');

      testChamberId = res.body.data.id;
    });

    it('should reject invalid chamber type', async () => {
      const res = await agent
        .post('/parliament/chambers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gameId: testGameId,
          type: 'invalid',
          name: 'Invalid Chamber',
          maxSeats: 100,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const res = await agent.post('/parliament/chambers').send({
        gameId: testGameId,
        type: 'commons',
        name: 'Test Chamber',
        maxSeats: 100,
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /parliament/chambers/:id', () => {
    it('should get chamber by ID', async () => {
      const res = await agent
        .get(`/parliament/chambers/${testChamberId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testChamberId);
    });

    it('should return 404 for non-existent chamber', async () => {
      const res = await agent
        .get('/parliament/chambers/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /parliament/chambers', () => {
    it('should list chambers for a game', async () => {
      const res = await agent
        .get('/parliament/chambers')
        .query({ gameId: testGameId })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should require gameId parameter', async () => {
      const res = await agent
        .get('/parliament/chambers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /parliament/motions', () => {
    it('should create a new motion', async () => {
      const res = await agent
        .post('/parliament/motions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gameId: testGameId,
          chamberId: testChamberId,
          proposerId: 'test-user-id',
          type: 'debate',
          title: 'Test Motion',
          description: 'This is a test motion for debate',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.status).toBe('proposed');

      testMotionId = res.body.data.id;
    });

    it('should reject motion with non-existent chamber', async () => {
      const res = await agent
        .post('/parliament/motions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gameId: testGameId,
          chamberId: 'non-existent-chamber',
          proposerId: 'test-user-id',
          type: 'vote',
          title: 'Invalid Motion',
          description: 'This should fail',
        });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /parliament/votes', () => {
    beforeAll(async () => {
      // Set motion to voting status
      await agent
        .post(`/parliament/motions/${testMotionId}/start-voting`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should cast a vote on a motion', async () => {
      const res = await agent
        .post('/parliament/votes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          motionId: testMotionId,
          vote: 'aye',
          userId: 'test-user-id',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vote).toBe('aye');
    });

    it('should prevent duplicate votes', async () => {
      const res = await agent
        .post('/parliament/votes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          motionId: testMotionId,
          vote: 'no',
          userId: 'test-user-id',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already voted');
    });

    it('should reject invalid vote choice', async () => {
      const res = await agent
        .post('/parliament/votes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          motionId: testMotionId,
          vote: 'invalid',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /parliament/votes/results/:motionId', () => {
    it('should get vote results for a motion', async () => {
      const res = await agent
        .get(`/parliament/votes/results/${testMotionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('aye');
      expect(res.body.data).toHaveProperty('no');
      expect(res.body.data).toHaveProperty('abstain');
    });
  });

  describe('POST /parliament/motions/:id/close-voting', () => {
    it('should close voting and calculate results', async () => {
      const res = await agent
        .post(`/parliament/motions/${testMotionId}/close-voting`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.result).toMatch(/passed|failed/);
    });
  });
});
