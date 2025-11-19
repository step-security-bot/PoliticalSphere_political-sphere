# Accessibility Library

WCAG 2.2 AA validation functions for web accessibility compliance.

## Functions

### Color and Contrast

- `hexToRgb(hex: string): RGBColor | null` - Converts hex color to RGB
- `getRelativeLuminance(color: RGBColor): number` - Calculates relative luminance
- `getContrastRatio(color1: RGBColor, color2: RGBColor): number` - Calculates contrast ratio
- `validateContrast(foreground, background, isLargeText?): ValidationResult` - Validates WCAG 2.2 AA contrast requirements

### Navigation and Focus

- `isFocusable(element: HTMLElement): boolean` - Checks if element is keyboard focusable
- `getFocusableElements(container?): HTMLElement[]` - Gets all focusable elements
- `validateFocusManagement(modal: HTMLElement): FocusValidation` - Validates focus trap in modals
- `validateSkipLinks(document: Document): SkipLinkValidation` - Validates skip link presence

### ARIA Compliance

- `validateAriaAttributes(element: HTMLElement): AriaValidation` - Validates ARIA attributes
- `validateHeadingHierarchy(container?): HeadingValidation` - Validates heading hierarchy
- `validateWcagCompliance(container?): WcagValidation` - Comprehensive WCAG validation

## Usage

```typescript
import { validateContrast, validateAriaAttributes } from '@political-sphere/ui/accessibility';

// Check contrast
const result = validateContrast('#000000', '#FFFFFF');
console.log(result.isValid); // true

// Validate ARIA
const ariaResult = validateAriaAttributes(element);
if (!ariaResult.isValid) {
  console.log('Errors:', ariaResult.errors);
}
```

## WCAG 2.2 AA Compliance

This library validates against WCAG 2.2 AA standards including:
- Color contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Keyboard navigation and focus management
- ARIA attributes and roles
- Heading hierarchy
- Skip links and navigation aids
