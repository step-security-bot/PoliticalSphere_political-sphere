/**
 * Audit logging middleware for security events
 */

import type { Request, Response, NextFunction } from 'express';
import { info, warn, error as logError } from '../utils/logger.js';

export interface AuditLogEntry {
  timestamp: string;
  ip: string;
  userAgent: string;
  method: string;
  url: string;
  userId?: string;
  action: string;
  success: boolean;
  details?: unknown;
}

/**
 * Log authentication events
 */
export function logAuthEvent(
  req: Request,
  action: string,
  success: boolean,
  details?: unknown
): void {
  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    method: req.method,
    url: req.url,
    userId: req.authUser?.userId,
    action,
    success,
    details,
  };

  const level = success ? info : warn;
  level(`AUDIT: ${action}`, entry);
}

/**
 * Middleware to log authentication attempts
 */
export function auditAuth(req: Request, res: Response, next: NextFunction): void {
  const originalSend = res.send;
  res.send = function (data) {
    // Log after response is sent
    setImmediate(() => {
      const statusCode = res.statusCode;
      const success = statusCode >= 200 && statusCode < 300;
      let action = 'unknown';

      if (req.url.includes('/register')) {
        action = 'user_registration';
      } else if (req.url.includes('/login')) {
        action = 'user_login';
      } else if (req.url.includes('/logout')) {
        action = 'user_logout';
      } else if (req.url.includes('/refresh')) {
        action = 'token_refresh';
      }

      logAuthEvent(req, action, success, { statusCode });
    });

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Middleware to log API access for authenticated users
 */
export function auditApiAccess(req: Request, _res: Response, next: NextFunction): void {
  if (req.authUser) {
    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      method: req.method,
      url: req.url,
      userId: req.authUser.userId,
      action: 'api_access',
      success: true,
    };

    info(`AUDIT: API access by ${req.authUser.username}`, entry);
  }

  next();
}

/**
 * Log security events like failed authentications
 */
export function logSecurityEvent(req: Request, event: string, details?: unknown): void {
  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    method: req.method,
    url: req.url,
    userId: req.authUser?.userId,
    action: event,
    success: false,
    details,
  };

  logError(`SECURITY: ${event}`, entry);
}
