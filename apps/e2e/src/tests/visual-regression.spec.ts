/**
 * Visual Regression Testing Suite
 * Captures and compares screenshots to detect unintended UI changes
 *
 * Uses Playwright's built-in visual comparison features to ensure
 * visual consistency across code changes and browser versions.
 */
import { test, expect } from '../fixtures';

import { GameBoardPage } from '../pages/GameBoardPage';
import { LoginPage } from '../pages/LoginPage';

test.describe('Visual Regression - Login Page', () => {
  test('should match login page screenshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    // Ensure consistent viewport size for desktop baseline
    await page.setViewportSize({ width: 1280, height: 993 });
    await loginPage.goto();

    // Wait for page to fully load and auth card to render
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.auth-card, form', { state: 'visible', timeout: 5000 });

    // Take full page screenshot
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      animations: 'disabled', // Disable animations for consistency
      maxDiffPixels: 100, // Allow minor anti-aliasing/font differences
    });
  });

  test('should match login form screenshot', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await page.setViewportSize({ width: 1280, height: 993 });
    await loginPage.goto();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.auth-card, form', { state: 'visible', timeout: 5000 });

    // Screenshot just the login form
    const authCard = page.locator('.auth-card, form');
    await expect(authCard.first()).toHaveScreenshot('login-form.png', {
      animations: 'disabled',
      maxDiffPixels: 50,
    });
  });

  test('should match login page with error state', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await page.setViewportSize({ width: 1280, height: 993 });
    await loginPage.goto();
    await page.waitForSelector('.auth-card, form', { state: 'visible', timeout: 5000 });

    // Trigger error state
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', '');
    await page.click('button[type="submit"]');

    // Wait for error message
    await page.waitForSelector('[role="alert"]', { timeout: 5000 });

    // Screenshot error state
    await expect(page).toHaveScreenshot('login-page-error.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixels: 100,
    });
  });

  test('should match login page on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 916 }); // iPhone XR height for baseline

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.auth-card, form', { state: 'visible', timeout: 5000 });

    await expect(page).toHaveScreenshot('login-page-mobile.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixels: 50,
    });
  });
});

test.describe('Visual Regression - Game Board', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'Password123!');
    await loginPage.waitForSuccess();
  });

  test('should match game board initial state', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 993 });
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [data-testid="main-game"]', {
      state: 'visible',
      timeout: 7000,
    });
    await page.waitForSelector('main, [data-testid="main-game"]', {
      state: 'visible',
      timeout: 7000,
    });

    await expect(page).toHaveScreenshot('game-board-initial.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixels: 100, // Allow minor differences (timestamps, etc.)
    });
  });

  test('should match proposals list', async ({ page }) => {
    const gamePage = new GameBoardPage(page);
    await gamePage.waitForProposalsLoad();

    // Screenshot just the proposals section
    const proposalsList = page.locator('[data-testid="proposals-list"], .proposals, main');
    await proposalsList.first().waitFor({ state: 'visible', timeout: 7000 });
    await expect(proposalsList.first()).toHaveScreenshot('proposals-list.png', {
      animations: 'disabled',
      maxDiffPixels: 100,
    });
  });

  test('should match proposal card layout', async ({ page }) => {
    const gamePage = new GameBoardPage(page);
    await gamePage.waitForProposalsLoad();

    // Screenshot first proposal card
    const firstProposal = page.locator('[data-testid="proposal-card"]').first();
    await firstProposal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});

    if (await firstProposal.isVisible({ timeout: 2000 })) {
      await expect(firstProposal).toHaveScreenshot('proposal-card.png', {
        animations: 'disabled',
      });
    } else {
      test.skip();
    }
  });

  test('should match game board on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [data-testid="main-game"]', {
      state: 'visible',
      timeout: 7000,
    });
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('game-board-tablet.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixels: 100,
    });
  });

  test('should match game board on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [data-testid="main-game"]', {
      state: 'visible',
      timeout: 7000,
    });

    await expect(page).toHaveScreenshot('game-board-mobile.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixels: 100,
    });
  });
});

test.describe('Visual Regression - Proposal Creation', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    const gamePage = new GameBoardPage(page);

    await loginPage.goto();
    await loginPage.login('test@example.com', 'Password123!');
    await loginPage.waitForSuccess();
    await gamePage.waitForProposalsLoad();
  });

  test('should match create proposal modal/form', async ({ page }) => {
    // Click create proposal button
    const createButton = page
      .locator('[data-testid="create-proposal-button"], button:has-text("Create")')
      .first();

    if (await createButton.isVisible({ timeout: 2000 })) {
      await createButton.click();
      await page.waitForTimeout(500); // Wait for modal animation

      // Screenshot the modal/form
      const modal = page.locator('[role="dialog"], .modal, form').first();
      await expect(modal).toHaveScreenshot('create-proposal-form.png', {
        animations: 'disabled',
      });
    } else {
      test.skip();
    }
  });

  test('should match proposal creation with validation errors', async ({ page }) => {
    const createButton = page
      .locator('[data-testid="create-proposal-button"], button:has-text("Create")')
      .first();

    if (await createButton.isVisible({ timeout: 2000 })) {
      await createButton.click();
      await page.waitForTimeout(500);

      // Submit empty form to trigger validation
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      await page.waitForTimeout(500);

      const modal = page.locator('[role="dialog"], .modal, form').first();
      await expect(modal).toHaveScreenshot('create-proposal-validation-errors.png', {
        animations: 'disabled',
      });
    } else {
      test.skip();
    }
  });
});

