import { describe, it, expect } from 'vitest';
import { AppError, ErrorCodes, HttpStatus, createError } from './AppError';

describe('AppError', () => {
  it('should create an AppError with correct properties', () => {
    const error = new AppError(404, 'NOT_FOUND', 'User not found', false);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('User not found');
    expect(error.isCatastrophic).toBe(false);
    expect(error.name).toBe('AppError');
  });

  it('should create a catastrophic error', () => {
    const error = new AppError(500, 'INTERNAL_ERROR', 'Database failure', true);

    expect(error.isCatastrophic).toBe(true);
  });

  it('should have proper stack trace', () => {
    const error = new AppError(400, 'VALIDATION_FAILED', 'Invalid input');

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('AppError');
  });
});

describe('createError factory', () => {
  it('should create unauthorized error', () => {
    const error = createError.unauthorized();

    expect(error.statusCode).toBe(HttpStatus.UNAUTHORIZED);
    expect(error.code).toBe(ErrorCodes.UNAUTHORIZED);
    expect(error.message).toBe('Unauthorized access');
  });

  it('should create not found error', () => {
    const error = createError.notFound('Document');

    expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(error.code).toBe(ErrorCodes.NOT_FOUND);
    expect(error.message).toBe('Document not found');
  });

  it('should create validation failed error', () => {
    const error = createError.validationFailed('Email is required');

    expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(error.code).toBe(ErrorCodes.VALIDATION_FAILED);
    expect(error.message).toBe('Email is required');
  });

  it('should create internal error as catastrophic', () => {
    const error = createError.internalError();

    expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(error.code).toBe(ErrorCodes.INTERNAL_ERROR);
    expect(error.isCatastrophic).toBe(true);
  });
});

describe('ErrorCodes and HttpStatus', () => {
  it('should export all error codes', () => {
    expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
  });

  it('should export all HTTP status codes', () => {
    expect(HttpStatus.OK).toBe(200);
    expect(HttpStatus.NOT_FOUND).toBe(404);
    expect(HttpStatus.INTERNAL_SERVER_ERROR).toBe(500);
  });
});
