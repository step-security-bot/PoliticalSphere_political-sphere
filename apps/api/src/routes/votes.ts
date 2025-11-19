import express from 'express';
import type { Request, Response, NextFunction } from 'express';

import { authenticate } from '../auth/auth.middleware.ts';
import logger from '../logger.js';
import { getDatabase } from '../stores/index.js';
// Use local CJS shim for shared schemas in test/runtime
import { CreateVoteSchema } from '../utils/shared-shim.js';

const router = express.Router();

// Conditional auth bypass for test env unless FORCE_AUTH=1 is set
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'test' && process.env.FORCE_AUTH !== '1') {
    return next();
  }
  return authenticate(req, res, next);
};

router.post('/votes', requireAuth, async (req: Request, res: Response) => {
  try {
    const input = CreateVoteSchema.parse(req.body);
    const db = getDatabase();

    // Check if user has already voted on this bill
    const existingVotes = (await db.votes.getByBillId(input.billId)) as Array<{ userId: string }>;
    const alreadyVoted = existingVotes.some(
      (vote: { userId: string }) => vote.userId === input.userId,
    );

    if (alreadyVoted) {
      return res.status(400).json({ error: 'User has already voted on this bill' });
    }

    const vote = await db.votes.create(input);
    return res.status(201).json(vote);
  } catch (error: unknown) {
    logger.error('POST /votes failed', { error });
    const err = error as {
      name?: string;
      errors?: Array<{ path: (string | number)[]; message: string }>;
      message?: string;
    };
    if (err?.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: err.errors?.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    const message = typeof err?.message === 'string' ? err.message : 'Invalid request';
    return res.status(400).json({ error: message });
  }
});

router.get('/bills/:id/votes', requireAuth, async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const votes = await db.votes.getByBillId(req.params.id);
    res.set('Cache-Control', 'public, max-age=120');
    return res.json(votes);
  } catch (error) {
    logger.error('GET /bills/:id/votes failed', { error, id: req.params.id });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/bills/:id/vote-counts', requireAuth, async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const counts = await db.votes.getVoteCounts(req.params.id);
    res.set('Cache-Control', 'public, max-age=120');
    return res.json(counts);
  } catch (error) {
    logger.error('GET /bills/:id/vote-counts failed', { error, id: req.params.id });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
