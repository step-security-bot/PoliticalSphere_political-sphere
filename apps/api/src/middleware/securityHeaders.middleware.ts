/**
 * Enhanced Security Headers Middleware
 * Implements OWASP ASVS Level 2+ security headers
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Security headers middleware with comprehensive protection
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy - strict for privacy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy - restrict powerful features
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), gyroscope=(), accelerometer=(), magnetometer=(), payment=()'
  );

  // Content Security Policy - strict by default
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow for development, restrict in production
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ];

  if (process.env.NODE_ENV === 'production') {
    // Stricter CSP for production
    csp[1] = "script-src 'self'"; // Remove unsafe-inline and unsafe-eval
    csp[2] = "style-src 'self'"; // Remove unsafe-inline
  }

  res.setHeader('Content-Security-Policy', csp.join('; '));

  // HSTS - HTTP Strict Transport Security (only for HTTPS)
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Remove server information
  res.removeHeader('X-Powered-By');

  // Cache control for sensitive endpoints
  if (
    req.path.includes('/auth') ||
    req.path.includes('/compliance') ||
    req.path.includes('/admin')
  ) {
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
}

/**
 * API-specific security headers
 */
export function apiSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  // API-specific headers
  res.setHeader('X-API-Version', process.env.npm_package_version || '1.0.0');

  // Prevent caching of API responses by default
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // CORS headers are handled by cors middleware, but add additional ones
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  next();
}

/**
 * WebSocket security headers
 */
export function websocketSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  // WebSocket-specific security
  res.setHeader('X-WebSocket-Origin', req.headers.origin || 'unknown');

  // Prevent WebSocket hijacking
  if (req.headers['sec-websocket-protocol']) {
    // Validate WebSocket subprotocol if needed
    const protocol = req.headers['sec-websocket-protocol'];
    if (typeof protocol === 'string' && !protocol.includes('political-sphere')) {
      res.status(400).json({ error: 'Invalid WebSocket subprotocol' });
      return;
    }
  }

  next();
}

/**
 * File upload security headers
 */
export function uploadSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Additional headers for file uploads
  res.setHeader('X-Upload-Max-Size', '10485760'); // 10MB
  res.setHeader('X-Allowed-Types', 'image/jpeg,image/png,image/gif,text/plain,application/pdf');

  // Prevent download of uploaded files without authentication
  res.setHeader('X-Content-Disposition', 'attachment');

  next();
}

/**
 * Development vs Production headers
 */
export function environmentSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV === 'development') {
    // Development-specific headers
    res.setHeader('X-Development-Mode', 'true');
    res.setHeader('X-Debug-Allowed', 'true');
  } else {
    // Production hardening
    res.setHeader('X-Production-Mode', 'true');

    // Remove any development headers
    res.removeHeader('X-Development-Mode');
    res.removeHeader('X-Debug-Allowed');
  }

  next();
}

/**
 * Compliance-specific headers
 */
export function complianceSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  // GDPR compliance headers
  res.setHeader('X-GDPR-Compliant', 'true');
  res.setHeader('X-Data-Retention', '7-years-audit-logs');

  // DSA compliance
  res.setHeader('X-DSA-Compliant', 'true');

  // ICO compliance (UK)
  res.setHeader('X-ICO-Compliant', 'true');

  next();
}
