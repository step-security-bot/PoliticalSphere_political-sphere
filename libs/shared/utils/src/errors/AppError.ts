/**
 * Standardized application error class
 * Extends built-in Error object and distinguishes catastrophic vs operational errors
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public isCatastrophic: boolean = false
  ) {
    super(message);
    this.name = 'AppError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Predefined error codes for common scenarios
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  VALIDATION_FAILED: 'VALIDATION_FAILED',

  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // Business logic errors
  INVALID_OPERATION: 'INVALID_OPERATION',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

/**
 * HTTP status codes mapping
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Factory functions for common errors
 */
export const createError = {
  unauthorized: (message = 'Unauthorized access') =>
    new AppError(HttpStatus.UNAUTHORIZED, ErrorCodes.UNAUTHORIZED, message),

  forbidden: (message = 'Access forbidden') =>
    new AppError(HttpStatus.FORBIDDEN, ErrorCodes.FORBIDDEN, message),

  notFound: (resource = 'Resource') =>
    new AppError(HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND, `${resource} not found`),

  validationFailed: (message = 'Validation failed') =>
    new AppError(HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_FAILED, message),

  internalError: (message = 'Internal server error') =>
    new AppError(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR, message, true),

  conflict: (message = 'Resource conflict') =>
    new AppError(HttpStatus.CONFLICT, ErrorCodes.ALREADY_EXISTS, message),

  rateLimitExceeded: (message = 'Rate limit exceeded') =>
    new AppError(HttpStatus.TOO_MANY_REQUESTS, ErrorCodes.RATE_LIMIT_EXCEEDED, message),
} as const;
