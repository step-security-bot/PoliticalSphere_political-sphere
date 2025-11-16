/**
 * Parliament Routes
 * Handles parliamentary chamber management, debates, and procedures
 */

import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const CreateChamberSchema = z.object({
  gameId: z.string().uuid(),
  type: z.enum(['commons', 'lords']),
  name: z.string().min(1).max(200),
  maxSeats: z.number().int().min(1).max(1000),
  quorumPercentage: z.number().min(0).max(100).default(50),
});

const CreateMotionSchema = z.object({
  gameId: z.string().uuid(),
  chamberId: z.string().uuid(),
  proposerId: z.string().uuid(),
  type: z.enum(['debate', 'vote', 'amendment', 'procedural']),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
});

const ScheduleDebateSchema = z.object({
  motionId: z.string().uuid(),
  startTime: z.string().datetime(),
  duration: z.number().int().min(60).max(7200), // 1 min to 2 hours
  speakingOrder: z.array(z.string().uuid()).optional(),
  timePerSpeaker: z.number().int().min(30).max(600).default(180), // 30s to 10 min
});

const CastVoteSchema = z.object({
  motionId: z.string().uuid(),
  vote: z.enum(['aye', 'no', 'abstain']),
});

// In-memory storage (replace with database in production)
const chambers = new Map();
const motions = new Map();
const debates = new Map();
const votes = new Map();

/**
 * Create a new parliamentary chamber
 * POST /api/parliament/chambers
 */
router.post('/chambers', async (req, res) => {
  try {
    const validated = CreateChamberSchema.parse(req.body);

    const chamberId = `chamber-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const chamber = {
      id: chamberId,
      ...validated,
      seats: [],
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    chambers.set(chamberId, chamber);

    res.status(201).json({
      success: true,
      data: chamber,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create chamber',
      message: error.message,
    });
  }
});

/**
 * Get chamber by ID
 * GET /api/parliament/chambers/:id
 */
router.get('/chambers/:id', (req, res) => {
  const chamber = chambers.get(req.params.id);

  if (!chamber) {
    return res.status(404).json({
      success: false,
      error: 'Chamber not found',
    });
  }

  res.json({
    success: true,
    data: chamber,
  });
});

/**
 * List all chambers for a game
 * GET /api/parliament/chambers?gameId=xxx
 */
router.get('/chambers', (req, res) => {
  const { gameId } = req.query;

  if (!gameId) {
    return res.status(400).json({
      success: false,
      error: 'gameId query parameter required',
    });
  }

  const gameChambers = Array.from(chambers.values()).filter(c => c.gameId === gameId);

  res.json({
    success: true,
    data: gameChambers,
  });
});

/**
 * Create a motion
 * POST /api/parliament/motions
 */
router.post('/motions', async (req, res) => {
  try {
    const validated = CreateMotionSchema.parse(req.body);

    // Verify chamber exists
    const chamber = chambers.get(validated.chamberId);
    if (!chamber) {
      return res.status(404).json({
        success: false,
        error: 'Chamber not found',
      });
    }

    const motionId = `motion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const motion = {
      id: motionId,
      ...validated,
      status: 'proposed',
      createdAt: new Date().toISOString(),
      votingStarted: null,
      votingEnded: null,
      result: null,
    };

    motions.set(motionId, motion);

    res.status(201).json({
      success: true,
      data: motion,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create motion',
      message: error.message,
    });
  }
});

/**
 * Get motion by ID
 * GET /api/parliament/motions/:id
 */
router.get('/motions/:id', (req, res) => {
  const motion = motions.get(req.params.id);

  if (!motion) {
    return res.status(404).json({
      success: false,
      error: 'Motion not found',
    });
  }

  res.json({
    success: true,
    data: motion,
  });
});

/**
 * List motions for a chamber
 * GET /api/parliament/motions?chamberId=xxx
 */
router.get('/motions', (req, res) => {
  const { chamberId, gameId } = req.query;

  let filtered = Array.from(motions.values());

  if (chamberId) {
    filtered = filtered.filter(m => m.chamberId === chamberId);
  }

  if (gameId) {
    filtered = filtered.filter(m => m.gameId === gameId);
  }

  res.json({
    success: true,
    data: filtered,
  });
});

/**
 * Schedule a debate
 * POST /api/parliament/debates
 */
