import assert from 'node:assert';
import crypto from 'node:crypto';

import express from 'express';
import { afterEach, beforeAll, beforeEach, describe, it } from 'vitest';

import { dispatchRequest } from '../../tests/utils/express-request.js';
import { closeDatabase, getDatabase } from '../modules/stores/index.ts';
import authRoutes from './auth.js';

describe('Auth Routes - Input Validation', () => {
  let app;

  beforeAll(() => {
    // Ensure JWT secrets are set for auth module initialization
    process.env.JWT_SECRET = crypto.randomBytes(64).toString('hex');
    process.env.JWT_REFRESH_SECRET = crypto.randomBytes(64).toString('hex');
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  });

  beforeEach(() => {
    getDatabase();
    app = express();
    app.use(express.json());
    app.use('/auth', authRoutes);
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('POST /auth/register - Zod Validation', () => {
    describe('Valid Registration', () => {
      it('should accept valid registration data', async () => {
        const timestamp = Date.now();
        const response = await dispatchRequest(app, {
          method: 'POST',
          url: '/auth/register',
          body: {
            username: `validuser${timestamp}`,
            email: `test-${timestamp}@example.com`,
            password: 'SecurePass123',
          },
        });

        assert.strictEqual(response.status, 201);
        assert.strictEqual(response.body.success, true, `Expected success=true but got: ${JSON.stringify(response.body)}`);
        assert(response.body.data.id);
        assert(response.body.data.token);
        assert(response.body.data.refreshToken);
      });
    });

    describe('Username Validation', () => {
      it('should reject username shorter than 3 characters', async () => {
        const response = await dispatchRequest(app, {
          method: 'POST',
          url: '/auth/register',
          body: {
            username: 'ab',
            email: 'test@example.com',
            password: 'SecurePass123',
          },
        });

        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.body.success, false);
        assert(response.body.details);
        const usernameError = response.body.details.find((e) => e.field === 'username');
        assert(usernameError);
        assert(usernameError.message.includes('at least 3 characters'));
      });

      it('should reject username longer than 50 characters', async () => {
        const response = await dispatchRequest(app, {
          method: 'POST',
          url: '/auth/register',
          body: {
            username: 'a'.repeat(51),
            email: 'test@example.com',
            password: 'SecurePass123',
          },
        });

        assert.strictEqual(response.status, 400);
        assert.strictEqual(response.body.success, false);
        const usernameError = response.body.details.find((e) => e.field === 'username');
        assert(usernameError.message.includes('not exceed 50 characters'));
      });

      it('should reject username with invalid characters', async () => {
        const invalidUsernames = [
          'user name',  // space
          'user@name',  // @
          'user.name',  // period
          'user#name',  // hash
          'user$name',  // dollar
        ];

        for (const username of invalidUsernames) {
          const response = await dispatchRequest(app, {
            method: 'POST',
            url: '/auth/register',
            body: {
              username,
              email: 'test@example.com',
              password: 'SecurePass123',
            },
          });

          assert.strictEqual(response.status, 400, `Should reject username: ${username}`);
          const usernameError = response.body.details.find((e) => e.field === 'username');
          assert(usernameError.message.includes('only contain'));
        }
      });

      it('should accept valid username characters (letters, numbers, underscore, hyphen)', async () => {
        const validUsernames = [
          'user_name',
          'user-name',
          'user123',
          'User_Name-123',
        ];

        for (const username of validUsernames) {
          const timestamp = Date.now();
          const response = await dispatchRequest(app, {
            method: 'POST',
            url: '/auth/register',
            body: {
              username: `${username}${timestamp}`,
              email: `test-${timestamp}@example.com`,
              password: 'SecurePass123',
            },
          });

          assert.strictEqual(response.status, 201, `Should accept username: ${username}`);
        }
      });
    });

    describe('Email Validation', () => {
      it('should reject invalid email format', async () => {
        const invalidEmails = [
          'not-an-email',
          'missing@domain',
          '@no-local.com',
          'no-at-symbol.com',
          'double@@at.com',
        ];

        for (const email of invalidEmails) {
          const timestamp = Date.now();
          const response = await dispatchRequest(app, {
            method: 'POST',
            url: '/auth/register',
            body: {
              username: `user${timestamp}`,
              email,
              password: 'SecurePass123',
            },
          });

          assert.strictEqual(response.status, 400, `Should reject email: ${email}`);
          const emailError = response.body.details.find((e) => e.field === 'email');
          assert(emailError);
          assert(emailError.message.includes('Invalid email'));
        }
      });

      it('should reject email longer than 255 characters', async () => {
        const longEmail = 'a'.repeat(250) + '@test.com';
        const response = await dispatchRequest(app, {
          method: 'POST',
          url: '/auth/register',
          body: {
            username: 'testuser',
            email: longEmail,
            password: 'SecurePass123',
          },
        });

        assert.strictEqual(response.status, 400);
        const emailError = response.body.details.find((e) => e.field === 'email');
        assert(emailError.message.includes('not exceed 255 characters'));
      });
    });

    describe('Password Validation', () => {
      it('should reject password shorter than 8 characters', async () => {
        const response = await dispatchRequest(app, {
          method: 'POST',
          url: '/auth/register',
          body: {
            username: 'testuser',
            email: 'test@example.com',
            password: 'Pass1',
          },
        });

        assert.strictEqual(response.status, 400);
        const passwordError = response.body.details.find((e) => e.field === 'password');
        assert(passwordError.message.includes('at least 8 characters'));
      });

      it('should reject password longer than 128 characters', async () => {
        const response = await dispatchRequest(app, {
          method: 'POST',
          url: '/auth/register',
          body: {
            username: 'testuser',
            email: 'test@example.com',
            password: 'A1' + 'a'.repeat(127),
          },
        });

        assert.strictEqual(response.status, 400);
        const passwordError = response.body.details.find((e) => e.field === 'password');
        assert(passwordError.message.includes('not exceed 128 characters'));
      });

      it('should reject password without uppercase letter', async () => {
        const response = await dispatchRequest(app, {
          method: 'POST',
          url: '/auth/register',
          body: {
            username: 'testuser',
            email: 'test@example.com',
            password: 'securepass123',
          },
        });

        assert.strictEqual(response.status, 400);
        const passwordError = response.body.details.find((e) => e.field === 'password');
        assert(passwordError.message.includes('uppercase letter'));
      });

      it('should reject password without lowercase letter', async () => {
        const response = await dispatchRequest(app, {
          method: 'POST',
          url: '/auth/register',
          body: {
            username: 'testuser',
            email: 'test@example.com',
            password: 'SECUREPASS123',
          },
        });

        assert.strictEqual(response.status, 400);
        const passwordError = response.body.details.find((e) => e.field === 'password');
        assert(passwordError.message.includes('lowercase letter'));
      });

      it('should reject password without number', async () => {
        const response = await dispatchRequest(app, {
          method: 'POST',
          url: '/auth/register',
          body: {
            username: 'testuser',
            email: 'test@example.com',
            password: 'SecurePassword',
          },
        });

        assert.strictEqual(response.status, 400);
        const passwordError = response.body.details.find((e) => e.field === 'password');
        assert(passwordError.message.includes('number'));
      });
    });

    describe('Missing Fields', () => {
      it('should reject missing username', async () => {
        const response = await dispatchRequest(app, {
          method: 'POST',
          url: '/auth/register',
          body: {
            email: 'test@example.com',
            password: 'SecurePass123',
          },
        });

        assert.strictEqual(response.status, 400);
        assert(response.body.details);
      });

      it('should reject missing email', async () => {
        const response = await dispatchRequest(app, {
          method: 'POST',
          url: '/auth/register',
          body: {
            username: 'testuser',
            password: 'SecurePass123',
          },
        });

        assert.strictEqual(response.status, 400);
        assert(response.body.details);
      });

      it('should reject missing password', async () => {
        const response = await dispatchRequest(app, {
          method: 'POST',
          url: '/auth/register',
          body: {
            username: 'testuser',
            email: 'test@example.com',
          },
        });

        assert.strictEqual(response.status, 400);
        assert(response.body.details);
      });
    });

    describe('SQL Injection Prevention', () => {
      it('should safely handle SQL injection attempts in username', async () => {
        const timestamp = Date.now();
        const sqlInjectionAttempts = [
          "admin'--",
          "admin' OR '1'='1",
          "'; DROP TABLE users; --",
          "admin' /*",
        ];

        for (const maliciousUsername of sqlInjectionAttempts) {
          const response = await dispatchRequest(app, {
            method: 'POST',
            url: '/auth/register',
            body: {
              username: maliciousUsername,
              email: `test-${timestamp}@example.com`,
              password: 'SecurePass123',
            },
          });

          // Should be rejected by username validation (contains invalid characters)
          assert.strictEqual(response.status, 400);
        }
      });

      it('should safely handle SQL injection attempts in email', async () => {
        const timestamp = Date.now();
        const response = await dispatchRequest(app, {
          method: 'POST',
          url: '/auth/register',
          body: {
            username: `user${timestamp}`,
            email: "admin'--@example.com",
            password: 'SecurePass123',
          },
        });

        // Should be rejected by email validation
        assert.strictEqual(response.status, 400);
      });
    });

    describe('XSS Prevention', () => {
      it('should safely handle XSS attempts in username', async () => {
        const xssAttempts = [
          '<script>alert("XSS")</script>',
          '<img src=x onerror=alert(1)>',
          'javascript:alert(1)',
        ];

        for (const xss of xssAttempts) {
          const timestamp = Date.now();
          const response = await dispatchRequest(app, {
            method: 'POST',
            url: '/auth/register',
            body: {
              username: xss,
              email: `test-${timestamp}@example.com`,
              password: 'SecurePass123',
            },
          });

          // Should be rejected by username validation (contains invalid characters)
          assert.strictEqual(response.status, 400);
        }
      });
    });
  });

  describe('POST /auth/login - Zod Validation', () => {
    describe('Valid Login', () => {
      it('should accept valid login credentials', async () => {
        const timestamp = Date.now();
        const email = `test-${timestamp}@example.com`;
        const password = 'SecurePass123';

        // First register a user
        await dispatchRequest(app, {
          method: 'POST',
          url: '/auth/register',
          body: {
            username: `user${timestamp}`,
            email,
            password,
          },
        });

        // Then login
        const response = await dispatchRequest(app, {
          method: 'POST',
          url: '/auth/login',
          body: {
            email,
            password,
          },
        });

        assert.strictEqual(response.status, 200);
        assert(response.body.success);
        assert(response.body.data.token);
        assert(response.body.data.refreshToken);
        assert(response.body.data.user);
      });
    });

    describe('Email Validation', () => {
      it('should reject invalid email format', async () => {
        const response = await dispatchRequest(app, {
          method: 'POST',
          url: '/auth/login',
          body: {
            email: 'not-an-email',
            password: 'SecurePass123',
          },
        });

        assert.strictEqual(response.status, 400);
        assert(response.body.details);
        const emailError = response.body.details.find((e) => e.field === 'email');
        assert(emailError.message.includes('Invalid email'));
      });
    });

    describe('Password Validation', () => {
      it('should reject empty password', async () => {
        const response = await dispatchRequest(app, {
          method: 'POST',
          url: '/auth/login',
          body: {
            email: 'test@example.com',
            password: '',
          },
        });

        assert.strictEqual(response.status, 400);
        assert(response.body.details);
        const passwordError = response.body.details.find((e) => e.field === 'password');
        assert(passwordError.message.includes('required'));
      });
    });

    describe('Missing Fields', () => {
      it('should reject missing email', async () => {
        const response = await dispatchRequest(app, {
          method: 'POST',
          url: '/auth/login',
          body: {
            password: 'SecurePass123',
          },
        });

        assert.strictEqual(response.status, 400);
        assert(response.body.details);
      });

      it('should reject missing password', async () => {
        const response = await dispatchRequest(app, {
          method: 'POST',
          url: '/auth/login',
          body: {
            email: 'test@example.com',
          },
        });

        assert.strictEqual(response.status, 400);
        assert(response.body.details);
      });
    });
  });

  describe('POST /auth/logout', () => {
    it('should successfully logout', async () => {
      const response = await dispatchRequest(app, {
        method: 'POST',
        url: '/auth/logout',
        body: {},
      });

      assert.strictEqual(response.status, 200);
      assert(response.body.success);
      assert(response.body.message.includes('Logged out'));
    });
  });
});
