/**
 * DSAR Handler Tests
 *
 * Tests for GDPR Data Subject Access Request handling.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { DSARHandler } from '../../src/privacy/dsar-handler';

describe('DSARHandler', () => {
  let handler: DSARHandler;

  beforeEach(() => {
    handler = new DSARHandler();
  });

  it('should process access request', async () => {
    const result = await handler.handleAccessRequest({
      userId: 'user-123',
      requestType: 'access',
      requestedAt: new Date(),
    });

    expect(result).toBeDefined();
    expect(result.status).toBeDefined();
  });

  it('should process erasure request', async () => {
    const result = await handler.handleErasureRequest({
      userId: 'user-456',
      requestType: 'erasure',
      requestedAt: new Date(),
    });

    expect(result).toBeDefined();
    expect(result.status).toBeDefined();
  });

  it('should validate 30-day deadline', () => {
    const request = {
      userId: 'user-789',
      requestType: 'access' as const,
      requestedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
    };

    const deadline = handler.calculateDeadline(request);
    expect(deadline).toBeDefined();
    expect(deadline.daysRemaining).toBeLessThan(6);
  });
});
