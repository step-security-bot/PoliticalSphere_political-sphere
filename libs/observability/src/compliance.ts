/**
 * Enterprise Compliance Features
 *
 * Audit trails, data retention policies, and security compliance features.
 */

import { getLogger } from './logging.js';

const logger = getLogger();

export interface AuditEvent {
  id: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: Record<string, unknown>;
  complianceFlags?: string[];
}

export interface DataRetentionPolicy {
  name: string;
  dataType: string;
  retentionPeriod: number; // days
  encryptionRequired: boolean;
  backupRequired: boolean;
  complianceFrameworks: string[];
}

export interface ComplianceConfig {
  auditEnabled: boolean;
  auditLogRetention: number; // days
  dataRetentionPolicies: DataRetentionPolicy[];
  encryptionEnabled: boolean;
  gdprCompliance: boolean;
  hipaaCompliance: boolean;
  soc2Compliance: boolean;
}

class ComplianceService {
  private config: ComplianceConfig;
  private auditBuffer: AuditEvent[] = [];
  private readonly maxBufferSize = 100;

  constructor(config: Partial<ComplianceConfig> = {}) {
    this.config = {
      auditEnabled: config.auditEnabled ?? true,
      auditLogRetention: config.auditLogRetention ?? 2555, // 7 years for GDPR/SOC2
      dataRetentionPolicies: config.dataRetentionPolicies ?? this.getDefaultRetentionPolicies(),
      encryptionEnabled: config.encryptionEnabled ?? true,
      gdprCompliance: config.gdprCompliance ?? true,
      hipaaCompliance: config.hipaaCompliance ?? false,
      soc2Compliance: config.soc2Compliance ?? true,
    };
  }

  /**
   * Log an audit event
   */
  logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    if (!this.config.auditEnabled) return;

    const auditEvent: AuditEvent = {
      ...event,
      id: this.generateAuditId(),
      timestamp: new Date().toISOString(),
    };

    // Add compliance flags based on the event
    auditEvent.complianceFlags = this.determineComplianceFlags(auditEvent);

    // Buffer the event
    this.auditBuffer.push(auditEvent);

    // Flush if buffer is full
    if (this.auditBuffer.length >= this.maxBufferSize) {
      this.flushAuditBuffer();
    }

