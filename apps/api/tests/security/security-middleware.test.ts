/**
 * Security Middleware Tests
 * Tests for authentication, authorization, input validation, and security headers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { type Request, type Response, type NextFunction } from 'express';

// Mock services that would otherwise touch Prisma or external systems
vi.mock('../../src/modules/complianceService.js', () => {
  const noop = vi.fn();
  const mockClass = class {
    static logComplianceEvent = noop;
    static notifyDataSubject = noop;
  };
  return {
    __esModule: true,
    default: mockClass,
    logComplianceEvent: noop,
  };
});

vi.mock('../../src/modules/ageVerificationService.js', () => {
  const verification = { verified: true, age: 21 };
  return {
    __esModule: true,
    default: class {
      static getVerificationStatus = vi.fn().mockResolvedValue(verification);
      static getAgeRestrictions = vi.fn(() => ({ contentRating: 'PG', features: {} }));
      static canAccessContent = vi.fn(() => true);
    },
  };
});

import { validateAndSanitizeRequest } from '../../src/middleware/validation.middleware';
import { securityHeaders } from '../../src/middleware/securityHeaders.middleware';
import { requireAgeVerification } from '../../src/middleware/ageVerification.middleware';
import { authLimiter, apiLimiter } from '../../src/middleware/rateLimit.middleware';
import { comprehensiveAuditLogger } from '../../src/middleware/audit.middleware';
import AgeVerificationService from '../../src/modules/ageVerificationService.js';
import * as logger from '../../src/utils/logger.js';

const buildRequest = (overrides: Partial<Request> = {}): Request => {
  const url = overrides.url ?? '/';
  const req: any = {
    method: 'GET',
    url,
    originalUrl: url,
    path: url,
    headers: (overrides.headers as Record<string, string>) || {},
    body: {},
    query: {},
    params: {},
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' } as any,
    socket: {
      remoteAddress: '127.0.0.1',
      write: () => true,
      destroy: vi.fn(),
    } as any,
    ...overrides,
  };

  req.get = (name: string) => {
    const currentHeaders = (req.headers as Record<string, string>) || {};
    return currentHeaders[name.toLowerCase()];
  };

  return req as Request;
};

const createMockResponse = (onSend?: () => void) => {
  const finishHandlers: Array<() => void> = [];
  const headers: Record<string, string> = {};

  const res: any = {
    statusCode: 200,
    headers,
    setHeader: vi.fn((key: string, value: string) => {
      headers[key.toLowerCase()] = value;
      return res;
    }),
    getHeader: (key: string) => headers[key.toLowerCase()],
    get: vi.fn((key: string) => headers[key.toLowerCase()]),
    set: vi.fn((values: Record<string, string>) => {
      Object.entries(values).forEach(([key, value]) => {
        headers[key.toLowerCase()] = value;
      });
      return res;
    }),
    status: vi.fn(function (code: number) {
      res.statusCode = code;
      return res;
    }),
    json: vi.fn(function (payload: unknown) {
      res.body = payload;
      onSend?.();
      return res;
    }),
    send: vi.fn(function (payload: unknown) {
      res.body = payload;
      onSend?.();
      return res;
    }),
    end: vi.fn(function (payload?: unknown) {
      res.body = payload;
      onSend?.();
      return res;
    }),
    removeHeader: vi.fn(),
    on: vi.fn((event: string, handler: () => void) => {
      if (event === 'finish') {
        finishHandlers.push(handler);
      }
      return res;
    }),
  };

  return {
    res: res as Response,
    headers,
    triggerFinish: () => finishHandlers.forEach(handler => handler()),
  };
};

const runLimiterHit = async (
  limiter: (req: Request, res: Response, next: NextFunction) => void,
  overrides: Partial<Request> = {}
) => {
  return await new Promise<{ res: Response; limited: boolean }>(resolve => {
    const { res } = createMockResponse(() => resolve({ res, limited: true }));
    const req = buildRequest(overrides);
    limiter(req, res, () => resolve({ res, limited: false }));
  });
};

const runMiddleware = async (
  middleware: (req: Request, res: Response, next: NextFunction) => unknown,
  req: Request,
  res: Response
): Promise<boolean> => {
  let calledNext = false;
  const maybePromise = middleware(req, res, () => {
    calledNext = true;
  });

  if (maybePromise instanceof Promise) {
    await maybePromise;
  }

  return calledNext;
};

const runSecurityPipeline = async (
  reqOverrides: Partial<Request>,
  routeHandler: (req: Request, res: Response) => void
) => {
  const { res, triggerFinish } = createMockResponse();
  const req = buildRequest(reqOverrides);

  const middlewares = [comprehensiveAuditLogger, validateAndSanitizeRequest, securityHeaders];
  for (const middleware of middlewares) {
    const shouldContinue = await runMiddleware(middleware, req, res);
    if (!shouldContinue || res.statusCode >= 400) {
      triggerFinish();
      return { res, req };
    }
  }

  routeHandler(req, res);
  triggerFinish();
  return { res, req };
};

describe('Security Middleware Tests', () => {
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = buildRequest();
    ({ res: mockRes } = createMockResponse());

    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Input Validation & Sanitization', () => {
    it('should sanitize XSS in request body', () => {
      const maliciousBody = {
        content: '<script>alert("xss")</script><p>safe content</p>',
        name: 'test',
      };

      mockReq.body = maliciousBody;

      validateAndSanitizeRequest(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.body.content).not.toContain('<script>');
      expect(mockReq.body.content).toContain('safe content');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate content type', () => {
      mockReq.method = 'POST';
      mockReq.headers = {};

      validateAndSanitizeRequest(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Content-Type header required',
        message: 'Content-Type must be specified for this request method',
      });
    });

    it('should reject oversized payloads', () => {
      mockReq.method = 'POST';
      mockReq.headers = {
        'content-type': 'application/json',
        'content-length': '2000000', // 2MB
      };

      validateAndSanitizeRequest(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(413);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Payload Too Large',
        message: 'Request payload exceeds maximum allowed size',
      });
    });
  });

  describe('Security Headers', () => {
    it('should set comprehensive security headers', () => {
      securityHeaders(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Referrer-Policy',
        'strict-origin-when-cross-origin'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining("default-src 'self'")
      );
      expect(mockNext).toHaveBeenCalled();
    });

    it('should set HSTS for HTTPS requests', () => {
      const secureReq = { ...mockReq, secure: true };

      securityHeaders(secureReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
    });
  });

  describe('Age Verification', () => {
    it('should allow access for verified adult users', async () => {
      (mockReq as any).authUser = {
        userId: 'user123',
        username: 'testuser',
        role: 'PLAYER',
      };

      vi.spyOn(AgeVerificationService as any, 'getVerificationStatus').mockResolvedValue({
        verified: true,
        age: 25,
      });
      vi.spyOn(AgeVerificationService as any, 'getAgeRestrictions').mockReturnValue({
        contentRating: 'GENERAL',
        features: {},
      });

      const ageMiddleware = requireAgeVerification(18);
      await ageMiddleware(mockReq as Request, mockRes as Response, mockNext);

      // Should proceed for adult users
      expect(mockNext).toHaveBeenCalled();
    });

    it('should block access for unverified users', async () => {
      (mockReq as any).authUser = {
        userId: 'user123',
        username: 'testuser',
        role: 'PLAYER',
      };

      vi.spyOn(AgeVerificationService as any, 'getVerificationStatus').mockResolvedValue(null);

      const ageMiddleware = requireAgeVerification(18);
      await ageMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Age verification required',
        message: 'This content requires age verification (minimum age: 18)',
        nextStep: 'age_verification_required',
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should apply auth rate limiting', async () => {
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(
          await runLimiterHit(authLimiter, {
            method: 'POST',
            url: '/auth/login',
            headers: { 'content-type': 'application/json' } as any,
            body: { email: 'test@example.com', password: 'password' } as any,
          })
        );
      }

      const rateLimited = results.some(result => result.limited || result.res.statusCode === 429);
      expect(rateLimited).toBe(true);
    });

    it('should apply API rate limiting', async () => {
      const results = [];
      for (let i = 0; i < 120; i++) {
        results.push(
          await runLimiterHit(apiLimiter, {
            method: 'GET',
            url: '/api/test',
          })
        );
      }

      const rateLimited = results.some(result => result.limited || result.res.statusCode === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('Audit Logging', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log all requests', () => {
      const logReq = buildRequest({
        method: 'GET',
        url: '/api/test',
        headers: { 'user-agent': 'Mozilla/5.0' } as any,
      });

      comprehensiveAuditLogger(logReq as Request, mockRes as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith(
        'AUDIT: Request start - GET /api/test',
        expect.objectContaining({
          method: 'GET',
          url: '/api/test',
          ip: '127.0.0.1',
          action: 'request_start',
        })
      );
    });
  });
});

describe('Security Integration Tests', () => {
  it('should handle secure public requests', async () => {
    const { res } = await runSecurityPipeline(
      {
        method: 'GET',
        url: '/api/public',
        headers: { 'content-type': 'application/json' } as any,
      },
      (_req, response) => {
        response.json({ message: 'public endpoint' });
      }
    );

    const headers = (res as any).headers as Record<string, string>;

    expect(res.statusCode).toBe(200);
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['content-security-policy']).toBeDefined();
  });

  it('should sanitize malicious input', async () => {
    const maliciousData = {
      content: '<script>alert("xss")</script>Hello World',
      safeField: 'safe content',
    };

    const { res } = await runSecurityPipeline(
      {
        method: 'POST',
        url: '/api/protected',
        headers: { 'content-type': 'application/json' } as any,
        body: maliciousData as any,
      },
      (req, response) => {
        response.json({ message: 'protected endpoint', data: req.body });
      }
    );

    const responseBody = (res as any).body;

    expect(res.statusCode).toBe(200);
    expect(responseBody.data.content).not.toContain('<script>');
    expect(responseBody.data.content).toContain('Hello World');
  });

  it('should reject invalid content type', async () => {
    const { res } = await runSecurityPipeline(
      {
        method: 'POST',
        url: '/api/protected',
        headers: { 'content-type': 'text/plain' } as any,
        body: 'invalid data' as any,
      },
      (req, response) => {
        response.json({ message: 'protected endpoint', data: req.body });
      }
    );

    expect(res.statusCode).toBe(415);
    expect((res as any).body.error).toBe('Unsupported Media Type');
  });
});
