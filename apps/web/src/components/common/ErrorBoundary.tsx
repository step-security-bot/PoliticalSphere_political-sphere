/**
 * Global Error Boundary Component
 * Catches React errors and provides fallback UI with recovery options
 * WCAG 2.2 AA Compliant
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Log error for monitoring/reporting
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  override componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));

      // Add a small delay before retry to prevent rapid retries
      const timeout = setTimeout(() => {
        this.forceUpdate();
      }, 1000);

      this.retryTimeouts.push(timeout);
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  handleReportError = () => {
    const { error, errorInfo } = this.state;
    if (error) {
      // In a real app, this would send to error reporting service
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      console.log('Error report:', errorReport);

      // For now, just show an alert. In production, integrate with services like Sentry
      alert(
        'Error report logged. In a production app, this would be sent to our error monitoring service.'
      );
    }
  };

  override render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      const { error, retryCount } = this.state;
      const { maxRetries = 3 } = this.props;
      const canRetry = retryCount < maxRetries;

      return (
        <div
          className="error-boundary"
          role="alert"
          aria-live="assertive"
          aria-labelledby="error-heading"
          aria-describedby="error-description"
        >
          <div className="error-boundary-content">
            <div className="error-icon" aria-hidden="true">
              ⚠️
            </div>

            <h1 id="error-heading" className="error-title">
              Something went wrong
            </h1>

            <p id="error-description" className="error-message">
              {error?.message || 'An unexpected error occurred. Please try again.'}
            </p>

            <div className="error-actions">
              {canRetry && (
                <button
                  type="button"
                  onClick={this.handleRetry}
                  className="btn-retry"
                  aria-label={`Retry loading the page (attempt ${retryCount + 1} of ${maxRetries})`}
                >
                  Try Again ({retryCount + 1}/{maxRetries})
                </button>
              )}

              <button
                type="button"
                onClick={this.handleReset}
                className="btn-reset"
                aria-label="Reset and reload the application"
              >
                Reset App
              </button>

              <button
                type="button"
                onClick={this.handleReportError}
                className="btn-report"
                aria-label="Report this error to the development team"
              >
                Report Error
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && error && (
              <details className="error-details">
                <summary>Technical Details (Development)</summary>
                <pre className="error-stack">
                  {error.stack}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
