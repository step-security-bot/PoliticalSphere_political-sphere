/**
 * Toast Context
 * Manages toast notifications across the application
 * Provides consistent toast display and management
 */

import type React from 'react';
import { createContext, type ReactNode, useContext, useState, useCallback } from 'react';
import { ToastContainer, type ToastMessage, type ToastType } from '../components/common/Toast';

interface ToastContextType {
  toasts: ToastMessage[];
  showToast: (
    type: ToastType,
    title: string,
    message?: string,
    options?: {
      duration?: number;
      persistent?: boolean;
    }
  ) => string;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'top-right',
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (
      type: ToastType,
      title: string,
      message?: string,
      options: { duration?: number; persistent?: boolean } = {}
    ): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newToast: ToastMessage = {
        id,
        type,
        title,
        message: message || '',
        ...(options.duration !== undefined && { duration: options.duration }),
        ...(options.persistent !== undefined && { persistent: options.persistent }),
      };

      setToasts(prev => {
        const updated = [newToast, ...prev];
        // Limit the number of toasts
        return updated.slice(0, maxToasts);
      });

      return id;
    },
    [maxToasts]
  );

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextType = {
    toasts,
    showToast,
    hideToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} position={position} />
    </ToastContext.Provider>
  );
};

export default ToastContext;
