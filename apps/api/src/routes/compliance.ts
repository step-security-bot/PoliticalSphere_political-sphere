/**
 * Compliance API Routes
 * Provides endpoints for compliance monitoring, reporting, and alerts
 * Supports DSA, GDPR, and ISO 27001 compliance requirements
 */

import express, { type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';

import { authenticate, requireRole } from '../middleware/auth.js';
import ComplianceService from '../modules/complianceService.js';
import logger from '../utils/logger.js';

// No local AuthRequest alias — using global `Request` augmentation from auth middleware

/**
 * Instance of ComplianceService handling compliance monitoring, reporting, and alerts.
 * Supports DSA, GDPR, and ISO 27001 compliance requirements.
 */
const compliance: InstanceType<typeof ComplianceService> = new ComplianceService();

const router = express.Router();

/**
 * Rate limiter for compliance endpoints.
 * Limits each IP to 100 requests per 15-minute window to prevent abuse.
 */
const complianceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many compliance requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
router.use(complianceLimiter);

/**
 * GET /api/compliance/dashboard
 * Get compliance dashboard data
 * Requires moderator or admin role
 */
router.get(
  '/dashboard',
  authenticate,
  requireRole('moderator'),
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const dashboard = compliance.getComplianceDashboard();

      return res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      const currentUser = (req as unknown as Request & { user?: { id: string } }).user;
      logger.error('Failed to fetch compliance dashboard', {
        error: (error as Error).message,
        userId: currentUser?.id || 'unknown',
      });
      return res.status(500).json({
        success: false,
        error: 'Dashboard fetch failed',
        message: 'Unable to retrieve compliance dashboard at this time',
      });
    }
  }
);

/**
 * GET /api/compliance/transparency
 * Get DSA transparency report
 * Public endpoint (aggregated data only)
 */
router.get('/transparency', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    const filters = {
      period,
      startDate,
      endDate,
    };

    const report = compliance.generateDSATransparencyReport(filters as Record<string, unknown>);

    return res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    logger.error('Transparency report generation failed', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Report generation failed',
      message: 'Unable to generate transparency report at this time',
    });
  }
});

/**
 * GET /api/compliance/alerts
 * Get compliance alerts
 * Requires moderator or admin role
 */
router.get(
  '/alerts',
  authenticate,
  requireRole('moderator'),
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { status, framework, severity, limit = 50, offset = 0 } = req.query;

      const filters = {
        status,
        framework,
        severity,
      };

      const alerts = compliance.getComplianceAlerts(filters as Record<string, unknown>);

      // Apply pagination
      const off = Number.parseInt(String(offset), 10);
      const lim = Number.parseInt(String(limit), 10);
      const paginatedAlerts = alerts.slice(off, off + lim);

      return res.json({
        // Corrected to return the response
        success: true,
        data: {
          alerts: paginatedAlerts,
          total: alerts.length,
          limit: lim,
          offset: off,
        },
      });
    } catch (error) {
      const currentUser = (req as unknown as Request & { user?: { id: string } }).user;
      logger.error('Failed to fetch compliance alerts', {
        error: (error as Error).message,
        userId: currentUser?.id || 'unknown',
      });
      return res.status(500).json({
        success: false,
        error: 'Alerts fetch failed',
        message: 'Unable to retrieve compliance alerts at this time',
      });
    }
  }
);

/**
 * PUT /api/compliance/alerts/:alertId/resolve
 * Resolve a compliance alert
 * Requires admin role
 */
router.put(
  '/alerts/:alertId/resolve',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { alertId } = req.params;
      if (!alertId) {
        return res.status(400).json({
          success: false,
          error: 'Alert ID required',
        });
      }
      const { resolution } = req.body;

      if (!resolution || resolution.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Resolution required',
          message: 'Please provide a resolution description',
        });
      }

      const currentUser = (req as unknown as Request & { user?: { id: string } }).user;
      compliance.resolveComplianceAlert(alertId, resolution, currentUser?.id || 'system');

      logger.audit('Compliance alert resolved via API', {
        alertId,
        resolvedBy: currentUser?.id || 'unknown',
        resolution: `${resolution.substring(0, 100)}...`,
      });

      return res.json({
        success: true,
        message: 'Alert resolved successfully',
      });
    } catch (error) {
      logger.error('Failed to resolve compliance alert', {
        error: (error as Error).message,
        alertId: req.params.alertId,
      });
      return res.status(500).json({
        success: false,
        error: 'Alert resolution failed',
        message: 'Unable to resolve compliance alert at this time',
      });
    }
  }
);

