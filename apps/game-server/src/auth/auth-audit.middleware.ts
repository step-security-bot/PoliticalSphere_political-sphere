/**
 * Authentication Audit Logging Middleware
 * Implements structured logging for login and token refresh events
 * with feature flag context and sensitive data masking
 */

import type { Request, Response, NextFunction } from 'express';
import { Logger } from '../../../libs/shared/src/logger';
import { featureFlags } from '../../../libs/feature-flags/feature-flags.service';

export interface AuthAuditContext {
  userId?: string;
  username?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  featureFlags?: Record<string, any>;
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface LoginAuditContext extends AuthAuditContext {
  event: 'login_attempt' | 'login_success' | 'login_failure';
  loginMethod: 'username' | 'email';
}

export interface TokenRefreshAuditContext extends AuthAuditContext {
  event: 'token_refresh_attempt' | 'token_refresh_success' | 'token_refresh_failure';
}

/**
 * Mask sensitive values in audit logs
 */
function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const masked = { ...data };

  // Mask tokens
  if (masked.token) masked.token = maskToken(masked.token);
  if (masked.accessToken) masked.accessToken = maskToken(masked.accessToken);
  if (masked.refreshToken) masked.refreshToken = maskToken(masked.refreshToken);

  // Mask emails
  if (masked.email) masked.email = maskEmail(masked.email);

  // Mask passwords (shouldn't be in logs anyway, but just in case)
  if (masked.password) masked.password = '[REDACTED]';
  if (masked.passwordHash) masked.passwordHash = '[REDACTED]';

  return masked;
}

/**
 * Mask JWT tokens - show first 4 and last 4 characters
 */
function maskToken(token: string): string {
  if (!token || token.length < 8) return '[REDACTED]';
  return `${token.substring(0, 4)}****${token.substring(token.length - 4)}`;
}

/**
 * Mask email addresses
 */
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '[REDACTED]';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local}***@${domain}`;
  return `${local.substring(0, 2)}***@${domain}`;
}

/**
 * Get current feature flag context
 */
function getFeatureFlagContext(userId?: string): Record<string, any> {
  const flags: Record<string, any> = {};

  // Get relevant auth-related feature flags
  const authFlags = [
    'enhanced-auth-logging',
    'multi-factor-auth',
    'social-login',
    'password-reset',
    'account-lockout',
    'audit-log-retention',
  ];

  const context = userId ? { userId } : undefined;

  for (const flag of authFlags) {
    flags[flag] = featureFlags.getValue(flag, context, false);
  }

  return flags;
}

/**
 * Extract client information from request
 */
function extractClientInfo(req: Request): { ip: string; userAgent?: string } {
  const ip =
    req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
    req.headers['x-real-ip']?.toString() ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown';

  const userAgent = req.headers['user-agent'];

  return { ip, userAgent };
}

/**
 * Login audit logging middleware
 * Logs login attempts, successes, and failures
 */
export function loginAuditLogger(logger: Logger = new Logger({ service: 'game-server-auth' })) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const { ip, userAgent } = extractClientInfo(req);
    const { username, email } = req.body as { username?: string; email?: string };

    // Determine login method
    const loginMethod: 'username' | 'email' = email ? 'email' : 'username';
    const _identifier = email || username;

    // Initial attempt log
    const attemptContext: LoginAuditContext = {
      event: 'login_attempt',
      loginMethod,
      ip,
      userAgent,
      featureFlags: getFeatureFlagContext(),
      success: false,
      timestamp: new Date().toISOString(),
    };

    logger.info('AUTH_AUDIT_LOGIN_ATTEMPT', maskSensitiveData(attemptContext));

    // Override res.json to capture response
    const originalJson = res.json;
    res.json = function (data: any) {
      const duration = Date.now() - startTime;
      const success = res.statusCode >= 200 && res.statusCode < 300;

      const finalContext: LoginAuditContext = {
        event: success ? 'login_success' : 'login_failure',
        loginMethod,
        userId: data?.data?.user?.id,
        username: data?.data?.user?.username,
        email: data?.data?.user?.email,
        ip,
        userAgent,
        featureFlags: getFeatureFlagContext(data?.data?.user?.id),
        success,
        error: success ? undefined : data?.error,
        timestamp: new Date().toISOString(),
      };

      // Add duration to context
      (finalContext as any).duration = `${duration}ms`;

      const logLevel = success ? 'info' : 'warn';
      logger[logLevel]('AUTH_AUDIT_LOGIN_RESULT', maskSensitiveData(finalContext));

      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Token refresh audit logging middleware
 * Logs token refresh attempts, successes, and failures
 */
export function tokenRefreshAuditLogger(
  logger: Logger = new Logger({ service: 'game-server-auth' }),
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const { ip, userAgent } = extractClientInfo(req);
    const { refreshToken: _refreshToken } = req.body as { refreshToken?: string };

    // Initial attempt log
    const attemptContext: TokenRefreshAuditContext = {
      event: 'token_refresh_attempt',
      ip,
      userAgent,
      featureFlags: getFeatureFlagContext(),
      success: false,
      timestamp: new Date().toISOString(),
    };

    logger.info('AUTH_AUDIT_TOKEN_REFRESH_ATTEMPT', maskSensitiveData(attemptContext));

    // Override res.json to capture response
    const originalJson = res.json;
    res.json = function (data: any) {
      const duration = Date.now() - startTime;
      const success = res.statusCode >= 200 && res.statusCode < 300;

      const finalContext: TokenRefreshAuditContext = {
        event: success ? 'token_refresh_success' : 'token_refresh_failure',
        ip,
        userAgent,
        featureFlags: getFeatureFlagContext(),
        success,
        error: success ? undefined : data?.error,
        timestamp: new Date().toISOString(),
      };

      // Add duration to context
      (finalContext as any).duration = `${duration}ms`;

      const logLevel = success ? 'info' : 'warn';
      logger[logLevel]('AUTH_AUDIT_TOKEN_REFRESH_RESULT', maskSensitiveData(finalContext));

      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Combined auth audit middleware factory
 * Applies both login and token refresh logging based on route
 */
export function createAuthAuditMiddleware(
  options: { logger?: Logger; enableLoginAudit?: boolean; enableTokenRefreshAudit?: boolean } = {},
) {
  const {
    logger = new Logger({ service: 'game-server-auth' }),
    enableLoginAudit = true,
    enableTokenRefreshAudit = true,
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const path = req.path.toLowerCase();

    if (enableLoginAudit && path.includes('/login')) {
      loginAuditLogger(logger)(req, res, next);
      return;
    }

    if (enableTokenRefreshAudit && path.includes('/refresh')) {
      tokenRefreshAuditLogger(logger)(req, res, next);
      return;
    }

    next();
  };
}
