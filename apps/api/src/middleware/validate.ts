/**
 * Validation Middleware
 * Validates request data against Zod schemas
 */

import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

/**
 * Validation middleware factory
 * @param schema - Zod schema to validate against
 * @param source - Where to get data from ('body', 'query', 'params')
 * @returns Express middleware function
 */
/**
 * Factory that returns middleware validating a single request source against a Zod schema.
 *
 * Example: `validate(CreateUserSchema, 'body')` will parse and attach validated
 * data to `req.validated` or return a 400 with validation errors.
 */
export const validate =
  (schema: z.ZodSchema, source: 'body' | 'query' | 'params' = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = (req as any)[source];
      (req as any).validated = schema.parse(data);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        });
        return;
      }
      next(error);
    }
  };

/**
 * Validate multiple sources
 * @param schemas - Object with schemas for different sources
 * @returns Express middleware function
 */
export const validateMultiple =
  (schemas: Record<string, z.ZodSchema>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      (req as any).validated = {};

      for (const [source, schema] of Object.entries(schemas)) {
        if (schema) {
          (req as any).validated[source] = schema.parse((req as any)[source]);
        }
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        });
        return;
      }
      next(error);
    }
  };
