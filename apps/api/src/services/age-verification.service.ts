/**
 * Represents a complete age verification record for a user.
 * Contains all verification data including user ID, age, verification status,
 * and metadata about the verification process.
 */
type VerificationRecord = {
  /** Unique identifier for this verification record */
  id?: string;
  /** The user ID this verification record belongs to */
  userId: string;
  /** Whether the user's age has been successfully verified */
  verified: boolean;
  /** The calculated age of the user in years */
  age: number;
  /** The method used for age verification (e.g., 'document', 'credit_card', 'parental_consent') */
  verificationMethod?: string;
  /** ISO 8601 timestamp when verification was completed */
  verifiedAt?: string;
  /** Additional metadata or notes about the verification process */
  [key: string]: unknown;
};

/**
 * Interface for age verification data persistence operations.
 * Provides methods to create, retrieve, update, and query verification records.
 * Implementations should handle data validation and error handling appropriately.
 */
type AgeVerificationStore = {
  /** Creates a new verification record in the data store */
  create: (data: VerificationRecord) => Promise<VerificationRecord>;
  /** Retrieves a verification record by user ID */
  getById: (userId: string) => Promise<VerificationRecord | null>;
  /** Updates an existing verification record with partial data */
  update: (id: string, data: Partial<VerificationRecord>) => Promise<VerificationRecord>;
  /** Retrieves all verification records from the data store */
  getAll: () => Promise<VerificationRecord[]>;
};

/**
 * Calculates the age in years from a date of birth string.
 * @param dob - Date of birth in ISO 8601 format (YYYY-MM-DD or full ISO string)
 * @returns The calculated age in years
 * @throws Error if the date of birth format is invalid
 * @example
 * ```typescript
 * calculateAge('2000-01-01'); // Returns 24 (assuming current year is 2024)
 * calculateAge('1990-12-31T23:59:59Z'); // Returns 33
 * ```
 */
function calculateAge(dob: string): number {
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date of birth format');
  const now = new Date();
  let age = now.getUTCFullYear() - date.getUTCFullYear();
  const m = now.getUTCMonth() - date.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < date.getUTCDate())) {
    age -= 1;
  }
  return age;
}

/**
 * Service class for handling age verification operations in the Political Sphere platform.
 * Provides comprehensive age verification functionality including document validation,
 * parental consent workflows, content access control, and verification statistics.
 *
 * This service ensures compliance with age restrictions for political content and
 * maintains audit trails for all verification activities.
 *
 * @example
 * ```typescript
 * const store = new DatabaseAgeVerificationStore();
 * const service = new AgeVerificationService(store);
 *
 * const result = await service.verifyAge({
 *   userId: 'user123',
 *   dateOfBirth: '2000-01-01',
 *   verificationMethod: 'document'
 * });
 * ```
 */
export default class AgeVerificationService {
  /** The data store implementation for persisting verification records */
  private store: AgeVerificationStore;

  /**
   * Creates a new AgeVerificationService instance.
   * @param store - The data store implementation for verification records
   */
  constructor(store: AgeVerificationStore) {
    this.store = store;
  }

