// Manual test script for accessibility library
import {
  validateContrast,
  isFocusable,
  validateAriaAttributes,
  validateHeadingHierarchy,
} from '../libs/ui/accessibility/src/index.js';

// Test color contrast
console.log('=== Testing Color Contrast ===');
const result1 = validateContrast('#000000', '#FFFFFF');
console.log('Black on white:', result1);

const result2 = validateContrast('#777777', '#888888');
console.log('Gray on gray:', result2);

const result3 = validateContrast('#000000', '#FFFFFF', true);
console.log('Black on white (large text):', result3);

// Test focusability
console.log('\n=== Testing Focusability ===');
const mockButton = { tagName: 'BUTTON', tabIndex: 0, hasAttribute: () => false };
const mockLink = { tagName: 'A', tabIndex: 0, hasAttribute: () => true };
const mockDiv = { tagName: 'DIV', tabIndex: -1, hasAttribute: () => false };

console.log('Button focusable:', isFocusable(mockButton));
console.log('Link focusable:', isFocusable(mockLink));
console.log('Div focusable:', isFocusable(mockDiv));

// Test ARIA validation
console.log('\n=== Testing ARIA Validation ===');
const imgWithRole = {
  tagName: 'IMG',
  getAttribute: attr => (attr === 'role' ? 'img' : null),
  textContent: null,
};

const ariaResult = validateAriaAttributes(imgWithRole);
console.log('Image with role="img" validation:', ariaResult);

// Test heading hierarchy
console.log('\n=== Testing Heading Hierarchy ===');
const mockDoc = {
  querySelectorAll: () => [{ tagName: 'H1' }, { tagName: 'H2' }, { tagName: 'H3' }],
};

const headingResult = validateHeadingHierarchy(mockDoc);
console.log('Valid heading hierarchy:', headingResult);

const mockDocInvalid = {
  querySelectorAll: () => [
    { tagName: 'H1' },
    { tagName: 'H3' }, // Skips H2
  ],
};

const headingResultInvalid = validateHeadingHierarchy(mockDocInvalid);
console.log('Invalid heading hierarchy:', headingResultInvalid);

console.log('\n=== All manual tests completed ===');
