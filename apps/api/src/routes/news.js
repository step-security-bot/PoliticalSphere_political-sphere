import express from 'express';

import { FileNewsStore, NewsService } from '../news-service.js';
import { CreateNewsSchema, UpdateNewsSchema } from '../utils/shared-shim.js';

const router = express.Router();
const newsService = new NewsService(new FileNewsStore());

function handleValidationError(res, error) {
  return res.status(400).json({
    success: false,
    error: error?.message || 'Invalid request',
    details: error?.details,
  });
}

router.get('/news', async (req, res) => {
  try {
    const { category, tag, search, limit } = req.query;
    const options = {};

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
    res.json({ success: true, data: news });
  } catch (error) {
    if (error?.code === 'VALIDATION_ERROR') {
      return handleValidationError(res, error);
    }
    console.error('Error fetching news:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch news',
    });
  }
});

router.post('/news', async (req, res) => {
  try {
    const input = CreateNewsSchema.parse(req.body);
    const newsItem = await newsService.create(input);
    res.status(201).json({ success: true, data: newsItem });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    if (error?.code === 'VALIDATION_ERROR') {
      return handleValidationError(res, error);
    }
    console.error('Error creating news:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create news item',
    });
  }
});

router.get('/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await newsService.getById(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'News item not found',
      });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error fetching news item:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch news item',
    });
  }
});

router.put('/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const input = UpdateNewsSchema.parse(req.body);
    const updatedItem = await newsService.update(id, input);
    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'News item not found',
      });
    }
    res.json({ success: true, data: updatedItem });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    if (error?.code === 'VALIDATION_ERROR') {
      return handleValidationError(res, error);
    }
    console.error('Error updating news:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update news item',
    });
  }
});

router.get('/metrics/news', async (_req, res) => {
  try {
    const summary = await newsService.analyticsSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error fetching news metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch news metrics',
    });
  }
});

export default router;
