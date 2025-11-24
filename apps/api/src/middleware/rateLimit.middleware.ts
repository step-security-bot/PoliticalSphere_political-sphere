/**
 * Advanced Rate Limiting Middleware
 * Implements OWASP ASVS rate limiting requirements with different tiers
 */

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';
import logger from '../utils/logger.js';

// Rate limit configurations based on OWASP guidelines
const RATE_LIMITS = {
  // Authentication endpoints - very strict
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
      error: 'Too many authentication attempts',
      message: 'Please wait 15 minutes before trying again',
      retryAfter: 15 * 60 * 1000,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
  },

  // API endpoints - moderate
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
      error: 'Too many API requests',
      message: 'Please slow down your requests',
      retryAfter: 15 * 60 * 1000,
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Game operations - higher limit for active gameplay
  game: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 300, // 300 game actions per 5 minutes
    message: {
      error: 'Too many game actions',
      message: 'Please slow down your gameplay',
      retryAfter: 5 * 60 * 1000,
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Content creation - moderate
  content: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 content creations per hour
    message: {
      error: 'Too many content creations',
      message: 'Please wait before creating more content',
      retryAfter: 60 * 60 * 1000,
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Compliance/reporting endpoints - lower limit
  compliance: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 compliance requests per hour
    message: {
      error: 'Too many compliance requests',
      message: 'Compliance endpoints have strict rate limits',
      retryAfter: 60 * 60 * 1000,
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Public endpoints - higher limit
  public: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requests per window
    message: {
      error: 'Too many requests',
      message: 'Please try again later',
      retryAfter: 15 * 60 * 1000,
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // File uploads - very strict
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: {
      error: 'Too many file uploads',
      message: 'File upload limit exceeded',
      retryAfter: 60 * 60 * 1000,
    },
    standardHeaders: true,
    legacyHeaders: false,
  },
} as const;

// Resolve a stable client key that is IPv6-safe and optionally scoped to user id
function createKeyGenerator(includeUserId = false) {
  return (req: Request): string => {
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';
    const baseKey = ipKeyGenerator(ip);

    if (!includeUserId) {
      return baseKey;
    }

    const userId =
      (req as any).authUser?.userId ||
      (req as any).authUser?.id ||
      (req as any).user?.userId ||
      (req as any).user?.id;

    return userId ? `${baseKey}:${userId}` : baseKey;
  };
}

// Custom handler that logs rate limit violations
function createHandler(limitConfig: { max: number; windowMs: number; message: any }) {
  return (req: Request, res: Response): Response => {
    const userId =
      (req as any).authUser?.userId ||
      (req as any).authUser?.id ||
      (req as any).user?.userId ||
      (req as any).user?.id ||
      'anonymous';
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';

    logger.warn('Rate limit exceeded', {
      userId,
      ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      limit: limitConfig.max,
      windowMs: limitConfig.windowMs,
    });

    return res.status(429).json(limitConfig.message);
  };
}

// Create rate limiters
/**
 * Rate limiter for authentication endpoints.
 *
 * Enforces a strict limit to mitigate brute-force and credential-stuffing attacks.
 */
export const authLimiter = rateLimit({
  ...RATE_LIMITS.auth,
  keyGenerator: createKeyGenerator(false), // Don't include user ID for auth (prevent user enumeration)
  handler: createHandler(RATE_LIMITS.auth),
});

/**
 * General API rate limiter (per-user when available).
 *
 * Applies to authenticated API routes and is scoped by user ID when present.
 */
export const apiLimiter = rateLimit({
  ...RATE_LIMITS.api,
  keyGenerator: createKeyGenerator(true), // Include user ID for per-user limits
  handler: createHandler(RATE_LIMITS.api),
});

/**
 * Rate limiter tuned for gameplay endpoints where higher throughput is acceptable.
 */
export const gameLimiter = rateLimit({
  ...RATE_LIMITS.game,
  keyGenerator: createKeyGenerator(true), // Include user ID for per-user limits
  handler: createHandler(RATE_LIMITS.game),
});

/**
 * Rate limiter for content-creation endpoints (posts, comments, uploads).
 *
 * Moderates resource abuse while allowing reasonable publishing activity.
 */
export const contentLimiter = rateLimit({
  ...RATE_LIMITS.content,
  keyGenerator: createKeyGenerator(true), // Include user ID for per-user limits
  handler: createHandler(RATE_LIMITS.content),
});

/**
 * Rate limiter for compliance related endpoints (reporting, appeals).
 */
export const complianceLimiter = rateLimit({
  ...RATE_LIMITS.compliance,
  keyGenerator: createKeyGenerator(true), // Include user ID for per-user limits
  handler: createHandler(RATE_LIMITS.compliance),
});

/**
 * Rate limiter for public, unauthenticated endpoints (health, public feeds).
 *
 * Uses IP-based keying to protect shared public endpoints.
 */
export const publicLimiter = rateLimit({
  ...RATE_LIMITS.public,
  keyGenerator: createKeyGenerator(false), // IP-based for public endpoints
  handler: createHandler(RATE_LIMITS.public),
});

/**
 * Rate limiter specifically for file uploads to guard storage resources.
 */
export const uploadLimiter = rateLimit({
  ...RATE_LIMITS.upload,
  keyGenerator: createKeyGenerator(true), // Include user ID for per-user limits
  handler: createHandler(RATE_LIMITS.upload),
});

// Burst protection - very short window for rapid requests
/**
 * Burst protection limiter for very short high-frequency request windows.
 *
 * Intended to catch short-lived spikes (e.g. automated scanners) and
 * protect the API surface from rapid-fire requests.
 */
export const burstLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    error: 'Too many rapid requests',
    message: 'Please slow down',
    retryAfter: 60 * 1000,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createKeyGenerator(true),
  handler: (req: Request, res: Response): Response => {
    logger.warn('Burst rate limit exceeded', {
      userId: (req as any).authUser?.userId || (req as any).user?.userId || 'anonymous',
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      url: req.url,
      method: req.method,
    });

    return res.status(429).json({
      error: 'Too many rapid requests',
      message: 'Please slow down',
      retryAfter: 60 * 1000,
    });
  },
});

