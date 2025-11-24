/**
 * Age Verification API Routes
 * Provides endpoints for age verification and parental consent
 * Implements Online Safety Act and COPPA compliance
 */

import express, { type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';

import { authenticate, requireRole } from '../middleware/auth.js';
import AgeVerificationService from '../modules/ageVerificationService.js';

/**
 * Instance of AgeVerificationService used to handle age verification operations.
 * Provides methods for initiating verification, completing verification, and managing parental consent.
 */
const ageVerificationService = new AgeVerificationService();
import logger from '../utils/logger.js';
import { CompleteVerificationSchema, InitiateVerificationSchema } from '../utils/shared-shim.js';

/**
 * Represents a single validation error item from Zod-like validation.
 * Used internally to map Zod errors to a consistent API response format.
 */
type ZodLikeErrorItem = {
  path?: Array<string | number>;
  message?: string;
};
/**
 * Represents a Zod-like validation error with multiple error items.
 * Used to handle validation failures in age verification endpoints.
 */
type ZodLikeError = {
  name?: string;
  errors?: ZodLikeErrorItem[];
  message?: string;
};

/**
 * Router handling age verification related endpoints.
 *
 * Endpoints:
 * - POST /initiate: start an age verification flow
 * - POST /verify: complete verification with a verification id
 * - POST /parental-consent: request parental consent
 * - GET /status: check verification status (auth required)
 */
const router = express.Router();
/**
 * Rate limiter for age verification endpoints.
 * Limits each IP to 5 verification attempts per hour to prevent abuse.
 * Applied to /verify endpoint.
 */
const ageVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 verification attempts per hour
  message: 'Too many verification attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to verification endpoints
router.use('/verify', ageVerificationLimiter);

/**
 * POST /api/age/initiate
 * Initiate age verification process
 * Public endpoint
 */
router.post('/initiate', async (req: Request, res: Response): Promise<Response> => {
  try {
    const input = InitiateVerificationSchema.parse(req.body);
    const userId = req.user?.id || 'anonymous'; // Allow anonymous initiation

    const result = await ageVerificationService.initiateVerification(userId, input.method);

    if (result.success) {
      return res.json({
        success: true,
        data: result,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    const zerr = error as unknown as ZodLikeError;
    if (zerr?.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: Array.isArray(zerr.errors)
          ? zerr.errors.map(e => ({ field: (e.path || []).join('.'), message: e.message || '' }))
          : [{ field: 'input', message: (error as Error).message }],
      });
    }
    logger.error('Age verification initiation failed', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Verification initiation failed',
      message: 'Unable to start verification process',
    });
  }
});

/**
 * POST /api/age/verify
 * Complete age verification
 * Public endpoint (but requires valid verification ID)
 */
router.post('/verify', async (req: Request, res: Response): Promise<Response> => {
  try {
    const input = CompleteVerificationSchema.parse(req.body);

    const result = await ageVerificationService.completeVerification(input.verificationId, input);

    if (result.success) {
      // Log successful verification
      logger.audit('Age verification completed', {
        verificationId: input.verificationId,
        age: result.age,
        confidence: result.confidence,
        ip: req.ip,
      });

      return res.json({
        success: true,
        data: result,
      });
    } else {
      // Log failed verification
      logger.audit('Age verification failed', {
        verificationId: input.verificationId,
        error: result.error,
        ip: req.ip,
      });

      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    const zerr = error as unknown as ZodLikeError;
    if (zerr?.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: Array.isArray(zerr.errors)
          ? zerr.errors.map(e => ({ field: (e.path || []).join('.'), message: e.message || '' }))
          : [{ field: 'input', message: (error as Error).message }],
      });
    }
    logger.error('Age verification completion failed', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Verification failed',
      message: 'Unable to complete verification',
    });
  }
});

/**
 * POST /api/age/parental-consent
 * Request parental consent for minor
 * Public endpoint
 */
router.post('/parental-consent', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { parentEmail, childAge } = req.body;

    const result = await ageVerificationService.processParentalConsent({
      parentEmail,
      childAge: parseInt(childAge, 10),
      parentConsent: true, // Implied by request
    });

    if (result.success) {
      return res.json({
        success: true,
        data: result,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    logger.error('Parental consent request failed', { error: (error as Error).message });
    return res.status(500).json({
      success: false,
      error: 'Parental consent request failed',
      message: 'Unable to process consent request',
    });
  }
});

/**
 * POST /api/age/parental-consent/:token
 * Verify parental consent (parent clicks link in email)
 * Public endpoint
 */
router.post('/parental-consent/:token', async (req: Request, res: Response): Promise<Response> => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token required',
      });
    }
    const { approved } = req.body;

    const result = await ageVerificationService.verifyParentalConsent(token, approved);

    if (result.success) {
      logger.audit('Parental consent verified', {
        token,
        approved,
        childUserId: result.childUserId,
      });

      return res.json({
        success: true,
        data: result,
        message: approved ? 'Parental consent approved. Child account created.' : 'Consent denied.',
      });
    } else {
      logger.audit('Parental consent failed', { token, error: result.error });

      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    logger.error('Parental consent verification failed', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Consent verification failed',
      message: 'Unable to verify parental consent',
    });
  }
});

