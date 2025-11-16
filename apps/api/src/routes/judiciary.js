/**
 * Judiciary Routes
 * Handles constitutional review, legal challenges, and judicial appointments
 */

import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const FileCaseSchema = z.object({
  gameId: z.string().uuid(),
  plaintiffId: z.string().uuid(),
  defendantId: z.string().uuid().optional(),
  caseType: z.enum(['constitutional_review', 'legal_challenge', 'appeal', 'judicial_review']),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  legalBasis: z.string().min(1).max(2000),
  targetLawId: z.string().uuid().optional(),
  targetActionId: z.string().uuid().optional(),
});

const AppointJudgeSchema = z.object({
  gameId: z.string().uuid(),
  userId: z.string().uuid(),
  court: z.enum(['supreme_court', 'high_court', 'appeals_court']),
  position: z.string().min(1).max(100),
  tenure: z.enum(['life', 'fixed_term', 'renewable']),
  termYears: z.number().int().min(1).max(30).optional(),
});

const IssueRulingSchema = z.object({
  caseId: z.string().uuid(),
  judgeId: z.string().uuid(),
  decision: z.enum(['upheld', 'overturned', 'remanded', 'dismissed']),
  reasoning: z.string().min(1).max(5000),
  precedentSetting: z.boolean().default(false),
  constitutionalImpact: z.enum(['none', 'minor', 'major', 'landmark']).default('none'),
});

const RequestReviewSchema = z.object({
  gameId: z.string().uuid(),
  requesterId: z.string().uuid(),
  targetType: z.enum(['law', 'executive_action', 'parliamentary_procedure']),
  targetId: z.string().uuid(),
  grounds: z.string().min(1).max(2000),
  urgency: z.enum(['routine', 'expedited', 'emergency']).default('routine'),
});

// In-memory storage
const cases = new Map();
const judges = new Map();
const rulings = new Map();
const reviews = new Map();
const precedents = new Map();

/**
 * File a legal case
 * POST /api/judiciary/cases
 */
router.post('/cases', async (req, res) => {
  try {
    const validated = FileCaseSchema.parse(req.body);
    
    const caseId = `case-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const legalCase = {
      id: caseId,
      ...validated,
      status: 'filed',
      filedAt: new Date().toISOString(),
      hearingDate: null,
      closedAt: null,
      outcome: null,
    };
    
    cases.set(caseId, legalCase);
    
    res.status(201).json({
      success: true,
      data: legalCase,
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
      error: 'Failed to file case',
      message: error.message,
    });
  }
});

/**
 * Get case by ID
 * GET /api/judiciary/cases/:id
 */
router.get('/cases/:id', (req, res) => {
  const legalCase = cases.get(req.params.id);
  
  if (!legalCase) {
    return res.status(404).json({
      success: false,
      error: 'Case not found',
    });
  }
  
  // Get associated rulings
  const caseRulings = Array.from(rulings.values())
    .filter(r => r.caseId === legalCase.id);
  
  res.json({
    success: true,
    data: {
      ...legalCase,
      rulings: caseRulings,
    },
  });
});

/**
 * List cases for a game
 * GET /api/judiciary/cases?gameId=xxx&status=xxx
 */
router.get('/cases', (req, res) => {
  const { gameId, status } = req.query;
  
  if (!gameId) {
    return res.status(400).json({
      success: false,
      error: 'gameId query parameter required',
    });
  }
  
  let filtered = Array.from(cases.values())
    .filter(c => c.gameId === gameId);
  
  if (status) {
    filtered = filtered.filter(c => c.status === status);
  }
  
  res.json({
    success: true,
    data: filtered,
  });
});

/**
 * Appoint a judge
 * POST /api/judiciary/judges
 */
router.post('/judges', async (req, res) => {
  try {
    const validated = AppointJudgeSchema.parse(req.body);
    
    const judgeId = `judge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const judge = {
      id: judgeId,
      ...validated,
      appointedAt: new Date().toISOString(),
      retiredAt: null,
      status: 'active',
      casesHeard: 0,
      rulingsIssued: 0,
    };
    
    judges.set(judgeId, judge);
    
    res.status(201).json({
      success: true,
      data: judge,
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
      error: 'Failed to appoint judge',
      message: error.message,
    });
  }
});

/**
 * Get judge by ID
 * GET /api/judiciary/judges/:id
 */
router.get('/judges/:id', (req, res) => {
  const judge = judges.get(req.params.id);
  
  if (!judge) {
    return res.status(404).json({
      success: false,
      error: 'Judge not found',
    });
  }
  
  res.json({
    success: true,
    data: judge,
  });
});

/**
 * List judges for a game
 * GET /api/judiciary/judges?gameId=xxx&court=xxx
 */
router.get('/judges', (req, res) => {
  const { gameId, court } = req.query;
  
  if (!gameId) {
    return res.status(400).json({
      success: false,
      error: 'gameId query parameter required',
    });
  }
  
  let filtered = Array.from(judges.values())
    .filter(j => j.gameId === gameId && j.status === 'active');
  
  if (court) {
    filtered = filtered.filter(j => j.court === court);
  }
  
  res.json({
    success: true,
    data: filtered,
  });
});

/**
 * Issue a ruling on a case
 * POST /api/judiciary/rulings
 */
