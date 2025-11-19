/**
 * Game Server - Main Entry Point
 * Handles game creation, player actions, moderation, and age verification
 */

import fs from 'node:fs';
import path from 'node:path';

import bodyParser from 'body-parser';
import type { CorsOptions } from 'cors';
import cors from 'cors';
import type { Request, Response } from 'express';
import express from 'express';
import { v4 as uuidv4 } from 'uuid';

import { advanceGameState } from '@political-sphere/game-engine';

// Dummy logger
const logger = {
  info: console.log,
  warn: console.warn,
  error: console.error,
  fatal: console.error,
};

import complianceClient from './complianceClient';

// DB adapter (SQLite) handles persistence
import dbModule from './db';
import { CircuitBreaker } from './utils/circuit-breaker';

// Extend Request to include user property
interface AuthRequest extends Request {
  user?: {
    id?: string;
    userId?: string;
    username?: string;
  };
}

const dbReady =
  dbModule && typeof (dbModule as Promise<unknown>).then === 'function'
    ? (dbModule as unknown as Promise<Database>)
    : Promise.resolve(dbModule as unknown as Database);

interface Database {
  upsertGame: (id: string, game: Game) => Promise<void>;
  getAllGames: () => Promise<Map<string, Game>>;
}

interface Player {
  id: string;
  displayName: string;
  createdAt: string;
  verifiedAge: number | null;
  contentRating: string;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposerId: string;
  createdAt: string;
  status: 'proposed' | 'debate' | 'voting' | 'enacted' | 'rejected' | 'flagged'; // Union type
  debateId?: string | null;
  moderationStatus?: string;
  flaggedReasons?: string[];
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNote?: string | null;
  contentRating?: string;
}

interface Vote {
  id: string;
  proposalId: string;
  playerId: string;
  choice: 'for' | 'against' | 'abstain'; // Union type to match engine
  createdAt: string; // Required, not optional
  timestamp: string; // Required to match engine
}

interface Economy {
  treasury: number;
  inflationRate: number;
  unemploymentRate: number;
}

interface Turn {
  turnNumber: number;
  phase: 'lobby' | 'debate' | 'voting' | 'enacted';
}

interface Game {
  id: string;
  name: string;
  players: Player[];
  proposals: Proposal[];
  votes: Vote[];
  economy: Economy;
  turn: Turn;
  createdAt: string;
  updatedAt: string;
  contentRating: string;
  moderationEnabled: boolean;
  ageVerificationRequired: boolean;
  debates?: Debate[];
  speeches?: Speech[];
}

interface Debate {
  id: string;
  proposalId: string;
  speakingOrder: string[];
  currentSpeakerIndex: number;
  timeLimit: number;
  startedAt: string;
  createdAt: string;
  status: 'active' | 'completed';
}

interface Speech {
  id: string;
  debateId: string;
  speakerId: string;
  content: string;
  timestamp: string; // Match engine interface
}

interface ModerationResult {
  isSafe: boolean;
  reasons: string[];
  category?: string;
}

interface AgeVerificationStatus {
  verified: boolean;
  age: number | null;
}

interface Minister {
  id: string;
  userId: string;
  username: string;
  portfolio: string;
  appointedAt: string;
  status: 'active' | 'resigned' | 'dismissed';
}

interface Cabinet {
  id: string;
  primeMinisterId: string;
  primeMinisterName: string;
  party: string;
  formedAt: string;
  status: 'active' | 'dissolved';
  ministers: Minister[];
}

interface ExecutiveAction {
  id: string;
  ministerId: string;
  ministerName: string;
  portfolio: string;
  type: 'policy' | 'appointment' | 'budget' | 'emergency';
  title: string;
  description: string;
  status: 'proposed' | 'approved' | 'rejected' | 'implemented';
  createdAt: string;
}

interface Policy {
  id: string;
  title: string;
  description: string;
  portfolio: string;
  status: 'draft' | 'active' | 'suspended' | 'repealed';
  implementedAt?: string;
}

