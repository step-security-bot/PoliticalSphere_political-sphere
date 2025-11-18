/**
 * Shared Validation Utilities
 * Centralized validation logic for forms and user input
 * WCAG 2.2 AA Compliant with clear error messages
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface PasswordStrength {
  score: number;
  label: 'Weak' | 'Medium' | 'Strong';
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

/**
 * Sanitizes and validates username
 * Requirements: 3-50 characters, alphanumeric + underscore/hyphen
 */
export function validateUsername(username: string): ValidationResult {
  const sanitized = username.trim();

  if (!sanitized) {
    return { isValid: false, error: 'Username is required' };
  }

  if (sanitized.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' };
  }

  if (sanitized.length > 50) {
    return { isValid: false, error: 'Username must not exceed 50 characters' };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, underscores, and hyphens',
    };
  }

  return { isValid: true };
}

/**
 * Sanitizes and validates email address
 * Uses HTML5 email validation pattern
 */
export function validateEmail(email: string): ValidationResult {
  const sanitized = email.trim().toLowerCase();

  if (!sanitized) {
    return { isValid: false, error: 'Email address is required' };
  }

  if (sanitized.length > 255) {
    return { isValid: false, error: 'Email address is too long' };
  }

  // RFC 5322 compliant email regex (simplified for UX)
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(sanitized)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true };
}

/**
 * Validates password strength and requirements
 * Requirements: 8-128 chars, uppercase, lowercase, number, special char
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password must not exceed 128 characters' };
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

  const missing = [];
  if (!hasUppercase) missing.push('uppercase letter');
  if (!hasLowercase) missing.push('lowercase letter');
  if (!hasNumber) missing.push('number');
  if (!hasSpecial) missing.push('special character');

  if (missing.length > 0) {
    return {
      isValid: false,
      error: `Password must contain: ${missing.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Calculates password strength for UI feedback
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  let label: 'Weak' | 'Medium' | 'Strong';
  if (score <= 2) label = 'Weak';
  else if (score <= 4) label = 'Medium';
  else label = 'Strong';

  return { score, label, requirements };
}

/**
 * Validates password confirmation matches
 */
export function validatePasswordConfirmation(
  password: string,
  confirmPassword: string
): ValidationResult {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true };
}

/**
 * Sanitizes input by trimming and removing potentially harmful characters
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Sanitizes username by trimming and allowing only safe characters
 */
export function sanitizeUsername(username: string): string {
  return username.trim().replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Sanitizes email by trimming and converting to lowercase
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Validates CAPTCHA token presence
 */
export function validateCaptcha(token: string | null): ValidationResult {
  if (!token) {
    return { isValid: false, error: 'Please complete the CAPTCHA verification' };
  }

  return { isValid: true };
}

/**
 * Comprehensive form validation for login
 */
export function validateLoginForm(
  email: string,
  password: string,
  captchaToken?: string | null
): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error ?? 'Invalid email';
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error ?? 'Invalid password';
  }

  if (captchaToken !== undefined) {
    const captchaValidation = validateCaptcha(captchaToken);
    if (!captchaValidation.isValid) {
      errors.captcha = captchaValidation.error ?? 'Invalid captcha';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Comprehensive form validation for registration
 */
export function validateRegistrationForm(
  username: string,
  email: string,
  password: string,
  confirmPassword: string,
  agreedToTerms: boolean,
  captchaToken?: string | null
): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  const usernameValidation = validateUsername(username);
  if (!usernameValidation.isValid) {
    errors.username = usernameValidation.error ?? 'Invalid username';
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error ?? 'Invalid email';
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error ?? 'Invalid password';
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (!agreedToTerms) {
    errors.terms = 'You must agree to the Terms of Service and Privacy Policy';
  }

  if (captchaToken !== undefined) {
    const captchaValidation = validateCaptcha(captchaToken);
    if (!captchaValidation.isValid) {
      errors.captcha = captchaValidation.error ?? 'Invalid captcha';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
