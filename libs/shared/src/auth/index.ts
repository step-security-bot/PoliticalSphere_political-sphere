/**
 * Authentication Module Exports
 *
 * Shared authentication utilities for JWT token management
 */

export {
  initializeJWT,
  initializeJWTFromEnv,
  verifyAccessToken,
  verifyRefreshToken,
  verifyAuthHeader,
  extractBearerToken,
  type TokenPayload,
  type VerificationResult,
} from './jwt';
