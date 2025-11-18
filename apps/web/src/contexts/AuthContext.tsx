/**
 * Authentication Context
 * Manages user authentication state across the application
 */

import type React from 'react';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
// TODO: Deprecate api-client.ts in favor of secure api.ts
// import { apiClient } from '../utils/api-client';

interface User {
  id: string;
  username: string;
  email: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginLoading: boolean;
  registerLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
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
  const [user, setUser] = useState<User | null>(null);
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

  const login = async (email: string, password: string) => {
    setLoginLoading(true);
    try {
      const response = await api.login(email, password);

      if (response.success && response.data) {
        const userData = response.data.user;
        setUser(userData);
        sessionStorage.setItem('user', JSON.stringify(userData));
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
      const response = await api.register(username, email, password);

      if (response.success && response.data) {
        try {
          const userData = response.data.user || response.data;
          setUser(userData);
          sessionStorage.setItem('user', JSON.stringify(userData));
          setRegisterLoading(false);
          return { success: true };
        } catch {
          setRegisterLoading(false);
          return {
            success: false,
            error: 'Registration completed but failed to save session. Please log in.',
          };
        }
      }

      setRegisterLoading(false);
      return {
        success: false,
        error: response.error || 'Registration failed',
      };
    } catch {
      setRegisterLoading(false);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    sessionStorage.removeItem('user');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    loginLoading,
    registerLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
