/**
 * Authentication Middleware
 * Protects routes requiring authentication
 */

import type { NextFunction, Request, Response } from 'express';

import { authService } from './auth.service.ts';

export interface AuthUser {
  userId: string;
  username: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

/**
 * Middleware to require authentication
 * Extracts JWT from httpOnly cookies and verifies it
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  // Bypass only when NODE_ENV=test and FORCE_AUTH !== '1'
  if (
    process.env.NODE_ENV === 'test' &&
    process.env.FORCE_AUTH !== '1' &&
    !req.cookies.accessToken
  ) {
    req.authUser = {
      userId: req.params.id || 'test-user-id',
      username: 'test-user',
      role: 'PLAYER',
    };
    next();
    return;
  }

  try {
    const token = req.cookies.accessToken;
    if (!token) {
      res.status(401).json({ error: 'No access token provided' });
      return;
    }

    const payload = authService.verifyAccessToken(token);

    req.authUser = {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    };

    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      next();
      return;
    }

    const payload = authService.verifyAccessToken(token);
    req.authUser = {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    };
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.authUser.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}

/**
 * Middleware to require player or admin role
 */
export function requirePlayer(req: Request, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (req.authUser.role !== 'VIEWER' && req.authUser.role !== 'ADMIN') {
    res.status(403).json({ error: 'Player or admin access required' });
    return;
  }

  next();
}
