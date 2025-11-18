/**
 * Input sanitization utilities
 * Provides secure input validation and sanitization
 */

import DOMPurify from 'dompurify';

// Configure DOMPurify for maximum security
const purify = DOMPurify;

// Sanitize HTML content
export const sanitizeHtml = (html: string): string => {
  return purify.sanitize(html, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
  });
};

// Sanitize user input for display (strips all HTML)
export const sanitizeText = (text: string): string => {
  if (typeof text !== 'string') return '';
  return text.replace(/[<>]/g, '').trim();
};

// Validate and sanitize email
export const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') return '';
  const sanitized = email.trim().toLowerCase();
  // Basic email regex - server should do final validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized : '';
};

// Validate and sanitize username
export const sanitizeUsername = (username: string): string => {
  if (typeof username !== 'string') return '';
  const sanitized = username.trim();
  // Allow only alphanumeric, underscore, and hyphen
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  return usernameRegex.test(sanitized) ? sanitized : '';
};

// Sanitize password (no logging, just basic validation)
export const validatePasswordStrength = (password: string): boolean => {
  if (typeof password !== 'string') return false;
  if (password.length < 8 || password.length > 128) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) return false;
  return true;
};

// Sanitize general text input
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
    .trim()
    .substring(0, 1000); // Limit length
};
