/**
 * Standardized Application Error Class
 *
 * Based on Node.js Best Practices:
 * - Extends built-in Error
 * - Distinguishes operational vs catastrophic errors
 * - Includes machine-readable error codes
 * - Provides HTTP status codes for API responses
 *
 * See: https://github.com/goldbergyoni/nodebestpractices
 */

export class AppError extends Error {
  /**
   * Creates a new application error
   *
   * @param statusCode - HTTP status code (400, 404, 500, etc.)
   * @param code - Machine-readable error code (USER_NOT_FOUND, INVALID_INPUT, etc.)
   * @param message - Human-readable error message
   * @param isCatastrophic - Whether this is a catastrophic (non-recoverable) error
   * @param details - Additional error context (optional)
   */
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly isCatastrophic: boolean = false,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }

    this.name = 'AppError';

    // Ensure prototype chain is correct
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Check if this is an operational error (expected, recoverable)
   */
  get isOperational(): boolean {
    return !this.isCatastrophic;
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON(): Record<string, unknown> {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        ...(this.details && { details: this.details }),
      },
    };
  }

  /**
   * Convert error to log-friendly format
   */
  toLogFormat(): Record<string, unknown> {
    return {
      errorCode: this.code,
      errorMessage: this.message,
      statusCode: this.statusCode,
      isCatastrophic: this.isCatastrophic,
      stack: this.stack,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * Common HTTP error codes for convenience
 */
export const ErrorCodes = {
  // 4xx Client Errors
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Application-specific
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
} as const;

/**
 * Factory functions for common error types
 */
export class ErrorFactory {
  static badRequest(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(400, ErrorCodes.BAD_REQUEST, message, false, details);
  }

  static unauthorized(
    message: string = 'Unauthorized',
    details?: Record<string, unknown>
  ): AppError {
    return new AppError(401, ErrorCodes.UNAUTHORIZED, message, false, details);
  }

  static forbidden(message: string = 'Forbidden', details?: Record<string, unknown>): AppError {
    return new AppError(403, ErrorCodes.FORBIDDEN, message, false, details);
  }

  static notFound(resource: string, id?: string | number): AppError {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    return new AppError(404, ErrorCodes.NOT_FOUND, message, false);
  }

  static conflict(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(409, ErrorCodes.CONFLICT, message, false, details);
  }

  static validation(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(400, ErrorCodes.VALIDATION_ERROR, message, false, details);
  }

  static internal(
    message: string = 'Internal server error',
    isCatastrophic: boolean = false
  ): AppError {
    return new AppError(500, ErrorCodes.INTERNAL_SERVER_ERROR, message, isCatastrophic);
  }

  static database(message: string, isCatastrophic: boolean = false): AppError {
    return new AppError(500, ErrorCodes.DATABASE_ERROR, message, isCatastrophic);
  }

  static externalService(service: string, error: Error): AppError {
    return new AppError(
      502,
      ErrorCodes.EXTERNAL_SERVICE_ERROR,
      `External service error: ${service}`,
      false,
      { originalError: error.message }
    );
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Convert any error to AppError for consistent handling
 */
export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      500,
      ErrorCodes.INTERNAL_SERVER_ERROR,
      error.message,
      true, // Unknown errors are catastrophic until proven otherwise
      { originalError: error.name, stack: error.stack }
    );
  }

  return new AppError(500, ErrorCodes.INTERNAL_SERVER_ERROR, 'An unknown error occurred', true, {
    originalError: String(error),
  });
}
