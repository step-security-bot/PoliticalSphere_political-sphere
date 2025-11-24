import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

import { optionalAuth } from '../auth';

describe('Auth middleware (middleware/auth.ts) optionalAuth', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not crash when req.cookies is undefined', () => {
    const req = { headers: {}, cookies: undefined } as unknown as Request;
    const res = {} as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;
    optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeUndefined();
  });

  it('attaches user when jwt.verify returns payload', () => {
    vi.spyOn(jwt, 'verify').mockImplementation(() => ({
      userId: 'u123',
      username: 'alpha',
      role: 'VIEWER',
      type: 'access',
    } as any));

    const req = { headers: {}, cookies: { accessToken: 'tok' } } as unknown as Request;
    const res = {} as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;
    optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeDefined();
    expect((req as any).user.id).toBe('u123');
  });
});
