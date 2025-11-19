/**
 * Authentication and Authorization Middleware
 * Implements JWT-based authentication with role-based access control
 */

import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

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
 * JWT Authentication Middleware
 * Validates JWT token and attaches user to request
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
      email: decoded.email,
      role: decoded.role,
    };

    logger.debug('User authenticated', { userId: req.user.id, path: req.path });
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
 * Optional Authentication Middleware
 * Attaches user if token is present, but doesn't require it
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
 * Admin-only Authorization Middleware
 */
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  requireRole('ADMIN')(req, res, next);
}

/**
 * Moderator Authorization Middleware (Admin or Moderator)
 */
function requireModerator(req: Request, res: Response, next: NextFunction): void {
  requireRole(['ADMIN', 'MODERATOR'])(req, res, next);
}

/**
 * Refresh Token Authentication Middleware
 * For token refresh endpoints
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
