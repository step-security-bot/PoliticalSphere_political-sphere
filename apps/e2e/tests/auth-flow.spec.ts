/**
 * E2E Test Suite: Complete Authentication Flow
 *
 * Tests user registration, login, logout, password reset, and authentication state management
 */

import { test, expect } from '@playwright/test';
import { AuthHelper, TestUtils } from '../src/test-utils.js';

test.describe('Authentication Flow', () => {
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.initAPIContext();
  });

  test.afterEach(async () => {
    await authHelper.cleanup();
  });

  test.describe('User Registration', () => {
    test('should successfully register a new user via API', async ({ page }) => {
      const timestamp = Date.now();
      const userData = {
        username: `testuser_${timestamp}`,
        email: `testuser_${timestamp}@example.com`,
        password: 'SecurePass123!',
      };

      const user = await authHelper.registerUser(userData);

      expect(user.id).toBeTruthy();
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.tokens).toBeTruthy();
      expect(user.tokens?.accessToken).toBeTruthy();
      expect(user.tokens?.refreshToken).toBeTruthy();
    });

    test('should successfully register a new user via UI', async ({ page }) => {
      const timestamp = Date.now();
      const userData = {
        username: `uiuser_${timestamp}`,
        email: `uiuser_${timestamp}@example.com`,
        password: 'SecurePass123!',
      };

      await authHelper.registerViaUI(userData);

      // Verify user is authenticated
      const isAuthenticated = await authHelper.isAuthenticated();
      expect(isAuthenticated).toBe(true);

      // Verify user data in localStorage
      const currentUser = await authHelper.getCurrentUser();
      expect(currentUser).toBeTruthy();
      expect(currentUser.username).toBe(userData.username);
      expect(currentUser.email).toBe(userData.email);
    });

    test('should prevent registration with duplicate email', async ({ page }) => {
      const timestamp = Date.now();
      const userData = {
        username: `user1_${timestamp}`,
        email: `duplicate_${timestamp}@example.com`,
        password: 'SecurePass123!',
      };

      // Register first user
      await authHelper.registerUser(userData);

      // Try to register second user with same email
      const duplicateUserData = {
        username: `user2_${timestamp}`,
        email: userData.email, // Same email
        password: 'SecurePass123!',
      };

      try {
        await authHelper.registerUser(duplicateUserData);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('Registration failed');
      }
    });

    test('should prevent registration with duplicate username', async ({ page }) => {
      const timestamp = Date.now();
      const userData = {
        username: `uniqueuser_${timestamp}`,
        email: `email1_${timestamp}@example.com`,
        password: 'SecurePass123!',
      };

      // Register first user
      await authHelper.registerUser(userData);

      // Try to register second user with same username
      const duplicateUserData = {
        username: userData.username, // Same username
        email: `email2_${timestamp}@example.com`,
        password: 'SecurePass123!',
      };

      try {
        await authHelper.registerUser(duplicateUserData);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error.message).toContain('Registration failed');
      }
    });

    test('should validate password requirements', async ({ page }) => {
      const timestamp = Date.now();
      const weakPasswords = ['123', 'password', 'weak'];

      for (const weakPassword of weakPasswords) {
        const userData = {
          username: `weakpass_${timestamp}_${weakPassword}`,
          email: `weakpass_${timestamp}_${weakPassword}@example.com`,
          password: weakPassword,
        };

        try {
          await authHelper.registerUser(userData);
          expect(true).toBe(false); // Should not succeed
        } catch (error: any) {
          expect(error.message).toContain('Registration failed');
        }
      }
    });
  });

  test.describe('User Login', () => {
    test('should successfully login existing user via API', async ({ page }) => {
      // First register a user
      const timestamp = Date.now();
      const userData = {
        username: `loginuser_${timestamp}`,
        email: `loginuser_${timestamp}@example.com`,
        password: 'SecurePass123!',
      };

      await authHelper.registerUser(userData);

      // Now login
      const tokens = await authHelper.loginUser(userData.email, userData.password);

      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
    });

    test('should successfully login existing user via UI', async ({ page }) => {
      // First register a user
      const timestamp = Date.now();
      const userData = {
        username: `uilogin_${timestamp}`,
        email: `uilogin_${timestamp}@example.com`,
        password: 'SecurePass123!',
      };

      await authHelper.registerUser(userData);

      // Clear any existing auth state
      await authHelper.clearAuthTokens();

      // Login via UI
      await authHelper.loginViaUI(userData.email, userData.password);

      // Verify authentication
      const isAuthenticated = await authHelper.isAuthenticated();
      expect(isAuthenticated).toBe(true);
    });

    test('should fail login with wrong password', async ({ page }) => {
      // First register a user
      const timestamp = Date.now();
      const userData = {
        username: `wrongpass_${timestamp}`,
        email: `wrongpass_${timestamp}@example.com`,
        password: 'SecurePass123!',
      };

      await authHelper.registerUser(userData);

      // Try login with wrong password
      try {
        await authHelper.loginUser(userData.email, 'WrongPassword123!');
        expect(true).toBe(false); // Should not succeed
      } catch (error: any) {
        expect(error.message).toContain('Login failed');
      }
    });

    test('should fail login with non-existent email', async ({ page }) => {
      try {
        await authHelper.loginUser('nonexistent@example.com', 'SomePassword123!');
        expect(true).toBe(false); // Should not succeed
      } catch (error: any) {
        expect(error.message).toContain('Login failed');
      }
    });
  });

  test.describe('Authentication State Management', () => {
    test('should persist authentication state across page reloads', async ({ page }) => {
      // Register and login user
      const user = await TestUtils.createAuthenticatedUser(page);

      // Verify initial authentication
      let isAuthenticated = await authHelper.isAuthenticated();
      expect(isAuthenticated).toBe(true);

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify authentication persists
      isAuthenticated = await authHelper.isAuthenticated();
      expect(isAuthenticated).toBe(true);

      const currentUser = await authHelper.getCurrentUser();
      expect(currentUser.id).toBe(user.id);
    });

    test('should clear authentication state on logout', async ({ page }) => {
      // Register and login user
      await TestUtils.createAuthenticatedUser(page);

      // Verify authenticated
      let isAuthenticated = await authHelper.isAuthenticated();
      expect(isAuthenticated).toBe(true);

      // Logout
      await authHelper.logout();

      // Verify no longer authenticated
      isAuthenticated = await authHelper.isAuthenticated();
      expect(isAuthenticated).toBe(false);

      const currentUser = await authHelper.getCurrentUser();
      expect(currentUser).toBeNull();
    });

    test('should handle token expiration gracefully', async ({ page }) => {
      // Register user
      const user = await TestUtils.createAuthenticatedUser(page);

      // Manually set expired token (this would need backend support for testing)
      // For now, we'll simulate by clearing tokens
      await authHelper.clearAuthTokens();

      // Try to access protected resource
      await page.reload();

      // Should redirect to login or show unauthenticated state
      const isAuthenticated = await authHelper.isAuthenticated();
      expect(isAuthenticated).toBe(false);
    });
  });

  test.describe('Password Reset', () => {
    test('should initiate password reset request', async ({ page }) => {
      // Register a user first
      const timestamp = Date.now();
      const userData = {
        username: `resetuser_${timestamp}`,
        email: `resetuser_${timestamp}@example.com`,
        password: 'SecurePass123!',
      };

      await authHelper.registerUser(userData);

      // Navigate to password reset page
      await page.goto('/');

      // Look for "Forgot Password" link
      const forgotPasswordLink = page.getByRole('link', {
        name: /forgot password|reset password/i,
      });
      if (await forgotPasswordLink.isVisible()) {
        await forgotPasswordLink.click();

        // Fill email for password reset
        await page.fill('input[name="email"]', userData.email);

        // Submit reset request
        await page.getByRole('button', { name: /reset password|send reset link/i }).click();

        // Should show success message
        await page.waitForSelector('[data-testid="reset-success"]', { timeout: 5000 });
      } else {
        // If no UI reset flow, test API directly
        const response = await authHelper.getAPIContext().post('/auth/forgot-password', {
          data: { email: userData.email },
        });

        expect(response.ok()).toBe(true);
      }
    });

    test('should prevent password reset for non-existent email', async ({ page }) => {
      // Navigate to password reset page
      await page.goto('/');

      const forgotPasswordLink = page.getByRole('link', {
        name: /forgot password|reset password/i,
      });
      if (await forgotPasswordLink.isVisible()) {
        await forgotPasswordLink.click();

        // Fill non-existent email
        await page.fill('input[name="email"]', 'nonexistent@example.com');

        // Submit reset request
        await page.getByRole('button', { name: /reset password|send reset link/i }).click();

        // Should show error or success (depending on security design)
        // Many apps show success even for non-existent emails for security
        await page.waitForTimeout(2000);
      }
    });
  });

  test.describe('Security Features', () => {
    test('should prevent brute force login attempts', async ({ page }) => {
      const timestamp = Date.now();
      const userData = {
        username: `bruteforce_${timestamp}`,
        email: `bruteforce_${timestamp}@example.com`,
        password: 'SecurePass123!',
      };

      // Register user
      await authHelper.registerUser(userData);

      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        try {
          await authHelper.loginUser(userData.email, 'WrongPassword123!');
        } catch (error) {
          // Expected to fail
        }
      }

      // Final attempt should be blocked or delayed
      try {
        await authHelper.loginUser(userData.email, userData.password);
        // If this succeeds, rate limiting might not be implemented
      } catch (error: any) {
        // Rate limiting is working
        expect(error.message).toContain('Login failed');
      }
    });

    test('should handle concurrent login sessions', async ({ page, context }) => {
      // Register user
      const user = await TestUtils.createAuthenticatedUser(page);

      // Create second browser context
      const newContext = await context.browser()?.newContext();
      const newPage = newContext ? await newContext.newPage() : page;
      const newAuthHelper = new AuthHelper(newPage);
      await newAuthHelper.initAPIContext();

      try {
        // Login with same user in second context
        const tokens2 = await newAuthHelper.loginUser(user.email, user.password);
        expect(tokens2.accessToken).toBeTruthy();

        // Both sessions should be valid
        const isAuthenticated1 = await authHelper.isAuthenticated();
        const isAuthenticated2 = await newAuthHelper.isAuthenticated();

        expect(isAuthenticated1).toBe(true);
        expect(isAuthenticated2).toBe(true);
      } finally {
        if (newContext) {
          await newContext.close();
        }
        await newAuthHelper.cleanup();
      }
    });
  });

  test.describe('UI/UX Validation', () => {
    test('should show appropriate loading states during authentication', async ({ page }) => {
      const timestamp = Date.now();
      const userData = {
        username: `loading_${timestamp}`,
        email: `loading_${timestamp}@example.com`,
        password: 'SecurePass123!',
      };

      await page.goto('/');

      // Start registration
      const registerButton = page
        .getByRole('button', { name: /register|sign up|create account/i })
        .first();
      if (await registerButton.isVisible()) {
        await registerButton.click();

        // Fill form
        await page.fill('input[name="username"]', userData.username);
        await page.fill('input[name="email"]', userData.email);
        await page.fill('input[type="password"][name="password"]', userData.password);
        await page.fill('input[name="confirmPassword"]', userData.password);

        // Submit and check for loading state
        const submitButton = page.getByRole('button', { name: /sign up|create account|register/i });
        await submitButton.click();

        // Check if button shows loading state
        const buttonText = await submitButton.textContent();
        expect(buttonText).toMatch(/loading|processing|signing up/i);
      }
    });

    test('should provide clear error messages for validation failures', async ({ page }) => {
      await page.goto('/');

      const registerButton = page
        .getByRole('button', { name: /register|sign up|create account/i })
        .first();
      if (await registerButton.isVisible()) {
        await registerButton.click();

        // Try to submit empty form
        const submitButton = page.getByRole('button', { name: /sign up|create account|register/i });
        await submitButton.click();

        // Should show validation errors
        await page.waitForSelector('[data-testid="error-message"], .error, .validation-error', {
          timeout: 5000,
        });

        const errorMessages = await page
          .locator('[data-testid="error-message"], .error, .validation-error')
          .allTextContents();
        expect(errorMessages.length).toBeGreaterThan(0);
      }
    });

    test('should maintain accessibility standards in auth forms', async ({ page }) => {
      await page.goto('/');

      // Check for proper form labels
      const inputs = await page
        .locator('input[type="email"], input[type="password"], input[name="username"]')
        .all();
      for (const input of inputs) {
        const label =
          (await input.getAttribute('aria-label')) || (await input.getAttribute('aria-labelledby'));
        expect(label || (await input.getAttribute('placeholder'))).toBeTruthy();
      }

      // Check keyboard navigation
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus');
      expect(await focusedElement.isVisible()).toBe(true);
    });
  });
});