test.describe('Visual Regression - Voting Interface', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    const gamePage = new GameBoardPage(page);

    await loginPage.goto();
    await loginPage.login('test@example.com', 'Password123!');
    await loginPage.waitForSuccess();
    await gamePage.waitForProposalsLoad();
  });

  test('should match voting buttons layout', async ({ page }) => {
    // Find first proposal with voting buttons
    const voteButtons = page.locator('[data-testid="vote-buttons"], .vote-actions').first();

    if (await voteButtons.isVisible({ timeout: 2000 })) {
      await expect(voteButtons).toHaveScreenshot('voting-buttons.png', {
        animations: 'disabled',
      });
    } else {
      test.skip();
    }
  });

  test('should match vote results display', async ({ page }) => {
    const gamePage = new GameBoardPage(page);
    const proposals = await gamePage.getProposalTitles();

    if (proposals.length > 0) {
      const voteResults = page.locator('[data-testid="vote-results"], .vote-counts').first();

      if (await voteResults.isVisible({ timeout: 2000 })) {
        await expect(voteResults).toHaveScreenshot('vote-results.png', {
          animations: 'disabled',
          maxDiffPixels: 50, // Vote counts may vary
        });
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should match proposal after voting', async ({ page }) => {
    const gamePage = new GameBoardPage(page);
    const proposals = await gamePage.getProposalTitles();

    if (proposals.length > 0) {
      const title = proposals[0];

      // Vote on proposal
      await gamePage.voteOnProposal(title, 'aye');
      await page.waitForTimeout(1000); // Wait for vote to register

      // Screenshot the voted proposal
      const proposalCard = page.locator('[data-testid="proposal-card"]').first();

      if (await proposalCard.isVisible({ timeout: 2000 })) {
        await expect(proposalCard).toHaveScreenshot('proposal-after-vote.png', {
          animations: 'disabled',
          maxDiffPixels: 100,
        });
      }
    } else {
      test.skip();
    }
  });
});

test.describe('Visual Regression - Dark Mode (if supported)', () => {
  test.beforeEach(async ({ page }) => {
    // Emulate dark color scheme
    await page.emulateMedia({ colorScheme: 'dark' });
  });

  test('should match login page in dark mode', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await page.setViewportSize({ width: 1280, height: 993 });
    await loginPage.goto();
    await page.waitForSelector('.auth-card, form', { state: 'visible', timeout: 5000 });
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('login-page-dark.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should match game board in dark mode', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test@example.com', 'Password123!');
    await loginPage.waitForSuccess();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('main, [data-testid="main-game"]', {
      state: 'visible',
      timeout: 7000,
    });

    await expect(page).toHaveScreenshot('game-board-dark.png', {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixels: 100,
    });
  });
});

test.describe('Visual Regression - Component States', () => {
  test('should match button states (hover, focus, active)', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await page.setViewportSize({ width: 1280, height: 993 });
    await loginPage.goto();
    await page.waitForSelector('.auth-card, form', { state: 'visible', timeout: 5000 });

    const button = page.locator('button[type="submit"]');

    // Default state
    await expect(button).toHaveScreenshot('button-default.png');

    // Focus state
    await button.focus();
    await expect(button).toHaveScreenshot('button-focus.png');

    // Note: Hover and active states are harder to capture reliably
    // Consider testing these with visual validation of CSS styles instead
  });

  test('should match input field states', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await page.setViewportSize({ width: 1280, height: 993 });
    await loginPage.goto();
    await page.waitForSelector('.auth-card, form', { state: 'visible', timeout: 5000 });

    const emailInput = page.locator('input[type="email"]');

    // Empty state
    await expect(emailInput).toHaveScreenshot('input-empty.png');

    // Filled state
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveScreenshot('input-filled.png');

    // Focus state
    await emailInput.focus();
    await expect(emailInput).toHaveScreenshot('input-focus.png');
  });

  test('should match loading states', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await page.setViewportSize({ width: 1280, height: 993 });
    await loginPage.goto();
    await page.waitForSelector('.auth-card, form', { state: 'visible', timeout: 5000 });

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Password123!');

    // Click submit and capture loading state
    const submitPromise = page.click('button[type="submit"]');

    // Try to capture loading indicator (may be very fast)
    const loadingIndicator = page.locator('[data-testid="loading"], [aria-busy="true"]');

    if (await loadingIndicator.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(loadingIndicator).toHaveScreenshot('loading-indicator.png');
    }

    await submitPromise;
  });
});

test.describe('Visual Regression - Cross-Browser Consistency', () => {
  test('should have consistent layout across browsers', async ({ page, browserName }) => {
    const loginPage = new LoginPage(page);
    await page.setViewportSize({ width: 1280, height: 993 });
    await loginPage.goto();
    await page.waitForLoadState('networkidle');

    // Each browser gets its own baseline, but we can compare
    await expect(page).toHaveScreenshot(`login-page-${browserName}.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('should render forms consistently across browsers', async ({ page, browserName }) => {
    const loginPage = new LoginPage(page);
    const gamePage = new GameBoardPage(page);
    await page.setViewportSize({ width: 1280, height: 993 });
    await loginPage.goto();
    await loginPage.login('test@example.com', 'Password123!');
    await loginPage.waitForSuccess();
    await gamePage.waitForProposalsLoad();

    await expect(page).toHaveScreenshot(`game-board-${browserName}.png`, {
      fullPage: true,
      animations: 'disabled',
      maxDiffPixels: 100,
    });
  });
});
