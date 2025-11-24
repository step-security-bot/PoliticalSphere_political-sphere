import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import ComplianceService from './complianceService.js';

// Types needed for testing
interface AuditEntry {
  id: string;
  timestamp: string;
  category: string;
  action: string;
  userId?: string;
  resource?: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  complianceFrameworks: string[];
}

interface ComplianceAlert {
  id: string;
  timestamp: string;
  framework: string;
  rule: string;
  severity: string;
  description: string;
  auditEntryId: string;
  status: string;
  assignedTo?: string | null;
  resolvedAt?: string | null;
  resolution?: string;
  resolvedBy?: string;
}

interface SubjectRightsRequest {
  id: string;
  userId: string;
  requestType: 'access' | 'deletion' | 'rectification' | 'portability' | 'restriction';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: string;
  completedAt?: string;
  responseDeadline: string;
  data?: Record<string, unknown>;
  reason?: string;
  ip?: string;
  userAgent?: string;
}

// Mock dependencies
vi.mock('../services/prisma-database.service.js', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../utils/logger.js', () => ({
  audit: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  default: {
    audit: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock fetch for notification channels
global.fetch = vi.fn();

// Test interface to access private properties
interface TestComplianceService extends ComplianceService {
  auditLog: AuditEntry[];
  alerts: ComplianceAlert[];
  subjectRightsRequests: SubjectRightsRequest[];
}

describe('ComplianceService', () => {
  let complianceService: TestComplianceService;
  let mockPrisma: unknown;
  let mockLogger: unknown;

  // Type guards for accessing mocked properties
  const getMockPrisma = () =>
    mockPrisma as {
      auditLog: {
        create: ReturnType<typeof vi.fn>;
        findMany: ReturnType<typeof vi.fn>;
        findUnique: ReturnType<typeof vi.fn>;
        update: ReturnType<typeof vi.fn>;
        delete: ReturnType<typeof vi.fn>;
      };
    };

  const getMockLogger = () =>
    mockLogger as {
      audit: ReturnType<typeof vi.fn>;
      error: ReturnType<typeof vi.fn>;
      warn: ReturnType<typeof vi.fn>;
      info: ReturnType<typeof vi.fn>;
      default: {
        audit: ReturnType<typeof vi.fn>;
        error: ReturnType<typeof vi.fn>;
        warn: ReturnType<typeof vi.fn>;
        info: ReturnType<typeof vi.fn>;
      };
    };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get mocked instances
    mockPrisma = vi.mocked(await import('../services/prisma-database.service.js')).prisma;
    mockLogger = vi.mocked(await import('../utils/logger.js'));

    complianceService = new ComplianceService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logComplianceEvent', () => {
    it('should log compliance event successfully', async () => {
      const mockAuditEntry = {
        id: 'audit-123',
        timestamp: new Date().toISOString(),
        category: 'test',
        action: 'test_action',
        userId: 'user-123',
        details: { test: true },
      };

      getMockPrisma().auditLog.create.mockResolvedValue(mockAuditEntry);

      const eventId = await complianceService.logComplianceEvent({
        category: 'test',
        action: 'test_action',
        userId: 'user-123',
        details: { test: true },
      });

      expect(eventId).toBeDefined();
      expect(getMockPrisma().auditLog.create).toHaveBeenCalled();
      expect(getMockLogger().audit).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      getMockPrisma().auditLog.create.mockRejectedValue(new Error('Database error'));

      const eventId = await complianceService.logComplianceEvent({
        category: 'test',
        action: 'test_action',
        userId: 'user-123',
      });

      expect(eventId).toBeDefined(); // Should still return an ID even on error
      expect(getMockLogger().error).toHaveBeenCalled();
    });
  });

  describe('checkComplianceViolations', () => {
    it('should detect GDPR violations for unlawful basis', () => {
      const auditEntry = {
        id: 'audit-123',
        timestamp: new Date().toISOString(),
        category: 'data_processing',
        action: 'process_data',
        userId: 'user-123',
        details: { unlawfulBasis: true },
        complianceFrameworks: ['GDPR'],
      };

      // Access private method
      (complianceService as TestComplianceService).checkComplianceViolations(auditEntry);

      // Should have created an alert (check that alerts array has items)
      expect((complianceService as TestComplianceService).alerts.length).toBeGreaterThan(0);
    });

    it('should detect DSA violations for response time', () => {
      const auditEntry = {
        id: 'audit-124',
        timestamp: new Date().toISOString(),
        category: 'content_moderation',
        action: 'moderate_content',
        userId: 'user-123',
        details: { responseTime: 25 * 60 * 60 * 1000 }, // 25 hours
        complianceFrameworks: ['DSA'],
      };

      (complianceService as TestComplianceService).checkComplianceViolations(auditEntry);

      expect((complianceService as TestComplianceService).alerts.length).toBeGreaterThan(0);
    });

    it('should detect ISO 27001 violations for failed attempts', () => {
      const auditEntry = {
        id: 'audit-125',
        timestamp: new Date().toISOString(),
        category: 'access_control',
        action: 'login_attempt',
        userId: 'user-123',
        details: { failedAttempts: 6 },
        complianceFrameworks: ['ISO 27001'],
      };

      (complianceService as TestComplianceService).checkComplianceViolations(auditEntry);

      expect((complianceService as TestComplianceService).alerts.length).toBeGreaterThan(0);
    });
  });

  describe('notifyComplianceTeam', () => {
    beforeEach(() => {
      vi.mocked(global.fetch).mockClear();
    });

    it('should send email notification', async () => {
      process.env.COMPLIANCE_TEAM_EMAILS = 'compliance@example.com';

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const alert = {
        id: 'alert-123',
        timestamp: new Date().toISOString(),
        framework: 'GDPR',
        rule: 'Article 5',
        severity: 'high',
        description: 'Test violation',
        auditEntryId: 'audit-123',
        status: 'active',
      };

      await (complianceService as TestComplianceService).notifyComplianceTeam(alert);

      expect(getMockLogger().info).toHaveBeenCalledWith(
        expect.stringContaining('Compliance team notified'),
        expect.any(Object)
      );
    });

    it('should handle notification failure', async () => {
      process.env.COMPLIANCE_TEAM_EMAILS = 'compliance@example.com';

      vi.mocked(global.fetch).mockRejectedValue(new Error('Email service error'));

      const alert = {
        id: 'alert-123',
        timestamp: new Date().toISOString(),
        framework: 'GDPR',
        rule: 'Article 5',
        severity: 'high',
        description: 'Test violation',
        auditEntryId: 'audit-123',
        status: 'active',
      };

      await (complianceService as TestComplianceService).notifyComplianceTeam(alert);

      expect(getMockLogger().error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to notify compliance team'),
        expect.any(Object)
      );
    });
  });

  describe('sendNotification', () => {
    beforeEach(() => {
      vi.mocked(global.fetch).mockClear();
    });

    it('should send email notification', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const notification = {
        subject: 'Test Subject',
        message: 'Test Message',
        recipients: ['test@example.com'],
        channels: ['email'],
      };

      await (complianceService as TestComplianceService).sendNotification(notification);

      expect(vi.mocked(global.fetch)).toHaveBeenCalled();
    });

    it('should send SMS notification', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const notification = {
        subject: 'Test Subject',
        message: 'Test Message',
        recipients: ['+1234567890'],
        channels: ['sms'],
      };

      await (complianceService as TestComplianceService).sendNotification(notification);

      expect(vi.mocked(global.fetch)).toHaveBeenCalled();
    });

    it('should send Slack notification', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const notification = {
        subject: 'Test Subject',
        message: 'Test Message',
        recipients: [],
        channels: ['slack'],
      };

      await (complianceService as TestComplianceService).sendNotification(notification);

      expect(vi.mocked(global.fetch)).toHaveBeenCalled();
    });

    it('should handle unknown notification channel', async () => {
      const notification = {
        subject: 'Test Subject',
        message: 'Test Message',
        recipients: [],
        channels: ['unknown'],
      };

      await (complianceService as TestComplianceService).sendNotification(notification);

      expect(getMockLogger().warn).toHaveBeenCalledWith('Unknown notification channel', {
        channel: 'unknown',
      });
    });
  });

  describe('sendEmail', () => {
    beforeEach(() => {
      vi.mocked(global.fetch).mockClear();
    });

    it('should send email successfully', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await (complianceService as TestComplianceService).sendEmail('Test Subject', 'Test Message', [
        'test@example.com',
      ]);

      expect(getMockLogger().info).toHaveBeenCalledWith(
        expect.stringContaining('Email notification sent'),
        expect.any(Object)
      );
    });

    it('should handle email service failure', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Email service error'));

      await expect(
        (complianceService as TestComplianceService).sendEmail('Test Subject', 'Test Message', [
          'test@example.com',
        ])
      ).rejects.toThrow();
    });
  });

  describe('sendSMS', () => {
    beforeEach(() => {
      vi.mocked(global.fetch).mockClear();
    });

    it('should send SMS successfully', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await (complianceService as TestComplianceService).sendSMS('Test Message', ['+1234567890']);

      expect(getMockLogger().info).toHaveBeenCalledWith(
        expect.stringContaining('SMS notification sent'),
        expect.any(Object)
      );
    });
  });

  describe('sendSlackMessage', () => {
    beforeEach(() => {
      vi.mocked(global.fetch).mockClear();
    });

    it('should send Slack message successfully', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      await (complianceService as TestComplianceService).sendSlackMessage(
        'Test Subject',
        'Test Message'
      );

      expect(getMockLogger().info).toHaveBeenCalledWith(
        expect.stringContaining('Slack notification sent'),
        expect.any(Object)
      );
    });
  });

  describe('getComplianceDashboard', () => {
    it('should return dashboard data from database', async () => {
      const mockEntries = [
        {
          id: 'audit-1',
          timestamp: new Date(),
          category: 'test',
          action: 'test_action',
          userId: 'user-1',
          resource: 'test',
          details: {},
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          complianceFrameworks: ['GDPR'],
        },
      ];

      getMockPrisma().auditLog.findMany.mockResolvedValue(mockEntries);

      const dashboard = await complianceService.getComplianceDashboard();

      expect(dashboard).toBeDefined();
      expect(dashboard.totalEvents).toBe(1);
      expect(dashboard.eventsByCategory).toBeDefined();
    });

    it('should fallback to in-memory data on database error', async () => {
      getMockPrisma().auditLog.findMany.mockRejectedValue(new Error('Database error'));

      // Add some in-memory audit entries
      (complianceService as TestComplianceService).auditLog.push({
        id: 'audit-1',
        timestamp: new Date().toISOString(),
        category: 'test',
        action: 'test_action',
        userId: 'user-1',
        complianceFrameworks: ['GDPR'],
      });

      const dashboard = await complianceService.getComplianceDashboard();

      expect(dashboard).toBeDefined();
      expect(dashboard.totalEvents).toBe(1);
    });
  });

  describe('generateDSATransparencyReport', () => {
    it('should generate DSA transparency report', () => {
      const report = complianceService.generateDSATransparencyReport();

      expect(report).toBeDefined();
      expect(report.generatedAt).toBeDefined();
      expect(report.platformName).toBe('Political Sphere');
      expect(report.contentModeration).toBeDefined();
      expect(report.illegalContent).toBeDefined();
      expect(report.userRights).toBeDefined();
    });

    it('should use custom period', () => {
      const report = complianceService.generateDSATransparencyReport({
        period: 'quarterly',
      });

      expect(report.reportingPeriod).toBe('quarterly');
    });
  });

  describe('generateBreachNotification', () => {
    it('should generate breach notification', () => {
      const breachDetails = {
        date: '2024-01-01',
        time: '12:00:00',
        categories: ['personal_data'],
        approximateNumber: 1000,
        consequences: 'Data exposure',
        measuresTaken: 'Immediate containment',
      };

      const notification = complianceService.generateBreachNotification(breachDetails);

      expect(notification).toBeDefined();
      expect(notification.breachId).toBeDefined();
      expect(notification.breachDetails).toEqual(breachDetails);
      expect(notification.status).toBe('draft');
    });
  });

  describe('exportAuditLog', () => {
    it('should export audit log from database', async () => {
      const mockEntries = [
        {
          id: 'audit-1',
          timestamp: new Date(),
          category: 'test',
          action: 'test_action',
          userId: 'user-1',
          resource: 'test',
          details: {},
          ip: '127.0.0.1',
          userAgent: 'test-agent',
          complianceFrameworks: ['GDPR'],
          user: null,
        },
      ];

      getMockPrisma().auditLog.findMany.mockResolvedValue(mockEntries);

      const exported = await complianceService.exportAuditLog();

      expect(exported).toBeDefined();
      expect(exported.length).toBe(1);
      expect(exported[0].id).toBe('audit-1');
    });

    it('should filter by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      getMockPrisma().auditLog.findMany.mockResolvedValue([]);

      await complianceService.exportAuditLog({
        startDate,
        endDate,
      });

      expect(getMockPrisma().auditLog.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          timestamp: expect.objectContaining({
            gte: new Date(startDate),
            lte: new Date(endDate),
          }),
        }),
        orderBy: { timestamp: 'desc' },
        include: { user: true },
      });
    });

    it('should fallback to in-memory log on database error', async () => {
      getMockPrisma().auditLog.findMany.mockRejectedValue(new Error('Database error'));

      // Add in-memory entry
      (complianceService as TestComplianceService).auditLog.push({
        id: 'audit-1',
        timestamp: new Date().toISOString(),
        category: 'test',
        action: 'test_action',
        userId: 'user-1',
        complianceFrameworks: ['GDPR'],
      });

      const exported = await complianceService.exportAuditLog();

      expect(exported).toBeDefined();
      expect(exported.length).toBe(1);
    });
  });

  describe('resolveComplianceAlert', () => {
    it('should resolve compliance alert', () => {
      const alert = {
        id: 'alert-123',
        timestamp: new Date().toISOString(),
        framework: 'GDPR',
        rule: 'Article 5',
        severity: 'high',
        description: 'Test violation',
        auditEntryId: 'audit-123',
        status: 'active',
        assignedTo: null,
        resolvedAt: null,
      };

      (complianceService as TestComplianceService).alerts.push(alert);

      complianceService.resolveComplianceAlert('alert-123', 'Issue resolved', 'admin-123');

      const resolvedAlert = (complianceService as TestComplianceService).alerts.find(
        (a: ComplianceAlert) => a.id === 'alert-123'
      );
      expect(resolvedAlert.status).toBe('resolved');
      expect(resolvedAlert.resolution).toBe('Issue resolved');
      expect(resolvedAlert.resolvedBy).toBe('admin-123');
      expect(resolvedAlert.resolvedAt).toBeDefined();
    });
  });

  describe('getComplianceAlerts', () => {
    beforeEach(() => {
      (complianceService as TestComplianceService).alerts = [
        {
          id: 'alert-1',
          timestamp: new Date().toISOString(),
          framework: 'GDPR',
          rule: 'Test Rule',
          severity: 'high',
          description: 'Test alert 1',
          auditEntryId: 'audit-1',
          status: 'active',
          assignedTo: null,
          resolvedAt: null,
        },
        {
          id: 'alert-2',
          timestamp: new Date().toISOString(),
          framework: 'DSA',
          rule: 'Test Rule',
          severity: 'medium',
          description: 'Test alert 2',
          auditEntryId: 'audit-2',
          status: 'resolved',
          assignedTo: null,
          resolvedAt: null,
        },
      ];
    });

    it('should return all alerts', () => {
      const alerts = complianceService.getComplianceAlerts();

      expect(alerts.length).toBe(2);
    });

    it('should filter by status', () => {
      const alerts = complianceService.getComplianceAlerts({ status: 'active' });

      expect(alerts.length).toBe(1);
      expect(alerts[0].id).toBe('alert-1');
    });

    it('should filter by framework', () => {
      const alerts = complianceService.getComplianceAlerts({ framework: 'DSA' });

      expect(alerts.length).toBe(1);
      expect(alerts[0].id).toBe('alert-2');
    });

    it('should filter by severity', () => {
      const alerts = complianceService.getComplianceAlerts({ severity: 'high' });

      expect(alerts.length).toBe(1);
      expect(alerts[0].id).toBe('alert-1');
    });
  });

  describe('requestDataAccess', () => {
    it('should create data access request', () => {
      const requestId = complianceService.requestDataAccess('user-123', '127.0.0.1', 'test-agent');

      expect(requestId).toBeDefined();
      expect((complianceService as TestComplianceService).subjectRightsRequests.length).toBe(1);

      const request = (complianceService as TestComplianceService).subjectRightsRequests[0];
      expect(request.userId).toBe('user-123');
      expect(request.requestType).toBe('access');
      expect(request.status).toBe('pending');
      expect(request.ip).toBe('127.0.0.1');
      expect(request.userAgent).toBe('test-agent');
    });
  });

  describe('requestDataDeletion', () => {
    it('should create data deletion request', () => {
      const requestId = complianceService.requestDataDeletion(
        'user-123',
        'User requested deletion',
        '127.0.0.1',
        'test-agent'
      );

      expect(requestId).toBeDefined();
      expect((complianceService as TestComplianceService).subjectRightsRequests.length).toBe(1);

      const request = (complianceService as TestComplianceService).subjectRightsRequests[0];
      expect(request.userId).toBe('user-123');
      expect(request.requestType).toBe('deletion');
      expect(request.reason).toBe('User requested deletion');
    });
  });

  describe('requestDataRectification', () => {
    it('should create data rectification request', () => {
      const rectificationData = { email: 'new@example.com' };

      const requestId = complianceService.requestDataRectification(
        'user-123',
        rectificationData,
        '127.0.0.1',
        'test-agent'
      );

      expect(requestId).toBeDefined();
      const request = (complianceService as TestComplianceService).subjectRightsRequests[0];
      expect(request.requestType).toBe('rectification');
      expect(request.data).toEqual(rectificationData);
    });
  });

  describe('requestDataPortability', () => {
    it('should create data portability request', () => {
      const requestId = complianceService.requestDataPortability(
        'user-123',
        '127.0.0.1',
        'test-agent'
      );

      expect(requestId).toBeDefined();
      const request = (complianceService as TestComplianceService).subjectRightsRequests[0];
      expect(request.requestType).toBe('portability');
    });
  });

  describe('processSubjectRightsRequest', () => {
    it('should process subject rights request', () => {
      const request = {
        id: 'request-123',
        userId: 'user-123',
        requestType: 'access',
        status: 'pending',
        requestedAt: new Date().toISOString(),
        responseDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: undefined,
      } as SubjectRightsRequest;

      (complianceService as TestComplianceService).subjectRightsRequests.push(request);

      const result = complianceService.processSubjectRightsRequest(
        'request-123',
        'approve',
        'admin-123',
        'Request approved'
      );

      expect(result).toBe(true);
      expect(request.status).toBe('completed');
      expect(request.completedAt).toBeDefined();
    });

    it('should return false for non-existent request', () => {
      const result = complianceService.processSubjectRightsRequest(
        'non-existent',
        'approve',
        'admin-123'
      );

      expect(result).toBe(false);
    });
  });

  describe('getDataAccessResponse', () => {
    it('should return data access response from database', async () => {
      const mockEntries = [
        {
          id: 'audit-1',
          timestamp: new Date(),
          category: 'login',
          action: 'user_login',
          userId: 'user-123',
        },
      ];

      getMockPrisma().auditLog.findMany.mockResolvedValue(mockEntries);

      const response = await complianceService.getDataAccessResponse('user-123');

      expect(response).toBeDefined();
      expect(response.personalData).toBeDefined();
      expect(response.processingPurposes).toBeDefined();
      expect(response.recipients).toBeDefined();
      expect(response.retentionPeriod).toBeDefined();
      expect(response.rights).toBeDefined();
    });

    it('should fallback to in-memory data on database error', async () => {
      getMockPrisma().auditLog.findMany.mockRejectedValue(new Error('Database error'));

      // Add in-memory audit entry
      (complianceService as TestComplianceService).auditLog.push({
        id: 'audit-1',
        timestamp: new Date().toISOString(),
        category: 'login',
        action: 'user_login',
        userId: 'user-123',
        complianceFrameworks: ['GDPR'],
      });

      const response = await complianceService.getDataAccessResponse('user-123');

      expect(response).toBeDefined();
    });
  });

  describe('getSubjectRightsRequests', () => {
    beforeEach(() => {
      (complianceService as TestComplianceService).subjectRightsRequests = [
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
          completedAt: new Date().toISOString(),
        },
      ];
    });

    it('should return all requests', () => {
      const requests = complianceService.getSubjectRightsRequests();

      expect(requests.length).toBe(2);
    });

    it('should filter by userId', () => {
      const requests = complianceService.getSubjectRightsRequests({ userId: 'user-123' });

      expect(requests.length).toBe(1);
      expect(requests[0].id).toBe('request-1');
    });

    it('should filter by status', () => {
      const requests = complianceService.getSubjectRightsRequests({ status: 'completed' });

      expect(requests.length).toBe(1);
      expect(requests[0].id).toBe('request-2');
    });

    it('should filter by requestType', () => {
      const requests = complianceService.getSubjectRightsRequests({ requestType: 'deletion' });

      expect(requests.length).toBe(1);
      expect(requests[0].id).toBe('request-2');
    });
  });

  describe('applyDataMinimization', () => {
    it('should anonymize old audit entries', () => {
      // Add old entry (31 days ago)
      const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
      (complianceService as TestComplianceService).auditLog.push({
        id: 'audit-1',
        timestamp: oldDate.toISOString(),
        category: 'login',
        action: 'user_login',
        userId: 'user-123',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        complianceFrameworks: ['GDPR'],
      });

      (complianceService as TestComplianceService).applyDataMinimization();

      const entry = (complianceService as TestComplianceService).auditLog[0];
      expect(entry.ip).toBe('192.168.1.0'); // Last octet masked
      expect(entry.userAgent).toBe('Anonymized');
    });
  });

  describe('checkAgeVerificationCompliance', () => {
    beforeEach(() => {
      vi.mocked(global.fetch).mockClear();
    });

    it('should return true when age verification succeeds', async () => {
      // Mock the dynamic import
      vi.doMock('./ageVerificationService.js', () => ({
        default: {
          getVerificationStatus: vi.fn().mockResolvedValue({ verified: true, age: 25 }),
        },
      }));

      const result = await complianceService.checkAgeVerificationCompliance('user-123');

      expect(result).toBe(true);
    });

    it('should return false when age verification fails', async () => {
      vi.doMock('./ageVerificationService.js', () => ({
        default: {
          getVerificationStatus: vi.fn().mockResolvedValue({ verified: false }),
        },
      }));

      const result = await complianceService.checkAgeVerificationCompliance('user-123');

      expect(result).toBe(false);
    });

    it('should return false on service error', async () => {
      vi.doMock('./ageVerificationService.js', () => ({
        default: {
          getVerificationStatus: vi.fn().mockRejectedValue(new Error('Service error')),
        },
      }));

      const result = await complianceService.checkAgeVerificationCompliance('user-123');

      expect(result).toBe(false);
    });
  });

  describe('cleanupAuditLog', () => {
    it('should remove old audit entries', () => {
      // Add old entry (100 days ago)
      const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
      (complianceService as TestComplianceService).auditLog.push({
        id: 'audit-1',
        timestamp: oldDate.toISOString(),
        category: 'login',
        action: 'user_login',
        userId: 'user-123',
        complianceFrameworks: ['GDPR'],
      });

      // Add recent entry
      (complianceService as TestComplianceService).auditLog.push({
        id: 'audit-2',
        timestamp: new Date().toISOString(),
        category: 'login',
        action: 'user_login',
        userId: 'user-123',
        complianceFrameworks: ['GDPR'],
      });

      const initialLength = (complianceService as TestComplianceService).auditLog.length;

      (complianceService as TestComplianceService).cleanupAuditLog(90); // Remove entries older than 90 days

      const finalLength = (complianceService as TestComplianceService).auditLog.length;
      expect(finalLength).toBeLessThan(initialLength);
    });
  });
});
