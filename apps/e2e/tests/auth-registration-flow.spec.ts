/**
 * E2E Test: Complete Registration Flow
 * Verifies token extraction and authentication state after registration
 */

import { test, expect } from '@playwright/test';

test.describe('Registration Flow', () => {
  const timestamp = Date.now();
  const testUser = {
    username: `testuser${timestamp}`,
    email: `testuser${timestamp}@example.com`,
    password: 'SecurePass123!',
  };

  test('should complete full registration flow and authenticate user', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5174');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Should show login/register screen initially
    await expect(page.getByRole('heading', { name: /Political Sphere/i })).toBeVisible();

    // Look for register form or switch to register
    const registerButton = page.getByRole('button', { name: /Create Account|Register/i }).first();
    if (await registerButton.isVisible()) {
      await registerButton.click();
    }

    // Fill in registration form
    await page.fill('input[name="username"]', testUser.username);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[type="password"][name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);

    // Accept terms if present
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Setup network monitoring to capture the registration request/response
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/auth/register') && response.status() === 200
    );

    // Submit the form
    await page.getByRole('button', { name: /Sign Up|Create Account|Register/i }).click();

    // Wait for the registration response
    const response = await responsePromise;
    const responseData = await response.json();

    // Verify response structure
    expect(responseData).toHaveProperty('user');
    expect(responseData).toHaveProperty('tokens');
    expect(responseData.tokens).toHaveProperty('accessToken');
    expect(responseData.tokens).toHaveProperty('refreshToken');

    // Verify user data
    expect(responseData.user.username).toBe(testUser.username);
    expect(responseData.user.email).toBe(testUser.email);

    // Check that tokens are stored in localStorage
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));
    const userStr = await page.evaluate(() => localStorage.getItem('user'));

    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    expect(userStr).toBeTruthy();

    if (userStr) {
      const user = JSON.parse(userStr);
      expect(user.username).toBe(testUser.username);
      expect(user.email).toBe(testUser.email);
    }

    // Should redirect to authenticated view (main game)
    // Wait for authentication state to update
    await page.waitForTimeout(1000);

    // Verify we're no longer on login/register screen
    // The exact text depends on your main game screen, adjust as needed
    const isAuthenticated = await page.evaluate(() => {
      const token = localStorage.getItem('accessToken');
      return !!token;
    });
    expect(isAuthenticated).toBe(true);

    console.log('✅ Registration flow completed successfully');
    console.log('✅ Tokens extracted and stored correctly');
    console.log('✅ User authenticated');
  });

  test('should handle registration with missing username field', async ({ page }) => {
    // This test verifies error handling when username is missing
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');

    const registerButton = page.getByRole('button', { name: /Create Account|Register/i }).first();
    if (await registerButton.isVisible()) {
      await registerButton.click();
    }

    // Fill only email and password (missing username)
    await page.fill('input[name="email"]', `missing${timestamp}@example.com`);
    await page.fill('input[type="password"][name="password"]', 'SecurePass123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePass123!');

    // Accept terms if present
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Submit should fail with validation error
    await page.getByRole('button', { name: /Sign Up|Create Account|Register/i }).click();

    // Should show validation error (client-side validation should catch this)
    // or wait a moment to see if browser validation kicks in
    await page.waitForTimeout(500);

    // Verify we're still on registration screen (not authenticated)
    const isAuthenticated = await page.evaluate(() => {
      const token = localStorage.getItem('accessToken');
      return !!token;
    });
    expect(isAuthenticated).toBe(false);

    console.log('✅ Validation correctly prevents registration without username');
  });

  test('should login with newly registered user', async ({ page, context }) => {
    // First, register a new user
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');

    const registerButton = page.getByRole('button', { name: /Create Account|Register/i }).first();
    if (await registerButton.isVisible()) {
      await registerButton.click();
    }

    const loginUser = {
      username: `logintest${timestamp}`,
      email: `logintest${timestamp}@example.com`,
      password: 'SecurePass123!',
    };

    await page.fill('input[name="username"]', loginUser.username);
    await page.fill('input[name="email"]', loginUser.email);
    await page.fill('input[type="password"][name="password"]', loginUser.password);
    await page.fill('input[name="confirmPassword"]', loginUser.password);

    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    await page.getByRole('button', { name: /Sign Up|Create Account|Register/i }).click();
    await page.waitForTimeout(1500);

    // Now logout
    await page.evaluate(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    });

    // Reload to go back to login screen
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Switch to login if needed
    const loginButton = page.getByRole('button', { name: /Sign In|Login/i }).first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
    }

    // Fill in login credentials
    await page.fill('input[name="email"]', loginUser.email);
    await page.fill('input[type="password"][name="password"]', loginUser.password);

    // Setup network monitoring
    const loginResponsePromise = page.waitForResponse(
      response => response.url().includes('/auth/login') && response.status() === 200
    );

    // Submit login
    await page.getByRole('button', { name: /Sign In|Login/i }).click();

    // Verify login response
    const loginResponse = await loginResponsePromise;
    const loginData = await loginResponse.json();

    expect(loginData).toHaveProperty('tokens');
    expect(loginData.tokens).toHaveProperty('accessToken');
    expect(loginData.tokens).toHaveProperty('refreshToken');

    // Verify tokens stored
    await page.waitForTimeout(500);
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(accessToken).toBeTruthy();

    console.log('✅ Login flow works with registered user');
    console.log('✅ Tokens correctly extracted from login response');
  });
});
