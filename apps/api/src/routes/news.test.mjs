import express from 'express';
import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'vitest';

import { dispatchRequest } from '../../tests/utils/express-request.js';
import { CreateNewsSchema, UpdateNewsSchema } from '../utils/shared-shim.js';

// Mock the news service to avoid file system dependency
const mockNewsService = {
  list: () => [],
  create: data => ({ id: 'test-id', ...data, createdAt: new Date().toISOString() }),
  getById: id => ({ id, title: 'Test', content: 'Content', category: 'politics' }),
  update: (id, data) => ({ id, ...data }),
  analyticsSummary: () => ({ totalNews: 0 }),
  validateCategory: cat => cat,
  validateSearchQuery: q => q,
  maxLimit: 100,
};

// Create a minimal router for testing validation only
const createTestRouter = () => {
  const router = express.Router();

  router.post('/news', async (req, res) => {
    try {
      const input = CreateNewsSchema.parse(req.body);
      const newsItem = mockNewsService.create(input);
      res.status(201).json({ success: true, data: newsItem });
    } catch (error) {
      if (
        error.name === 'ZodError' ||
        error.message === 'Input must be an object' ||
        error.message.startsWith('Missing required field')
      ) {
        const details = Array.isArray(error.errors)
          ? error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
          : [{ field: 'input', message: error.message }];
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details,
        });
      }
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  router.put('/news/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const input = UpdateNewsSchema.parse(req.body);
      const updatedItem = mockNewsService.update(id, input);
      res.json({ success: true, data: updatedItem });
    } catch (error) {
      if (
        error.name === 'ZodError' ||
        error.message === 'Input must be an object' ||
        error.message.startsWith('Missing required field')
      ) {
        const details = Array.isArray(error.errors)
          ? error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
          : [{ field: 'input', message: error.message }];
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details,
        });
      }
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  return router;
};

describe('News Routes Validation', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', createTestRouter());
  });

  afterEach(() => {
    // Cleanup if needed
  });

  it('POST /api/news should return validation error for missing required fields', async () => {
    const response = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/news',
      body: { title: 'Test' }, // missing content and category
    });
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.error, 'Validation failed');
    assert(Array.isArray(response.body.details));
  });

  it('PUT /api/news/:id should accept valid updates', async () => {
    const response = await dispatchRequest(app, {
      method: 'PUT',
      url: '/api/news/test-id',
      body: { title: 'Updated Title' },
    });
    // UpdateNewsSchema allows optional updates (stub doesn't enforce "at least one")
    assert.strictEqual(response.status, 200);
    // Response structure depends on mock implementation
    assert(response.body);
  });

  it('Schema: CreateNewsSchema should reject missing required fields', () => {
    try {
      CreateNewsSchema.parse({ title: 'Test', category: 'politics' }); // missing content
      assert.fail('Expected validation error');
    } catch (err) {
      assert.strictEqual(err.name, 'Error');
      assert(err.message.includes('content'));
    }
  });

  it('Schema: UpdateNewsSchema validates successfully with at least one field', () => {
    // UpdateNewsSchema allows optional updates
    const result = UpdateNewsSchema.parse({ title: 'Updated Title' });
    assert(result);
    assert.strictEqual(result.title, 'Updated Title');
  });
});