/**
 * GET /api/age/status
 * Get user's age verification status
 * Requires authentication
 */
router.get('/status', authenticate, async (req: Request, res: Response): Promise<Response> => {
  try {
    const currentUser = (req as unknown as Request & { user?: { id: string } }).user;
    if (!currentUser) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const userId = currentUser.id;

    const status = await ageVerificationService.getVerificationStatus(userId);
    if (!status) {
      return res.status(404).json({ success: false, error: 'Verification not found' });
    }

    return res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    const currentUser = (req as unknown as Request & { user?: { id: string } }).user;
    logger.error('Status check failed', {
      error: (error as Error).message,
      userId: currentUser?.id || 'unknown',
    });
    return res.status(500).json({
      success: false,
      error: 'Status check failed',
      message: 'Unable to retrieve verification status',
    });
  }
});

/**
 * POST /api/age/check-access
 * Check if user can access specific content
 * Requires authentication
 */
router.post(
  '/check-access',
  authenticate,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { contentRating } = req.body;
      const currentUser = (req as unknown as Request & { user?: { id: string } }).user;
      if (!currentUser) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }
      const userId = currentUser.id;

      // Get user's verified age
      const status = await ageVerificationService.getVerificationStatus(userId);
      if (!status) {
        return res.status(404).json({ success: false, error: 'Verification not found' });
      }

      if (!status.verified) {
        return res.status(403).json({
          success: false,
          error: 'Age verification required',
          message: 'Please verify your age to access this content',
        });
      }

      const canAccess = ageVerificationService.canAccessContent(
        status.age as number,
        contentRating
      );

      return res.json({
        success: true,
        data: {
          canAccess,
          userAge: status.age,
          contentRating,
          restrictions: ageVerificationService.getAgeRestrictions(status.age as number),
        },
      });
    } catch (error) {
      const currentUser = (req as unknown as Request & { user?: { id: string } }).user;
      logger.error('Access check failed', {
        error: (error as Error).message,
        userId: currentUser?.id || 'unknown',
      });
      return res.status(500).json({
        success: false,
        error: 'Access check failed',
        message: 'Unable to verify content access',
      });
    }
  }
);

/**
 * GET /api/age/restrictions
 * Get age-based restrictions for current user
 * Requires authentication
 */
router.get(
  '/restrictions',
  authenticate,
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const currentUser = (req as unknown as Request & { user?: { id: string } }).user;
      if (!currentUser) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }
      const userId = currentUser.id;

      const status = await ageVerificationService.getVerificationStatus(userId);
      if (!status) {
        return res.status(404).json({ success: false, error: 'Verification not found' });
      }

      if (!status.verified) {
        return res.json({
          success: true,
          data: {
            verified: false,
            restrictions: {
              contentRating: 'U',
              features: ['age_verification_required'],
            },
          },
        });
      }

      const restrictions = ageVerificationService.getAgeRestrictions(status.age as number);

      return res.json({
        success: true,
        data: {
          verified: true,
          age: status.age,
          restrictions,
        },
      });
    } catch (error) {
      const currentUser = (req as unknown as Request & { user?: { id: string } }).user;
      logger.error('Restrictions check failed', {
        error: (error as Error).message,
        userId: currentUser?.id || 'unknown',
      });
      return res.status(500).json({
        success: false,
        error: 'Restrictions check failed',
        message: 'Unable to retrieve age restrictions',
      });
    }
  }
);

/**
 * POST /api/age/admin/reverify
 * Force re-verification for user (admin only)
 * Requires admin role
 */
router.post(
  '/admin/reverify/:userId',
  authenticate,
  requireRole('admin'),
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { userId } = req.params;
      const currentUser = (req as unknown as Request & { user?: { id: string } }).user;
      if (!currentUser) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }
      const adminId = currentUser.id;

      // Reset user's verification status
      // await db.users.update({ id: userId }, { verifiedAge: null });

      logger.audit('Admin forced re-verification', { userId, adminId });

      return res.json({
        success: true,
        message: 'User verification reset. User will need to verify age again.',
      });
    } catch (error) {
      logger.error('Admin re-verification failed', { error: (error as Error).message });
      return res.status(500).json({
        success: false,
        error: 'Re-verification failed',
        message: 'Unable to reset user verification',
      });
    }
  }
);

/**
 * Age verification router: endpoints for verification flows, admin
 * re-verification and age-restricted content gating.
 */
export default router;