interface Judge {
  id: string;
  userId: string;
  username: string;
  court: 'supreme' | 'appeal' | 'high';
  appointedAt: string;
  status: 'active' | 'retired';
}

interface LegalCase {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  type: 'constitutional' | 'criminal' | 'civil' | 'administrative';
  court: 'supreme' | 'appeal' | 'high';
  plaintiff: string;
  defendant: string;
  filedBy: string;
  filedAt: string;
  status: 'filed' | 'hearing' | 'deliberation' | 'ruled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface Ruling {
  id: string;
  caseId: string;
  judgeId: string;
  judgeName: string;
  decision: 'upheld' | 'overturned' | 'dismissed' | 'remanded';
  reasoning: string;
  issuedAt: string;
  precedent: boolean;
}

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  publishedAt: string;
  views: number;
}

interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: number[];
  totalVotes: number;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'closed';
}

interface GameAction {
  type: 'propose' | 'start_debate' | 'speak' | 'vote' | 'advance_turn';
  playerId?: string;
  payload?: Record<string, unknown>;
}

let db: Database | null = null;
let games = new Map<string, Game>();

// Simple LRU cache for frequently accessed games (max 100 entries)
class LRUCache<T> {
  private cache = new Map<string, T>();
  private maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used
      const firstKey = this.cache.keys().next().value!;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

const gameCache = new LRUCache<Game>(100);

// Optimized game lookup with caching
function getGame(gameId: string): Game | undefined {
  // Check cache first
  let game = gameCache.get(gameId);
  if (game) {
    return game;
  }

  // Check main storage
  game = games.get(gameId);
  if (game) {
    // Cache for future lookups
    gameCache.set(gameId, game);
  }

  return game;
}

// Update cache when game is modified
function updateGameCache(gameId: string, game: Game): void {
  gameCache.set(gameId, game);
}

// Initialize structured logger
const executiveActions = new Map<string, ExecutiveAction[]>();
const policies = new Map<string, Policy[]>();

// Judiciary data
const judges = new Map<string, Judge>();
const cases = new Map<string, LegalCase>();
const rulings = new Map<string, Ruling[]>();

// Media data
const newsArticles = new Map<string, NewsArticle>();
const polls = new Map<string, Poll>();

// Configure CORS with secure origin allowlist
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000', // Frontend dev
      'http://localhost:3001', // Alternative frontend port
      'http://localhost:5173', // Vite dev server
    ];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS: Blocked request from unauthorized origin', { origin });
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true, // Allow cookies/auth headers
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

const app = express();
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Circuit breakers for external service calls
const moderationCircuitBreaker = new CircuitBreaker(5, 60000); // 5 failures, 1min timeout
const ageVerificationCircuitBreaker = new CircuitBreaker(3, 30000); // 3 failures, 30s timeout
const ageCheckAccessCircuitBreaker = new CircuitBreaker(3, 30000);

// Healthcheck
app.get('/healthz', (_: Request, res: Response) => res.json({ status: 'ok' }));

// Simple local moderation (scaffold) — regex-based checks for early compliance
function localModeration(text: string): ModerationResult {
  const reasons: string[] = [];
  const lower = (text || '').toLowerCase();

  // simple hate/violence patterns
  if (/\b(hate|kill|murder|terror|bomb|weapon)\b/.test(lower))
    reasons.push('Potential hate/violence');
  // child safety
  if (/\b(child|kid|minor).*(sex|porn|naked)\b/.test(lower)) reasons.push('Child safety');
  // profanity
  if (/\b(fuck|shit|bitch|asshole)\b/.test(lower)) reasons.push('Profanity');

  return { isSafe: reasons.length === 0, reasons };
}

