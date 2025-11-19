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

  it('should create DSAR request', () => {
    const request = handler.createRequest('access', 'user-123', 'user@example.com');

    expect(request).toBeDefined();
    expect(request.requestId).toMatch(/^dsar-\d+-[a-z0-9]+$/);
    expect(request.type).toBe('access');
    expect(request.userId).toBe('user-123');
    expect(request.email).toBe('user@example.com');
    expect(request.status).toBe('pending');
  });

  it('should process access request directly', async () => {
    const request = handler.createRequest('access', 'user-123', 'user@example.com');
    const result = await handler.processAccessRequest(request.requestId);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.userId).toBe('user-123');
  });

  it('should handle invalid access request ID', async () => {
    const result = await handler.processAccessRequest('invalid-id');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Request not found');
  });

  it('should process erasure request directly', async () => {
    const request = handler.createRequest('erasure', 'user-456', 'user@example.com');
    const result = await handler.processErasureRequest(request.requestId);

    expect(result.success).toBe(true);
    expect(result.deletedRecords).toBeGreaterThan(0);
    expect(result.retainedRecords).toBeDefined();
  });

  it('should handle invalid erasure request ID', async () => {
    const result = await handler.processErasureRequest('invalid-id');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Request not found');
  });

  it('should process portability request', async () => {
    const request = handler.createRequest('portability', 'user-123', 'user@example.com');
    const result = await handler.processPortabilityRequest(request.requestId);

    expect(result.success).toBe(true);
    expect(result.exportFormat).toBe('JSON');
    expect(result.data).toBeDefined();
  });

  it('should handle invalid portability request ID', async () => {
    const result = await handler.processPortabilityRequest('invalid-id');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Request not found');
  });

  it('should process rectification request', async () => {
    const request = handler.createRequest('rectification', 'user-123', 'user@example.com');
    const result = await handler.processRectificationRequest(request.requestId, { email: 'new@example.com' });

    expect(result.success).toBe(true);
    expect(result.updatedFields).toContain('email');
  });

  it('should handle invalid rectification request ID', async () => {
    const result = await handler.processRectificationRequest('invalid-id', {});

    expect(result.success).toBe(false);
    expect(result.error).toBe('Request not found');
  });

  it('should get request status', () => {
    const request = handler.createRequest('access', 'user-123', 'user@example.com');
    const status = handler.getRequestStatus(request.requestId);

    expect(status).toBeDefined();
    expect(status?.status).toBe('pending');
  });

  it('should return undefined for invalid request status', () => {
    const status = handler.getRequestStatus('invalid-id');

    expect(status).toBeUndefined();
  });

  it('should get overdue requests', () => {
    // Create an old request
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 35); // 35 days ago

    const request = handler.createRequest('access', 'user-123', 'user@example.com');
    // Manually set old date
    request.dueDate = new Date(oldDate.getTime() - 24 * 60 * 60 * 1000); // Past due

    const overdue = handler.getOverdueRequests();

    expect(overdue.length).toBeGreaterThan(0);
  });

  it('should generate DSAR report', () => {
    handler.createRequest('access', 'user-1', 'user1@example.com');
    handler.createRequest('erasure', 'user-2', 'user2@example.com');
    handler.createRequest('access', 'user-3', 'user3@example.com');

    const report = handler.generateReport();

    expect(report.totalRequests).toBe(3);
    expect(report.byType.access).toBe(2);
    expect(report.byType.erasure).toBe(1);
    expect(report.byStatus.pending).toBe(3);
  });
});
