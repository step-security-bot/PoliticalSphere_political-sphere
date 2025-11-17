import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  extractBearerToken,
  initializeJWT,
  initializeJWTFromEnv,
  verifyAccessToken,
  verifyAuthHeader,
  verifyRefreshToken,
  type TokenPayload,
  type VerificationResult,
} from '../auth/jwt';

describe('JWT Authentication Utilities', () => {
  const accessSecret = 'test-access-secret-at-least-32-characters-long';
  const refreshSecret = 'test-refresh-secret-at-least-32-characters-long';
  const shortSecret = 'short';
  const sameSecret = 'same-secret-for-both-at-least-32-chars';

  let validAccessToken: string;
  let validRefreshToken: string;
  let expiredToken: string;
  let invalidToken: string;

  beforeEach(() => {
    // Reset module state
    vi.resetModules();

    // Create test tokens
    const payload: TokenPayload = {
      userId: 'user123',
      username: 'testuser',
      type: 'access',
    };

    validAccessToken = jwt.sign(payload, accessSecret, { expiresIn: '1h' });

    const refreshPayload: TokenPayload = {
      userId: 'user123',
      username: 'testuser',
      type: 'refresh',
    };

    validRefreshToken = jwt.sign(refreshPayload, refreshSecret, { expiresIn: '7d' });

    // Expired token
    expiredToken = jwt.sign(payload, accessSecret, { expiresIn: '-1h' });

    // Invalid token (wrong secret)
    invalidToken = jwt.sign(payload, 'wrong-secret');
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
  });

  describe('initializeJWT', () => {
    it('should initialize with valid secrets', () => {
      expect(() => initializeJWT({ accessSecret, refreshSecret })).not.toThrow();
    });

    it('should throw error for short access secret', () => {
      expect(() => initializeJWT({ accessSecret: shortSecret, refreshSecret })).toThrow(
        'JWT access secret must be at least 32 characters',
      );
    });

    it('should throw error for short refresh secret', () => {
      expect(() => initializeJWT({ accessSecret, refreshSecret: shortSecret })).toThrow(
        'JWT refresh secret must be at least 32 characters',
      );
    });

    it('should throw error for empty access secret', () => {
      expect(() => initializeJWT({ accessSecret: '', refreshSecret })).toThrow(
        'JWT access secret must be at least 32 characters',
      );
    });

    it('should throw error for empty refresh secret', () => {
      expect(() => initializeJWT({ accessSecret, refreshSecret: '' })).toThrow(
        'JWT refresh secret must be at least 32 characters',
      );
    });

    it('should throw error when secrets are the same', () => {
      expect(() => initializeJWT({ accessSecret: sameSecret, refreshSecret: sameSecret })).toThrow(
        'Access and refresh secrets must be different',
      );
    });
  });

  describe('initializeJWTFromEnv', () => {
    it('should initialize from environment variables', () => {
      process.env.JWT_SECRET = accessSecret;
      process.env.JWT_REFRESH_SECRET = refreshSecret;

      expect(() => initializeJWTFromEnv()).not.toThrow();
    });

    it('should throw error when JWT_SECRET is not set', () => {
      process.env.JWT_REFRESH_SECRET = refreshSecret;
      delete process.env.JWT_SECRET;

      expect(() => initializeJWTFromEnv()).toThrow('JWT_SECRET environment variable not set');
    });

    it('should throw error when JWT_REFRESH_SECRET is not set', () => {
      process.env.JWT_SECRET = accessSecret;
      delete process.env.JWT_REFRESH_SECRET;

      expect(() => initializeJWTFromEnv()).toThrow(
        'JWT_REFRESH_SECRET environment variable not set',
      );
    });
  });

  describe('verifyAccessToken', () => {
    beforeEach(() => {
      // Initialize for most tests, but some tests will override this
      initializeJWT({ accessSecret, refreshSecret });
    });

    it('should verify valid access token', () => {
      const result = verifyAccessToken(validAccessToken);

      expect(result.valid).toBe(true);
      expect(result.payload).toMatchObject({
        userId: 'user123',
        username: 'testuser',
        type: 'access',
      });
      expect(result.error).toBeUndefined();
    });

    it('should reject refresh token as access token', () => {
      const result = verifyAccessToken(validRefreshToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token');
      expect(result.payload).toBeUndefined();
    });

    it('should handle expired token', () => {
      const result = verifyAccessToken(expiredToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token expired');
      expect(result.payload).toBeUndefined();
    });

    it('should handle invalid token', () => {
      const result = verifyAccessToken(invalidToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token');
      expect(result.payload).toBeUndefined();
    });

    it('should handle malformed token', () => {
      const result = verifyAccessToken('not-a-jwt-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token');
      expect(result.payload).toBeUndefined();
    });

    it('should handle empty token', () => {
      const result = verifyAccessToken('');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token');
      expect(result.payload).toBeUndefined();
    });
  });

  describe('verifyRefreshToken', () => {
    beforeEach(() => {
      // Initialize for most tests, but some tests will override this
      initializeJWT({ accessSecret, refreshSecret });
    });

    it('should verify valid refresh token', () => {
      const result = verifyRefreshToken(validRefreshToken);

      expect(result.valid).toBe(true);
      expect(result.payload).toMatchObject({
        userId: 'user123',
        username: 'testuser',
        type: 'refresh',
      });
      expect(result.error).toBeUndefined();
    });

    it('should reject access token as refresh token', () => {
      const result = verifyRefreshToken(validAccessToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token');
      expect(result.payload).toBeUndefined();
    });

    it('should handle expired token', () => {
      const expiredRefreshToken = jwt.sign(
        { userId: 'user123', username: 'testuser', type: 'refresh' },
        refreshSecret,
        { expiresIn: '-1h' },
      );

      const result = verifyRefreshToken(expiredRefreshToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token expired');
      expect(result.payload).toBeUndefined();
    });

    it('should handle invalid token', () => {
      const invalidRefreshToken = jwt.sign(
        { userId: 'user123', username: 'testuser', type: 'refresh' },
        'wrong-secret',
      );

      const result = verifyRefreshToken(invalidRefreshToken);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token');
      expect(result.payload).toBeUndefined();
    });
  });

  describe('extractBearerToken', () => {
    it('should extract token from valid Bearer header', () => {
      const header = 'Bearer abc123def456';
      const result = extractBearerToken(header);
      expect(result).toBe('abc123def456');
    });

    it('should return null for undefined header', () => {
      const result = extractBearerToken(undefined);
      expect(result).toBeNull();
    });

    it('should return null for empty header', () => {
      const result = extractBearerToken('');
      expect(result).toBeNull();
    });

    it('should return null for header without Bearer prefix', () => {
      const result = extractBearerToken('abc123def456');
      expect(result).toBeNull();
    });

    it('should return null for header with wrong prefix', () => {
      const result = extractBearerToken('Basic abc123def456');
      expect(result).toBeNull();
    });

    it('should return null for Bearer without token', () => {
      const result = extractBearerToken('Bearer ');
      expect(result).toBeNull();
    });

    it('should return null for Bearer with only spaces', () => {
      const result = extractBearerToken('Bearer   ');
      expect(result).toBeNull();
    });

    it('should handle extra spaces', () => {
      const result = extractBearerToken('Bearer  abc123def456  ');
      expect(result).toBe('abc123def456');
    });

    it('should handle multiple spaces between Bearer and token', () => {
      const result = extractBearerToken('Bearer   abc123def456');
      expect(result).toBe('abc123def456');
    });
  });

  describe('verifyAuthHeader', () => {
    beforeEach(() => {
      initializeJWT({ accessSecret, refreshSecret });
    });

    it('should verify valid Bearer header', () => {
      const header = `Bearer ${validAccessToken}`;
      const result = verifyAuthHeader(header);

      expect(result.valid).toBe(true);
      expect(result.payload).toMatchObject({
        userId: 'user123',
        username: 'testuser',
        type: 'access',
      });
    });

    it('should return error for undefined header', () => {
      const result = verifyAuthHeader(undefined);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid authorization format. Use: Bearer <token>');
      expect(result.payload).toBeUndefined();
    });

    it('should return error for empty header', () => {
      const result = verifyAuthHeader('');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid authorization format. Use: Bearer <token>');
      expect(result.payload).toBeUndefined();
    });

    it('should return error for header without Bearer prefix', () => {
      const result = verifyAuthHeader('abc123def456');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid authorization format. Use: Bearer <token>');
      expect(result.payload).toBeUndefined();
    });

    it('should return error for invalid token', () => {
      const header = 'Bearer invalid-token';
      const result = verifyAuthHeader(header);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid token');
      expect(result.payload).toBeUndefined();
    });

    it('should return error for expired token', () => {
      const header = `Bearer ${expiredToken}`;
      const result = verifyAuthHeader(header);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token expired');
      expect(result.payload).toBeUndefined();
    });
  });

  describe('type definitions', () => {
    it('should export TokenPayload interface', () => {
      const payload: TokenPayload = {
        userId: 'user123',
        username: 'testuser',
        type: 'access',
        iat: 1234567890,
        exp: 1234567890 + 3600,
      };

      expect(payload.userId).toBe('user123');
      expect(payload.type).toBe('access');
    });

    it('should export VerificationResult interface', () => {
      const result: VerificationResult = {
        valid: true,
        payload: {
          userId: 'user123',
          username: 'testuser',
          type: 'access',
        },
      };

      expect(result.valid).toBe(true);
      expect(result.payload?.userId).toBe('user123');
      expect(result.error).toBeUndefined();
    });
  });
});
