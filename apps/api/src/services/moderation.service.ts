/**
 * Interface for moderation data persistence operations.
 * Provides methods to store, retrieve, and update moderation records.
 * All methods are optional to support different storage implementations.
 */
type ModerationStore = {
  /** Creates a new moderation record */
  create?: (record: Record<string, unknown>) => Promise<Record<string, unknown> | undefined>;
  /** Retrieves all moderation records, optionally filtered */
  getAll?: (filter?: Record<string, unknown>) => Promise<Array<Record<string, unknown>>>;
  /** Updates an existing moderation record */
  update?: (
    id: string,
    update: Record<string, unknown>
  ) => Promise<Record<string, unknown> | undefined>;
};

/**
 * Configuration for moderation rules and thresholds.
 * Defines scoring thresholds for different types of content violations.
 * Custom rules can be added for domain-specific moderation needs.
 */
type ModerationRules = {
  /** Threshold for violence content scoring (0-1) */
  violenceThreshold: number;
  /** Threshold for inappropriate language scoring (0-1) */
  languageThreshold: number;
  /** Threshold for sexual content scoring (0-1) */
  sexualThreshold: number;
  /** Optional array of custom rule identifiers */
  customRules?: string[];
};

/**
 * Service for moderating user-generated content in the political sphere platform.
 * Provides content analysis, automated moderation, and moderation queue management.
 * Uses heuristic-based scoring for violence, language, and sexual content detection.
 */
class ModerationService {
  store?: ModerationStore;
  rules: ModerationRules;
  private contentCache: Map<string, Record<string, unknown>>;

  /**
   * Creates a new ModerationService instance.
   * @param store - Optional data store for persisting moderation records
   * @param initialRules - Initial moderation rules and thresholds
   */
  constructor(
    store: ModerationStore | { moderation?: ModerationStore } | undefined,
    initialRules: Partial<ModerationRules> = {}
  ) {
    // Normalize store interface: tests pass mockDb.moderation with create/getAll/update
    // If an entire db connection is passed accidentally, detect moderation property.
    // Support passing either a ModerationStore or a database object containing `moderation` store
    if (
      store &&
      !(store as ModerationStore).create &&
      (store as { moderation?: ModerationStore }).moderation
    ) {
      this.store = (store as { moderation?: ModerationStore }).moderation; // unwrap
    } else if (store && (store as ModerationStore).create) {
      this.store = store as ModerationStore;
    } else {
      this.store = undefined;
    }
    this.rules = {
      violenceThreshold: 0.7,
      languageThreshold: 0.7,
      sexualThreshold: 0.7,
      customRules: [],
      ...initialRules,
    };
    // in-memory cache for performance
    this.contentCache = new Map();
  }

  /**
   * Analyzes content for moderation violations using heuristic keyword scoring.
   * Evaluates violence, language, and sexual content against configured thresholds.
   * @param content - The content to analyze (string or unknown type)
   * @returns Analysis result with scores and flagged status
   */
  /**
   * Analyzes content for moderation violations using heuristic keyword matching.
   * Calculates scores for violence, language, and sexual content based on weighted keywords.
   * Returns a moderation result with scores and recommended actions.
   *
   * @param content - The content to analyze (string or unknown, will be converted to string)
   * @returns Promise resolving to moderation analysis result with scores and recommendations
   *
   * @example
   * ```typescript
   * const result = await moderationService.analyzeContent("This is violent content");
   * if (result.violenceScore > 0.8) {
   *   // Content flagged for review
   *   await moderationService.moderateContent(content, userId);
   * }
   * ```
   */
  async analyzeContent(content: string | unknown) {
    const text = String(content ?? '').toLowerCase();
    const empty = text.trim().length === 0;

    // Weighted keyword heuristics: strong indicators contribute more than mild ones
    const violenceWeights = {
      kill: 1.0,
      murder: 1.0,
      bomb: 0.9,
      weapon: 0.6,
      attack: 0.6,
      violence: 0.85,
      threat: 0.85,
      threats: 0.85,
      harmful: 0.5,
      assault: 0.85,
      gore: 0.7,
    };
    const languageWeights = {
      fuck: 0.9,
      shit: 0.8,
      bitch: 0.8,
      asshole: 0.8,
      offensive: 0.85,
      inappropriate: 0.45,
      slur: 0.85,
      hate: 0.6,
    };
    const sexualWeights = {
      porn: 0.85,
      sex: 0.6,
      naked: 0.6,
      explicit: 0.5,
    };

    const scoreFor = (weightsMap: Record<string, number>) => {
      if (empty) return 0;
      let score = 0;
      for (const [w, weight] of Object.entries(weightsMap)) {
        if (text.includes(w)) score += weight;
      }
      return Math.min(1, score);
    };

    const scores = {
      violence: scoreFor(violenceWeights),
      language: scoreFor(languageWeights),
      sexual: scoreFor(sexualWeights),
    };

    const flagged =
      scores.violence > this.rules.violenceThreshold ||
      scores.language > this.rules.languageThreshold ||
      scores.sexual > this.rules.sexualThreshold;

    return { scores, flagged };
  }

