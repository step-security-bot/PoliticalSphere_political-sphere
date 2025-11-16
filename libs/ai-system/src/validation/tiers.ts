/**
 * Validation Tiers
 *
 * Pre-configured validation gates for each tier level.
 *
 * @module validation/tiers
 */

import { ValidationTier } from '../types';
import { ValidationGate } from './gate';
import * as validators from './validators';

/**
 * Tier 0: Constitutional Gates (Cannot be bypassed)
 */
export const constitutionalGates: ValidationGate[] = [
  new ValidationGate({
    id: 'political-neutrality',
    tier: ValidationTier.CONSTITUTIONAL,
    name: 'Political Neutrality Check',
    description: 'Ensures AI output maintains absolute political neutrality',
    validators: [validators.biasDetection, validators.sentimentBalance],
    blockOnFailure: true,
  }),
  new ValidationGate({
    id: 'democratic-integrity',
    tier: ValidationTier.CONSTITUTIONAL,
    name: 'Democratic Integrity Check',
    description: 'Prevents manipulation of voting, speech, moderation, or power distribution',
    validators: [validators.votingManipulation, validators.powerDistribution],
    blockOnFailure: true,
  }),
];

/**
 * Tier 1: Mandatory Gates (Block on failure)
 */
export const mandatoryGates: ValidationGate[] = [
  new ValidationGate({
    id: 'security-validation',
    tier: ValidationTier.MANDATORY,
    name: 'Security Validation',
    description: 'OWASP ASVS 5.0.0 Level 2 security checks',
    validators: [
      validators.inputSanitization,
      validators.authenticationCheck,
      validators.authorizationCheck,
    ],
    blockOnFailure: true,
  }),
  new ValidationGate({
    id: 'accessibility-validation',
    tier: ValidationTier.MANDATORY,
    name: 'Accessibility Validation',
    description: 'WCAG 2.2 AA compliance checks',
    validators: [validators.wcagCompliance],
    blockOnFailure: true,
  }),
  new ValidationGate({
    id: 'privacy-validation',
    tier: ValidationTier.MANDATORY,
    name: 'Privacy Validation',
    description: 'GDPR compliance and data protection checks',
    validators: [validators.gdprCompliance, validators.dataMinimization],
    blockOnFailure: true,
  }),
];

/**
 * Tier 2: Best-Practice Gates (Warnings only)
 */
export const bestPracticeGates: ValidationGate[] = [
  new ValidationGate({
    id: 'code-quality',
    tier: ValidationTier.BEST_PRACTICE,
    name: 'Code Quality Check',
    description: 'Code style, complexity, and maintainability checks',
    validators: [validators.codeComplexity, validators.documentationCoverage],
    blockOnFailure: false,
  }),
  new ValidationGate({
    id: 'performance',
    tier: ValidationTier.BEST_PRACTICE,
    name: 'Performance Check',
    description: 'Performance and efficiency checks',
    validators: [validators.responseTime, validators.resourceUsage],
    blockOnFailure: false,
  }),
];

/**
 * Get all gates for a specific tier
 */
export function getGatesByTier(tier: ValidationTier): ValidationGate[] {
  switch (tier) {
    case ValidationTier.CONSTITUTIONAL:
      return constitutionalGates;
    case ValidationTier.MANDATORY:
      return mandatoryGates;
    case ValidationTier.BEST_PRACTICE:
      return bestPracticeGates;
    default:
      return [];
  }
}

/**
 * Get all gates
 */
export function getAllGates(): ValidationGate[] {
  return [...constitutionalGates, ...mandatoryGates, ...bestPracticeGates];
}
