/**
 * Elections Routes
 * Handles election campaigns, constituencies, candidates, ballots, and results
 */

import express from 'express';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const CreateElectionSchema = z.object({
  gameId: z.string().uuid(),
  name: z.string().min(1).max(200),
  electionType: z.enum(['general', 'by_election', 'local', 'referendum']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  description: z.string().min(1).max(2000).optional(),
});

const RegisterCampaignSchema = z.object({
  electionId: z.string().uuid(),
  partyId: z.string().uuid().optional(),
  candidateId: z.string().uuid(),
  name: z.string().min(1).max(200),
  slogan: z.string().min(1).max(200).optional(),
  platform: z.string().min(1).max(5000),
  budget: z.number().min(0).default(0),
});

const CreateConstituencySchema = z.object({
  electionId: z.string().uuid(),
  name: z.string().min(1).max(200),
  population: z.number().int().min(1),
  registeredVoters: z.number().int().min(0),
  region: z.string().min(1).max(100),
});

const RegisterCandidateSchema = z.object({
  electionId: z.string().uuid(),
  constituencyId: z.string().uuid(),
  userId: z.string().uuid(),
  partyId: z.string().uuid().optional(),
  independent: z.boolean().default(false),
  deposit: z.number().min(0).default(500),
});

const CastVoteSchema = z.object({
  electionId: z.string().uuid(),
  constituencyId: z.string().uuid(),
  candidateId: z.string().uuid(),
});

// In-memory storage
const elections = new Map();
const campaigns = new Map();
const constituencies = new Map();
const candidates = new Map();
const votes = new Map();
const results = new Map();

/**
 * Create an election
 * POST /api/elections
 */
router.post('/', async (req, res) => {
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
    const election = {
      id: electionId,
      ...validated,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      totalVotes: 0,
      turnout: 0,
    };
    
    elections.set(electionId, election);
    
    res.status(201).json({
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
    
    res.status(500).json({
      success: false,
      error: 'Failed to create election',
      message: error.message,
    });
  }
});

/**
 * Get election by ID
 * GET /api/elections/:id
 */
router.get('/:id', (req, res) => {
  const election = elections.get(req.params.id);
  
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
  
  res.json({
    success: true,
    data: election,
  });
});

/**
 * List elections for a game
 * GET /api/elections?gameId=xxx&status=xxx
 */
router.get('/', (req, res) => {
  const { gameId, status } = req.query;
  
  if (!gameId) {
    return res.status(400).json({
      success: false,
      error: 'gameId query parameter required',
    });
  }
  
  let filtered = Array.from(elections.values())
    .filter(e => e.gameId === gameId);
  
  if (status) {
    filtered = filtered.filter(e => e.status === status);
  }
  
  // Sort by most recent
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  res.json({
    success: true,
    data: filtered,
  });
});

/**
 * Register a campaign
 * POST /api/elections/:id/campaigns
 */
router.post('/:id/campaigns', async (req, res) => {
  try {
    const validated = RegisterCampaignSchema.parse({ ...req.body, electionId: req.params.id });
    
    // Verify election exists
    const election = elections.get(req.params.id);
    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }
    
    const campaignId = `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const campaign = {
      id: campaignId,
      ...validated,
      registeredAt: new Date().toISOString(),
      spending: 0,
      events: 0,
      endorsements: [],
    };
    
    campaigns.set(campaignId, campaign);
    
    res.status(201).json({
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
    
    res.status(500).json({
      success: false,
      error: 'Failed to register campaign',
      message: error.message,
    });
  }
});

/**
 * List campaigns for an election
 * GET /api/elections/:id/campaigns
 */
router.get('/:id/campaigns', (req, res) => {
  const electionCampaigns = Array.from(campaigns.values())
    .filter(c => c.electionId === req.params.id);
  
  res.json({
    success: true,
    data: electionCampaigns,
  });
});

/**
 * Create a constituency
 * POST /api/elections/:id/constituencies
 */
router.post('/:id/constituencies', async (req, res) => {
  try {
    const validated = CreateConstituencySchema.parse({ ...req.body, electionId: req.params.id });
    
    // Verify election exists
    const election = elections.get(req.params.id);
    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }
    
    const constituencyId = `constituency-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const constituency = {
      id: constituencyId,
      ...validated,
      createdAt: new Date().toISOString(),
      votesCast: 0,
      turnoutPercentage: 0,
    };
    
    constituencies.set(constituencyId, constituency);
    
    res.status(201).json({
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
    
    res.status(500).json({
      success: false,
      error: 'Failed to create constituency',
      message: error.message,
    });
  }
});

/**
 * List constituencies for an election
 * GET /api/elections/:id/constituencies
 */
router.get('/:id/constituencies', (req, res) => {
  const electionConstituencies = Array.from(constituencies.values())
    .filter(c => c.electionId === req.params.id);
  
  res.json({
    success: true,
    data: electionConstituencies,
  });
});

/**
 * Register a candidate
 * POST /api/elections/:id/candidates
 */
router.post('/:id/candidates', async (req, res) => {
  try {
    const validated = RegisterCandidateSchema.parse({ ...req.body, electionId: req.params.id });
    
    // Verify election and constituency exist
    const election = elections.get(req.params.id);
    if (!election) {
      return res.status(404).json({
        success: false,
        error: 'Election not found',
      });
    }
    
    const constituency = constituencies.get(validated.constituencyId);
    if (!constituency || constituency.electionId !== req.params.id) {
      return res.status(404).json({
        success: false,
        error: 'Constituency not found or not part of this election',
      });
    }
    
    const candidateId = `candidate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const candidate = {
      id: candidateId,
      ...validated,
      registeredAt: new Date().toISOString(),
      votesReceived: 0,
      votePercentage: 0,
      status: 'registered',
    };
    
    candidates.set(candidateId, candidate);
    
    res.status(201).json({
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
    
    res.status(500).json({
      success: false,
      error: 'Failed to register candidate',
      message: error.message,
    });
  }
});

/**
 * List candidates for an election
 * GET /api/elections/:id/candidates?constituencyId=xxx
 */
router.get('/:id/candidates', (req, res) => {
  const { constituencyId } = req.query;
  
  let filtered = Array.from(candidates.values())
    .filter(c => c.electionId === req.params.id);
  
  if (constituencyId) {
    filtered = filtered.filter(c => c.constituencyId === constituencyId);
  }
  
  res.json({
    success: true,
    data: filtered,
  });
});

/**
 * Cast a vote
 * POST /api/elections/:id/vote
 */
router.post('/:id/vote', async (req, res) => {
  try {
    const validated = CastVoteSchema.parse({ ...req.body, electionId: req.params.id });
    const userId = req.user?.id || req.body.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }
    
    // Verify election is active
    const election = elections.get(req.params.id);
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
    const voteKey = `${req.params.id}-${validated.constituencyId}-${userId}`;
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
      electionId: req.params.id,
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
    
    res.status(201).json({
      success: true,
      data: {
        electionId: req.params.id,
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
    
    res.status(500).json({
      success: false,
      error: 'Failed to cast vote',
      message: error.message,
    });
  }
});

/**
 * Get election results
 * GET /api/elections/:id/results?constituencyId=xxx
 */
router.get('/:id/results', (req, res) => {
  const { constituencyId } = req.query;
  const election = elections.get(req.params.id);
  
  if (!election) {
    return res.status(404).json({
      success: false,
      error: 'Election not found',
    });
  }
  
  // Calculate results
  let electionCandidates = Array.from(candidates.values())
    .filter(c => c.electionId === req.params.id);
  
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
  const constituencyResults = new Map();
  electionCandidates.forEach(candidate => {
    if (!constituencyResults.has(candidate.constituencyId)) {
      constituencyResults.set(candidate.constituencyId, candidate);
    }
  });
  
  res.json({
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
 */
router.post('/:id/certify', (req, res) => {
  const election = elections.get(req.params.id);
  
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
  
  res.json({
    success: true,
    data: election,
  });
});

export default router;
