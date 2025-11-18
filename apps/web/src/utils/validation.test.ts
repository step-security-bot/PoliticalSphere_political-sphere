/**
 * Validation Utilities Tests
 * Comprehensive test coverage for form validation functions
 */

import { describe, expect, it } from 'vitest';
import {
  calculatePasswordStrength,
  sanitizeEmail,
  sanitizeInput,
  sanitizeUsername,
  validateCaptcha,
  validateEmail,
  validateLoginForm,
  validatePassword,
  validatePasswordConfirmation,
  validateRegistrationForm,
  validateUsername,
} from './validation';

describe('Input Sanitization', () => {
  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test');
    });

    it('should remove potentially harmful characters', () => {
      expect(sanitizeInput('test<script>')).toBe('testscript');
      expect(sanitizeInput('test<>')).toBe('test');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
    });
  });

  describe('sanitizeUsername', () => {
    it('should trim and allow only safe characters', () => {
      expect(sanitizeUsername('  user_name-123  ')).toBe('user_name-123');
      expect(sanitizeUsername('user@name')).toBe('username');
    });
  });

  describe('sanitizeEmail', () => {
    it('should trim and convert to lowercase', () => {
      expect(sanitizeEmail('  Test@Example.COM  ')).toBe('test@example.com');
    });
  });
});

describe('Field Validation', () => {
  describe('validateUsername', () => {
    it('should accept valid usernames', () => {
      expect(validateUsername('testuser')).toEqual({ isValid: true });
      expect(validateUsername('user_123')).toEqual({ isValid: true });
      expect(validateUsername('user-name')).toEqual({ isValid: true });
    });

    it('should reject invalid usernames', () => {
      expect(validateUsername('')).toEqual({
        isValid: false,
        error: 'Username is required',
      });
      expect(validateUsername('ab')).toEqual({
        isValid: false,
        error: 'Username must be at least 3 characters long',
      });
      expect(validateUsername('a'.repeat(51))).toEqual({
        isValid: false,
        error: 'Username must not exceed 50 characters',
      });
      expect(validateUsername('user@name')).toEqual({
        isValid: false,
        error: 'Username can only contain letters, numbers, underscores, and hyphens',
      });
    });
  });

  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('test@example.com')).toEqual({ isValid: true });
      expect(validateEmail('user.name+tag@domain.co.uk')).toEqual({ isValid: true });
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('')).toEqual({
        isValid: false,
        error: 'Email address is required',
      });
      expect(validateEmail('invalid-email')).toEqual({
        isValid: false,
        error: 'Please enter a valid email address',
      });
      expect(validateEmail('a'.repeat(256) + '@example.com')).toEqual({
        isValid: false,
        error: 'Email address is too long',
      });
    });
  });

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      expect(validatePassword('StrongPass123!')).toEqual({ isValid: true });
      expect(validatePassword('MySecure789#')).toEqual({ isValid: true });
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('')).toEqual({
        isValid: false,
        error: 'Password is required',
      });
      expect(validatePassword('short')).toEqual({
        isValid: false,
        error: 'Password must be at least 8 characters long',
      });
      expect(validatePassword('a'.repeat(129))).toEqual({
        isValid: false,
        error: 'Password must not exceed 128 characters',
      });
      expect(validatePassword('password123')).toEqual({
        isValid: false,
        error: 'Password must contain: uppercase letter, special character',
      });
      expect(validatePassword('Password')).toEqual({
        isValid: false,
        error: 'Password must contain: number, special character',
      });
      expect(validatePassword('Password123')).toEqual({
        isValid: false,
        error: 'Password must contain: special character',
      });
    });
  });

  describe('validatePasswordConfirmation', () => {
    it('should accept matching passwords', () => {
      expect(validatePasswordConfirmation('password123', 'password123')).toEqual({
        isValid: true,
      });
    });

    it('should reject non-matching passwords', () => {
      expect(validatePasswordConfirmation('password123', '')).toEqual({
        isValid: false,
        error: 'Please confirm your password',
      });
      expect(validatePasswordConfirmation('password123', 'different')).toEqual({
        isValid: false,
        error: 'Passwords do not match',
      });
    });
  });

  describe('validateCaptcha', () => {
    it('should accept valid tokens', () => {
      expect(validateCaptcha('valid-token')).toEqual({ isValid: true });
    });

    it('should reject invalid tokens', () => {
      expect(validateCaptcha(null)).toEqual({
        isValid: false,
        error: 'Please complete the CAPTCHA verification',
      });
      expect(validateCaptcha(null)).toEqual({
        isValid: false,
        error: 'Please complete the CAPTCHA verification',
      });
    });
  });
});