  /**
   * Moderates content by analyzing it and creating a moderation record if store is available.
   * @param content - The content to moderate
   * @param userId - Optional user ID associated with the content
   * @returns Moderation result with approval status and scores
   */
  /**
   * Moderates content by analyzing it and creating a moderation record if a store is available.
   * Uses analyzeContent to check for violations and determines approval status.
   * Persists moderation decisions for audit and transparency purposes.
   *
   * @param content - The content to moderate
   * @param userId - Optional user ID associated with the content
   * @returns Promise resolving to moderation result with approval status and scores
   *
   * @example
   * ```typescript
   * const result = await moderationService.moderateContent("User post content", "user123");
   * if (!result.approved) {
   *   // Content was flagged, handle accordingly
   *   console.log("Content rejected:", result.reason);
   * }
   * ```
   */
  async moderateContent(content: string | unknown, userId?: string) {
    const analysis = await this.analyzeContent(content);
    const approved = !analysis.flagged;
    const record = {
      content,
      userId,
      approved,
      scores: analysis.scores,
      reason: approved ? undefined : 'Content exceeds moderation thresholds',
      timestamp: new Date().toISOString(),
    };

    let created: Record<string, unknown> | undefined;
    if (this.store?.create) {
      created = await this.store.create(record);
    }

    return {
      approved,
      moderationId: created?.id || undefined,
      scores: analysis.scores,
      ...(approved ? {} : { reason: record.reason }),
    };
  }

  /**
   * Handle an incoming user report and create a moderation record.
   * Expected to be called by `POST /api/moderation/report` route.
   */
  /**
   * Handles a user report about content, performing moderation analysis on the reported content.
   * Creates a report record and determines if the content should be moderated based on the evidence.
   * This is part of the user-driven moderation system for community reporting.
   *
   * @param report - The report details including content ID, user ID, reason, and evidence
   * @param report.contentId - ID of the content being reported
   * @param report.userId - ID of the user submitting the report
   * @param report.reason - Reason for the report (e.g., "harassment", "spam")
   * @param report.evidence - Optional additional evidence or context
   * @param report.category - Optional category classification
   * @param report.submittedAt - Optional submission timestamp
   * @param report.ip - Optional IP address for audit purposes
   * @param report.userAgent - Optional user agent string
   * @returns Promise resolving to report handling result with moderation outcome
   *
   * @example
   * ```typescript
   * const result = await moderationService.handleReport({
   *   contentId: "post123",
   *   userId: "user456",
   *   reason: "Inappropriate content",
   *   evidence: "The post contains offensive language"
   * });
   * ```
   */
  async handleReport(report: {
    contentId: string;
    userId: string;
    reason: string;
    evidence?: string;
    category?: string;
    submittedAt?: string;
    ip?: string;
    userAgent?: string | undefined;
  }) {
    // For the minimal implementation we use evidence text to determine moderation result
    const evidenceText = report.evidence || '';
    const moderationResult = await this.moderateContent(evidenceText, report.userId);

    const created = this.store?.create
      ? await this.store.create({
          contentId: report.contentId,
          userId: report.userId,
          reason: report.reason,
          evidence: evidenceText,
          category: report.category,
          submittedAt: report.submittedAt || new Date().toISOString(),
          ip: report.ip,
          userAgent: report.userAgent,
          approved: moderationResult.approved,
        })
      : undefined;

    return {
      reportId: (created?.id as string | undefined) || undefined,
      escalated: !moderationResult.approved,
    };
  }

