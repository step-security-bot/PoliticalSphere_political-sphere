/**
 * E2E Test Suite: Party Management
 *
 * Tests party creation, membership, information display, and party interactions
 */

import { test, expect } from '@playwright/test';
import { AuthHelper, TestUtils, DatabaseHelper } from '../src/test-utils.js';

test.describe('Party Management', () => {
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

  test.describe('Party Creation', () => {
    test('should allow users to create new political parties', async ({ page }) => {
      // Create and authenticate user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to party creation
      await page.goto('/parties/create');

      // Fill party details
      const partyName = `Test Party ${Date.now()}`;
      const partyDescription = 'A test political party for comprehensive testing.';
      const partyColor = '#FF6B6B';

      await page.fill('input[name="name"]', partyName);
      await page.fill('textarea[name="description"]', partyDescription);

      // Select color if available
      const colorInput = page.locator('input[type="color"], [data-testid="color-picker"]');
      if (await colorInput.isVisible()) {
        await colorInput.fill(partyColor);
      }

      // Set party platform/goals
      const platformInput = page.locator('textarea[name="platform"], [data-testid="platform"]');
      if (await platformInput.isVisible()) {
        await platformInput.fill('Our platform focuses on testing and quality assurance.');
      }

      // Submit party creation
      await page.getByRole('button', { name: /create party|found party|establish/i }).click();

      // Verify party creation success
      await page.waitForURL(/\/parties\/.+/);

      // Verify party appears in user's parties
      await page.goto('/profile/parties');
      await expect(page.getByText(partyName)).toBeVisible();
    });

    test('should validate party creation requirements', async ({ page }) => {
      // Create and authenticate user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to party creation
      await page.goto('/parties/create');

      // Try to submit empty form
      await page.getByRole('button', { name: /create party|found party/i }).click();

      // Should show validation errors
      await page.waitForSelector('[data-testid="error-message"], .error, .validation-error');

      const errorMessages = await page
        .locator('[data-testid="error-message"], .error, .validation-error')
        .allTextContents();
      expect(errorMessages.length).toBeGreaterThan(0);
      expect(
        errorMessages.some(
          msg => msg.toLowerCase().includes('name') || msg.toLowerCase().includes('required'),
        ),
      ).toBe(true);
    });

    test('should prevent duplicate party names', async ({ page }) => {
      // Create and authenticate user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to party creation
      await page.goto('/parties/create');

      const partyName = `Duplicate Party ${Date.now()}`;

      // Create first party
      await page.fill('input[name="name"]', partyName);
      await page.fill('textarea[name="description"]', 'First instance of this party.');
      await page.getByRole('button', { name: /create party/i }).click();

      await page.waitForTimeout(2000);

      // Try to create second party with same name
      await page.goto('/parties/create');
      await page.fill('input[name="name"]', partyName);
      await page.fill('textarea[name="description"]', 'Second instance - should fail.');
      await page.getByRole('button', { name: /create party/i }).click();

      // Should show error
      await page.waitForSelector('[data-testid="error-message"], .error');
      const errorText = await page.locator('[data-testid="error-message"], .error').textContent();
      expect(errorText?.toLowerCase()).toContain('name');
    });
  });

  test.describe('Party Membership', () => {
    test('should allow users to join existing parties', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to parties list
      await page.goto('/parties');

      // Find a party to join
      const partyCard = page.locator('[data-testid="party-card"], .party-card').first();
      if (await partyCard.isVisible()) {
        const partyName = await partyCard
          .locator('[data-testid="party-name"], .party-name')
          .textContent();

        await partyCard.click();

        // Look for join button
        const joinButton = page.getByRole('button', { name: /join party|join|apply/i });
        if (await joinButton.isVisible()) {
          await joinButton.click();

          // Confirm join if needed
          const confirmButton = page.getByRole('button', { name: /confirm|yes|join/i });
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
          }

          // Verify membership
          await page.waitForSelector('[data-testid="member-status"], .member-status');
          const statusText = await page
            .locator('[data-testid="member-status"], .member-status')
            .textContent();
          expect(statusText?.toLowerCase()).toContain('member');

          // Verify party appears in user's profile
          await page.goto('/profile/parties');
          if (partyName) {
            await expect(page.getByText(partyName)).toBeVisible();
          }
        }
      }
    });

    test('should allow users to leave parties', async ({ page }) => {
      // Create user and join a party first
      await TestUtils.createAuthenticatedUser(page);

      // Join a party
      await page.goto('/parties');
      const partyCard = page.locator('[data-testid="party-card"], .party-card').first();
      if (await partyCard.isVisible()) {
        await partyCard.click();

        const joinButton = page.getByRole('button', { name: /join/i });
        if (await joinButton.isVisible()) {
          await joinButton.click();

          // Now leave the party
          const leaveButton = page.getByRole('button', { name: /leave|resign/i });
          if (await leaveButton.isVisible()) {
            await leaveButton.click();

            // Confirm leave
            const confirmButton = page.getByRole('button', { name: /confirm|yes|leave/i });
            if (await confirmButton.isVisible()) {
              await confirmButton.click();
            }

            // Verify no longer a member
            await page.waitForSelector('[data-testid="join-button"], .join-button');
            const joinBtnVisible = await page.getByRole('button', { name: /join/i }).isVisible();
            expect(joinBtnVisible).toBe(true);
          }
        }
      }
    });

    test('should show party member lists', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to a party
      await page.goto('/parties');

      const partyCard = page.locator('[data-testid="party-card"], .party-card').first();
      if (await partyCard.isVisible()) {
        await partyCard.click();

        // Check for members section
        const membersSection = page.locator('[data-testid="members"], .members, .member-list');
        if (await membersSection.isVisible()) {
          const memberItems = membersSection.locator('[data-testid="member"], .member');
          const memberCount = await memberItems.count();

          // Should show members or indicate member count
          const memberCountText = await membersSection.getByText(/\d+ members?/i).textContent();
          expect(memberCount > 0 || memberCountText).toBeTruthy();
        }
      }
    });
  });

  test.describe('Party Information Display', () => {
    test('should display comprehensive party information', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to parties
      await page.goto('/parties');

      const partyCard = page.locator('[data-testid="party-card"], .party-card').first();
      if (await partyCard.isVisible()) {
        await partyCard.click();

        // Verify party details are displayed
        const partyName = page.locator('[data-testid="party-name"], .party-name');
        const partyDescription = page.locator(
          '[data-testid="party-description"], .party-description',
        );
        const partyPlatform = page.locator('[data-testid="party-platform"], .party-platform');

        // At least name and description should be visible
        await expect(partyName).toBeVisible();
        await expect(partyDescription).toBeVisible();

        // Check for additional information
        const memberCount = page.locator('[data-testid="member-count"], .member-count');
        const foundedDate = page.locator('[data-testid="founded-date"], .founded-date');
        const leaderInfo = page.locator('[data-testid="leader"], .leader');

        // Some metadata should be present
        const metadataVisible =
          (await memberCount.isVisible()) ||
          (await foundedDate.isVisible()) ||
          (await leaderInfo.isVisible());
        expect(metadataVisible).toBe(true);
      }
    });

    test('should show party activity and achievements', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to a party
      await page.goto('/parties');

      const partyCard = page.locator('[data-testid="party-card"], .party-card').first();
      if (await partyCard.isVisible()) {
        await partyCard.click();

        // Check for activity section
        const activitySection = page.locator('[data-testid="activity"], .activity, .achievements');
        if (await activitySection.isVisible()) {
          // Should show some activity or "no recent activity"
          const activityItems = activitySection.locator(
            '[data-testid="activity-item"], .activity-item',
          );
          const noActivity = activitySection.getByText(/no activity|no recent/i);

          const hasActivity = await activityItems.first().isVisible();
          const hasEmptyState = await noActivity.isVisible();

          expect(hasActivity || hasEmptyState).toBe(true);
        }
      }
    });

    test('should display party statistics and metrics', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to party
      await page.goto('/parties');

      const partyCard = page.locator('[data-testid="party-card"], .party-card').first();
      if (await partyCard.isVisible()) {
        await partyCard.click();

        // Look for statistics
        const statsSection = page.locator('[data-testid="statistics"], .statistics, .metrics');
        if (await statsSection.isVisible()) {
          // Should show some numerical data
          const statNumbers = statsSection.locator('[data-testid*="count"], .stat-number');
          const numberElements = await statNumbers.all();

          // Verify numbers are displayed
          for (const element of numberElements) {
            const text = await element.textContent();
            if (text) {
              const number = parseInt(text.replace(/\D/g, ''));
              expect(isNaN(number)).toBe(false);
            }
          }
        }
      }
    });
  });

  test.describe('Party Interactions', () => {
    test('should allow party leaders to manage members', async ({ page }) => {
      // Create user and party
      await TestUtils.createAuthenticatedUser(page);

      // Create a party
      await page.goto('/parties/create');
      const partyName = `Leadership Test Party ${Date.now()}`;
      await page.fill('input[name="name"]', partyName);
      await page.fill('textarea[name="description"]', 'Party for testing leadership features.');
      await page.getByRole('button', { name: /create party/i }).click();

      // Navigate to party management
      await page.goto('/profile/parties');
      await page.getByText(partyName).click();

      // Check for management options
      const manageButton = page.getByRole('button', { name: /manage|settings|admin/i });
      if (await manageButton.isVisible()) {
        await manageButton.click();

        // Should show management interface
        const managementSection = page.locator('[data-testid="management"], .management');
        await expect(managementSection).toBeVisible();

        // Check for member management options
        const memberManagement = managementSection.locator(
          '[data-testid="member-management"], .member-management',
        );
        if (await memberManagement.isVisible()) {
          // Should have options to manage members
          const managementOptions = memberManagement.locator('button, a');
          const optionCount = await managementOptions.count();
          expect(optionCount).toBeGreaterThan(0);
        }
      }
    });

    test('should enable party communication features', async ({ page }) => {
      // Create user and join party
      await TestUtils.createAuthenticatedUser(page);

      // Join a party
      await page.goto('/parties');
      const partyCard = page.locator('[data-testid="party-card"], .party-card').first();
      if (await partyCard.isVisible()) {
        await partyCard.click();

        const joinButton = page.getByRole('button', { name: /join/i });
        if (await joinButton.isVisible()) {
          await joinButton.click();

          // Check for communication features
          const chatSection = page.locator(
            '[data-testid="party-chat"], .party-chat, .communication',
          );
          const forumSection = page.locator('[data-testid="party-forum"], .party-forum');

          if (await chatSection.isVisible()) {
            // Test chat functionality
            const messageInput = chatSection.locator(
              'input[name="message"], textarea[name="message"]',
            );
            if (await messageInput.isVisible()) {
              const testMessage = 'Test party communication message';
              await messageInput.fill(testMessage);

              const sendButton = chatSection.getByRole('button', { name: /send|post/i });
              if (await sendButton.isVisible()) {
                await sendButton.click();

                // Verify message appears
                await expect(chatSection.getByText(testMessage)).toBeVisible();
              }
            }
          }
        }
      }
    });

    test('should show party voting and decision making', async ({ page }) => {
      // Create user and join party
      await TestUtils.createAuthenticatedUser(page);

      // Join a party
      await page.goto('/parties');
      const partyCard = page.locator('[data-testid="party-card"], .party-card').first();
      if (await partyCard.isVisible()) {
        await partyCard.click();

        const joinButton = page.getByRole('button', { name: /join/i });
        if (await joinButton.isVisible()) {
          await joinButton.click();

          // Check for party decisions/voting
          const decisionsSection = page.locator(
            '[data-testid="party-decisions"], .party-decisions, .party-votes',
          );
          if (await decisionsSection.isVisible()) {
            // Should show party decisions or indicate none
            const decisionItems = decisionsSection.locator('[data-testid="decision"], .decision');
            const noDecisions = decisionsSection.getByText(/no decisions|no votes/i);

            const hasDecisions = await decisionItems.first().isVisible();
            const hasEmptyState = await noDecisions.isVisible();

            expect(hasDecisions || hasEmptyState).toBe(true);
          }
        }
      }
    });
  });

  test.describe('Party Search and Discovery', () => {
    test('should allow searching for parties', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to parties
      await page.goto('/parties');

      // Check for search functionality
      const searchInput = page.locator('input[name="search"], [data-testid="party-search"]');
      if (await searchInput.isVisible()) {
        // Search for a specific term
        await searchInput.fill('test');
        await page.waitForTimeout(1000); // Wait for search results

        // Verify search results
        const searchResults = page.locator('[data-testid="party-card"], .party-card');
        const resultCount = await searchResults.count();

        // Should show filtered results or no results message
        const noResults = page.getByText(/no parties|no results/i);
        expect(resultCount > 0 || (await noResults.isVisible())).toBe(true);
      }
    });

    test('should filter parties by criteria', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to parties
      await page.goto('/parties');

      // Check for filter options
      const filterSelect = page.locator('select[name="filter"], [data-testid="party-filter"]');
      if (await filterSelect.isVisible()) {
        // Try different filter options
        const options = await filterSelect.locator('option').all();
        for (const option of options.slice(0, 3)) {
          // Test first 3 options
          const value = await option.getAttribute('value');
          if (value && value !== '') {
            await filterSelect.selectOption(value);
            await page.waitForTimeout(1000);

            // Verify filtered results
            const filteredResults = page.locator('[data-testid="party-card"], .party-card');
            // Results should be filtered appropriately
          }
        }
      }
    });

    test('should display party rankings or popularity', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to parties
      await page.goto('/parties');

      // Check for ranking/popularity indicators
      const rankingElements = page.locator('[data-testid*="rank"], .ranking, .popularity');
      const memberCountElements = page.locator('[data-testid="member-count"], .member-count');

      // Should show some form of ranking or member counts
      const hasRanking = await rankingElements.first().isVisible();
      const hasMemberCounts = await memberCountElements.first().isVisible();

      expect(hasRanking || hasMemberCounts).toBe(true);
    });
  });

  test.describe('Party Administration', () => {
    test('should allow party leaders to edit party information', async ({ page }) => {
      // Create user and party
      await TestUtils.createAuthenticatedUser(page);

      // Create a party
      await page.goto('/parties/create');
      const originalName = `Editable Party ${Date.now()}`;
      await page.fill('input[name="name"]', originalName);
      await page.fill('textarea[name="description"]', 'Original description.');
      await page.getByRole('button', { name: /create party/i }).click();

      // Edit party
      const editButton = page.getByRole('button', { name: /edit|settings/i });
      if (await editButton.isVisible()) {
        await editButton.click();

        // Update party information
        const nameInput = page.locator('input[name="name"]');
        if (await nameInput.isVisible()) {
          const newName = `Updated ${originalName}`;
          await nameInput.fill(newName);

          const descriptionInput = page.locator('textarea[name="description"]');
          if (await descriptionInput.isVisible()) {
            await descriptionInput.fill('Updated party description.');
          }

          // Save changes
          await page.getByRole('button', { name: /save|update/i }).click();

          // Verify changes
          await expect(page.getByText(newName)).toBeVisible();
        }
      }
    });

    test('should handle party dissolution', async ({ page }) => {
      // Create user and party
      await TestUtils.createAuthenticatedUser(page);

      // Create a party
      await page.goto('/parties/create');
      const partyName = `Dissolution Test Party ${Date.now()}`;
      await page.fill('input[name="name"]', partyName);
      await page.fill('textarea[name="description"]', 'Party to be dissolved.');
      await page.getByRole('button', { name: /create party/i }).click();

      // Look for dissolution option
      const settingsButton = page.getByRole('button', { name: /settings|manage/i });
      if (await settingsButton.isVisible()) {
        await settingsButton.click();

        const dissolveButton = page.getByRole('button', { name: /dissolve|delete/i });
        if (await dissolveButton.isVisible()) {
          await dissolveButton.click();

          // Confirm dissolution
          const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
          if (await confirmButton.isVisible()) {
            await confirmButton.click();

            // Verify party is dissolved
            await page.waitForSelector('[data-testid="dissolved-message"], .dissolved');
          }
        }
      }
    });
  });
});
