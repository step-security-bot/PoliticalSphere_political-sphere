/**
 * Authentication Routes
 * Handles /auth endpoints
 */

import { Router } from 'express';

import type { AuthRequest } from './auth.middleware.ts';
import { authenticate } from './auth.middleware.ts';
import { authService } from './auth.service.ts';

const router = Router();

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const result = await authService.register({ username, password, email });

    res.status(201).json({
      user: result.user,
      tokens: result.tokens,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ error: message });
  }
});

/**
 * POST /auth/login
 * Login existing user (accepts username or email)
 */
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const usernameOrEmail = username || email;

    if (!usernameOrEmail || !password) {
      res.status(400).json({ error: 'Username/email and password are required' });
      return;
    }

    const result = await authService.login({ username: usernameOrEmail, password });

    res.json({
      user: result.user,
      tokens: result.tokens,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: message });
  }
});

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    const result = await authService.refreshAccessToken(refreshToken);

    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    res.status(401).json({ error: message });
  }
});

/**
 * POST /auth/logout
 * Revoke refresh token (logout)
 */
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    await authService.revokeRefreshToken(refreshToken);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    res.status(400).json({ error: message });
  }
});

/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await authService.getUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /auth/health
 * Health check endpoint
 */
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auth' });
});

export default router;
