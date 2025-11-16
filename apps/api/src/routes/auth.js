import express from 'express';
import { z } from 'zod';

import { authService } from '../auth/auth.service.ts';
import logger from '../logger.js';

const router = express.Router();

// Validation schemas
const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  email: z.string().email('Invalid email address').max(255, 'Email must not exceed 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// POST /register - Register new user
router.post('/register', async (req, res) => {
  try {
    // Validate input with Zod schema
    const validated = RegisterSchema.parse(req.body);

    // Use centralized authService for registration
    const { user, tokens } = await authService.register({
      username: validated.username,
      email: validated.email,
      password: validated.password,
    });

    logger.info('User registered successfully', { userId: user.id, username: user.username });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    logger.error('Registration error:', error);

    // Handle duplicate user
    if (error.message?.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Registration failed',
    });
  }
});

// POST /login - Login user
router.post('/login', async (req, res) => {
  try {
    // Validate input with Zod schema
    const validated = LoginSchema.parse(req.body);

    // Use centralized authService for login
    const { user, tokens } = await authService.login({
      username: validated.email, // authService uses username, but we accept email
      password: validated.password,
    });

    logger.info('User logged in', { userId: user.id, username: user.username });

    res.json({
      success: true,
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    logger.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Login failed',
    });
  }
});

// POST /logout - Logout user
router.post('/logout', (_req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default router;
