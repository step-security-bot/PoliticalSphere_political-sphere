import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to add request ID for correlation and tracing
 * Adds a unique request ID to each request for tracking through the system
 */
const requestId = (req: Request, res: Response, next: NextFunction): void => {
  // Check for existing request ID from upstream services
  const existingId =
    req.headers['x-request-id'] || req.headers['x-correlation-id'] || req.headers['request-id'];

  // Generate new ID if none exists
  const requestIdValue = existingId || uuidv4();

  // Add to request object
  (req as any).requestId = requestIdValue;

  // Add to response headers for client visibility
  res.setHeader('x-request-id', requestIdValue);

  next();
};

export default requestId;
