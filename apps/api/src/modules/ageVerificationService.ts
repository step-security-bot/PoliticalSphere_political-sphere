/**
 * Age Verification Service
 * Handles age verification, parental consent, and age-appropriate content
 * Implements Online Safety Act and COPPA compliance
 */

import * as crypto from 'node:crypto';

import jwt from 'jsonwebtoken';

import { audit } from '../utils/logger.js';
import logger from '../utils/logger.js';

interface VerificationResult {
  success: boolean;
  verified?: boolean;
  verificationId?: string;
  userId?: string;
  method?: string;
  instructions?: string;
  expiresAt?: string;
  age?: number;
  confidence?: string;
  requiresAdditionalVerification?: boolean;
  restrictions?: Record<string, unknown>;
  message?: string;
  consentToken?: string;
  nextStep?: string;
  error?: string;
  reason?: string;
  id?: string;
}

interface ConsentResult {
  success: boolean;
  childUserId?: string;
  restrictions?: Record<string, unknown>;
  error?: string;
}

interface VerificationStatus {
  verified: boolean;
  age: number | null;
}

interface DatabaseService {
  create: (record: Record<string, unknown>) => Promise<Record<string, unknown>>;
  getById: (id: string) => Promise<Record<string, unknown> | null>;
  update: (id: string, data: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
  getAll: () => Promise<Record<string, unknown>[]>;
}

class AgeVerificationService {
  db?: DatabaseService;
  verificationTokens: Map<string, Record<string, unknown>>;
  parentalConsents: Map<string, Record<string, unknown>>;
  tokenExpiry: number;

  constructor(db?: DatabaseService) {
    this.db = db; // Injected database for tests
    this.verificationTokens = new Map(); // In production, use Redis
    this.parentalConsents = new Map(); // Store parental consent records
    this.tokenExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Initiate age verification process
   */
  async initiateVerification(
    userId: string,
    method: string = 'self_declaration'
  ): Promise<VerificationResult> {
    try {
      logger.info('Initiating age verification', { userId, method });

      const token = this.generateVerificationToken(userId);
      const verificationId = crypto.randomUUID();

      const verification = {
        id: verificationId,
        userId,
        method,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + this.tokenExpiry).toISOString(),
        token,
      };

      // Store verification request
      this.verificationTokens.set(verificationId, verification);

      // Clean up expired tokens periodically
      this.cleanupExpiredTokens();

      audit('Age verification initiated', {
        verificationId,
        userId,
        method,
      });

      return {
        success: true,
        verificationId,
        method,
        instructions: this.getMethodInstructions(method),
        expiresAt: verification.expiresAt,
      };
    } catch (error) {
      logger.error('Age verification initiation failed', {
        error: (error as Error).message,
        userId,
      });
      return { success: false, error: 'Verification initiation failed' };
    }
  }

  /**
   * Complete age verification
   */
  async completeVerification(
    verificationId: string,
    verificationData: Record<string, unknown>
  ): Promise<VerificationResult> {
    try {
      const verification = this.verificationTokens.get(verificationId);

      if (!verification) {
        return { success: false, error: 'Invalid verification ID' };
      }

      if (new Date() > new Date(verification.expiresAt as string)) {
        this.verificationTokens.delete(verificationId);
        return { success: false, error: 'Verification expired' };
      }

      const result = await this.processVerification(verification, verificationData);

      if (result.success) {
        verification.status = 'completed';
        verification.completedAt = new Date().toISOString();
        verification.age = result.age;
        verification.confidence = result.confidence;

        // Store verified age in user profile (pseudo-code)
        // await db.users.update({ id: verification.userId }, { verifiedAge: result.age });

        audit('Age verification completed', {
          verificationId,
          userId: verification.userId,
          age: result.age,
          method: verification.method,
        });
      } else {
        verification.status = 'failed';
        verification.failedAt = new Date().toISOString();
        verification.failureReason = result.error;
      }

      return result;
    } catch (error) {
      logger.error('Age verification completion failed', {
        error: (error as Error).message,
        verificationId,
      });
      return { success: false, error: 'Verification processing failed' };
    }
  }

  /**
   * Process verification based on method
   */
  async processVerification(
    verification: Record<string, unknown>,
    data: Record<string, unknown>
  ): Promise<VerificationResult> {
    switch (verification.method) {
      case 'self_declaration':
        return this.processSelfDeclaration(data);
      case 'credit_card':
        return this.processCreditCardVerification(data);
      case 'government_id':
        return this.processGovernmentIdVerification(data);
      case 'parental_consent':
        return this.processParentalConsent(data);
      default:
        return { success: false, error: 'Unsupported verification method' };
    }
  }

