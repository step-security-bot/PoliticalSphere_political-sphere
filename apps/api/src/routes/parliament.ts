/**
 * Parliament Routes
 * Handles parliamentary chamber management, debates, and procedures
 */

import express from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { ParliamentService } from '../domain/parliament-service.ts';
// Do not import AuthRequest to keep handler signatures compatible with express types

const router = express.Router();

// Validation schemas

/**
 * Zod schema for validating chamber creation input.
 * Defines the structure for creating new parliamentary chambers.
 */
const CreateChamberSchema = z.object({
  gameId: z.string().uuid(),
  type: z.enum(['commons', 'lords']),
  name: z.string().min(1).max(200),
  maxSeats: z.number().int().min(1).max(1000),
  quorumPercentage: z.number().min(0).max(100).default(50),
});

/**
 * Zod schema for validating motion creation input.
 * Defines the structure for creating parliamentary motions and proposals.
 */
const CreateMotionSchema = z.object({
  gameId: z.string().uuid().optional(),
  chamberId: z.string().uuid(),
  proposerId: z.string().uuid(),
  type: z.enum(['debate', 'vote', 'amendment', 'procedural']),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
});

/**
 * Zod schema for validating debate scheduling input.
 * Defines the structure for scheduling parliamentary debates.
 */
const ScheduleDebateSchema = z.object({
  motionId: z.string().uuid(),
  startTime: z.string().datetime(),
  duration: z.number().int().min(60).max(7200), // 1 min to 2 hours
  speakingOrder: z.array(z.string().uuid()).optional(),
  timePerSpeaker: z.number().int().min(30).max(600).default(180), // 30s to 10 min
});

/**
 * Zod schema for validating vote casting input.
 * Defines the structure for casting votes on parliamentary motions.
 */
const CastVoteSchema = z.object({
  motionId: z.string().uuid(),
  vote: z.enum(['aye', 'no', 'abstain']),
});

// Parliament service instance
const parliamentService = new ParliamentService();

/**
 * Create a new parliamentary chamber
 * POST /api/parliament/chambers
 *
 * @route POST /api/parliament/chambers
 * @param {CreateChamberSchema} req.body - Chamber creation data
 * @returns 201 with the created Chamber
 */
router.post('/chambers', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = CreateChamberSchema.parse(req.body);

    const chamber = await parliamentService.createChamber({
      gameId: validated.gameId,
      type: validated.type,
      name: validated.name,
      maxSeats: validated.maxSeats,
      quorumPercentage: validated.quorumPercentage,
    });

    res.status(201).json({
      success: true,
      data: chamber,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create chamber',
      message: (error as Error).message,
    });
  }
});

/**
 * Get chamber by ID
 * GET /api/parliament/chambers/:id
 *
 * @route GET /api/parliament/chambers/:id
 * @param {string} id.path - Chamber ID
 * @returns 200 with Chamber or 404 if not found
 */
router.get('/chambers/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const chamberId = req.params.id;
    if (!chamberId) {
      res.status(400).json({
        success: false,
        error: 'Chamber ID required',
      });
      return;
    }

    const chamber = await parliamentService.getChamber(chamberId);

    if (!chamber) {
      res.status(404).json({
        success: false,
        error: 'Chamber not found',
      });
      return;
    }

    res.json({
      success: true,
      data: chamber,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get chamber',
      message: (error as Error).message,
    });
  }
});

/**
 * List all chambers for a game
 * GET /api/parliament/chambers?gameId=xxx
 *
 * @route GET /api/parliament/chambers
 * @param {string} [gameId.query] - Optional game ID filter
 * @returns 200 with array of Chambers
 */
router.get('/chambers', async (req: Request, res: Response): Promise<void> => {
  try {
    const { gameId } = req.query;

    // Default to demo game for single-world mode
    const targetGameId = gameId && typeof gameId === 'string' ? gameId : 'game-demo-1';

    const gameChambers = await parliamentService.listChambers(targetGameId);

    res.json({
      success: true,
      data: gameChambers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to list chambers',
      message: (error as Error).message,
    });
  }
});

/**
 * Create a motion
 * POST /api/parliament/motions
 *
 * @route POST /api/parliament/motions
 * @param {CreateMotionSchema} req.body - Motion details
 * @returns 201 with created Motion
 */
router.post('/motions', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = CreateMotionSchema.parse(req.body);

    const motion = await parliamentService.createMotion({
      gameId: validated.gameId || 'game-demo-1',
      chamberId: validated.chamberId,
      proposerId: validated.proposerId,
      type: validated.type,
      title: validated.title,
      description: validated.description,
    });

    res.status(201).json({
      success: true,
      data: motion,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create motion',
      message: (error as Error).message,
    });
  }
});

/**
 * Get motion by ID
 * GET /api/parliament/motions/:id
 *
 * @route GET /api/parliament/motions/:id
 * @param {string} id.path - Motion ID
 * @returns 200 with Motion or 404 if not found
 */
