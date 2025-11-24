/**
 * Login Page Object Model
 * Represents the login page and its interactions
 */
import type { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email|e-mail/i);
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.getByRole('button', { name: /(log in|sign in|submit)/i });
    this.errorMessage = page.getByRole('alert');
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto('/');
    const waitForLogin = this.emailInput
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => 'login')
      .catch(() => null);

    const waitForGame = this.page
      .locator('.main-game')
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => 'game')
      .catch(() => null);

    const firstVisible = await Promise.race([waitForLogin, waitForGame]);

    if (!firstVisible) {
      const [loginResult, gameResult] = await Promise.all([waitForLogin, waitForGame]);
      if (!loginResult && !gameResult) {
        throw new Error('Neither login form nor game view became visible');
      }
    }
  }

  /**
   * Perform login with credentials
   */
  async login(email: string, password: string) {
    // Ensure we're in login mode
    const loginToggle = this.page.getByRole('button', { name: /^login$/i });
    await loginToggle.click();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * Wait for successful login (main game loads)
   */
  async waitForSuccess() {
    // Wait for main game content to load
    const waitForGameContent = this.page
      .locator('.main-game')
      .waitFor({ state: 'visible', timeout: 20000 })
      .then(() => true)
      .catch(() => false);

    // Wait for navigation to be present
    const waitForNavigation = this.page
      .locator('.game-header .header-nav')
      .waitFor({ state: 'visible', timeout: 20000 })
      .then(() => true)
      .catch(() => false);

    // Wait for login form to be hidden
    const waitForLoginFormGone = this.page
      .locator('input[type="email"]')
      .waitFor({ state: 'hidden', timeout: 20000 })
      .then(() => true)
      .catch(() => false);

    const results = await Promise.all([
      waitForGameContent,
      waitForNavigation,
      waitForLoginFormGone,
    ]);

    if (!results.some(Boolean)) {
      throw new Error('Login did not complete successfully');
    }
  }

  /**
   * Get error message text
   */
  async getErrorText(): Promise<string> {
    const text = await this.page.getByRole('alert').first().textContent();
    return text || '';
  }
}
