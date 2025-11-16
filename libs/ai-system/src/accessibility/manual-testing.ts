/**
 * Manual Accessibility Testing Checklist
 *
 * Covers the 43% of WCAG criteria that cannot be automated.
 *
 * @module accessibility/manual-testing
 */

/**
 * Manual test checklist item
 */
export interface ManualTestItem {
  /** WCAG criterion */
  criterion: string;
  /** Test name */
  name: string;
  /** Test instructions */
  instructions: string;
  /** Expected result */
  expected: string;
  /** Test category */
  category: 'keyboard' | 'screen-reader' | 'visual' | 'timing' | 'content';
}

/**
 * Manual test result
 */
export interface ManualTestResult {
  item: ManualTestItem;
  passed: boolean;
  notes?: string;
  tester: string;
  timestamp: Date;
}

/**
 * Manual Testing Checklist
 *
 * Tests that require human verification.
 */
export const MANUAL_TEST_CHECKLIST: ManualTestItem[] = [
  // Keyboard Navigation
  {
    criterion: '2.1.1',
    name: 'Keyboard Navigation',
    instructions: 'Navigate entire page using only Tab, Shift+Tab, Enter, Space, and Arrow keys',
    expected: 'All interactive elements accessible and operable',
    category: 'keyboard',
  },
  {
    criterion: '2.1.2',
    name: 'No Keyboard Trap',
    instructions: 'Ensure focus can always move away from any component',
    expected: 'No element traps keyboard focus',
    category: 'keyboard',
  },
  {
    criterion: '2.4.7',
    name: 'Visible Focus Indicator',
    instructions: 'Tab through page and verify focus is always visible',
    expected: 'Clear focus indicator on all focusable elements',
    category: 'keyboard',
  },

  // Screen Reader
  {
    criterion: '1.1.1',
    name: 'Alternative Text Quality',
    instructions: 'Use screen reader (NVDA/VoiceOver) to verify image descriptions are meaningful',
    expected: 'Alt text conveys purpose/content of image',
    category: 'screen-reader',
  },
  {
    criterion: '1.3.1',
    name: 'Semantic Structure',
    instructions: 'Navigate by headings/landmarks with screen reader',
    expected: 'Logical heading hierarchy and landmark regions',
    category: 'screen-reader',
  },
  {
    criterion: '4.1.2',
    name: 'Name, Role, Value',
    instructions: 'Verify screen reader announces correct name, role, and state for controls',
    expected: 'All controls have accessible names and correct roles',
    category: 'screen-reader',
  },

  // Visual
  {
    criterion: '1.4.3',
    name: 'Contrast Ratio',
    instructions: 'Use contrast checker tool to verify text meets 4.5:1 (normal) or 3:1 (large)',
    expected: 'All text meets minimum contrast requirements',
    category: 'visual',
  },
  {
    criterion: '1.4.4',
    name: 'Text Resize',
    instructions: 'Increase text size to 200% and verify content is still readable',
    expected: 'Content reflows without horizontal scrolling or loss of information',
    category: 'visual',
  },
  {
    criterion: '1.4.13',
    name: 'Content on Hover/Focus',
    instructions: 'Hover over tooltips/popovers and verify they are dismissable and hoverable',
    expected: 'Hover content can be dismissed without moving pointer',
    category: 'visual',
  },

  // Timing
  {
    criterion: '2.2.1',
    name: 'Timing Adjustable',
    instructions: 'Verify users can extend time limits or disable timing',
    expected: 'Time limits can be extended, adjusted, or turned off',
    category: 'timing',
  },
  {
    criterion: '2.2.2',
    name: 'Pause, Stop, Hide',
    instructions: 'Check auto-updating content can be paused, stopped, or hidden',
    expected: 'Users can control moving/blinking content',
    category: 'timing',
  },

  // Content
  {
    criterion: '2.4.2',
    name: 'Page Title',
    instructions: 'Verify page has descriptive and unique title',
    expected: 'Page title accurately describes page content',
    category: 'content',
  },
  {
    criterion: '2.4.6',
    name: 'Headings and Labels',
    instructions: 'Verify headings and labels are descriptive',
    expected: 'All headings/labels clearly describe content/purpose',
    category: 'content',
  },
  {
    criterion: '3.3.2',
    name: 'Labels or Instructions',
    instructions: 'Verify all form fields have clear labels or instructions',
    expected: 'Users understand what input is required',
    category: 'content',
  },

  // WCAG 2.2 Specific
  {
    criterion: '2.4.11',
    name: 'Focus Not Obscured (Minimum)',
    instructions: 'Tab through page and verify focused element is not completely hidden',
    expected: 'At least part of focused element is visible',
    category: 'keyboard',
  },
  {
    criterion: '2.5.8',
    name: 'Target Size (Minimum)',
    instructions: 'Verify interactive elements are at least 44x44 CSS pixels (use dev tools)',
    expected: 'All touch targets meet minimum size',
    category: 'visual',
  },
  {
    criterion: '3.3.7',
    name: 'Redundant Entry',
    instructions: "Verify users don't have to re-enter previously entered information",
    expected: 'Form remembers or offers auto-fill for repeated information',
    category: 'content',
  },
  {
    criterion: '3.3.8',
    name: 'Accessible Authentication (Minimum)',
    instructions: "Verify authentication doesn't require solving cognitive tests (e.g., CAPTCHAs)",
    expected: 'Alternative authentication method available',
    category: 'content',
  },
];

/**
 * Manual Testing Tracker
 */
export class ManualTestingTracker {
  private results: ManualTestResult[] = [];

  /**
   * Record manual test result
   */
  recordResult(result: ManualTestResult): void {
    this.results.push(result);
  }

  /**
   * Get completion status
   */
  getStatus(): {
    total: number;
    completed: number;
    passed: number;
    failed: number;
    percentComplete: number;
  } {
    const total = MANUAL_TEST_CHECKLIST.length;
    const completed = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const percentComplete = (completed / total) * 100;

    return {
      total,
      completed,
      passed,
      failed,
      percentComplete,
    };
  }

  /**
   * Get results by category
   */
  getResultsByCategory(category: ManualTestItem['category']): ManualTestResult[] {
    return this.results.filter(r => r.item.category === category);
  }

  /**
   * Generate testing report
   */
  generateReport(): string {
    const status = this.getStatus();

    const report = `
# Manual Accessibility Testing Report

**Date**: ${new Date().toISOString().split('T')[0]}

## Summary
- **Total Tests**: ${status.total}
- **Completed**: ${status.completed} (${status.percentComplete.toFixed(1)}%)
- **Passed**: ${status.passed}
- **Failed**: ${status.failed}

## Results by Category

${['keyboard', 'screen-reader', 'visual', 'timing', 'content']
  .map(cat => {
    const categoryResults = this.getResultsByCategory(cat as ManualTestItem['category']);
    const passed = categoryResults.filter(r => r.passed).length;

    return `### ${cat.charAt(0).toUpperCase() + cat.slice(1)}
- Tests: ${categoryResults.length}
- Passed: ${passed}
- Failed: ${categoryResults.length - passed}
`;
  })
  .join('\n')}

## Failed Tests

${this.results
  .filter(r => !r.passed)
  .map(
    r => `
### ${r.item.name} (${r.item.criterion})
- **Tester**: ${r.tester}
- **Date**: ${r.timestamp.toISOString().split('T')[0]}
- **Notes**: ${r.notes || 'No notes provided'}
`
  )
  .join('\n')}
`;

    return report.trim();
  }
}
