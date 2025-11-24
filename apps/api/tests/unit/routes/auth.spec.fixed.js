import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import authRoutes from '../../routes/auth.js';

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
  let app;

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
});
