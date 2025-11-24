import express from 'express';
import { z } from 'zod';

import { authService } from '../auth/auth.service.ts';
import logger from '../logger.js';

/**
 * Router for authentication endpoints (`/register`, `/login`, `/logout`).
 *
 * Validates request payloads using Zod schemas and delegates auth operations
 * to `authService`. Responses follow the standard `{ success, data?, error? }`
 * envelope used across the API.
 */
const router = express.Router();

/**
 * Zod schema for user registration requests.
 * Validates username, email, and password fields with comprehensive validation rules.
 */
const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must not exceed 255 characters')
    .refine(
      email => {
        // Reject SQL injection patterns in email (single quote, double quote, semicolon, backslash, double dash)
        const sqlPatterns = /['";\\]|--/;
        return !sqlPatterns.test(email);
      },
      { message: 'Invalid email address' }
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

/**
 * Zod schema for user login requests.
 * Validates that either email or username is provided along with password.
 */
const LoginSchema = z
  .object({
    email: z.string().email('Invalid email address').optional(),
    username: z.string().min(1, 'Username is required').optional(),
    password: z.string().min(1, 'Password is required'),
  })
  .refine(data => data.email || data.username, {
    message: 'Either email or username is required',
    path: ['email'], // Point to email field for error
  });

/**
 * POST /register - Register a new user
 * Validates registration payload and returns user + tokens on success
 */
router.post('/register', async (req, res) => {
  try {
    // Validate input with Zod schema
    const validated = RegisterSchema.parse(req.body);

    // Use centralized authService for registration
    const result = await authService.register({
      username: validated.username,
      email: validated.email,
      password: validated.password,
    });

    // Defensive null checks
    if (!result || !result.user || !result.tokens) {
      logger.error('Registration returned invalid result', { result });
      return res.status(500).json({
        success: false,
        error: 'Registration failed - invalid response',
      });
    }

    const { user, tokens } = result;

    logger.info('User registered successfully', { userId: user.id, username: user.username });

    // Build response with explicit field checks
    const responseData = {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email || '',
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };

    // Send response
    res.status(201).json(responseData);
    return;
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
    if ((error as Error).message?.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
      });
    }

    return res.status(500).json({
      success: false,
      error: (error as Error).message || 'Registration failed',
    });
  }
});

/**
 * POST /login - Authenticate user using email or username and password
 * Returns access and refresh tokens upon successful authentication
 */
router.post('/login', async (req, res) => {
  try {
    // Validate input with Zod schema
    const validated = LoginSchema.parse(req.body);

    // Use centralized authService for login - pass email or username
    const loginIdentifier = validated.email || validated.username || '';
    if (!loginIdentifier) {
      return res.status(400).json({
        success: false,
        error: 'Email or username required',
      });
    }

    const result = await authService.login({
      username: loginIdentifier,
      password: validated.password,
    });

    // Defensive null checks
    if (!result || !result.user || !result.tokens) {
      logger.error('Login returned invalid result', { result });
      return res.status(500).json({
        success: false,
        error: 'Login failed - invalid response',
      });
    }

    const { user, tokens } = result;

    logger.info('User logged in', { userId: user.id, username: user.username });

    const responseData = {
      success: true,
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email || '',
        },
      },
    };

    res.json(responseData);
    return;
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
    return res.status(401).json({
      success: false,
      error: (error as Error).message || 'Login failed',
    });
  }
});

/**
 * POST /logout - Logout a user (stateless endpoint that acknowledges the action)
 */
router.post('/logout', (_req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * Authentication routes exposing `/register`, `/login`, and `/logout`.
 * These endpoints validate input, perform credential checks via `authService`,
 * and return structured responses including authentication tokens.
 */
/**
 * Authentication router
 *
 * Exposes endpoints for user registration, login and logout. Incoming payloads
 * are validated via shared schemas and authentication flows delegate to
 * `authService` for token generation and session management.
 */
export default router;
