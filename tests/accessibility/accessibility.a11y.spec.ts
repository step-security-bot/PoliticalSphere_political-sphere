import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Library Integration Tests', () => {
  test('should validate WCAG 2.2 AA compliance on a sample page', async ({ page }) => {
    // Create a simple HTML page for testing
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Accessibility Test</title>
        <style>
          .high-contrast { color: #000000; background-color: #FFFFFF; }
          .low-contrast { color: #777777; background-color: #888888; }
          button { padding: 10px; margin: 5px; }
          input { padding: 8px; margin: 5px; }
        </style>
      </head>
      <body>
        <h1>Main Heading</h1>
        <p class="high-contrast">This text has good contrast.</p>
        <p class="low-contrast">This text has poor contrast.</p>

        <button>Focusable Button</button>
        <input type="text" placeholder="Focusable input">

        <a href="#main">Skip to main content</a>
        <main id="main">
          <h2>Subheading</h2>
          <p>Content here.</p>
        </main>

        <img src="test.jpg" alt="Test image" role="img">
        <button aria-label="Close">×</button>
      </body>
      </html>
    `);

    // Run axe-core accessibility scan
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'])
      .analyze();

    // Check for violations
    const violations = accessibilityScanResults.violations;

    // Log violations for debugging
    if (violations.length > 0) {
      console.log('Accessibility violations found:');
      violations.forEach(violation => {
        console.log(`- ${violation.id}: ${violation.description}`);
        console.log(`  Impact: ${violation.impact}`);
        console.log(`  Elements: ${violation.nodes.length}`);
      });
    }

    // For WCAG 2.2 AA, we expect some violations due to the low contrast text
    // But the page should be mostly compliant
    expect(violations.length).toBeGreaterThan(0); // Should find contrast issues

    // Check that critical violations are minimal
    const criticalViolations = violations.filter(v => v.impact === 'critical');
    expect(criticalViolations.length).toBe(0); // No critical violations expected
  });

  test('should validate focus management', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Focus Test</title>
      </head>
      <body>
        <button id="first">First Button</button>
        <button id="second" tabindex="0">Second Button</button>
        <button id="third" tabindex="-1">Third Button (not focusable)</button>
        <input type="text" id="input">
      </body>
      </html>
    `);

    // Test tab order
    await page.keyboard.press('Tab');
    let focused = await page.evaluate(() => document.activeElement?.id);
    expect(focused).toBe('first');

    await page.keyboard.press('Tab');
    focused = await page.evaluate(() => document.activeElement?.id);
    expect(focused).toBe('second');

    await page.keyboard.press('Tab');
    focused = await page.evaluate(() => document.activeElement?.id);
    expect(focused).toBe('input');

    // Third button should be skipped due to tabindex="-1"
    await page.keyboard.press('Tab');
    focused = await page.evaluate(() => document.activeElement?.id);
    expect(focused).not.toBe('third');
  });

  test('should validate ARIA attributes', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>ARIA Test</title>
      </head>
      <body>
        <button aria-label="Close dialog">×</button>
        <div role="button" aria-label="Custom button">Click me</div>
        <img src="test.jpg" role="img" aria-label="Decorative image">
      </body>
      </html>
    `);

    // Run axe-core scan
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    // Should pass ARIA-related checks
    const ariaViolations = results.violations.filter(
      v => v.id.includes('aria') || v.id.includes('role')
    );

    expect(ariaViolations.length).toBe(0);
  });
});
