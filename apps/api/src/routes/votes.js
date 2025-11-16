import express from 'express';

import { authenticate } from '../auth/auth.middleware.ts';
import logger from '../logger.js';
import { getDatabase } from '../modules/stores/index.js';
// Use local CJS shim for shared schemas in test/runtime
import { CreateVoteSchema } from '../utils/shared-shim.js';

const router = express.Router();

// Conditional auth bypass for test env unless FORCE_AUTH=1 is set
const requireAuth = (req, res, next) => {
  if (process.env.NODE_ENV === 'test' && process.env.FORCE_AUTH !== '1') {
    return next();
  }
  return authenticate(req, res, next);
};

router.post('/votes', requireAuth, async (req, res) => {
  try {
    const input = CreateVoteSchema.parse(req.body);
    const db = getDatabase();

    // Check if user has already voted on this bill
    const existingVotes = await db.votes.getByBillId(input.billId);
    const alreadyVoted = existingVotes.some(vote => vote.userId === input.userId);

    if (alreadyVoted) {
      return res.status(400).json({ error: 'User has already voted on this bill' });
    }

    const vote = await db.votes.create(input);
    res.status(201).json(vote);
  } catch (error) {
    logger.error('POST /votes failed', { error });
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    const message = error instanceof Error ? error.message : 'Invalid request';
    res.status(400).json({ error: message });
  }
});

router.get('/bills/:id/votes', requireAuth, async (req, res) => {
  try {
    const db = getDatabase();
    const votes = await db.votes.getByBillId(req.params.id);
    res.set('Cache-Control', 'public, max-age=120');
    res.json(votes);
  } catch (error) {
    logger.error('GET /bills/:id/votes failed', { error, id: req.params.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/bills/:id/vote-counts', requireAuth, async (req, res) => {
  try {
    const db = getDatabase();
    const counts = await db.votes.getVoteCounts(req.params.id);
    res.set('Cache-Control', 'public, max-age=120');
    res.json(counts);
  } catch (error) {
    logger.error('GET /bills/:id/vote-counts failed', { error, id: req.params.id });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