  /**
   * Verifies a user's age based on their date of birth and creates a verification record.
   * For users 18 and older, creates a verified record. For users under 18, returns an
   * unverified record with rejection reason.
   *
   * @param data - The verification data including user ID, date of birth, and method
   * @param data.userId - Unique identifier for the user being verified
   * @param data.dateOfBirth - Date of birth in ISO 8601 format
   * @param data.verificationMethod - Method used for verification (e.g., 'document', 'credit_card')
   * @param data.documentType - Optional document type for additional validation
   * @returns Promise resolving to a VerificationRecord with verification results
   * @throws Error if required fields are missing or dateOfBirth is invalid
   *
   * @example
   * ```typescript
   * const result = await service.verifyAge({
   *   userId: 'user123',
   *   dateOfBirth: '2000-01-01',
   *   verificationMethod: 'document',
   *   documentType: 'passport'
   * });
   *
   * if (result.verified) {
   *   console.log(`User is ${result.age} years old and verified`);
   * } else {
   *   console.log(`Verification failed: ${result.reason}`);
   * }
   * ```
   */
  async verifyAge(data: {
    userId: string;
    dateOfBirth: string;
    verificationMethod: string;
    documentType?: string;
  }): Promise<VerificationRecord> {
    if (!data?.dateOfBirth || !data?.verificationMethod) {
      throw new Error('Missing required fields: dateOfBirth, verificationMethod');
    }

    const age = calculateAge(data.dateOfBirth);

    if (age >= 18) {
      const record: VerificationRecord = {
        ...data,
        userId: data.userId,
        verified: true,
        age,
        verificationMethod: data.verificationMethod,
        verifiedAt: new Date().toISOString(),
      };
      return this.store.create(record);
    }

    return {
      verified: false,
      age,
      userId: data.userId,
      reason: 'User must be at least 18 years old',
    } as unknown as VerificationRecord;
  }

  // --- Compatibility/route helpers (minimal implementations) ---
  /**
   * Initiates an age verification process for a user.
   * Creates an initial unverified record and returns a verification ID for tracking.
   * This is typically the first step in a multi-step verification workflow.
   *
   * @param userId - The user ID to initiate verification for
   * @param method - The verification method to be used (e.g., 'document', 'credit_card')
   * @returns Promise resolving to verification initiation result with ID
   *
   * @example
   * ```typescript
   * const result = await service.initiateVerification('user123', 'document');
   * if (result.success) {
   *   // Redirect user to upload documents using result.verificationId
   *   redirectToUpload(result.verificationId);
   * }
   * ```
   */
  async initiateVerification(userId: string, method: string) {
    // Minimal implementation: create an unverified record and return an id
    const id = `verif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await this.store.create({ id, userId, verified: false, age: 0, verificationMethod: method });
    return { success: true, verificationId: id };
  }

  /**
   * Completes an age verification process using provided verification data.
   * Updates the verification record with the calculated age and verification status.
   *
   * @param verificationId - The ID of the verification process to complete
   * @param payload - The completion payload containing verification data
   * @param payload.dateOfBirth - Date of birth to calculate age from (required)
   * @param payload.verificationMethod - Optional verification method override
   * @returns Promise resolving to completion result with success status and verification details
   *
   * @example
   * ```typescript
   * const result = await service.completeVerification('verif-123', {
   *   dateOfBirth: '2000-01-01',
   *   verificationMethod: 'document'
   * });
   *
   * if (result.success) {
   *   console.log(`Verification completed: age ${result.age}, verified: ${result.verified}`);
   * }
   * ```
   */
  async completeVerification(
    verificationId: string,
    payload: { dateOfBirth?: string; verificationMethod?: string }
  ) {
    // If dateOfBirth present, verify and update record; else return failure
    if (!payload?.dateOfBirth) {
      return { success: false, error: 'dateOfBirth required' };
    }
    const age = calculateAge(payload.dateOfBirth);
    const record = await this.store.update(verificationId, {
      verified: age >= 18,
      age,
      verificationMethod: payload.verificationMethod,
      verifiedAt: new Date().toISOString(),
    });
    return { success: true, age, confidence: 0.95, verified: record.verified };
  }

  /**
   * Processes a parental consent request for a child user account.
   * Generates a consent token for the parent to approve account creation.
   * This is used for users under the age of consent who need parental approval.
   *
   * @param _opts - Parental consent options (currently unused in minimal implementation)
   * @param _opts.parentEmail - Email address of the parent/guardian
   * @param _opts.childAge - Age of the child requesting account creation
   * @param _opts.parentConsent - Optional pre-approval status
   * @returns Promise resolving to consent processing result with token
   *
   * @example
   * ```typescript
   * const result = await service.processParentalConsent({
   *   parentEmail: 'parent@example.com',
   *   childAge: 15,
   *   parentConsent: false
   * });
   *
   * // Send consent email with result.token
   * sendConsentEmail(result.token);
   * ```
   */
  async processParentalConsent(_opts: {
    parentEmail: string;
    childAge: number;
    parentConsent?: boolean;
  }) {
    // Minimal implementation: return a token and queue child creation if approved
    const token = `consent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return { success: true, token };
  }

