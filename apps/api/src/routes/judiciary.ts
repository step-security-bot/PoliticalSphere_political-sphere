/**
 * Judiciary Routes
 * Handles constitutional review, legal challenges, and judicial appointments
 */

import express, { type Request, type Response } from 'express';
import { z } from 'zod';

/**
 * Express router for judiciary-related endpoints.
 * Handles legal cases, judicial appointments, rulings, constitutional reviews, and precedent tracking.
 */
const router = express.Router();

// Validation schemas

/**
 * Zod schema for validating legal case filing input.
 * Defines the structure for filing constitutional reviews and legal challenges.
 */
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

/**
 * Zod schema for validating judge appointment input.
 * Defines the structure for appointing judges to various courts.
 */
const AppointJudgeSchema = z.object({
  gameId: z.string().uuid(),
  userId: z.string().uuid(),
  court: z.enum(['supreme_court', 'high_court', 'appeals_court']),
  position: z.string().min(1).max(100),
  tenure: z.enum(['life', 'fixed_term', 'renewable']),
  termYears: z.number().int().min(1).max(30).optional(),
});

/**
 * Zod schema for validating judicial ruling input.
 * Defines the structure for issuing court rulings and decisions.
 */
const IssueRulingSchema = z.object({
  caseId: z.string().uuid(),
  judgeId: z.string().uuid(),
  decision: z.enum(['upheld', 'overturned', 'remanded', 'dismissed']),
  reasoning: z.string().min(1).max(5000),
  precedentSetting: z.boolean().default(false),
  constitutionalImpact: z.enum(['none', 'minor', 'major', 'landmark']).default('none'),
});

/**
 * Zod schema for validating constitutional review requests.
 * Defines the structure for requesting judicial review of laws and actions.
 */
const RequestReviewSchema = z.object({
  gameId: z.string().uuid(),
  requesterId: z.string().uuid(),
  targetType: z.enum(['law', 'executive_action', 'parliamentary_procedure']),
  targetId: z.string().uuid(),
  grounds: z.string().min(1).max(2000),
  urgency: z.enum(['routine', 'expedited', 'emergency']).default('routine'),
});

// Domain types
/**
 * LegalCase represents a judicial filing in the simulation.
 * It captures the parties, status and timestamps relevant for the lifecycle of a case.
 */
export interface LegalCase {
  /** Unique identifier for the legal case */
  id: string;
  /** Game ID this case belongs to */
  gameId: string;
  /** User ID of the party bringing the case */
  plaintiffId: string;
  /** User ID of the party being sued (optional) */
  defendantId?: string;
  /** Type of legal proceeding */
  caseType: 'constitutional_review' | 'legal_challenge' | 'appeal' | 'judicial_review';
  /** Case title/name */
  title: string;
  /** Detailed description of the case */
  description: string;
  /** Legal basis and arguments for the case */
  legalBasis: string;
  /** ID of law being challenged (if applicable) */
  targetLawId?: string;
  /** ID of action being challenged (if applicable) */
  targetActionId?: string;
  /** Current status of the case */
  status: 'filed' | 'hearing_scheduled' | 'in_progress' | 'closed';
  /** Timestamp when case was filed */
  filedAt: string;
  /** Scheduled hearing date (null if not yet scheduled) */
  hearingDate: string | null;
  /** Timestamp when case was closed (null if still open) */
  closedAt: string | null;
  /** Final outcome/decision (null if not yet decided) */
  outcome: string | null;
  /** ID of judge assigned to the case (optional) */
  assignedJudge?: string | null;
}

/**
 * Judge represents an appointed jurist in a court.
 * Includes metadata about their tenure and statistics for decisions issued.
 */
export interface Judge {
  /** Unique identifier for the judge */
  id: string;
  /** Game ID this judge belongs to */
  gameId: string;
  /** User ID of the person serving as judge */
  userId: string;
  /** Court level where judge serves */
  court: 'supreme_court' | 'high_court' | 'appeals_court';
  /** Official position title */
  position: string;
  /** Type of tenure (lifetime, fixed term, or renewable) */
  tenure: 'life' | 'fixed_term' | 'renewable';
  /** Length of term in years (if fixed term or renewable) */
  termYears?: number;
  /** Timestamp when judge was appointed */
  appointedAt: string;
  /** Timestamp when judge retired (null if still active) */
  retiredAt: string | null;
  /** Current status of the judge */
  status: 'active' | 'retired';
  /** Total number of cases heard by this judge */
  casesHeard: number;
  /** Total number of rulings issued by this judge */
  rulingsIssued: number;
}