// Remote moderation client with retries, auth and compliance logging
const MODERATION_ENDPOINT =
  process.env.API_MODERATION_URL ||
  (process.env.API_BASE_URL
    ? `${process.env.API_BASE_URL.replace(/\/$/, '')}/api/moderation/analyze`
    : 'http://localhost:4000/api/moderation/analyze');

async function remoteModeration(
  text: string,
  userId: string | null = null
): Promise<ModerationResult | null> {
  if (!MODERATION_ENDPOINT) return null;

  const apiKey = process.env.MODERATION_API_KEY || process.env.API_KEY || null;

  try {
    const result = await moderationCircuitBreaker.execute(async () => {
      const headers: Record<string, string> = {
        'content-type': 'application/json',
      };
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

      const res = await fetch(MODERATION_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: text, userId, type: 'text' }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '<no-body>');
        throw new Error(`Moderation API responded ${res.status}: ${body}`);
      }

      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        data?: ModerationResult;
      } | null;
      if (!data?.success || typeof data?.data?.isSafe !== 'boolean') {
        throw new Error('Invalid moderation API response format');
      }

      return data.data;
    });

    // Record the successful check for auditability (non-blocking)
    complianceClient
      .logEvent({
        category: 'content_moderation',
        action: 'moderation_checked',
        userId: userId ?? 'anonymous',
        resource: 'content_moderation',
        details: {
          endpoint: MODERATION_ENDPOINT,
          isSafe: result.isSafe,
          reasons: result.reasons || [],
          category: result.category || null,
        },
        complianceFrameworks: ['DSA'],
      })
      .catch(() => {});

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Moderation circuit breaker failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: MODERATION_ENDPOINT,
      userId,
    });

    // Record failure in compliance logs for audit
    await complianceClient
      .logEvent({
        category: 'content_moderation',
        action: 'moderation_api_failure',
        userId: 'system',
        resource: 'moderation_api',
        details: {
          endpoint: MODERATION_ENDPOINT,
          error: errorMessage,
        },
        complianceFrameworks: ['DSA'],
      })
      .catch(() => {});

    return null; // Circuit breaker will handle retries, return null on failure
  }
}

// Create a new game
app.post('/games', async (req: Request, res: Response) => {
  const { name } = req.body as { name?: string };
  if (!name) return res.status(400).json({ error: 'name is required' });

  const id = uuidv4();
  const now = new Date().toISOString();
  const game: Game = {
    id,
    name,
    players: [],
    proposals: [],
    votes: [],
    economy: { treasury: 100000, inflationRate: 0.02, unemploymentRate: 0.05 },
    turn: { turnNumber: 0, phase: 'lobby' },
    createdAt: now,
    updatedAt: now,
    contentRating: 'PG', // Default content rating
    moderationEnabled: true,
    ageVerificationRequired: true,
  };

  games.set(id, game);
  updateGameCache(id, game);

  // persist the new game
  if (db && typeof db.upsertGame === 'function') {
    await db.upsertGame(id, game);
  }

  // Log game creation for compliance
  await complianceClient.logGameCreated(
    id,
    (req.body as { userId?: string })?.userId ||
      ((req as AuthRequest).user as { id?: string } | undefined)?.id ||
      'anonymous',
    name
  );

  return res.status(201).json({ game });
});

// Age verification and access check endpoints
const AGE_STATUS_ENDPOINT = process.env.API_BASE_URL
  ? `${process.env.API_BASE_URL.replace(/\/$/, '')}/api/age/status`
  : 'http://localhost:4000/api/age/status';
const AGE_CHECK_ACCESS_ENDPOINT = process.env.API_BASE_URL
  ? `${process.env.API_BASE_URL.replace(/\/$/, '')}/api/age/check-access`
  : 'http://localhost:4000/api/age/check-access';