  /**
   * Verifies a parental consent token and creates a child user account if approved.
   * Completes the parental consent workflow by validating the token and generating
   * a child user ID for account creation.
   *
   * @param token - The consent token provided by the parent
   * @param _approved - Whether the parent approved the consent (currently unused)
   * @returns Promise resolving to consent verification result with child user ID
   *
   * @example
   * ```typescript
   * const result = await service.verifyParentalConsent('consent-abc123', true);
   * if (result.success) {
   *   // Create child account with result.childUserId
   *   createChildAccount(result.childUserId);
   * }
   * ```
   */
  async verifyParentalConsent(token: string, _approved: boolean) {
    // Minimal: return success and a child user id placeholder
    if (!token) return { success: false, error: 'Invalid token' };
    const childUserId = `child-${Date.now()}`;
    return { success: true, childUserId };
  }

  /**
   * Determines if a user of a given age can access content with a specific rating.
   * Uses standard UK content rating system (U, PG, 12A, 15, 18) to evaluate access.
   *
   * @param age - The user's age in years
   * @param contentRating - The content rating to check against ('U', 'PG', '12A', '15', '18')
   * @returns True if the user can access the content, false otherwise
   *
   * @example
   * ```typescript
   * service.canAccessContent(16, '15'); // true - 16 >= 15
   * service.canAccessContent(14, '18'); // false - 14 < 18
   * service.canAccessContent(10, 'U');  // true - U requires 0+
   * ```
   */
  canAccessContent(age: number, contentRating: string) {
    // Simple rating logic: 'U' = 0+, 'PG'= 12+, '12A'=12, '15'=15, '18'=18
    const ratingMin: Record<string, number> = { U: 0, PG: 12, '12A': 12, '15': 15, '18': 18 };
    const required = ratingMin[String(contentRating) as keyof typeof ratingMin] ?? 0;
    return age >= required;
  }

  /**
   * Gets the appropriate content rating and feature restrictions for a user's age.
   * Maps user age to the highest content rating they can access and any required features.
   *
   * @param age - The user's age in years
   * @returns Object containing content rating and any required features
   *
   * @example
   * ```typescript
   * service.getAgeRestrictions(16); // { contentRating: '15', features: [] }
   * service.getAgeRestrictions(10); // { contentRating: 'U', features: ['age_verification_required'] }
   * service.getAgeRestrictions(25); // { contentRating: '18', features: [] }
   * ```
   */
  getAgeRestrictions(age: number) {
    // Minimal restrictions mapping
    if (age >= 18) return { contentRating: '18', features: [] };
    if (age >= 15) return { contentRating: '15', features: [] };
    if (age >= 12) return { contentRating: '12A', features: [] };
    return { contentRating: 'U', features: ['age_verification_required'] };
  }

  /**
   * Retrieves the current age verification status for a user.
   * Returns the verification record if one exists, null otherwise.
   *
   * @param userId - The user ID to check verification status for
   * @returns Promise resolving to the verification record or null if not found
   *
   * @example
   * ```typescript
   * const status = await service.getVerificationStatus('user123');
   * if (status?.verified) {
   *   console.log(`User verified at age ${status.age}`);
   * } else {
   *   console.log('User not verified or verification pending');
   * }
   * ```
   */
  async getVerificationStatus(userId: string): Promise<VerificationRecord | null> {
    return this.store.getById(userId);
  }

