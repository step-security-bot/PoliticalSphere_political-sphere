import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Accessibility test suite for web application
 *
 * Validates WCAG 2.2 AA compliance using axe-core.
 *
 * @see https://www.deque.com/axe/core-documentation/api-documentation/
 * @see https://www.w3.org/WAI/WCAG22/quickref/?versions=2.2&levels=aa
 */

test.describe('Web App Accessibility', () => {
  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('login page should not have accessibility violations', async ({ page }) => {
    await page.goto('/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('dashboard should not have accessibility violations', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'testuser');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/dashboard');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('keyboard navigation should work', async ({ page }) => {
    await page.goto('/');

    // Press Tab to focus first interactive element
    await page.keyboard.press('Tab');

    // Verify focus is visible
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Verify focus outline exists
    const outlineWidth = await focusedElement.evaluate(
      el => window.getComputedStyle(el).outlineWidth
    );
    expect(outlineWidth).not.toBe('0px');
  });

  test('should support screen reader landmarks', async ({ page }) => {
    await page.goto('/');

    // Verify essential landmarks exist
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();

    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible();

    // Verify skip link exists
    const skipLink = page.locator('a[href="#main-content"], a:has-text("Skip to content")');
    const skipLinkExists = await skipLink.count();
    if (skipLinkExists === 0) {
      console.warn('Skip link not found - recommended for accessibility');
    }
  });

  test('color contrast should meet WCAG AA standards', async ({ page }) => {
    await page.goto('/');

    const _accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .disableRules(['color-contrast']) // We'll check this manually for better reporting
      .analyze();

    // Manually check critical text elements
    const bodyText = page.locator('body');
    const color = await bodyText.evaluate(el => window.getComputedStyle(el).color);
    const backgroundColor = await bodyText.evaluate(
      el => window.getComputedStyle(el).backgroundColor
    );

    // Log for manual verification if needed
    console.log('Body text color:', color);
    console.log('Body background:', backgroundColor);

    // Run full color contrast check
    const contrastResults = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();

    expect(contrastResults.violations).toEqual([]);
  });

  test('form labels should be associated', async ({ page }) => {
    await page.goto('/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['label', 'label-content-name-mismatch'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('images should have alt text', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['image-alt'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support text resizing to 200%', async ({ page }) => {
    await page.goto('/');

    // Get initial viewport
    const _initialViewport = page.viewportSize();

    // Zoom to 200%
    await page.evaluate(() => {
      document.body.style.zoom = '2.0';
    });

    // Verify content is still accessible (not cut off or overlapping)
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    // Should have no new violations at 200% zoom
    expect(accessibilityScanResults.violations).toEqual([]);

    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1.0';
    });
  });

  test('should respect prefers-reduced-motion', async ({ page }) => {
    // Enable reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });

    await page.goto('/');

    // Check that animations are disabled or reduced
    const animatedElements = page.locator('[style*="animation"], [class*="animate"]');
    const count = await animatedElements.count();

    if (count > 0) {
      // Verify animations respect prefers-reduced-motion
      for (let i = 0; i < count; i++) {
        const element = animatedElements.nth(i);
        const animationDuration = await element.evaluate(
          el => window.getComputedStyle(el).animationDuration
        );

        // Animation should be instant or very short when reduced motion is preferred
        expect(['0s', '0.01s', '0.1s']).toContain(animationDuration);
      }
    }
  });
});
