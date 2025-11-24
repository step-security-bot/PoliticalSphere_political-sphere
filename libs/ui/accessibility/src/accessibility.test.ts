import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  getRelativeLuminance,
  getContrastRatio,
  validateContrast,
  isFocusable,
  validateSkipLinks,
  validateAriaAttributes,
  validateHeadingHierarchy,
  validateWcagCompliance,
} from './index';

describe('Accessibility Library - WCAG 2.2 AA Validation', () => {
  describe('Color and Contrast', () => {
    it('should convert hex to RGB correctly', () => {
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('invalid')).toBeNull();
    });

    it('should calculate relative luminance', () => {
      expect(getRelativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 3);
      expect(getRelativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 3);
    });

    it('should calculate contrast ratio', () => {
      const black = { r: 0, g: 0, b: 0 };
      const white = { r: 255, g: 255, b: 255 };
      expect(getContrastRatio(black, white)).toBeCloseTo(21, 1);
      expect(getContrastRatio(white, black)).toBeCloseTo(21, 1);
    });

    it('should validate contrast for WCAG 2.2 AA', () => {
      const black = '#000000';
      const white = '#FFFFFF';
      const result = validateContrast(black, white);
      expect(result.isValid).toBe(true);
      expect(result.ratio).toBeCloseTo(21, 1);
      expect(result.requiredRatio).toBe(4.5);
    });

    it('should validate contrast for large text', () => {
      const darkGray = '#666666';
      const lightGray = '#AAAAAA';
      const result = validateContrast(darkGray, lightGray, true);
      expect(result.isValid).toBe(true);
      expect(result.requiredRatio).toBe(3);
    });
  });

  describe('Navigation and Focus', () => {
    it('should identify focusable elements', () => {
      // Create mock elements
      const button = { tagName: 'BUTTON', tabIndex: 0, hasAttribute: () => false } as any;
      const link = { tagName: 'A', tabIndex: 0, hasAttribute: () => true } as any;
      const div = { tagName: 'DIV', tabIndex: -1, hasAttribute: () => false } as any;

      expect(isFocusable(button)).toBe(true);
      expect(isFocusable(link)).toBe(true);
      expect(isFocusable(div)).toBe(false);
    });

    it('should validate skip links', () => {
      // Mock document with skip links
      const mockDoc = {
        querySelectorAll: () => [
          { getAttribute: () => '#main', textContent: 'Skip to main content' },
        ],
        querySelector: () => ({}), // mock target exists
      } as any;

      const result = validateSkipLinks(mockDoc);
      expect(result.hasSkipLinks).toBe(true);
    });
  });

  describe('ARIA Compliance', () => {
    it('should validate ARIA attributes on images', () => {
      const img = {
        tagName: 'IMG',
        getAttribute: (attr: string) => (attr === 'role' ? 'img' : null),
        textContent: null,
      } as any;

      const result = validateAriaAttributes(img);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Images with role="img" must have aria-label or aria-labelledby'
      );
    });

    it('should validate heading hierarchy', () => {
      const mockContainer = {
        querySelectorAll: () => [{ tagName: 'H1' }, { tagName: 'H2' }, { tagName: 'H3' }],
      } as any;

      const result = validateHeadingHierarchy(mockContainer);
      expect(result.isValid).toBe(true);
    });

    it('should detect heading hierarchy violations', () => {
      const mockContainer = {
        querySelectorAll: () => [
          { tagName: 'H1' },
          { tagName: 'H3' }, // Skips H2
        ],
      } as any;

      const result = validateHeadingHierarchy(mockContainer);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Heading level skipped from h1 to h3');
    });
  });

  describe('Comprehensive WCAG Validation', () => {
    it('should perform comprehensive validation', () => {
      const mockDoc = {
        querySelectorAll: () => [],
        querySelector: () => null,
      } as any;

      const result = validateWcagCompliance(mockDoc);
      expect(result).toHaveProperty('contrast');
      expect(result).toHaveProperty('navigation');
      expect(result).toHaveProperty('aria');
      expect(result).toHaveProperty('overall');
    });
  });
});
