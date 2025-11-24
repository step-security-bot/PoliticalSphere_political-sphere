import express, { type Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import authRoutes from '../../../src/routes/auth';

const bcryptMock = { hash: vi.fn(), compare: vi.fn() };
const jwtMock = { sign: vi.fn() };
const loggerMock = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

let mockUsersStore = { create: vi.fn(), getUserForAuth: vi.fn() };

vi.mock('bcrypt', () => ({
  default: bcryptMock,
}));

vi.mock('jsonwebtoken', () => ({
  default: jwtMock,
}));

vi.mock('../../stores/index.ts', () => ({
  getDatabase: () => ({ users: mockUsersStore }),
}));

vi.mock('../../logger.js', () => ({
  default: loggerMock,
}));

describe('auth routes', () => {
  let app: Express;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsersStore = {
      create: vi.fn(),
      getUserForAuth: vi.fn(),
    };
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
  });

  describe('POST /auth/register', () => {
    it('creates a user when payload is valid', async () => {
      bcryptMock.hash.mockResolvedValue('hashed-password');
      mockUsersStore.create.mockResolvedValue({
        id: 'user-123',
        username: 'demo',
        email: 'demo@example.com',
      });

      const response = await request(app)
        .post('/auth/register')
        .send({ username: 'demo', email: 'demo@example.com', password: 'secret' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(mockUsersStore.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'demo',
          email: 'demo@example.com',
          passwordHash: 'hashed-password',
          role: 'VIEWER',
        })
      );
    });

    it('returns 400 when fields are missing', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ email: 'only@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(mockUsersStore.create).not.toHaveBeenCalled();
    });

    it('returns 409 on duplicate users', async () => {
      bcryptMock.hash.mockResolvedValue('hashed-password');
      mockUsersStore.create.mockRejectedValue(
        new Error('UNIQUE constraint failed: users.username')
      );

      const response = await request(app)
        .post('/auth/register')
        .send({ username: 'demo', email: 'demo@example.com', password: 'secret' });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('User already exists');
    });
  });

  describe('POST /auth/login', () => {
    it('returns a token when credentials are valid', async () => {
      const dbUser = {
        id: 'user-123',
        username: 'demo',
        email: 'demo@example.com',
        passwordHash: 'hashed-password',
      };
      mockUsersStore.getUserForAuth.mockResolvedValue(dbUser);
      bcryptMock.compare.mockResolvedValue(true);
      jwtMock.sign.mockReturnValue('signed.jwt.token');

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'demo@example.com', password: 'secret' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBe('signed.jwt.token');
    });

    it('returns 401 when user is missing', async () => {
      mockUsersStore.getUserForAuth.mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'missing@example.com', password: 'secret' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('returns 401 when password is invalid', async () => {
      mockUsersStore.getUserForAuth.mockResolvedValue({
        id: 'user-123',
        username: 'demo',
        email: 'demo@example.com',
        passwordHash: 'hashed-password',
      });
      bcryptMock.compare.mockResolvedValue(false);

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'demo@example.com', password: 'wrong' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  it('POST /auth/logout responds with success', async () => {
    const response = await request(app).post('/auth/logout');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Logged out successfully',
    });
  });

  describe('SQL Injection Protection', () => {
    it('should reject registration with SQL injection in email (single quote)', async () => {
      const response = await request(app).post('/auth/register').send({
        username: 'testuser',
        email: "test@example.com' OR '1'='1",
        password: 'securepassword123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details[0].field).toBe('email');
      expect(response.body.details[0].message).toBe('Invalid email address');
    });

    it('should reject registration with SQL injection in email (semicolon)', async () => {
      const response = await request(app).post('/auth/register').send({
        username: 'testuser',
        email: 'test@example.com; DROP TABLE users;',
        password: 'securepassword123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details[0].field).toBe('email');
      expect(response.body.details[0].message).toBe('Invalid email address');
    });

    it('should reject registration with SQL injection in email (double dash)', async () => {
      const response = await request(app).post('/auth/register').send({
        username: 'testuser',
        email: 'test@example.com--',
        password: 'securepassword123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details[0].field).toBe('email');
      expect(response.body.details[0].message).toBe('Invalid email address');
    });

    it('should reject registration with SQL injection in email (backslash)', async () => {
      const response = await request(app).post('/auth/register').send({
        username: 'testuser',
        email: 'test@example.com\\',
        password: 'securepassword123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details[0].field).toBe('email');
      expect(response.body.details[0].message).toBe('Invalid email address');
    });

    it('should reject login with SQL injection in email', async () => {
      const response = await request(app).post('/auth/login').send({
        email: "test@example.com' OR '1'='1",
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details[0].field).toBe('email');
      expect(response.body.details[0].message).toBe('Invalid email address');
    });
  });

  describe('Email Validation Edge Cases', () => {
    it('should reject registration with email containing spaces', async () => {
      const response = await request(app).post('/auth/register').send({
        username: 'testuser',
        email: 'test @example.com',
        password: 'securepassword123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details[0].field).toBe('email');
    });

    it('should reject registration with email missing @ symbol', async () => {
      const response = await request(app).post('/auth/register').send({
        username: 'testuser',
        email: 'testexample.com',
        password: 'securepassword123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details[0].field).toBe('email');
    });

    it('should reject registration with email missing domain', async () => {
      const response = await request(app).post('/auth/register').send({
        username: 'testuser',
        email: 'test@',
        password: 'securepassword123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details[0].field).toBe('email');
    });

    it('should reject registration with email having consecutive dots', async () => {
      const response = await request(app).post('/auth/register').send({
        username: 'testuser',
        email: 'test..user@example.com',
        password: 'securepassword123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details[0].field).toBe('email');
    });

    it('should reject registration with email starting with dot', async () => {
      const response = await request(app).post('/auth/register').send({
        username: 'testuser',
        email: '.test@example.com',
        password: 'securepassword123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details[0].field).toBe('email');
    });

    it('should reject registration with email ending with dot', async () => {
      const response = await request(app).post('/auth/register').send({
        username: 'testuser',
        email: 'test.@example.com',
        password: 'securepassword123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details[0].field).toBe('email');
    });

    it('should reject registration with overly long email', async () => {
      const longEmail = `${'a'.repeat(250)}@example.com`; // Exceeds 255 char limit
      const response = await request(app).post('/auth/register').send({
        username: 'testuser',
        email: longEmail,
        password: 'securepassword123',
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.details[0].field).toBe('email');
    });

    it('should accept registration with valid email containing plus sign', async () => {
      bcryptMock.hash.mockResolvedValue('hashed-password');
      mockUsersStore.create.mockResolvedValue({
        id: 'user-123',
        username: 'testuser',
        email: 'test+tag@example.com',
      });

      const response = await request(app).post('/auth/register').send({
        username: 'testuser',
        email: 'test+tag@example.com',
        password: 'securepassword123',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should accept registration with valid email containing underscore', async () => {
      bcryptMock.hash.mockResolvedValue('hashed-password');
      mockUsersStore.create.mockResolvedValue({
        id: 'user-123',
        username: 'testuser',
        email: 'test_user@example.com',
      });

      const response = await request(app).post('/auth/register').send({
        username: 'testuser',
        email: 'test_user@example.com',
        password: 'securepassword123',
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });
  });
});
