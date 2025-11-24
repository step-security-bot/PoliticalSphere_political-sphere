/**
 * Elections Routes
 * Handles election campaigns, constituencies, candidates, ballots, and results
 */

import express, { type Request, type Response } from 'express';
import { z } from 'zod';

/**
 * Router for election-related endpoints.
 *
 * Provides CRUD for elections, campaign registration, constituency and
 * candidate management, and vote casting endpoints used by the simulation and
 * UI layers.
 */
const router = express.Router();

// Validation schemas

/**
 * Zod schema for creating a new election.
 * Validates election metadata including game ID, name, type, start/end dates, and optional description.
 */
const CreateElectionSchema = z.object({
  gameId: z.string().uuid(),
  name: z.string().min(1).max(200),
  electionType: z.enum(['general', 'by_election', 'local', 'referendum']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  description: z.string().min(1).max(2000).optional(),
});

/**
 * Zod schema for registering a campaign within an election.
 * Validates campaign data including election ID, candidate, party affiliation, platform, and budget.
 */
const RegisterCampaignSchema = z.object({
  electionId: z.string().uuid(),
  partyId: z.string().uuid().optional(),
  candidateId: z.string().uuid(),
  name: z.string().min(1).max(200),
  slogan: z.string().min(1).max(200).optional(),
  platform: z.string().min(1).max(5000),
  budget: z.number().min(0).default(0),
});

/**
 * Zod schema for creating a new constituency (electoral district).
 * Validates constituency data including election ID, name, population, registered voters, and region.
 */
const CreateConstituencySchema = z.object({
  electionId: z.string().uuid(),
  name: z.string().min(1).max(200),
  population: z.number().int().min(1),
  registeredVoters: z.number().int().min(0),
  region: z.string().min(1).max(100),
});

/**
 * Zod schema for registering a candidate in an election constituency.
 * Validates candidate data including election/constituency IDs, user ID, party affiliation, independent status, and deposit.
 */
const RegisterCandidateSchema = z.object({
  electionId: z.string().uuid(),
  constituencyId: z.string().uuid(),
  userId: z.string().uuid(),
  partyId: z.string().uuid().optional(),
  independent: z.boolean().default(false),
  deposit: z.number().min(0).default(500),
});

/**
 * Zod schema for casting a vote in an election.
 * Validates vote data including election ID, constituency ID, and candidate ID.
 */
const CastVoteSchema = z.object({
  electionId: z.string().uuid(),
  constituencyId: z.string().uuid(),
  candidateId: z.string().uuid(),
});

// Domain types
/**
 * Election represents an election event with metadata, status and vote totals.
 */
export interface Election {
  id: string;
  gameId: string;
  name: string;
  electionType: 'general' | 'by_election' | 'local' | 'referendum';
  startDate: string;
  endDate: string;
  description?: string;
  status: 'scheduled' | 'active' | 'closed' | 'certified';
  createdAt: string;
  totalVotes: number;
  turnout: number;
  certifiedAt?: string;
}

/**
 * Campaign represents an organized campaign for a candidate or party within an election.
 */
export interface Campaign {
  id: string;
  electionId: string;
  partyId?: string;
  candidateId: string;
  name: string;
  slogan?: string;
  platform: string;
  budget: number;
  registeredAt: string;
  spending: number;
  events: number;
  endorsements: string[];
}

/**
 * Constituency represents an electoral district within an election.
 */
export interface Constituency {
  id: string;
  electionId: string;
  name: string;
  population: number;
  registeredVoters: number;
  region: string;
  createdAt: string;
  votesCast: number;
  turnoutPercentage: number;
}

/**
 * Candidate represents a person standing for election in a constituency.
 */
export interface Candidate {
  id: string;
  electionId: string;
  constituencyId: string;
  userId: string;
  partyId?: string;
  independent: boolean;
  deposit: number;
  registeredAt: string;
  votesReceived: number;
  votePercentage: number;
  status: 'registered' | 'withdrawn';
}

/**
 * VoteRecord stores a cast vote in a particular election constituency by a user.
 */
export interface VoteRecord {
  electionId: string;
  constituencyId: string;
  candidateId: string;
  userId: string;
  votedAt: string;
}

// In-memory storage (placeholder; replace with persistence layer later)

/**
 * In-memory store for election records.
 * Maps election ID to Election object. Placeholder for database layer.
 */
const elections = new Map<string, Election>();
/**
 * In-memory store for campaign records.
 * Maps campaign ID to Campaign object. Placeholder for database layer.
 */
const campaigns = new Map<string, Campaign>();
/**
 * In-memory store for constituency records.
 * Maps constituency ID to Constituency object. Placeholder for database layer.
 */
const constituencies = new Map<string, Constituency>();
/**
 * In-memory store for candidate records.
 * Maps candidate ID to Candidate object. Placeholder for database layer.
 */
const candidates = new Map<string, Candidate>();
/**
 * In-memory store for vote records.
 * Maps vote ID to VoteRecord object. Placeholder for database layer.
 */
const votes = new Map<string, VoteRecord>();
/**
 * In-memory store for election results.
 * Maps election ID to aggregated results. Placeholder for database layer.
 */
const _results = new Map<string, unknown>();

/**
 * Create a new election
 * POST /api/elections
 *
 * @route POST /api/elections
 * @param {CreateElectionSchema} req.body - Election creation payload
 * @returns 201 with the created Election
 */
router.post('/', async (req: Request, res: Response): Promise<Response> => {
  try {
    const validated = CreateElectionSchema.parse(req.body);

    // Validate dates
    if (new Date(validated.endDate) <= new Date(validated.startDate)) {
      return res.status(400).json({
        success: false,
        error: 'End date must be after start date',
      });
    }

    const electionId = `election-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const election: Election = {
      id: electionId,
      gameId: validated.gameId,
      name: validated.name,
      electionType: validated.electionType,
      startDate: validated.startDate,
      endDate: validated.endDate,
      description: validated.description,
      status: 'scheduled' as const,
      createdAt: new Date().toISOString(),
      totalVotes: 0,
      turnout: 0,
    };

    elections.set(electionId, election);

    return res.status(201).json({
      success: true,
      data: election,
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
      error: 'Failed to create election',
      message: (error as Error).message,
    });
  }
});

/**
 * Get election by ID
 * GET /api/elections/:id
 *
 * @route GET /api/elections/:id
 * @param {string} id.path - Election ID
 * @returns 200 with the Election or 404 if not found
 */
router.get('/:id', (req: Request, res: Response): Response => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Election ID required',
    });
  }
  const election = elections.get(id);

  if (!election) {
    return res.status(404).json({
      success: false,
      error: 'Election not found',
    });
  }

  // Update status based on dates
  const now = new Date();
  const startDate = new Date(election.startDate);
  const endDate = new Date(election.endDate);

  if (now < startDate) {
    election.status = 'scheduled';
  } else if (now >= startDate && now <= endDate) {
    election.status = 'active';
  } else if (now > endDate && election.status !== 'certified') {
    election.status = 'closed';
  }

  return res.json({
    success: true,
    data: election,
  });
});

/**
 * List elections for a game
 * GET /api/elections?gameId=xxx&status=xxx
 *
 * @route GET /api/elections
 * @param {string} gameId.query - Filter by game ID
 * @param {string} [status.query] - Optional status filter
 * @returns 200 with array of Election objects
 */
router.get('/', (req: Request, res: Response): Response => {
  const { gameId, status } = req.query as { gameId?: string; status?: string };

  if (!gameId) {
    return res.status(400).json({
      success: false,
      error: 'gameId query parameter required',
    });
  }

  let filtered = Array.from(elections.values()).filter(e => e.gameId === gameId);

  if (status) {
    filtered = filtered.filter(e => e.status === status);
  }

  // Sort by most recent
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return res.json({
    success: true,
    data: filtered,
  });
});

/**
 * Register a campaign for an election
 * POST /api/elections/:id/campaigns
 *
 * @route POST /api/elections/:id/campaigns
 * @param {string} id.path - Election ID
 * @param {RegisterCampaignSchema} req.body - Campaign details
 * @returns 201 with created Campaign
 */
router.post('/:id/campaigns', async (req: Request, res: Response): Promise<Response> => {
  try {
    const electionId = req.params.id;
    if (!electionId) {
      return res.status(400).json({
        success: false,
        error: 'Election ID required',
      });
    }
    const validated = RegisterCampaignSchema.parse({ ...req.body, electionId });

    // Verify election exists
    const election = elections.get(electionId);
    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }

    const campaignId = `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const campaign: Campaign = {
      id: campaignId,
      electionId: validated.electionId,
      partyId: validated.partyId,
      candidateId: validated.candidateId,
      name: validated.name,
      slogan: validated.slogan,
      platform: validated.platform,
      budget: validated.budget,
      registeredAt: new Date().toISOString(),
      spending: 0,
      events: 0,
      endorsements: [],
    };

    campaigns.set(campaignId, campaign);

    return res.status(201).json({
      success: true,
      data: campaign,
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
      error: 'Failed to register campaign',
      message: (error as Error).message,
    });
  }
});

/**
 * List campaigns for an election
 * GET /api/elections/:id/campaigns
 *
 * @route GET /api/elections/:id/campaigns
 * @param {string} id.path - Election ID
 * @returns 200 with array of Campaign objects
 */
router.get('/:id/campaigns', (req: Request, res: Response): Response => {
  const electionId = req.params.id || '';
  const electionCampaigns = Array.from(campaigns.values()).filter(c => c.electionId === electionId);

  return res.json({
    success: true,
    data: electionCampaigns,
  });
});

/**
 * Create a constituency for an election
 * POST /api/elections/:id/constituencies
 *
 * @route POST /api/elections/:id/constituencies
 * @param {string} id.path - Election ID
 * @param {CreateConstituencySchema} req.body - Constituency creation payload
 * @returns 201 with created Constituency
 */
router.post('/:id/constituencies', async (req: Request, res: Response): Promise<Response> => {
  try {
    const electionId = req.params.id;
    if (!electionId) {
      return res.status(400).json({
        success: false,
        error: 'Election ID required',
      });
    }
    const validated = CreateConstituencySchema.parse({ ...req.body, electionId });

    // Verify election exists
    const election = elections.get(electionId);
    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }

    const constituencyId = `constituency-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const constituency: Constituency = {
      id: constituencyId,
      electionId: validated.electionId,
      name: validated.name,
      population: validated.population,
      registeredVoters: validated.registeredVoters,
      region: validated.region,
      createdAt: new Date().toISOString(),
      votesCast: 0,
      turnoutPercentage: 0,
    };

    constituencies.set(constituencyId, constituency);

    return res.status(201).json({
      success: true,
      data: constituency,
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
      error: 'Failed to create constituency',
      message: (error as Error).message,
    });
  }
});

/**
 * List constituencies for an election
 * GET /api/elections/:id/constituencies
 *
 * @route GET /api/elections/:id/constituencies
 * @param {string} id.path - Election ID
 * @returns 200 with array of Constituency objects
 */
router.get('/:id/constituencies', (req: Request, res: Response): Response => {
  const electionId = req.params.id || '';
  const electionConstituencies = Array.from(constituencies.values()).filter(
    c => c.electionId === electionId
  );

  return res.json({
    success: true,
    data: electionConstituencies,
  });
});

/**
 * Register a candidate for an election
 * POST /api/elections/:id/candidates
 *
 * @route POST /api/elections/:id/candidates
 * @param {string} id.path - Election ID
 * @param {RegisterCandidateSchema} req.body - Candidate registration payload
 * @returns 201 with created Candidate
 */
router.post('/:id/candidates', async (req: Request, res: Response): Promise<Response> => {
  try {
    const electionId = req.params.id;
    if (!electionId) {
      return res.status(400).json({
        success: false,
        error: 'Election ID required',
      });
    }
    const validated = RegisterCandidateSchema.parse({ ...req.body, electionId });

    // Verify election and constituency exist
    const election = elections.get(electionId);
    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }

    const constituency = constituencies.get(validated.constituencyId);
    if (!constituency || constituency.electionId !== electionId) {
      return res.status(404).json({
        success: false,
        error: 'Constituency not found or not part of this election',
      });
    }

    const candidateId = `candidate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const candidate: Candidate = {
      id: candidateId,
      electionId: validated.electionId,
      constituencyId: validated.constituencyId,
      userId: validated.userId,
      partyId: validated.partyId,
      independent: validated.independent,
      deposit: validated.deposit,
      registeredAt: new Date().toISOString(),
      votesReceived: 0,
      votePercentage: 0,
      status: 'registered' as const,
    };

    candidates.set(candidateId, candidate);

    return res.status(201).json({
      success: true,
      data: candidate,
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
      error: 'Failed to register candidate',
      message: (error as Error).message,
    });
  }
});

