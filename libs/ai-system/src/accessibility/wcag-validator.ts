/**
 * WCAG 2.2 AA Validator
 *
 * Validates UI components against WCAG 2.2 Level AA criteria.
 *
 * @module accessibility/wcag-validator
 */

import type { AccessibilityResult, AccessibilityViolation } from '../types';

/**
 * WCAG 2.2 Success Criteria
 */
export const WCAG_CRITERIA = {
  // Perceivable
  '1.1.1': 'Non-text Content',
  '1.2.1': 'Audio-only and Video-only (Prerecorded)',
  '1.2.2': 'Captions (Prerecorded)',
  '1.2.3': 'Audio Description or Media Alternative (Prerecorded)',
  '1.3.1': 'Info and Relationships',
  '1.3.2': 'Meaningful Sequence',
  '1.3.3': 'Sensory Characteristics',
  '1.4.1': 'Use of Color',
  '1.4.2': 'Audio Control',
  '1.4.3': 'Contrast (Minimum)',
  '1.4.4': 'Resize Text',
  '1.4.5': 'Images of Text',
  '1.4.10': 'Reflow',
  '1.4.11': 'Non-text Contrast',
  '1.4.12': 'Text Spacing',
  '1.4.13': 'Content on Hover or Focus',

  // Operable
  '2.1.1': 'Keyboard',
  '2.1.2': 'No Keyboard Trap',
  '2.1.4': 'Character Key Shortcuts',
  '2.2.1': 'Timing Adjustable',
  '2.2.2': 'Pause, Stop, Hide',
  '2.3.1': 'Three Flashes or Below Threshold',
  '2.4.1': 'Bypass Blocks',
  '2.4.2': 'Page Titled',
  '2.4.3': 'Focus Order',
  '2.4.4': 'Link Purpose (In Context)',
  '2.4.5': 'Multiple Ways',
  '2.4.6': 'Headings and Labels',
  '2.4.7': 'Focus Visible',
  '2.4.11': 'Focus Not Obscured (Minimum)', // WCAG 2.2
  '2.5.1': 'Pointer Gestures',
  '2.5.2': 'Pointer Cancellation',
  '2.5.3': 'Label in Name',
  '2.5.4': 'Motion Actuation',
  '2.5.7': 'Dragging Movements', // WCAG 2.2
  '2.5.8': 'Target Size (Minimum)', // WCAG 2.2

  // Understandable
  '3.1.1': 'Language of Page',
  '3.1.2': 'Language of Parts',
  '3.2.1': 'On Focus',
  '3.2.2': 'On Input',
  '3.2.3': 'Consistent Navigation',
  '3.2.4': 'Consistent Identification',
  '3.2.6': 'Consistent Help', // WCAG 2.2
  '3.3.1': 'Error Identification',
  '3.3.2': 'Labels or Instructions',
  '3.3.3': 'Error Suggestion',
  '3.3.4': 'Error Prevention (Legal, Financial, Data)',
  '3.3.7': 'Redundant Entry', // WCAG 2.2
  '3.3.8': 'Accessible Authentication (Minimum)', // WCAG 2.2

  // Robust
  '4.1.1': 'Parsing',
  '4.1.2': 'Name, Role, Value',
  '4.1.3': 'Status Messages',
};

/**
 * WCAG Validator
 *
 * Validates accessibility compliance.
 */
