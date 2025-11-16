/**
 * WCAG Validator Tests
 *
 * Tests for WCAG 2.2 AA compliance validation.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { WCAGValidator } from '../../src/accessibility/wcag-validator';

describe('WCAGValidator', () => {
  let validator: WCAGValidator;

  beforeEach(() => {
    validator = new WCAGValidator();
  });

  it('should validate contrast ratio', () => {
    const result = validator.checkContrastRatio('#000000', '#FFFFFF');

    expect(result.ratio).toBeGreaterThan(4.5);
    expect(result.passed).toBe(true);
  });

  it('should detect insufficient contrast', () => {
    const result = validator.checkContrastRatio('#777777', '#888888');

    expect(result.ratio).toBeLessThan(4.5);
    expect(result.passed).toBe(false);
  });

  it('should validate semantic HTML', () => {
    const html = '<button>Click me</button>';
    const result = validator.validateSemanticHTML(html);

    expect(result.passed).toBe(true);
  });

  it('should detect missing alt text', () => {
    const html = '<img src="image.jpg">';
    const result = validator.validateSemanticHTML(html);

    expect(result.violations.some(v => v.includes('alt'))).toBe(true);
  });

  it('should check keyboard accessibility', () => {
    const component = { tabIndex: 0, onKeyDown: () => {} };
    const result = validator.checkKeyboardAccessibility(component);

    expect(result.passed).toBe(true);
  });
});
