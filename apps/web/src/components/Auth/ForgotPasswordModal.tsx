/**
 * Forgot Password Modal Component
 * Allows users to request password reset
 * WCAG 2.2 AA Compliant
 */

import React, { FormEvent, useState } from 'react';
import './Auth.css';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      // TODO: Implement actual password reset API call
      // For now, simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('If an account with that email exists, we have sent you a password reset link.');
    } catch {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
          ×
        </button>

        <h2>Reset Password</h2>
        <p>Enter your email address and we'll send you a link to reset your password.</p>

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className="auth-error" role="alert" aria-live="assertive">
              <span className="error-icon" aria-hidden="true">
                ⚠️
              </span>
              {error}
            </div>
          )}

          {message && (
            <div className="auth-success" role="alert" aria-live="assertive">
              <span className="success-icon" aria-hidden="true">
                ✓
              </span>
              {message}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="reset-email">
              Email Address
              <span className="required" aria-label="required">
                *
              </span>
            </label>
            <input
              type="email"
              id="reset-email"
              name="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              aria-required="true"
              disabled={loading}
              placeholder="your.email@example.com"
            />
          </div>

          <button type="submit" className="btn-primary btn-full-width" disabled={loading || !email}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