/**
 * POST /api/compliance/events
 * Log a compliance event
 * Internal endpoint for services to log compliance events
 */
router.post('/events', authenticate, async (req: Request, res: Response): Promise<Response> => {
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

    // Add request context
    const currentUser = (req as unknown as Request & { user?: { id: string } }).user;
    eventData.userId = currentUser?.id;
    eventData.ip = req.ip;
    eventData.userAgent = req.get('User-Agent');

    const eventId = compliance.logComplianceEvent(eventData);

    return res.json({
      success: true,
      data: { eventId },
    });
  } catch (error) {
    logger.error('Failed to log compliance event', { error: (error as Error).message });
    return res.status(500).json({
      success: false,
      error: 'Event logging failed',
      message: 'Unable to log compliance event at this time',
    });
  }
});

/**
 * GET /api/compliance/audit-log
 * Export audit log (filtered)
 * Requires admin role
 */
router.get(
  '/audit-log',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { startDate, endDate, category, userId, limit = 1000, format = 'json' } = req.query;

      const filters = {
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        category: category as string | undefined,
        userId: userId as string | undefined,
      };

      const auditLog = await compliance.exportAuditLog(filters);

      // Apply limit
      const limitedLog = auditLog.slice(0, Number.parseInt(String(limit), 10));

      // Log export action before returning
      const currentUser = (req as unknown as Request & { user?: { id: string } }).user;
      logger.audit('Audit log exported via API', {
        // exportedBy: the user who requested the export
        exportedBy: currentUser?.id || 'unknown',
        entriesCount: limitedLog.length,
        format,
        filters,
      });

      if (format === 'csv') {
        const csvData = convertToCSV(limitedLog as unknown as Record<string, unknown>[]);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"');
        return res.send(csvData);
      }

      return res.json({
        success: true,
        data: {
          entries: limitedLog,
          total: auditLog.length,
          // exported: number of entries included in this export
          exported: limitedLog.length,
          filters,
        },
      });
    } catch (error) {
      const currentUser = (req as unknown as Request & { user?: { id: string } }).user;
      logger.error('Failed to export audit log', {
        error: (error as Error).message,
        userId: currentUser?.id || 'unknown',
      });
      return res.status(500).json({
        success: false,
        error: 'Audit log export failed',
        message: 'Unable to export audit log at this time',
      });
    }
  }
);

/**
 * POST /api/compliance/breach-notification
 * Generate GDPR breach notification
 * Requires admin role
 */
router.post(
  '/breach-notification',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response): Promise<Response> => {
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

      const notification = compliance.generateBreachNotification(breachDetails);

      const currentUser = (req as unknown as Request & { user?: { id: string } }).user;
      logger.audit('GDPR breach notification generated via API', {
        breachId: notification.breachId,
        generatedBy: currentUser?.id || 'unknown',
        categories: breachDetails.categories,
      });

      return res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      logger.error('Failed to generate breach notification', {
        error: (error as Error).message,
      });
      return res.status(500).json({
        success: false,
        error: 'Breach notification generation failed',
        message: 'Unable to generate breach notification at this time',
      });
    }
  }
);

/**
 * POST /api/compliance/admin/cleanup-audit
 * Clean up old audit entries
 * Requires admin role
 */
router.post(
  '/admin/cleanup-audit',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { daysOld = 90 } = req.body;

      compliance.cleanupAuditLog(Number.parseInt(String(daysOld), 10));

      const currentUser = (req as unknown as Request & { user?: { id: string } }).user;
      logger.audit('Audit log cleaned up via API', {
        cleanedBy: currentUser?.id || 'unknown',
        daysOld: Number.parseInt(String(daysOld), 10),
      });

      return res.json({
        success: true,
        message: `Audit log cleaned up. Removed entries older than ${daysOld} days.`,
      });
    } catch (error) {
      logger.error('Failed to cleanup audit log', { error: (error as Error).message });
      return res.status(500).json({
        success: false,
        error: 'Audit cleanup failed',
        message: 'Unable to cleanup audit log at this time',
      });
    }
  }
);

/**
 * GET /api/compliance/metrics
 * Get compliance metrics for monitoring
 * Requires moderator role
 */