// Dynamic rate limiter based on user role
/**
 * Factory that returns a role-aware rate limiting middleware.
 *
 * Admins and moderators receive elevated limits; regular users receive
 * the standard API limiter. This middleware selects and delegates to the
 * appropriate rate limiter at request time.
 */
export function createRoleBasedLimiter() {
  return (req: Request, res: Response, next: (err?: any) => void) => {
    const user = (req as any).authUser || (req as any).user;
    const role = user?.role;

    let limiter: any;

    switch (role) {
      case 'ADMIN':
        // Admins get higher limits
        limiter = rateLimit({
          windowMs: 15 * 60 * 1000,
          max: 500, // 500 requests per 15 minutes for admins
          keyGenerator: createKeyGenerator(true),
          handler: createHandler(RATE_LIMITS.api),
        });
        break;
      case 'MODERATOR':
        // Moderators get moderate increase
        limiter = rateLimit({
          windowMs: 15 * 60 * 1000,
          max: 200, // 200 requests per 15 minutes for moderators
          keyGenerator: createKeyGenerator(true),
          handler: createHandler(RATE_LIMITS.api),
        });
        break;
      default:
        // Regular users get standard limits
        limiter = apiLimiter;
    }

    limiter(req, res, next);
  };
}

// WebSocket rate limiting (for game server)
/**
 * Rate limiting configuration helpers for WebSocket servers.
 *
 * Provides a `connectionLimiter` for connection attempts and a `messageLimiter`
 * for per-user message rates. These are helper objects for the game server.
 */
export const websocketLimiter = {
  // Limit WebSocket connection attempts
  connectionLimiter: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 connection attempts per minute
    message: 'Too many connection attempts',
    keyGenerator: createKeyGenerator(false),
  }),

  // Limit WebSocket messages per user
  messageLimiter: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 120, // 120 messages per minute
    message: 'Too many messages',
    keyGenerator: createKeyGenerator(true),
  }),
};
