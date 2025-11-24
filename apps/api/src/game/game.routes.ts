/**
 * Game Routes
 * Handles /game endpoints - consolidated from game-server
 */

import { Router } from 'express';

import type { AuthRequest } from '../auth/auth.middleware.ts';
import { authenticate } from '../auth/auth.middleware.ts';
import { applyAgeRestrictions } from '../middleware/ageVerification.middleware.ts';

import { gameService } from './game.service.ts';

const router = Router();

// All game routes require authentication
router.use(authenticate);

// Apply age restrictions to all game routes
router.use(applyAgeRestrictions);

/**
 * POST /game/create
 * Create a new game
 */
router.post('/create', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { name } = req.body;
    const game = gameService.createGame(req.user.userId, req.user.username, name);

    res.status(201).json({ game });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create game';
    res.status(400).json({ error: message });
  }
});

/**
 * GET /game/list
 * List all games
 */
router.get('/list', async (_req: AuthRequest, res) => {
  try {
    const games = gameService.listGames();
    res.json({ games });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to list games';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /game/my-games
 * Get games for current player
 */
router.get('/my-games', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const games = gameService.getPlayerGames(req.user.userId);
    res.json({ games });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get games';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /game/:gameId
 * Get game details
 */
router.get('/:gameId', async (req: AuthRequest, res) => {
  try {
    const { gameId } = req.params;
    if (!gameId) {
      res.status(400).json({ error: 'Game ID is required' });
      return;
    }

    const game = gameService.getGame(gameId);

    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }

    res.json({ game });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get game';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /game/:gameId/join
 * Join an existing game
 */
router.post('/:gameId/join', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { gameId } = req.params;
    if (!gameId) {
      res.status(400).json({ error: 'Game ID is required' });
      return;
    }

    const game = gameService.joinGame(gameId, req.user.userId, req.user.username);

    res.json({ game });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to join game';
    res.status(400).json({ error: message });
  }
});

/**
 * POST /game/:gameId/start
 * Start a game
 */
router.post('/:gameId/start', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { gameId } = req.params;
    if (!gameId) {
      res.status(400).json({ error: 'Game ID is required' });
      return;
    }

    const game = gameService.startGame(gameId, req.user.userId);

    res.json({ game });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to start game';
    res.status(400).json({ error: message });
  }
});

/**
 * POST /game/:gameId/action
 * Process a game action
 */
router.post('/:gameId/action', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { gameId } = req.params;
    if (!gameId) {
      res.status(400).json({ error: 'Game ID is required' });
      return;
    }

    const { type, payload } = req.body;

    if (!type) {
      res.status(400).json({ error: 'Action type is required' });
      return;
    }

    const action = {
      type,
      playerId: req.user.userId,
      payload: payload || {},
    };

    const game = gameService.processAction(gameId, action);

    res.json({ game });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process action';
    res.status(400).json({ error: message });
  }
});

/**
 * DELETE /game/:gameId
 * Delete a game
 */
router.delete('/:gameId', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { gameId } = req.params;
    if (!gameId) {
      res.status(400).json({ error: 'Game ID is required' });
      return;
    }

    gameService.deleteGame(gameId, req.user.userId);

    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete game';
    res.status(400).json({ error: message });
  }
});

/**
 * GET /game/:gameId/flags
 * List flagged proposals for a game (moderator view)
 */
router.get('/:gameId/flags', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { gameId } = req.params;
    if (!gameId) {
      res.status(400).json({ error: 'Game ID is required' });
      return;
    }

    const flagged = gameService.getFlaggedProposals(gameId);
    res.json({ flagged });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get flagged proposals';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /game/:gameId/flags/:proposalId/review
 * Moderate a flagged proposal
 */
router.post('/:gameId/flags/:proposalId/review', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { gameId, proposalId } = req.params;
    if (!gameId) {
      res.status(400).json({ error: 'Game ID is required' });
      return;
    }
    if (!proposalId) {
      res.status(400).json({ error: 'Proposal ID is required' });
      return;
    }

    const { action, note } = req.body as { action?: string; note?: string };
    if (!action || !['approve', 'reject'].includes(action)) {
      res.status(400).json({ error: 'Action must be "approve" or "reject"' });
      return;
    }

    const proposal = gameService.reviewFlaggedProposal(
      gameId,
      proposalId,
      req.user.userId,
      action as 'approve' | 'reject',
      note
    );

    res.json({ proposal });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to review proposal';
    res.status(400).json({ error: message });
  }
});

/**
 * Default `express.Router` for game-related endpoints.
 *
 * Routes cover game lifecycle operations, proposals, debates and moderator actions.
 */
export default router;
