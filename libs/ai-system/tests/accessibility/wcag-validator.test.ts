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

  it('should detect keyboard accessibility issues for negative tabIndex', () => {
    const component = { tabIndex: -1 };
    const result = validator.checkKeyboardAccessibility(component);

    expect(result.passed).toBe(false);
    expect(result.message).toContain('keyboard focusable');
  });

  it('should detect keyboard accessibility issues for missing onKeyDown', () => {
    const component = { tabIndex: 0 };
    const result = validator.checkKeyboardAccessibility(component);

    expect(result.passed).toBe(false);
    expect(result.message).toContain('keyboard events');
  });

  it('should validate HTML for WCAG compliance', async () => {
    const html = `
      <html lang="en">
        <head><title>Test</title></head>
        <body>
          <h1>Heading</h1>
          <img src="test.jpg" alt="Test image">
          <form>
            <label for="name">Name:</label>
            <input id="name" type="text">
          </form>
        </body>
      </html>
    `;

    const result = await validator.validate(html);

    expect(result.passed).toBe(true);
    expect(result.violations.length).toBe(0);
    expect(result.passes).toBeGreaterThan(0);
  });

  it('should detect WCAG violations in HTML', async () => {
    const html = `
      <html>
        <body>
          <img src="test.jpg">
          <input type="text">
        </body>
      </html>
    `;

    const result = await validator.validate(html);

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('should validate target size', () => {
    const result = validator.validateTargetSize(50, 50);

    expect(result.passed).toBe(true);
    expect(result.message).toContain('meets minimum');
  });

  it('should detect insufficient target size', () => {
    const result = validator.validateTargetSize(30, 30);

    expect(result.passed).toBe(false);
    expect(result.message).toContain('below minimum');
  });

  it('should detect semantic HTML violations', () => {
    const html = '<div onclick="doSomething()">Click me</div><input type="text">';
    const result = validator.validateSemanticHTML(html);

    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });
});