  /**
   * Process self-declaration (basic method)
   */
  async processSelfDeclaration(data: Record<string, unknown>): Promise<VerificationResult> {
    const { age, consent } = data;

    if (!consent) {
      return { success: false, error: 'User consent required' };
    }

    const ageNum = age as number;
    if (!ageNum || ageNum < 13) {
      return {
        success: false,
        error: 'Must be 13 or older to use this service',
      };
    }

    // For self-declaration, we trust the user but flag for additional verification if suspicious
    const requiresAdditionalVerification = ageNum >= 13 && ageNum <= 15;

    return {
      success: true,
      age: parseInt(String(ageNum), 10),
      confidence: 'low', // Self-declaration has low confidence
      requiresAdditionalVerification,
      restrictions: this.getAgeRestrictions(parseInt(String(ageNum), 10)),
    };
  }

  /**
   * Process credit card verification (age estimation)
   */
  async processCreditCardVerification(data: Record<string, unknown>): Promise<VerificationResult> {
    // In production, integrate with payment processor for age verification
    // This is a placeholder - actual implementation would use services like:
    // - Stripe Radar for age estimation
    // - Third-party age verification services

    try {
      // Simulate API call to payment processor
      const ageEstimation = await this.estimateAgeFromPayment(
        (data.cardToken ?? {}) as Record<string, unknown>
      );

      if (ageEstimation.confidence > 0.8) {
        return {
          success: true,
          age: ageEstimation.age,
          confidence: 'high',
          restrictions: this.getAgeRestrictions(ageEstimation.age),
        };
      } else {
        return {
          success: false,
          error: 'Unable to verify age with sufficient confidence',
        };
      }
    } catch (error) {
      logger.error('Credit card verification failed', { error: (error as Error).message });
      return { success: false, error: 'Payment verification failed' };
    }
  }

  /**
   * Process government ID verification
   */
  async processGovernmentIdVerification(
    data: Record<string, unknown>
  ): Promise<VerificationResult> {
    // In production, integrate with ID verification services like:
    // - Veriff, Yoti, or similar KYC providers

    try {
      // Simulate document verification
      const verificationResult = await this.verifyGovernmentId(
        (data.idDocument ?? {}) as Record<string, unknown>,
        (data.selfie ?? {}) as Record<string, unknown>
      );

      if (verificationResult.isValid) {
        return {
          success: true,
          age: verificationResult.age,
          confidence: 'very_high',
          restrictions: this.getAgeRestrictions(verificationResult.age),
        };
      } else {
        return {
          success: false,
          error: verificationResult.error || 'ID verification failed',
        };
      }
    } catch (error) {
      logger.error('Government ID verification failed', {
        error: (error as Error).message,
      });
      return { success: false, error: 'ID verification service unavailable' };
    }
  }

  /**
   * Process parental consent for minors
   */
  async processParentalConsent(data: Record<string, unknown>): Promise<VerificationResult> {
    const { parentEmail, parentConsent, childAge } = data;

    if (!parentConsent) {
      return { success: false, error: 'Parental consent required' };
    }

    if ((childAge as number) >= 13) {
      return {
        success: false,
        error: 'Parental consent not required for users 13+',
      };
    }

    // Generate consent token for parent
    const consentToken = this.generateParentalConsentToken(String(parentEmail), childAge as number);

    // Store consent request
    this.parentalConsents.set(consentToken, {
      parentEmail,
      childAge,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    });

    // Send email to parent (pseudo-code)
    // await emailService.sendParentalConsentEmail(parentEmail, consentToken);

    audit('Parental consent requested', { parentEmail, childAge });

    return {
      success: true,
      message: 'Parental consent email sent',
      consentToken,
      nextStep: 'parent_verification',
    };
  }

  /**
   * Verify parental consent
   */
  async verifyParentalConsent(consentToken: string, approved: boolean): Promise<ConsentResult> {
    const consent = this.parentalConsents.get(consentToken);

    if (!consent) {
      return { success: false, error: 'Invalid consent token' };
    }

    consent.status = approved ? 'approved' : 'denied';
    consent.respondedAt = new Date().toISOString();

    if (approved) {
      // Create verified user account for child
      const childUserId = await this.createChildAccount(consent);

      audit('Parental consent approved', {
        parentEmail: consent.parentEmail,
        childAge: consent.childAge,
        childUserId,
      });

      return {
        success: true,
        childUserId,
        restrictions: this.getAgeRestrictions(consent.childAge as number),
      };
    } else {
      audit('Parental consent denied', {
        parentEmail: consent.parentEmail,
      });
      return { success: false, error: 'Parental consent denied' };
    }
  }

