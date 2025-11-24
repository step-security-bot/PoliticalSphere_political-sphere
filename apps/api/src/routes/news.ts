import express from 'express';
import type { Request, Response } from 'express';

import { NewsService } from '../news-service.js';
import { CreateNewsSchema, UpdateNewsSchema } from '../utils/shared-shim.js';

const router = express.Router();
const newsService = new NewsService();

function handleValidationError(
  res: Response,
  error: { message?: string; details?: unknown } | unknown
) {
  const err = error as { message?: string; details?: unknown };
  return res.status(400).json({
    success: false,
    error: err?.message || 'Invalid request',
    details: err?.details,
  });
}

/**
 * GET /news - List news items with optional filters (category, tag, search, limit)
 */
router.get('/news', async (req: Request, res: Response) => {
  try {
    const { category, tag, search, limit } = req.query;
    const options: { category?: string; tag?: string; search?: string; limit?: number } = {};

    if (category) {
      options.category = newsService.validateCategory(String(category));
    }

    if (tag) {
      if (/<|>|script/i.test(String(tag))) {
        return res.status(400).json({
          success: false,
          error: 'Invalid tag format',
        });
      }
      options.tag = String(tag);
    }

    if (search) {
      options.search = newsService.validateSearchQuery(String(search));
    }

    if (limit) {
      const limitValue = Number.parseInt(String(limit), 10);
      if (Number.isNaN(limitValue) || limitValue <= 0 || limitValue > newsService.maxLimit) {
        return res.status(400).json({
          success: false,
          error: `Invalid limit: must be between 1 and ${newsService.maxLimit}`,
        });
      }
      options.limit = limitValue;
    }

    const news = await newsService.list(options);
    return res.json({ success: true, data: news });
  } catch (error) {
    const err = error as { code?: string } | unknown;
    if (
      typeof (err as { code?: string })?.code === 'string' &&
      (err as { code?: string }).code === 'VALIDATION_ERROR'
    ) {
      return handleValidationError(res, error);
    }
    // eslint-disable-next-line no-console
    console.error('Error fetching news:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch news',
    });
  }
});

/**
 * POST /news - Create a news item
 */
router.post('/news', async (req: Request, res: Response) => {
  try {
    const input = CreateNewsSchema.parse(req.body);
    const newsItem = await newsService.create(input);
    return res.status(201).json({ success: true, data: newsItem });
  } catch (error) {
    const err = error as
      | { name?: string; errors?: Array<{ path: string[]; message: string }>; code?: string }
      | unknown;
    if ((err as { name?: string }).name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details:
          (err as { errors?: Array<{ path: string[]; message: string }> }).errors?.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })) || [],
      });
    }
    if (
      typeof (err as { code?: string })?.code === 'string' &&
      (err as { code?: string }).code === 'VALIDATION_ERROR'
    ) {
      return handleValidationError(res, error);
    }
    // eslint-disable-next-line no-console
    console.error('Error creating news:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create news item',
    });
  }
});

/**
 * GET /news/:id - Get a single news item by ID
 */
router.get('/news/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id?: string };
    if (!id) {
      return res.status(400).json({ success: false, error: 'Invalid id' });
    }
    const item = await newsService.getById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'News item not found',
      });
    }
    return res.json({ success: true, data: item });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching news item:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch news item',
    });
  }
});

/**
 * PUT /news/:id - Update a news item
 */
router.put('/news/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id?: string };
    if (!id) return res.status(400).json({ success: false, error: 'Invalid id' });
    const input = UpdateNewsSchema.parse(req.body);
    const updatedItem = await newsService.update(id, input);
    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'News item not found',
      });
    }
    return res.json({ success: true, data: updatedItem });
  } catch (error) {
    const err = error as
      | { name?: string; errors?: Array<{ path: string[]; message: string }>; code?: string }
      | unknown;
    if ((err as { name?: string }).name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: (err as { errors?: Array<{ path: string[]; message: string }> }).errors?.map(
          e => ({
            field: e.path.join('.'),
            message: e.message,
          })
        ),
      });
    }
    if (
      typeof (err as { code?: string })?.code === 'string' &&
      (err as { code?: string }).code === 'VALIDATION_ERROR'
    ) {
      return handleValidationError(res, error);
    }
    // eslint-disable-next-line no-console
    console.error('Error updating news:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update news item',
    });
  }
});

/**
 * GET /metrics/news - Return analytics summary for news items
 */
router.get('/metrics/news', async (_req: Request, res: Response) => {
  try {
    const summary = await newsService.analyticsSummary();
    return res.json({ success: true, data: summary });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching news metrics:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch news metrics',
    });
  }
});

/**
 * Express router exposing `/news` endpoints for listing, creating,
 * retrieving and updating news items as well as `/metrics/news` for
 * analytics. Routes use `NewsService` for validation and persistence.
 */
/**
 * Default `express.Router` for news endpoints.
 *
 * Exposes listing, creation and metrics endpoints for news and articles.
 */
export default router;
