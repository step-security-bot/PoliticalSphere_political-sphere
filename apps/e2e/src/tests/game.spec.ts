/**
 * Single World Political Simulation E2E Tests
 * Tests interaction with the single shared game world
 *
 * NOTE: Political Sphere has ONE world/game that all players participate in.
 * This is not a multi-game platform - everyone is in the same political simulation.
 */
import { test, expect } from '../fixtures';
import { GameBoardPage } from '../pages/GameBoardPage';
import { LoginPage } from '../pages/LoginPage';
import { setupMockApi } from '../mock-api';
import { AuthHelper } from '../test-utils';

test.describe('Single World Gameplay', () => {
  test.describe.configure({ timeout: 60000 });
  let loginPage: LoginPage;
  let gamePage: GameBoardPage;
  let authHelper: AuthHelper;

  test.beforeEach(async ({ page, baseURL }) => {
    loginPage = new LoginPage(page);
    gamePage = new GameBoardPage(page);
    authHelper = new AuthHelper(page, baseURL);

    await authHelper.initAPIContext();

    // Login via API and set tokens for faster and more reliable auth
    await authHelper
      .loginUser('test@example.com', 'password123')
      .then(tokens => authHelper.setAuthTokens(tokens));

    // Go to main page and wait for game load
    await loginPage.goto();
    await loginPage.waitForSuccess();
    await gamePage.initHarness();
    await gamePage.waitForProposalsLoad();
  });

  test('should enter the game world after login', async ({ page }) => {
    // After login, should be redirected to the game world
    await expect(page).toHaveURL(/\/(game)?\/?$/);
    await gamePage.waitForProposalsLoad();
    await expect(gamePage.proposalsList).toBeVisible();
  });

  test('should display existing proposals in the world', async () => {
    await gamePage.waitForProposalsLoad();
    const proposals = await gamePage.getProposalTitles();

    // World may or may not have proposals, but list should be accessible
    expect(Array.isArray(proposals)).toBe(true);
  });

  test('should handle multiple concurrent players', async ({ browser, baseURL }) => {
    // Player 2 joins the same world in new context
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await setupMockApi(page2);
    const login2 = new LoginPage(page2);
    const game2 = new GameBoardPage(page2);
    const auth2 = new AuthHelper(page2, baseURL || 'http://localhost:3001');

    await auth2.initAPIContext();
    await auth2.loginUser('user2@example.com', 'password123').then(tokens =>
      auth2.setAuthTokens(tokens, {
        user: { id: 'user-2', username: 'user2', email: 'user2@example.com' },
      })
    );

    await login2.goto();
    await login2.waitForSuccess();
    await game2.initHarness();

    // Both players should be in the same game world
    await expect(page2).toHaveURL(/\/(game)?\/?$/);
    await game2.waitForProposalsLoad();

    // Both see the same proposals (shared world state)
    const proposals1 = await gamePage.getProposalTitles();
    const proposals2 = await game2.getProposalTitles();

    expect(proposals1).toEqual(proposals2);

    await context2.close();
  });
});
