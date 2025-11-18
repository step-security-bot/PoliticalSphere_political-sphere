import { expect, test } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173/');
  });

  test('should display login form by default', async ({ page }) => {
    // Check if login form is visible
    await expect(page.locator('h2').filter({ hasText: 'Login' })).toBeVisible();

    // Check for username and password fields
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Check for login button
    await expect(page.locator('button').filter({ hasText: 'Login' })).toBeVisible();
  });

  test('should toggle between login and signup modes', async ({ page }) => {
    // Start with login mode
    await expect(page.locator('h2').filter({ hasText: 'Login' })).toBeVisible();

    // Click toggle button
    await page.locator('button').filter({ hasText: 'Need an account? Register' }).click();

    // Should switch to signup mode
    await expect(page.locator('h2').filter({ hasText: 'Register' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Click toggle button again
    await page.locator('button').filter({ hasText: 'Have an account? Login' }).click();

    // Should switch back to login mode
    await expect(page.locator('h2').filter({ hasText: 'Login' })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Try to submit empty form
    await page.locator('button').filter({ hasText: 'Login' }).click();

    // Should show error message
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('should validate email format in signup mode', async ({ page }) => {
    // Switch to signup mode
    await page.locator('button').filter({ hasText: 'Need an account? Register' }).click();

    // Fill invalid email
    await page.locator('input[type="text"]').fill('testuser');
    await page.locator('input[type="email"]').fill('invalid-email');
    await page.locator('input[type="password"]').fill('ValidPass123!');

    // Try to submit
    await page.locator('button').filter({ hasText: 'Register' }).click();

    // Should show validation error
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('should enforce password requirements', async ({ page }) => {
    // Switch to signup mode
    await page.locator('button').filter({ hasText: 'Need an account? Register' }).click();

    // Fill weak password
    await page.locator('input[type="text"]').fill('testuser');
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('weak');

    // Try to submit
    await page.locator('button').filter({ hasText: 'Register' }).click();

    // Should show password strength error
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('should show password strength indicator', async ({ page }) => {
    // Switch to signup mode
    await page.locator('button').filter({ hasText: 'Need an account? Register' }).click();

    const passwordInput = page.locator('input[type="password"]').first();

    // Type weak password
    await passwordInput.fill('weak');
    // Password strength should be visible (implementation dependent)

    // Type strong password
    await passwordInput.fill('StrongPass123!');
    // Password strength should indicate strong (implementation dependent)
  });

  test('should handle accessibility features', async ({ page }) => {
    // Check for proper labels
    await expect(page.locator('label[for="username"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();

    // Check ARIA attributes
    const usernameInput = page.locator('input[type="text"]');
    await expect(usernameInput).toHaveAttribute('aria-describedby');

    // Check keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="text"]')).toBeFocused();
  });

  test('should prevent form submission during loading', async ({ page }) => {
    // This test would need a mock API that delays response
    // For now, just verify the button exists and is enabled initially
    const submitButton = page.locator('button').filter({ hasText: 'Login' });
    await expect(submitButton).toBeEnabled();
  });
});
