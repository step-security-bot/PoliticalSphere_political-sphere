/**
 * Authentication Service
 * Handles user registration, login, and JWT token generation
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';

import { getDatabase } from '../modules/stores/index.ts';

const SALT_ROUNDS = 10;

// Validate required secrets on module load - fail fast if missing
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long');
}
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET.length < 32) {
  throw new Error('JWT_REFRESH_SECRET must be set and at least 32 characters long');
}
if (JWT_SECRET === JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
}

// After validation, we know these are strings
const JWT_SECRET_VALIDATED: string = JWT_SECRET;
const JWT_REFRESH_SECRET_VALIDATED: string = JWT_REFRESH_SECRET;

/**
 * JWT expiry time type - accepts time strings (e.g., '15m', '7d') or milliseconds
 * Using StringValue from 'ms' package for proper JWT compatibility
 */
type JwtExpiry = StringValue | number;

const DEFAULT_ACCESS_TOKEN_TTL: JwtExpiry = '15m';
const DEFAULT_REFRESH_TOKEN_TTL: JwtExpiry = '7d';

const JWT_EXPIRES_IN_VALIDATED: JwtExpiry =
  (process.env.JWT_EXPIRES_IN as JwtExpiry) ?? DEFAULT_ACCESS_TOKEN_TTL;
const JWT_REFRESH_EXPIRES_IN_VALIDATED: JwtExpiry =
  (process.env.JWT_REFRESH_EXPIRES_IN as JwtExpiry) ?? DEFAULT_REFRESH_TOKEN_TTL;

// In-memory store for refresh token revocation (in production, use DB or Redis)
const revokedTokens = new Set<string>();

export interface RegisterInput {
  username: string;
  password: string;
  email?: string;
}

export interface LoginInput {
  username: string; // Can be username or email
  password: string;
}

export interface TokenPayload {
  userId: string;
  username: string;
  type: 'access' | 'refresh';
}

export class AuthService {
  async register(input: RegisterInput): Promise<{
    user: { id: string; username: string; email?: string; createdAt: Date; updatedAt: Date };
    tokens: { accessToken: string; refreshToken: string };
  }> {
    const { username, password, email } = input;
    if (!username || username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    const db = getDatabase();
    const existingUser =
      (await db.users.getByUsername(username)) || (await db.users.getByEmail(email || ''));
    if (existingUser) {
      throw new Error('Username or email already exists');
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await db.users.create({
      username,
      email: email || '',
      passwordHash,
      role: 'VIEWER',
    });

    // Ensure we have all required fields for token generation
    if (!user.id || !user.username || !user.createdAt || !user.updatedAt) {
      throw new Error('User creation failed - missing required fields');
    }

    const tokens = this.generateTokens({ id: user.id, username: user.username });

    // Return user with guaranteed required fields
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokens,
    };
  }

  async login(input: LoginInput): Promise<{
    user: { id: string; username: string; email?: string; createdAt: Date; updatedAt: Date };
    tokens: { accessToken: string; refreshToken: string };
  }> {
    const { username, password } = input;
    const db = getDatabase();

    // Support both username and email for login
    // getUserForAuth accepts username or email
    const userForAuth = await db.users.getUserForAuth(username);
    if (!userForAuth) {
      throw new Error('Invalid username or password');
    }

    const isValid = await bcrypt.compare(password, userForAuth.passwordHash);
    if (!isValid) {
      throw new Error('Invalid username or password');
    }

    const user = await db.users.getById(userForAuth.id);
    if (!user) {
      throw new Error('User not found');
    }

    // Ensure we have all required fields for token generation
    if (!user.id || !user.username) {
      throw new Error('User data incomplete');
    }

    const tokens = this.generateTokens({ id: user.id, username: user.username });

    // Return user with guaranteed required fields
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokens,
    };
  }

  private generateTokens(user: { id: string; username: string }): {
    accessToken: string;
    refreshToken: string;
  } {
    const accessPayload: TokenPayload = {
      userId: user.id,
      username: user.username,
      type: 'access',
    };
    const refreshPayload: TokenPayload = {
      userId: user.id,
      username: user.username,
      type: 'refresh',
    };
    const accessToken = jwt.sign(accessPayload, JWT_SECRET_VALIDATED, {
      expiresIn: JWT_EXPIRES_IN_VALIDATED,
    });
    const refreshToken = jwt.sign(refreshPayload, JWT_REFRESH_SECRET_VALIDATED, {
      expiresIn: JWT_REFRESH_EXPIRES_IN_VALIDATED,
    });
    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): TokenPayload {
    try {
      const payload = jwt.verify(token, JWT_SECRET_VALIDATED) as TokenPayload;
      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return payload;
    } catch {
      throw new Error('Invalid or expired token');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      if (revokedTokens.has(refreshToken)) {
        throw new Error('Token has been revoked');
      }
      const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET_VALIDATED) as TokenPayload;
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      const db = getDatabase();
      const user = await db.users.getById(payload.userId);
      if (!user || !user.id || !user.username) {
        throw new Error('User not found');
      }
      const accessPayload: TokenPayload = {
        userId: user.id,
        username: user.username,
        type: 'access',
      };
      const newAccessToken = jwt.sign(accessPayload, JWT_SECRET_VALIDATED, {
        expiresIn: JWT_EXPIRES_IN_VALIDATED,
      });
      return { accessToken: newAccessToken };
    } catch {
      throw new Error('Invalid or expired refresh token');
    }
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    revokedTokens.add(refreshToken);
  }

  async getUserById(userId: string): Promise<{
    id: string;
    username: string;
    email?: string;
    createdAt: Date;
    updatedAt: Date;
  } | null> {
    const db = getDatabase();
    const user = await db.users.getById(userId);

    if (!user || !user.id || !user.username || !user.createdAt || !user.updatedAt) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export const authService = new AuthService();
