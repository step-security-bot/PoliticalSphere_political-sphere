/**
 * Login Component
 * User authentication interface
 * WCAG 2.2 AA Compliant
 */

import type React from 'react';
import { type FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';
import ForgotPasswordModal from './ForgotPasswordModal';

interface LoginProps {
  onLoginSuccess: () => void;
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({
  onLoginSuccess,
  onSwitchToRegister: _onSwitchToRegister,
}) => {
  const { login, loginLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {}, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Invalid email format');
      return;
    }

    try {
      const result = await login(email, password);

      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.error || 'Login failed');
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
          <h2>Log In</h2>

          {error && (
            <div className="auth-error" role="alert" aria-live="assertive">
              <span className="error-icon" aria-hidden="true">
                ⚠️
              </span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              Email Address or Username
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
              disabled={loginLoading}
              placeholder="your.email@example.com"
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
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
                disabled={loginLoading}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={loginLoading}
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
          </div>

          <button
            type="submit"
            className="btn-primary btn-full-width"
            disabled={loginLoading || !email || !password}
          >
            {loginLoading ? 'Logging in...' : 'Log In'}
          </button>

          <div className="auth-links">
            <button
              type="button"
              className="link-button"
              onClick={() => setShowForgotPassword(true)}
              disabled={loginLoading}
            >
              Forgot password?
            </button>
          </div>
        </form>

        <footer className="auth-footer">
          <p>
            By logging in, you agree to our{' '}
            <a href="/terms.html" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </a>{' '}
            and acknowledge our{' '}
            <a href="/privacy.html" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
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

export default Login;
