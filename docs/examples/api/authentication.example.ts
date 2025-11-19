o; /**
 * Authentication Examples
 *
 * Demonstrates secure authentication patterns including:
 * - User registration with validation
 * - Login with JWT token generation
 * - Protected route middleware
 * - Password hashing and verification
 *
 * Standards: OWASP ASVS 4.0.3 Authentication
 */

import bcrypt from 'bcrypt';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// ============================================================================
// SCHEMAS
// ============================================================================

const RegisterSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9_-]+$/),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number'),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// ============================================================================
// TYPES
// ============================================================================

interface JWTPayload {
  userId: string;
  role: 'user' | 'moderator' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// ============================================================================
// EXAMPLE 1: User Registration
// ============================================================================

export async function registerUser(req: Request, res: Response): Promise<void> {
  try {
    // 1. Validate input
    const data = RegisterSchema.parse(req.body);

    // 2. Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1 OR username = $2', [
      data.email,
      data.username,
    ]);

    if (existingUser.rows.length > 0) {
      res.status(409).json({
        error: 'User with this email or username already exists',
      });
      return;
    }

    // 3. Hash password (NEVER store plain text)
    const passwordHash = await bcrypt.hash(data.password, 12); // 12 rounds minimum

    // 4. Create user
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, 'user', true, NOW(), NOW())
       RETURNING id, username, email, role, created_at`,
      [data.username, data.email, passwordHash]
    );

    const user = result.rows[0];

    // 5. Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      role: user.role,
    });

    // 6. Store refresh token (for revocation capability)
    await db.query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')",
      [user.id, refreshToken]
    );

    // 7. Send response (NEVER send password hash)
    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes in seconds
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================================================
// EXAMPLE 2: User Login
// ============================================================================

export async function loginUser(req: Request, res: Response): Promise<void> {
  try {
    // 1. Validate input
    const data = LoginSchema.parse(req.body);

    // 2. Find user by email
    const result = await db.query(
      'SELECT id, username, email, password_hash, role, is_active FROM users WHERE email = $1',
      [data.email]
    );

    const user = result.rows[0];

    // 3. Check if user exists (use constant-time comparison to prevent timing attacks)
    if (!user) {
      // Perform dummy bcrypt to prevent timing attacks
      await bcrypt.compare(data.password, '$2b$12$dummyhashtopreventtimingattack');
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // 4. Check if account is active
    if (!user.is_active) {
      res.status(403).json({ error: 'Account is inactive' });
      return;
    }

    // 5. Verify password
    const isValid = await bcrypt.compare(data.password, user.password_hash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // 6. Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      role: user.role,
    });

    // 7. Store refresh token
    await db.query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')",
      [user.id, refreshToken]
    );

    // 8. Update last login
    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    // 9. Send response
    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================================================
// EXAMPLE 3: Authentication Middleware
// ============================================================================

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // 2. Verify token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }
    const payload = jwt.verify(token, secret) as JWTPayload;

    // 3. Attach user to request
    req.user = payload;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================================================
// EXAMPLE 4: Role-Based Authorization
// ============================================================================

export function authorize(...roles: Array<'user' | 'moderator' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateAccessToken(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }
  return jwt.sign(payload, secret, {
    expiresIn: '15m',
    algorithm: 'HS256',
  });
}

function generateRefreshToken(payload: JWTPayload): string {
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET not configured');
  }
  return jwt.sign(payload, refreshSecret, {
    expiresIn: '7d',
    algorithm: 'HS256',
  });
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
import express from 'express';
import { registerUser, loginUser, authenticate, authorize } from './authentication.example';

const app = express();

// Public routes
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);

// Protected routes
app.get('/api/users/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// Admin-only routes
app.delete('/api/users/:id', authenticate, authorize('admin'), (req, res) => {
  // Delete user logic
});
*/
