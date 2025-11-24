/**
 * AuthService - centralised authentication helpers
 *
 * Responsibilities:
 * - Register new users and create initial tokens
 * - Authenticate existing users and issue access/refresh tokens
 * - Verify access and refresh tokens
 * - Revoke refresh tokens on logout
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';

import { error as logError } from '../utils/logger';
import { getDatabase } from '../stores/index.js';
import { prisma } from '../services/prisma-database.service.js';

/** Number of salt rounds to use for bcrypt password hashing (development default) */
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
/** Validated runtime JWT signing secret (validated on module load) */
const JWT_SECRET_VALIDATED: string = JWT_SECRET;
/** Validated runtime JWT refresh signing secret (validated on module load) */
const JWT_REFRESH_SECRET_VALIDATED: string = JWT_REFRESH_SECRET;

/**
 * JWT expiry time type - accepts time strings (e.g., '15m', '7d') or milliseconds
 * Using StringValue from 'ms' package for proper JWT compatibility
 */
type JwtExpiry = StringValue | number;

/** Default TTL for access tokens when not overridden by env */
const DEFAULT_ACCESS_TOKEN_TTL: JwtExpiry = '15m';
/** Default TTL for refresh tokens when not overridden by env */
const DEFAULT_REFRESH_TOKEN_TTL: JwtExpiry = '7d';

/** Effective JWT access expiry value used by the service (env override allowed) */
const JWT_EXPIRES_IN_VALIDATED: JwtExpiry =
  (process.env.JWT_EXPIRES_IN as JwtExpiry) ?? DEFAULT_ACCESS_TOKEN_TTL;
/** Effective JWT refresh expiry value used by the service (env override allowed) */
const JWT_REFRESH_EXPIRES_IN_VALIDATED: JwtExpiry =
  (process.env.JWT_REFRESH_EXPIRES_IN as JwtExpiry) ?? DEFAULT_REFRESH_TOKEN_TTL;

// Database-backed store for refresh token revocation

/**
 * RegisterInput - Input payload for creating a new user
 */
export interface RegisterInput {
  /** Desired username for the new user (unique) */
  username: string;
  /** Plaintext password; hashed before storage */
  password: string;
  /** Optional email address for the new user */
  email?: string;
}

/**
 * LoginInput - Login payload; username can be actual username or an email
 */
export interface LoginInput {
  /** Username or email for login */
  username: string;
  /** Plaintext password to validate */
  password: string;
}

/**
 * TokenPayload - JWT token payload used for both access and refresh tokens
 */
export interface TokenPayload {
  /** The user's canonical id */
  userId: string;
  /** Username used for display and debugging */
  username: string;
  /** The role of the user which may affect authorisation */
  role: string;
  /** Token type - 'access' or 'refresh' */
  type: 'access' | 'refresh';
}

/**
 * AuthService provides a set of methods for registering, authenticating, and
 * managing tokens in the Political Sphere API.
 */
export class AuthService {
  /**
   * register - create a new user and return initial access/refresh tokens
   */
  async register(input: RegisterInput): Promise<{
    user: {
      id: string;
      username: string;
      email?: string;
      role: string;
      createdAt: string;
      updatedAt: string;
    };
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
    if (!user.id || !user.username || !user.role || !user.createdAt || !user.updatedAt) {
      throw new Error('User creation failed - missing required fields');
    }

    const tokens = await this.generateTokens({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    // Return user with guaranteed required fields
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokens,
    };
  }

  /**
   * login - authenticate a user and return access/refresh tokens
   */
  async login(input: LoginInput): Promise<{
    user: {
      id: string;
      username: string;
      email?: string;
      role: string;
      createdAt: string;
      updatedAt: string;
    };
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
    if (!user.id || !user.username || !userForAuth.role) {
      throw new Error('User data incomplete');
    }

    const tokens = await this.generateTokens({
      id: user.id,
      username: user.username,
      role: userForAuth.role,
    });

    // Return user with guaranteed required fields
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: userForAuth.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokens,
    };
  }

  /**
   * generateTokens - internal: produce access and refresh tokens for a user
   */
  private async generateTokens(user: { id: string; username: string; role: string }): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const accessPayload: TokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      type: 'access',
    };
    const refreshPayload: TokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      type: 'refresh',
    };
    const accessToken = jwt.sign(accessPayload, JWT_SECRET_VALIDATED, {
      expiresIn: JWT_EXPIRES_IN_VALIDATED,
    });
    const refreshToken = jwt.sign(refreshPayload, JWT_REFRESH_SECRET_VALIDATED, {
      expiresIn: JWT_REFRESH_EXPIRES_IN_VALIDATED,
    });

    // Store refresh token in database
    try {
      const decoded = jwt.decode(refreshToken) as jwt.JwtPayload;
      if (decoded?.exp) {
        await prisma.session.create({
          data: {
            userId: user.id,
            refreshToken,
            expiresAt: new Date(decoded.exp * 1000),
          },
        });
      }
    } catch (error) {
      // Log error but don't fail token generation
      logError('Failed to store refresh token session:', error);
    }

    return { accessToken, refreshToken };
  }

  /**
   * verifyAccessToken - Verify an access token and return its payload
   */
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

  /**
   * refreshAccessToken - Exchange a valid refresh token for a new access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Check if token is revoked in database
      const revokedSession = await prisma.session.findUnique({
        where: { refreshToken },
      });

      if (revokedSession?.revokedAt) {
        throw new Error('Token has been revoked');
      }

      const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET_VALIDATED) as TokenPayload;
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      const db = getDatabase();
      const user = await db.users.getById(payload.userId);
      if (!user || !user.id || !user.username || !user.role) {
        throw new Error('User not found');
      }
      const accessPayload: TokenPayload = {
        userId: user.id,
        username: user.username,
        role: user.role,
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

  /**
   * revokeRefreshToken - Revoke a refresh token so it cannot be used again
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      await prisma.session.updateMany({
        where: { refreshToken },
        data: { revokedAt: new Date() },
      });
    } catch (error) {
      // Log error but don't throw - revocation is not critical
      logError('Failed to revoke refresh token:', error);
    }
  }

  /**
   * getUserById - Return sanitized user details for the given id (or null if not found)
   */
  async getUserById(userId: string): Promise<{
    id: string;
    username: string;
    email?: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const db = getDatabase();
    const user = await db.users.getById(userId);

    if (!user || !user.id || !user.username || !user.role || !user.createdAt || !user.updatedAt) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

/**
 * `authService` - shared AuthService singleton used by authentication routes.
 *
 * Responsible for credential validation, token creation, and user lookup.
 */
export const authService = new AuthService();
