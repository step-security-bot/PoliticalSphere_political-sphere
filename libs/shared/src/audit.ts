/**
 * Audit logging utilities for security events and compliance
 */

import { createLogger } from './logger.js';

export interface AuditEvent {
  eventType: string;
  userId?: string;
  username?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action: string;
  outcome: 'success' | 'failure' | 'denied';
  details?: Record<string, unknown>;
  timestamp?: Date;
  sessionId?: string;
}

export interface AuditLogger {
  log(event: AuditEvent): void;
  logAuth(event: Omit<AuditEvent, 'eventType'>): void;
  logAccess(event: Omit<AuditEvent, 'eventType'>): void;
  logSecurity(event: Omit<AuditEvent, 'eventType'>): void;
}

class AuditLoggerImpl implements AuditLogger {
  private logger = createLogger({ service: 'audit' });

  log(event: AuditEvent): void {
    const auditEvent = {
      ...event,
      timestamp: event.timestamp || new Date(),
      level: this.getLogLevel(event.outcome),
    } as const;

    this.logger.info('Audit event', auditEvent);
  }

  logAuth(event: Omit<AuditEvent, 'eventType'>): void {
    this.log({
      ...event,
      eventType: 'AUTHENTICATION',
    });
  }

  logAccess(event: Omit<AuditEvent, 'eventType'>): void {
    this.log({
      ...event,
      eventType: 'ACCESS_CONTROL',
    });
  }

  logSecurity(event: Omit<AuditEvent, 'eventType'>): void {
    this.log({
      ...event,
      eventType: 'SECURITY',
    });
  }

  private getLogLevel(outcome: string): string {
    switch (outcome) {
      case 'failure':
      case 'denied':
        return 'warn';
      case 'success':
      default:
        return 'info';
    }
  }
}

// Singleton audit logger
export const auditLogger = new AuditLoggerImpl();

// Helper functions for common audit events
export const auditEvents = {
  // Authentication events
  loginSuccess: (userId: string, username: string, ipAddress?: string, userAgent?: string) => {
    auditLogger.logAuth({
      userId,
      username,
      ...(typeof ipAddress === 'string' ? { ipAddress } : {}),
      ...(typeof userAgent === 'string' ? { userAgent } : {}),
      action: 'LOGIN',
      outcome: 'success',
      details: { method: 'password' },
    });
  },

  loginFailure: (username: string, ipAddress?: string, userAgent?: string, reason?: string) => {
    auditLogger.logAuth({
      username,
      ...(typeof ipAddress === 'string' ? { ipAddress } : {}),
      ...(typeof userAgent === 'string' ? { userAgent } : {}),
      action: 'LOGIN',
      outcome: 'failure',
      ...(typeof reason === 'string' ? { details: { reason } } : {}),
    });
  },

  logout: (userId: string, username: string, sessionId?: string) => {
    auditLogger.logAuth({
      userId,
      username,
      ...(typeof sessionId === 'string' ? { sessionId } : {}),
      action: 'LOGOUT',
      outcome: 'success',
    });
  },

  // Access control events
  resourceAccess: (
    userId: string,
    username: string,
    resource: string,
    action: string,
    outcome: 'success' | 'denied',
    ipAddress?: string,
  ) => {
    auditLogger.logAccess({
      userId,
      username,
      resource,
      action,
      outcome,
      ...(typeof ipAddress === 'string' ? { ipAddress } : {}),
    });
  },

  // Security events
  rateLimitExceeded: (ipAddress: string, endpoint: string, userAgent?: string) => {
    auditLogger.logSecurity({
      ipAddress,
      ...(typeof userAgent === 'string' ? { userAgent } : {}),
      resource: endpoint,
      action: 'RATE_LIMIT_EXCEEDED',
      outcome: 'denied',
      details: { type: 'rate_limit' },
    });
  },

  suspiciousActivity: (
    ipAddress: string,
    activity: string,
    details?: Record<string, unknown>,
    userAgent?: string,
  ) => {
    auditLogger.logSecurity({
      ipAddress,
      ...(typeof userAgent === 'string' ? { userAgent } : {}),
      action: activity,
      outcome: 'denied',
      details: details
        ? { ...details, type: 'suspicious_activity' }
        : { type: 'suspicious_activity' },
    });
  },

  // Data protection events
  dataExport: (userId: string, username: string, dataTypes: string[]) => {
    auditLogger.log({
      eventType: 'DATA_PROTECTION',
      userId,
      username,
      action: 'DATA_EXPORT',
      outcome: 'success',
      details: { dataTypes, purpose: 'GDPR_ARTICLE_15' },
    });
  },

  dataDeletion: (userId: string, username: string, dataTypes: string[]) => {
    auditLogger.log({
      eventType: 'DATA_PROTECTION',
      userId,
      username,
      action: 'DATA_DELETION_INITIATED',
      outcome: 'success',
      details: { dataTypes, purpose: 'GDPR_ARTICLE_17' },
    });
  },

  // Input validation events
  validationFailure: (
    ipAddress: string,
    endpoint: string,
    validationErrors: unknown[],
    userAgent?: string,
  ) => {
    auditLogger.logSecurity({
      ipAddress,
      ...(typeof userAgent === 'string' ? { userAgent } : {}),
      resource: endpoint,
      action: 'INPUT_VALIDATION_FAILED',
      outcome: 'failure',
      details: { validationErrors },
    });
  },
};

// Middleware for automatic audit logging
type AuditNext = (err?: unknown) => void;
interface AuditRequestLike {
  user?: { userId: string; username: string };
  path: string;
  method: string;
  ip?: string;
  get(header: string): string | undefined;
}
interface AuditResponseLike {
  statusCode: number;
  send: (data: unknown) => unknown;
}

export function createAuditMiddleware(auditLogger: AuditLogger) {
  return (req: AuditRequestLike, res: AuditResponseLike, next: AuditNext) => {
    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function (data: unknown) {
      const duration = Date.now() - startTime;

      // Log API access
      if (req.user) {
        auditLogger.logAccess({
          userId: req.user.userId,
          username: req.user.username,
          resource: req.path,
          action: req.method,
          outcome: res.statusCode < 400 ? 'success' : 'failure',
          ...(req.ip ? { ipAddress: req.ip } : {}),
          ...(req.get('User-Agent') ? { userAgent: req.get('User-Agent')! } : {}),
          details: {
            statusCode: res.statusCode,
            duration,
            ...(req.get('User-Agent') ? { userAgent: req.get('User-Agent') } : {}),
          },
        });
      }

      // Log security events
      if (res.statusCode === 429) {
        const ua = req.get('User-Agent');
        const ip = typeof req.ip === 'string' ? req.ip : 'unknown';
        auditEvents.rateLimitExceeded(ip, req.path, ua);
      }

      return originalSend.call(this, data);
    };

    next();
  };
}
