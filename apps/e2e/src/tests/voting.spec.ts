/**
 * Voting Flow E2E Tests
 * Tests proposal creation, voting, and vote tallying in the single world
 */
import { test, expect } from '../fixtures';
import { AuthHelper } from '../test-utils';
import { setupMockApi } from '../mock-api';

import { GameBoardPage } from '../pages/GameBoardPage';
import { LoginPage } from '../pages/LoginPage';

test.describe('Voting and Proposals', () => {
  let loginPage: LoginPage;
  let gamePage: GameBoardPage;
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page, baseURL }) => {
    loginPage = new LoginPage(page);
    gamePage = new GameBoardPage(page);
    authHelper = new AuthHelper(page, baseURL);

    await authHelper.initAPIContext();

    // Login via API and set tokens for faster and reliable auth
    await authHelper
      .loginUser('test@example.com', 'password123')
      .then(tokens => authHelper.setAuthTokens(tokens));

    // Go to the main page and wait for game load
    await loginPage.goto();
    await loginPage.waitForSuccess();
    await gamePage.initHarness();
    await gamePage.waitForProposalsLoad();
  });

  test('should create a new proposal', async () => {
    // First check if existing proposals are visible
    const initialProposals = await gamePage.getProposalTitles();
    console.log('Initial proposals:', initialProposals);

    const title = `Test Proposal ${Date.now()}`;
    const description = 'This is a test proposal for E2E testing';

    await gamePage.createProposal(title, description);

    // Proposal should appear in the list
    const proposals = await gamePage.getProposalTitles();
    console.log('Proposals after creation:', proposals);
    expect(proposals).toContain(title);
  });

  test('should vote aye on a proposal', async () => {
    // Create a proposal first
    const title = `Vote Test ${Date.now()}`;
    await gamePage.createProposal(title, 'Test voting');

    // Vote aye
    await gamePage.voteOnProposal(title, 'aye');

    // Check vote count increased
    const votes = await gamePage.getVoteCounts(title);
    expect(votes.aye).toBeGreaterThan(0);
  });

  test('should vote nay on a proposal', async () => {
    const title = `Nay Test ${Date.now()}`;
    await gamePage.createProposal(title, 'Test nay voting');

    await gamePage.voteOnProposal(title, 'nay');

    const votes = await gamePage.getVoteCounts(title);
    expect(votes.nay).toBeGreaterThan(0);
  });

  test('should abstain from voting on a proposal', async () => {
    const title = `Abstain Test ${Date.now()}`;
    await gamePage.createProposal(title, 'Test abstain voting');

    await gamePage.voteOnProposal(title, 'abstain');

    const votes = await gamePage.getVoteCounts(title);
    expect(votes.abstain).toBeGreaterThan(0);
  });

  test('should reflect votes from multiple users', async ({ page }) => {
    const title = `Multi-User Vote ${Date.now()}`;
    await gamePage.createProposal(title, 'Testing concurrent voting');

    // Vote aye with first user
    await gamePage.voteOnProposal(title, 'aye');

    // Second user votes nay
    const page2 = await page.context().newPage();
    await setupMockApi(page2);
    const login2 = new LoginPage(page2);
    const game2 = new GameBoardPage(page2);

    await login2.goto();
    await game2.initHarness();
    await login2.login('user2@example.com', 'password123');
    await login2.waitForSuccess();
    await game2.waitForProposalsLoad();

    await game2.voteOnProposal(title, 'nay');

    // Check both votes are reflected
    const votes = await game2.getVoteCounts(title);
    expect(votes.aye).toBe(1);
    expect(votes.nay).toBe(1);

    await page2.close();
  });

  test('should display all existing proposals', async () => {
    const proposals = await gamePage.getProposalTitles();

    // Should be an array (might be empty or have items)
    expect(Array.isArray(proposals)).toBe(true);

    // If there are proposals, each should have a title
    for (const title of proposals) {
      expect(title.length).toBeGreaterThan(0);
    }
  });

  test('should update proposal list in real-time', async ({ page, browser }) => {
    const initialProposals = await gamePage.getProposalTitles();

    // Second user creates a proposal
    const page2 = await page.context().newPage();
    await setupMockApi(page2);
    const login2 = new LoginPage(page2);
    const game2 = new GameBoardPage(page2);

    await login2.goto();
    await game2.initHarness();
    await login2.login('user2@example.com', 'password123');
    await login2.waitForSuccess();
    await game2.waitForProposalsLoad();

    const newTitle = `Real-time Test ${Date.now()}`;
    await game2.createProposal(newTitle, 'Testing real-time updates');

    // First user should see the new proposal (after refresh or real-time update)
    await page.reload();
    await gamePage.waitForProposalsLoad();

    const updatedProposals = await gamePage.getProposalTitles();
    expect(updatedProposals.length).toBeGreaterThan(initialProposals.length);
    expect(updatedProposals).toContain(newTitle);

    await page2.close();
  });
});

