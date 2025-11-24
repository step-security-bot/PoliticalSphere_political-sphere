/**
 * Authentication Context
 * Manages user authentication state across the application
 */

import type React from 'react';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
// TODO: Deprecate api-client.ts in favor of secure api.ts
// import { apiClient } from '../utils/api-client';

const emitAuthWarning = (detail: unknown) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth-warning', { detail }));
  }
};

interface AuthUser {
  id: string;
  username: string;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginLoading: boolean;
  registerLoading: boolean;
  accessToken: string | null;
  login: (
    emailOrUsername: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = sessionStorage.getItem('user');

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        sessionStorage.removeItem('user');
      }
    }
    // No stored user found - user remains null, which is expected for new sessions

    setIsLoading(false);
  }, []);

  const login = async (emailOrUsername: string, password: string) => {
    setLoginLoading(true);
    try {
      const response = await api.login({ email: emailOrUsername, password });

      if (response.success && response.data) {
        // For now, decode token to get user info or use a separate endpoint
        // TODO: Implement proper user info retrieval
        const userData = { id: 'temp', username: emailOrUsername, email: emailOrUsername };
        setUser(userData);
        setAccessToken(response.data.token);
        // Avoid storing sensitive data in sessionStorage
        sessionStorage.setItem(
          'user',
          JSON.stringify({ id: userData.id, username: userData.username })
        );
        setLoginLoading(false);
        return { success: true };
      }

      setLoginLoading(false);
      return {
        success: false,
        error: response.error || 'Login failed',
      };
    } catch {
      setLoginLoading(false);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setRegisterLoading(true);
    try {
      const response = await api.register({ username, email, password });

      if (response.success && response.data) {
        // For now, create user data from registration response
        // TODO: Implement proper user info retrieval
        const userData = {
          id: 'temp',
          username,
          email,
        };
        setUser(userData);
        sessionStorage.setItem('user', JSON.stringify(userData));
        setRegisterLoading(false);
        return { success: true };
      }

      setRegisterLoading(false);
      return {
        success: false,
        error: response.error || 'Registration failed',
      };
    } catch (error) {
      setRegisterLoading(false);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      // Even if logout fails, we should clear local state
      emitAuthWarning({ message: 'Logout API call failed', error });
    }
    setUser(null);
    setAccessToken(null);
    sessionStorage.removeItem('user');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    loginLoading,
    registerLoading,
    accessToken,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
