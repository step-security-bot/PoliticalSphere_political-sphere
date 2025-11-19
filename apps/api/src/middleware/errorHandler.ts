/**
 * Error Handling Middleware
 * Centralized error handling for consistent error responses
 */

import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param fn - Async route handler function
 * @returns Express middleware function
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/**
 * Global error handler middleware
 * Handles all errors and sends appropriate responses
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    requestId: (req as any).requestId,
  });

  // Zod validation errors
  if (err instanceof z.ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Custom API errors
  if ((err as any).statusCode) {
    res.status((err as any).statusCode).json({
      success: false,
      error: err.message,
      ...((err as any).details && { details: (err as any).details }),
    });
    return;
  }

  // Default server error
  const statusCode = (err as any).status || 500;
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  statusCode: number;
  details: any;

  constructor(message: string, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Resource not found',
    path: req.url,
  });
};