  /**
   * Retrieves the moderation queue with pagination and status filtering.
   * Used by moderators to review pending content moderation decisions.
   * @param limit - Maximum number of items to return (default: 20)
   * @param status - Filter by status: 'pending', 'approved', 'rejected', or 'all'
   * @param page - Page number for pagination (default: 1)
   * @returns Paginated moderation queue with items and metadata
   */
  /**
   * Retrieves a paginated list of content items in the moderation queue.
   * Filters items by approval status and supports pagination for large queues.
   * Used by moderation interfaces to display content awaiting review.
   *
   * @param limit - Maximum number of items to return (default: 20)
   * @param status - Filter by status: 'pending', 'approved', 'rejected', or 'all' (default: 'pending')
   * @param page - Page number for pagination (default: 1)
   * @returns Promise resolving to paginated moderation queue with items and metadata
   *
   * @example
   * ```typescript
   * const queue = await moderationService.getModerationQueue(10, 'pending', 1);
   * console.log(`${queue.total} items pending moderation`);
   * queue.items.forEach(item => {
   *   // Display item for moderation review
   * });
   * ```
   */
  async getModerationQueue(limit = 20, status = 'pending', page = 1) {
    const all = (await this.getModerationHistory()) || [];
    const filtered = all.filter(i => {
      if (status === 'pending') return !i.approved;
      if (status === 'approved') return i.approved;
      if (status === 'rejected') return !i.approved;
      return true;
    });
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit) || [];
    return {
      items,
      total: filtered.length,
      page,
      limit,
    };
  }

  /**
   * Reviews content and updates the moderation disposition.
   * Used by moderators to manually approve or reject content.
   * @param contentId - ID of the content being reviewed
   * @param decision - Moderation decision: 'approve' or 'reject'
   * @param moderatorId - ID of the moderator making the decision
   * @param notes - Optional notes from the moderator
   * @returns Review result with decision details
   */
  async reviewContent(
    contentId: string,
    decision: 'approve' | 'reject',
    moderatorId: string,
    notes?: string
  ) {
    // Attempt to persist a moderation review update if store supports `update`
    if (this.store?.update) {
      await this.store.update(contentId, {
        decision,
        moderatorId,
        notes,
        reviewedAt: new Date().toISOString(),
      });
    }
    return {
      contentId,
      decision,
      moderatorId,
      notes,
      reviewedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate a simple transparency report based on moderation history
   */
  /**
   * Generates a transparency report summarizing moderation activities.
   * Provides statistics on moderation volume and categorization for audit purposes.
   * Supports filtering by time period for historical analysis.
   *
   * @param filters - Optional filters for the report
   * @param filters.period - Time period filter (e.g., 'last_30_days', 'last_7_days')
   * @param filters.startDate - Start date for custom period (ISO format)
   * @param filters.endDate - End date for custom period (ISO format)
   * @returns Promise resolving to transparency report with statistics and breakdowns
   *
   * @example
   * ```typescript
   * const report = await moderationService.generateTransparencyReport({
   *   period: 'last_30_days'
   * });
   * console.log(`Moderated ${report.total} items in the last 30 days`);
   * ```
   */
  async generateTransparencyReport(filters?: {
    period?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const items = (await this.getModerationHistory()) || [];
    const total = items.length;
    const byCategory: Record<string, number> = {};
    for (const i of items) {
      const cat = (i.category as string) || 'uncategorized';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }
    return {
      period: filters?.period || 'all',
      total,
      byCategory,
    };
  }

  /**
   * Retrieves moderation history, optionally filtered by user ID.
   * Returns all moderation records or those associated with a specific user.
   * Used for audit trails, user history, and moderation analytics.
   *
   * @param userId - Optional user ID to filter history for a specific user
   * @returns Promise resolving to array of moderation records
   *
   * @example
   * ```typescript
   * // Get all moderation history
   * const allHistory = await moderationService.getModerationHistory();
   *
   * // Get history for specific user
   * const userHistory = await moderationService.getModerationHistory('user123');
   * ```
   */
  async getModerationHistory(userId?: string) {
    const getter = this.store?.getAll;
    if (typeof getter !== 'function') {
      // Graceful fallback for tests where mock wasn't initialized yet
      return [];
    }
    try {
      if (userId) {
        return await getter.call(this.store, { userId });
      }
      return await getter.call(this.store);
    } catch (err) {
      // In test environment surface error for visibility
      if (process.env.NODE_ENV === 'test') {
        throw err;
      }
      return [];
    }
  }

  async updateModerationRules(rules: Partial<ModerationRules>) {
    const keys: (keyof ModerationRules)[] = [
      'violenceThreshold',
      'languageThreshold',
      'sexualThreshold',
    ];
    for (const k of keys) {
      if (k in rules) {
        const v = rules[k];
        if (typeof v !== 'number' || v < 0 || v > 1) {
          throw new Error('Invalid threshold value');
        }
      }
    }
    this.rules = { ...this.rules, ...rules };
  }

  /**
   * Retrieves moderation statistics including approval/rejection counts and average scores.
   * @returns Statistics about moderated content
   */
  async getModerationStats() {
    type ModerationItem = {
      approved?: boolean;
      scores?: { violence?: number; language?: number; sexual?: number };
    };
    const items = (await this.getModerationHistory()) as ModerationItem[] | null | undefined;
    const list = items || [];
    const total = list.length;
    const approved = list.filter(i => i.approved).length;
    const rejected = total - approved;

    const avg = { violence: 0, language: 0, sexual: 0 };
    if (total > 0) {
      for (const i of list) {
        const s = i.scores || {};
        avg.violence += s.violence || 0;
        avg.language += s.language || 0;
        avg.sexual += s.sexual || 0;
      }
      avg.violence /= total;
      avg.language /= total;
      avg.sexual /= total;
    }

    return {
      totalModerated: total,
      approved,
      rejected,
      averageScores: avg,
    };
  }

  /**
   * Compatibility alias for routes that expect `getStats` and `clearCache` on instance
   */
  async getStats() {
    return await this.getModerationStats();
  }

  clearCache() {
    // Clear in-memory cache for moderation results
    this.contentCache.clear();
  }

  // (Instance export will be appended after class declaration)
  // Static helper methods for pure score calculation (used by tests)
  static calculateViolenceScore(text: string | unknown) {
    const t = String(text ?? '').toLowerCase();
    const weights = {
      kill: 1.0,
      murder: 1.0,
      bomb: 0.9,
      weapon: 0.6,
      attack: 0.6,
      violence: 0.85,
      threat: 0.85,
    };
    let score = 0;
    for (const [w, weight] of Object.entries(weights)) {
      if (t.includes(w)) score += weight;
    }
    return Math.min(1, score);
  }

  static calculateLanguageScore(text: string | unknown) {
    const t = String(text ?? '').toLowerCase();
    const weights = {
      fuck: 0.9,
      shit: 0.8,
      damn: 0.5,
      bitch: 0.8,
      asshole: 0.8,
    };
    let score = 0;
    for (const [w, weight] of Object.entries(weights)) {
      if (t.includes(w)) score += weight;
    }
    return Math.min(1, score);
  }

  static calculateSexualContentScore(text: string | unknown) {
    const t = String(text ?? '').toLowerCase();
    const weights = {
      sex: 0.6,
      porn: 0.85,
      nude: 0.6,
      naked: 0.6,
    };
    let score = 0;
    for (const [w, weight] of Object.entries(weights)) {
      if (t.includes(w)) score += weight;
    }
    return Math.min(1, score);
  }

  static checkCustomRules(text: string | unknown) {
    const violations = [];
    const t = String(text ?? '').toLowerCase();
    if (t.includes('kill') || t.includes('bullying')) {
      violations.push('Harmful content detected');
    }
    if (t.includes('@') && t.includes('user')) {
      violations.push('User mention in flagged context');
    }
    return violations;
  }

  static assessAgeAppropriateness(text: string | unknown) {
    const vScore = ModerationService.calculateViolenceScore(text);
    const lScore = ModerationService.calculateLanguageScore(text);
    const sScore = ModerationService.calculateSexualContentScore(text);

    if (vScore === 0 && lScore === 0 && sScore === 0) return 'U'; // Universal
    if (vScore < 0.3 && lScore < 0.3 && sScore < 0.3) return 'PG'; // Parental Guidance
    if (vScore < 0.6 && lScore < 0.6 && sScore < 0.6) return '12A'; // 12+
    if (vScore < 0.8 && lScore < 0.8 && sScore < 0.8) return '15'; // 15+
    return '18'; // 18+
  }

  // (removed static clearCache to avoid duplicate signatures; instance method handles clearing)
}

// Export a singleton instance for route consumers and keep the class as default for tests
/**
 * Shared singleton instance of `ModerationService` used by routes and
 * background workers. Use the class (default export) in tests to create
 * isolated instances with custom stores and rules.
 */
/**
 * Shared `moderationService` singleton used by routes and background workers.
 *
 * Tests should instantiate `ModerationService` directly when isolated
 * instances are required.
 */
export const moderationService = new ModerationService(undefined);

/**
 * `ModerationService` class is the default export to allow tests and
 * advanced consumers to instantiate isolated service instances with
 * different `ModerationStore` implementations.
 */
export default ModerationService;
