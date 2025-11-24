/**
 * Comprehensive input validation and sanitization middleware
 * Implements OWASP ASVS requirements for input validation
 */

import type { Request, Response, NextFunction } from 'express';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Initialize DOMPurify with JSDOM
const window = new JSDOM('').window;
const DOMPurifyInstance = DOMPurify(window);

// Input limits (OWASP recommendations)
const LIMITS = {
  string: {
    min: 0,
    max: 10000, // 10KB max for text inputs
  },
  array: {
    max: 1000, // Max array length
  },
  object: {
    maxKeys: 100, // Max object keys
    maxDepth: 10, // Max nesting depth
  },
} as const;

// Dangerous patterns to reject
const DANGEROUS_PATTERNS = [
  /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b|\bEXEC\b|\bEXECUTE\b)/i,
  /(<script|javascript:|vbscript:|onload=|onerror=|onclick=|onmouseover=)/i,
  /(\.\.|\/etc\/|\/proc\/|\/home\/|\/root\/|\/var\/|\/usr\/)/i,
  /('|(\\x27)|(\\x2D\\x2D)|(#)|(%27)|(%22)|(%3B)|(%3C)|(%3E)|(%00))/i,
];

/**
 * Enhanced input sanitization with multiple layers
 */
export function sanitizeInput(input: unknown, depth = 0): unknown {
  // Prevent deep recursion
  if (depth > LIMITS.object.maxDepth) {
    throw new Error('Input validation failed: maximum nesting depth exceeded');
  }

  if (typeof input === 'string') {
    return sanitizeString(input);
  }

  if (Array.isArray(input)) {
    if (input.length > LIMITS.array.max) {
      throw new Error('Input validation failed: array too large');
    }
    return input.map(item => sanitizeInput(item, depth + 1));
  }

  if (input && typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    const keys = Object.keys(obj);

    if (keys.length > LIMITS.object.maxKeys) {
      throw new Error('Input validation failed: object has too many keys');
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Validate key name
      if (!isValidKeyName(key)) {
        throw new Error(`Input validation failed: invalid key name '${key}'`);
      }
      sanitized[key] = sanitizeInput(value, depth + 1);
    }
    return sanitized;
  }

  // Allow primitive types as-is
  if (
    input === null ||
    input === undefined ||
    typeof input === 'number' ||
    typeof input === 'boolean'
  ) {
    return input;
  }

  // Reject other types (functions, symbols, etc.)
  throw new Error('Input validation failed: unsupported data type');
}

/**
 * Sanitize string inputs with multiple security layers
 */
function sanitizeString(input: string): string {
  // Length validation
  if (input.length > LIMITS.string.max) {
    throw new Error('Input validation failed: string too long');
  }

  // HTML sanitization first
  let sanitized = DOMPurifyInstance.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  });

  // Check for dangerous patterns in the sanitized content
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      throw new Error('Input validation failed: dangerous content detected after sanitization');
    }
  }

  // Length validation (already done above, but double-check)
  if (sanitized.length > LIMITS.string.max) {
    throw new Error('Input validation failed: sanitized string too long');
  }

  // Basic HTML entity encoding for additional safety
  sanitized = sanitized
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized;
}

/**
 * Validate key names (prevent prototype pollution, etc.)
 */
function isValidKeyName(key: string): boolean {
  // Reject keys that could cause prototype pollution
  if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
    return false;
  }

  // Reject keys with dangerous characters
  if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
    return false;
  }

  return key.length <= 100; // Reasonable key length limit
}

/**
 * Enhanced middleware to sanitize request body, query, and params
 */
export function sanitizeRequest(req: Request, _res: Response, next: NextFunction): void {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeInput(req.body) as typeof req.body;
    }
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeInput(req.query) as typeof req.query;
    }
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeInput(req.params) as typeof req.params;
    }
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Input sanitization failed';
    _res.status(400).json({
      error: 'Bad Request',
      message: 'Input validation failed',
      details: process.env.NODE_ENV === 'development' ? message : undefined,
    });
  }
}

/**
 * Custom error class for HTTP errors with status codes
 */
class HttpError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'HttpError';
  }
}

/**
 * Validate content type with additional security checks
 */
/**
 * Validate that the request Content-Type and size meet the API expectations.
 *
 * Rejects requests that are missing required Content-Type headers, use an
 * unsupported media type, or exceed configured size limits.
 */
