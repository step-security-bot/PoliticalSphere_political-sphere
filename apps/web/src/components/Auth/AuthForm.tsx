/**
 * Unified Auth Form Component
 * Combines login and signup functionality with toggle buttons
 * WCAG 2.2 AA Compliant
 */

import type React from 'react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  calculatePasswordStrength,
  sanitizeEmail,
  sanitizeUsername,
  validateLoginForm,
  validateRegistrationForm,
  type PasswordStrength,
} from '../../utils/validation';
import './Auth.css';
import Captcha, { type CaptchaRef } from './Captcha';
import ForgotPasswordModal from './ForgotPasswordModal';

interface AuthFormProps {
  onAuthSuccess: () => void;
}

type AuthMode = 'login' | 'signup';

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const { login, loginLoading, register, registerLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const captchaRef = useRef<CaptchaRef>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Validation states
  const [fieldValidation, setFieldValidation] = useState<Record<string, boolean | null>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Success state
  const [showSuccess, setShowSuccess] = useState(false);

  // Signup state
  const [username, setUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    label: 'Weak',
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    },
  });

  const [error, setError] = useState<string | null>(null);
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);

  // Detect browser autofill and update state - using animation detection for reliability
  useEffect(() => {
    const handleAutofillAnimation = (e: AnimationEvent) => {
      const target = e.target as HTMLInputElement;
      if (e.animationName === 'onAutoFillStart') {
        // Add has-value class to trigger floating label
        target.classList.add('has-value');

        // Update state with autofilled value
        if (target.id === 'login-email' && target.value && !loginEmail) {
          setLoginEmail(target.value);
        } else if (target.id === 'login-password' && target.value && !loginPassword) {
          setLoginPassword(target.value);
        }
      }
    };

    const inputs = document.querySelectorAll('.floating-label-group input');
    inputs.forEach(input => {
      input.addEventListener('animationstart', handleAutofillAnimation as EventListener);
    });

    // Fallback: check after delay
    const timeoutId = setTimeout(() => {
      inputs.forEach(input => {
        const el = input as HTMLInputElement;
        if (el.value) {
          el.classList.add('has-value');
        }
      });
    }, 100);

    return () => {
      inputs.forEach(input => {
        input.removeEventListener('animationstart', handleAutofillAnimation as EventListener);
      });
      clearTimeout(timeoutId);
    };
  }, [mode, loginEmail, loginPassword]);

  useEffect(() => {
    if (!showForgotPassword) return;

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setShowForgotPassword(false);
        return;
      }

      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.hasAttribute('disabled'));
      if (focusable.length === 0) return;

      const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
      const nextIndex = event.shiftKey
        ? currentIndex <= 0
          ? focusable.length - 1
          : currentIndex - 1
        : currentIndex === focusable.length - 1
          ? 0
          : currentIndex + 1;
      event.preventDefault();
      focusable[nextIndex]?.focus();
    };

    const moveInitialFocus = () => {
      const initial = modalRef.current?.querySelector<HTMLElement>(
        'button, input, [tabindex]:not([tabindex="-1"])'
      );
      initial?.focus();
    };

    document.addEventListener('keydown', trapFocus);
    moveInitialFocus();

    return () => {
      document.removeEventListener('keydown', trapFocus);
    };
  }, [showForgotPassword]);

  // Email typo detection
  const detectEmailTypo = (email: string): string | null => {
    const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];
    const match = email.match(/@(.+)$/);
    if (!match || !match[1]) return null;

    const domain = match[1].toLowerCase();
    for (const commonDomain of commonDomains) {
      if (domain !== commonDomain && levenshteinDistance(domain, commonDomain) <= 2) {
        return commonDomain;
      }
    }
    return null;
  };

  const levenshteinDistance = (a: string, b: string): number => {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      const row = matrix[0];
      if (row) row[j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const currentRow = matrix[i];
        const prevRow = matrix[i - 1];
        if (!currentRow || !prevRow) continue;

        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          currentRow[j] = prevRow[j - 1] ?? 0;
        } else {
          currentRow[j] = Math.min(
            (prevRow[j - 1] ?? 0) + 1,
            (currentRow[j - 1] ?? 0) + 1,
            (prevRow[j] ?? 0) + 1
          );
        }
      }
    }
    const lastRow = matrix[b.length];
    return lastRow?.[a.length] ?? 0;
  };

  // Field validation on blur
  const validateField = (fieldName: string, value: string): boolean => {
    let isValid = false;
    switch (fieldName) {
      case 'loginEmail':
      case 'signupEmail':
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (isValid) {
          const suggestion = detectEmailTypo(value);
          setEmailSuggestion(suggestion);
        }
        break;
      case 'username':
        isValid = value.length >= 3 && value.length <= 50 && /^[a-zA-Z0-9_-]+$/.test(value);
        break;
      case 'loginPassword':
      case 'signupPassword':
        isValid = value.length >= 8;
        break;
      case 'confirmPassword':
        isValid = value === signupPassword && value.length >= 8;
        break;
    }
    setFieldValidation(prev => ({ ...prev, [fieldName]: isValid }));
    return isValid;
  };

  // Validation functions are now imported from shared utilities

  const handleCaptchaVerify = (token: string | null) => {
    setCaptchaToken(token);
    setCaptchaError(null);
    if (!token) {
      setCaptchaError('Please complete the CAPTCHA verification');
    }
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setCaptchaError(null);

    // Comprehensive form validation (no CAPTCHA required for login)
    const validation = validateLoginForm(loginEmail, loginPassword);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0] ?? 'Validation failed';
      setError(firstError);
      return;
    }

    try {
      const result = await login(sanitizeEmail(loginEmail), loginPassword);

      if (result.success) {
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        setShowSuccess(true);
        setTimeout(() => {
          onAuthSuccess();
        }, 1500);
      } else {
        const errorMsg = result.error || 'Login failed';
        if (errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
          setError(`${errorMsg} Would you like to create an account?`);
        } else if (errorMsg.includes('password')) {
          setError(`${errorMsg}. Reset your password?`);
        } else {
          setError(errorMsg);
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }

    // Reset CAPTCHA after submission
    captchaRef.current?.reset();
    setCaptchaToken(null);
  };

  const handleSignupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setCaptchaError(null);

    // Comprehensive form validation
    const validation = validateRegistrationForm(
      username,
      signupEmail,
      signupPassword,
      confirmPassword,
      agreedToTerms,
      captchaToken
    );

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0] ?? 'Validation failed';
      setError(firstError);
      if (validation.errors.captcha) {
        setCaptchaError(validation.errors.captcha);
      }
      return;
    }

    try {
      const result = await register(
        sanitizeUsername(username),
        sanitizeEmail(signupEmail),
        signupPassword
      );

      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => {
          onAuthSuccess();
        }, 1500);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }

    // Reset CAPTCHA after submission
    captchaRef.current?.reset();
    setCaptchaToken(null);
  };

  const handleSubmit = mode === 'login' ? handleLoginSubmit : handleSignupSubmit;
  const isLoading = mode === 'login' ? loginLoading : registerLoading;

  return (
    <main className="auth-container">
      <a
        href="#main-content"
        className="skip-link"
        style={{
          position: 'absolute',
          top: '-40px',
          left: '6px',
          background: '#000',
          color: '#fff',
          padding: '8px',
          textDecoration: 'none',
          zIndex: 1000,
          borderRadius: '4px',
        }}
      >
        Skip to main content
      </a>
      <div className="auth-card">
        <header className="auth-header">
          <h1>Political Sphere</h1>
          <p>{mode === 'login' ? 'Ready to take your seat?' : 'UK Political Simulation Game'}</p>
        </header>

        <form id="main-content" className="auth-form" onSubmit={handleSubmit} noValidate>
          {showSuccess && (
            <div className="success-celebration">
              <div className="success-checkmark">
                <svg viewBox="0 0 52 52" className="checkmark-svg" role="img" aria-label="Success">
                  <title>Success</title>
                  <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                  <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
              </div>
              <p className="success-message">
                {mode === 'login' ? 'Welcome back!' : 'Account created successfully!'}
              </p>
            </div>
          )}

          <div className="auth-toggle-buttons">
            <button
              type="button"
              className={`toggle-button ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
              disabled={isLoading}
              tabIndex={mode === 'login' ? 0 : -1}
              aria-pressed={mode === 'login'}
            >
              Login
            </button>
            <button
              type="button"
              className={`toggle-button ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => setMode('signup')}
              disabled={isLoading}
              tabIndex={mode === 'signup' ? 0 : -1}
              aria-pressed={mode === 'signup'}
            >
              Signup
            </button>
          </div>

          {error && (
            <div className="auth-error" role="alert" aria-live="assertive">
              <span className="error-icon" aria-hidden="true">
                ⚠️
              </span>
              {error}
            </div>
          )}

          {captchaError && (
            <div className="auth-error" role="alert" aria-live="assertive">
              <span className="error-icon" aria-hidden="true">
                ⚠️
              </span>
              {captchaError}
            </div>
          )}

          {emailSuggestion && (
            <output className="email-suggestion">
              Did you mean{' '}
              <button
                type="button"
                className="suggestion-link"
                onClick={() => {
                  if (mode === 'login') {
                    setLoginEmail(loginEmail.replace(/@.+$/, `@${emailSuggestion}`));
                  } else {
                    setSignupEmail(signupEmail.replace(/@.+$/, `@${emailSuggestion}`));
                  }
                  setEmailSuggestion(null);
                }}
              >
                {`${loginEmail.split('@')[0]}@${emailSuggestion}`}
              </button>
              ?
            </output>
          )}

          <div className="auth-form-content" key={mode}>
            {mode === 'login' ? (
              <>
                <div className="form-group floating-label-group">
                  <input
                    type="email"
                    id="login-email"
                    name="email"
                    value={loginEmail}
                    onChange={e => {
                      setLoginEmail(e.target.value);
                      if (fieldValidation.loginEmail !== null) {
                        setFieldValidation(prev => ({ ...prev, loginEmail: null }));
                      }
                    }}
                    onFocus={() => setFocusedField('loginEmail')}
                    onBlur={e => {
                      setFocusedField(null);
                      validateField('loginEmail', e.target.value);
                    }}
                    required
                    autoComplete="email"
                    aria-required="true"
                    aria-invalid={fieldValidation.loginEmail === false ? 'true' : 'false'}
                    disabled={isLoading}
                    placeholder=" "
                    className={loginEmail ? 'has-value' : ''}
                  />
                  <label htmlFor="login-email">Email or Username</label>
                  {fieldValidation.loginEmail === true && (
                    <span className="validation-icon valid">✓</span>
                  )}
                  {fieldValidation.loginEmail === false && (
                    <div className="field-error" role="alert" aria-live="polite">
                      Please enter a valid email address
                    </div>
                  )}
                </div>

                <div className="form-group floating-label-group">
                  <div className="password-input-wrapper">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      id="login-password"
                      name="password"
                      value={loginPassword}
                      onChange={e => {
                        setLoginPassword(e.target.value);
                        if (fieldValidation.loginPassword !== null) {
                          setFieldValidation(prev => ({ ...prev, loginPassword: null }));
                        }
                      }}
                      onFocus={() => setFocusedField('loginPassword')}
                      onBlur={e => {
                        setFocusedField(null);
                        validateField('loginPassword', e.target.value);
                      }}
                      required
                      autoComplete="current-password"
                      aria-required="true"
                      aria-invalid={fieldValidation.loginPassword === false ? 'true' : 'false'}
                      disabled={isLoading}
                      placeholder=" "
                      className={loginPassword ? 'has-value' : ''}
                    />
                    <label htmlFor="login-password">Password</label>
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                      disabled={isLoading}
                      style={{ outline: 'none' }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`eye-icon ${showLoginPassword ? 'eye-open' : 'eye-closed'}`}
                      >
                        <title>Password visibility toggle</title>
                        {showLoginPassword ? (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        ) : (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                  {fieldValidation.loginPassword === false && (
                    <div className="field-error" role="alert" aria-live="polite">
                      Password must be at least 8 characters
                    </div>
                  )}
                </div>

                <div className="form-group checkbox-group remember-me-group">
                  <label htmlFor="remember-me" className="checkbox-label">
                    <input
                      type="checkbox"
                      id="remember-me"
                      name="rememberMe"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      disabled={isLoading}
                    />
                    <span>Remember me</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn-primary btn-full-width"
                  disabled={isLoading}
                  style={{ minHeight: '48px', minWidth: '48px' }}
                >
                  {isLoading && <span className="button-spinner" aria-hidden="true"></span>}
                  {isLoading ? 'Logging in...' : 'Log In'}
                </button>

                <div className="auth-links">
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setShowForgotPassword(true)}
                    disabled={isLoading}
                  >
                    Forgot password?
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="form-group floating-label-group">
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={username}
                    onChange={e => {
                      setUsername(e.target.value);
                      if (fieldValidation.username !== null) {
                        setFieldValidation(prev => ({ ...prev, username: null }));
                      }
                    }}
                    onFocus={() => setFocusedField('username')}
                    onBlur={e => {
                      setFocusedField(null);
                      validateField('username', e.target.value);
                    }}
                    required
                    autoComplete="username"
                    aria-required="true"
                    aria-invalid={fieldValidation.username === false ? 'true' : 'false'}
                    aria-describedby="username-requirements"
                    disabled={isLoading}
                    placeholder=" "
                    minLength={3}
                    maxLength={50}
                    className={username ? 'has-value' : ''}
                  />
                  <label htmlFor="username">Username</label>
                  {fieldValidation.username === true && (
                    <span className="validation-icon valid">✓</span>
                  )}
                  <div id="username-requirements" className="field-help">
                    3-50 characters: letters, numbers, underscores, and hyphens only
                  </div>
                </div>
                <div className="form-group floating-label-group">
                  <input
                    type="email"
                    id="signup-email"
                    name="email"
                    value={signupEmail}
                    onChange={e => {
                      setSignupEmail(e.target.value);
                      setEmailSuggestion(null);
                      if (fieldValidation.signupEmail !== null) {
                        setFieldValidation(prev => ({ ...prev, signupEmail: null }));
                      }
                    }}
                    onFocus={() => setFocusedField('signupEmail')}
                    onBlur={e => {
                      setFocusedField(null);
                      validateField('signupEmail', e.target.value);
                      const suggestion = detectEmailTypo(e.target.value);
                      setEmailSuggestion(suggestion);
                    }}
                    required
                    autoComplete="email"
                    aria-required="true"
                    aria-invalid={fieldValidation.signupEmail === false ? 'true' : 'false'}
                    disabled={isLoading}
                    placeholder=" "
                    maxLength={255}
                    className={signupEmail ? 'has-value' : ''}
                  />
                  <label htmlFor="signup-email">Email</label>
                  {fieldValidation.signupEmail === true && (
                    <span className="validation-icon valid">✓</span>
                  )}
                </div>
                <div className="form-group floating-label-group">
                  <div className="password-input-wrapper">
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      id="signup-password"
                      name="password"
                      value={signupPassword}
                      onChange={e => {
                        setSignupPassword(e.target.value);
                        setPasswordStrength(calculatePasswordStrength(e.target.value));
                        if (fieldValidation.signupPassword !== null) {
                          setFieldValidation(prev => ({ ...prev, signupPassword: null }));
                        }
                      }}
                      onFocus={() => setFocusedField('signupPassword')}
                      onBlur={e => {
                        setFocusedField(null);
                        validateField('signupPassword', e.target.value);
                      }}
                      required
                      autoComplete="new-password"
                      aria-required="true"
                      aria-invalid={fieldValidation.signupPassword === false ? 'true' : 'false'}
                      aria-describedby="password-requirements"
                      disabled={isLoading}
                      placeholder=" "
                      className={signupPassword ? 'has-value' : ''}
                    />
                    <label htmlFor="signup-password">Password</label>
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                      disabled={isLoading}
                      style={{ outline: 'none' }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`eye-icon ${showSignupPassword ? 'eye-open' : 'eye-closed'}`}
                      >
                        <title>Password visibility toggle</title>
                        {showSignupPassword ? (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        ) : (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                  {fieldValidation.signupPassword === true && (
                    <span className="validation-icon valid">✓</span>
                  )}
                  {focusedField === 'signupPassword' && signupPassword.length > 0 && (
                    <div className="password-strength-popover" id="password-requirements">
                      <div className="password-strength-header">
                        <span className="strength-label">Password Strength</span>
                        <span
                          className={`strength-badge strength-${passwordStrength.label.toLowerCase()}`}
                        >
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="password-strength-bar">
                        <div
                          className={`strength-fill strength-${passwordStrength.label.toLowerCase()}`}
                          style={{
                            width: `${(passwordStrength.score / 5) * 100}%`,
                            transition: 'width 0.3s ease, background-color 0.3s ease',
                          }}
                        />
                      </div>
                      <div className="password-requirements">
                        <div
                          className={`requirement ${passwordStrength.requirements.length ? 'met' : ''}`}
                        >
                          <span className="requirement-icon">
                            {passwordStrength.requirements.length ? '✓' : '○'}
                          </span>
                          <span className="requirement-text">At least 8 characters</span>
                        </div>
                        <div
                          className={`requirement ${passwordStrength.requirements.uppercase ? 'met' : ''}`}
                        >
                          <span className="requirement-icon">
                            {passwordStrength.requirements.uppercase ? '✓' : '○'}
                          </span>
                          <span className="requirement-text">One uppercase letter</span>
                        </div>
                        <div
                          className={`requirement ${passwordStrength.requirements.lowercase ? 'met' : ''}`}
                        >
                          <span className="requirement-icon">
                            {passwordStrength.requirements.lowercase ? '✓' : '○'}
                          </span>
                          <span className="requirement-text">One lowercase letter</span>
                        </div>
                        <div
                          className={`requirement ${passwordStrength.requirements.number ? 'met' : ''}`}
                        >
                          <span className="requirement-icon">
                            {passwordStrength.requirements.number ? '✓' : '○'}
                          </span>
                          <span className="requirement-text">One number</span>
                        </div>
                        <div
                          className={`requirement ${passwordStrength.requirements.special ? 'met' : ''}`}
                        >
                          <span className="requirement-icon">
                            {passwordStrength.requirements.special ? '✓' : '○'}
                          </span>
                          <span className="requirement-text">One special character</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>{' '}
                <div className="form-group floating-label-group">
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={e => {
                        setConfirmPassword(e.target.value);
                        if (fieldValidation.confirmPassword !== null) {
                          setFieldValidation(prev => ({ ...prev, confirmPassword: null }));
                        }
                      }}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={e => {
                        setFocusedField(null);
                        validateField('confirmPassword', e.target.value);
                      }}
                      required
                      autoComplete="new-password"
                      aria-required="true"
                      aria-invalid={fieldValidation.confirmPassword === false ? 'true' : 'false'}
                      disabled={isLoading}
                      placeholder=" "
                      className={confirmPassword ? 'has-value' : ''}
                    />
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      disabled={isLoading}
                      style={{ outline: 'none' }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`eye-icon ${showConfirmPassword ? 'eye-open' : 'eye-closed'}`}
                      >
                        <title>Password visibility toggle</title>
                        {showConfirmPassword ? (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        ) : (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                  {fieldValidation.confirmPassword === true && (
                    <span className="validation-icon valid">✓</span>
                  )}
                </div>
                <div className="form-group checkbox-group">
                  <label
                    htmlFor="terms"
                    className="checkbox-label"
                    style={{
                      minHeight: '44px',
                      minWidth: '44px',
                      display: 'inline-flex',
                      alignItems: 'center',
                    }}
                  >
                    <input
                      type="checkbox"
                      id="terms"
                      name="terms"
                      checked={agreedToTerms}
                      onChange={e => setAgreedToTerms(e.target.checked)}
                      required
                      aria-required="true"
                      disabled={isLoading}
                    />
                    <span>
                      I agree to the{' '}
                      <a href="/terms" target="_blank" rel="noopener noreferrer">
                        Terms of Service
                      </a>{' '}
                      and{' '}
                      <a href="/privacy" target="_blank" rel="noopener noreferrer">
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                </div>
                <Captcha
                  ref={captchaRef}
                  onVerify={handleCaptchaVerify}
                  size="normal"
                  theme="light"
                />
                <button
                  type="submit"
                  className="btn-primary btn-full-width"
                  disabled={
                    isLoading ||
                    !username ||
                    !signupEmail ||
                    !signupPassword ||
                    !confirmPassword ||
                    !agreedToTerms ||
                    !captchaToken
                  }
                  style={{ minHeight: '48px', minWidth: '48px' }}
                >
                  {isLoading && <span className="button-spinner" aria-hidden="true"></span>}
                  {isLoading ? 'Creating account...' : 'Signup'}
                </button>
              </>
            )}
          </div>
        </form>

        <footer className="auth-footer">
          <p>
            {mode === 'login' ? (
              <>
                By logging in, you agree to our{' '}
                <a href="/terms.html" target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy.html" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
              </>
            ) : (
              <>
                Political Sphere is a neutral political simulation game. We do not collect or share
                your political views.
              </>
            )}
          </p>
        </footer>

        <ForgotPasswordModal
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />
      </div>
    </main>
  );
};

export default AuthForm;