    // Log to console for immediate visibility
    logger.info('AUDIT:', { auditEvent });
  }

  /**
   * Flush buffered audit events to persistent storage
   */
  async flushAuditBuffer(): Promise<void> {
    if (this.auditBuffer.length === 0) return;

    try {
      // In a real implementation, this would write to a secure audit log
      // For now, we'll just clear the buffer
      const eventsToFlush = [...this.auditBuffer];
      this.auditBuffer = [];

      // TODO: Implement secure audit log storage
      // This could involve writing to encrypted files, databases, or external systems

      logger.info(`Flushed ${eventsToFlush.length} audit events`);
    } catch (error) {
      logger.error('Failed to flush audit buffer:', error as Error);
      // In case of failure, keep the events in buffer for retry
      // In production, implement proper error handling and retry logic
    }
  }

  /**
   * Check if an operation requires audit logging
   */
  requiresAudit(action: string, resource: string): boolean {
    // Define which operations require audit logging
    const auditRequiredActions = [
      'user_login',
      'user_logout',
      'password_change',
      'role_change',
      'data_access',
      'data_modification',
      'admin_action',
      'security_event',
    ];

    const auditRequiredResources = [
      'user',
      'role',
      'permission',
      'sensitive_data',
      'audit_log',
      'security_config',
    ];

    return auditRequiredActions.includes(action) || auditRequiredResources.includes(resource);
  }

  /**
   * Check data retention policy for a data type
   */
  getRetentionPolicy(dataType: string): DataRetentionPolicy | null {
    return this.config.dataRetentionPolicies.find(policy => policy.dataType === dataType) || null;
  }

  /**
   * Check if data should be retained based on retention policy
   */
  shouldRetainData(dataType: string, createdAt: Date): boolean {
    const policy = this.getRetentionPolicy(dataType);
    if (!policy) return true; // Default to retain if no policy

    const retentionMs = policy.retentionPeriod * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - retentionMs);

    return createdAt > cutoffDate;
  }

  /**
   * Anonymize data for compliance (GDPR)
   */
  anonymizeData(data: Record<string, unknown>): Record<string, unknown> {
    logger.debug('Anonymizing data', {
      dataTypes: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, typeof v])),
    });
    const anonymized = { ...data };

    // Remove or hash PII
    const piiFields = ['email', 'phone', 'address', 'name', 'ssn', 'ipAddress'];

    piiFields.forEach(field => {
      if (anonymized[field]) {
        if (this.config.gdprCompliance) {
          // For GDPR, remove PII entirely or use pseudonymization
          delete anonymized[field];
        } else {
          // Hash sensitive data
          anonymized[field] = this.hashData(anonymized[field] as string);
        }
      }
    });

    return anonymized;
  }

  /**
   * Check if user has consented to data processing
   */
  hasDataProcessingConsent(userId: string, purpose: string): boolean {
    if (!this.config.gdprCompliance) return true;

    // In a real implementation, this would check a consent database
    // For now, return true as a placeholder
    logger.debug(`Checking consent for user ${userId} and purpose ${purpose}`);
    return true;
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(): Promise<Record<string, unknown>> {
    const report = {
      timestamp: new Date().toISOString(),
      complianceFrameworks: {
        gdpr: this.config.gdprCompliance,
        hipaa: this.config.hipaaCompliance,
        soc2: this.config.soc2Compliance,
      },
      audit: {
        enabled: this.config.auditEnabled,
        retentionDays: this.config.auditLogRetention,
        bufferedEvents: this.auditBuffer.length,
      },
      dataRetention: {
        policies: this.config.dataRetentionPolicies.length,
        encryptionEnabled: this.config.encryptionEnabled,
      },
      security: {
        encryptionEnabled: this.config.encryptionEnabled,
      },
    };

    logger.debug('Generated compliance report structure', { keys: Object.keys(report) });

    return report;
  }

  /**
   * Get default data retention policies
   */
  private getDefaultRetentionPolicies(): DataRetentionPolicy[] {
    return [
      {
        name: 'User Data Retention',
        dataType: 'user_data',
        retentionPeriod: 2555, // 7 years for GDPR
        encryptionRequired: true,
        backupRequired: true,
        complianceFrameworks: ['GDPR', 'SOC2'],
      },
      {
        name: 'Audit Log Retention',
        dataType: 'audit_log',
        retentionPeriod: 2555, // 7 years
        encryptionRequired: true,
        backupRequired: true,
        complianceFrameworks: ['GDPR', 'SOC2', 'HIPAA'],
      },
      {
        name: 'Session Data Retention',
        dataType: 'session_data',
        retentionPeriod: 30, // 30 days
        encryptionRequired: true,
        backupRequired: false,
        complianceFrameworks: ['GDPR'],
      },
      {
        name: 'Application Metrics',
        dataType: 'metrics',
        retentionPeriod: 90, // 90 days
        encryptionRequired: false,
        backupRequired: true,
        complianceFrameworks: ['SOC2'],
      },
      {
        name: 'Error Logs',
        dataType: 'error_logs',
        retentionPeriod: 365, // 1 year
        encryptionRequired: true,
        backupRequired: true,
        complianceFrameworks: ['GDPR', 'SOC2'],
      },
    ];
  }

  /**
   * Generate unique audit event ID
   */
  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Determine compliance flags for an audit event
   */
  private determineComplianceFlags(event: AuditEvent): string[] {
    const flags: string[] = [];

    if (this.config.gdprCompliance) {
      flags.push('GDPR');
    }

    if (this.config.hipaaCompliance && this.isHipaaRelevant(event)) {
      flags.push('HIPAA');
    }

    if (this.config.soc2Compliance) {
      flags.push('SOC2');
    }

    // Add flags based on event characteristics
    if (event.resource === 'sensitive_data') {
      flags.push('PII');
    }

    if (!event.success) {
      flags.push('FAILED_OPERATION');
    }

    return flags;
  }

  /**
   * Check if an event is HIPAA relevant
   */
  private isHipaaRelevant(event: AuditEvent): boolean {
    const hipaaResources = ['health_data', 'medical_record', 'patient_info'];
    const hipaaActions = ['data_access', 'data_modification'];

    return hipaaResources.includes(event.resource) || hipaaActions.includes(event.action);
  }

  /**
   * Hash data for anonymization
   */
  private hashData(data: string): string {
    // Simple hash for demonstration - use crypto.createHash in production
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}

// Singleton instance
let complianceServiceInstance: ComplianceService | null = null;

/**
 * Get compliance service instance
 */
export function getComplianceService(config?: Partial<ComplianceConfig>): ComplianceService {
  if (!complianceServiceInstance) {
    complianceServiceInstance = new ComplianceService(config);
  }
  return complianceServiceInstance;
}

/**
 * Initialize compliance service
 */
export function initializeCompliance(config?: Partial<ComplianceConfig>): ComplianceService {
  return getComplianceService(config);
}

export { ComplianceService };
export default getComplianceService;
