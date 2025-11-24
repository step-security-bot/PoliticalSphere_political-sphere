import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

import { authenticate } from '../auth/auth.middleware.ts';
import logger from '../logger.js';
import { getDatabase } from '../stores/index.js';
import {
  CreateBillSchema,
  UpdateBillSchema,
  parsePaginationQuery,
  createPaginatedResponse,
  getOffset,
} from '@political-sphere/shared';

/**
 * Express router for bill-related endpoints.
 * Handles CRUD operations for legislative bills including creation, retrieval, updating, and deletion.
 * All endpoints require authentication except where conditionally bypassed in test environment.
 */
const router = express.Router();

/**
 * Authentication middleware that conditionally bypasses auth in test environment.
 * In production and non-test environments, requires authentication.
 * Can be forced on in tests by setting FORCE_AUTH=1.
 */
const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'test' && process.env.FORCE_AUTH !== '1') {
    next();
    return;
  }
  authenticate(req, res, next);
};

/**
 * POST /bills - Create a new bill
 * Requires authentication and validates that the proposer exists.
 */
router.post('/bills', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const input = CreateBillSchema.parse(req.body);
    const db = getDatabase();

    // Validate proposer exists
    const proposer = await db.users.getById(input.proposerId);
    if (!proposer) {
      res.status(400).json({ error: 'Proposer not found' });
      return;
    }

    const bill = await db.bills.create(input);
    res.status(201).json(bill);
  } catch (error) {
    logger.error('POST /bills failed', { error });
    const message = error instanceof Error ? error.message : 'Invalid request';
    res.status(400).json({ error: message });
  }
});

/**
 * GET /bills/:id - Retrieve a specific bill by ID
 * Requires authentication and returns 404 if bill doesn't exist.
 */
router.get('/bills/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase();
    const bill = await db.bills.getById(req.params.id);
    if (!bill) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }
    res.set('Cache-Control', 'public, max-age=300');
    res.json(bill);
  } catch (error) {
    logger.error('GET /bills/:id failed', { error, id: req.params.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/bills', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase();
    const paginationOptions = parsePaginationQuery(req.query);

    // Get total count for pagination
    const total = await db.bills.getCount();
    const offset = getOffset(paginationOptions);

    // Get paginated results
    const { limit = 10 } = paginationOptions;
    const bills = await db.bills.getPaginated(limit, offset);

    const result = createPaginatedResponse(bills, total, paginationOptions);
    res.set('Cache-Control', 'public, max-age=60');
    res.json(result);
  } catch (error) {
    logger.error('GET /bills failed', { error, query: req.query });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/bills/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const input = UpdateBillSchema.parse(req.body);
    const db = getDatabase();

    // Check if bill exists
    const existingBill = await db.bills.getById(req.params.id);
    if (!existingBill) {
      res.status(404).json({ error: 'Bill not found' });
      return;
    }

    const updatedBill = await db.bills.update(req.params.id, input);
    res.json(updatedBill);
  } catch (error) {
    logger.error('PUT /bills/:id failed', { error, id: req.params.id });
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path?.join('.'),
          message: e.message,
        })),
      });
      return;
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

/**
 * Bills router: create, retrieve, list and update bills. Endpoints enforce
 * authentication and provide pagination helper integration for list
 * operations. Responses include appropriate cache headers for read paths.
 */
/**
 * Bills router
 *
 * Exposes endpoints to create, retrieve, list and update bills. Endpoints
 * enforce authentication and integrate pagination helpers. Read endpoints set
 * cache headers to improve response performance for clients.
 */
export default router;
