import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../auth.service', () => {
  return {
    authService: {
      verifyAccessToken: vi.fn(),
    },
  };
});

import { optionalAuth } from '../auth.middleware';
import { authService } from '../auth.service';

describe('Auth middleware (auth.middleware.ts) optionalAuth', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not crash when req.cookies is undefined', async () => {
    const req = { headers: {}, cookies: undefined } as unknown as Request;
    const res = {} as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;
    optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.authUser).toBeUndefined();
  });

  it('attaches user when authService.verifyAccessToken returns payload', async () => {
    vi.spyOn(authService, 'verifyAccessToken').mockImplementation(
      () =>
        ({
          userId: 'user-1',
          username: 'test',
          role: 'VIEWER',
          type: 'access',
        }) as any
    );

    const req = { headers: {}, cookies: { accessToken: 'valid' } } as unknown as Request;
    const res = {} as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;

    optionalAuth(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.authUser).toBeDefined();
    expect(req.authUser?.userId).toBe('user-1');
  });
});