/**
 * List candidates for an election
 * GET /api/elections/:id/candidates
 *
 * @route GET /api/elections/:id/candidates
 * @param {string} id.path - Election ID
 * @param {string} [constituencyId.query] - Optional constituency ID
 * @returns 200 with array of Candidate objects
 */
router.get('/:id/candidates', (req: Request, res: Response): Response => {
  const { constituencyId } = req.query as { constituencyId?: string };
  const electionId = req.params.id || '';

  let filtered = Array.from(candidates.values()).filter(c => c.electionId === electionId);

  if (constituencyId) {
    filtered = filtered.filter(c => c.constituencyId === constituencyId);
  }

  return res.json({
    success: true,
    data: filtered,
  });
});

/**
 * Cast a vote in an election
 * POST /api/elections/:id/vote
 *
 * @route POST /api/elections/:id/vote
 * @param {string} id.path - Election ID
 * @param {CastVoteSchema} req.body - Vote details
 * @returns 201 confirming the cast vote
 */
router.post('/:id/vote', async (req: Request, res: Response): Promise<Response> => {
  try {
    const electionId = req.params.id;
    if (!electionId) {
      return res.status(400).json({
        success: false,
        error: 'Election ID required',
      });
    }
    const validated = CastVoteSchema.parse({ ...req.body, electionId });
    const userId = (req as Request & { user?: { id: string } }).user?.id || req.body.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Verify election is active
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Election ID required',
      });
    }
    const election = elections.get(id);
    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }

    const now = new Date();
    if (now < new Date(election.startDate) || now > new Date(election.endDate)) {
      return res.status(400).json({
        success: false,
        error: 'Election is not currently active',
      });
    }

    // Check if user already voted in this constituency
    const voteKey = `${electionId}-${validated.constituencyId}-${userId}`;
    if (votes.has(voteKey)) {
      return res.status(400).json({
        success: false,
        error: 'You have already voted in this constituency',
      });
    }

    // Verify candidate exists and is in the correct constituency
    const candidate = candidates.get(validated.candidateId);
    if (!candidate || candidate.constituencyId !== validated.constituencyId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid candidate for this constituency',
      });
    }

    // Record vote
    votes.set(voteKey, {
      electionId,
      constituencyId: validated.constituencyId,
      candidateId: validated.candidateId,
      userId,
      votedAt: new Date().toISOString(),
    });

    // Update counts
    election.totalVotes += 1;
    candidate.votesReceived += 1;

    const constituency = constituencies.get(validated.constituencyId);
    if (constituency) {
      constituency.votesCast += 1;
      constituency.turnoutPercentage =
        (constituency.votesCast / constituency.registeredVoters) * 100;
    }

    return res.status(201).json({
      success: true,
      data: {
        electionId,
        constituencyId: validated.constituencyId,
        voteCast: true,
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

    return res.status(500).json({
      success: false,
      error: 'Failed to cast vote',
      message: (error as Error).message,
    });
  }
});

