/**
 * Media Routes
 * Handles press releases, public opinion polls, media coverage, and narratives
 */

import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const PublishPressReleaseSchema = z.object({
  gameId: z.string().uuid(),
  authorId: z.string().uuid(),
  authorType: z.enum(['government', 'party', 'individual', 'organization']),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  category: z.enum(['policy', 'announcement', 'response', 'statement', 'emergency']),
  visibility: z.enum(['public', 'restricted', 'embargoed']).default('public'),
  embargoUntil: z.string().datetime().optional(),
});

const CreatePollSchema = z.object({
  gameId: z.string().uuid(),
  creatorId: z.string().uuid(),
  question: z.string().min(1).max(500),
  options: z.array(z.string().min(1).max(200)).min(2).max(10),
  pollType: z.enum(['approval', 'preference', 'issue', 'election']),
  duration: z.number().int().min(3600).max(604800), // 1 hour to 1 week in seconds
  targetAudience: z.enum(['all', 'voters', 'members', 'specific']).default('all'),
});

const CastPollVoteSchema = z.object({
  pollId: z.string().uuid(),
  optionIndex: z.number().int().min(0),
});

const TrackCoverageSchema = z.object({
  gameId: z.string().uuid(),
  targetType: z.enum(['person', 'party', 'policy', 'event']),
  targetId: z.string().uuid(),
  sentiment: z.enum(['very_negative', 'negative', 'neutral', 'positive', 'very_positive']),
  prominence: z.enum(['minor', 'moderate', 'major', 'headline']),
  source: z.string().min(1).max(100),
  headline: z.string().min(1).max(200),
  summary: z.string().min(1).max(1000).optional(),
});

const TrackNarrativeSchema = z.object({
  gameId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  narrativeType: z.enum(['scandal', 'achievement', 'controversy', 'trend', 'crisis']),
  participants: z.array(z.string().uuid()),
  sentiment: z.enum(['negative', 'neutral', 'positive']),
  virality: z.number().min(0).max(100).default(0),
});

// In-memory storage
const pressReleases = new Map();
const polls = new Map();
const pollVotes = new Map();
const coverage = new Map();
const narratives = new Map();
const approvalRatings = new Map();

/**
 * Publish a press release
 * POST /api/media/press-releases
 */
router.post('/press-releases', async (req, res) => {
  try {
    const validated = PublishPressReleaseSchema.parse(req.body);
    
    const releaseId = `release-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const pressRelease = {
      id: releaseId,
      ...validated,
      publishedAt: new Date().toISOString(),
      views: 0,
      reactions: {
        positive: 0,
        neutral: 0,
        negative: 0,
      },
      status: validated.visibility === 'embargoed' ? 'embargoed' : 'published',
    };
    
    pressReleases.set(releaseId, pressRelease);
    
    res.status(201).json({
      success: true,
      data: pressRelease,
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
      error: 'Failed to publish press release',
      message: error.message,
    });
  }
});

/**
 * Get press release by ID
 * GET /api/media/press-releases/:id
 */
router.get('/press-releases/:id', (req, res) => {
  const pressRelease = pressReleases.get(req.params.id);
  
  if (!pressRelease) {
    return res.status(404).json({
      success: false,
      error: 'Press release not found',
    });
  }
  
  // Increment views
  pressRelease.views += 1;
  
  res.json({
    success: true,
    data: pressRelease,
  });
});

/**
 * List press releases
 * GET /api/media/press-releases?gameId=xxx&authorId=xxx&category=xxx
 */
router.get('/press-releases', (req, res) => {
  const { gameId, authorId, category } = req.query;
  
  if (!gameId) {
    return res.status(400).json({
      success: false,
      error: 'gameId query parameter required',
    });
  }
  
  let filtered = Array.from(pressReleases.values())
    .filter(pr => pr.gameId === gameId && pr.status === 'published');
  
  if (authorId) {
    filtered = filtered.filter(pr => pr.authorId === authorId);
  }
  
  if (category) {
    filtered = filtered.filter(pr => pr.category === category);
  }
  
  // Sort by most recent
  filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  
  res.json({
    success: true,
    data: filtered,
  });
});

/**
 * Create an opinion poll
 * POST /api/media/polls
 */
router.post('/polls', async (req, res) => {
  try {
    const validated = CreatePollSchema.parse(req.body);
    
    const pollId = `poll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const poll = {
      id: pollId,
      ...validated,
      createdAt: new Date().toISOString(),
      closesAt: new Date(Date.now() + validated.duration * 1000).toISOString(),
      status: 'active',
      totalVotes: 0,
      results: validated.options.map(option => ({
        option,
        votes: 0,
        percentage: 0,
      })),
    };
    
    polls.set(pollId, poll);
    
    res.status(201).json({
      success: true,
      data: poll,
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
      error: 'Failed to create poll',
      message: error.message,
    });
  }
});

