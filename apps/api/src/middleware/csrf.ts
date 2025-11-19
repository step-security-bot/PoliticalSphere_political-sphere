c; // Express CSRF protection middleware setup
// Uses modern 'csrf' package (csurf is deprecated)
// See: https://www.npmjs.com/package/csrf
import { doubleCsrf } from 'csrf-csrf';
import { Request, Response, NextFunction } from 'express';

// Configure CSRF protection using double-submit cookie pattern
const { invalidCsrfTokenError, generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => {
    const secret = process.env.CSRF_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error('CSRF_SECRET must be set and at least 32 characters long');
    }
    return secret;
  },
  getSessionIdentifier: (req: Request) => req.ip || 'default',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getCsrfTokenFromRequest: (req: Request) => req.headers['x-csrf-token'] as string,
});

// Middleware to generate and attach CSRF token to response
const csrfTokenMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const token = generateCsrfToken(req, res);
  res.locals.csrfToken = token;
  // Expose token in response header for SPA consumption
  res.setHeader('X-CSRF-Token', token);
  next();
};

export { doubleCsrfProtection as csrfProtection, csrfTokenMiddleware, invalidCsrfTokenError };
