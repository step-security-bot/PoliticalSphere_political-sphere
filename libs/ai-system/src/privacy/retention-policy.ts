/**
 * Data Retention Policy
 *
 * Automated data retention and deletion per GDPR Article 5(1)(e).
 *
 * @module privacy/retention-policy
 */

/**
 * Retention policy rule
 */
export interface RetentionRule {
  /** Data type */
  dataType: string;
  /** Retention period in days */
  retentionDays: number;
  /** Legal basis for retention */
  legalBasis: string;
  /** Automatic deletion enabled */
  autoDelete: boolean;
}

/**
 * Default retention policies
 */
export const DEFAULT_RETENTION_POLICIES: RetentionRule[] = [
  {
    dataType: 'user_profile',
    retentionDays: 0, // Retained while account active
    legalBasis: 'Contract performance (account provision)',
    autoDelete: false,
  },
  {
    dataType: 'session_logs',
    retentionDays: 90,
    legalBasis: 'Legitimate interest (security)',
    autoDelete: true,
  },
  {
    dataType: 'audit_logs',
    retentionDays: 2555, // 7 years for regulatory compliance
    legalBasis: 'Legal obligation',
    autoDelete: false,
  },
  {
    dataType: 'anonymized_analytics',
    retentionDays: 730, // 2 years
    legalBasis: 'Legitimate interest (service improvement)',
    autoDelete: true,
  },
  {
    dataType: 'temporary_uploads',
    retentionDays: 30,
    legalBasis: 'Legitimate interest',
    autoDelete: true,
  },
  {
    dataType: 'deleted_account_backup',
    retentionDays: 30, // Grace period for account recovery
    legalBasis: 'Legitimate interest',
    autoDelete: true,
  },
];

/**
 * Retention Policy Manager
 */
export class RetentionPolicyManager {
  private policies: Map<string, RetentionRule>;

  constructor(policies: RetentionRule[] = DEFAULT_RETENTION_POLICIES) {
    this.policies = new Map(policies.map(p => [p.dataType, p]));
  }

  /**
   * Get retention period for data type
   */
  getRetentionPeriod(dataType: string): number {
    return this.policies.get(dataType)?.retentionDays || 365; // Default 1 year
  }

  /**
   * Check if data should be deleted
   */
  shouldDelete(dataType: string, createdAt: Date): boolean {
    const policy = this.policies.get(dataType);
    if (!policy || !policy.autoDelete) return false;

    const age = Date.now() - createdAt.getTime();
    const retentionPeriod = policy.retentionDays * 24 * 60 * 60 * 1000;

    return age > retentionPeriod;
  }

  /**
   * Run automated deletion job
   */
  async runDeletionJob(): Promise<{
    scannedTypes: string[];
    deletedRecords: number;
    errors: string[];
  }> {
    const scannedTypes: string[] = [];
    let deletedRecords = 0;
    const errors: string[] = [];

    for (const [dataType, policy] of this.policies.entries()) {
      if (!policy.autoDelete) continue;

      scannedTypes.push(dataType);

      try {
        // In production, query database for records to delete
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

        console.log(`[RETENTION] Deleting ${dataType} older than ${cutoffDate.toISOString()}`);

        // Placeholder - in production, execute DELETE query
        const deleted = 0;
        deletedRecords += deleted;
      } catch (error) {
        errors.push(
          `Failed to delete ${dataType}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    console.log(`[RETENTION] Deletion job complete: ${deletedRecords} records deleted`);

    return {
      scannedTypes,
      deletedRecords,
      errors,
    };
  }

  /**
   * Add or update retention policy
   */
  setPolicy(policy: RetentionRule): void {
    this.policies.set(policy.dataType, policy);
  }

  /**
   * Get all policies
   */
  getAllPolicies(): RetentionRule[] {
    return Array.from(this.policies.values());
  }

  /**
   * Generate retention policy documentation
   */
  generateDocumentation(): string {
    const policies = this.getAllPolicies();

    const doc = policies
      .map(p => {
        const period = p.retentionDays === 0 ? 'While account active' : `${p.retentionDays} days`;

        return `
### ${p.dataType}
- **Retention Period**: ${period}
- **Legal Basis**: ${p.legalBasis}
- **Automatic Deletion**: ${p.autoDelete ? 'Yes' : 'No'}
`;
      })
      .join('\n');

    return `# Data Retention Policies\n\n${doc}`;
  }
}