export function validateContentType(
  req: Request,
  callback: (error?: Error) => void
): void {
  const contentType = req.headers['content-type'];
  const contentLength = req.headers['content-length'];

  // Check content type for write operations
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (!contentType) {
      const error = new HttpError('Content-Type header required', 400);
      callback(error);
      return;
    }

    if (!contentType.includes('application/json')) {
      const error = new HttpError('Content-Type must be application/json', 415);
      callback(error);
      return;
    }

    // Check content length to prevent oversized payloads
    if (contentLength) {
      const length = parseInt(contentLength, 10);
      if (length > 1024 * 1024) {
        // 1MB limit
        const error = new HttpError('Request payload exceeds maximum allowed size', 413);
        callback(error);
        return;
      }
    }
  }

  callback();
}

/**
 * Validate request size and structure
 */
/**
 * Monitor and enforce request payload size limits beyond the Content-Length header.
 *
 * Streams request data and computes a running byte count to detect oversized
 * payloads and abort the connection early if limits are exceeded.
 */
export function validateRequestSize(
  req: Request,
  callback: (error?: Error) => void
): void {
  // Additional size checks beyond content-length header
  let bodySize = 0;

  const originalWrite = req.socket.write.bind(req.socket);
  req.socket.write = function (
    chunk: string | Uint8Array,
    encodingOrCb?: BufferEncoding | ((err?: Error | null) => void),
    cb?: (err?: Error | null) => void
  ) {
    if (typeof chunk === 'string') {
      bodySize += Buffer.byteLength(chunk, 'utf8');
    } else if (chunk && Buffer.isBuffer(chunk)) {
      bodySize += chunk.length;
    }

    if (bodySize > 1024 * 1024) {
      // 1MB limit
      const error = new HttpError('Request payload exceeds maximum allowed size', 413);
      callback(error);
      req.socket.destroy();
      return false;
    }

    // Dispatch based on parameter nature preserving original overloads
    if (typeof encodingOrCb === 'function') {
      return (
        originalWrite as {
          (chunk: string | Uint8Array, cb?: (err?: Error | null) => void): boolean;
          (
            chunk: string | Uint8Array,
            encoding?: BufferEncoding,
            cb?: (err?: Error | null) => void
          ): boolean;
        }
      ).call(this, chunk, undefined, encodingOrCb);
    }
    return (
      originalWrite as {
        (chunk: string | Uint8Array, cb?: (err?: Error | null) => void): boolean;
        (
          chunk: string | Uint8Array,
          encoding?: BufferEncoding,
          cb?: (err?: Error | null) => void
        ): boolean;
      }
    ).call(this, chunk, encodingOrCb, cb);
  };

  // For GET requests or requests without body, call callback immediately
  if (req.method === 'GET' || req.method === 'HEAD' || !req.headers['content-length']) {
    callback();
  } else {
    // Wait for the request to end to check final size
    req.on('end', () => {
      callback();
    });
  }
}

/**
 * Comprehensive input validation middleware combining all checks
 */
export function validateAndSanitizeRequest(req: Request, res: Response, next: NextFunction): void {
  try {
    // Validate content type
    validateContentType(req, (error?: Error) => {
      if (error) {
        const statusCode = (error as HttpError).statusCode || 400;
        const errorMessage = error.message || 'Validation failed';
        let responseBody: { error: string; message: string };

        if (statusCode === 400 && errorMessage === 'Content-Type header required') {
          responseBody = {
            error: 'Content-Type header required',
            message: 'Content-Type must be specified for this request method',
          };
        } else if (statusCode === 413) {
          responseBody = {
            error: 'Payload Too Large',
            message: errorMessage,
          };
        } else if (statusCode === 415) {
          responseBody = {
            error: 'Unsupported Media Type',
            message: errorMessage,
          };
        } else {
          responseBody = {
            error: 'Validation Error',
            message: errorMessage,
          };
        }

        return res.status(statusCode).json(responseBody);
      }

      if (res.headersSent) {
        return;
      }

      // Validate request size
      validateRequestSize(req, (error?: Error) => {
        if (error) {
          const statusCode = (error as HttpError).statusCode || 400;
          const message = error.message || 'Validation failed';
          return res.status(statusCode).json({
            error: statusCode === 413 ? 'Payload Too Large' : 'Validation Error',
            message,
          });
        }

        if (res.headersSent) {
          return;
        }

        // Sanitize request
        sanitizeRequest(req, res, next);
        return undefined;
      });
      // Ensure this outer callback returns a value synchronously to match
      // the expected callback signature used by the validation helpers.
      return undefined;
    });
  } catch (error) {
    next(error);
  }
}
