import express from 'express';
import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'vitest';

/* eslint-disable no-restricted-imports */
import { getTestToken } from '../../tests/helpers/auth-token.mjs';
import { dispatchRequest } from '../../tests/utils/express-request.js';
/* eslint-enable no-restricted-imports */
import authRoutes from '../auth/auth.routes.ts';
import { closeDatabase, getDatabase } from '../stores/index.ts';
import { CreateReportSchema, ReviewContentSchema } from '../utils/shared-shim.js';
import moderationRouter from './moderation.js';
import usersRouter from './users.js';

// NOTE: Tests focus on validation error responses and happy path basic behavior.

describe('Moderation Routes Validation', () => {
  let app;
  let _authToken;

  beforeEach(async () => {
    getDatabase();
    app = express();
    app.enable('trust proxy');
    app.use(express.json());
    app.use('/api', usersRouter);
    app.use('/api/moderation', moderationRouter);
    app.use('/auth', authRoutes);
    const { token } = await getTestToken(app);
    _authToken = token;
  });

  afterEach(() => {
    closeDatabase();
  });

  it('POST /api/moderation/analyze should return validation error for missing content', async () => {
    const response = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/moderation/analyze',
      body: { type: 'text' }, // missing required content
    });
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.error, 'Validation failed');
    assert(Array.isArray(response.body.details));
    const contentError = response.body.details.find(
      d => d.field === 'content' || d.field === 'input'
    );
    assert(contentError);
  });

  it('Schema: CreateReportSchema should reject missing required fields', () => {
    try {
      CreateReportSchema.parse({ reason: 'Too short', category: 'spam' }); // missing contentId
      assert.fail('Expected validation error');
    } catch (err) {
      assert.strictEqual(err.name, 'Error');
    }
  });

  it('Schema: ReviewContentSchema should reject invalid decision', () => {
    try {
      ReviewContentSchema.parse({ notes: 'Test' }); // missing decision
      assert.fail('Expected validation error');
    } catch (err) {
      assert.strictEqual(err.name, 'Error');
    }
  });
});
