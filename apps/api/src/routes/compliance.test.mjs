import express from 'express';
import assert from 'node:assert';
import { beforeEach, describe, it } from 'vitest';

import { dispatchRequest } from '../../tests/utils/express-request.js';

// Mock compliance service
const mockComplianceService = {
  logComplianceEvent: () => `event-${Date.now()}`,
  generateBreachNotification: details => ({
    breachId: `breach-${Date.now()}`,
    ...details,
  }),
};

// Create test router
const createTestRouter = () => {
  const router = express.Router();

  router.post('/events', async (req, res) => {
    try {
      const eventData = req.body;

      // Validate required fields
      const requiredFields = ['category', 'action'];
      const missingFields = requiredFields.filter(field => !eventData[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: `Required fields: ${missingFields.join(', ')}`,
        });
      }

      const eventId = mockComplianceService.logComplianceEvent(eventData);
      res.json({ success: true, data: { eventId } });
    } catch {
      res.status(500).json({ success: false, error: 'Event logging failed' });
    }
  });

  router.post('/breach-notification', async (req, res) => {
    try {
      const breachDetails = req.body;

      // Validate required breach details
      const requiredFields = ['date', 'time', 'categories', 'approximateNumber'];
      const missingFields = requiredFields.filter(field => !breachDetails[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required breach details',
          message: `Required fields: ${missingFields.join(', ')}`,
        });
      }

      const notification = mockComplianceService.generateBreachNotification(breachDetails);
      res.json({ success: true, data: notification });
    } catch {
      res.status(500).json({ success: false, error: 'Breach notification generation failed' });
    }
  });

  return router;
};

describe('Compliance Routes Validation', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/compliance', createTestRouter());
  });

  it('POST /api/compliance/events should return validation error for missing category', async () => {
    const response = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/compliance/events',
      body: { action: 'test_action' }, // missing category
    });
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.error, 'Missing required fields');
    assert(response.body.message.includes('category'));
  });

  it('POST /api/compliance/events should accept valid input', async () => {
    const response = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/compliance/events',
      body: { category: 'data_access', action: 'user_login' },
    });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
    assert(response.body.data.eventId);
  });

  it('POST /api/compliance/breach-notification should return validation error for missing fields', async () => {
    const response = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/compliance/breach-notification',
      body: { date: '2025-11-16' }, // missing time, categories, approximateNumber
    });
    assert.strictEqual(response.status, 400);
    assert.strictEqual(response.body.success, false);
    assert.strictEqual(response.body.error, 'Missing required breach details');
    assert(response.body.message.includes('time'));
    assert(response.body.message.includes('categories'));
    assert(response.body.message.includes('approximateNumber'));
  });

  it('POST /api/compliance/breach-notification should accept complete breach details', async () => {
    const response = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/compliance/breach-notification',
      body: {
        date: '2025-11-16',
        time: '14:30',
        categories: ['personal_data'],
        approximateNumber: 100,
      },
    });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.body.success, true);
    assert(response.body.data.breachId);
  });
});