router.post('/rulings', async (req, res) => {
  try {
    const validated = IssueRulingSchema.parse(req.body);
    
    // Verify case exists
    const legalCase = cases.get(validated.caseId);
    if (!legalCase) {
      return res.status(404).json({
        success: false,
        error: 'Case not found',
      });
    }
    
    // Verify judge exists
    const judge = judges.get(validated.judgeId);
    if (!judge) {
      return res.status(404).json({
        success: false,
        error: 'Judge not found',
      });
    }
    
    const rulingId = `ruling-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const ruling = {
      id: rulingId,
      ...validated,
      issuedAt: new Date().toISOString(),
      appealable: true,
      appealed: false,
    };
    
    rulings.set(rulingId, ruling);
    
    // Update case status
    legalCase.status = 'decided';
    legalCase.outcome = validated.decision;
    legalCase.closedAt = new Date().toISOString();
    
    // Update judge statistics
    judge.casesHeard += 1;
    judge.rulingsIssued += 1;
    
    // Create precedent if ruling is precedent-setting
    if (validated.precedentSetting) {
      const precedentId = `precedent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const precedent = {
        id: precedentId,
        caseId: validated.caseId,
        rulingId: rulingId,
        title: legalCase.title,
        principle: validated.reasoning,
        impact: validated.constitutionalImpact,
        establishedAt: new Date().toISOString(),
        citations: 0,
      };
      precedents.set(precedentId, precedent);
    }
    
    res.status(201).json({
      success: true,
      data: ruling,
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
      error: 'Failed to issue ruling',
      message: error.message,
    });
  }
});

/**
 * Get ruling by ID
 * GET /api/judiciary/rulings/:id
 */
router.get('/rulings/:id', (req, res) => {
  const ruling = rulings.get(req.params.id);
  
  if (!ruling) {
    return res.status(404).json({
      success: false,
      error: 'Ruling not found',
    });
  }
  
  res.json({
    success: true,
    data: ruling,
  });
});

/**
 * Request constitutional review
 * POST /api/judiciary/reviews
 */
router.post('/reviews', async (req, res) => {
  try {
    const validated = RequestReviewSchema.parse(req.body);
    
    const reviewId = `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const review = {
      id: reviewId,
      ...validated,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      assignedJudge: null,
      decision: null,
      decidedAt: null,
    };
    
    reviews.set(reviewId, review);
    
    res.status(201).json({
      success: true,
      data: review,
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
      error: 'Failed to request review',
      message: error.message,
    });
  }
});

/**
 * Get review by ID
 * GET /api/judiciary/reviews/:id
 */
router.get('/reviews/:id', (req, res) => {
  const review = reviews.get(req.params.id);
  
  if (!review) {
    return res.status(404).json({
      success: false,
      error: 'Review not found',
    });
  }
  
  res.json({
    success: true,
    data: review,
  });
});

/**
 * List reviews for a game
 * GET /api/judiciary/reviews?gameId=xxx&status=xxx
 */
router.get('/reviews', (req, res) => {
  const { gameId, status } = req.query;
  
  if (!gameId) {
    return res.status(400).json({
      success: false,
      error: 'gameId query parameter required',
    });
  }
  
  let filtered = Array.from(reviews.values())
    .filter(r => r.gameId === gameId);
  
  if (status) {
    filtered = filtered.filter(r => r.status === status);
  }
  
  res.json({
    success: true,
    data: filtered,
  });
});

/**
 * Get legal precedents
 * GET /api/judiciary/precedents?gameId=xxx
 */
router.get('/precedents', (req, res) => {
  const { gameId } = req.query;
  
  if (!gameId) {
    return res.status(400).json({
      success: false,
      error: 'gameId query parameter required',
    });
  }
  
  // Get all precedents for cases in this game
  const gameCaseIds = new Set(
    Array.from(cases.values())
      .filter(c => c.gameId === gameId)
      .map(c => c.id)
  );
  
  const gamePrecedents = Array.from(precedents.values())
    .filter(p => gameCaseIds.has(p.caseId));
  
  res.json({
    success: true,
    data: gamePrecedents,
  });
});

/**
 * Schedule case hearing
 * POST /api/judiciary/cases/:id/schedule
 */
router.post('/cases/:id/schedule', (req, res) => {
  const legalCase = cases.get(req.params.id);
  
  if (!legalCase) {
    return res.status(404).json({
      success: false,
      error: 'Case not found',
    });
  }
  
  const { hearingDate, assignedJudge } = req.body;
  
  if (!hearingDate) {
    return res.status(400).json({
      success: false,
      error: 'hearingDate required',
    });
  }
  
  legalCase.status = 'scheduled';
  legalCase.hearingDate = hearingDate;
  legalCase.assignedJudge = assignedJudge || null;
  
  res.json({
    success: true,
    data: legalCase,
  });
});

/**
 * Retire a judge
 * POST /api/judiciary/judges/:id/retire
 */
router.post('/judges/:id/retire', (req, res) => {
  const judge = judges.get(req.params.id);
  
  if (!judge) {
    return res.status(404).json({
      success: false,
      error: 'Judge not found',
    });
  }
  
  judge.status = 'retired';
  judge.retiredAt = new Date().toISOString();
  
  res.json({
    success: true,
    data: judge,
  });
});

export default router;
