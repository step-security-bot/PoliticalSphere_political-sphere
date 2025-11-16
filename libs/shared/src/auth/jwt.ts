/**
 * Shared JWT Authentication Utilities
 *
 * Provides JWT token verification and validation for use across
 * different services (API, WebSocket, Workers).
 *
 * @module shared/auth
 */

import jwt from 'jsonwebtoken';

/**
 * JWT payload interface
 */
export interface TokenPayload {
  userId: string;
  username: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

/**
 * Verification result
 */
export interface VerificationResult {
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
}

/**
 * JWT Configuration - Module-level secrets storage
 */
let accessSecret: string | null = null;
let refreshSecret: string | null = null;

/**
 * Initialize JWT configuration with secrets
 * Must be called before using verification methods
 */
export function initializeJWT(config: { accessSecret: string; refreshSecret: string }): void {
  if (!config.accessSecret || config.accessSecret.length < 32) {
    throw new Error('JWT access secret must be at least 32 characters');
  }
  if (!config.refreshSecret || config.refreshSecret.length < 32) {
    throw new Error('JWT refresh secret must be at least 32 characters');
  }
  if (config.accessSecret === config.refreshSecret) {
    throw new Error('Access and refresh secrets must be different');
  }

  accessSecret = config.accessSecret;
  refreshSecret = config.refreshSecret;
}

/**
 * Initialize from environment variables
 */
export function initializeJWTFromEnv(): void {
  const envAccessSecret = process.env.JWT_SECRET;
  const envRefreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!envAccessSecret) {
    throw new Error('JWT_SECRET environment variable not set');
  }
  if (!envRefreshSecret) {
    throw new Error('JWT_REFRESH_SECRET environment variable not set');
  }

  initializeJWT({ accessSecret: envAccessSecret, refreshSecret: envRefreshSecret });
}

/**
 * Verify an access token
 *
 * @param token - JWT token string
 * @returns Verification result with payload or error
 */
export function verifyAccessToken(token: string): VerificationResult {
  try {
    if (!accessSecret) {
      throw new Error('JWT configuration not initialized. Call initializeJWT() first');
    }

    const decoded = jwt.verify(token, accessSecret) as TokenPayload;

    // Ensure it's an access token
    if (decoded.type !== 'access') {
      return {
        valid: false,
        error: 'Invalid token type - expected access token',
      };
    }

    return {
      valid: true,
      payload: decoded,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        valid: false,
        error: 'Token expired',
      };
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return {
        valid: false,
        error: 'Invalid token',
      };
    }
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Token verification failed',
    };
  }
}

/**
 * Verify a refresh token
 *
 * @param token - JWT token string
 * @returns Verification result with payload or error
 */
export function verifyRefreshToken(token: string): VerificationResult {
  try {
    if (!refreshSecret) {
      throw new Error('JWT configuration not initialized. Call initializeJWT() first');
    }

    const decoded = jwt.verify(token, refreshSecret) as TokenPayload;

    // Ensure it's a refresh token
    if (decoded.type !== 'refresh') {
      return {
        valid: false,
        error: 'Invalid token type - expected refresh token',
      };
    }

    return {
      valid: true,
      payload: decoded,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        valid: false,
        error: 'Token expired',
      };
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return {
        valid: false,
        error: 'Invalid token',
      };
    }
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Token verification failed',
    };
  }
}

/**
 * Extract token from Authorization header
 *
 * @param authHeader - Authorization header value
 * @returns Token string or null if invalid format
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] || null;
}

/**
 * Verify token from Authorization header
 *
 * @param authHeader - Authorization header value
 * @returns Verification result
 */
export function verifyAuthHeader(authHeader: string | undefined): VerificationResult {
  const token = extractBearerToken(authHeader);

  if (!token) {
    return {
      valid: false,
      error: 'Invalid authorization format. Use: Bearer <token>',
    };
  }

  return verifyAccessToken(token);
}
