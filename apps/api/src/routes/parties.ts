import express from 'express';
import type { Request, Response, NextFunction } from 'express';

import { authenticate } from '../auth/auth.middleware.ts';
import { PartyService } from '../domain/party-service.ts';
import logger from '../logger.js';
import { getDatabase } from '../stores/index.js';
import { CreatePartySchema, UpdatePartySchema } from '../utils/shared-shim.js';

const router = express.Router();

// Conditional auth bypass for test env unless FORCE_AUTH=1 is set
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'test' && process.env.FORCE_AUTH !== '1') {
    return next();
  }
  return authenticate(req, res, next);
};

function getPartyStore() {
  return getDatabase().parties;
}

type PartyStoreExtras = {
  update: (id: string, updates: unknown) => Promise<unknown>;
  delete: (id: string) => Promise<boolean>;
};

// GET /parties - Get all parties (requires authentication)
router.get('/parties', requireAuth, async (_req: Request, res: Response) => {
  try {
    const store = getPartyStore();
    const { parties } = await store.getAll();
    res.json({ parties });
  } catch (error) {
    logger.error('GET /parties failed', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /parties/:id - Get party by ID (requires authentication)
router.get('/parties/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const store = getPartyStore();
    const party = await store.getById(req.params.id);
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }
    return res.json({ party });
  } catch (error) {
    logger.error('GET /parties/:id failed', { error, id: req.params.id });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /parties - Create new party (requires authentication)
router.post('/parties', requireAuth, async (req: Request, res: Response) => {
  try {
    // Validate input early; parse will throw ZodError with .issues
    const input = CreatePartySchema.parse(req.body);

    // Use service to enforce duplicate name check before hitting DB constraint
    const partyService = new PartyService();
    const party = await partyService.createParty(input);
    return res.status(201).json({ success: true, data: party });
  } catch (error: unknown) {
    const err = error as { message?: string; issues?: unknown };
    const message = err?.message || 'Invalid input';
    // Treat validation and duplicate errors as 400
    if (
      err?.issues ||
      message.includes('Invalid') ||
      message.includes('exists') ||
      message.includes('Missing required field')
    ) {
      return res.status(400).json({
        success: false,
        error: message,
        details: err?.issues,
      });
    }
    logger.error('POST /parties failed', { error });
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// PUT /parties/:id - Update party (requires authentication)
router.put('/parties/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Party ID is required' });
    }

    // Validate input with UpdatePartySchema
    const validated = UpdatePartySchema.parse(req.body);

    const store = getPartyStore() as unknown as PartyStoreExtras;
    const party = await store.update(id, validated);
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }
    return res.json({ party });
  } catch (error: unknown) {
    const err = error as { issues?: Array<{ path: (string | number)[]; message: string }> };
    // Handle Zod validation errors
    if (err?.issues) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: err.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    logger.error('PUT /parties/:id failed', { error, id: req.params.id });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /parties/:id - Delete party (requires authentication)
router.delete('/parties/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Party ID is required' });
    }

    const store = getPartyStore() as unknown as PartyStoreExtras;
    const deleted = await store.delete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Party not found' });
    }
    return res.json({ success: true });
  } catch (error) {
    logger.error('DELETE /parties/:id failed', { error, id: req.params.id });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Parties router: endpoints for creating, listing and managing political
 * parties used in simulations and governance flows.
 */
export default router;
