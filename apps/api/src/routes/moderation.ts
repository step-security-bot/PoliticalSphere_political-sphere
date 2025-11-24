/**
 * Moderation API Routes
 * Provides endpoints for content moderation, reporting, and review
 * Implements DSA and Online Safety Act compliance
 */

import express, { type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';

import { authenticate, requireRole } from '../middleware/auth.js';
import { moderationService } from '../services/moderation.service.js';
import logger from '../utils/logger.js';
import {
  AnalyzeContentSchema,
  CreateReportSchema,
  ReviewContentSchema,
} from '../utils/shared-shim.js';

// Minimal Zod-like error shape used for validation checks in routes
type ZodLikeErrorItem = {
  path?: Array<string | number>;
  message?: string;
};
type ZodLikeError = {
  name?: string;
  errors?: ZodLikeErrorItem[];
  message?: string;
};

const router = express.Router();

// Rate limiting for moderation endpoints
const moderationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many moderation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes (skip in test env to allow validation testing)
if (process.env.NODE_ENV !== 'test') {
  router.use(moderationLimiter);
}

/**
 * POST /api/moderation/analyze
 * Analyze content for harmful material
 * Public endpoint for content pre-moderation
 */
router.post('/analyze', async (req: Request, res: Response): Promise<Response> => {
  try {
    const input = AnalyzeContentSchema.parse(req.body);

    const result = await moderationService.analyzeContent(input.content);

    // Log for audit trail
    logger.audit('Content analyzed', {
      userId: input.userId,
      contentType: input.type,
      isSafe: !result.flagged,
      category: Object.keys(result.scores).reduce(
        (a, b) =>
          result.scores[a as keyof typeof result.scores] >
          result.scores[b as keyof typeof result.scores]
            ? a
            : b,
        'violence'
      ),
      ip: req.ip,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const zerr = error as unknown as ZodLikeError;
    logger.error('Moderation analysis failed', {
      error: (error as Error).message,
      userId: req.body.userId,
    });
    if (
      zerr?.name === 'ZodError' ||
      (error as Error).message === 'Input must be an object' ||
      (error as Error).message.startsWith('Missing required field')
    ) {
      const details = Array.isArray(zerr?.errors)
        ? zerr.errors.map(e => ({ field: (e.path || []).join('.'), message: e.message || '' }))
        : [{ field: 'input', message: (error as Error).message }];
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details,
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Content analysis failed',
      message: 'Unable to analyze content at this time',
    });
  }
});

/**
 * POST /api/moderation/report
 * Submit a user report for content
 * Requires authentication
 */
router.post('/report', authenticate, async (req: Request, res: Response): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const input = CreateReportSchema.parse(req.body);
    const userId = req.user.id;

    const report = {
      contentId: input.contentId,
      userId,
      reason: input.reason,
      evidence: input.evidence,
      category: input.category,
      submittedAt: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    };

    const result = await moderationService.handleReport(report);

    // Log for audit trail
    logger.audit('Report submitted', {
      reportId: result.reportId,
      userId,
      contentId: input.contentId,
      reason: input.reason,
      escalated: result.escalated,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const zerr = error as unknown as ZodLikeError;
    logger.error('Report submission failed', {
      error: (error as Error).message,
      userId: req.user?.id,
    });
    if (zerr?.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: Array.isArray(zerr.errors)
          ? zerr.errors.map(e => ({ field: (e.path || []).join('.'), message: e.message || '' }))
          : [{ field: 'input', message: (error as Error).message }],
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Report submission failed',
      message: 'Unable to submit report at this time',
    });
  }
});

/**
 * GET /api/moderation/queue
 * Get moderation queue for moderators
 * Requires moderator role
 */
router.get(
  '/queue',
  authenticate,
  requireRole('moderator'),
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { limit = 20, status = 'pending', page = 1 } = req.query;

      const queue = await moderationService.getModerationQueue(
        parseInt(String(limit), 10),
        String(status),
        parseInt(String(page), 10)
      );

      return res.json({
        success: true,
        data: queue,
      });
    } catch (error) {
      const userId = req.user?.id || 'unknown';
      logger.error('Failed to fetch moderation queue', {
        error: (error as Error).message,
        userId,
      });
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch moderation queue',
        message: 'Unable to retrieve queue at this time',
      });
    }
  }
);

/**
 * PUT /api/moderation/review/:contentId
 * Review and decide on flagged content
 * Requires moderator role
 */
router.put(
  '/review/:contentId',
  authenticate,
  requireRole('moderator'),
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { contentId } = req.params;
      if (!contentId) return res.status(400).json({ success: false, error: 'Invalid contentId' });
      const input = ReviewContentSchema.parse(req.body);
      const moderatorId = req.user?.id;
      if (!moderatorId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const result = await moderationService.reviewContent(
        contentId,
        input.decision,
        moderatorId,
        input.notes
      );

      // Log for audit trail
      logger.audit('Content reviewed', {
        contentId,
        decision: input.decision,
        moderatorId,
        notes: input.notes ? 'provided' : 'none',
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      const zerr = error as unknown as ZodLikeError;
      logger.error('Content review failed', {
        error: (error as Error).message,
        contentId: req.params.contentId,
      });
      if (zerr?.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: Array.isArray(zerr.errors)
            ? zerr.errors.map(e => ({ field: (e.path || []).join('.'), message: e.message || '' }))
            : [{ field: 'input', message: (error as Error).message }],
        });
      }
      return res.status(500).json({
        success: false,
        error: 'Content review failed',
        message: 'Unable to process review at this time',
      });
    }
  }
);

/**
 * GET /api/moderation/transparency
 * Get transparency report for DSA compliance
 * Public endpoint
 */
router.get('/transparency', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    const filters = {
      period: typeof period === 'string' ? period : 'monthly',
      startDate: typeof startDate === 'string' ? startDate : undefined,
      endDate: typeof endDate === 'string' ? endDate : undefined,
    };

    const report = await moderationService.generateTransparencyReport(filters);

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
 * POST /api/moderation/admin/clear-cache
 * Clear moderation cache (admin only)
 * Requires admin role
 */
router.post(
  '/admin/clear-cache',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response): Promise<Response> => {
    try {
      moderationService.clearCache();

      logger.audit('Moderation cache cleared', { userId: req.user?.id || 'unknown' });

      return res.json({
        success: true,
        message: 'Moderation cache cleared successfully',
      });
    } catch (error) {
      logger.error('Cache clear failed', { error: (error as Error).message });
      return res.status(500).json({
        success: false,
        error: 'Cache clear failed',
        message: 'Unable to clear cache at this time',
      });
    }
  }
);

/**
 * GET /api/moderation/stats
 * Get moderation statistics for dashboard
 * Requires moderator role
 */
router.get(
  '/stats',
  authenticate,
  requireRole('moderator'),
  async (_req: Request, res: Response): Promise<Response> => {
    try {
      const stats = await moderationService.getStats();

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Stats retrieval failed', { error: (error as Error).message });
      return res.status(500).json({
        success: false,
        error: 'Stats retrieval failed',
        message: 'Unable to retrieve statistics at this time',
      });
    }
  }
);

/**
 * Moderation router: endpoints for content moderation tasks, review,
 * enforcement actions, and moderation analytics.
 */
export default router;