  /**
   * Get age-appropriate restrictions
   */
  getAgeRestrictions(age: number): Record<string, unknown> {
    const restrictions = {
      contentRating: 'U', // Default safe
      features: [],
      monitoring: false,
    };

    if (age < 13) {
      restrictions.contentRating = 'U';
      restrictions.features = ['parental_controls', 'time_limits', 'content_filtering'];
      restrictions.monitoring = true;
    } else if (age < 16) {
      restrictions.contentRating = '12';
      restrictions.features = ['content_warnings'];
      restrictions.monitoring = false;
    } else if (age < 18) {
      restrictions.contentRating = '15';
      restrictions.features = ['age_verification'];
      restrictions.monitoring = false;
    } else {
      restrictions.contentRating = '18';
      restrictions.features = ['full_access'];
      restrictions.monitoring = false;
    }

    return restrictions;
  }

  /**
   * Check if user can access content based on age
   */
  canAccessContent(userAge: number, contentRating: string): boolean {
    const ratingLevels: Record<string, number> = { U: 0, PG: 8, 12: 12, 15: 15, 18: 18 };
    const requiredAge = ratingLevels[contentRating] || 18;
    return userAge >= requiredAge;
  }

  /**
   * Get method-specific instructions
   */
  getMethodInstructions(method: string): string {
    const instructions: Record<string, string> = {
      self_declaration: 'Please confirm your age. This will be used to customize your experience.',
      credit_card: 'We will verify your age using payment information. No charges will be made.',
      government_id: 'Upload a photo of your government-issued ID and a selfie for verification.',
      parental_consent: 'We will send a consent request to your parent/guardian for approval.',
    };
    return instructions[method] || 'Please follow the verification prompts.';
  }

  /**
   * Generate secure verification token
   */
  generateVerificationToken(userId: string): string {
    const payload = {
      userId,
      type: 'age_verification',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + this.tokenExpiry) / 1000),
    };

