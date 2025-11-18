/**
 * Unified Auth Form Component
 * Combines login and signup functionality with toggle buttons
 * WCAG 2.2 AA Compliant
 */

import type React from 'react';
import { useRef, useState, type FormEvent } from 'react';
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

    // Comprehensive form validation
    const validation = validateLoginForm(loginEmail, loginPassword, captchaToken);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0] ?? 'Validation failed';
      setError(firstError);
      if (validation.errors.captcha) {
        setCaptchaError(validation.errors.captcha);
      }
      return;
    }

    try {
      const result = await login(sanitizeEmail(loginEmail), loginPassword);

      if (result.success) {
        onAuthSuccess();
      } else {
        setError(result.error || 'Login failed');
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
      captchaToken,
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
        signupPassword,
      );

      if (result.success) {
        onAuthSuccess();
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
    <div className="auth-container">
      <div className="auth-card">
        <header className="auth-header">
          <h1>Political Sphere</h1>
          <p>{mode === 'login' ? 'Ready to take your seat?' : 'UK Political Simulation Game'}</p>
        </header>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <h2>{mode === 'login' ? 'Log In' : 'Signup'}</h2>

          <div className="auth-toggle-buttons">
            <button
              type="button"
              className={`toggle-button ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
              disabled={isLoading}
            >
              Login
            </button>
            <button
              type="button"
              className={`toggle-button ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => setMode('signup')}
              disabled={isLoading}
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

          <div className="auth-form-content" key={mode}>
            {mode === 'login' ? (
              <>
                <div className="form-group">
                  <label htmlFor="login-email">
                    Email Address or Username
                    <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="login-email"
                    name="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                    autoComplete="email"
                    aria-required="true"
                    aria-invalid={error ? 'true' : 'false'}
                    disabled={isLoading}
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="login-password">
                    Password
                    <span className="required">*</span>
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      id="login-password"
                      name="password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      aria-required="true"
                      aria-invalid={error ? 'true' : 'false'}
                      disabled={isLoading}
                      placeholder="Enter your password"
                    />
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
                  disabled={isLoading || !loginEmail || !loginPassword || !captchaToken}
                >
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
                <div className="form-group">
                  <label htmlFor="username">
                    Username
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    autoComplete="username"
                    aria-required="true"
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby="username-requirements"
                    disabled={isLoading}
                    placeholder="Choose a unique username"
                    minLength={3}
                    maxLength={50}
                  />
                  <div id="username-requirements" className="field-help">
                    3-50 characters: letters, numbers, underscores, and hyphens only
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="signup-email">
                    Email Address
                    <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="signup-email"
                    name="email"
                    value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)}
                    required
                    autoComplete="email"
                    aria-required="true"
                    aria-invalid={error ? 'true' : 'false'}
                    disabled={isLoading}
                    placeholder="your.email@example.com"
                    maxLength={255}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="signup-password">
                    Password
                    <span className="required">*</span>
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      id="signup-password"
                      name="password"
                      value={signupPassword}
                      onChange={e => {
                        setSignupPassword(e.target.value);
                        setPasswordStrength(calculatePasswordStrength(e.target.value));
                      }}
                      required
                      autoComplete="new-password"
                      aria-required="true"
                      aria-invalid={error ? 'true' : 'false'}
                      aria-describedby="password-requirements"
                      disabled={isLoading}
                      placeholder="Create a strong password"
                    />
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
                  <div id="password-requirements" className="field-help">
                    8-128 characters with uppercase, lowercase, number, and special character
                  </div>
                  <div className="password-strength-indicator">
                    <span>Password Strength: {passwordStrength.label}</span>
                    <div className="password-strength-dots">
                      <div
                        className={`dot ${passwordStrength.score >= 1 ? 'active weak' : ''}`}
                      ></div>
                      <div
                        className={`dot ${passwordStrength.score >= 3 ? 'active medium' : ''}`}
                      ></div>
                      <div
                        className={`dot ${passwordStrength.score >= 5 ? 'active strong' : ''}`}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    Confirm Password
                    <span className="required">*</span>
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      aria-required="true"
                      aria-invalid={error ? 'true' : 'false'}
                      disabled={isLoading}
                      placeholder="Re-enter your password"
                    />
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
                </div>

                <div className="form-group checkbox-group">
                  <label htmlFor="terms" className="checkbox-label">
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
                >
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
    </div>
  );
};

export default AuthForm;
