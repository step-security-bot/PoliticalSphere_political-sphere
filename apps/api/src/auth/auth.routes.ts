/**
 * Authentication Routes
 * Handles /auth endpoints
 */

import { Router } from 'express';
import { z } from 'zod';

import { authenticate } from './auth.middleware.ts';
import { authService } from './auth.service.ts';
import logger from '../utils/logger.js';
import { auditAuth } from '../middleware/audit.middleware.ts';

// Validation schemas
/**
 * registerSchema - Zod schema for the /auth/register endpoint
 */
/**
 * @public
 * Zod schema for the /auth/register endpoint
 */
export const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(128),
  email: z.string().email().optional(),
});

/**
 * loginSchema - Zod schema for the /auth/login endpoint; accepts username or email
 */
/**
 * @public
 * Zod schema for the /auth/login endpoint; accepts username or email
 */
export const loginSchema = z
  .object({
    username: z.string().min(1).max(50).optional(),
    email: z.string().email().optional(),
    password: z.string().min(1),
  })
  .refine(data => data.username || data.email, {
    message: 'Either username or email must be provided',
  });

/**
 * router - Express router for authentication endpoints
 */
/**
 * @public
 * Express router for authentication endpoints
 */
export const router = Router();

// Apply audit logging to all auth routes
router.use(auditAuth);

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res
        .status(400)
        .json({ success: false, error: 'Invalid input', details: validation.error.issues });
      return;
    }

    const { username, password, email } = validation.data;

    const result = await authService.register({ username, password, email });

    // Set httpOnly cookies for tokens
    res.cookie('accessToken', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    logger.error('Registration error:', error);
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * POST /auth/login
 * Login existing user (accepts username or email)
 */
router.post('/login', async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res
        .status(400)
        .json({ success: false, error: 'Invalid input', details: validation.error.issues });
      return;
    }

    const { username, email, password } = validation.data;
    const usernameOrEmail = username || email;

    const result = await authService.login({ username: usernameOrEmail!, password });

    // Set httpOnly cookies for tokens
    res.cookie('accessToken', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      success: true,
      data: {
        user: result.user,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ success: false, error: message });
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
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(400).json({ error: 'No refresh token found' });
      return;
    }

    await authService.revokeRefreshToken(refreshToken);

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    res.status(400).json({ success: false, error: message });
  }
});

/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    if (!req.authUser) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await authService.getUserById(req.authUser.userId);
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

/**
 * Default `express.Router` for authentication endpoints (`/auth`).
 *
 * Exposes health, login, register and token endpoints used by the web UI
 * and API clients.
 */
export default router;
