import type { NextFunction, Request, Response } from 'express';

import { sanitizeErrorForLog } from './log-sanitizer';
import { getLogger } from '@political-sphere/shared';

/**
 * Express error handling middleware that sanitizes errors for logging and returns appropriate HTTP responses.
 * Handles different error types with appropriate status codes and prevents information leakage.
 * @param err - The error that occurred
 * @param req - Express request object
 * @param res - Express response object
 * @param _next - Express next function (unused)
 */
// Express error handler (documented above) - keep implementation as-is
export function handleError(err: Error, req: Request, res: Response, _next: NextFunction): void {
  // Security: Sanitize error data before logging to prevent log injection
  const sanitizedError = sanitizeErrorForLog(err, req as unknown as Record<string, unknown>);
  const logger = getLogger({ service: 'api-error-handler' });
  logger.error('Error:', { error: sanitizedError });

  // Don't leak internal errors
  const isDevelopment = process.env.NODE_ENV === 'development';
  const message = isDevelopment ? err.message : 'Internal server error';

  // Determine status code
  let statusCode = 500;
  if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
  } else if (err.name === 'ConflictError') {
    statusCode = 409;
  } else if (err.name === 'RateLimitError') {
    statusCode = 429;
  } else if (err.name === 'DatabaseError') {
    statusCode = 500;
  } else if (err.name === 'ExternalServiceError') {
    statusCode = 502;
  }

  res.status(statusCode).json({
    error: {
      type: err.name,
      message,
      ...(isDevelopment && { stack: err.stack }),
    },
  });
}

/**
 * Higher-order function that wraps async route handlers to catch rejected promises and forward them to error handling middleware.
 * Eliminates the need for try-catch blocks in async route handlers.
 * @param fn - The async route handler function to wrap
 * @returns A wrapped function that catches and forwards errors
 */
// Wrapper for async route handlers - documented above
export function asyncHandler(
  fn: (req: Request, res: Response, _next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Custom error classes
/**
 * Error thrown when request validation fails (e.g., invalid input data).
 * Maps to HTTP 400 Bad Request status.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when a requested resource cannot be found.
 * Maps to HTTP 404 Not Found status.
 */
export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

/**
 * Error thrown when authentication is required but not provided or invalid.
 * Maps to HTTP 401 Unauthorized status.
 */
export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Error thrown when the request conflicts with the current state of the resource.
 * Maps to HTTP 409 Conflict status.
 */
export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

/**
 * Error thrown when the request rate limit has been exceeded.
 * Maps to HTTP 429 Too Many Requests status.
 */
export class RateLimitError extends Error {
  constructor(message: string = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Error thrown when a database operation fails.
 * Maps to HTTP 500 Internal Server Error status.
 */
export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Error thrown when an external service or API call fails.
 * Maps to HTTP 502 Bad Gateway status.
 */
export class ExternalServiceError extends Error {
  constructor(service: string, message: string) {
    super(`${service}: ${message}`);
    this.name = 'ExternalServiceError';
  }
}

// Circuit breaker for external services
/**
 * Circuit breaker pattern implementation for external service calls.
 * Prevents cascading failures by temporarily stopping calls to failing services.
 * Automatically transitions between CLOSED, OPEN, and HALF_OPEN states.
 */
// CircuitBreaker class documented above - implementation remains unchanged
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000 // 1 minute
  ) {}

  /**
   * Executes a function with circuit breaker protection.
   * Tracks failures and manages circuit state transitions.
   * @param fn - The async function to execute with circuit breaker protection
   * @returns Promise resolving to the result of the executed function
   * @throws ExternalServiceError if circuit is open, or the original error if execution fails
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new ExternalServiceError('CircuitBreaker', 'Service is currently unavailable');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  /**
   * Gets the current state of the circuit breaker.
   * @returns The current circuit breaker state ('CLOSED', 'OPEN', or 'HALF_OPEN')
   */
  getState() {
    return this.state;
  }
}

// Retry mechanism with exponential backoff
/**
 * Retries an async function with exponential backoff on failure.
 * Implements jitter-free exponential backoff to prevent thundering herd problems.
 * @param fn - The async function to retry on failure
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds for exponential backoff (default: 1000)
 * @returns Promise resolving to the result of the successfully executed function
 * @throws The last error encountered if all retry attempts fail
 */
// `retryWithBackoff` helper (documented above) - retries async functions
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let _lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      _lastError = error as Error;

      if (attempt === maxRetries) {
        throw _lastError;
      }

      const delay = baseDelay * 2 ** attempt;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript requires it
  throw new Error('Unexpected error in retry mechanism');
};
