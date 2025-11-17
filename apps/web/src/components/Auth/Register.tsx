/**
 * Register Component
 * User registration interface
 * WCAG 2.2 AA Compliant
 */

import React, { FormEvent, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

interface RegisterProps {
  onRegisterSuccess: () => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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
    return null;
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

    setLoading(true);

    try {
      const result = await register(username, email, password);

      if (result.success) {
        onRegisterSuccess();
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <header className="auth-header">
          <h1>Political Sphere</h1>
          <p>UK Political Simulation Game</p>
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
              <span className="required" aria-label="required">
                *
              </span>
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
              disabled={loading}
              placeholder="Choose a unique username"
              minLength={3}
              maxLength={50}
            />
            <div id="username-requirements" className="field-help">
              3-50 characters: letters, numbers, underscores, and hyphens only
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email Address
              <span className="required" aria-label="required">
                *
              </span>
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
              disabled={loading}
              placeholder="your.email@example.com"
              maxLength={255}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
              <span className="required" aria-label="required">
                *
              </span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby="password-requirements"
                disabled={loading}
                placeholder="Create a strong password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <div id="password-requirements" className="field-help">
              8-128 characters with uppercase, lowercase, and number
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm Password
              <span className="required" aria-label="required">
                *
              </span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              aria-required="true"
              aria-invalid={error ? 'true' : 'false'}
              disabled={loading}
              placeholder="Re-enter your password"
            />
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
                disabled={loading}
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

          <button
            type="submit"
            className="btn-primary btn-full-width"
            disabled={
              loading || !username || !email || !password || !confirmPassword || !agreedToTerms
            }
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <div className="auth-links">
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Already have an account? Log in
            </button>
          </div>
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