router.post('/debates', async (req, res) => {
  try {
    const validated = ScheduleDebateSchema.parse(req.body);

    // Verify motion exists
    const motion = motions.get(validated.motionId);
    if (!motion) {
      return res.status(404).json({
        success: false,
        error: 'Motion not found',
      });
    }

    if (motion.status !== 'proposed') {
      return res.status(400).json({
        success: false,
        error: 'Motion must be in proposed status to schedule debate',
      });
    }

    const debateId = `debate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const debate = {
      id: debateId,
      ...validated,
      status: 'scheduled',
      currentSpeakerIndex: 0,
      speeches: [],
      createdAt: new Date().toISOString(),
    };

    debates.set(debateId, debate);

    // Update motion status
    motion.status = 'debate';
    motion.debateId = debateId;

    res.status(201).json({
      success: true,
      data: debate,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to schedule debate',
      message: error.message,
    });
  }
});

/**
 * Get debate by ID
 * GET /api/parliament/debates/:id
 */
router.get('/debates/:id', (req, res) => {
  const debate = debates.get(req.params.id);

  if (!debate) {
    return res.status(404).json({
      success: false,
      error: 'Debate not found',
    });
  }

  res.json({
    success: true,
    data: debate,
  });
});

/**
 * Cast a vote on a motion
 * POST /api/parliament/votes
 */
router.post('/votes', async (req, res) => {
  try {
    const validated = CastVoteSchema.parse(req.body);
    const userId = req.user?.id || req.body.userId; // Get from auth or body

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Verify motion exists and is in voting status
    const motion = motions.get(validated.motionId);
    if (!motion) {
      return res.status(404).json({
        success: false,
        error: 'Motion not found',
      });
    }

    if (motion.status !== 'voting') {
      return res.status(400).json({
        success: false,
        error: 'Motion is not currently open for voting',
      });
    }

    // Check if user already voted
    const existingVote = Array.from(votes.values()).find(
      v => v.motionId === validated.motionId && v.userId === userId
    );

    if (existingVote) {
      return res.status(400).json({
        success: false,
        error: 'You have already voted on this motion',
      });
    }

    const voteId = `vote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const vote = {
      id: voteId,
      ...validated,
      userId,
      createdAt: new Date().toISOString(),
    };

    votes.set(voteId, vote);

    res.status(201).json({
      success: true,
      data: vote,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to cast vote',
      message: error.message,
    });
  }
});

/**
 * Get vote results for a motion
 * GET /api/parliament/votes/results/:motionId
 */
router.get('/votes/results/:motionId', (req, res) => {
  const motionVotes = Array.from(votes.values()).filter(v => v.motionId === req.params.motionId);

  const results = {
    total: motionVotes.length,
    aye: motionVotes.filter(v => v.vote === 'aye').length,
    no: motionVotes.filter(v => v.vote === 'no').length,
    abstain: motionVotes.filter(v => v.vote === 'abstain').length,
  };

  res.json({
    success: true,
    data: results,
  });
});

/**
 * Start voting on a motion
 * POST /api/parliament/motions/:id/start-voting
 */
router.post('/motions/:id/start-voting', (req, res) => {
  const motion = motions.get(req.params.id);

  if (!motion) {
    return res.status(404).json({
      success: false,
      error: 'Motion not found',
    });
  }

  if (motion.status !== 'debate') {
    return res.status(400).json({
      success: false,
      error: 'Motion must complete debate before voting',
    });
  }

  motion.status = 'voting';
  motion.votingStarted = new Date().toISOString();

  res.json({
    success: true,
    data: motion,
  });
});

/**
 * Close voting on a motion
 * POST /api/parliament/motions/:id/close-voting
 */
router.post('/motions/:id/close-voting', (req, res) => {
  const motion = motions.get(req.params.id);

  if (!motion) {
    return res.status(404).json({
      success: false,
      error: 'Motion not found',
    });
  }

  if (motion.status !== 'voting') {
    return res.status(400).json({
      success: false,
      error: 'Motion is not currently in voting',
    });
  }

  // Calculate results
  const motionVotes = Array.from(votes.values()).filter(v => v.motionId === motion.id);

  const ayes = motionVotes.filter(v => v.vote === 'aye').length;
  const noes = motionVotes.filter(v => v.vote === 'no').length;

  motion.status = 'completed';
  motion.votingEnded = new Date().toISOString();
  motion.result = ayes > noes ? 'passed' : 'failed';

  res.json({
    success: true,
    data: motion,
  });
});

export default router;