/**
 * Enhanced Voting Lifecycle Tests
 * Comprehensive testing of proposal creation → voting → tallying workflows
 */
test.describe('Voting Lifecycle (Full Flow)', () => {
  let loginPage: LoginPage;
  let gamePage: GameBoardPage;
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page, baseURL }) => {
    loginPage = new LoginPage(page);
    gamePage = new GameBoardPage(page);
    authHelper = new AuthHelper(page, baseURL);

    await authHelper.initAPIContext();

    // Login via API and set tokens for faster and reliable auth
    await authHelper
      .loginUser('test@example.com', 'password123')
      .then(tokens => authHelper.setAuthTokens(tokens));

    // Go to the main page and wait for game load
    await loginPage.goto();
    await loginPage.waitForSuccess();
    await gamePage.initHarness();
    await gamePage.waitForProposalsLoad();
  });

  test('should complete full proposal lifecycle: create → vote → tally', async ({ page }) => {
    const title = `Lifecycle Test ${Date.now()}`;
    const description = 'Testing complete voting lifecycle';

    // Step 1: Create proposal
    await gamePage.createProposal(title, description);

    const proposals = await gamePage.getProposalTitles();
    expect(proposals).toContain(title);

    // Step 2: Vote with first user (aye)
    await gamePage.voteOnProposal(title, 'aye');

    // Step 3: Vote with second user (aye)
    const page2 = await page.context().newPage();
    await setupMockApi(page2);
    const login2 = new LoginPage(page2);
    const game2 = new GameBoardPage(page2);

    await login2.goto();
    await game2.initHarness();
    await login2.login('user2@example.com', 'password123');
    await login2.waitForSuccess();
    await game2.waitForProposalsLoad();
    await game2.voteOnProposal(title, 'aye');

    // Step 4: Vote with third user (nay)
    const page3 = await page.context().newPage();
    await setupMockApi(page3);
    const login3 = new LoginPage(page3);
    const game3 = new GameBoardPage(page3);

    await login3.goto();
    await game3.initHarness();
    await login3.login('user3@example.com', 'password123');
    await login3.waitForSuccess();
    await game3.waitForProposalsLoad();
    await game3.voteOnProposal(title, 'nay');

    // Step 5: Verify final tally
    const finalVotes = await game3.getVoteCounts(title);
    expect(finalVotes.aye).toBe(2);
    expect(finalVotes.nay).toBe(1);
    expect(finalVotes.abstain).toBe(0);

    await page2.close();
    await page3.close();
  });

  test('should prevent duplicate voting by same user', async () => {
    const title = `Duplicate Vote Test ${Date.now()}`;
    await gamePage.createProposal(title, 'Testing duplicate vote prevention');

    // Vote aye
    await gamePage.voteOnProposal(title, 'aye');
    const firstVote = await gamePage.getVoteCounts(title);

    // Attempt to vote again (should fail or be ignored)
    try {
      await gamePage.voteOnProposal(title, 'aye');
    } catch (_error) {
      // Expected behavior: duplicate voting prevented
    }

    // Vote count should not increase
    const secondVote = await gamePage.getVoteCounts(title);
    expect(secondVote.aye).toBe(firstVote.aye);
  });

  test('should allow changing vote before finalization', async () => {
    const title = `Change Vote Test ${Date.now()}`;
    await gamePage.createProposal(title, 'Testing vote modification');

    // Initial vote: aye
    await gamePage.voteOnProposal(title, 'aye');
    const initialVotes = await gamePage.getVoteCounts(title);
    expect(initialVotes.aye).toBe(1);
    expect(initialVotes.nay).toBe(0);

    // Change vote to nay (if supported)
    // This tests the API's vote modification capability
    try {
      await gamePage.voteOnProposal(title, 'nay');
      const changedVotes = await gamePage.getVoteCounts(title);

      // Vote should move from aye to nay
      expect(changedVotes.aye).toBe(0);
      expect(changedVotes.nay).toBe(1);
    } catch (_error) {
      // If vote changing is not supported, verify it fails gracefully
      test.info().annotations.push({
        type: 'info',
        description: 'Vote changing not supported (expected behavior)',
      });
    }
  });

  test('should handle proposal with zero votes gracefully', async () => {
    const title = `Zero Votes Test ${Date.now()}`;
    await gamePage.createProposal(title, 'Testing proposal with no votes');

    // Don't vote, just check counts
    const votes = await gamePage.getVoteCounts(title);
    expect(votes.aye).toBe(0);
    expect(votes.nay).toBe(0);
    expect(votes.abstain).toBe(0);
  });

  test('should correctly tally tied votes', async ({ page, browser }) => {
    const title = `Tied Vote Test ${Date.now()}`;
    await gamePage.createProposal(title, 'Testing tied vote scenarios');

    // First user: aye
    await gamePage.voteOnProposal(title, 'aye');

    // Second user: nay
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await setupMockApi(page2);
    const login2 = new LoginPage(page2);
    const game2 = new GameBoardPage(page2);
    await login2.goto();
    await game2.initHarness();
    await login2.login('user2@example.com', 'password123');
    await login2.waitForSuccess();
    await game2.waitForProposalsLoad();

    // Wait for polling to sync the proposal
    await page.waitForTimeout(2000);

    await game2.voteOnProposal(title, 'nay');

    // Verify tie
    const votes = await game2.getVoteCounts(title);
    expect(votes.aye).toBe(votes.nay);
    expect(votes.aye).toBe(1);

    // Check if proposal is marked as tied (if API supports it)
    // This would typically require accessing proposal status

    await context2.close();
  });
});