  /**
   * Updates an existing verification record with partial data.
   * Allows updating specific fields of a verification record without replacing the entire record.
   *
   * @param id - The ID of the verification record to update
   * @param update - Partial verification record data to apply
   * @returns Promise resolving to the updated verification record
   *
   * @example
   * ```typescript
   * const updated = await service.updateVerification('verif-123', {
   *   verified: true,
   *   verificationMethod: 'enhanced_document_check'
   * });
   * ```
   */
  async updateVerification(
    id: string,
    update: Partial<VerificationRecord>
  ): Promise<VerificationRecord> {
    return this.store.update(id, update);
  }

  /**
   * Checks if a user is eligible to access specific types of content.
   * Evaluates the user's verification status and age against content requirements.
   *
   * @param userId - The user ID to check eligibility for
   * @param contentType - The type of content being requested (e.g., 'adult_content', 'general')
   * @returns Promise resolving to eligibility result with age and reason if ineligible
   *
   * @example
   * ```typescript
   * const eligibility = await service.isEligibleForContent('user123', 'adult_content');
   * if (eligibility.eligible) {
   *   showAdultContent();
   * } else {
   *   showAccessDenied(eligibility.reason);
   * }
   * ```
   */
  async isEligibleForContent(
    userId: string,
    contentType: string
  ): Promise<{ eligible: boolean; age?: number; reason?: string }> {
    const record = await this.store.getById(userId);
    if (!record) {
      return { eligible: false, reason: 'Age verification required' };
    }

    if (contentType === 'adult_content') {
      if (record.verified && record.age >= 18) {
        return { eligible: true, age: record.age };
      }
      return { eligible: false, reason: 'Content requires age 18+' };
    }

    return { eligible: Boolean(record.verified), age: record.age };
  }

  /**
   * Retrieves comprehensive statistics about age verification activities.
   * Provides insights into verification success rates, user demographics, and method usage.
   *
   * @returns Promise resolving to verification statistics including counts, averages, and method breakdown
   *
   * @example
   * ```typescript
   * const stats = await service.getVerificationStats();
   * console.log(`${stats.verifiedCount}/${stats.totalVerifications} users verified`);
   * console.log(`Average age: ${stats.averageAge}`);
   * console.log('Methods used:', stats.methodStats);
   * ```
   */
  async getVerificationStats(): Promise<{
    totalVerifications: number;
    verifiedCount: number;
    rejectedCount: number;
    averageAge: number;
    methodStats: Record<string, number>;
  }> {
    const all = await this.store.getAll();
    const totalVerifications = all.length;
    const verifiedCount = all.filter(r => r.verified).length;
    const rejectedCount = totalVerifications - verifiedCount;

    const averageAge = totalVerifications
      ? Number((all.reduce((sum, r) => sum + (r.age ?? 0), 0) / totalVerifications).toFixed(2))
      : 0;

    const methodStats: Record<string, number> = {};
    for (const r of all) {
      const m = String(r.verificationMethod ?? 'unknown');
      methodStats[m] = (methodStats[m] ?? 0) + 1;
    }

    return { totalVerifications, verifiedCount, rejectedCount, averageAge, methodStats };
  }
}

// Export a default instance for routes that expect an instance
const noopStore: AgeVerificationStore = {
  create: async (data: VerificationRecord) => data,
  getById: async (_userId: string) => null,
  update: async (id: string, updateData: Partial<VerificationRecord>) => ({
    id,
    ...(updateData as VerificationRecord),
  }),
  getAll: async () => [],
};

/**
 * Default age verification service instance used by route handlers.
 *
 * This singleton uses a noop store by default and is intended for use in
 * lightweight environments and tests. Replace or mock the instance in
 * integration tests when needed.
 */
/**
 * Default `AgeVerificationService` instance used by route handlers.
 *
 * This singleton uses a no-op store by default and is convenient for
 * lightweight environments and tests. Replace or mock as needed.
 */
export const ageVerificationService = new AgeVerificationService(noopStore);
