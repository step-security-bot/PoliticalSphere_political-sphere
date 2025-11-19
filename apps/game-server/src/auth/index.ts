/**
 * Authentication Audit Logging Module
 * Exports middleware for structured logging of auth events
 */

export {
  loginAuditLogger,
  tokenRefreshAuditLogger,
  createAuthAuditMiddleware,
  type AuthAuditContext,
  type LoginAuditContext,
  type TokenRefreshAuditContext,
} from './auth-audit.middleware';