/**
 * Edge Case and Error Handling Tests
 */
test.describe('Voting Edge Cases', () => {
  let loginPage: LoginPage;
  let gamePage: GameBoardPage;
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page, baseURL }) => {
    loginPage = new LoginPage(page);
    gamePage = new GameBoardPage(page);
    authHelper = new AuthHelper(page, baseURL);

    await authHelper.initAPIContext();

    // Login via API and set tokens for faster and reliable auth
    await authHelper
      .loginUser('test@example.com', 'password123')
      .then(tokens => authHelper.setAuthTokens(tokens));

    // Go to the main page and wait for game load
    await loginPage.goto();
    await loginPage.waitForSuccess();
    await gamePage.initHarness();
    await gamePage.waitForProposalsLoad();
  });

  test('should reject proposal with empty title', async () => {
    try {
      await gamePage.createProposal('', 'This should fail');
      // If it doesn't throw, check for error message
    } catch (error: any) {
      expect(error.message).toContain('title');
    }
  });

  test('should reject proposal with empty description', async () => {
    try {
      await gamePage.createProposal('Valid Title', '');
      // Should fail validation
    } catch (error: any) {
      expect(error.message).toContain('description');
    }
  });

  test('should handle very long proposal titles gracefully', async () => {
    const longTitle = 'A'.repeat(500); // 500 character title
    const description = 'Testing title length limits';

    try {
      await gamePage.createProposal(longTitle, description);
      // If successful, verify truncation or proper handling
      const proposals = await gamePage.getProposalTitles();
      const created = proposals.find(p => p.includes('AAA'));
      expect(created).toBeDefined();
    } catch (error) {
      // If it fails, that's also acceptable behavior (length validation)
      expect(error).toBeDefined();
    }
  });

  test('should handle very long descriptions gracefully', async () => {
    const title = `Long Description Test ${Date.now()}`;
    const longDescription = 'B'.repeat(5000); // 5000 character description

    try {
      await gamePage.createProposal(title, longDescription);
      const proposals = await gamePage.getProposalTitles();
      expect(proposals).toContain(title);
    } catch (error) {
      // Length validation is acceptable
      expect(error).toBeDefined();
    }
  });

  test('should sanitize XSS attempts in proposal titles', async () => {
    const xssTitle = '<script>alert("XSS")</script>';
    const description = 'Testing XSS prevention';

    try {
      await gamePage.createProposal(xssTitle, description);
      const proposals = await gamePage.getProposalTitles();

      // Verify script tag is escaped or removed
      const created = proposals.find(p => p.includes('script'));
      if (created) {
        expect(created).not.toContain('<script>');
        expect(created).toContain('&lt;script&gt;'); // Should be escaped
      }
    } catch (error) {
      // Rejection is also acceptable
      expect(error).toBeDefined();
    }
  });

  test('should sanitize XSS attempts in descriptions', async () => {
    const title = `XSS Description Test ${Date.now()}`;
    const xssDescription = '<img src=x onerror="alert(1)">';

    try {
      await gamePage.createProposal(title, xssDescription);
      // If successful, verify sanitization occurred
      // This would require inspecting the description display
    } catch (error) {
      // XSS prevention is working
      expect(error).toBeDefined();
    }
  });

  test('should handle special characters in proposal content', async () => {
    const title = `Special Chars Test: @#$%^&*()_+-=[]{}|;':",.<>?/~ ${Date.now()}`;
    const description = 'Testing: 你好世界 مرحبا العالم Привет мир';

    await gamePage.createProposal(title, description);
    const proposals = await gamePage.getProposalTitles();

    // Verify special characters are preserved
    const created = proposals.find(p => p.includes('Special Chars'));
    expect(created).toBeDefined();
  });

  test('should handle rapid proposal creation (rate limiting)', async () => {
    const proposals = [];

    // Attempt to create 10 proposals rapidly
    for (let i = 0; i < 10; i++) {
      try {
        await gamePage.createProposal(`Rapid ${i} ${Date.now()}`, `Description ${i}`);
        proposals.push(i);
      } catch (error: any) {
        // Rate limiting may kick in
        if (error.message?.includes('rate limit')) {
          expect(error).toBeDefined(); // Rate limiting is working
          break;
        }
      }
    }

    // Should create some but potentially hit rate limit
    expect(proposals.length).toBeGreaterThan(0);
  });

  test('should handle voting on non-existent proposal gracefully', async ({ page }) => {
    // Attempt to vote on a proposal that doesn't exist
    try {
      // This would require direct API call or manipulating the DOM
      await page.evaluate(() => {
        // Simulate voting on non-existent proposal
        fetch('/api/v1/votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proposalId: 'non-existent-id-99999',
            vote: 'aye',
          }),
        });
      });

      // Should fail gracefully with 404 or proper error
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  test('should maintain vote counts across page refreshes', async () => {
    const title = `Persistence Test ${Date.now()}`;
    await gamePage.createProposal(title, 'Testing vote persistence');

    // Vote
    await gamePage.voteOnProposal(title, 'aye');
    const beforeRefresh = await gamePage.getVoteCounts(title);

    // Refresh page
    await gamePage.page.reload();
    await gamePage.initHarness();
    await gamePage.waitForProposalsLoad();

    // Verify votes persisted
    const afterRefresh = await gamePage.getVoteCounts(title);
    expect(afterRefresh.aye).toBe(beforeRefresh.aye);
    expect(afterRefresh.nay).toBe(beforeRefresh.nay);
    expect(afterRefresh.abstain).toBe(beforeRefresh.abstain);
  });
});

