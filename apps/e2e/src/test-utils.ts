/**
 * E2E Test Utilities for Political Sphere
 *
 * Provides common utilities, helpers, and setup functions for Playwright tests
 */

import { Page, BrowserContext, APIRequestContext, request } from '@playwright/test';
import { TestDatabase, TestDataSeeder, TestScenarios } from '../fixtures/test-data.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TestUser {
  id: string;
  username: string;
  email: string;
  password: string;
  tokens?: AuthTokens;
}

/**
 * Authentication Helper
 * Handles user registration, login, and token management
 */
export class AuthHelper {
  private page: Page;
  private apiContext!: APIRequestContext;
  private baseURL: string;

  constructor(page: Page, baseURL: string = 'http://localhost:4000') {
    this.page = page;
    this.baseURL = baseURL;
  }

  /**
   * Initialize API context for backend calls
   */
  async initAPIContext(): Promise<void> {
    this.apiContext = await request.newContext({
      baseURL: this.baseURL,
    });
  }

  /**
   * Register a new user via API
   */
  async registerUser(userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<TestUser> {
    const response = await this.apiContext.post('/auth/register', {
      data: userData,
    });

    if (!response.ok()) {
      throw new Error(`Registration failed: ${response.status()} ${response.statusText()}`);
    }

    const data = await response.json();
    return {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      password: userData.password,
      tokens: {
        accessToken: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
      },
    };
  }

  /**
   * Login user via API
   */
  async loginUser(email: string, password: string): Promise<AuthTokens> {
    const response = await this.apiContext.post('/auth/login', {
      data: { email, password },
    });

    if (!response.ok()) {
      throw new Error(`Login failed: ${response.status()} ${response.statusText()}`);
    }

    const data = await response.json();
    return {
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
    };
  }

  /**
   * Set authentication tokens in localStorage
   */
  async setAuthTokens(tokens: AuthTokens): Promise<void> {
    await this.page.evaluate(tokens => {
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
    }, tokens);
  }

  /**
   * Clear authentication tokens
   */
  async clearAuthTokens(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    });
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    return await this.page.evaluate(() => {
      const token = localStorage.getItem('accessToken');
      return !!token;
    });
  }

  /**
   * Get current user from localStorage
   */
  async getCurrentUser(): Promise<any> {
    return await this.page.evaluate(() => {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    });
  }

  /**
   * Complete registration flow via UI
   */
  async registerViaUI(userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<void> {
    // Navigate to registration page
    await this.page.goto('/');

    // Look for register button/link
    const registerButton = this.page
      .getByRole('button', { name: /register|sign up|create account/i })
      .first();
    if (await registerButton.isVisible()) {
      await registerButton.click();
    }

    // Fill registration form
    await this.page.fill('input[name="username"]', userData.username);
    await this.page.fill('input[name="email"]', userData.email);
    await this.page.fill('input[type="password"][name="password"]', userData.password);
    await this.page.fill('input[name="confirmPassword"]', userData.password);

    // Accept terms if present
    const termsCheckbox = this.page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Submit form
    await this.page.getByRole('button', { name: /sign up|create account|register/i }).click();

    // Wait for success or redirect
    await this.page.waitForTimeout(2000);
  }

  /**
   * Complete login flow via UI
   */
  async loginViaUI(email: string, password: string): Promise<void> {
    // Navigate to login page
    await this.page.goto('/');

    // Look for login button/link if needed
    const loginButton = this.page.getByRole('button', { name: /login|sign in/i }).first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
    }

    // Fill login form
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[type="password"][name="password"]', password);

    // Submit form
    await this.page.getByRole('button', { name: /sign in|login/i }).click();

    // Wait for success
    await this.page.waitForTimeout(2000);
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    // Try to find logout button
    const logoutButton = this.page.getByRole('button', { name: /logout|sign out/i });
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else {
      // Fallback: clear tokens directly
      await this.clearAuthTokens();
      await this.page.reload();
    }
  }

  /**
   * Get API context
   */
  getAPIContext(): APIRequestContext {
    if (!this.apiContext) {
      throw new Error('API context not initialized. Call initAPIContext() first.');
    }
    return this.apiContext;
  }

  /**
   * Cleanup API context
   */
  async cleanup(): Promise<void> {
    if (this.apiContext) {
      await this.apiContext.dispose();
    }
  }
}

/**
 * Database Helper for E2E Tests
 * Manages test data seeding and cleanup
 */
export class DatabaseHelper {
  private db: TestDatabase;
  private seederInstance: TestDataSeeder;
  private scenariosInstance: TestScenarios;

  constructor() {
    this.db = new TestDatabase();
    this.seederInstance = new TestDataSeeder(this.db);
    this.scenariosInstance = new TestScenarios(this.seederInstance);
  }

