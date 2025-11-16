/**
 * Authentication Module Exports
 *
 * Shared authentication utilities for JWT token management
 */

export {
  initializeJWTFromEnv,
  verifyAuthHeader,
  verifyToken,
  type TokenPayload,
  type VerificationResult,
} from './jwt';
