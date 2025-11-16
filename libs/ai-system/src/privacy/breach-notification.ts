/**
 * Data Breach Notification
 *
 * GDPR Article 33/34 breach notification workflow.
 *
 * @module privacy/breach-notification
 */

/**
 * Data breach incident
 */
export interface DataBreachIncident {
  /** Incident ID */
  id: string;
  /** Incident timestamp */
  timestamp: Date;
  /** Breach type */
  type: 'unauthorized-access' | 'data-loss' | 'data-disclosure' | 'ransomware' | 'other';
  /** Severity assessment */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Affected data types */
  affectedDataTypes: string[];
  /** Number of affected users */
  affectedUsers: number;
  /** Incident description */
  description: string;
  /** Mitigation actions taken */
  mitigationActions: string[];
  /** Notification status */
  notificationStatus: {
    authorityNotified: boolean;
    authorityNotifiedAt?: Date;
    usersNotified: boolean;
    usersNotifiedAt?: Date;
  };
  /** Risk assessment */
  riskAssessment: {
    riskToRights: 'low' | 'high';
    requiresUserNotification: boolean;
    requiresAuthorityNotification: boolean;
    assessment: string;
  };
}

/**
 * Breach Notification Manager
 *
 * Manages data breach incidents and notifications.
 */
export class BreachNotificationManager {
  private incidents: Map<string, DataBreachIncident> = new Map();

  /**
   * Report data breach
   */
  reportBreach(
    incident: Omit<DataBreachIncident, 'id' | 'timestamp' | 'notificationStatus'>
  ): DataBreachIncident {
    const id = `breach-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();

    const breach: DataBreachIncident = {
      id,
      timestamp,
      ...incident,
      notificationStatus: {
        authorityNotified: false,
        usersNotified: false,
      },
    };

    this.incidents.set(id, breach);

    console.error(`[BREACH] Data breach reported: ${breach.type}`, {
      id,
      severity: breach.severity,
      affectedUsers: breach.affectedUsers,
    });

    // Check if immediate notifications required
    if (breach.riskAssessment.requiresAuthorityNotification) {
      this.scheduleAuthorityNotification(id);
    }

    if (breach.riskAssessment.requiresUserNotification) {
      this.scheduleUserNotification(id);
    }

    return breach;
  }

  /**
   * Schedule authority notification (72-hour GDPR requirement)
   */
  private scheduleAuthorityNotification(incidentId: string): void {
    const incident = this.incidents.get(incidentId);
    if (!incident) return;

    const deadline = new Date(incident.timestamp);
    deadline.setHours(deadline.getHours() + 72);

    console.warn(`[BREACH] Authority notification required by ${deadline.toISOString()}`);

    // In production, create task/alert for DPO
    // This would trigger automated notification workflow
  }

  /**
   * Schedule user notification (without undue delay per GDPR Article 34)
   */
  private scheduleUserNotification(incidentId: string): void {
    const incident = this.incidents.get(incidentId);
    if (!incident) return;

    console.warn(`[BREACH] User notification required for ${incident.affectedUsers} users`);

    // In production, queue email notifications
    // This would use email service to notify affected users
  }

  /**
   * Notify supervisory authority
   */
  async notifyAuthority(incidentId: string): Promise<{
    success: boolean;
    notificationId?: string;
    error?: string;
  }> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      return { success: false, error: 'Incident not found' };
    }

    // In production, submit notification to supervisory authority
    // For UK: Information Commissioner's Office (ICO)
    // For EU: relevant data protection authority

    const notificationId = `auth-notif-${Date.now()}`;

    incident.notificationStatus.authorityNotified = true;
    incident.notificationStatus.authorityNotifiedAt = new Date();

    console.log(`[BREACH] Authority notified for incident ${incidentId}`, {
      notificationId,
    });

    return {
      success: true,
      notificationId,
    };
  }

  /**
   * Notify affected users
   */
  async notifyUsers(incidentId: string): Promise<{
    success: boolean;
    notifiedCount: number;
    error?: string;
  }> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      return { success: false, notifiedCount: 0, error: 'Incident not found' };
    }

    // In production, send emails to affected users
    const notifiedCount = incident.affectedUsers;

    incident.notificationStatus.usersNotified = true;
    incident.notificationStatus.usersNotifiedAt = new Date();

    console.log(`[BREACH] Users notified for incident ${incidentId}`, {
      count: notifiedCount,
    });

    return {
      success: true,
      notifiedCount,
    };
  }

  /**
   * Get overdue authority notifications (>72 hours)
   */
  getOverdueAuthorityNotifications(): DataBreachIncident[] {
    const deadline = new Date();
    deadline.setHours(deadline.getHours() - 72);

    return Array.from(this.incidents.values()).filter(
      i =>
        i.riskAssessment.requiresAuthorityNotification &&
        !i.notificationStatus.authorityNotified &&
        i.timestamp < deadline
    );
  }

  /**
   * Generate breach report
   */
  generateBreachReport(incidentId: string): string {
    const incident = this.incidents.get(incidentId);
    if (!incident) return 'Incident not found';

    return `
# Data Breach Incident Report

**Incident ID**: ${incident.id}
**Date/Time**: ${incident.timestamp.toISOString()}
**Type**: ${incident.type}
**Severity**: ${incident.severity.toUpperCase()}

## Impact Assessment

- **Affected Users**: ${incident.affectedUsers}
- **Affected Data Types**: ${incident.affectedDataTypes.join(', ')}
- **Risk to Rights**: ${incident.riskAssessment.riskToRights.toUpperCase()}

## Description

${incident.description}

## Mitigation Actions

${incident.mitigationActions.map(a => `- ${a}`).join('\n')}

## Notification Status

- **Authority Notified**: ${incident.notificationStatus.authorityNotified ? 'Yes' : 'No'}
  ${incident.notificationStatus.authorityNotifiedAt ? `(${incident.notificationStatus.authorityNotifiedAt.toISOString()})` : ''}
- **Users Notified**: ${incident.notificationStatus.usersNotified ? 'Yes' : 'No'}
  ${incident.notificationStatus.usersNotifiedAt ? `(${incident.notificationStatus.usersNotifiedAt.toISOString()})` : ''}

## Risk Assessment

${incident.riskAssessment.assessment}
`.trim();
  }

  /**
   * Get all incidents
   */
  getAllIncidents(): DataBreachIncident[] {
    return Array.from(this.incidents.values());
  }

  /**
   * Get incidents by severity
   */
  getIncidentsBySeverity(severity: DataBreachIncident['severity']): DataBreachIncident[] {
    return this.getAllIncidents().filter(i => i.severity === severity);
  }
}