/**
 * Ruling represents the result of a judicial decision for a case.
 * Contains the decision outcome, reasoning and whether it created legal precedent.
 */
export interface Ruling {
  /** Unique identifier for the ruling */
  id: string;
  /** ID of the case this ruling applies to */
  caseId: string;
  /** ID of the judge who issued the ruling */
  judgeId: string;
  /** Decision outcome */
  decision: 'upheld' | 'overturned' | 'remanded' | 'dismissed';
  /** Detailed legal reasoning for the decision */
  reasoning: string;
  /** Whether this ruling establishes legal precedent */
  precedentSetting: boolean;
  /** Level of constitutional impact */
  constitutionalImpact: 'none' | 'minor' | 'major' | 'landmark';
  /** Timestamp when ruling was issued */
  issuedAt: string;
  /** Whether the ruling can be appealed */
  appealable: boolean;
  /** Whether the ruling has been appealed */
  appealed: boolean;
}

/**
 * Review is a request for judicial review of actions or laws, including urgency and grounds.
 */
export interface Review {
  id: string;
  gameId: string;
  requesterId: string;
  targetType: 'law' | 'executive_action' | 'parliamentary_procedure';
  targetId: string;
  grounds: string;
  urgency: 'routine' | 'expedited' | 'emergency';
  status: 'pending' | 'under_review' | 'decided';
  requestedAt: string;
  assignedJudge: string | null;
  decision: string | null;
  decidedAt: string | null;
}

/**
 * Precedent represents a legal principle established by a ruling that may be cited in later cases.
 */
export interface Precedent {
  id: string;
  caseId: string;
  rulingId: string;
  title: string;
  principle: string;
  impact: 'none' | 'minor' | 'major' | 'landmark';
  establishedAt: string;
  citations: number;
}

// In-memory storage

/**
 * In-memory store for legal case records.
 * Maps case ID to LegalCase object. Placeholder for database layer.
 */
const cases = new Map<string, LegalCase>();
/**
 * In-memory store for judge records.
 * Maps judge ID to Judge object. Placeholder for database layer.
 */
const judges = new Map<string, Judge>();
/**
 * In-memory store for ruling records.
 * Maps ruling ID to Ruling object. Placeholder for database layer.
 */
const rulings = new Map<string, Ruling>();
/**
 * In-memory store for constitutional review requests.
 * Maps review ID to Review object. Placeholder for database layer.
 */
const reviews = new Map<string, Review>();
/**
 * In-memory store for legal precedent records.
 * Maps precedent ID to Precedent object. Placeholder for database layer.
 */
const precedents = new Map<string, Precedent>();

/**
 * File a legal case
 * POST /api/judiciary/cases
 *
 * @route POST /api/judiciary/cases
 * @param {FileCaseSchema} req.body - Case details for filing
 * @returns 201 with the created LegalCase
 */
