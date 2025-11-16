import { expect, test } from '@playwright/test';

/**
 * Visual regression tests for web application components
 *
 * Captures screenshots and compares against baseline images.
 * Update baselines when intentional UI changes are made:
 *   npx playwright test --config=playwright-visual.config.ts --update-snapshots
 *
 * @see https://playwright.dev/docs/test-snapshots
 */

test.describe('Homepage Visual Regression', () => {
  test('homepage should match screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for any animations to complete
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
    });
  });

  test('homepage header should match screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header, [role="banner"]');
    await expect(header).toHaveScreenshot('header.png');
  });

  test('homepage navigation should match screenshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toHaveScreenshot('navigation.png');
  });
});

test.describe('Login Page Visual Regression', () => {
  test('login page should match screenshot', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('login-page.png');
  });

  test('login form should match screenshot', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const form = page.locator('form');
    await expect(form).toHaveScreenshot('login-form.png');
  });
});

test.describe('Button Component Visual Regression', () => {
  test('primary button should match screenshot', async ({ page }) => {
    await page.goto('/');

    const button = page.locator('button[class*="primary"]').first();
    if ((await button.count()) > 0) {
      await expect(button).toHaveScreenshot('button-primary.png');
    }
  });

  test('secondary button should match screenshot', async ({ page }) => {
    await page.goto('/');

    const button = page.locator('button[class*="secondary"]').first();
    if ((await button.count()) > 0) {
      await expect(button).toHaveScreenshot('button-secondary.png');
    }
  });
});

test.describe('Responsive Visual Regression', () => {
  test('mobile viewport should match screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
    });
  });

  test('tablet viewport should match screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
    });
  });
});

test.describe('Dark Mode Visual Regression', () => {
  test('dark mode should match screenshot', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true,
    });
  });
});
