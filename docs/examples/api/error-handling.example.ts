/**
 * Error Handling Examples
 *
 * Demonstrates comprehensive error handling patterns including:
 * - Custom error classes
 * - Error middleware
 * - Structured error responses
 * - Error logging
 *
 * @see docs/05-engineering-and-devops/development/backend.md
 */

import type { Request, Response, NextFunction } from 'express';

// ============================================================================
// Custom Error Classes
// ============================================================================

/**
 * Base application error class
 */
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
    public isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error (400)
 */
class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

/**
 * Authentication error (401)
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'AUTHENTICATION_ERROR', message);
  }
}

/**
 * Authorization error (403)
 */
class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(403, 'AUTHORIZATION_ERROR', message);
  }
}

/**
 * Not found error (404)
 */
class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(404, 'NOT_FOUND', message);
  }
}

/**
 * Conflict error (409)
 */
class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(409, 'CONFLICT', message, details);
  }
}

/**
 * Rate limit error (429)
 */
class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(429, 'RATE_LIMIT_EXCEEDED', message);
  }
}

// ============================================================================
// Error Handler Middleware
// ============================================================================

/**
 * Global error handler middleware
 *
 * Place this as the last middleware in your Express app
 */
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  // Log error with context
  logError(err, {
    method: req.method,
    url: req.url,
    userId: (req as any).user?.id,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Handle known operational errors
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
      },
    });
    return;
  }

  // Handle unknown/programming errors
  console.error('CRITICAL ERROR:', err);

  // Don't leak internal error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      ...(isDevelopment && {
        details: err.message,
        stack: err.stack,
      }),
    },
  });
}

/**
 * Async error wrapper - catches async errors automatically
 *
 * Usage:
 * ```typescript
 * app.get('/users/:id', asyncHandler(async (req, res) => {
 *   const user = await userService.findById(req.params.id);
 *   if (!user) throw new NotFoundError('User', req.params.id);
 *   res.json(user);
 * }));
 * ```
 */
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ============================================================================
// Usage Examples
// ============================================================================

/**
 * Example: Resource not found
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await userRepository.findById(req.params.id);

  if (!user) {
    throw new NotFoundError('User', req.params.id);
  }

  res.json(user);
});

/**
 * Example: Validation error
 */
const createUser = asyncHandler(async (req, res) => {
  const existingUser = await userRepository.findByEmail(req.body.email);

  if (existingUser) {
    throw new ConflictError('Email already registered', {
      field: 'email',
      value: req.body.email,
    });
  }

  const user = await userRepository.create(req.body);
  res.status(201).json(user);
});

/**
 * Example: Authorization check
 */
const deleteUser = asyncHandler(async (req, res) => {
  const currentUser = (req as any).user;
  const targetUserId = req.params.id;

  // Users can only delete their own account unless they're admin
  if (currentUser.id !== targetUserId && currentUser.role !== 'admin') {
    throw new AuthorizationError('You can only delete your own account');
  }

  await userRepository.delete(targetUserId);
  res.status(204).send();
});

/**
 * Example: Multiple validation errors
 */
const updateBill = asyncHandler(async (req, res) => {
  const errors: Array<{ field: string; message: string }> = [];

  if (req.body.title && req.body.title.length < 5) {
    errors.push({
      field: 'title',
      message: 'Title must be at least 5 characters',
    });
  }

  if (req.body.votingEndsAt) {
    const endDate = new Date(req.body.votingEndsAt);
    if (endDate < new Date()) {
      errors.push({
        field: 'votingEndsAt',
        message: 'Voting end date must be in the future',
      });
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', errors);
  }

  const bill = await billRepository.update(req.params.id, req.body);
  res.json(bill);
});

// ============================================================================
// Error Logging
// ============================================================================

interface ErrorContext {
  method?: string;
  url?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

/**
 * Structured error logging
 */
function logError(error: Error, context: ErrorContext = {}): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
    ...(error instanceof AppError && {
      statusCode: error.statusCode,
      code: error.code,
      isOperational: error.isOperational,
    }),
  };

  // In production, send to logging service (e.g., Sentry, LogRocket)
  if (process.env.NODE_ENV === 'production') {
    // sendToLoggingService(logEntry);
  }

  // Always log to console in development
  console.error(JSON.stringify(logEntry, null, 2));
}

// ============================================================================
// 404 Handler
// ============================================================================

/**
 * Catch-all 404 handler - place before error handler
 */
function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  next(new NotFoundError('Route', `${req.method} ${req.path}`));
}

// ============================================================================
// Express App Setup Example
// ============================================================================

/*
import express from 'express';

const app = express();

// ... other middleware (body-parser, cors, etc.)

// Routes
app.use('/api/users', userRoutes);
app.use('/api/bills', billRoutes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

app.listen(3000);
*/

// ============================================================================
// Testing Examples
// ============================================================================

import { describe, it, expect } from 'vitest';

describe('Error handling', () => {
  it('should create NotFoundError with correct properties', () => {
    const error = new NotFoundError('User', '123');

    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe("User with identifier '123' not found");
    expect(error.isOperational).toBe(true);
  });

  it('should create ConflictError with details', () => {
    const details = { field: 'email', value: 'test@example.com' };
    const error = new ConflictError('Email already exists', details);

    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('CONFLICT');
    expect(error.details).toEqual(details);
  });
});

// ============================================================================
// Mock Repository (for examples)
// ============================================================================

const userRepository = {
  findById: async (id: string) => null,
  findByEmail: async (email: string) => null,
  create: async (data: any) => ({ id: 'user-1', ...data }),
  delete: async (id: string) => {},
};

const billRepository = {
  update: async (id: string, data: any) => ({ id, ...data }),
};
