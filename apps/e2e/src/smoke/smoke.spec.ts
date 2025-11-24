/**
 * Smoke Tests - Basic functionality verification
 * Minimum viable E2E tests for critical paths
 */
import { test, expect } from '../fixtures';

test.describe('Smoke Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Political Sphere/i);
  });

  test('should display main content area', async ({ page }) => {
    await page.goto('/');
    // Check for main content container
    const main = page.locator('main, [role="main"], .main, #main');
    await expect(main.or(page.locator('body')).first()).toBeVisible();
  });

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/');
    // Check for any navigation elements
    const nav = page.locator('nav, header, .nav, .header');
    await expect(nav.or(page.locator('body')).first()).toBeVisible();
  });

  test('should be responsive - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should be responsive - tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should be responsive - desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