export class WCAGValidator {
  /**
   * Validate HTML for WCAG compliance
   *
   * Note: This is a simplified validator. In production, use axe-core.
   */
  async validate(html: string): Promise<AccessibilityResult> {
    const violations: AccessibilityViolation[] = [];
    let passes = 0;
    let incomplete = 0;

    // Check for alt text on images
    const imgWithoutAlt = /<img(?![^>]*alt=)[^>]*>/gi;
    const matches = html.match(imgWithoutAlt);
    if (matches && matches.length > 0) {
      violations.push({
        id: 'image-alt',
        criterion: '1.1.1',
        impact: 'critical',
        description: 'Images must have alt text',
        help: 'Add alt attribute to all images',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
        nodes: matches.map(html => ({
          html,
          target: ['img'],
        })),
      });
    } else {
      passes++;
    }

    // Check for form labels
    const inputWithoutLabel = /<input(?![^>]*aria-label)(?![^>]*id="[^"]*")([^>]*)>/gi;
    const inputMatches = html.match(inputWithoutLabel);
    if (inputMatches && inputMatches.length > 0) {
      violations.push({
        id: 'form-label',
        criterion: '1.3.1',
        impact: 'serious',
        description: 'Form inputs must have labels',
        help: 'Associate labels with form controls',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
        nodes: inputMatches.map(html => ({
          html,
          target: ['input'],
        })),
      });
    } else {
      passes++;
    }

    // Check for heading structure
    if (!/<h1[^>]*>/i.test(html)) {
      violations.push({
        id: 'heading-order',
        criterion: '1.3.1',
        impact: 'moderate',
        description: 'Page should have h1 heading',
        help: 'Use proper heading hierarchy',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
        nodes: [],
      });
    } else {
      passes++;
    }

    // Check for lang attribute
    if (!/<html[^>]*lang=/i.test(html)) {
      violations.push({
        id: 'html-lang',
        criterion: '3.1.1',
        impact: 'serious',
        description: 'HTML must have lang attribute',
        help: 'Add lang attribute to html element',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html',
        nodes: [],
      });
    } else {
      passes++;
    }

    // Manual checks required (incomplete)
    incomplete = 5; // Placeholder: contrast, keyboard nav, etc.

    const passed = violations.length === 0;

    return {
      timestamp: new Date(),
      violations,
      passes,
      incomplete,
      passed,
    };
  }

  /**
   * Check contrast ratio
   *
   * WCAG 2.2 AA requires 4.5:1 for normal text, 3:1 for large text.
   */
  checkContrastRatio(
    foreground: string,
    background: string,
    isLargeText: boolean = false
  ): {
    ratio: number;
    passed: boolean;
    required: number;
  } {
    // Simplified contrast calculation
    const required = isLargeText ? 3.0 : 4.5;

    // Calculate relative luminance (simplified)
    const getLuminance = (hex: string): number => {
      const rgb = parseInt(hex.replace('#', ''), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = rgb & 0xff;
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return {
      ratio,
      passed: ratio >= required,
      required,
    };
  }

  /**
   * Validate target size (WCAG 2.2 2.5.8)
   *
   * Minimum 44x44 CSS pixels for touch targets.
   */
  validateTargetSize(
    width: number,
    height: number
  ): {
    passed: boolean;
    message: string;
  } {
    const minSize = 44;
    const passed = width >= minSize && height >= minSize;

    return {
      passed,
      message: passed
        ? 'Target size meets minimum requirements'
        : `Target size ${width}x${height}px is below minimum 44x44px`,
    };
  }

  /**
   * Validate semantic HTML
   *
   * Checks for proper use of semantic HTML elements.
   */
  validateSemanticHTML(html: string): {
    passed: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Check for missing alt text on images
    if (/<img(?![^>]*alt=)[^>]*>/i.test(html)) {
      violations.push('Images must have alt attributes');
    }

    // Check for non-semantic buttons (div/span with onclick)
    if (/<(div|span)[^>]*onclick/i.test(html)) {
      violations.push('Use <button> instead of div/span for clickable elements');
    }

    // Check for form inputs without labels
    if (/<input(?![^>]*aria-label)(?![^>]*id)/i.test(html)) {
      violations.push('Form inputs should have associated labels');
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  /**
   * Check keyboard accessibility
   *
   * Validates that interactive elements are keyboard accessible.
   */
  checkKeyboardAccessibility(component: { tabIndex?: number; onKeyDown?: () => void }): {
    passed: boolean;
    message?: string;
  } {
    // Check if element is keyboard focusable
    if (component.tabIndex === undefined || component.tabIndex < 0) {
      return {
        passed: false,
        message: 'Interactive element must be keyboard focusable (tabIndex >= 0)',
      };
    }

    // Check if keyboard event handler is present
    if (!component.onKeyDown) {
      return {
        passed: false,
        message: 'Interactive element must handle keyboard events',
      };
    }

    return { passed: true };
  }
}