router.post('/cases', async (req: Request, res: Response): Promise<Response> => {
  try {
    const validated = FileCaseSchema.parse(req.body);

    const caseId = `case-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const legalCase: LegalCase = {
      id: caseId,
      gameId: validated.gameId,
      plaintiffId: validated.plaintiffId,
      defendantId: validated.defendantId,
      caseType: validated.caseType,
      title: validated.title,
      description: validated.description,
      legalBasis: validated.legalBasis,
      targetLawId: validated.targetLawId,
      targetActionId: validated.targetActionId,
      status: 'filed' as 'filed' | 'hearing_scheduled' | 'in_progress' | 'closed',
      filedAt: new Date().toISOString(),
      hearingDate: null,
      closedAt: null,
      outcome: null,
    };

    cases.set(caseId, legalCase);

    return res.status(201).json({
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

    return res.status(500).json({
      success: false,
      error: 'Failed to file case',
      message: (error as Error).message,
    });
  }
});

/**
 * Get case by ID
 * GET /api/judiciary/cases/:id
 *
 * @route GET /api/judiciary/cases/:id
 * @param {string} id.path - Case ID
 * @returns 200 with the LegalCase and rulings, or 404 if not found
 */
router.get('/cases/:id', (req: Request, res: Response): Response => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Case ID required',
    });
  }
  const legalCase = cases.get(id);

  if (!legalCase) {
    return res.status(404).json({
      success: false,
      error: 'Case not found',
    });
  }

  // Get associated rulings
  const caseRulings = Array.from(rulings.values()).filter(r => r.caseId === legalCase.id);

  return res.json({
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
 *
 * @route GET /api/judiciary/cases
 * @param {string} gameId.query - Filter by game
 * @param {string} [status.query] - Optional case status filter
 * @returns 200 with array of LegalCase entries
 */
router.get('/cases', (req: Request, res: Response): Response => {
  const { gameId, status } = req.query as { gameId?: string; status?: string };

  if (!gameId) {
    return res.status(400).json({
      success: false,
      error: 'gameId query parameter required',
    });
  }

  let filtered = Array.from(cases.values()).filter(c => c.gameId === gameId);

  if (status) {
    filtered = filtered.filter(c => c.status === status);
  }

  return res.json({
    success: true,
    data: filtered,
  });
});

/**
 * Appoint a judge
 * POST /api/judiciary/judges
 *
 * @route POST /api/judiciary/judges
 * @param {AppointJudgeSchema} req.body - Appointment details
 * @returns 201 with the appointed Judge
 */
router.post('/judges', async (req: Request, res: Response): Promise<Response> => {
  try {
    const validated = AppointJudgeSchema.parse(req.body);

    const judgeId = `judge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const judge: Judge = {
      id: judgeId,
      gameId: validated.gameId,
      userId: validated.userId,
      court: validated.court,
      position: validated.position,
      tenure: validated.tenure,
      termYears: validated.termYears,
      appointedAt: new Date().toISOString(),
      retiredAt: null,
      status: 'active' as 'active' | 'retired',
      casesHeard: 0,
      rulingsIssued: 0,
    };

    judges.set(judgeId, judge);

    return res.status(201).json({
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

    return res.status(500).json({
      success: false,
      error: 'Failed to appoint judge',
      message: (error as Error).message,
    });
  }
});

/**
 * Get judge by ID
 * GET /api/judiciary/judges/:id
 *
 * @route GET /api/judiciary/judges/:id
 * @param {string} id.path - Judge ID
 * @returns 200 with Judge info or 404 if not found
 */
router.get('/judges/:id', (req: Request, res: Response): Response => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Judge ID required',
    });
  }
  const judge = judges.get(id);

  if (!judge) {
    return res.status(404).json({
      success: false,
      error: 'Judge not found',
    });
  }

  return res.json({
    success: true,
    data: judge,
  });
});

/**
 * List judges for a game
 * GET /api/judiciary/judges?gameId=xxx&court=xxx
 *
 * @route GET /api/judiciary/judges
 * @param {string} gameId.query - Filter by game
 * @param {string} [court.query] - Optional court filter
 * @returns 200 with array of Judge entries
 */
router.get('/judges', (req: Request, res: Response): Response => {
  const { gameId, court } = req.query as { gameId?: string; court?: string };

  if (!gameId) {
    return res.status(400).json({
      success: false,
      error: 'gameId query parameter required',
    });
  }

  let filtered = Array.from(judges.values()).filter(
    j => j.gameId === gameId && j.status === 'active'
  );

  if (court) {
    filtered = filtered.filter(j => j.court === court);
  }

  return res.json({
    success: true,
    data: filtered,
  });
});

/**
 * Issue a ruling on a case
 * POST /api/judiciary/rulings
 *
 * @route POST /api/judiciary/rulings
 * @param {IssueRulingSchema} req.body - Ruling details to persist
 * @returns 201 with the created Ruling object
 */
router.post('/rulings', async (req: Request, res: Response): Promise<Response> => {
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
    const ruling: Ruling = {
      id: rulingId,
      caseId: validated.caseId,
      judgeId: validated.judgeId,
      decision: validated.decision,
      reasoning: validated.reasoning,
      precedentSetting: validated.precedentSetting,
      constitutionalImpact: validated.constitutionalImpact,
      issuedAt: new Date().toISOString(),
      appealable: true,
      appealed: false,
    };

    rulings.set(rulingId, ruling);

    // Update case status
    // Map decided terminal state to closed to satisfy LegalCase status union
    legalCase.status = 'closed';
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

    return res.status(201).json({
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

    return res.status(500).json({
      success: false,
      error: 'Failed to issue ruling',
      message: (error as Error).message,
    });
  }
});

/**
 * Get ruling by ID
 * GET /api/judiciary/rulings/:id
 *
 * @route GET /api/judiciary/rulings/:id
 * @param {string} id.path - Ruling ID
 * @returns 200 with Ruling or 404 if not found
 */
router.get('/rulings/:id', (req: Request, res: Response): Response => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Ruling ID required',
    });
  }
  const ruling = rulings.get(id);

  if (!ruling) {
    return res.status(404).json({
      success: false,
      error: 'Ruling not found',
    });
  }

  return res.json({
    success: true,
    data: ruling,
  });
});

