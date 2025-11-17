import { describe, it, expect } from 'vitest';
import { AppError, ErrorFactory, isAppError, normalizeError, ErrorCodes } from './AppError';

describe('AppError', () => {
  describe('constructor', () => {
    it('should create error with all properties', () => {
      const error = new AppError(404, 'USER_NOT_FOUND', 'User not found', false, { userId: 123 });

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('USER_NOT_FOUND');
      expect(error.message).toBe('User not found');
      expect(error.isCatastrophic).toBe(false);
      expect(error.details).toEqual({ userId: 123 });
      expect(error.name).toBe('AppError');
    });

    it('should default isCatastrophic to false', () => {
      const error = new AppError(400, 'BAD_REQUEST', 'Bad request');

      expect(error.isCatastrophic).toBe(false);
      expect(error.isOperational).toBe(true);
    });

    it('should maintain proper error stack', () => {
      const error = new AppError(500, 'ERROR', 'Test error');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });

  describe('isOperational', () => {
    it('should return true for operational errors', () => {
      const error = new AppError(400, 'VALIDATION', 'Validation failed', false);

      expect(error.isOperational).toBe(true);
    });

    it('should return false for catastrophic errors', () => {
      const error = new AppError(500, 'FATAL', 'System failure', true);

      expect(error.isOperational).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should convert to JSON format', () => {
      const error = new AppError(404, 'NOT_FOUND', 'Resource not found');

      const json = error.toJSON();

      expect(json).toEqual({
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
          statusCode: 404,
        },
      });
    });

    it('should include details when present', () => {
      const error = new AppError(400, 'VALIDATION', 'Invalid input', false, {
        field: 'email',
        reason: 'invalid format',
      });

      const json = error.toJSON();

      expect(json.error).toHaveProperty('details');
      expect(json.error.details).toEqual({
        field: 'email',
        reason: 'invalid format',
      });
    });
  });

  describe('toLogFormat', () => {
    it('should convert to log-friendly format', () => {
      const error = new AppError(500, 'SERVER_ERROR', 'Internal error', true);

      const logFormat = error.toLogFormat();

      expect(logFormat).toHaveProperty('errorCode', 'SERVER_ERROR');
      expect(logFormat).toHaveProperty('errorMessage', 'Internal error');
      expect(logFormat).toHaveProperty('statusCode', 500);
      expect(logFormat).toHaveProperty('isCatastrophic', true);
      expect(logFormat).toHaveProperty('stack');
    });
  });
});

describe('ErrorFactory', () => {
  it('should create badRequest error', () => {
    const error = ErrorFactory.badRequest('Invalid request');

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(ErrorCodes.BAD_REQUEST);
    expect(error.message).toBe('Invalid request');
  });

  it('should create unauthorized error', () => {
    const error = ErrorFactory.unauthorized();

    expect(error.statusCode).toBe(401);
    expect(error.code).toBe(ErrorCodes.UNAUTHORIZED);
  });

  it('should create forbidden error', () => {
    const error = ErrorFactory.forbidden();

    expect(error.statusCode).toBe(403);
    expect(error.code).toBe(ErrorCodes.FORBIDDEN);
  });

  it('should create notFound error with resource', () => {
    const error = ErrorFactory.notFound('User');

    expect(error.statusCode).toBe(404);
    expect(error.code).toBe(ErrorCodes.NOT_FOUND);
    expect(error.message).toBe('User not found');
  });

  it('should create notFound error with resource and ID', () => {
    const error = ErrorFactory.notFound('User', 123);

    expect(error.message).toBe('User with ID 123 not found');
  });

  it('should create conflict error', () => {
    const error = ErrorFactory.conflict('Resource already exists');

    expect(error.statusCode).toBe(409);
    expect(error.code).toBe(ErrorCodes.CONFLICT);
  });

  it('should create validation error', () => {
    const error = ErrorFactory.validation('Invalid email', { field: 'email' });

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
    expect(error.details).toEqual({ field: 'email' });
  });

  it('should create internal server error', () => {
    const error = ErrorFactory.internal();

    expect(error.statusCode).toBe(500);
    expect(error.code).toBe(ErrorCodes.INTERNAL_SERVER_ERROR);
  });

  it('should create database error', () => {
    const error = ErrorFactory.database('Connection failed', true);

    expect(error.statusCode).toBe(500);
    expect(error.code).toBe(ErrorCodes.DATABASE_ERROR);
    expect(error.isCatastrophic).toBe(true);
  });

  it('should create external service error', () => {
    const originalError = new Error('Service timeout');
    const error = ErrorFactory.externalService('PaymentAPI', originalError);

    expect(error.statusCode).toBe(502);
    expect(error.code).toBe(ErrorCodes.EXTERNAL_SERVICE_ERROR);
    expect(error.message).toContain('PaymentAPI');
    expect(error.details).toHaveProperty('originalError', 'Service timeout');
  });
});

describe('isAppError', () => {
  it('should return true for AppError instances', () => {
    const error = new AppError(400, 'TEST', 'Test error');

    expect(isAppError(error)).toBe(true);
  });

  it('should return false for regular Error', () => {
    const error = new Error('Regular error');

    expect(isAppError(error)).toBe(false);
  });

  it('should return false for non-Error values', () => {
    expect(isAppError('string')).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
    expect(isAppError({})).toBe(false);
  });
});

describe('normalizeError', () => {
  it('should return AppError unchanged', () => {
    const appError = new AppError(404, 'NOT_FOUND', 'Not found');

    const normalized = normalizeError(appError);

    expect(normalized).toBe(appError);
  });

  it('should convert regular Error to AppError', () => {
    const regularError = new Error('Something went wrong');

    const normalized = normalizeError(regularError);

    expect(normalized).toBeInstanceOf(AppError);
    expect(normalized.statusCode).toBe(500);
    expect(normalized.code).toBe(ErrorCodes.INTERNAL_SERVER_ERROR);
    expect(normalized.message).toBe('Something went wrong');
    expect(normalized.isCatastrophic).toBe(true);
  });

  it('should convert unknown values to AppError', () => {
    const normalized = normalizeError('unexpected error');

    expect(normalized).toBeInstanceOf(AppError);
    expect(normalized.statusCode).toBe(500);
    expect(normalized.message).toBe('An unknown error occurred');
    expect(normalized.isCatastrophic).toBe(true);
  });

  it('should preserve error details when converting', () => {
    const error = new TypeError('Type mismatch');

    const normalized = normalizeError(error);

    expect(normalized.details).toHaveProperty('originalError', 'TypeError');
    expect(normalized.details).toHaveProperty('stack');
  });
});

describe('Error integration scenarios', () => {
  it('should handle async error propagation', async () => {
    async function failingFunction() {
      throw ErrorFactory.validation('Invalid data');
    }

    await expect(failingFunction()).rejects.toThrow(AppError);
    await expect(failingFunction()).rejects.toMatchObject({
      statusCode: 400,
      code: ErrorCodes.VALIDATION_ERROR,
    });
  });

  it('should serialize correctly for API responses', () => {
    const error = ErrorFactory.notFound('Article', 'abc123');

    const response = {
      success: false,
      ...error.toJSON(),
    };

    expect(response).toEqual({
      success: false,
      error: {
        code: ErrorCodes.NOT_FOUND,
        message: 'Article with ID abc123 not found',
        statusCode: 404,
      },
    });
  });

  it('should serialize correctly for logging', () => {
    const error = ErrorFactory.database('Connection pool exhausted', true);

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      ...error.toLogFormat(),
    };

    expect(logEntry).toHaveProperty('errorCode', ErrorCodes.DATABASE_ERROR);
    expect(logEntry).toHaveProperty('isCatastrophic', true);
    expect(logEntry).toHaveProperty('timestamp');
  });
});
