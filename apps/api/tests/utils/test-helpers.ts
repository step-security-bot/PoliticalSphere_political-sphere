// Test utilities for Political Sphere API tests
// Provides reusable helpers for database setup, mocking, and assertions

import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';

import { getTestDatabase } from '../../src/test-support/index.ts';

/**
 * Database test utilities
 */
export const dbHelpers = {
  testDb: getTestDatabase(),

  /**
   * Initialize database for tests
   * @returns {Object} Database instance
   */
  async setupDatabase() {
    return this.testDb.setup();
  },

  /**
   * Clean up database after tests
   */
  async teardownDatabase() {
    await this.testDb.teardown();
  },

  /**
   * Create a test user with default values
   * @param {Object} overrides - Properties to override defaults
   * @returns {Object} Created user
   */
  async createTestUser(overrides = {}) {
    return this.testDb.createTestUser(overrides);
  },

  /**
   * Create a test party with default values
   * @param {Object} overrides - Properties to override defaults
   * @returns {Object} Created party
   */
  async createTestParty(overrides = {}) {
    return this.testDb.createTestParty(overrides);
  },

  /**
   * Create a test bill with default values
   * @param {Object} overrides - Properties to override defaults
   * @returns {Object} Created bill
   */
  async createTestBill(overrides = {}) {
    return this.testDb.createTestBill(overrides);
  },
};

/**
 * HTTP request utilities
 */
export const httpHelpers = {
  /**
   * Create supertest agent with common middleware
   * @param {Object} app - Express app instance
   * @returns {Object} Supertest agent
   */
  createTestAgent(app) {
    // Add common test middleware
    app.use((req, _res, next) => {
      // Debug logging in test mode
      if (process.env.NODE_ENV === 'test') {
        console.debug('[test] incoming headers:', req.headers);
      }
      next();
    });

    // Custom body parser for test environment
    app.use(express.text({ type: '*/*' }));
    app.use((req, _res, next) => {
      try {
        if (typeof req.body === 'string' && req.body.length > 0) {
          req.body = JSON.parse(req.body);
        }
        return next();
      } catch (err) {
        return next(err);
      }
    });

    return request(app);
  },

  /**
   * Set common headers for API requests
   * @param {Object} request - Supertest request object
   * @returns {Object} Request with headers set
   */
  setApiHeaders(request) {
    return request.set('Content-Type', 'application/json; charset=utf-8');
  },

  /**
   * Generate JWT token for test authentication
   * @param {Object} payload - Token payload (userId, username, etc.)
   * @param {string} expiresIn - Token expiration (default: '1h')
   * @returns {string} JWT token
   */
  generateTestToken(payload = {}, expiresIn = '1h') {
    const defaultPayload = {
      userId: `test-user-${Date.now()}`,
      username: 'testuser',
      ...payload,
    };

    const secret = process.env.JWT_SECRET || 'test-secret-key-at-least-32-characters-long';
    return jwt.sign(defaultPayload, secret, { expiresIn });
  },

  /**
   * Add authorization header with JWT token to request
   * @param {Object} request - Supertest request object
   * @param {string} token - JWT token (if not provided, generates a test token)
   * @returns {Object} Request with Authorization header
   */
  withAuth(request, token = null) {
    const authToken = token || this.generateTestToken();
    return request.set('Authorization', `Bearer ${authToken}`);
  },
};

/**
 * Mock utilities
 */
export const mockHelpers = {
  /**
   * Create mock user data
   * @param {Object} overrides - Properties to override defaults
   * @returns {Object} Mock user data
   */
  createMockUser(overrides = {}) {
    return {
      id: `user_${Date.now()}`,
      username: `mockuser_${Date.now()}`,
      email: `mock${Date.now()}@example.com`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  },

  /**
   * Create mock bill data
   * @param {Object} overrides - Properties to override defaults
   * @returns {Object} Mock bill data
   */
  createMockBill(overrides = {}) {
    return {
      id: `bill_${Date.now()}`,
      title: `Mock Bill ${Date.now()}`,
      description: 'A mock bill for testing',
      proposerId: `user_${Date.now()}`,
      status: 'proposed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  },
};