router.get('/motions/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const motionId = req.params.id;
    if (!motionId) {
      res.status(400).json({
        success: false,
        error: 'Motion ID required',
      });
      return;
    }

    const motion = await parliamentService.getMotion(motionId);

    if (!motion) {
      res.status(404).json({
        success: false,
        error: 'Motion not found',
      });
      return;
    }

    res.json({
      success: true,
      data: motion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get motion',
      message: (error as Error).message,
    });
  }
});

/**
 * List motions for a chamber
 * GET /api/parliament/motions?chamberId=xxx
 *
 * @route GET /api/parliament/motions
 * @param {string} [chamberId.query] - Optional chamber filter
 * @param {string} [gameId.query] - Optional game filter
 * @returns 200 with array of motions
 */
router.get('/motions', async (req: Request, res: Response) => {
  try {
    const { chamberId, gameId } = req.query;

    const motions = await parliamentService.listMotions({
      gameId: typeof gameId === 'string' ? gameId : undefined,
      chamberId: typeof chamberId === 'string' ? chamberId : undefined,
    });

    res.json({
      success: true,
      data: motions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to list motions',
      message: (error as Error).message,
    });
  }
});

/**
 * Schedule a debate
 * POST /api/parliament/debates
 *
 * @route POST /api/parliament/debates
 * @param {ScheduleDebateSchema} req.body - Debate scheduling details
 * @returns 201 with created Debate
 */
router.post('/debates', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = ScheduleDebateSchema.parse(req.body);

    const debate = await parliamentService.scheduleDebate({
      motionId: validated.motionId,
      startTime: validated.startTime,
      duration: validated.duration,
      speakingOrder: validated.speakingOrder,
      timePerSpeaker: validated.timePerSpeaker,
    });

    res.status(201).json({
      success: true,
      data: debate,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to schedule debate',
      message: (error as Error).message,
    });
  }
});

/**
 * Get debate by ID
 * GET /api/parliament/debates/:id
 *
 * @route GET /api/parliament/debates/:id
 * @param {string} id.path - Debate ID
 * @returns 200 with Debate or 404 if not found
 */
router.get('/debates/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const debateId = req.params.id;
    if (!debateId) {
      res.status(400).json({
        success: false,
        error: 'Debate ID required',
      });
      return;
    }

    const debate = await parliamentService.getDebate(debateId);

    if (!debate) {
      res.status(404).json({
        success: false,
        error: 'Debate not found',
      });
      return;
    }

    res.json({
      success: true,
      data: debate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get debate',
      message: (error as Error).message,
    });
  }
});

/**
 * Cast a vote on a motion
 * POST /api/parliament/votes
 *
 * @route POST /api/parliament/votes
 * @param {CastVoteSchema} req.body - Vote details
 * @returns 201 with recorded vote
 */
router.post('/votes', async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = CastVoteSchema.parse(req.body);
    const currentUser = (req as Request & { user?: { id: string } }).user;
    const userId = currentUser?.id || req.body.userId; // Get from auth or body

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const vote = await parliamentService.castVote({
      motionId: validated.motionId,
      userId,
      vote: validated.vote,
    });

    res.status(201).json({
      success: true,
      data: vote,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Failed to cast vote',
      message: (error as Error).message,
    });
  }
});

/**
 * Get vote results for a motion
 * GET /api/parliament/votes/results/:motionId
 *
 * @route GET /api/parliament/votes/results/:motionId
 * @param {string} motionId.path - Motion ID
 * @returns 200 with vote results
 */
router.get('/votes/results/:motionId', async (req: Request, res: Response): Promise<void> => {
  try {
    const motionId = req.params.motionId;
    if (!motionId) {
      res.status(400).json({
        success: false,
        error: 'Motion ID required',
      });
      return;
    }

    const results = await parliamentService.getVoteResults(motionId);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get vote results',
      message: (error as Error).message,
    });
  }
});

/**
 * Start voting on a motion
 * POST /api/parliament/motions/:id/start-voting
 *
 * @route POST /api/parliament/motions/:id/start-voting
 * @param {string} id.path - Motion ID
 * @returns 200 with updated motion status
 */
router.post('/motions/:id/start-voting', async (req: Request, res: Response): Promise<void> => {
  try {
    const motionId = req.params.id;
    if (!motionId) {
      res.status(400).json({
        success: false,
        error: 'Motion ID required',
      });
      return;
    }

    const motion = await parliamentService.startVoting(motionId);

    res.json({
      success: true,
      data: motion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to start voting',
      message: (error as Error).message,
    });
  }
});

/**
 * Close voting on a motion
 * POST /api/parliament/motions/:id/close-voting
 *
 * @route POST /api/parliament/motions/:id/close-voting
 * @param {string} id.path - Motion ID
 * @returns 200 with updated motion status
 */
router.post('/motions/:id/close-voting', async (req: Request, res: Response): Promise<void> => {
  try {
    const motionId = req.params.id;
    if (!motionId) {
      res.status(400).json({
        success: false,
        error: 'Motion ID required',
      });
      return;
    }

    const motion = await parliamentService.closeVoting(motionId);

    res.json({
      success: true,
      data: motion,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to close voting',
      message: (error as Error).message,
    });
  }
});

/**
 * Parliament routes router: manage chambers, motions, debates and voting
 * lifecycle endpoints.
 */
export default router;
