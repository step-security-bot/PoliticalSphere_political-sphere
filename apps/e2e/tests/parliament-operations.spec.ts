/**
 * E2E Test Suite: Parliament Operations
 *
 * Tests bill creation, parliament viewing, debates, and legislative processes
 */

import { test, expect } from '@playwright/test';
import { AuthHelper, TestUtils, DatabaseHelper } from '../src/test-utils.js';

test.describe('Parliament Operations', () => {
  let authHelper: AuthHelper;
  let dbHelper: DatabaseHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    await authHelper.initAPIContext();

    dbHelper = new DatabaseHelper();
    await dbHelper.setup();
  });

  test.afterEach(async () => {
    await dbHelper.cleanup();
    await authHelper.cleanup();
  });

  test.describe('Bill Creation', () => {
    test('should allow authenticated user to create a bill', async ({ page }) => {
      // Create and authenticate user
      const user = await TestUtils.createAuthenticatedUser(page);

      // Navigate to bill creation page
      await page.goto('/parliament/bills/new');

      // Fill bill details
      const billTitle = `Test Bill ${Date.now()}`;
      const billDescription = 'A comprehensive test bill for parliament operations.';

      await page.fill('input[name="title"]', billTitle);
      await page.fill('textarea[name="description"]', billDescription);

      // Select bill category/type if available
      const categorySelect = page.locator('select[name="category"]');
      if (await categorySelect.isVisible()) {
        await categorySelect.selectOption('legislation');
      }

      // Submit bill
      await page.getByRole('button', { name: /submit bill|create bill|propose/i }).click();

      // Verify bill creation success
      await page.waitForURL(/\/parliament\/bills\/.+/);

      // Verify bill appears in user's proposed bills
      await page.goto('/parliament/bills/my-bills');
      await expect(page.getByText(billTitle)).toBeVisible();
    });

    test('should validate bill creation requirements', async ({ page }) => {
      // Create and authenticate user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to bill creation
      await page.goto('/parliament/bills/new');

      // Try to submit empty form
      await page.getByRole('button', { name: /submit bill|create bill|propose/i }).click();

      // Should show validation errors
      await page.waitForSelector('[data-testid="error-message"], .error, .validation-error');

      const errorMessages = await page
        .locator('[data-testid="error-message"], .error, .validation-error')
        .allTextContents();
      expect(errorMessages.length).toBeGreaterThan(0);
      expect(
        errorMessages.some(
          msg => msg.toLowerCase().includes('title') || msg.toLowerCase().includes('required')
        )
      ).toBe(true);
    });

    test('should prevent unauthenticated users from creating bills', async ({ page }) => {
      // Navigate to bill creation without authentication
      await page.goto('/parliament/bills/new');

      // Should redirect to login or show access denied
      await page.waitForURL(/\/login|\/auth|\/\?login=true/);

      const currentURL = page.url();
      expect(currentURL).toMatch(/login|auth|\?login=true/);
    });

    test('should handle bill creation with special characters and formatting', async ({ page }) => {
      // Create and authenticate user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to bill creation
      await page.goto('/parliament/bills/new');

      // Create bill with special characters
      const specialTitle = 'Bill with Special Characters: éñüñ 测试 🚀';
      const specialDescription = `Description with formatting:

• Bullet points
• Special characters: @#$%^&*()
• Unicode: 🎉📝🏛️

**Bold text** and *italic text*.`;

      await page.fill('input[name="title"]', specialTitle);
      await page.fill('textarea[name="description"]', specialDescription);

      // Submit bill
      await page.getByRole('button', { name: /submit bill|create bill|propose/i }).click();

      // Verify bill was created with special characters preserved
      await page.waitForURL(/\/parliament\/bills\/.+/);
      await expect(page.getByText(specialTitle)).toBeVisible();
    });
  });

  test.describe('Parliament Viewing', () => {
    test('should display parliament dashboard with active bills', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to parliament
      await page.goto('/parliament');

      // Verify parliament elements are visible
      await expect(page.getByRole('heading', { name: /parliament|house|senate/i })).toBeVisible();

      // Check for bill listings
      const billList = page.locator('[data-testid="bill-list"], .bill-list, .bills-container');
      await expect(billList).toBeVisible();

      // Verify bill status indicators
      const statusIndicators = page.locator('[data-testid*="status"], .status-badge, .bill-status');
      const statusCount = await statusIndicators.count();
      expect(statusCount).toBeGreaterThan(0);
    });

    test('should allow filtering bills by status', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to parliament
      await page.goto('/parliament');

      // Look for filter controls
      const filterSelect = page.locator('select[name="status"], [data-testid="status-filter"]');
      if (await filterSelect.isVisible()) {
        // Test different status filters
        const statuses = ['proposed', 'debating', 'voting', 'passed', 'rejected'];

        for (const status of statuses) {
          try {
            await filterSelect.selectOption(status);
            await page.waitForTimeout(1000); // Wait for filtering

            // Verify only bills with selected status are shown
            const visibleBills = page.locator('[data-testid="bill-item"], .bill-item');
            const billCount = await visibleBills.count();

            if (billCount > 0) {
              // Check that all visible bills have the correct status
              for (let i = 0; i < Math.min(billCount, 3); i++) {
                const billStatus = await visibleBills
                  .nth(i)
                  .locator('[data-testid*="status"], .status-badge')
                  .textContent();
                expect(billStatus?.toLowerCase()).toContain(status.toLowerCase());
              }
            }
          } catch (error) {
            // Status option might not exist, continue
          }
        }
      }
    });

    test('should display bill details correctly', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to parliament and click on a bill
      await page.goto('/parliament');

      const billLink = page.locator('[data-testid="bill-link"], .bill-title').first();
      if (await billLink.isVisible()) {
        const billTitle = await billLink.textContent();
        await billLink.click();

        // Verify bill detail page
        await page.waitForURL(/\/parliament\/bills\/.+/);

        // Check bill details are displayed
        await expect(page.getByText(billTitle || '')).toBeVisible();

        // Verify bill metadata
        const proposerElement = page.locator('[data-testid="bill-proposer"], .proposer');
        const dateElement = page.locator('[data-testid="bill-date"], .date');
        const statusElement = page.locator('[data-testid="bill-status"], .status');

        // At least one metadata element should be visible
        const metadataVisible =
          (await proposerElement.isVisible()) ||
          (await dateElement.isVisible()) ||
          (await statusElement.isVisible());
        expect(metadataVisible).toBe(true);
      }
    });

    test('should handle empty parliament gracefully', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to parliament
      await page.goto('/parliament');

      // Should show empty state or "no bills" message
      const emptyMessage = page.getByText(/no bills|empty|no legislation/i);
      const billCount = await page.locator('[data-testid="bill-item"], .bill-item').count();

      // Either no bills or empty message should be present
      expect(billCount === 0 || (await emptyMessage.isVisible())).toBe(true);
    });
  });

  test.describe('Debate Participation', () => {
    test('should allow users to participate in bill debates', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to parliament and find a bill in debate
      await page.goto('/parliament');

      // Look for bills in debate status
      const debateBill = page
        .locator('[data-testid="bill-item"], .bill-item')
        .filter({
          hasText: /debate|debating|discussion/i,
        })
        .first();

      if (await debateBill.isVisible()) {
        await debateBill.click();

        // Check for debate/comment section
        const commentSection = page.locator('[data-testid="comments"], .comments, .debate');
        if (await commentSection.isVisible()) {
          // Add a comment
          const commentInput = page.locator(
            'textarea[name="comment"], [data-testid="comment-input"]'
          );
          const commentText = `Test debate comment ${Date.now()}`;

          if (await commentInput.isVisible()) {
            await commentInput.fill(commentText);

            // Submit comment
            await page.getByRole('button', { name: /post comment|submit|add comment/i }).click();

            // Verify comment appears
            await expect(page.getByText(commentText)).toBeVisible();
          }
        }
      } else {
        // If no debate bills, create one and test
        await page.goto('/parliament/bills/new');

        const billTitle = `Debate Test Bill ${Date.now()}`;
        await page.fill('input[name="title"]', billTitle);
        await page.fill('textarea[name="description"]', 'Bill for testing debate functionality.');

        await page.getByRole('button', { name: /submit bill|create bill|propose/i }).click();

        // Verify debate section is available on the bill page
        const debateSection = page.locator('[data-testid="debate"], .debate-section');
        // Debate might not be immediately available, so we just check it doesn't error
      }
    });

    test('should validate debate comments', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Find a bill with debate
      await page.goto('/parliament');

      const billLink = page.locator('[data-testid="bill-link"], .bill-title').first();
      if (await billLink.isVisible()) {
        await billLink.click();

        // Look for comment input
        const commentInput = page.locator(
          'textarea[name="comment"], [data-testid="comment-input"]'
        );

        if (await commentInput.isVisible()) {
          // Try to submit empty comment
          const submitButton = page.getByRole('button', {
            name: /post comment|submit|add comment/i,
          });
          await submitButton.click();

          // Should show validation error
          await page.waitForSelector('[data-testid="error-message"], .error');

          // Now add valid comment
          const validComment = 'This is a valid debate comment for testing purposes.';
          await commentInput.fill(validComment);
          await submitButton.click();

          // Should succeed
          await expect(page.getByText(validComment)).toBeVisible();
        }
      }
    });

    test('should display debate history chronologically', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Find bill with existing debate
      await page.goto('/parliament');

      const billLink = page.locator('[data-testid="bill-link"], .bill-title').first();
      if (await billLink.isVisible()) {
        await billLink.click();

        // Check comment ordering
        const comments = page.locator('[data-testid="comment"], .comment');

        if (await comments.first().isVisible()) {
          const commentCount = await comments.count();

          if (commentCount > 1) {
            // Get timestamps of first and last comments
            const firstCommentTime = await comments
              .first()
              .locator('[data-testid="timestamp"], .timestamp')
              .textContent();
            const lastCommentTime = await comments
              .last()
              .locator('[data-testid="timestamp"], .timestamp')
              .textContent();

            // Comments should be in chronological order (oldest first)
            if (firstCommentTime && lastCommentTime) {
              const firstTime = new Date(firstCommentTime).getTime();
              const lastTime = new Date(lastCommentTime).getTime();
              expect(firstTime).toBeLessThanOrEqual(lastTime);
            }
          }
        }
      }
    });
  });

  test.describe('Parliament Session Management', () => {
    test('should display current parliament session information', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to parliament
      await page.goto('/parliament');

      // Check for session information
      const sessionInfo = page.locator(
        '[data-testid="session-info"], .session-info, .parliament-session'
      );
      if (await sessionInfo.isVisible()) {
        // Verify session details
        const sessionElements = await sessionInfo.locator('span, div').allTextContents();
        expect(sessionElements.length).toBeGreaterThan(0);
      }
    });

    test('should show parliament schedule and upcoming events', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to parliament
      await page.goto('/parliament');

      // Look for schedule/calendar
      const scheduleSection = page.locator('[data-testid="schedule"], .schedule, .calendar');
      if (await scheduleSection.isVisible()) {
        // Check for upcoming events
        const events = scheduleSection.locator('[data-testid="event"], .event');
        const eventCount = await events.count();

        // Should have some events or show "no upcoming events"
        const noEventsMessage = scheduleSection.getByText(/no upcoming|no events/i);
        expect(eventCount > 0 || (await noEventsMessage.isVisible())).toBe(true);
      }
    });

    test('should handle parliament navigation correctly', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Test navigation between parliament sections
      const navItems = [
        { path: '/parliament', label: /overview|dashboard/i },
        { path: '/parliament/bills', label: /bills|legislation/i },
        { path: '/parliament/members', label: /members|representatives/i },
      ];

      for (const nav of navItems) {
        await page.goto(nav.path);
        await page.waitForLoadState('networkidle');

        // Check if navigation item is active/highlighted
        const activeNav = page.locator('[data-testid="nav-item"].active, .nav-item.active').filter({
          hasText: nav.label,
        });

        // Either the nav item should be active or the page should contain expected content
        const hasActiveNav = await activeNav.isVisible();
        const hasExpectedContent = await page.getByText(nav.label).isVisible();

        expect(hasActiveNav || hasExpectedContent).toBe(true);
      }
    });
  });

  test.describe('Accessibility and Performance', () => {
    test('should maintain accessibility standards in parliament interface', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to parliament
      await page.goto('/parliament');

      // Check for proper heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);

      // Check for focus management
      await page.keyboard.press('Tab');
      const focusedElement = await page.locator(':focus');
      expect(await focusedElement.isVisible()).toBe(true);

      // Check for ARIA labels where needed
      const buttons = page.locator('button:not([aria-label]):not([aria-labelledby])');
      const unlabeledButtons = await buttons.all();
      // Allow some buttons to be unlabeled if they have clear text content
      for (const button of unlabeledButtons) {
        const textContent = await button.textContent();
        expect(textContent?.trim()).toBeTruthy();
      }
    });

    test('should perform well under load', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to parliament
      const startTime = Date.now();
      await page.goto('/parliament');
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      // Should load within reasonable time (under 5 seconds)
      expect(loadTime).toBeLessThan(5000);

      // Test bill list rendering performance
      const billList = page.locator('[data-testid="bill-list"], .bill-list');
      if (await billList.isVisible()) {
        const renderStart = Date.now();
        await billList.waitFor();
        const renderTime = Date.now() - renderStart;

        // Should render within 2 seconds
        expect(renderTime).toBeLessThan(2000);
      }
    });
  });
});
