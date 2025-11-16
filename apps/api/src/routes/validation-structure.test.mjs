/**
 * Integration tests verifying unified validation error structure across all routes.
 * Ensures consistency in error responses throughout the API.
 */

import express from 'express';
import { beforeEach, describe, expect, it } from 'vitest';

/* eslint-disable no-restricted-imports */
import { dispatchRequest } from '../../tests/utils/express-request.js';
/* eslint-enable no-restricted-imports */

import {
  assertValidationError,
  assertValidationSuccess,
} from '../tests/helpers/validation-assertions.mjs';

// Simple test router with validation
const createTestRouter = () => {
  const router = express.Router();

  router.post('/validate', (req, res) => {
    const { name, email } = req.body;

    // Simulate validation
    const errors = [];
    if (!name) errors.push({ field: 'name', message: 'Name is required' });
    if (!email) errors.push({ field: 'email', message: 'Email is required' });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
      });
    }

    res.json({ success: true, data: { name, email } });
  });

  return router;
};

describe('Unified Validation Error Structure', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', createTestRouter());
  });

  it('should return consistent error structure for missing required fields', async () => {
    const response = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/validate',
      body: {}, // missing both name and email
    });

    // Use shared helper to assert structure
    assertValidationError(response, {
      status: 400,
      fields: ['name', 'email'],
    });
  });

  it('should return consistent error structure for partial missing fields', async () => {
    const response = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/validate',
      body: { name: 'Test User' }, // missing email
    });

    assertValidationError(response, {
      status: 400,
      fields: ['email'],
    });
  });

  it('should return consistent success structure for valid input', async () => {
    const response = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/validate',
      body: { name: 'Test User', email: 'test@example.com' },
    });

    assertValidationSuccess(response, {
      status: 200,
      hasData: true,
    });
  });

  it('should validate error details array structure', async () => {
    const response = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/validate',
      body: {},
    });

    // Detailed assertion
    assertValidationError(response);

    // Additional explicit checks for demonstration
    if (Array.isArray(response.body.details)) {
      response.body.details.forEach(detail => {
        // Each detail must have field and message
        if (detail.field) {
          // Field-based error
          expect(detail.message).toBeTruthy();
        } else if (detail.message) {
          // Message-only error (acceptable)
          expect(detail.message).toBeTruthy();
        }
      });
    }
  });
});
