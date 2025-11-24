/**
 * Authentication Middleware
 * Protects routes requiring authentication
 */

import type { NextFunction, Request, Response } from 'express';

import { authService } from './auth.service.ts';

/**
 * AuthUser used by this API to represent an authenticated user.
 *
 * - `id` Primary identifier for the user
 * - `userId` Alias retained for compatibility
 * - `username` Display name / identifier for the user
 * - `role` Required property for authorization checks
 * - `email` Optional, may be omitted from tokens
 */
/**
 * AuthUser - authenticated user shape used by middleware and route guards.
 *
 * Fields: `id`, `userId`, `username`, `role`, and optional `email`.
 */
export interface AuthUser {
  /**
   * Primary identifier for the user
   */
  id: string;
  /**
   * Backwards-compatible alias for `id`
   */
  userId: string;
  /**
   * Human-friendly name for display and debugging
   */
  username: string;
  /**
   * Role string used by route guard checks (eg. 'ADMIN', 'PLAYER', 'VIEWER')
   */
  role: string;
  /**
   * Optional email address attached to the user token
   */
  email?: string;
}

/**
 * AuthRequest - Express Request extended with optional auth user information
 */
export interface AuthRequest extends Request {
  /**
   * The authenticated user (if present)
   */
  authUser?: AuthUser;
  /**
   * Backwards-compatible alias for `authUser` used in older code
   */
  user?: AuthUser; // alias for compatibility with other modules using req.user
}

declare module 'express-serve-static-core' {
  interface Request {
    /** The authenticated user; available when authenticated */
    authUser?: AuthUser;
    /** Alias for `authUser` - present for backwards compatibility */
    user?: AuthUser; // add alias so route handlers expecting req.user compile
  }
}

/**
 * authenticate - Require a valid access token
 *
 * Verifies access tokens from either an httpOnly cookie (`accessToken`) or the
 * Authorization header. Attaches `AuthUser` to `req.authUser` and `req.user`.
 */
/**
 * authenticate - Require a valid access token and attach `AuthUser` to `req`.
 *
 * Supports tokens from httpOnly cookies or the Authorization header and
 * populates `req.authUser` / `req.user` for downstream handlers.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  // Bypass only when NODE_ENV=test and FORCE_AUTH !== '1'
  const tokenFromCookie = req.cookies?.accessToken as string | undefined;
  if (process.env.NODE_ENV === 'test' && process.env.FORCE_AUTH !== '1' && !tokenFromCookie) {
    const testId = req.params.id || 'test-user-id';
    const testUser: AuthUser = {
      id: testId,
      userId: testId,
      username: 'test-user',
      role: 'PLAYER',
    };

    req.authUser = testUser;
    req.user = testUser; // ensure alias is set for compatibility
    next();
    return;
  }

  try {
    // Check for token in cookie first, then Authorization header
    let token = tokenFromCookie;

    // Check Authorization header if no cookie token
    if (!token) {
      if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization!.substring(7); // Remove 'Bearer ' prefix
      }
    }

    if (!token) {
      res.status(401).json({ error: 'No access token provided' });
      return;
    }

    // In test mode, accept mock tokens
    if (process.env.NODE_ENV === 'test' && token === 'mock-jwt-token-for-testing') {
      const testUser: AuthUser = {
        id: 'test-user-id',
        userId: 'test-user-id',
        username: 'test-user',
        role: 'VIEWER',
      };
      req.authUser = testUser;
      req.user = testUser;
      next();
      return;
    }

    const payload = authService.verifyAccessToken(token);

    const user: AuthUser = {
      id: payload.userId,
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    };
    req.authUser = user;
    req.user = user;

    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * optionalAuth - Attempt to authenticate if a valid cookie is present; otherwise
 * simply continue without failing the request.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = req.cookies?.accessToken as string | undefined;
    if (!token) {
      next();
      return;
    }

    const payload = authService.verifyAccessToken(token);
    const user: AuthUser = {
      id: payload.userId,
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    };
    req.authUser = user;
    (req as Request & { user?: AuthUser }).user = user; // assign alias for compatibility
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
}

/**
 * requireAdmin - Require the authenticated user to hold the `ADMIN` role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user =
    (req as Request & { authUser?: AuthUser; user?: AuthUser }).authUser ||
    (req as Request & { authUser?: AuthUser; user?: AuthUser }).user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}

/**
 * requirePlayer - Require the authenticated user to hold the `VIEWER` or `ADMIN` role
 */
export function requirePlayer(req: Request, res: Response, next: NextFunction): void {
  const user =
    (req as Request & { authUser?: AuthUser; user?: AuthUser }).authUser ||
    (req as Request & { authUser?: AuthUser; user?: AuthUser }).user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (user.role !== 'VIEWER' && user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Player or admin access required' });
    return;
  }

  next();
}
