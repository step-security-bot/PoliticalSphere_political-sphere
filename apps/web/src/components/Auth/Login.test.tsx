import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Login from './Login';
import { AuthProvider } from '../../contexts/AuthContext';
import { LoadingProvider } from '../../contexts/LoadingContext';

// Mock the contexts
const mockLogin = vi.fn();
const mockOnLoginSuccess = vi.fn();
const mockOnSwitchToRegister = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    login: mockLogin,
  }),
}));

vi.mock('../../contexts/LoadingContext', () => ({
  LoadingProvider: ({ children }: { children: React.ReactNode }) => children,
  useLoading: () => ({
    isLoading: vi.fn(() => false),
  }),
}));

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(
      <AuthProvider>
        <LoadingProvider>
          <Login onLoginSuccess={mockOnLoginSuccess} onSwitchToRegister={mockOnSwitchToRegister} />
        </LoadingProvider>
      </AuthProvider>
    );

    expect(screen.getByLabelText(/Email Address or Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log In/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Forgot password/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Don't have an account\? Register/i })
    ).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    mockLogin.mockResolvedValue({ success: true });

    render(
      <AuthProvider>
        <LoadingProvider>
          <Login onLoginSuccess={mockOnLoginSuccess} onSwitchToRegister={mockOnSwitchToRegister} />
        </LoadingProvider>
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/Email Address or Username/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^Password/), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Log In/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockOnLoginSuccess).toHaveBeenCalled();
    });
  });

  it('displays error on login failure', async () => {
    mockLogin.mockResolvedValue({ success: false, error: 'Invalid credentials' });

    render(
      <AuthProvider>
        <LoadingProvider>
          <Login onLoginSuccess={mockOnLoginSuccess} onSwitchToRegister={mockOnSwitchToRegister} />
        </LoadingProvider>
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/Email Address or Username/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^Password/), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Log In/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
  });

  it('toggles password visibility', () => {
    render(
      <AuthProvider>
        <LoadingProvider>
          <Login onLoginSuccess={mockOnLoginSuccess} onSwitchToRegister={mockOnSwitchToRegister} />
        </LoadingProvider>
      </AuthProvider>
    );

    const passwordInput = screen.getByLabelText(/^Password/);
    const toggleButton = screen.getByLabelText(/Show password/i);

    expect(passwordInput).toHaveAttribute('type', 'password');

    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText(/Hide password/i)).toBeInTheDocument();
  });

  it('calls onSwitchToRegister when register button is clicked', () => {
    render(
      <AuthProvider>
        <LoadingProvider>
          <Login onLoginSuccess={mockOnLoginSuccess} onSwitchToRegister={mockOnSwitchToRegister} />
        </LoadingProvider>
      </AuthProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Don't have an account\? Register/i }));
    expect(mockOnSwitchToRegister).toHaveBeenCalled();
  });
});
