/**
 * Parliament API Integration Tests
 * Tests all parliament endpoints with authentication
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

const API_URL = process.env.API_URL || 'http://localhost:4000';
let authToken;
let testGameId;
let testChamberId;
let testMotionId;

describe('Parliament API', () => {
  beforeAll(async () => {
    // Login to get auth token
    const loginRes = await request(API_URL)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword123',
      });
    
    authToken = loginRes.body.token;
    testGameId = 'test-game-' + Date.now();
  });

  describe('POST /api/parliament/chambers', () => {
    it('should create a new chamber', async () => {
      const res = await request(API_URL)
        .post('/api/parliament/chambers')
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
      const res = await request(API_URL)
        .post('/api/parliament/chambers')
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
      const res = await request(API_URL)
        .post('/api/parliament/chambers')
        .send({
          gameId: testGameId,
          type: 'commons',
          name: 'Test Chamber',
          maxSeats: 100,
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/parliament/chambers/:id', () => {
    it('should get chamber by ID', async () => {
      const res = await request(API_URL)
        .get(`/api/parliament/chambers/${testChamberId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testChamberId);
    });

    it('should return 404 for non-existent chamber', async () => {
      const res = await request(API_URL)
        .get('/api/parliament/chambers/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/parliament/chambers', () => {
    it('should list chambers for a game', async () => {
      const res = await request(API_URL)
        .get('/api/parliament/chambers')
        .query({ gameId: testGameId })
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should require gameId parameter', async () => {
      const res = await request(API_URL)
        .get('/api/parliament/chambers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/parliament/motions', () => {
    it('should create a new motion', async () => {
      const res = await request(API_URL)
        .post('/api/parliament/motions')
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
      const res = await request(API_URL)
        .post('/api/parliament/motions')
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

  describe('POST /api/parliament/votes', () => {
    beforeAll(async () => {
      // Set motion to voting status
      await request(API_URL)
        .post(`/api/parliament/motions/${testMotionId}/start-voting`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should cast a vote on a motion', async () => {
      const res = await request(API_URL)
        .post('/api/parliament/votes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          motionId: testMotionId,
          vote: 'aye',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vote).toBe('aye');
    });

    it('should prevent duplicate votes', async () => {
      const res = await request(API_URL)
        .post('/api/parliament/votes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          motionId: testMotionId,
          vote: 'no',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already voted');
    });

    it('should reject invalid vote choice', async () => {
      const res = await request(API_URL)
        .post('/api/parliament/votes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          motionId: testMotionId,
          vote: 'invalid',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/parliament/votes/results/:motionId', () => {
    it('should get vote results for a motion', async () => {
      const res = await request(API_URL)
        .get(`/api/parliament/votes/results/${testMotionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('aye');
      expect(res.body.data).toHaveProperty('no');
      expect(res.body.data).toHaveProperty('abstain');
    });
  });

  describe('POST /api/parliament/motions/:id/close-voting', () => {
    it('should close voting and calculate results', async () => {
      const res = await request(API_URL)
        .post(`/api/parliament/motions/${testMotionId}/close-voting`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.result).toMatch(/passed|failed/);
    });
  });
});
