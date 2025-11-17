/**
 * Express App (without server listen) for testing and composition
 */
import cors from 'cors';
import express from 'express';
import expressRateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './auth/auth.routes.ts';
import gameRoutes from './game/game.routes.ts';

export const createApp = () => {
  const app = express();

  // General rate limiting - applies to all routes
  const generalLimiter = expressRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per 15 minutes
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skip: req => req.path === '/health', // Health checks don't count
  });
  app.use(generalLimiter);

  // Strict rate limiting for authentication routes (prevent brute force)
  const authLimiter = expressRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 attempts per 15 minutes
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful logins
  });
  app.use('/auth/login', authLimiter);
  app.use('/auth/register', authLimiter);

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: true,
    })
  );

  // Logging
  app.use(morgan('combined'));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'api',
    });
  });

  // Simulation state endpoint (stub for now)
  app.get('/simulation/state', (_req, res) => {
    res.json({
      success: true,
      data: {
        currentDay: 1,
        simulationSpeed: 1,
        isPaused: false,
        timestamp: new Date().toISOString(),
        stats: {
          totalPlayers: 0,
          activeBills: 0,
          activeVotes: 0,
        },
      },
    });
  });

  // Parliament chambers endpoint (stub for now)
  app.get('/parliament/chambers', (_req, res) => {
    res.json({
      success: true,
      data: [],
    });
  });

  // Government endpoints (stubs for now)
  app.get('/government', (_req, res) => {
    res.json({
      success: true,
      data: null,
    });
  });

  app.post('/government', (_req, res) => {
    res.json({
      success: true,
      data: { id: '1', name: 'Government', createdAt: new Date().toISOString() },
    });
  });

  app.post('/government/:id/ministers', (_req, res) => {
    res.json({
      success: true,
      data: { id: '1', appointed: true },
    });
  });

  app.post('/government/:id/actions', (_req, res) => {
    res.json({
      success: true,
      data: { id: '1', executed: true },
    });
  });

  // Judiciary endpoints (stubs for now)
  app.get('/judiciary/cases', (_req, res) => {
    res.json({
      success: true,
      data: [],
    });
  });

  app.post('/judiciary/cases', (_req, res) => {
    res.json({
      success: true,
      data: { id: '1', caseNumber: 'CASE-001', createdAt: new Date().toISOString() },
    });
  });

  app.post('/judiciary/cases/:id/ruling', (_req, res) => {
    res.json({
      success: true,
      data: { id: '1', ruled: true },
    });
  });

  // Media endpoints (stubs for now) - in-memory arrays for quick iteration
  const pressReleases: Array<{
    id: string;
    title: string;
    content: string;
    author: string;
    category: string;
    publishedAt: string;
    views: number;
  }> = [];
  const polls: Array<{
    id: string;
    question: string;
    options: string[];
    votes: number[];
    totalVotes: number;
    createdAt: string;
    expiresAt: string;
    status: 'active' | 'closed';
  }> = [];

  app.get('/media/press', (_req, res) => {
    res.json({ success: true, data: pressReleases });
  });
  // Duplicate under /api prefix for dev proxy mismatch resilience
  app.get('/api/media/press', (_req, res) => {
    res.json({ success: true, data: pressReleases });
  });

  app.post('/media/press', (req, res) => {
    const body = req.body || {};
    const item = {
      id: String(Date.now()),
      title: body.title || 'Untitled',
      content: body.content || 'No content provided.',
      author: body.author || 'system',
      category: body.category || 'general',
      publishedAt: new Date().toISOString(),
      views: 0,
    };
    pressReleases.unshift(item); // newest first
    res.json({ success: true, data: item });
  });
  app.post('/api/media/press', (req, res) => {
    const body = req.body || {};
    const item = {
      id: String(Date.now()),
      title: body.title || 'Untitled',
      content: body.content || 'No content provided.',
      author: body.author || 'system',
      category: body.category || 'general',
      publishedAt: new Date().toISOString(),
      views: 0,
    };
    pressReleases.unshift(item);
    res.json({ success: true, data: item });
  });

  app.get('/media/polls', (_req, res) => {
    res.json({ success: true, data: polls });
  });
  app.get('/api/media/polls', (_req, res) => {
    res.json({ success: true, data: polls });
  });

  app.post('/media/polls', (req, res) => {
    const body = req.body || {};
    const poll = {
      id: String(Date.now()),
      question: body.question || 'Untitled poll',
      options:
        Array.isArray(body.options) && body.options.length > 0
          ? body.options
          : ['Option A', 'Option B'],
      votes: [0, 0],
      totalVotes: 0,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // +1 day
      status: 'active' as const,
    };
    // Ensure votes array matches options length
    poll.votes = poll.options.map(() => 0);
    polls.unshift(poll);
    res.json({ success: true, data: poll });
  });
  app.post('/api/media/polls', (req, res) => {
    const body = req.body || {};
    const poll = {
      id: String(Date.now()),
      question: body.question || 'Untitled poll',
      options:
        Array.isArray(body.options) && body.options.length > 0
          ? body.options
          : ['Option A', 'Option B'],
      votes: [0, 0],
      totalVotes: 0,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'active' as const,
    };
    poll.votes = poll.options.map(() => 0);
    polls.unshift(poll);
    res.json({ success: true, data: poll });
  });

  app.post('/media/polls/:id/vote', (req, res) => {
    const { id } = req.params;
    const { optionIndex } = req.body || {};
    const poll = polls.find(p => p.id === id);
    if (!poll) {
      return res.status(404).json({ success: false, error: 'Poll not found' });
    }
    if (poll.status === 'closed') {
      return res.status(400).json({ success: false, error: 'Poll is closed' });
    }
    if (typeof optionIndex !== 'number' || optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ success: false, error: 'Invalid option index' });
    }
    poll.votes[optionIndex] += 1;
    poll.totalVotes += 1;
    res.json({ success: true, data: poll });
  });
  app.post('/api/media/polls/:id/vote', (req, res) => {
    const { id } = req.params;
    const { optionIndex } = req.body || {};
    const poll = polls.find(p => p.id === id);
    if (!poll) {
      return res.status(404).json({ success: false, error: 'Poll not found' });
    }
    if (poll.status === 'closed') {
      return res.status(400).json({ success: false, error: 'Poll is closed' });
    }
    if (typeof optionIndex !== 'number' || optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ success: false, error: 'Invalid option index' });
    }
    poll.votes[optionIndex] += 1;
    poll.totalVotes += 1;
    res.json({ success: true, data: poll });
  });

  // Elections endpoints (stubs for now)
  const elections: Array<{
    id: string;
    name: string;
    electionType: string;
    startDate: string;
    endDate: string;
    status: 'upcoming' | 'active' | 'completed';
    gameId?: string;
  }> = [];
  const constituencies: Array<{ id: string; name: string; electionId: string }> = [];
  const candidates: Array<{
    id: string;
    name: string;
    party: string;
    constituencyId: string;
    electionId: string;
  }> = [];

  app.get('/elections', (_req, res) => {
    res.json({ success: true, data: elections });
  });

  app.get('/api/elections', (req, res) => {
    const { gameId } = req.query;
    const filtered = gameId ? elections.filter(e => e.gameId === gameId) : elections;
    res.json({ success: true, data: filtered });
  });

  app.post('/elections', (req, res) => {
    const body = req.body || {};
    const election = {
      id: String(Date.now()),
      name: body.name || 'General Election',
      electionType: body.electionType || 'general',
      startDate: body.startDate || new Date().toISOString(),
      endDate: body.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'upcoming' as const,
      gameId: body.gameId,
    };
    elections.unshift(election);
    res.json({ success: true, data: election });
  });

  app.post('/api/elections', (req, res) => {
    const body = req.body || {};
    const election = {
      id: String(Date.now()),
      name: body.name || 'General Election',
      electionType: body.electionType || 'general',
      startDate: body.startDate || new Date().toISOString(),
      endDate: body.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'upcoming' as const,
      gameId: body.gameId,
    };
    elections.unshift(election);
    res.json({ success: true, data: election });
  });

  app.get('/elections/:id/constituencies', (req, res) => {
    const { id } = req.params;
    const filtered = constituencies.filter(c => c.electionId === id);
    res.json({ success: true, data: filtered });
  });

  app.get('/api/elections/:id/constituencies', (req, res) => {
    const { id } = req.params;
    const filtered = constituencies.filter(c => c.electionId === id);
    res.json({ success: true, data: filtered });
  });

  app.get('/elections/:id/candidates', (req, res) => {
    const { id } = req.params;
    const { constituencyId } = req.query;
    let filtered = candidates.filter(c => c.electionId === id);
    if (constituencyId) {
      filtered = filtered.filter(c => c.constituencyId === constituencyId);
    }
    res.json({ success: true, data: filtered });
  });

  app.get('/api/elections/:id/candidates', (req, res) => {
    const { id } = req.params;
    const { constituencyId } = req.query;
    let filtered = candidates.filter(c => c.electionId === id);
    if (constituencyId) {
      filtered = filtered.filter(c => c.constituencyId === constituencyId);
    }
    res.json({ success: true, data: filtered });
  });

  app.post('/elections/:id/candidates', (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const candidate = {
      id: String(Date.now()),
      name: body.name || 'Independent Candidate',
      party: body.party || 'Independent',
      constituencyId: body.constituencyId || 'default',
      electionId: id,
    };
    candidates.unshift(candidate);
    res.json({ success: true, data: candidate });
  });

  app.post('/api/elections/:id/candidates', (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const candidate = {
      id: String(Date.now()),
      name: body.name || 'Independent Candidate',
      party: body.party || 'Independent',
      constituencyId: body.constituencyId || 'default',
      electionId: id,
    };
    candidates.unshift(candidate);
    res.json({ success: true, data: candidate });
  });

  app.post('/elections/:id/vote', (_req, res) => {
    res.json({ success: true, data: { voted: true } });
  });

  app.post('/api/elections/:id/vote', (_req, res) => {
    res.json({ success: true, data: { voted: true } });
  });

  // Routes
  app.use('/auth', authRoutes);
  app.use('/game', gameRoutes);

  // 404 handler (placed before error handler to allow custom errors)
  app.use((_req, res, next) => {
    if (res.headersSent) return next();
    res.status(404).json({ error: 'Not found' });
  });

  // Error handler
  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      // Log errors only in development to prevent information leakage
      if (process.env.NODE_ENV === 'development') {
        console.error('Unhandled error:', err);
      }
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  );

  return app;
};

export const app = createApp();