/**
 * Get election results
 * GET /api/elections/:id/results
 *
 * @route GET /api/elections/:id/results
 * @param {string} id.path - Election ID
 * @param {string} [constituencyId.query] - Optional constituency ID
 * @returns 200 with election results and winners
 */
router.get('/:id/results', (req: Request, res: Response): Response => {
  const { constituencyId } = req.query as { constituencyId?: string };
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Election ID required',
    });
  }
  const election = elections.get(id);

  if (!election) {
    return res.status(404).json({
      success: false,
      error: 'Election not found',
    });
  }

  // Calculate results
  let electionCandidates = Array.from(candidates.values()).filter(c => c.electionId === id);

  if (constituencyId) {
    electionCandidates = electionCandidates.filter(c => c.constituencyId === constituencyId);
  }

  // Calculate percentages
  const totalVotes = electionCandidates.reduce((sum, c) => sum + c.votesReceived, 0);
  electionCandidates.forEach(c => {
    c.votePercentage = totalVotes > 0 ? (c.votesReceived / totalVotes) * 100 : 0;
  });

  // Sort by votes received
  electionCandidates.sort((a, b) => b.votesReceived - a.votesReceived);

  // Determine winners by constituency
  const constituencyResults = new Map<string, Candidate>();
  electionCandidates.forEach(candidate => {
    if (!constituencyResults.has(candidate.constituencyId)) {
      constituencyResults.set(candidate.constituencyId, candidate);
    }
  });

  return res.json({
    success: true,
    data: {
      election,
      candidates: electionCandidates,
      winners: Array.from(constituencyResults.values()),
      totalVotes,
    },
  });
});

/**
 * Certify election results
 * POST /api/elections/:id/certify
 *
 * @route POST /api/elections/:id/certify
 * @param {string} id.path - Election ID
 * @returns 200 with certified Election data if successful
 */
router.post('/:id/certify', (req: Request, res: Response): Response => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Election ID required',
    });
  }
  const election = elections.get(id);

  if (!election) {
    return res.status(404).json({
      success: false,
      error: 'Election not found',
    });
  }

  if (election.status !== 'closed') {
    return res.status(400).json({
      success: false,
      error: 'Election must be closed before certification',
    });
  }

  election.status = 'certified';
  election.certifiedAt = new Date().toISOString();

  return res.json({
    success: true,
    data: election,
  });
});

/**
 * Elections router: endpoints for creating and managing elections,
 * registering campaigns and candidates, casting votes and certifying
 * election results.
 */
export default router;
