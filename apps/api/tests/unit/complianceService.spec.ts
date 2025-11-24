import { beforeEach, describe, expect, it, vi } from 'vitest';

import ComplianceService from '../../src/modules/complianceService.js';

// Mock dependencies
vi.mock('../../src/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../stores/index.ts', () => ({
  getDatabase: vi.fn(() => ({
    compliance: {
      create: vi.fn(),
      getAll: vi.fn(),
      getById: vi.fn(),
    },
  })),
}));

describe('ComplianceService', () => {
  let service;
  let mockDb;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { getDatabase } = await import('../../stores/index.ts');
    mockDb = getDatabase();
    service = new ComplianceService(mockDb.compliance);
  });

  describe('logAuditEvent', () => {
    it('should log audit events successfully', async () => {
      mockDb.compliance.create.mockResolvedValue({
        id: 'audit-123',
        eventType: 'user_login',
        userId: 'user-456',
        details: { ip: '192.168.1.1' },
      });

      const result = await service.logAuditEvent('user_login', 'user-456', {
        ip: '192.168.1.1',
      });

      expect(result).toHaveProperty('id', 'audit-123');
      expect(mockDb.compliance.create).toHaveBeenCalledWith({
        eventType: 'user_login',
        userId: 'user-456',
        details: { ip: '192.168.1.1' },
        timestamp: expect.any(String),
      });
    });

    it('should handle database errors', async () => {
      mockDb.compliance.create.mockRejectedValue(new Error('Database error'));

      await expect(service.logAuditEvent('user_login', 'user-456', {})).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getComplianceReports', () => {
    it('should retrieve compliance reports', async () => {
      const mockReports = [
        {
          id: 'report-1',
          eventType: 'data_access',
          userId: 'user-123',
          timestamp: '2025-11-05T00:00:00Z',
        },
      ];
      mockDb.compliance.getAll.mockResolvedValue(mockReports);

      const result = await service.getComplianceReports();

      expect(result).toEqual(mockReports);
      expect(mockDb.compliance.getAll).toHaveBeenCalled();
    });

    it('should filter reports by user', async () => {
      const mockReports = [
        {
          id: 'report-1',
          eventType: 'data_access',
          userId: 'user-123',
          timestamp: '2025-11-05T00:00:00Z',
        },
      ];
      mockDb.compliance.getAll.mockResolvedValue(mockReports);

      const result = await service.getComplianceReports('user-123');

      expect(result).toEqual(mockReports);
      expect(mockDb.compliance.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-123' })
      );
    });
  });

  describe('checkCompliance', () => {
    it('should validate compliance requirements', async () => {
      const result = await service.checkCompliance('GDPR', {
        userId: 'user-123',
        action: 'data_export',
      });

      expect(result).toHaveProperty('compliant', true);
      expect(result).toHaveProperty('violations', []);
    });

    it('should detect compliance violations', async () => {
      const result = await service.checkCompliance('GDPR', {
        userId: 'user-123',
        action: 'unauthorized_data_access',
      });

      expect(result).toHaveProperty('compliant', false);
      expect(result.violations).toContain('Unauthorized data access violates GDPR Article 5');
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate compliance reports', async () => {
      mockDb.compliance.getAll.mockResolvedValue([
        {
          id: 'event-1',
          eventType: 'data_access',
          userId: 'user-123',
          timestamp: '2025-11-05T00:00:00Z',
        },
      ]);

      const result = await service.generateComplianceReport('monthly');

      expect(result).toHaveProperty('period', 'monthly');
      expect(result).toHaveProperty('totalEvents', 1);
      expect(result).toHaveProperty('eventsByType');
      expect(result.eventsByType.data_access).toBe(1);
    });
  });

  describe('requestDataAccess', () => {
    it('should create a data access request', () => {
      const requestId = service.requestDataAccess('user-123', '192.168.1.1', 'Mozilla/5.0');

      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe('string');
      expect(service.subjectRightsRequests).toHaveLength(1);

      const request = service.subjectRightsRequests[0];
      expect(request).toMatchObject({
        userId: 'user-123',
        requestType: 'access',
        status: 'pending',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });
      expect(request.responseDeadline).toBeDefined();
    });
  });

  describe('requestDataDeletion', () => {
    it('should create a data deletion request', () => {
      const requestId = service.requestDataDeletion('user-123', 'User requested account deletion');

      expect(requestId).toBeDefined();
      expect(service.subjectRightsRequests).toHaveLength(1);

      const request = service.subjectRightsRequests[0];
      expect(request).toMatchObject({
        userId: 'user-123',
        requestType: 'deletion',
        status: 'pending',
        reason: 'User requested account deletion',
      });
    });
  });

  describe('requestDataRectification', () => {
    it('should create a data rectification request', () => {
      const rectificationData = { email: 'new@example.com', name: 'Updated Name' };
      const requestId = service.requestDataRectification('user-123', rectificationData);

      expect(requestId).toBeDefined();
      expect(service.subjectRightsRequests).toHaveLength(1);

      const request = service.subjectRightsRequests[0];
      expect(request).toMatchObject({
        userId: 'user-123',
        requestType: 'rectification',
        status: 'pending',
        data: rectificationData,
      });
    });
  });

  describe('requestDataPortability', () => {
    it('should create a data portability request', () => {
      const requestId = service.requestDataPortability('user-123');

      expect(requestId).toBeDefined();
      expect(service.subjectRightsRequests).toHaveLength(1);

      const request = service.subjectRightsRequests[0];
      expect(request).toMatchObject({
        userId: 'user-123',
        requestType: 'portability',
        status: 'pending',
      });
    });
  });

  describe('processSubjectRightsRequest', () => {
    beforeEach(() => {
      service.subjectRightsRequests = [
        {
          id: 'request-123',
          userId: 'user-123',
          requestType: 'access',
          status: 'pending',
          requestedAt: new Date().toISOString(),
          responseDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
    });

    it('should approve a subject rights request', () => {
      const success = service.processSubjectRightsRequest('request-123', 'approve', 'admin-456');

      expect(success).toBe(true);
      expect(service.subjectRightsRequests[0].status).toBe('completed');
      expect(service.subjectRightsRequests[0].completedAt).toBeDefined();
    });

    it('should reject a subject rights request', () => {
      const success = service.processSubjectRightsRequest(
        'request-123',
        'reject',
        'admin-456',
        'Invalid request'
      );

      expect(success).toBe(true);
      expect(service.subjectRightsRequests[0].status).toBe('rejected');
      expect(service.subjectRightsRequests[0].completedAt).toBeDefined();
    });

    it('should return false for non-existent request', () => {
      const success = service.processSubjectRightsRequest('non-existent', 'approve', 'admin-456');

      expect(success).toBe(false);
    });
  });

  describe('getSubjectRightsRequests', () => {
    beforeEach(() => {
      service.subjectRightsRequests = [
        {
          id: 'request-1',
          userId: 'user-123',
          requestType: 'access',
          status: 'pending',
          requestedAt: new Date().toISOString(),
          responseDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'request-2',
          userId: 'user-456',
          requestType: 'deletion',
          status: 'completed',
          requestedAt: new Date().toISOString(),
          responseDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
    });

    it('should return all requests without filters', () => {
      const requests = service.getSubjectRightsRequests();

      expect(requests).toHaveLength(2);
    });

    it('should filter by userId', () => {
      const requests = service.getSubjectRightsRequests({ userId: 'user-123' });

      expect(requests).toHaveLength(1);
      expect(requests[0].userId).toBe('user-123');
    });

    it('should filter by status', () => {
      const requests = service.getSubjectRightsRequests({ status: 'completed' });

      expect(requests).toHaveLength(1);
      expect(requests[0].status).toBe('completed');
    });

    it('should filter by requestType', () => {
      const requests = service.getSubjectRightsRequests({ requestType: 'deletion' });

      expect(requests).toHaveLength(1);
      expect(requests[0].requestType).toBe('deletion');
    });
  });

  describe('getDataAccessResponse', () => {
    it('should return data access response for user', async () => {
      // Add some audit entries for the user
      service.auditLog = [
        {
          id: 'event-1',
          timestamp: new Date().toISOString(),
          category: 'authentication',
          action: 'login',
          userId: 'user-123',
          complianceFrameworks: ['GDPR'],
        },
      ];

      const response = await service.getDataAccessResponse('user-123');

      expect(response).toHaveProperty('personalData');
      expect(response).toHaveProperty('processingPurposes');
      expect(response).toHaveProperty('recipients');
      expect(response).toHaveProperty('retentionPeriod');
      expect(response).toHaveProperty('rights');
      expect(response.personalData.activity).toHaveLength(1);
    });
  });

  describe('applyDataMinimization', () => {
    it('should anonymize old audit entries', () => {
      // Create an old entry (31 days ago)
      const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
      service.auditLog = [
        {
          id: 'old-event',
          timestamp: oldDate.toISOString(),
          category: 'data_access',
          action: 'view_profile',
          userId: 'user-123',
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          complianceFrameworks: ['GDPR'],
        },
        {
          id: 'new-event',
          timestamp: new Date().toISOString(),
          category: 'data_access',
          action: 'view_profile',
          userId: 'user-123',
          ip: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          complianceFrameworks: ['GDPR'],
        },
      ];

      service.applyDataMinimization();

      const oldEntry = service.auditLog.find(e => e.id === 'old-event');
      const newEntry = service.auditLog.find(e => e.id === 'new-event');

      expect(oldEntry?.ip).toBe('192.168.1.0'); // Last octet masked
      expect(oldEntry?.userAgent).toBe('Anonymized');
      expect(newEntry?.ip).toBe('192.168.1.101'); // New entry not changed
      expect(newEntry?.userAgent).toBe('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)');
    });
  });

  describe('checkAgeVerificationCompliance', () => {
    it('should check age verification status', async () => {
      // Mock the age verification service
      const mockAgeService = {
        getVerificationStatus: vi.fn().mockResolvedValue({ verified: true, age: 25 }),
      };

      // Temporarily replace the import
      vi.doMock('../../src/modules/ageVerificationService.js', () => ({
        default: mockAgeService,
      }));

      const result = await service.checkAgeVerificationCompliance('user-123');

      expect(result).toBe(true);
    });

    it('should handle age verification service errors', async () => {
      // Mock the age verification service to throw an error
      const mockAgeService = {
        getVerificationStatus: vi.fn().mockRejectedValue(new Error('Service unavailable')),
      };

      vi.doMock('../../src/modules/ageVerificationService.js', () => ({
        default: mockAgeService,
      }));

      const result = await service.checkAgeVerificationCompliance('user-123');

      expect(result).toBe(false);
    });
  });
});
