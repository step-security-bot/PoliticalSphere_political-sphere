/**
 * Loading Context
 * Manages global loading states across the application
 * Provides consistent loading indicators and state management
 */

import type React from 'react';
import { createContext, type ReactNode, useContext, useState, useCallback } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingContextType {
  loadingStates: LoadingState;
  isLoading: (key?: string) => boolean;
  setLoading: (key: string, loading: boolean) => void;
  startLoading: (key: string) => void;
  stopLoading: (key: string) => void;
  withLoading: <T>(key: string, asyncFn: () => Promise<T>) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const isLoading = useCallback(
    (key?: string) => {
      if (!key) {
        // Check if any loading state is active
        return Object.values(loadingStates).some(loading => loading);
      }
      return loadingStates[key] || false;
    },
    [loadingStates]
  );

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading,
    }));
  }, []);

  const startLoading = useCallback(
    (key: string) => {
      setLoading(key, true);
    },
    [setLoading]
  );

  const stopLoading = useCallback(
    (key: string) => {
      setLoading(key, false);
    },
    [setLoading]
  );

  const withLoading = useCallback(
    async <T,>(key: string, asyncFn: () => Promise<T>): Promise<T> => {
      startLoading(key);
      try {
        const result = await asyncFn();
        return result;
      } finally {
        stopLoading(key);
      }
    },
    [startLoading, stopLoading]
  );

  const value: LoadingContextType = {
    loadingStates,
    isLoading,
    setLoading,
    startLoading,
    stopLoading,
    withLoading,
  };

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
};

export default LoadingContext;
