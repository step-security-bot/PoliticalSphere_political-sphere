import express from 'express';

import { authenticate } from '../auth/auth.middleware.ts';
import logger from '../logger.js';
import { getDatabase } from '../modules/stores/index.js';
// Use local CJS shim for shared schemas in test/runtime
import { CreateBillSchema, UpdateBillSchema } from '../utils/shared-shim.js';

const router = express.Router();

// Conditional auth bypass for test env unless FORCE_AUTH=1 is set
const requireAuth = (req, res, next) => {
  if (process.env.NODE_ENV === 'test' && process.env.FORCE_AUTH !== '1') {
    return next();
  }
  return authenticate(req, res, next);
};

router.post('/bills', requireAuth, async (req, res) => {
  try {
    const input = CreateBillSchema.parse(req.body);
    const db = getDatabase();

    // Validate proposer exists
    const proposer = await db.users.getById(input.proposerId);
    if (!proposer) {
      return res.status(400).json({ error: 'Proposer not found' });
    }

    const bill = await db.bills.create(input);
    res.status(201).json(bill);
  } catch (error) {
    logger.error('POST /bills failed', { error });
    const message = error instanceof Error ? error.message : 'Invalid request';
    res.status(400).json({ error: message });
  }
});

router.get('/bills/:id', requireAuth, async (req, res) => {
  try {
    const db = getDatabase();
    const bill = await db.bills.getById(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.set('Cache-Control', 'public, max-age=300');
    res.json(bill);
  } catch (error) {
    logger.error('GET /bills/:id failed', { error, id: req.params.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/bills', requireAuth, async (req, res) => {
  try {
    const db = getDatabase();
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 10, 100);
    const result = await db.bills.getAll(page, limit);
    res.set('Cache-Control', 'public, max-age=60');
    if (result && Array.isArray(result.bills)) {
      return res.json(result.bills);
    }
    res.json(result);
  } catch (error) {
    logger.error('GET /bills failed', { error, query: req.query });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/bills/:id', requireAuth, async (req, res) => {
  try {
    const input = UpdateBillSchema.parse(req.body);
    const db = getDatabase();

    // Check if bill exists
    const existingBill = await db.bills.getById(req.params.id);
    if (!existingBill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const updatedBill = await db.bills.update(req.params.id, input);
    res.json(updatedBill);
  } catch (error) {
    logger.error('PUT /bills/:id failed', { error, id: req.params.id });
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

export default router;
