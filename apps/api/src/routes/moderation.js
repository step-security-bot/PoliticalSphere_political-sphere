/**
 * Moderation API Routes
 * Provides endpoints for content moderation, reporting, and review
 * Implements DSA and Online Safety Act compliance
 */

import express from 'express';
import rateLimit from 'express-rate-limit';

import { authenticate, requireRole } from '../middleware/auth.js';
import moderationService from '../services/moderation.service.js';
import logger from '../utils/logger.js';
import {
  AnalyzeContentSchema,
  CreateReportSchema,
  ReviewContentSchema,
} from '../utils/shared-shim.js';

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
router.post('/analyze', async (req, res) => {
  try {
    const input = AnalyzeContentSchema.parse(req.body);

    const result = await moderationService.analyzeContent(input.content, input.type, input.userId);

    // Log for audit trail
    logger.audit('Content analyzed', {
      userId: input.userId,
      contentType: input.type,
      isSafe: result.isSafe,
      category: result.category,
      ip: req.ip,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Moderation analysis failed', {
      error: error.message,
      userId: req.body.userId,
    });
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
    res.status(500).json({
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
router.post('/report', authenticate, async (req, res) => {
  try {
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

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Report submission failed', {
      error: error.message,
      userId: req.user?.id,
    });
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    res.status(500).json({
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
router.get('/queue', authenticate, requireRole('moderator'), async (req, res) => {
  try {
    const { limit = 20, status = 'pending', page = 1 } = req.query;

    const queue = await moderationService.getModerationQueue(
      parseInt(limit, 10),
      status,
      parseInt(page, 10)
    );

    res.json({
      success: true,
      data: queue,
    });
  } catch (error) {
    logger.error('Failed to fetch moderation queue', {
      error: error.message,
      userId: req.user.id,
    });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch moderation queue',
      message: 'Unable to retrieve queue at this time',
    });
  }
});

/**
 * PUT /api/moderation/review/:contentId
 * Review and decide on flagged content
 * Requires moderator role
 */
router.put('/review/:contentId', authenticate, requireRole('moderator'), async (req, res) => {
  try {
    const { contentId } = req.params;
    const input = ReviewContentSchema.parse(req.body);
    const moderatorId = req.user.id;

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

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Content review failed', {
      error: error.message,
      contentId: req.params.contentId,
    });
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    res.status(500).json({
      success: false,
      error: 'Content review failed',
      message: 'Unable to process review at this time',
    });
  }
});

/**
 * GET /api/moderation/transparency
 * Get transparency report for DSA compliance
 * Public endpoint
 */
router.get('/transparency', async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    const filters = {
      period,
      startDate,
      endDate,
    };

    const report = await moderationService.generateTransparencyReport(filters);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    logger.error('Transparency report generation failed', {
      error: error.message,
    });
    res.status(500).json({
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
router.post('/admin/clear-cache', authenticate, requireRole('admin'), async (req, res) => {
  try {
    moderationService.clearCache();

    logger.audit('Moderation cache cleared', { userId: req.user.id });

    res.json({
      success: true,
      message: 'Moderation cache cleared successfully',
    });
  } catch (error) {
    logger.error('Cache clear failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Cache clear failed',
      message: 'Unable to clear cache at this time',
    });
  }
});

/**
 * GET /api/moderation/stats
 * Get moderation statistics for dashboard
 * Requires moderator role
 */
router.get('/stats', authenticate, requireRole('moderator'), async (_req, res) => {
  try {
    const stats = await moderationService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Stats retrieval failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Stats retrieval failed',
      message: 'Unable to retrieve statistics at this time',
    });
  }
});

export default router;
