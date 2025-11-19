/**
 * ConfirmDialog Component
 * Modal dialog for user confirmations
 * WCAG 2.2 AA Compliant
 */

import type React from 'react';
import { useEffect, useRef } from 'react';
import './ConfirmDialog.css';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'danger';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  loading = false,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
      // Focus the confirm button for keyboard navigation
      setTimeout(() => confirmButtonRef.current?.focus(), 100);
    } else {
      dialog.close();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [isOpen, onCancel]);

  const handleBackdropClick = (event: React.MouseEvent) => {
    // Close dialog if clicked on backdrop
    if (event.target === dialogRef.current) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      onClick={handleBackdropClick}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      role="alertdialog"
    >
      <div className="confirm-dialog-content">
        <header className="confirm-dialog-header">
          <h2 id="confirm-dialog-title">{title}</h2>
        </header>

        <div className="confirm-dialog-body">
          <p id="confirm-dialog-message">{message}</p>
        </div>

        <footer className="confirm-dialog-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={loading}
            aria-label={cancelText}
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            className={`btn-${variant === 'danger' ? 'danger' : 'primary'}`}
            onClick={onConfirm}
            disabled={loading}
            aria-label={confirmText}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </footer>
      </div>
    </dialog>
  );
};

export default ConfirmDialog;
