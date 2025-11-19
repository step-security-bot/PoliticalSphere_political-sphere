/**
 * Political Neutrality Enforcer Tests
 *
 * Tests for constitutional-tier political neutrality validation.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { PoliticalNeutralityEnforcer } from '../../src/governance/political-neutrality';

describe('PoliticalNeutralityEnforcer', () => {
  let enforcer: PoliticalNeutralityEnforcer;

  beforeEach(() => {
    enforcer = new PoliticalNeutralityEnforcer();
  });

  describe('checkNeutrality()', () => {
    it('should pass neutral content', async () => {
      const neutralText = 'The government implements policies that affect citizens.';

      const result = await enforcer.checkNeutrality(neutralText);

      expect(result.passed).toBe(true);
      expect(result.neutralityScore).toBeGreaterThanOrEqual(0.9);
    });

    it('should detect excessive partisan language', async () => {
      // Needs 4+ partisan keywords to trigger bias detection
      const partisanText =
        'The radical socialist progressive liberal leftist agenda is destroying our country!';

      const result = await enforcer.checkNeutrality(partisanText);

      expect(result.biases.length).toBeGreaterThan(0);
      expect(result.biases.some(b => b.type === 'partisan')).toBe(true);
    });

    it('should detect absolutist framing', async () => {
      const framingText = 'This is obviously the only solution and everyone knows it.';

      const result = await enforcer.checkNeutrality(framingText);

      expect(result.biases.some(b => b.type === 'framing')).toBe(true);
    });

    it('should calculate neutrality score', async () => {
      const text = 'Policy proposals vary across the political spectrum.';

      const result = await enforcer.checkNeutrality(text);

      expect(result.neutralityScore).toBeGreaterThanOrEqual(0);
      expect(result.neutralityScore).toBeLessThanOrEqual(1);
    });

    it('should detect sentiment imbalance', async () => {
      const unbalancedText = 'This is excellent, great, wonderful, and amazing policy!';

      const result = await enforcer.checkNeutrality(unbalancedText);

      expect(result.biases.some(b => b.type === 'sentiment')).toBe(true);
    });
  });

  describe('detectVotingManipulation()', () => {
    it('should pass clean data', () => {
      const cleanData = { message: 'All citizens have the right to vote.' };

      const result = enforcer.detectVotingManipulation(cleanData);

      expect(result.detected).toBe(false);
      expect(result.findings.length).toBe(0);
    });

    it('should detect vote field manipulation', () => {
      const manipulatedData = { votes: 9999999 };

      const result = enforcer.detectVotingManipulation(manipulatedData);

      expect(result.detected).toBe(true);
      expect(result.findings.length).toBeGreaterThan(0);
    });

    it('should detect vote weighting manipulation', () => {
      const manipulatedData = { voteWeight: 2.0 };

      const result = enforcer.detectVotingManipulation(manipulatedData);

      expect(result.detected).toBe(true);
      expect(result.findings.some(f => f.includes('weighting'))).toBe(true);
    });
  });

  describe('detectModerationBias()', () => {
    it('should pass objective moderation', () => {
      const action = {
        type: 'remove' as const,
        content: 'spam content',
        reason: 'spam',
      };

      const result = enforcer.detectModerationBias(action);

      expect(result.biased).toBe(false);
    });

    it('should detect politically biased moderation', () => {
      const action = {
        type: 'remove' as const,
        content: 'political opinion',
        reason: 'wrong ideology',
      };

      const result = enforcer.detectModerationBias(action);

      expect(result.biased).toBe(true);
      expect(result.findings.length).toBeGreaterThan(0);
    });

    it('should detect lack of objective justification', () => {
      const action = {
        type: 'flag' as const,
        content: 'content',
        reason: 'I disagree with this',
      };

      const result = enforcer.detectModerationBias(action);

      expect(result.biased).toBe(true);
      expect(result.findings.some(f => f.includes('objective justification'))).toBe(true);
    });
  });

  describe('detectPowerManipulation()', () => {
    it('should always flag power changes as suspicious', () => {
      const change = {
        userId: 'user-123',
        action: 'grant' as const,
        permission: 'admin',
        reason: 'needed for work',
      };

      const result = enforcer.detectPowerManipulation(change);

      expect(result.suspicious).toBe(true);
      expect(result.findings.length).toBeGreaterThan(0);
    });

    it('should detect politically motivated permission changes', () => {
      const change = {
        userId: 'user-123',
        action: 'revoke' as const,
        permission: 'voting',
        reason: 'political alignment issues',
      };

      const result = enforcer.detectPowerManipulation(change);

      expect(result.suspicious).toBe(true);
      expect(result.findings.some(f => f.includes('Politically motivated'))).toBe(true);
    });
  });
});
