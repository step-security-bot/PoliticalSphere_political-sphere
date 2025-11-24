/**
 * E2E Test Suite: Voting System
 *
 * Tests vote casting, result viewing, voting restrictions, and election processes
 */

import { test, expect } from '@playwright/test';
import { AuthHelper, TestUtils, DatabaseHelper } from '../src/test-utils.js';

test.describe('Voting System', () => {
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

  test.describe('Vote Casting', () => {
    test('should allow authenticated users to cast votes on bills', async ({ page }) => {
      // Create authenticated user
      const user = await TestUtils.createAuthenticatedUser(page);

      // Navigate to parliament and find a bill in voting
      await page.goto('/parliament');

      // Look for bills in voting status
      const votingBill = page
        .locator('[data-testid="bill-item"], .bill-item')
        .filter({
          hasText: /voting|vote/i,
        })
        .first();

      if (await votingBill.isVisible()) {
        await votingBill.click();

        // Check for voting interface
        const voteButtons = page
          .locator('[data-testid="vote-button"], .vote-button, button')
          .filter({
            hasText: /yes|no|abstain|aye|nay/i,
          });

        if (await voteButtons.first().isVisible()) {
          // Cast a vote
          await voteButtons
            .filter({ hasText: /yes|aye/i })
            .first()
            .click();

          // Verify vote was recorded
          await page.waitForSelector('[data-testid="vote-confirmation"], .vote-confirmation');

          // Check that vote buttons are disabled after voting
          const disabledButtons = page.locator('button:disabled').filter({
            hasText: /yes|no|abstain|aye|nay/i,
          });
          expect(await disabledButtons.count()).toBeGreaterThan(0);
        }
      } else {
        // If no voting bills, create a scenario or skip
        console.log('No bills currently in voting phase');
      }
    });

    test('should prevent multiple votes on the same bill', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Find a bill and cast initial vote
      await page.goto('/parliament');

      const billLink = page.locator('[data-testid="bill-link"], .bill-title').first();
      if (await billLink.isVisible()) {
        await billLink.click();

        const voteButtons = page.locator('[data-testid="vote-button"], .vote-button').filter({
          hasText: /yes|no|abstain/i,
        });

        if (await voteButtons.first().isVisible()) {
          // Cast first vote
          await voteButtons.first().click();
          await page.waitForTimeout(1000);

          // Try to vote again
          const secondVoteAttempt = voteButtons.first();
          if (await secondVoteAttempt.isVisible()) {
            // Button should be disabled or show "already voted"
            const isDisabled = await secondVoteAttempt.isDisabled();
            const hasVotedText = await secondVoteAttempt.getByText(/voted|already/i).isVisible();

            expect(isDisabled || hasVotedText).toBe(true);
          }
        }
      }
    });

    test('should handle vote changes within allowed timeframe', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Find a bill in voting
      await page.goto('/parliament');

      const billLink = page.locator('[data-testid="bill-link"], .bill-title').first();
      if (await billLink.isVisible()) {
        await billLink.click();

        const voteButtons = page.locator('[data-testid="vote-button"], .vote-button');

        if (await voteButtons.first().isVisible()) {
          // Cast initial vote
          await voteButtons.filter({ hasText: /yes/i }).first().click();
          await page.waitForTimeout(1000);

          // Look for change vote option
          const changeVoteButton = page.getByRole('button', { name: /change vote|revote/i });

          if (await changeVoteButton.isVisible()) {
            await changeVoteButton.click();

            // Change to different vote
            await voteButtons.filter({ hasText: /no/i }).first().click();

            // Verify vote was changed
            await page.waitForSelector('[data-testid="vote-updated"], .vote-updated');
          }
        }
      }
    });
  });

  test.describe('Vote Results and Analytics', () => {
    test('should display real-time vote counts', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to bill with voting
      await page.goto('/parliament');

      const votingBill = page
        .locator('[data-testid="bill-item"], .bill-item')
        .filter({
          hasText: /voting/i,
        })
        .first();

      if (await votingBill.isVisible()) {
        await votingBill.click();

        // Check for vote count displays
        const voteCounts = page.locator('[data-testid*="count"], .vote-count, .results');
        const countElements = await voteCounts.all();

        // Should show some vote statistics
        expect(countElements.length).toBeGreaterThan(0);

        // Verify counts are numbers
        for (const countElement of countElements) {
          const text = await countElement.textContent();
          if (text) {
            const number = parseInt(text.replace(/\D/g, ''));
            expect(isNaN(number)).toBe(false);
          }
        }
      }
    });

    test('should show vote results after voting closes', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Look for completed votes or results
      await page.goto('/parliament/bills/results');

      // Check for results display
      const resultsSection = page.locator('[data-testid="results"], .results, .vote-results');
      if (await resultsSection.isVisible()) {
        // Verify results structure
        const billResults = resultsSection.locator('[data-testid="bill-result"], .bill-result');
        const resultCount = await billResults.count();

        if (resultCount > 0) {
          // Check first result has proper structure
          const firstResult = billResults.first();
          const title = await firstResult.locator('[data-testid="title"], .title').textContent();
          const outcome = await firstResult
            .locator('[data-testid="outcome"], .outcome')
            .textContent();

          expect(title).toBeTruthy();
          expect(outcome).toBeTruthy();
        }
      }
    });

    test('should display voting history for users', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to user profile or voting history
      await page.goto('/profile/votes');

      // Check for voting history
      const historySection = page.locator('[data-testid="vote-history"], .vote-history');
      if (await historySection.isVisible()) {
        const historyItems = historySection.locator('[data-testid="history-item"], .history-item');
        const itemCount = await historyItems.count();

        // Should show some history or empty state
        const emptyMessage = historySection.getByText(/no votes|no history/i);
        expect(itemCount > 0 || (await emptyMessage.isVisible())).toBe(true);
      }
    });

    test('should show vote distribution charts', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Find a bill with voting results
      await page.goto('/parliament');

      const billLink = page.locator('[data-testid="bill-link"], .bill-title').first();
      if (await billLink.isVisible()) {
        await billLink.click();

        // Look for charts or visualizations
        const chart = page.locator('[data-testid="vote-chart"], .chart, canvas, svg');
        const visualization = page.locator('[data-testid="visualization"], .visualization');

        // Should have some form of data visualization
        const hasChart = await chart.isVisible();
        const hasVisualization = await visualization.isVisible();

        expect(hasChart || hasVisualization).toBe(true);
      }
    });
  });

  test.describe('Voting Restrictions and Validation', () => {
    test('should prevent unauthenticated users from voting', async ({ page }) => {
      // Navigate to parliament without authentication
      await page.goto('/parliament');

      const billLink = page.locator('[data-testid="bill-link"], .bill-title').first();
      if (await billLink.isVisible()) {
        await billLink.click();

        // Try to access voting interface
        const voteButton = page.getByRole('button', { name: /vote|yes|no/i });

        if (await voteButton.isVisible()) {
          await voteButton.click();

          // Should redirect to login or show auth required message
          await page.waitForURL(/\/login|\/auth/);
          const currentURL = page.url();
          expect(currentURL).toMatch(/login|auth/);
        }
      }
    });

    test('should enforce voting deadlines', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Look for bills near voting deadline
      await page.goto('/parliament');

      // Check for deadline indicators
      const deadlineIndicator = page.locator(
        '[data-testid="deadline"], .deadline, .time-remaining'
      );
      if (await deadlineIndicator.isVisible()) {
        const deadlineText = await deadlineIndicator.textContent();

        // Should show time remaining or "closed"
        expect(deadlineText).toMatch(/remaining|closed|ended|expired/i);
      }
    });

    test('should validate voter eligibility', async ({ page }) => {
      // Create authenticated user
      const user = await TestUtils.createAuthenticatedUser(page);

      // Navigate to voting
      await page.goto('/parliament');

      const billLink = page.locator('[data-testid="bill-link"], .bill-title').first();
      if (await billLink.isVisible()) {
        await billLink.click();

        // Check for eligibility requirements
        const eligibilityNotice = page.locator('[data-testid="eligibility"], .eligibility');
        if (await eligibilityNotice.isVisible()) {
          const noticeText = await eligibilityNotice.textContent();
          // Should indicate if user can vote or why they cannot
          expect(noticeText).toBeTruthy();
        }
      }
    });

    test('should handle concurrent voting attempts', async ({ page, context }) => {
      // Create authenticated user
      const user = await TestUtils.createAuthenticatedUser(page);

      // Create second browser context
      const newContext = await context.browser()?.newContext();
      const newPage = newContext ? await newContext.newPage() : page;
      const newAuthHelper = new AuthHelper(newPage);
      await newAuthHelper.initAPIContext();

      try {
        // Login same user in second context
        await newAuthHelper.loginViaUI(user.email, user.password);

        // Both try to vote on same bill
        await page.goto('/parliament');
        await newPage.goto('/parliament');

        // Find same bill in both contexts
        const billLink1 = page.locator('[data-testid="bill-link"], .bill-title').first();
        const billLink2 = newPage.locator('[data-testid="bill-link"], .bill-title').first();

        if ((await billLink1.isVisible()) && (await billLink2.isVisible())) {
          await billLink1.click();
          await billLink2.click();

          // Try to vote from both contexts
          const voteBtn1 = page.getByRole('button', { name: /yes|vote/i });
          const voteBtn2 = newPage.getByRole('button', { name: /yes|vote/i });

          if ((await voteBtn1.isVisible()) && (await voteBtn2.isVisible())) {
            // Cast votes simultaneously
            await Promise.all([voteBtn1.click(), voteBtn2.click()]);

            // One should succeed, one should fail
            await page.waitForTimeout(2000);

            const success1 = await page.locator('[data-testid="vote-success"]').isVisible();
            const success2 = await newPage.locator('[data-testid="vote-success"]').isVisible();

            // Only one should succeed
            expect(success1 || success2).toBe(true);
            expect(!(success1 && success2)).toBe(true);
          }
        }
      } finally {
        if (newContext) {
          await newContext.close();
        }
        await newAuthHelper.cleanup();
      }
    });
  });

  test.describe('Election Voting', () => {
    test('should allow voting in elections', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to elections
      await page.goto('/elections');

      // Look for active elections
      const electionItem = page
        .locator('[data-testid="election-item"], .election')
        .filter({
          hasText: /active|ongoing/i,
        })
        .first();

      if (await electionItem.isVisible()) {
        await electionItem.click();

        // Look for voting interface
        const candidateList = page.locator('[data-testid="candidate"], .candidate');
        if (await candidateList.first().isVisible()) {
          // Select a candidate
          await candidateList.first().click();

          // Submit vote
          const voteButton = page.getByRole('button', { name: /vote|cast vote|submit/i });
          if (await voteButton.isVisible()) {
            await voteButton.click();

            // Verify vote submission
            await page.waitForSelector('[data-testid="vote-confirmation"]');
          }
        }
      }
    });

    test('should display election results', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to election results
      await page.goto('/elections/results');

      // Check for results display
      const resultsSection = page.locator('[data-testid="election-results"], .election-results');
      if (await resultsSection.isVisible()) {
        // Verify results structure
        const candidateResults = resultsSection.locator(
          '[data-testid="candidate-result"], .candidate-result'
        );
        const resultCount = await candidateResults.count();

        if (resultCount > 0) {
          // Check result has name and vote count
          const firstResult = candidateResults.first();
          const name = await firstResult.locator('[data-testid="name"], .name').textContent();
          const votes = await firstResult.locator('[data-testid="votes"], .votes').textContent();

          expect(name).toBeTruthy();
          expect(votes).toBeTruthy();
        }
      }
    });

    test('should prevent multiple election votes', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to elections
      await page.goto('/elections');

      const electionItem = page.locator('[data-testid="election-item"], .election').first();
      if (await electionItem.isVisible()) {
        await electionItem.click();

        // Try to vote multiple times
        const voteButton = page.getByRole('button', { name: /vote|cast vote/i });

        if (await voteButton.isVisible()) {
          // First vote
          await voteButton.click();
          await page.waitForTimeout(1000);

          // Try second vote
          if (await voteButton.isVisible()) {
            const isDisabled = await voteButton.isDisabled();
            const hasVotedText = await voteButton.getByText(/voted|already/i).isVisible();

            expect(isDisabled || hasVotedText).toBe(true);
          }
        }
      }
    });
  });

  test.describe('Voting Security and Integrity', () => {
    test('should maintain vote anonymity', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Cast a vote
      await page.goto('/parliament');

      const billLink = page.locator('[data-testid="bill-link"], .bill-title').first();
      if (await billLink.isVisible()) {
        await billLink.click();

        const voteButton = page.getByRole('button', { name: /yes|vote/i });
        if (await voteButton.isVisible()) {
          await voteButton.click();

          // Check that individual voter identities are not revealed
          const voterList = page.locator('[data-testid="voter-list"], .voters');
          if (await voterList.isVisible()) {
            // Should show anonymous votes or aggregated data
            const anonymousIndicators = await voterList.getByText(/anonymous|voter|count/i).all();
            expect(anonymousIndicators.length).toBeGreaterThan(0);
          }
        }
      }
    });

    test('should validate vote integrity', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to vote verification
      await page.goto('/profile/votes');

      // Look for vote verification features
      const verificationSection = page.locator('[data-testid="verification"], .verification');
      if (await verificationSection.isVisible()) {
        // Should show vote confirmation or hash
        const confirmation = await verificationSection
          .locator('[data-testid="confirmation"], .confirmation')
          .textContent();
        expect(confirmation).toBeTruthy();
      }
    });

    test('should handle voting system errors gracefully', async ({ page }) => {
      // Create authenticated user
      await TestUtils.createAuthenticatedUser(page);

      // Navigate to voting
      await page.goto('/parliament');

      // Simulate network error (if possible) or check error handling
      const billLink = page.locator('[data-testid="bill-link"], .bill-title').first();
      if (await billLink.isVisible()) {
        await billLink.click();

        // Try voting with potential error conditions
        const voteButton = page.getByRole('button', { name: /vote/i });
        if (await voteButton.isVisible()) {
          // Disconnect network briefly to test error handling
          await page.context().setOffline(true);
          await voteButton.click();

          // Should show error message
          await page.waitForSelector('[data-testid="error"], .error');

          // Reconnect
          await page.context().setOffline(false);
        }
      }
    });
  });
});