/**
 * Request constitutional review
 * POST /api/judiciary/reviews
 *
 * @route POST /api/judiciary/reviews
 * @param {RequestReviewSchema} req.body - Review request details
 * @returns 201 with the created Review
 */
router.post('/reviews', async (req: Request, res: Response): Promise<Response> => {
  try {
    const validated = RequestReviewSchema.parse(req.body);

    const reviewId = `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const review: Review = {
      id: reviewId,
      gameId: validated.gameId,
      requesterId: validated.requesterId,
      targetType: validated.targetType,
      targetId: validated.targetId,
      grounds: validated.grounds,
      urgency: validated.urgency,
      status: 'pending' as 'pending' | 'under_review' | 'decided',
      requestedAt: new Date().toISOString(),
      assignedJudge: null,
      decision: null,
      decidedAt: null,
    };

    reviews.set(reviewId, review);

    return res.status(201).json({
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

    return res.status(500).json({
      success: false,
      error: 'Failed to request review',
      message: (error as Error).message,
    });
  }
});

/**
 * Get review by ID
 * GET /api/judiciary/reviews/:id
 *
 * @route GET /api/judiciary/reviews/:id
 * @param {string} id.path - Review ID
 * @returns 200 with Review or 404 if not found
 */
router.get('/reviews/:id', (req: Request, res: Response): Response => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Review ID required',
    });
  }
  const review = reviews.get(id);

  if (!review) {
    return res.status(404).json({
      success: false,
      error: 'Review not found',
    });
  }

  return res.json({
    success: true,
    data: review,
  });
});

/**
 * List reviews for a game
 * GET /api/judiciary/reviews?gameId=xxx&status=xxx
 *
 * @route GET /api/judiciary/reviews
 * @param {string} gameId.query - Filter by game
 * @param {string} [status.query] - Optional status filter
 * @returns 200 with array of Review objects
 */
router.get('/reviews', (req: Request, res: Response): Response => {
  const { gameId, status } = req.query as { gameId?: string; status?: string };

  if (!gameId) {
    return res.status(400).json({
      success: false,
      error: 'gameId query parameter required',
    });
  }

  let filtered = Array.from(reviews.values()).filter(r => r.gameId === gameId);

  if (status) {
    filtered = filtered.filter(r => r.status === status);
  }

  return res.json({
    success: true,
    data: filtered,
  });
});

/**
 * Get legal precedents
 * GET /api/judiciary/precedents?gameId=xxx
 *
 * @route GET /api/judiciary/precedents
 * @param {string} gameId.query - Filter by game
 * @returns 200 with array of Precedent objects
 */
router.get('/precedents', (req: Request, res: Response): Response => {
  const { gameId } = req.query as { gameId?: string };

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

  const gamePrecedents = Array.from(precedents.values()).filter(p => gameCaseIds.has(p.caseId));

  return res.json({
    success: true,
    data: gamePrecedents,
  });
});

/**
 * Schedule case hearing
 * POST /api/judiciary/cases/:id/schedule
 *
 * @route POST /api/judiciary/cases/:id/schedule
 * @param {string} id.path - Case ID
 * @param {string} req.body.hearingDate - Hearing date string
 * @returns 200 with updated LegalCase
 */
router.post('/cases/:id/schedule', (req: Request, res: Response): Response => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Case ID required',
    });
  }
  const legalCase = cases.get(id);

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

  // Map scheduled hearing to hearing_scheduled per allowed status literals
  legalCase.status = 'hearing_scheduled';
  legalCase.hearingDate = hearingDate;
  legalCase.assignedJudge = assignedJudge || null;

  return res.json({
    success: true,
    data: legalCase,
  });
});

/**
 * Retire a judge
 * POST /api/judiciary/judges/:id/retire
 *
 * @route POST /api/judiciary/judges/:id/retire
 * @param {string} id.path - Judge ID
 * @returns 200 with updated Judge
 */
router.post('/judges/:id/retire', (req: Request, res: Response): Response => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Judge ID required',
    });
  }
  const judge = judges.get(id);

  if (!judge) {
    return res.status(404).json({
      success: false,
      error: 'Judge not found',
    });
  }

  judge.status = 'retired' as 'active' | 'retired';
  judge.retiredAt = new Date().toISOString();

  return res.json({
    success: true,
    data: judge,
  });
});

/**
 * Judiciary router: endpoints to file cases, appoint judges, issue rulings,
 * request reviews and manage legal precedents.
 */
export default router;
