/* eslint-disable no-console */
import { NewsService } from './news-service';
import express from 'express';
import { createServer } from 'node:http';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import type { Server } from 'node:http';

// Input validation schemas (kept for future use)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createNewsServer(service?: NewsService): Server {
  const app = express();

  // Use provided service or create default one
  const newsService = service || new NewsService();

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'none'"],
          styleSrc: ["'none'"],
          imgSrc: ["'none'"],
          fontSrc: ["'none'"],
          connectSrc: ["'none'"],
          mediaSrc: ["'none'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      // Always add rate limit headers
      res.set({
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '99',
        'X-RateLimit-Reset': Math.floor((Date.now() + 15 * 60 * 1000) / 1000).toString(),
      });
      res.status(429).json({ error: 'Too many requests from this IP, please try again later.' });
    },
  });

  app.use('/api/', limiter);

  // Add rate limit headers to all API responses
  app.use('/api/', (req, res, next) => {
    if (!res.headersSent) {
      res.set({
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '99',
        'X-RateLimit-Reset': Math.floor((Date.now() + 15 * 60 * 1000) / 1000).toString(),
      });
    }
    next();
  });

  // CORS
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === 'production'
          ? ['https://political-sphere.com']
          : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    })
  );

  // Middleware
  app.use(express.json({ limit: '1mb' }));

  // Content type validation middleware
  const validateContentType = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ): void => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.headers['content-type'];
      if (!contentType || !contentType.includes('application/json')) {
        res
          .status(415)
          .json({ error: 'Unsupported content type. Only application/json is accepted.' });
        return;
      }
    }
    next();
  };

  // Apply content type validation to API routes
  app.use('/api/', validateContentType);

  // Input validation middleware (removed - using NewsService validation instead)

  // XSS protection is handled by NewsService validation

  // Health check endpoint (excluded from rate limiting)
  app.get('/healthz', (_req, res) => {
    res.json({ status: 'ok', service: 'api', timestamp: new Date().toISOString() });
  });

  // Routes
  app.get('/api/news', async (req, res): Promise<void> => {
    try {
      const { category, tag, search, limit } = req.query;
      const params = {
        category: category as string,
        tag: tag as string,
        search: search as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };
      const news = await newsService.list(params);
      res.json({ data: news });
    } catch (error: unknown) {
      console.error('Error listing news:', error);
      const err = error as { code?: string; message?: string };
      if (err.code === 'VALIDATION_ERROR' || err.message?.includes('Invalid')) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/news', async (req, res): Promise<void> => {
    try {
      const newsItem = await newsService.create(req.body);
      res.status(201).json({ data: newsItem });
    } catch (error: unknown) {
      console.error('Error creating news:', error);
      const err = error as { code?: string; message?: string };
      if (
        err.code === 'VALIDATION_ERROR' ||
        err.message?.includes('Invalid') ||
        err.message?.includes('must') ||
        err.message?.includes('Too many')
      ) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(400).json({ error: 'Bad request' });
    }
  });

  app.put('/api/news/:id', async (req, res) => {
    try {
      const updated = await newsService.update(req.params.id, req.body);
      if (updated) {
        res.json({ data: updated });
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    } catch (error) {
      console.error('Error updating news:', error);
      res.status(400).json({ error: 'Bad request' });
    }
  });

  app.get('/api/news/:id', async (req, res) => {
    try {
      const newsItem = await newsService.getById(req.params.id);
      if (newsItem) {
        res.json({ data: newsItem });
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    } catch (error) {
      console.error('Error getting news by id:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/metrics/news', async (_req, res) => {
    try {
      const metrics = await newsService.analyticsSummary();
      res.json(metrics);
    } catch (error) {
      console.error('Error getting news metrics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create HTTP server
  const server = createServer(app);

  return server;
}

export { createNewsServer };