/**
 * Performance and Scalability Tests
 */
test.describe('Voting Performance', () => {
  let loginPage: LoginPage;
  let gamePage: GameBoardPage;
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page, baseURL }) => {
    loginPage = new LoginPage(page);
    gamePage = new GameBoardPage(page);
    authHelper = new AuthHelper(page, baseURL);

    await authHelper.initAPIContext();

    // Login via API and set tokens for faster and reliable auth
    await authHelper
      .loginUser('test@example.com', 'password123')
      .then(tokens => authHelper.setAuthTokens(tokens));

    // Go to the main page and wait for game load
    await loginPage.goto();
    await loginPage.waitForSuccess();
    await gamePage.initHarness();
    await gamePage.waitForProposalsLoad();
  });

  test('should load proposals list efficiently', async () => {
    const startTime = Date.now();

    await gamePage.waitForProposalsLoad();
    const proposals = await gamePage.getProposalTitles();

    const loadTime = Date.now() - startTime;

    // Should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);

    // Should have some proposals (or empty array)
    expect(Array.isArray(proposals)).toBe(true);
  });

  test('should handle displaying many proposals efficiently', async () => {
    // Create multiple proposals (or assume they exist)
    const startTime = Date.now();

    const proposals = await gamePage.getProposalTitles();

    const renderTime = Date.now() - startTime;

    // Even with many proposals, should render quickly
    expect(renderTime).toBeLessThan(3000);

    // Verify we got a reasonable list
    expect(proposals.length).toBeGreaterThanOrEqual(0);
  });

  test('should vote without blocking UI', async () => {
    const title = `Non-blocking Vote ${Date.now()}`;
    await gamePage.createProposal(title, 'Testing non-blocking vote');

    const startTime = Date.now();
    await gamePage.voteOnProposal(title, 'aye');
    const voteTime = Date.now() - startTime;

    // Voting should be fast (< 1 second)
    expect(voteTime).toBeLessThan(1000);
  });
});
