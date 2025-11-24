import express from 'express';
import assert from 'node:assert';
import { beforeEach, describe, it } from 'vitest';

// eslint-disable-next-line no-restricted-imports
import { dispatchRequest } from '../../tests/utils/express-request.js';
import { CompleteVerificationSchema, InitiateVerificationSchema } from '../utils/shared-shim.js';

// Mock age verification service
const mockAgeVerificationService = {
  initiateVerification: (_userId, method) => ({
    success: true,
    verificationId: 'test-verification-id',
    method,
  }),
  completeVerification: (verificationId, _data) => ({
    success: true,
    verificationId,
    age: 18,
    confidence: 0.95,
  }),
};

// Create test router
const createTestRouter = _unused => {
  const router = express.Router();

  router.post('/initiate', async (req, res) => {
    try {
      const input = InitiateVerificationSchema.parse(req.body);
      const userId = req.user?.id || 'anonymous';
      const result = mockAgeVerificationService.initiateVerification(userId, input.method);

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
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
      res.status(500).json({ success: false, error: 'Verification initiation failed' });
    }
  });

  router.post('/verify', async (req, res) => {
    try {
      const input = CompleteVerificationSchema.parse(req.body);
      const result = mockAgeVerificationService.completeVerification(input.verificationId, input);

      if (result.success) {
        res.json({ success: true, data: result });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
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
      res.status(500).json({ success: false, error: 'Verification failed' });
    }
  });

  return router;
};

describe('Age Verification Routes Validation', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/age', createTestRouter());
  });

  it('POST /api/age/initiate should accept valid method', async () => {
    const response = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/age/initiate',
      body: { method: 'self_declaration' },
    });
    assert.strictEqual(response.status, 200);
    assert(response.body);
  });

  it('POST /api/age/verify should return validation error for missing verificationId', async () => {
    const response = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/age/verify',
      body: { documentType: 'passport' }, // missing verificationId
    });
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.error, 'Validation failed');
  });

  it('Schema: InitiateVerificationSchema allows empty input (all fields optional)', () => {
    const _result = InitiateVerificationSchema.parse({});
    assert(_result);
  });

  it('Schema: CompleteVerificationSchema should reject missing verificationId', () => {
    try {
      CompleteVerificationSchema.parse({ documentType: 'passport' });
      assert.fail('Expected validation error');
    } catch (err) {
      assert.strictEqual(err.name, 'Error');
      assert(err.message.includes('verificationId'));
    }
  });
});
