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
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.getByRole('button', { name: /log in|sign in/i });
    this.errorMessage = page.getByRole('alert');
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto('/');
  }

  /**
   * Perform login with credentials
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * Wait for successful login (redirects to the single game world)
   */
  async waitForSuccess() {
    await this.page.waitForURL(/\/game/);
  }

  /**
   * Get error message text
   */
  async getErrorText(): Promise<string> {
    const text = await this.errorMessage.textContent();
    return text || '';
  }
}
