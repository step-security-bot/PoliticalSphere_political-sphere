/**
 * Consent Management System
 *
 * Granular consent tracking per GDPR Article 7.
 *
 * @module privacy/consent-manager
 */

import type { ConsentRecord } from '../types';

/**
 * Consent Purpose Categories
 */
export enum ConsentPurpose {
  ESSENTIAL = 'essential', // Cannot be declined
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  PERSONALIZATION = 'personalization',
  THIRD_PARTY_SHARING = 'third-party-sharing',
}

/**
 * Consent Manager
 *
 * Tracks and manages user consent for data processing.
 */
export class ConsentManager {
  private consents: Map<string, ConsentRecord[]> = new Map();

  /**
   * Record consent
   */
  recordConsent(
    userId: string,
    purpose: string,
    granted: boolean,
    legalBasis: ConsentRecord['legalBasis'],
    expiryDate?: Date
  ): ConsentRecord {
    const record: ConsentRecord = {
      userId,
      purpose,
      granted,
      timestamp: new Date(),
      expiryDate,
      legalBasis,
    };

    const userConsents = this.consents.get(userId) || [];
    userConsents.push(record);
    this.consents.set(userId, userConsents);

    console.log(`[CONSENT] Recorded ${granted ? 'granted' : 'denied'} consent for ${purpose}`, {
      userId,
      legalBasis,
    });

    return record;
  }

  /**
   * Check if user has granted consent
   */
  hasConsent(userId: string, purpose: string): boolean {
    const userConsents = this.consents.get(userId) || [];
    const relevant = userConsents.filter(c => c.purpose === purpose);
    if (relevant.length === 0) return false;

    // Find latest by timestamp; if equal timestamps, prefer the later insertion (reduce walks in insertion order)
    const latest = relevant.reduce<ConsentRecord | undefined>(
      (acc, curr) => {
        if (!acc) return curr;
        const accTime = acc.timestamp.getTime();
        const currTime = curr.timestamp.getTime();
        if (currTime > accTime) return curr;
        if (currTime === accTime) return curr; // prefer newer record when times equal
        return acc;
      },
      undefined as ConsentRecord | undefined
    );

    if (!latest) return false;

    if (latest.expiryDate && latest.expiryDate < new Date()) {
      return false;
    }
    return latest.granted;
  }

  /**
   * Withdraw consent (GDPR Article 7(3))
   */
  withdrawConsent(userId: string, purpose: string): void {
    this.recordConsent(userId, purpose, false, 'consent');
    console.log(`[CONSENT] User ${userId} withdrew consent for ${purpose}`);
  }

  /**
   * Get all consents for user
   */
  getUserConsents(userId: string): ConsentRecord[] {
    return this.consents.get(userId) || [];
  }

  /**
   * Get consent summary for user
   */
  getConsentSummary(userId: string): Record<
    string,
    {
      granted: boolean;
      timestamp: Date;
      expiryDate?: Date;
    }
  > {
    const userConsents = this.getUserConsents(userId);
    const summary: Record<
      string,
      {
        granted: boolean;
        timestamp: Date;
        expiryDate?: Date;
      }
    > = {};

    // Group by purpose, keep only latest
    for (const consent of userConsents) {
      if (!summary[consent.purpose] || consent.timestamp > summary[consent.purpose].timestamp) {
        summary[consent.purpose] = {
          granted: consent.granted,
          timestamp: consent.timestamp,
          expiryDate: consent.expiryDate,
        };
      }
    }

    return summary;
  }

  /**
   * Check if consent needs renewal
   */
  needsRenewal(userId: string, purpose: string, renewalPeriodDays: number = 365): boolean {
    const userConsents = this.consents.get(userId) || [];
    const relevant = userConsents
      .filter(c => c.purpose === purpose && c.granted)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (relevant.length === 0) return true;

    const latest = relevant[0];
    const now = Date.now();
    const age = now - latest.timestamp.getTime();
    const renewalThreshold = renewalPeriodDays * 24 * 60 * 60 * 1000;

    return age > renewalThreshold;
  }

  /**
   * Generate consent audit log
   */
  generateAuditLog(userId: string): string {
    const consents = this.getUserConsents(userId);

    const log = consents
      .map(c => {
        return `[${c.timestamp.toISOString()}] ${c.purpose}: ${c.granted ? 'GRANTED' : 'DENIED'} (${c.legalBasis})`;
      })
      .join('\n');

    return `Consent Audit Log for User: ${userId}\n${'-'.repeat(50)}\n${log}`;
  }
}
