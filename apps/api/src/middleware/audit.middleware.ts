/**
 * Audit logging middleware for security events
 */

import type { Request, Response, NextFunction } from 'express';
import { info, warn, error as logError } from '../utils/logger.js';

/**
 * AuditLogEntry - shape of an audit log record emitted by audit middleware.
 *
 * Records basic request context and an `action` name to support tamper-evident
 * compliance logging and downstream analytics.
 */
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
 * Enhanced audit middleware that logs all operations with compliance integration
 */
export function comprehensiveAuditLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const user = req.authUser || req.user;

  // Log the incoming request
  const requestEntry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    method: req.method,
    url: req.url,
    userId: user?.userId,
    action: 'request_start',
    success: true,
    details: {
      bodySize: req.headers['content-length'] ? parseInt(req.headers['content-length'], 10) : 0,
      queryParams: Object.keys(req.query).length,
      route: req.route?.path,
    },
  };

  info(`AUDIT: Request start - ${req.method} ${req.url}`, requestEntry);

  // Log response on finish event (safer than overriding res.end)
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    const responseEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      method: req.method,
      url: req.originalUrl || req.url,
      userId: user?.userId,
      action: 'request_complete',
      success: statusCode >= 200 && statusCode < 400,
      details: {
        statusCode,
        duration,
        responseSize: res.get('Content-Length')
          ? parseInt(res.get('Content-Length') || '0', 10)
          : 0,
        userAgent: req.get('User-Agent'),
      },
    };

    if (statusCode >= 400) {
      warn(`AUDIT: Request failed - ${req.method} ${req.url} ${statusCode}`, responseEntry);
    } else {
      info(`AUDIT: Request complete - ${req.method} ${req.url} ${statusCode}`, responseEntry);
    }
  });

  next();
}

/**
 * Audit middleware for sensitive operations
 */
export function auditSensitiveOperation(operation: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user =
      (req as { authUser?: { userId?: string } }).authUser ||
      (req as { user?: { userId?: string } }).user;

    const entry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      method: req.method,
      url: req.url,
      userId: user?.userId,
      action: operation,
      success: true,
      details: {
        bodyKeys: req.body ? Object.keys(req.body) : [],
        queryKeys: Object.keys(req.query),
      },
    };

    info(`AUDIT: Sensitive operation - ${operation}`, entry);

    next();
  };
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