describe('Password Strength Calculation', () => {
  it('should calculate weak passwords', () => {
    const result = calculatePasswordStrength('weak');
    expect(result.label).toBe('Weak');
    expect(result.score).toBe(1); // only length
    expect(result.requirements).toEqual({
      length: false,
      uppercase: false,
      lowercase: true,
      number: false,
      special: false,
    });
  });

  it('should calculate medium passwords', () => {
    const result = calculatePasswordStrength('Medium123');
    expect(result.label).toBe('Medium');
    expect(result.score).toBe(4); // length, lowercase, number, uppercase
  });

  it('should calculate strong passwords', () => {
    const result = calculatePasswordStrength('StrongPass123!');
    expect(result.label).toBe('Strong');
    expect(result.score).toBe(5); // all requirements
    expect(result.requirements).toEqual({
      length: true,
      uppercase: true,
      lowercase: true,
      number: true,
      special: true,
    });
  });
});

describe('Form Validation', () => {
  describe('validateLoginForm', () => {
    it('should validate complete login forms', () => {
      const result = validateLoginForm('test@example.com', 'Password123!', 'captcha-token');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should collect multiple errors', () => {
      const result = validateLoginForm('invalid-email', 'weak', null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('email');
      expect(result.errors).toHaveProperty('password');
      expect(result.errors).toHaveProperty('captcha');
    });
  });

  describe('validateRegistrationForm', () => {
    const validForm = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'StrongPass123!',
      confirmPassword: 'StrongPass123!',
      agreedToTerms: true,
      captchaToken: 'token',
    };

    it('should validate complete registration forms', () => {
      const result = validateRegistrationForm(
        validForm.username,
        validForm.email,
        validForm.password,
        validForm.confirmPassword,
        validForm.agreedToTerms,
        validForm.captchaToken
      );
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should reject forms without terms agreement', () => {
      const result = validateRegistrationForm(
        validForm.username,
        validForm.email,
        validForm.password,
        validForm.confirmPassword,
        false,
        validForm.captchaToken
      );
      expect(result.isValid).toBe(false);
      expect(result.errors.terms).toBe('You must agree to the Terms of Service and Privacy Policy');
    });

    it('should collect multiple validation errors', () => {
      const result = validateRegistrationForm(
        'us', // too short
        'invalid-email', // invalid
        'weak', // weak password
        'different', // doesn't match
        false, // terms not agreed
        null // no captcha
      );
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors)).toHaveLength(6);
    });
  });
});

// Integration tests for real-world scenarios
describe('Integration Scenarios', () => {
  it('should handle complete user registration flow', () => {
    // Simulate a complete registration validation
    const username = validateUsername('newuser123');
    const email = validateEmail('newuser@example.com');
    const password = validatePassword('SecurePass123!');
    const confirm = validatePasswordConfirmation('SecurePass123!', 'SecurePass123!');
    const captcha = validateCaptcha('captcha-token');

    expect(username.isValid).toBe(true);
    expect(email.isValid).toBe(true);
    expect(password.isValid).toBe(true);
    expect(confirm.isValid).toBe(true);
    expect(captcha.isValid).toBe(true);

    const formValidation = validateRegistrationForm(
      'newuser123',
      'newuser@example.com',
      'SecurePass123!',
      'SecurePass123!',
      true,
      'captcha-token'
    );

    expect(formValidation.isValid).toBe(true);
  });

  it('should handle login with email or username', () => {
    // Test both email and username login scenarios
    const emailLogin = validateLoginForm('user@example.com', 'Password123!', 'token');
    const usernameLogin = validateLoginForm('testuser@example.com', 'Password123!', 'token');

    expect(emailLogin.isValid).toBe(true);
    expect(usernameLogin.isValid).toBe(true);
  });

  it('should provide helpful error messages for common mistakes', () => {
    const shortPassword = validatePassword('123');
    expect(shortPassword.error).toContain('at least 8 characters');

    const noUppercase = validatePassword('password123!');
    expect(noUppercase.error).toContain('uppercase letter');

    const invalidEmail = validateEmail('notanemail');
    expect(invalidEmail.error).toContain('valid email address');
  });
});
