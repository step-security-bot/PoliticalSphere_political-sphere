/**
 * Authentication and Authorization Middleware
 * Implements JWT-based authentication with role-based access control
 */

import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * AuthUser - structure of an authenticated user stored on the request.
 *
 * - `id` is the primary user id stored on the token
 * - `userId` is an alias used across the codebase for compatibility
 * - `username` is the display or login name
 * - `role` is used for role-based authorization checks
 * - `email` is optional and may not be present in all tokens
 */
// Local definition of AuthUser (was previously imported from non-existent auth.middleware)
/**
 * AuthUser - structure of an authenticated user attached to `req.user`.
 *
 * `id` and `userId` are included for historical compatibility; `role` is
 * used by authorization middleware. Email may be absent depending on token scope.
 */
export interface AuthUser {
  id: string;
  userId: string;
  username: string;
  role: string;
  email?: string;
}

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
if (!JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET environment variable is required');
}

// Ensure secrets are defined for TypeScript
const jwtSecret: string = JWT_SECRET;
const jwtRefreshSecret: string = JWT_REFRESH_SECRET;

interface User {
  id: string;
  userId: string;
  username: string;
  email: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

interface JwtPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  type: string;
}

/**
 * authenticate - JWT authentication middleware
 *
 * Verifies access tokens from either the Authorization header (Bearer token),
 * or an httpOnly cookie `accessToken`. On success attaches `AuthUser` to the
 * request as `req.user` for compatibility across the codebase. Returns 401
 * on missing/invalid tokens and logs authentication failures.
 */
function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.accessToken;

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
        message: 'Please provide a valid access token',
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (!decoded || decoded.type !== 'access') {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Token is invalid or expired',
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      // Optional fields only if present in token
      ...(decoded.email ? { email: decoded.email as string } : {}),
    } as AuthUser;

    logger.debug('User authenticated', { userId: req.user?.id || decoded.userId, path: req.path });
    next();
  } catch (error) {
    if ((error as Error).name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Access token has expired',
      });
      return;
    }

    logger.error('Authentication failed', {
      error: (error as Error).message,
      path: req.path,
    });
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: 'Invalid authentication credentials',
    });
  }
}

/**
 * Role-based Authorization Middleware Factory
 * @param requiredRoles - Required role(s)
 * @returns Middleware function
 */
function requireRole(requiredRoles: string | string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'User must be authenticated',
      });
      return;
    }

    const userRole = req.user.role;
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

    if (!roles.includes(userRole)) {
      logger.warn('Access denied', {
        userId: req.user.id,
        userRole,
        requiredRoles: roles,
        path: req.path,
      });

      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `Required role: ${roles.join(' or ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * optionalAuth - Optional authentication middleware
 *
 * Attempts to attach an authenticated user to the request if a valid access
 * token is present (either Authorization header or cookie). Does not return
 * an error if token is missing or invalid allowing downstream handlers to
 * treat requests as unauthenticated.
 */
function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.accessToken;

    if (token) {
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      if (decoded && decoded.type === 'access') {
        req.user = {
          id: decoded.userId,
          userId: decoded.userId,
          username: decoded.username,
          email: decoded.email,
          role: decoded.role,
        };
      }
    }
  } catch {
    // Ignore auth errors for optional auth
  }

  next();
}

/**
 * requireAdmin - middleware to assert the authenticated user has the `ADMIN` role
 */
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireRole('ADMIN')(req, res, next);
}

/**
 * requireModerator - middleware to assert the authenticated user has either the
 * `ADMIN` or `MODERATOR` role
 */
function requireModerator(req: Request, res: Response, next: NextFunction): void {
  requireRole(['ADMIN', 'MODERATOR'])(req, res, next);
}

/**
 * authenticateRefreshToken - Verifies refresh tokens used for access token rotation
 *
 * Reads `refreshToken` from the request body and validates it; on success
 * attaches an `AuthUser` object on the request as `req.user`.
 */
function authenticateRefreshToken(req: Request, res: Response, next: NextFunction): void {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'Refresh token required',
        message: 'Please provide a refresh token',
      });
      return;
    }

    const decoded = jwt.verify(refreshToken, jwtRefreshSecret) as JwtPayload;

    if (!decoded || decoded.type !== 'refresh') {
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        message: 'Refresh token is invalid',
      });
      return;
    }

    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    logger.error('Refresh token authentication failed', {
      error: (error as Error).message,
    });
    res.status(401).json({
      success: false,
      error: 'Invalid refresh token',
      message: 'Refresh token verification failed',
    });
  }
}

export {
  authenticate,
  authenticateRefreshToken,
  optionalAuth,
  requireAdmin,
  requireModerator,
  requireRole,
};