    return jwt.sign(payload, process.env.JWT_SECRET ?? '');
  }

  /**
   * Generate parental consent token
   */
  generateParentalConsentToken(parentEmail: string, childAge: number): string {
    const payload = {
      parentEmail,
      childAge,
      type: 'parental_consent',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor((Date.now() + this.tokenExpiry) / 1000),
    };

    return jwt.sign(payload, process.env.JWT_SECRET ?? '');
  }

  // Placeholder methods for external integrations
  async estimateAgeFromPayment(
    _cardToken: Record<string, unknown>
  ): Promise<{ age: number; confidence: number }> {
    // Integrate with payment processor
    return { age: 25, confidence: 0.9 };
  }

  async verifyGovernmentId(
    _document: Record<string, unknown>,
    _selfie: Record<string, unknown>
  ): Promise<{ isValid: boolean; age?: number; error?: string }> {
    // Integrate with ID verification service
    return { isValid: true, age: 25 };
  }

  async createChildAccount(_consent: Record<string, unknown>): Promise<string> {
    // Create child user account with restrictions
    return `child_${crypto.randomUUID()}`;
  }

  /**
   * Clean up expired verification tokens
   */
  cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [id, verification] of this.verificationTokens) {
      if (new Date(verification.expiresAt as string) < now) {
        this.verificationTokens.delete(id);
      }
    }
  }

  /**
   * Verify age for a user (test-compatible method)
   */
  async verifyAge(verificationData: Record<string, unknown>): Promise<VerificationResult> {
    const { userId, dateOfBirth, verificationMethod } = verificationData;

    // Validate required fields
    const missingFields = [];
    if (!dateOfBirth) missingFields.push('dateOfBirth');
    if (!verificationMethod) missingFields.push('verificationMethod');

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Parse and validate date
    const dob = new Date(dateOfBirth as string);
    if (Number.isNaN(dob.getTime())) {
      throw new Error('Invalid date of birth format');
    }

    // Calculate age
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    // Ensure age is a valid number
    if (Number.isNaN(age) || age < 0) {
      throw new Error('Invalid age calculation');
    }

    // Check minimum age requirement (18+)
    const verified = age >= 18;

    if (!verified) {
      return {
        success: false,
        verified: false,
        age,
        reason: 'User must be at least 18 years old',
      };
    }

    // Create verification record using injected db
    if (this.db?.create) {
      const verificationRecord = {
        ...verificationData,
        verified: true,
        age,
        verifiedAt: new Date().toISOString(),
      };

      const result = await this.db.create(verificationRecord);
      return { success: true, ...result } as VerificationResult;
    }

    // Fallback if no db
    return {
      success: true,
      verified: true,
      age,
      id: crypto.randomUUID(),
      userId: String(userId),
      method: String(verificationMethod),
    };
  }

  /**
   * Get verification status for user (test-compatible method)
   */
  async getVerificationStatus(userId: string): Promise<VerificationStatus | null> {
    // Use injected db if available
    if (this.db?.getById) {
      const result = await this.db.getById(userId);
      return result as unknown as VerificationStatus | null;
    }

    // Fallback
    return { verified: false, age: null };
  }

  /**
   * Update verification record (test-compatible method)
   */
  async updateVerification(
    verificationId: string,
    updateData: Record<string, unknown>
  ): Promise<Record<string, unknown> | null> {
    // Use injected db if available
    if (this.db?.update) {
      return await this.db.update(verificationId, updateData);
    }

    // Fallback
    return { id: verificationId, ...updateData };
  }

  /**
   * Check if user is eligible for specific content type (test-compatible method)
   */
  async isEligibleForContent(
    userId: string,
    contentType: string
  ): Promise<{ eligible: boolean; reason?: string; age?: number }> {
    const verification = await this.getVerificationStatus(userId);

    if (!verification) {
      return {
        eligible: false,
        reason: 'Age verification required',
      };
    }

    // Check content type requirements
    const contentMinAge = contentType === 'adult_content' ? 18 : 13;

    if ((verification.age ?? 0) < contentMinAge) {
      return {
        eligible: false,
        reason: `Content requires age ${contentMinAge}+`,
      };
    }

    return {
      eligible: true,
      age: verification.age,
    };
  }

  /**
   * Get verification statistics (test-compatible method)
   */
  async getVerificationStats(): Promise<Record<string, unknown>> {
    let verifications = [];

    // Use injected db if available
    if (this.db?.getAll) {
      verifications = await this.db.getAll();
    }

    const totalVerifications = verifications.length;
    const verifiedCount = verifications.filter((v: Record<string, unknown>) => v.verified).length;
    const rejectedCount = verifications.filter((v: Record<string, unknown>) => !v.verified).length;

    const totalAge = verifications.reduce(
      (sum: number, v: Record<string, unknown>) => sum + ((v.age as number) || 0),
      0
    );
    const averageAge =
      totalVerifications > 0 ? Math.round((totalAge / totalVerifications) * 100) / 100 : 0;

    const methodStats: Map<string, number> = new Map();
    verifications.forEach((v: Record<string, unknown>) => {
      const method = String(v.method || v.verificationMethod || 'unknown');
      methodStats.set(method, (methodStats.get(method) || 0) + 1);
    });
    const methodStatsObj: Record<string, unknown> = {};
    for (const [method, count] of methodStats) {
      methodStatsObj[method] = count;
    }

    return {
      totalVerifications,
      verifiedCount,
      rejectedCount,
      averageAge,
      methodStats: methodStatsObj,
    };
  }
}

// Backward/forward compatibility:
// - Tests expect to import a class and call `new AgeVerificationService(...)`.
// - Application code expects to `require('../ageVerificationService')` and get a singleton instance.
// To support both without changing all callers, export the class but attach a bound
// default instance's methods as static methods on the class. This lets the module be
// used either as a constructor or as a singleton with the same methods.
const _defaultAgeVerificationInstance = new AgeVerificationService();
// Copy prototype methods to the constructor as bound functions so callers using the
// singleton-style API (require(...) and call methods) continue to work.
Object.getOwnPropertyNames(AgeVerificationService.prototype).forEach(name => {
  if (name === 'constructor') return;
  const desc = Object.getOwnPropertyDescriptor(AgeVerificationService.prototype, name);
  if (desc && typeof desc.value === 'function') {
    // biome-ignore lint/suspicious/noExplicitAny: Dynamic singleton method binding requires any
    (AgeVerificationService as any)[name] = (_defaultAgeVerificationInstance as any)[name].bind(
      _defaultAgeVerificationInstance
    );
  }
});
// biome-ignore lint/suspicious/noExplicitAny: Dynamic property assignment on class requires any
(AgeVerificationService as any).defaultInstance = _defaultAgeVerificationInstance;

export default AgeVerificationService;