  /**
   * Setup database for tests
   */
  async setup(): Promise<void> {
    await this.db.setup();
  }

  /**
   * Cleanup database after tests
   */
  async cleanup(): Promise<void> {
    await this.seederInstance.cleanup();
    await this.db.teardown();
  }

  /**
   * Get test scenarios
   */
  getScenarios(): TestScenarios {
    return this.scenariosInstance;
  }

  /**
   * Get seeder instance
   */
  getSeeder(): TestDataSeeder {
    return this.seederInstance;
  }
}

/**
 * Page Object Base Class
 * Provides common functionality for all page objects
 */
export abstract class BasePage {
  protected page: Page;
  protected baseURL: string;

  constructor(page: Page, baseURL: string = 'http://localhost:3001') {
    this.page = page;
    this.baseURL = baseURL;
  }

  /**
   * Navigate to page
   */
  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(`${this.baseURL}${path}`);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for page to be ready
   */
  async waitForReady(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible();
  }

  /**
   * Wait for element to be visible
   */
  async waitForVisible(selector: string, timeout: number = 10000): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Click element
   */
  async click(selector: string): Promise<void> {
    await this.page.locator(selector).click();
  }

  /**
   * Fill input field
   */
  async fill(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).fill(value);
  }

  /**
   * Get text content
   */
  async getText(selector: string): Promise<string> {
    return (await this.page.locator(selector).textContent()) || '';
  }

  /**
   * Take screenshot for debugging
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png` });
  }
}

/**
 * WebSocket Helper for real-time features
 */
export class WebSocketHelper {
  private page: Page;
  private connections: Map<string, any> = new Map();

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Monitor WebSocket connections
   */
  async monitorWebSocket(url: string): Promise<void> {
    // Implementation would monitor WS connections
    // This is a placeholder for actual WebSocket monitoring
  }

  /**
   * Wait for WebSocket message
   */
  async waitForWSMessage(type: string, timeout: number = 10000): Promise<any> {
    // Implementation would wait for specific WS messages
    return new Promise(resolve => {
      setTimeout(() => resolve({}), timeout);
    });
  }

  /**
   * Check WebSocket connection status
   */
  async isWSConnected(url: string): Promise<boolean> {
    // Implementation would check WS connection status
    return true; // Placeholder
  }
}

/**
 * Performance Helper
 * Measures and monitors performance metrics
 */
export class PerformanceHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Measure page load time
   */
  async measurePageLoad(): Promise<number> {
    const startTime = Date.now();
    await this.page.waitForLoadState('domcontentloaded');
    return Date.now() - startTime;
  }

  /**
   * Get performance metrics
   */
  async getMetrics(): Promise<any> {
    return await this.page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        loadComplete: perf.loadEventEnd - perf.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint:
          performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });
  }

  /**
   * Monitor network requests
   */
  async monitorNetwork(): Promise<void> {
    this.page.on('request', request => {
      console.log(`Request: ${request.method()} ${request.url()}`);
    });

    this.page.on('response', response => {
      console.log(`Response: ${response.status()} ${response.url()}`);
    });
  }
}

/**
 * Global test utilities
 */
export const TestUtils = {
  /**
   * Create authenticated user for tests
   */
  async createAuthenticatedUser(
    page: Page,
    userData?: { username?: string; email?: string; password?: string },
  ): Promise<TestUser> {
    const authHelper = new AuthHelper(page);
    await authHelper.initAPIContext();

    const defaultUser = {
      username: `testuser_${Date.now()}`,
      email: `testuser_${Date.now()}@example.com`,
      password: 'SecurePass123!',
      ...userData,
    };

    try {
      const user = await authHelper.registerUser(defaultUser);
      await authHelper.setAuthTokens(user.tokens!);
      return user;
    } finally {
      await authHelper.cleanup();
    }
  },

  /**
   * Setup test environment
   */
  async setupTestEnvironment(): Promise<{ db: DatabaseHelper; auth: AuthHelper }> {
    const db = new DatabaseHelper();
    await db.setup();

    // Note: Auth helper needs a page context, so it's created per test
    return { db, auth: null as any };
  },

  /**
   * Cleanup test environment
   */
  async cleanupTestEnvironment(db: DatabaseHelper): Promise<void> {
    await db.cleanup();
  },

  /**
   * Wait for application to be ready
   */
  async waitForAppReady(page: Page, timeout: number = 30000): Promise<void> {
    await page.waitForFunction(
      () => {
        // Check if main app element is present
        return (
          document.querySelector('[data-testid="app"]') ||
          document.querySelector('main') ||
          document.readyState === 'complete'
        );
      },
      { timeout },
    );
  },
};
