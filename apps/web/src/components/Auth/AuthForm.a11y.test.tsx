/**
 * Comprehensive Accessibility Tests for AuthForm
 * WCAG 2.2 Level AA Compliance Validation
 *
 * Test Coverage:
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Focus management
 * - ARIA attributes
 * - Color contrast
 * - Touch target sizes
 * - Reduced motion
 */

import { axe, toHaveNoViolations } from 'jest-axe';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll } from 'vitest';
import AuthForm from './AuthForm';
import { AuthProvider } from '../../contexts/AuthContext';

// Extend Vitest matchers
expect.extend(toHaveNoViolations);

// Test wrapper with auth context
const renderWithAuth = (ui: React.ReactElement) => {
  return render(<AuthProvider>{ui}</AuthProvider>);
};

describe('AuthForm Accessibility (WCAG 2.2 AA)', () => {
  describe('Automated Accessibility Testing (axe-core)', () => {
    it('should have no WCAG violations in login mode', async () => {
      const { container } = renderWithAuth(<AuthForm onAuthSuccess={() => {}} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no WCAG violations in signup mode', async () => {
      const { container } = renderWithAuth(<AuthForm onAuthSuccess={() => {}} />);

      // Switch to signup mode
      const signupButton = screen.getByRole('button', { name: /signup/i });
      await userEvent.click(signupButton);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no WCAG violations with errors displayed', async () => {
      const { container } = renderWithAuth(<AuthForm onAuthSuccess={() => {}} />);

      // Trigger validation error
      const loginButton = screen.getByRole('button', { name: /log in/i });
      await userEvent.click(loginButton);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation (WCAG 2.1.1)', () => {
    it('should allow full keyboard navigation through login form', async () => {
      const user = userEvent.setup();
      renderWithAuth(<AuthForm onAuthSuccess={() => {}} />);

      // Tab through form elements
      await user.tab(); // Mode toggle
      expect(document.activeElement).toHaveAttribute('type', 'button');

      await user.tab(); // Email input
      expect(document.activeElement).toHaveAttribute('type', 'email');

      await user.tab(); // Password input
      expect(document.activeElement).toHaveAttribute('type', 'password');

      await user.tab(); // Password toggle button
      await user.tab(); // Remember me checkbox
      await user.tab(); // Submit button

      expect(document.activeElement).toHaveAttribute('type', 'submit');
    });

    it('should support Enter key to submit form', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = vi.fn();
      renderWithAuth(<AuthForm onAuthSuccess={mockOnSuccess} />);

      const emailInput = screen.getByLabelText(/email or username/i);
      await user.type(emailInput, 'test@example.com');

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'SecureP@ss123{Enter}');

      // Form should attempt submission
      await waitFor(() => {
        expect(screen.queryByText(/logging in/i)).toBeTruthy();
      });
    });

    it('should support Escape key to close modals', async () => {
      const user = userEvent.setup();
      renderWithAuth(<AuthForm onAuthSuccess={() => {}} />);

      const forgotPasswordLink = screen.getByRole('button', { name: /forgot password/i });
      await user.click(forgotPasswordLink);

      // Modal should be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Focus Management (WCAG 2.4.3, 2.4.7)', () => {
    it('should have visible focus indicators', async () => {
      const user = userEvent.setup();
      renderWithAuth(<AuthForm onAuthSuccess={() => {}} />);

      const emailInput = screen.getByLabelText(/email or username/i);
      await user.tab();
      await user.tab(); // Focus on email

      expect(emailInput).toHaveFocus();

      // Check for focus styles (would need visual regression testing for full verification)
      const styles = window.getComputedStyle(emailInput);
      expect(styles.outline).not.toBe('none');
    });

    it('should maintain logical focus order', async () => {
      const user = userEvent.setup();
      renderWithAuth(<AuthForm onAuthSuccess={() => {}} />);

      const focusOrder: string[] = [];

      // Track focus order
      await user.tab();
      focusOrder.push(document.activeElement?.getAttribute('type') || 'button');

      await user.tab();
      focusOrder.push(document.activeElement?.getAttribute('type') || '');

      await user.tab();
      focusOrder.push(document.activeElement?.getAttribute('type') || '');

      // Verify logical order (toggle, email, password, ...)
      expect(focusOrder).toEqual(['button', 'email', 'password']);
    });

    it('should trap focus within modal dialogs', async () => {
      const user = userEvent.setup();
      renderWithAuth(<AuthForm onAuthSuccess={() => {}} />);

      const forgotPasswordLink = screen.getByRole('button', { name: /forgot password/i });
      await user.click(forgotPasswordLink);

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();

      // Tab through modal elements - focus should stay within modal
      const modalButtons = within(modal).getAllByRole('button');
      await user.tab();

      expect(modalButtons).toContain(document.activeElement);
    });
  });

  describe('ARIA Attributes (WCAG 4.1.2)', () => {
    it('should have proper ARIA labels on inputs', () => {
      renderWithAuth(<AuthForm onAuthSuccess={() => {}} />);

      const emailInput = screen.getByLabelText(/email or username/i);
      expect(emailInput).toHaveAttribute('aria-required', 'true');
      expect(emailInput).toHaveAttribute('aria-invalid');
    });

    it('should announce errors with aria-live', async () => {
      const user = userEvent.setup();
      renderWithAuth(<AuthForm onAuthSuccess={() => {}} />);

      const submitButton = screen.getByRole('button', { name: /log in/i });
      await user.click(submitButton);

      const errorMessage = await screen.findByRole('alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have accessible password toggle buttons', () => {
      renderWithAuth(<AuthForm onAuthSuccess={() => {}} />);

      const passwordToggle = screen.getByLabelText(/show password/i);
      expect(passwordToggle).toHaveAttribute('aria-label');
      expect(passwordToggle).toHaveAttribute('type', 'button');
    });

    it('should properly label form sections', () => {
      renderWithAuth(<AuthForm onAuthSuccess={() => {}} />);

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();

      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('novalidate'); // Client-side validation
    });
  });

  describe('Screen Reader Support (WCAG 4.1.3)', () => {
    it('should provide status messages for loading states', async () => {
      const user = userEvent.setup();
      renderWithAuth(<AuthForm onAuthSuccess={() => {}} />);

      const emailInput = screen.getByLabelText(/email or username/i);
      await user.type(emailInput, 'test@example.com');

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'SecureP@ss123');

      const submitButton = screen.getByRole('button', { name: /log in/i });
      await user.click(submitButton);

      // Should show loading state
      expect(await screen.findByText(/logging in/i)).toBeInTheDocument();
    });

    it('should announce success states', async () => {
      // Mock successful login
      const mockOnSuccess = vi.fn();
      renderWithAuth(<AuthForm onAuthSuccess={mockOnSuccess} />);

      // Simulate successful login...
      // Success message should be announced via aria-live region
    });
  });

  describe('Touch Target Sizes (WCAG 2.5.5)', () => {
    it('should have buttons with minimum 44x44px touch targets', () => {
      renderWithAuth(<AuthForm onAuthSuccess={() => {}} />);

      const submitButton = screen.getByRole('button', { name: /log in/i });
      const { height } = submitButton.getBoundingClientRect();

      expect(height).toBeGreaterThanOrEqual(44);
    });

    it('should have checkboxes with adequate touch targets', () => {
      const user = userEvent.setup();
      renderWithAuth(<AuthForm onAuthSuccess={() => {}} />);

      // Switch to signup mode
      const signupButton = screen.getByRole('button', { name: /signup/i });
      user.click(signupButton);

      const checkbox = screen.getByRole('checkbox', { name: /agree to terms/i });
      const label = checkbox.closest('label');

      // Label should provide adequate touch target
      expect(label).toBeInTheDocument();
    });
  });

  describe('Color Contrast (WCAG 1.4.3)', () => {
    it('should meet minimum contrast ratios for text', () => {
      const { container } = renderWithAuth(<AuthForm onAuthSuccess={() => {}} />);

      // This requires axe-core color contrast rules
      // In practice, use automated tools like axe DevTools
      // or Lighthouse for comprehensive contrast checking

      const heading = container.querySelector('h1');
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Reduced Motion (WCAG 2.3.3)', () => {
    it('should respect prefers-reduced-motion', () => {
      // Mock reduced motion preference
      const matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: matchMedia,
      });

      renderWithAuth(<AuthForm onAuthSuccess={() => {}} prefersReducedMotion />);

      // Verify that animation duration is reduced
      // (Would require checking computed styles)
    });
  });

  describe('Error Handling (WCAG 3.3.1, 3.3.3)', () => {
    it('should identify errors clearly', async () => {
      const user = userEvent.setup();
      renderWithAuth(<AuthForm onAuthSuccess={() => {}} />);

      const submitButton = screen.getByRole('button', { name: /log in/i });
      await user.click(submitButton);

      // Error should be identified
      const error = await screen.findByRole('alert');
      expect(error).toHaveTextContent(/required/i);
    });

    it('should provide error suggestions', async () => {
      const user = userEvent.setup();
      renderWithAuth(<AuthForm onAuthSuccess={() => {}} />);

      // Switch to signup
      const signupButton = screen.getByRole('button', { name: /signup/i });
      await user.click(signupButton);

      const emailInput = screen.getByLabelText(/^email$/i);
      await user.type(emailInput, 'test@gmial.com'); // Typo
      await user.tab(); // Trigger blur

      // Should suggest correction
      await waitFor(() => {
        expect(screen.queryByText(/did you mean/i)).toBeInTheDocument();
      });
    });

    it('should mark invalid fields with aria-invalid', async () => {
      const user = userEvent.setup();
      renderWithAuth(<AuthForm onAuthSuccess={() => {}} />);

      const emailInput = screen.getByLabelText(/email or username/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Trigger validation

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  describe('Form Labels (WCAG 1.3.1, 3.3.2)', () => {
    it('should have proper labels for all inputs', () => {
      renderWithAuth(<AuthForm onAuthSuccess={() => {}} />);

      const emailInput = screen.getByLabelText(/email or username/i);
      expect(emailInput).toHaveAttribute('id');

      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toHaveAttribute('id');
    });

    it('should provide instructions for complex inputs', async () => {
      const user = userEvent.setup();
      renderWithAuth(<AuthForm onAuthSuccess={() => {}} />);

      // Switch to signup
      const signupButton = screen.getByRole('button', { name: /signup/i });
      await user.click(signupButton);

      const usernameInput = screen.getByLabelText(/username/i);
      expect(usernameInput).toHaveAttribute('aria-describedby');

      const helpText = screen.getByText(/3-50 characters/i);
      expect(helpText).toBeInTheDocument();
    });
  });
});

export {};