async function checkAgeVerification(userId: string): Promise<AgeVerificationStatus> {
  if (!AGE_STATUS_ENDPOINT) return { verified: false, age: null };

  try {
    const result = await ageVerificationCircuitBreaker.execute(async () => {
      const res = await fetch(AGE_STATUS_ENDPOINT, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userId}`, // Assuming userId is a token
          'content-type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!res.ok) {
        throw new Error(`Age verification API responded ${res.status}`);
      }

      const data = (await res.json()) as {
        success?: boolean;
        data?: AgeVerificationStatus;
      };
      if (!data.success) {
        throw new Error('Age verification API returned unsuccessful response');
      }

      return data.data as AgeVerificationStatus;
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Age verification circuit breaker failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: AGE_STATUS_ENDPOINT,
      userId,
    });
    return { verified: false, age: null };
  }
}

async function checkContentAccess(userId: string, contentRating: string): Promise<boolean> {
  if (!AGE_CHECK_ACCESS_ENDPOINT) return false;

  try {
    const result = await ageCheckAccessCircuitBreaker.execute(async () => {
      const res = await fetch(AGE_CHECK_ACCESS_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${userId}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ contentRating }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!res.ok) {
        throw new Error(`Age check access API responded ${res.status}`);
      }

      const data = (await res.json()) as {
        success?: boolean;
        data?: { canAccess: boolean };
      };
      if (!data.success) {
        throw new Error('Age check access API returned unsuccessful response');
      }

      return data.data?.canAccess ?? false;
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Age check access circuit breaker failed', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      endpoint: AGE_CHECK_ACCESS_ENDPOINT,
      userId,
      contentRating,
    });
    return false;
  }
}

// Join a game
app.post('/games/:id/join', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Game ID is required' });
  }

  const { displayName, userId } = req.body as {
    displayName?: string;
    userId?: string;
  };
  const game = getGame(id);
  if (!game) return res.status(404).json({ error: 'game not found' });
  if (!displayName) return res.status(400).json({ error: 'displayName is required' });

  // Check age verification if required
  if (game.ageVerificationRequired) {
    if (!userId) {
      return res.status(403).json({
        error: 'User ID required',
        message: 'You must be authenticated to join this game',
      });
    }

    const ageStatus = await checkAgeVerification(userId);
    if (!ageStatus.verified) {
      return res.status(403).json({
        error: 'Age verification required',
        message: 'You must verify your age to join this game',
      });
    }

    // Check content access
    const canAccess = await checkContentAccess(userId, game.contentRating || 'PG');
    if (!canAccess) {
      return res.status(403).json({
        error: 'Content access denied',
        message: 'This game content is not suitable for your age group',
      });
    }
  }

  const player: Player = {
    id: uuidv4(),
    displayName,
    createdAt: new Date().toISOString(),
    verifiedAge: userId ? (await checkAgeVerification(userId)).age : null,
    contentRating: game.contentRating || 'PG',
  };

  game.players.push(player);
  game.updatedAt = new Date().toISOString();
  games.set(id, game);
  updateGameCache(id, game);
  if (db && typeof db.upsertGame === 'function') {
    await db.upsertGame(id, game);
  }

  // Log player join for compliance
  await complianceClient.logPlayerJoined(id, userId || player.id, displayName);

  return res.status(200).json({ player, game });
});

// Get game state
app.get('/games/:id/state', (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Game ID is required' });
  }

  const game = getGame(id);
  if (!game) return res.status(404).json({ error: 'game not found' });
  return res.json({ game });
});

// List flagged proposals for a game (moderator view)
app.get('/games/:id/flags', (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Game ID is required' });
  }

  const game = games.get(id);
  if (!game) return res.status(404).json({ error: 'game not found' });
  const flagged = (game.proposals || []).filter(
    p => p.status === 'flagged' || p.moderationStatus === 'flagged'
  );
  return res.json({ flagged });
});

// Moderator review endpoint for flagged proposals
app.post('/games/:id/flags/:proposalId/review', async (req: Request, res: Response) => {
  const { id: gameId, proposalId } = {
    id: req.params.id,
    proposalId: req.params.proposalId,
  };

  if (!gameId) {
    return res.status(400).json({ error: 'Game ID is required' });
  }
  if (!proposalId) {
    return res.status(400).json({ error: 'Proposal ID is required' });
  }

  const { moderatorId, action, note } =
    (req.body as { moderatorId?: string; action?: string; note?: string }) || {};
  const game = games.get(gameId);
  if (!game) return res.status(404).json({ error: 'game not found' });

  const proposal = (game.proposals || []).find(p => p.id === proposalId);
  if (!proposal) return res.status(404).json({ error: 'proposal not found' });
  if (proposal.status !== 'flagged' && proposal.moderationStatus !== 'flagged') {
    return res.status(400).json({ error: 'proposal is not flagged for review' });
  }

  if (!moderatorId || !action)
    return res.status(400).json({ error: 'moderatorId and action are required' });

  if (action === 'approve') {
    proposal.status = 'voting';
    proposal.moderationStatus = 'approved';
    proposal.reviewedAt = new Date().toISOString();
    proposal.reviewedBy = moderatorId;
    proposal.reviewNote = note || null;
  } else if (action === 'reject') {
    proposal.status = 'rejected';
    proposal.moderationStatus = 'rejected';
    proposal.reviewedAt = new Date().toISOString();
    proposal.reviewedBy = moderatorId;
    proposal.reviewNote = note || null;
  } else {
    return res.status(400).json({ error: 'invalid action - must be "approve" or "reject"' });
  }

  game.updatedAt = new Date().toISOString();
  games.set(gameId, game);
  if (db && typeof db.upsertGame === 'function') await db.upsertGame(gameId, game);

  // Log moderation action
  await complianceClient.logModerationAction(
    proposalId,
    moderatorId,
    action,
    proposal.flaggedReasons || []
  );

  return res.json({ proposal });
});

// Submit player action (propose, start_debate, speak, vote, advance_turn) — integrated with deterministic engine
app.post('/games/:id/action', async (req: Request, res: Response) => {
  const gameId = req.params.id;
  if (!gameId) {
    return res.status(400).json({ error: 'Game ID is required' });
  }

  const game = getGame(gameId);
  if (!game) return res.status(404).json({ error: 'game not found' });

  const { action } = req.body as { action?: GameAction };
  if (!action || !action.type) return res.status(400).json({ error: 'action.type required' });

  // Handle propose with moderation first
  if (action.type === 'propose') {
    const { title, description, proposerId } = (action.payload || {}) as {
      title?: string;
      description?: string;
      proposerId?: string;
    };
    if (!title || !proposerId)
      return res.status(400).json({ error: 'title and proposerId are required' });

    const text = `${title}\n${description || ''}`;
    const remote = await remoteModeration(text, proposerId);
    const moderation = remote ?? localModeration(text);

    if (!moderation.isSafe) {
      // store flagged proposal for moderator review (audit trail)
      const flagged: Proposal = {
        id: uuidv4(),
        title,
        description: description || '',
        proposerId,
        createdAt: new Date().toISOString(),
        status: 'flagged',
        moderationStatus: 'flagged',
        flaggedReasons: moderation.reasons,
        contentRating: '18', // Flagged content gets highest rating
      };
      game.proposals.push(flagged);
      game.updatedAt = new Date().toISOString();
      games.set(gameId, game);
      updateGameCache(gameId, game);
      if (db && typeof db.upsertGame === 'function') await db.upsertGame(gameId, game);

      // Log flagged proposal
      await complianceClient.logProposalCreated(gameId, flagged.id, proposerId, title, true, true);

      return res.status(201).json({
        proposal: flagged,
        flagged: true,
        reasons: moderation.reasons,
      });
    }

    // Safe — apply via engine
    const newState = advanceGameState(game, [action as any], Date.now());
    games.set(gameId, newState);
    updateGameCache(gameId, newState);
    if (db && typeof db.upsertGame === 'function') await db.upsertGame(gameId, newState);
    const newProposal = newState.proposals[newState.proposals.length - 1];

    // Add null check for newProposal
    if (!newProposal) {
      return res.status(500).json({ error: 'Failed to create proposal' });
    }

    // Log successful proposal creation
    await complianceClient.logProposalCreated(
      gameId,
      newProposal.id,
      proposerId,
      title,
      true,
      false
    );

    return res.status(201).json({ proposal: newProposal, flagged: false, game: newState });
  }

  // Handle start_debate
  if (action.type === 'start_debate') {
    const { proposalId } = (action.payload || {}) as { proposalId?: string };
    if (!proposalId) return res.status(400).json({ error: 'proposalId required' });

    const newState = advanceGameState(game, [action as any], Date.now());
    games.set(gameId, newState);
    updateGameCache(gameId, newState);
    if (db && typeof db.upsertGame === 'function') await db.upsertGame(gameId, newState);
    const debate = (newState.debates || [])[
      newState.debates?.length ? newState.debates.length - 1 : 0
    ];

    return res.status(200).json({ debate, game: newState });
  }

  // Handle speak with moderation
  if (action.type === 'speak') {
    const { debateId, speakerId, content } = (action.payload || {}) as {
      debateId?: string;
      speakerId?: string;
      content?: string;
    };
    if (!debateId || !speakerId || !content)
      return res.status(400).json({ error: 'debateId, speakerId and content are required' });

    const remote = await remoteModeration(content, speakerId);
    const moderation = remote ?? localModeration(content);

    if (!moderation.isSafe) {
      return res.status(400).json({
        error: 'Speech content flagged for moderation',
        reasons: moderation.reasons,
      });
    }

    const newState = advanceGameState(game, [action as any], Date.now());
    games.set(gameId, newState);
    updateGameCache(gameId, newState);
    if (db && typeof db.upsertGame === 'function') await db.upsertGame(gameId, newState);
    const speech = (newState.speeches || [])[
      newState.speeches?.length ? newState.speeches.length - 1 : 0
    ];

    return res.status(200).json({ speech, game: newState });
  }

  // Votes and other actions are routed through the engine
  if (action.type === 'vote') {
    const { proposalId, playerId, choice } = (action.payload || {}) as {
      proposalId?: string;
      playerId?: string;
      choice?: string;
    };
    if (!proposalId || !playerId || !choice)
      return res.status(400).json({ error: 'proposalId, playerId and choice are required' });

    const newState = advanceGameState(game, [action as any], Date.now());
    games.set(gameId, newState);
    updateGameCache(gameId, newState);
    if (db && typeof db.upsertGame === 'function') await db.upsertGame(gameId, newState);
    const vote = newState.votes[newState.votes.length - 1];

    // Log vote for compliance
    await complianceClient.logVoteCast(gameId, proposalId, playerId, choice);

    return res.status(200).json({ vote, game: newState });
  }

  // Handle advance_turn
  if (action.type === 'advance_turn') {
    const newState = advanceGameState(game, [action as any], Date.now());
    games.set(gameId, newState);
    if (db && typeof db.upsertGame === 'function') await db.upsertGame(gameId, newState);

    return res.status(200).json({ game: newState });
  }

  return res.status(400).json({ error: `unknown action type: ${action.type}` });
});

// Government endpoints
app.get('/government', (_req: Request, res: Response) => {
  // For now, return a default government structure
  const defaultCabinet: Cabinet = {
    id: 'default-cabinet',
    primeMinisterId: 'system',
    primeMinisterName: 'Prime Minister',
    party: 'Government Party',
    formedAt: new Date().toISOString(),
    status: 'active',
    ministers: [
      {
        id: 'minister-1',
        userId: 'system',
        username: 'Minister of Health',
        portfolio: 'Health',
        appointedAt: new Date().toISOString(),
        status: 'active',
      },
    ],
  };

  const actions = executiveActions.get('default') || [];
  const policyList = policies.get('default') || [];

  return res.json({
    cabinet: defaultCabinet,
    actions,
    policies: policyList,
  });
});

app.post('/government/:id/actions', (req: Request, res: Response) => {
  const { id } = req.params;
  const { ministerId, type, title, description, portfolio } = req.body as {
    ministerId?: string;
    type?: string;
    title?: string;
    description?: string;
    portfolio?: string;
  };

  if (!ministerId || !type || !title || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const actionId = uuidv4();
  const action: ExecutiveAction = {
    id: actionId,
    ministerId,
    ministerName: 'Minister', // Would need to look up from users
    portfolio: portfolio || 'General',
    type: type as ExecutiveAction['type'],
    title,
    description,
    status: 'proposed',
    createdAt: new Date().toISOString(),
  };

  const existingActions = executiveActions.get(id) || [];
  existingActions.push(action);
  executiveActions.set(id, existingActions);

  return res.status(201).json({ id: actionId });
});

// Judiciary endpoints
app.get('/judiciary/cases', (req: Request, res: Response) => {
  const gameId = (req.query.gameId as string) || 'default';
  const gameCases = Array.from(cases.values()).filter(c => c.id.startsWith(gameId));
  const gameJudges = Array.from(judges.values()).filter(j => j.id.startsWith(gameId));

  return res.json({
    judges: gameJudges,
    cases: gameCases,
  });
});

app.post('/judiciary/cases', (req: Request, res: Response) => {
  const { plaintiffId, title, description, type, court, plaintiff, defendant, priority } =
    req.body as {
      gameId?: string;
      plaintiffId?: string | null;
      defendantId?: string | null;
      title: string;
      description: string;
      type: string;
      court: string;
      plaintiff: string;
      defendant: string;
      priority: string;
    };

  if (!title || !description || !type || !court || !plaintiff || !defendant) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const caseId = uuidv4();
  const caseNumber = `CASE-${Date.now()}`;
  const legalCase: LegalCase = {
    id: caseId,
    caseNumber,
    title,
    description,
    type: type as LegalCase['type'],
    court: court as LegalCase['court'],
    plaintiff,
    defendant,
    filedBy: plaintiffId || 'anonymous',
    filedAt: new Date().toISOString(),
    status: 'filed',
    priority: priority as LegalCase['priority'],
  };

  cases.set(caseId, legalCase);

  return res.status(201).json({
    id: caseId,
    title,
    description,
    type,
    createdAt: legalCase.filedAt,
  });
});

app.post('/judiciary/rulings', (req: Request, res: Response) => {
  const { caseId, judgeId, decision, reasoning, precedentSetting } = req.body as {
    caseId: string;
    judgeId: string;
    decision: string;
    reasoning: string;
    precedentSetting?: boolean;
    constitutionalImpact?: string;
  };

  if (!caseId || !judgeId || !decision || !reasoning) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const legalCase = cases.get(caseId);
  if (!legalCase) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const rulingId = uuidv4();
  const ruling: Ruling = {
    id: rulingId,
    caseId,
    judgeId,
    judgeName: 'Judge', // Would need to look up from judges
    decision: decision as Ruling['decision'],
    reasoning,
    issuedAt: new Date().toISOString(),
    precedent: precedentSetting || false,
  };

  const existingRulings = rulings.get(caseId) || [];
  existingRulings.push(ruling);
  rulings.set(caseId, existingRulings);

  // Update case status
  legalCase.status = 'ruled';
  cases.set(caseId, legalCase);

  return res.status(201).json({
    id: rulingId,
    caseId,
    decision,
    reasoning,
    issuedAt: ruling.issuedAt,
  });
});

// Media endpoints
app.post('/media/press', (req: Request, res: Response) => {
  const { title, content, author, category } = req.body as {
    title: string;
    content: string;
    author: string;
    category: string;
  };

  if (!title || !content || !author) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const articleId = uuidv4();
  const article: NewsArticle = {
    id: articleId,
    title,
    content,
    author,
    category: category || 'General',
    publishedAt: new Date().toISOString(),
    views: 0,
  };

  newsArticles.set(articleId, article);
  return res.status(201).json(article);
});

app.get('/media/press', (_req: Request, res: Response) => {
  const articles = Array.from(newsArticles.values());
  return res.json(articles);
});

app.get('/media/polls', (_req: Request, res: Response) => {
  const pollList = Array.from(polls.values());
  return res.json(pollList);
});

app.post('/media/polls/:id/vote', (req: Request, res: Response) => {
  const { id } = req.params;
  const { optionIndex } = req.body as { optionIndex: number };

  const poll = polls.get(id);
  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }

  if (poll.status === 'closed') {
    return res.status(400).json({ error: 'Poll is closed' });
  }

  if (optionIndex < 0 || optionIndex >= poll.options.length) {
    return res.status(400).json({ error: 'Invalid option index' });
  }

  poll.votes[optionIndex] = (poll.votes[optionIndex] || 0) + 1;
  poll.totalVotes += 1;
  polls.set(id, poll);

  return res.json(poll);
});

const PORT = process.env.PORT || 5100;

// Initialize sample data
function initializeSampleData() {
  // Sample judges
  const sampleJudge: Judge = {
    id: 'judge-1',
    userId: 'system',
    username: 'Chief Justice',
    court: 'supreme',
    appointedAt: new Date().toISOString(),
    status: 'active',
  };
  judges.set(sampleJudge.id, sampleJudge);

  // Sample news article
  const sampleArticle: NewsArticle = {
    id: 'article-1',
    title: 'Government Formed',
    content: 'A new government has been formed following recent elections.',
    author: 'News Agency',
    category: 'Politics',
    publishedAt: new Date().toISOString(),
    views: 0,
  };
  newsArticles.set(sampleArticle.id, sampleArticle);

  // Sample poll
  const samplePoll: Poll = {
    id: 'poll-1',
    question: 'Do you approve of the new government?',
    options: ['Yes', 'No', 'Undecided'],
    votes: [10, 5, 3],
    totalVotes: 18,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
  };
  polls.set(samplePoll.id, samplePoll);
}

// Start server after DB adapter is ready and games loaded
async function start(): Promise<void> {
  try {
    db = await dbReady;
    // load games from DB (works for both sync and async adapters)
    const loaded = await db.getAllGames();
    games = loaded || new Map();
    logger.info('Games loaded from database', { count: games.size });

    // Import legacy JSON store if present
    try {
      const legacy = path.join(__dirname, '..', 'data', 'games.json');
      if (fs.existsSync(legacy)) {
        const raw = fs.readFileSync(legacy, 'utf8');
        const obj = JSON.parse(raw) as Record<string, Game>;
        const entries = Object.entries(obj || {});
        for (const [id, value] of entries) {
          // if not already present, upsert into DB
          if (!games.has(id)) {
            await db.upsertGame(id, value);
            games.set(id, value);
          }
        }
        // rename legacy file after import
        try {
          fs.renameSync(legacy, legacy + '.imported');
        } catch {
          // Ignore rename errors
        }
        logger.info('Imported games from legacy JSON store', {
          count: entries.length,
          source: legacy,
        });
      }
    } catch (impErr) {
      const errorMessage = impErr instanceof Error ? impErr.message : String(impErr);
      logger.warn('Legacy JSON import failed', { error: errorMessage });
    }

    // Initialize sample data
    initializeSampleData();

    app.listen(Number(PORT), () =>
      logger.info('Game server started', { port: PORT, url: `http://localhost:${PORT}` })
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.fatal('Failed to start server - DB initialization error', {
      error: errorMessage,
      stack: err instanceof Error ? err.stack : undefined,
    });
    process.exit(1);
  }
}

start();
