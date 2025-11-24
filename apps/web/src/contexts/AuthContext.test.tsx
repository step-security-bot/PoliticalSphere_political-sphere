import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

// Mock the api
vi.mock('../services/api', () => ({
  api: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

import { api } from '../services/api';
const mockApi = vi.mocked(api);

// Test component to use the context
const TestComponent = () => {
  const { user, isAuthenticated, login, logout, accessToken } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.username : 'null'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="accessToken">{accessToken || 'null'}</div>
      <button type="button" onClick={() => login('test@example.com', 'password')}>
        Login
      </button>
      <button type="button" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('provides initial auth state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('null');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('accessToken')).toHaveTextContent('null');
  });

  it('handles successful login', async () => {
    mockApi.login.mockResolvedValue({
      success: true,
      data: { token: 'mock-token' },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    screen.getByRole('button', { name: /Login/i }).click();

    await waitFor(() => {
      expect(mockApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
      expect(screen.getByTestId('accessToken')).toHaveTextContent('mock-token');
    });
  });

  it('handles login failure', async () => {
    mockApi.login.mockResolvedValue({
      success: false,
      error: 'Invalid credentials',
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    screen.getByRole('button', { name: /Login/i }).click();

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    });
  });

  it('handles logout', async () => {
    mockApi.login.mockResolvedValue({
      success: true,
      data: { token: 'mock-token' },
    });
    mockApi.logout.mockResolvedValue({});

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Login first
    screen.getByRole('button', { name: /Login/i }).click();
    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });

    // Then logout
    screen.getByRole('button', { name: /Logout/i }).click();
    await waitFor(() => {
      expect(mockApi.logout).toHaveBeenCalled();
      expect(screen.getByTestId('user')).toHaveTextContent('null');
      expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
      expect(screen.getByTestId('accessToken')).toHaveTextContent('null');
    });
  });

  it('restores user from sessionStorage on mount', () => {
    sessionStorage.setItem('user', JSON.stringify({ id: '1', username: 'stored-user' }));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('stored-user');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
  });
});