router.get(
  '/metrics',
  authenticate,
  requireRole('moderator'),
  async (_req, res: Response): Promise<Response> => {
    try {
      const metrics = {
        complianceScore: compliance.calculateComplianceScore(),
        activeAlerts: compliance.getComplianceAlerts({
          status: 'active',
        }).length,
        recentEvents: compliance.auditLog.slice(-10), // Last 10 events
        frameworkCoverage: compliance.getFrameworkCoverage(),
      };

      return res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error('Failed to fetch compliance metrics', {
        error: (error as Error).message,
      });
      return res.status(500).json({
        success: false,
        error: 'Metrics fetch failed',
        message: 'Unable to retrieve compliance metrics at this time',
      });
    }
  }
);

/**
 * POST /api/compliance/subject-rights/access
 * Request data access (GDPR Article 15)
 * Requires authentication
 */
router.post(
  '/subject-rights/access',
  authenticate,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const currentUser = (req as unknown as Request & { user?: { id: string } }).user;

      if (!currentUser?.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to request data access',
        });
      }

      const requestId = compliance.requestDataAccess(currentUser.id, req.ip, req.get('User-Agent'));

      return res.json({
        success: true,
        data: {
          requestId,
          message:
            'Data access request submitted successfully. You will receive a response within 30 days.',
        },
      });
    } catch (error) {
      logger.error('Failed to submit data access request', {
        error: (error as Error).message,
      });
      return res.status(500).json({
        success: false,
        error: 'Request submission failed',
        message: 'Unable to submit data access request at this time',
      });
    }
  }
);

/**
 * POST /api/compliance/subject-rights/deletion
 * Request data deletion (GDPR Article 17, CCPA)
 * Requires authentication
 */
router.post(
  '/subject-rights/deletion',
  authenticate,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { reason } = req.body;
      const currentUser = (req as unknown as Request & { user?: { id: string } }).user;

      if (!currentUser?.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to request data deletion',
        });
      }

      const requestId = compliance.requestDataDeletion(
        currentUser.id,
        reason,
        req.ip,
        req.get('User-Agent')
      );

      return res.json({
        success: true,
        data: {
          requestId,
          message:
            'Data deletion request submitted successfully. You will receive a response within 30 days.',
        },
      });
    } catch (error) {
      logger.error('Failed to submit data deletion request', {
        error: (error as Error).message,
      });
      return res.status(500).json({
        success: false,
        error: 'Request submission failed',
        message: 'Unable to submit data deletion request at this time',
      });
    }
  }
);

/**
 * POST /api/compliance/subject-rights/rectification
 * Request data rectification (GDPR Article 16)
 * Requires authentication
 */
router.post(
  '/subject-rights/rectification',
  authenticate,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { rectificationData } = req.body;
      const currentUser = (req as unknown as Request & { user?: { id: string } }).user;

      if (!currentUser?.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to request data rectification',
        });
      }

      if (!rectificationData || typeof rectificationData !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid rectification data',
          message: 'Please provide the data you want to rectify',
        });
      }

      const requestId = compliance.requestDataRectification(
        currentUser.id,
        rectificationData as Record<string, unknown>,
        req.ip,
        req.get('User-Agent')
      );

      return res.json({
        success: true,
        data: {
          requestId,
          message:
            'Data rectification request submitted successfully. You will receive a response within 30 days.',
        },
      });
    } catch (error) {
      logger.error('Failed to submit data rectification request', {
        error: (error as Error).message,
      });
      return res.status(500).json({
        success: false,
        error: 'Request submission failed',
        message: 'Unable to submit data rectification request at this time',
      });
    }
  }
);

/**
 * POST /api/compliance/subject-rights/portability
 * Request data portability (GDPR Article 20)
 * Requires authentication
 */
router.post(
  '/subject-rights/portability',
  authenticate,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const currentUser = (req as unknown as Request & { user?: { id: string } }).user;

      if (!currentUser?.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to request data portability',
        });
      }

      const requestId = compliance.requestDataPortability(
        currentUser.id,
        req.ip,
        req.get('User-Agent')
      );

      return res.json({
        success: true,
        data: {
          requestId,
          message:
            'Data portability request submitted successfully. You will receive a response within 30 days.',
        },
      });
    } catch (error) {
      logger.error('Failed to submit data portability request', {
        error: (error as Error).message,
      });
      return res.status(500).json({
        success: false,
        error: 'Request submission failed',
        message: 'Unable to submit data portability request at this time',
      });
    }
  }
);

/**
 * GET /api/compliance/subject-rights
 * Get subject rights requests (admin)
 * Requires admin role
 */
