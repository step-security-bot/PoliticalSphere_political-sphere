/**
 * Consent Management Tests
 *
 * Tests for GDPR-compliant consent tracking.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsentManager, ConsentPurpose } from '../../src/privacy/consent-manager';

describe('ConsentManager', () => {
  let consentManager: ConsentManager;
  const userId = 'user-123';

  beforeEach(() => {
    consentManager = new ConsentManager();
    vi.clearAllMocks();
  });

  it('should record consent grant', () => {
    const record = consentManager.recordConsent(userId, ConsentPurpose.ANALYTICS, true, 'consent');

    expect(record.userId).toBe(userId);
    expect(record.purpose).toBe(ConsentPurpose.ANALYTICS);
    expect(record.granted).toBe(true);
    expect(record.legalBasis).toBe('consent');
    expect(record.timestamp).toBeInstanceOf(Date);
  });

  it('should record consent denial', () => {
    const record = consentManager.recordConsent(userId, ConsentPurpose.MARKETING, false, 'consent');

    expect(record.granted).toBe(false);
    expect(consentManager.hasConsent(userId, ConsentPurpose.MARKETING)).toBe(false);
  });

  it('should check consent correctly', () => {
    // Initially no consent
    expect(consentManager.hasConsent(userId, ConsentPurpose.PERSONALIZATION)).toBe(false);

    // Grant consent
    consentManager.recordConsent(userId, ConsentPurpose.PERSONALIZATION, true, 'consent');

    // Should now have consent
    expect(consentManager.hasConsent(userId, ConsentPurpose.PERSONALIZATION)).toBe(true);
  });

  it('should withdraw consent', () => {
    // Grant consent
    consentManager.recordConsent(userId, ConsentPurpose.ANALYTICS, true, 'consent');
    expect(consentManager.hasConsent(userId, ConsentPurpose.ANALYTICS)).toBe(true);

    // Withdraw consent
    consentManager.withdrawConsent(userId, ConsentPurpose.ANALYTICS);

    // Should no longer have consent
    expect(consentManager.hasConsent(userId, ConsentPurpose.ANALYTICS)).toBe(false);
  });

  it('should use most recent consent', async () => {
    // Grant consent
    consentManager.recordConsent(userId, ConsentPurpose.ANALYTICS, true, 'consent');
    expect(consentManager.hasConsent(userId, ConsentPurpose.ANALYTICS)).toBe(true);

    // Wait 10ms to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    // Deny consent (more recent)
    consentManager.recordConsent(userId, ConsentPurpose.ANALYTICS, false, 'consent');
    expect(consentManager.hasConsent(userId, ConsentPurpose.ANALYTICS)).toBe(false);

    // Wait 10ms to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    // Grant again (most recent)
    consentManager.recordConsent(userId, ConsentPurpose.ANALYTICS, true, 'consent');
    expect(consentManager.hasConsent(userId, ConsentPurpose.ANALYTICS)).toBe(true);
  });

  it('should respect expiry dates', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

    // Grant consent with expired date
    consentManager.recordConsent(userId, ConsentPurpose.MARKETING, true, 'consent', pastDate);

    // Should not have consent (expired)
    expect(consentManager.hasConsent(userId, ConsentPurpose.MARKETING)).toBe(false);
  });

  it('should get all user consents', () => {
    consentManager.recordConsent(userId, ConsentPurpose.ANALYTICS, true, 'consent');
    consentManager.recordConsent(userId, ConsentPurpose.MARKETING, false, 'consent');
    consentManager.recordConsent(
      userId,
      ConsentPurpose.PERSONALIZATION,
      true,
      'legitimate-interest'
    );

    const consents = consentManager.getUserConsents(userId);

    expect(consents.length).toBe(3);
    expect(consents.map(c => c.purpose)).toEqual([
      ConsentPurpose.ANALYTICS,
      ConsentPurpose.MARKETING,
      ConsentPurpose.PERSONALIZATION,
    ]);
  });

  it('should generate consent summary', async () => {
    consentManager.recordConsent(userId, ConsentPurpose.ANALYTICS, true, 'consent');

    // Wait to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    consentManager.recordConsent(userId, ConsentPurpose.ANALYTICS, false, 'consent'); // Override
    consentManager.recordConsent(userId, ConsentPurpose.MARKETING, true, 'consent');

    const summary = consentManager.getConsentSummary(userId);

    expect(summary[ConsentPurpose.ANALYTICS].granted).toBe(false);
    expect(summary[ConsentPurpose.MARKETING].granted).toBe(true);
    expect(Object.keys(summary).length).toBe(2);
  });

  it('should detect when consent needs renewal', () => {
    const now = new Date();
    const oldDate = new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000); // 400 days ago

    // Create a consent record with old timestamp
    const manager = new ConsentManager();
    const userId = 'user-456';

    // Record old consent
    manager.recordConsent(userId, ConsentPurpose.ANALYTICS, true, 'consent');

    // Hack: manually backdate the timestamp
    const consents = manager.getUserConsents(userId);
    if (consents.length > 0) {
      consents[0].timestamp = oldDate;
    }

    // Should need renewal (older than 365 days)
    expect(manager.needsRenewal(userId, ConsentPurpose.ANALYTICS, 365)).toBe(true);

    // Should not need renewal with longer period
    expect(manager.needsRenewal(userId, ConsentPurpose.ANALYTICS, 500)).toBe(false);
  });

  it('should generate audit log', () => {
    consentManager.recordConsent(userId, ConsentPurpose.ANALYTICS, true, 'consent');
    consentManager.recordConsent(userId, ConsentPurpose.MARKETING, false, 'consent');

    const auditLog = consentManager.generateAuditLog(userId);

    expect(auditLog).toContain(`Consent Audit Log for User: ${userId}`);
    expect(auditLog).toContain(ConsentPurpose.ANALYTICS);
    expect(auditLog).toContain('GRANTED');
    expect(auditLog).toContain(ConsentPurpose.MARKETING);
    expect(auditLog).toContain('DENIED');
  });

  it('should handle multiple users independently', () => {
    const user1 = 'user-1';
    const user2 = 'user-2';

    consentManager.recordConsent(user1, ConsentPurpose.ANALYTICS, true, 'consent');
    consentManager.recordConsent(user2, ConsentPurpose.ANALYTICS, false, 'consent');

    expect(consentManager.hasConsent(user1, ConsentPurpose.ANALYTICS)).toBe(true);
    expect(consentManager.hasConsent(user2, ConsentPurpose.ANALYTICS)).toBe(false);
  });

  it('should support different legal bases', () => {
    consentManager.recordConsent(userId, ConsentPurpose.ESSENTIAL, true, 'contract');
    consentManager.recordConsent(userId, ConsentPurpose.ANALYTICS, true, 'consent');
    consentManager.recordConsent(
      userId,
      ConsentPurpose.PERSONALIZATION,
      true,
      'legitimate-interest'
    );

    const consents = consentManager.getUserConsents(userId);

    expect(consents.find(c => c.purpose === ConsentPurpose.ESSENTIAL)?.legalBasis).toBe('contract');
    expect(consents.find(c => c.purpose === ConsentPurpose.ANALYTICS)?.legalBasis).toBe('consent');
    expect(consents.find(c => c.purpose === ConsentPurpose.PERSONALIZATION)?.legalBasis).toBe(
      'legitimate-interest'
    );
  });
});
