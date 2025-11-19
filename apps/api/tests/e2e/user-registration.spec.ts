// E2E tests for user registration flow using Playwright
// Tests the complete user journey from registration to login

import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test('should complete full user registration and login flow', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Click on register button
    await page.click('text=Register');

    // Fill out registration form
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="email-input"]', 'testuser@example.com');
    await page.fill('[data-testid="password-input"]', 'securepassword123');
    await page.fill('[data-testid="confirm-password-input"]', 'securepassword123');

    // Submit registration
    await page.click('[data-testid="register-button"]');

    // Verify successful registration
    await expect(page.locator('text=Registration successful')).toBeVisible();

    // Navigate to login
    await page.click('text=Login');

    // Fill out login form
    await page.fill('[data-testid="login-username"]', 'testuser');
    await page.fill('[data-testid="login-password"]', 'securepassword123');

    // Submit login
    await page.click('[data-testid="login-button"]');

    // Verify successful login and dashboard access
    await expect(page.locator('text=Welcome, testuser')).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show validation errors for invalid registration data', async ({ page }) => {
    await page.goto('/register');

    // Try to submit empty form
    await page.click('[data-testid="register-button"]');

    // Verify validation errors
    await expect(page.locator('text=Username is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();

    // Try invalid email
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="email-input"]', 'invalid-email');
    await page.fill('[data-testid="password-input"]', 'password123');

    await page.click('[data-testid="register-button"]');

    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
  });

  test('should prevent duplicate username registration', async ({ page }) => {
    // First registration
    await page.goto('/register');
    await page.fill('[data-testid="username-input"]', 'duplicateuser');
    await page.fill('[data-testid="email-input"]', 'user1@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="confirm-password-input"]', 'password123');
    await page.click('[data-testid="register-button"]');

    await expect(page.locator('text=Registration successful')).toBeVisible();

    // Second registration with same username
    await page.goto('/register');
    await page.fill('[data-testid="username-input"]', 'duplicateuser');
    await page.fill('[data-testid="email-input"]', 'user2@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="confirm-password-input"]', 'password123');
    await page.click('[data-testid="register-button"]');

    await expect(page.locator('text=Username already exists')).toBeVisible();
  });
});