router.get(
  '/subject-rights',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { userId, status, requestType, limit = 50, offset = 0 } = req.query;

      const filters = {
        userId,
        status,
        requestType,
      };

      const requests = compliance.getSubjectRightsRequests(filters as Record<string, unknown>);

      // Apply pagination
      const off = Number.parseInt(String(offset), 10);
      const lim = Number.parseInt(String(limit), 10);
      const paginatedRequests = requests.slice(off, off + lim);

      return res.json({
        success: true,
        data: {
          requests: paginatedRequests,
          total: requests.length,
          limit: lim,
          offset: off,
        },
      });
    } catch (error) {
      logger.error('Failed to fetch subject rights requests', {
        error: (error as Error).message,
      });
      return res.status(500).json({
        success: false,
        error: 'Requests fetch failed',
        message: 'Unable to retrieve subject rights requests at this time',
      });
    }
  }
);

/**
 * PUT /api/compliance/subject-rights/:requestId/process
 * Process a subject rights request (admin)
 * Requires admin role
 */
router.put(
  '/subject-rights/:requestId/process',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { requestId } = req.params;
      if (!requestId) {
        return res.status(400).json({
          success: false,
          error: 'Request ID required',
        });
      }
      const { action, notes } = req.body;
      const currentUser = (req as unknown as Request & { user?: { id: string } }).user;

      if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid action',
          message: 'Action must be either "approve" or "reject"',
        });
      }

      const userId = currentUser?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      const success = compliance.processSubjectRightsRequest(
        requestId,
        action as 'approve' | 'reject',
        userId,
        notes
      );

      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Request not found',
          message: 'Subject rights request not found',
        });
      }

      return res.json({
        success: true,
        message: `Subject rights request ${action}d successfully`,
      });
    } catch (error) {
      logger.error('Failed to process subject rights request', {
        error: (error as Error).message,
        requestId: req.params.requestId,
      });
      return res.status(500).json({
        success: false,
        error: 'Request processing failed',
        message: 'Unable to process subject rights request at this time',
      });
    }
  }
);

/**
 * GET /api/compliance/subject-rights/:requestId/data
 * Get data access response for a request (user)
 * Requires authentication and ownership
 */
router.get(
  '/subject-rights/:requestId/data',
  authenticate,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { requestId } = req.params;
      const currentUser = (req as unknown as Request & { user?: { id: string } }).user;

      if (!currentUser?.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'You must be logged in to access your data',
        });
      }

      // Check if the request belongs to the user and is completed
      const requests = compliance.getSubjectRightsRequests({ userId: currentUser.id }) as Array<{
        id: string;
        requestType: string;
        status: string;
        [key: string]: unknown;
      }>;
      const userRequest = requests.find(
        r => r.id === requestId && r.requestType === 'access' && r.status === 'completed'
      );

      if (!userRequest) {
        return res.status(404).json({
          success: false,
          error: 'Data not available',
          message: 'Your data access request has not been completed yet or does not exist',
        });
      }

      const dataResponse = compliance.getDataAccessResponse(currentUser.id);

      return res.json({
        success: true,
        data: dataResponse,
      });
    } catch (error) {
      logger.error('Failed to fetch data access response', {
        error: (error as Error).message,
        requestId: req.params.requestId,
      });
      return res.status(500).json({
        success: false,
        error: 'Data fetch failed',
        message: 'Unable to retrieve your data at this time',
      });
    }
  }
);

// Helper function to convert audit log entries to CSV with proper typing
/**
 * Converts an array of objects to CSV format string.
 * Handles comma and quote escaping for CSV compliance.
 *
 * @param data - Array of objects to convert to CSV
 * @returns CSV string with headers and rows, or empty string if data is empty
 */
function convertToCSV<T extends Record<string, unknown>>(data: T[]): string {
  if (!data || data.length === 0) return '';

  const firstRow = data[0];
  if (!firstRow) return '';

  const headers = Object.keys(firstRow) as (keyof T)[];
  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.join(','));

  // Data rows
  data.forEach((row: T) => {
    const values = headers.map(header => {
      const value = row[header];
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value === undefined || value === null ? '' : String(value);
    });
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Default `express.Router` for compliance endpoints.
 *
 * Exposes CSV export and compliance-related admin endpoints used by
 * the administrative UI and data pipeline.
 *
 * TODO: Expand with method-level descriptions and parameter details.
 */
export default router;
