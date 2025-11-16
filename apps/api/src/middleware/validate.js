/**
 * Validation Middleware
 * Validates request data against Zod schemas
 */

import { z } from 'zod';

/**
 * Validation middleware factory
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {string} source - Where to get data from ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
  try {
    const data = req[source];
    req.validated = schema.parse(data);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })),
      });
    }
    next(error);
  }
};

/**
 * Validate multiple sources
 * @param {Object} schemas - Object with schemas for different sources
 * @returns {Function} Express middleware function
 */
export const validateMultiple = (schemas) => (req, res, next) => {
  try {
    req.validated = {};
    
    for (const [source, schema] of Object.entries(schemas)) {
      if (schema) {
        req.validated[source] = schema.parse(req[source]);
      }
    }
    
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })),
      });
    }
    next(error);
  }
};
