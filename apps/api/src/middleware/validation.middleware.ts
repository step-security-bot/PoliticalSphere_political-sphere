/**
 * Input validation and sanitization middleware
 */

import type { Request, Response, NextFunction } from 'express';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Initialize DOMPurify with JSDOM
const window = new JSDOM('').window;
const DOMPurifyInstance = DOMPurify(window);

/**
 * Sanitize string inputs to prevent XSS
 */
export function sanitizeInput(input: unknown): unknown {
  if (typeof input === 'string') {
    return DOMPurifyInstance.sanitize(input, { ALLOWED_TAGS: [] });
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (input && typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
}

/**
 * Middleware to sanitize request body, query, and params
 */
export function sanitizeRequest(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeInput(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeInput(req.query) as typeof req.query;
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeInput(req.params) as typeof req.params;
  }
  next();
}

/**
 * Validate content type is JSON for API endpoints
 */
export function validateContentType(req: Request, res: Response, next: NextFunction): void {
  const contentType = req.headers['content-type'];
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    if (!contentType || !contentType.includes('application/json')) {
      res.status(400).json({ error: 'Content-Type must be application/json' });
      return;
    }
  }
  next();
}
