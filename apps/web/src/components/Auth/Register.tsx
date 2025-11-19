/**
 * Register Component
 * User registration interface
 * WCAG 2.2 AA Compliant
 */

import type React from 'react';
import { type FormEvent, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

interface RegisterProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({
  onRegisterSuccess,
  onSwitchToLogin: _onSwitchToLogin,
}) => {
  const { register, registerLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'Weak' | 'Medium' | 'Strong'>('Weak');

  const validateUsername = (name: string): string | null => {
    if (name.length < 3) return 'Username must be at least 3 characters';
    if (name.length > 50) return 'Username must not exceed 50 characters';
    if (!/^[a-zA-Z0-9_-]+$/.test(name))
      return 'Username can only contain letters, numbers, underscores, and hyphens';
    return null;
  };

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Password must be at least 8 characters';
    if (pwd.length > 128) return 'Password must not exceed 128 characters';
    if (!/[A-Z]/.test(pwd)) return 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(pwd)) return 'Password must contain a lowercase letter';
    if (!/[0-9]/.test(pwd)) return 'Password must contain a number';
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd))
      return 'Password must contain a special character';
    return null;
  };

  const calculatePasswordStrength = (pwd: string): 'Weak' | 'Medium' | 'Strong' => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) score++;
    if (score <= 1) return 'Weak';
    if (score <= 3) return 'Medium';
    return 'Strong';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service');
      return;
    }

    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      const result = await register(username, email, password);

      if (result.success) {
        onRegisterSuccess();
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <header className="auth-header">
          <h1>Political Sphere</h1>
          <p>Ready to take your seat?</p>
        </header>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <h2>Create Account</h2>

          {error && (
            <div className="auth-error" role="alert" aria-live="assertive">
              <span className="error-icon" aria-hidden="true">
                ⚠️
              </span>
              {error}
            </div>
          )}

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
              disabled={registerLoading}
              placeholder="Choose a unique username"
              minLength={3}
              maxLength={50}
            />
            <div id="username-requirements" className="field-help" role="note">
              3-50 characters: letters, numbers, underscores, and hyphens only
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email Address
              <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              aria-required="true"
              aria-invalid={error ? 'true' : 'false'}
              disabled={registerLoading}
              placeholder="your.email@example.com"
              maxLength={255}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
              <span className="required">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setPasswordStrength(calculatePasswordStrength(e.target.value));
                }}
                required
                autoComplete="new-password"
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby="password-requirements"
                disabled={registerLoading}
                placeholder="Create a strong password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={registerLoading}
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
                  className={`eye-icon ${showPassword ? 'eye-open' : 'eye-closed'}`}
                >
                  <title>Password visibility toggle</title>
                  {showPassword ? (
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
              8-128 characters with uppercase, lowercase, and number
            </div>
            <div className="password-strength-indicator">
              <span>Password Strength: {passwordStrength}</span>
              <div className="strength-bar-container">
                <div
                  className="strength-bar"
                  style={{
                    width:
                      passwordStrength === 'Weak'
                        ? '33%'
                        : passwordStrength === 'Medium'
                          ? '66%'
                          : '100%',
                    backgroundColor:
                      passwordStrength === 'Weak'
                        ? '#ff4444'
                        : passwordStrength === 'Medium'
                          ? '#ffaa00'
                          : '#44aa44',
                  }}
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
                disabled={registerLoading}
                placeholder="Re-enter your password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                disabled={registerLoading}
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
                disabled={registerLoading}
              />
              <span className="policy-chip">
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

          <button
            type="submit"
            className="btn-primary btn-full-width"
            disabled={
              registerLoading ||
              !username ||
              !email ||
              !password ||
              !confirmPassword ||
              !agreedToTerms
            }
          >
            {registerLoading ? 'Creating account...' : 'Create Account'}
          </button>

          <div className="auth-links"></div>
        </form>

        <footer className="auth-footer">
          <p>
            Political Sphere is a neutral political simulation game. We do not collect or share your
            political views.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Register;