/**
 * Get poll by ID with results
 * GET /api/media/polls/:id
 */
router.get('/polls/:id', (req, res) => {
  const poll = polls.get(req.params.id);
  
  if (!poll) {
    return res.status(404).json({
      success: false,
      error: 'Poll not found',
    });
  }
  
  // Check if poll has closed
  if (new Date() > new Date(poll.closesAt) && poll.status === 'active') {
    poll.status = 'closed';
  }
  
  res.json({
    success: true,
    data: poll,
  });
});

/**
 * Cast a vote in a poll
 * POST /api/media/polls/:id/vote
 */
router.post('/polls/:id/vote', async (req, res) => {
  try {
    const validated = CastPollVoteSchema.parse({ ...req.body, pollId: req.params.id });
    const userId = req.user?.id || req.body.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }
    
    const poll = polls.get(req.params.id);
    if (!poll) {
      return res.status(404).json({
        success: false,
        error: 'Poll not found',
      });
    }
    
    // Check if poll is still active
    if (poll.status !== 'active' || new Date() > new Date(poll.closesAt)) {
      return res.status(400).json({
        success: false,
        error: 'Poll is closed',
      });
    }
    
    // Check if user already voted
    const voteKey = `${req.params.id}-${userId}`;
    if (pollVotes.has(voteKey)) {
      return res.status(400).json({
        success: false,
        error: 'You have already voted in this poll',
      });
    }
    
    // Validate option index
    if (validated.optionIndex >= poll.options.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid option index',
      });
    }
    
    // Record vote
    pollVotes.set(voteKey, {
      pollId: req.params.id,
      userId,
      optionIndex: validated.optionIndex,
      votedAt: new Date().toISOString(),
    });
    
    // Update poll results
    poll.totalVotes += 1;
    poll.results[validated.optionIndex].votes += 1;
    
    // Recalculate percentages
    poll.results.forEach(result => {
      result.percentage = poll.totalVotes > 0 
        ? Math.round((result.votes / poll.totalVotes) * 100) 
        : 0;
    });
    
    res.status(201).json({
      success: true,
      data: {
        pollId: req.params.id,
        optionIndex: validated.optionIndex,
        currentResults: poll.results,
      },
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
 * List polls for a game
 * GET /api/media/polls?gameId=xxx&status=xxx
 */
router.get('/polls', (req, res) => {
  const { gameId, status } = req.query;
  
  if (!gameId) {
    return res.status(400).json({
      success: false,
      error: 'gameId query parameter required',
    });
  }
  
  let filtered = Array.from(polls.values())
    .filter(p => p.gameId === gameId);
  
  if (status) {
    filtered = filtered.filter(p => p.status === status);
  }
  
  // Sort by most recent
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  res.json({
    success: true,
    data: filtered,
  });
});

/**
 * Track media coverage
 * POST /api/media/coverage
 */
router.post('/coverage', async (req, res) => {
  try {
    const validated = TrackCoverageSchema.parse(req.body);
    
    const coverageId = `coverage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const mediaCoverage = {
      id: coverageId,
      ...validated,
      recordedAt: new Date().toISOString(),
      impact: calculateImpact(validated.sentiment, validated.prominence),
    };
    
    coverage.set(coverageId, mediaCoverage);
    
    // Update approval ratings if targeting a person
    if (validated.targetType === 'person') {
      updateApprovalRating(validated.gameId, validated.targetId, validated.sentiment);
    }
    
    res.status(201).json({
      success: true,
      data: mediaCoverage,
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
      error: 'Failed to track coverage',
      message: error.message,
    });
  }
});

/**
 * Get media coverage for a target
 * GET /api/media/coverage?gameId=xxx&targetId=xxx&targetType=xxx
 */
router.get('/coverage', (req, res) => {
  const { gameId, targetId, targetType } = req.query;
  
  if (!gameId) {
    return res.status(400).json({
      success: false,
      error: 'gameId query parameter required',
    });
  }
  
  let filtered = Array.from(coverage.values())
    .filter(c => c.gameId === gameId);
  
  if (targetId) {
    filtered = filtered.filter(c => c.targetId === targetId);
  }
  
  if (targetType) {
    filtered = filtered.filter(c => c.targetType === targetType);
  }
  
  // Sort by most recent
  filtered.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  
  res.json({
    success: true,
    data: filtered,
  });
});

/**
 * Track a narrative
 * POST /api/media/narratives
 */
router.post('/narratives', async (req, res) => {
  try {
    const validated = TrackNarrativeSchema.parse(req.body);
    
    const narrativeId = `narrative-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const narrative = {
      id: narrativeId,
      ...validated,
      startedAt: new Date().toISOString(),
      status: 'active',
      mentions: 1,
      peakVirality: validated.virality,
    };
    
    narratives.set(narrativeId, narrative);
    
    res.status(201).json({
      success: true,
      data: narrative,
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
      error: 'Failed to track narrative',
      message: error.message,
    });
  }
});

/**
 * Get narrative by ID
 * GET /api/media/narratives/:id
 */
router.get('/narratives/:id', (req, res) => {
  const narrative = narratives.get(req.params.id);
  
  if (!narrative) {
    return res.status(404).json({
      success: false,
      error: 'Narrative not found',
    });
  }
  
  res.json({
    success: true,
    data: narrative,
  });
});

/**
 * List narratives for a game
 * GET /api/media/narratives?gameId=xxx&status=xxx
 */
router.get('/narratives', (req, res) => {
  const { gameId, status } = req.query;
  
  if (!gameId) {
    return res.status(400).json({
      success: false,
      error: 'gameId query parameter required',
    });
  }
  
  let filtered = Array.from(narratives.values())
    .filter(n => n.gameId === gameId);
  
  if (status) {
    filtered = filtered.filter(n => n.status === status);
  }
  
  // Sort by virality
  filtered.sort((a, b) => b.virality - a.virality);
  
  res.json({
    success: true,
    data: filtered,
  });
});

/**
 * Get approval ratings
 * GET /api/media/approval-ratings?gameId=xxx&targetId=xxx
 */
router.get('/approval-ratings', (req, res) => {
  const { gameId, targetId } = req.query;
  
  if (!gameId) {
    return res.status(400).json({
      success: false,
      error: 'gameId query parameter required',
    });
  }
  
  let filtered = Array.from(approvalRatings.values())
    .filter(ar => ar.gameId === gameId);
  
  if (targetId) {
    filtered = filtered.filter(ar => ar.targetId === targetId);
  }
  
  res.json({
    success: true,
    data: filtered,
  });
});

// Helper functions
function calculateImpact(sentiment, prominence) {
  const sentimentScores = {
    very_negative: -2,
    negative: -1,
    neutral: 0,
    positive: 1,
    very_positive: 2,
  };
  
  const prominenceMultipliers = {
    minor: 1,
    moderate: 2,
    major: 3,
    headline: 4,
  };
  
  return sentimentScores[sentiment] * prominenceMultipliers[prominence];
}

function updateApprovalRating(gameId, targetId, sentiment) {
  const ratingKey = `${gameId}-${targetId}`;
  let rating = approvalRatings.get(ratingKey);
  
  if (!rating) {
    rating = {
      gameId,
      targetId,
      approval: 50,
      disapproval: 50,
      neutral: 0,
      trend: 'stable',
      lastUpdated: new Date().toISOString(),
    };
  }
  
  // Adjust ratings based on sentiment
  const adjustments = {
    very_negative: { approval: -3, disapproval: 3 },
    negative: { approval: -1.5, disapproval: 1.5 },
    neutral: { approval: 0, disapproval: 0 },
    positive: { approval: 1.5, disapproval: -1.5 },
    very_positive: { approval: 3, disapproval: -3 },
  };
  
  const adjustment = adjustments[sentiment];
  rating.approval = Math.max(0, Math.min(100, rating.approval + adjustment.approval));
  rating.disapproval = Math.max(0, Math.min(100, rating.disapproval + adjustment.disapproval));
  rating.lastUpdated = new Date().toISOString();
  
  // Determine trend
  if (adjustment.approval > 0) {
    rating.trend = 'rising';
  } else if (adjustment.approval < 0) {
    rating.trend = 'falling';
  } else {
    rating.trend = 'stable';
  }
  
  approvalRatings.set(ratingKey, rating);
}

export default router;
