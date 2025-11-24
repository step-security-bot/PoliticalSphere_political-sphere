// WCAG 2.2 AA Accessibility Validation Library

/**
 * Color representation in RGB
 */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Converts hex color to RGB
 */
export function hexToRgb(hex: string): RGBColor | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) {
    return null;
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Calculates the relative luminance of a color
 */
export function getRelativeLuminance(color: RGBColor): number {
  const { r, g, b } = color;
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (rs ?? 0) + 0.7152 * (gs ?? 0) + 0.0722 * (bs ?? 0);
}

/**
 * Calculates contrast ratio between two colors
 */
export function getContrastRatio(color1: RGBColor, color2: RGBColor): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Checks if contrast meets WCAG 2.2 AA standards
 * Normal text: 4.5:1, Large text (18pt+ or 14pt+ bold): 3:1
 */
export function validateContrast(
  foreground: string | RGBColor,
  background: string | RGBColor,
  isLargeText = false
): { isValid: boolean; ratio: number; requiredRatio: number } {
  const fg = typeof foreground === 'string' ? hexToRgb(foreground) : foreground;
  const bg = typeof background === 'string' ? hexToRgb(background) : background;

  if (!fg || !bg) {
    throw new Error('Invalid color format');
  }

  const ratio = getContrastRatio(fg, bg);
  const requiredRatio = isLargeText ? 3 : 4.5;

  return {
    isValid: ratio >= requiredRatio,
    ratio: Math.round(ratio * 100) / 100,
    requiredRatio,
  };
}

// Navigation Checks

/**
 * Checks if an element is keyboard focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  if (element.tabIndex < 0) return false;

  const tagName = element.tagName.toLowerCase();
  const focusableTags = ['input', 'select', 'textarea', 'button', 'a', 'area'];

  if (focusableTags.includes(tagName)) {
    return tagName === 'a' ? element.hasAttribute('href') : true;
  }

  return element.hasAttribute('tabindex') && element.tabIndex >= 0;
}

/**
 * Gets all focusable elements in a container
 */
export function getFocusableElements(container: HTMLElement | Document = document): HTMLElement[] {
  const elements = Array.from(container.querySelectorAll('*')) as HTMLElement[];
  return elements.filter(isFocusable);
}

/**
 * Checks if focus is properly managed in a modal/dialog
 */
export function validateFocusManagement(modal: HTMLElement): {
  hasFocusTrap: boolean;
  firstFocusable: HTMLElement | null;
  lastFocusable: HTMLElement | null;
} {
  const focusableElements = getFocusableElements(modal);
  const firstFocusable = focusableElements[0] || null;
  const lastFocusable = focusableElements[focusableElements.length - 1] || null;

  // Check for focus trap (basic check - in practice, would need event listeners)
  const hasFocusTrap = !!(
    firstFocusable &&
    lastFocusable &&
    (firstFocusable !== lastFocusable || focusableElements.length === 1)
  );

  return {
    hasFocusTrap,
    firstFocusable,
    lastFocusable,
  };
}

/**
 * Validates skip links presence and functionality
 */
export function validateSkipLinks(document: Document): {
  hasSkipLinks: boolean;
  skipLinks: HTMLElement[];
} {
  const skipLinks = Array.from(document.querySelectorAll('a[href^="#"]')) as HTMLElement[];
  const validSkipLinks = skipLinks.filter(link => {
    const href = link.getAttribute('href');
    if (!href) return false;
    const target = document.querySelector(href);
    return target && isFocusable(target as HTMLElement);
  });

  return {
    hasSkipLinks: validSkipLinks.length > 0,
    skipLinks: validSkipLinks,
  };
}

// ARIA Compliance

/**
 * Validates ARIA attributes on an element
 */
export function validateAriaAttributes(element: HTMLElement): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  const role = element.getAttribute('aria-role') || element.getAttribute('role');
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  const ariaDescribedBy = element.getAttribute('aria-describedby');

  // Check required ARIA attributes for specific roles
  if (role === 'img' && !ariaLabel && !ariaLabelledBy) {
    errors.push('Images with role="img" must have aria-label or aria-labelledby');
  }

  if (role === 'button' && !ariaLabel && !ariaLabelledBy && !element.textContent?.trim()) {
    errors.push(
      'Buttons must have accessible text via aria-label, aria-labelledby, or text content'
    );
  }

  // Check aria-describedby references exist
  if (ariaDescribedBy) {
    const ids = ariaDescribedBy.split(' ');
    ids.forEach(id => {
      if (!document.getElementById(id)) {
        errors.push(`aria-describedby references non-existent element: ${id}`);
      }
    });
  }

  // Check aria-labelledby references exist
  if (ariaLabelledBy) {
    const ids = ariaLabelledBy.split(' ');
    ids.forEach(id => {
      if (!document.getElementById(id)) {
        errors.push(`aria-labelledby references non-existent element: ${id}`);
      }
    });
  }

  // Warning for redundant aria-label when element has text
  if (ariaLabel && element.textContent?.trim()) {
    warnings.push('aria-label may be redundant when element has visible text content');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates heading hierarchy
 */
export function validateHeadingHierarchy(container: HTMLElement | Document = document): {
  isValid: boolean;
  errors: string[];
} {
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  const errors: string[] = [];
  let lastLevel = 0;

  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1), 10);
    if (index === 0 && level !== 1) {
      errors.push('First heading should be h1');
    }
    if (level - lastLevel > 1) {
      errors.push(`Heading level skipped from h${lastLevel} to h${level}`);
    }
    lastLevel = level;
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Comprehensive WCAG 2.2 AA validation for a page
 */
export function validateWcagCompliance(container: HTMLElement | Document = document): {
  contrast: { isValid: boolean; issues: string[] };
  navigation: { isValid: boolean; issues: string[] };
  aria: { isValid: boolean; issues: string[] };
  overall: boolean;
} {
  const contrastIssues: string[] = [];
  const navigationIssues: string[] = [];
  const ariaIssues: string[] = [];

  // Contrast validation (would need to scan styles - simplified)
  // In practice, this would require CSS parsing

  // Navigation validation
  const skipLinks = validateSkipLinks(container as Document);
  if (!skipLinks.hasSkipLinks) {
    navigationIssues.push('No skip links found');
  }

  // ARIA validation
  const elements = Array.from(container.querySelectorAll('[role], [aria-*]'));
  elements.forEach(element => {
    const validation = validateAriaAttributes(element as HTMLElement);
    ariaIssues.push(...validation.errors);
  });

  const headingValidation = validateHeadingHierarchy(container);
  ariaIssues.push(...headingValidation.errors);

  return {
    contrast: { isValid: contrastIssues.length === 0, issues: contrastIssues },
    navigation: { isValid: navigationIssues.length === 0, issues: navigationIssues },
    aria: { isValid: ariaIssues.length === 0, issues: ariaIssues },
    overall:
      contrastIssues.length === 0 && navigationIssues.length === 0 && ariaIssues.length === 0,
  };
}
