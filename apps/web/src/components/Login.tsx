/**
 * Login Component - DEPRECATED
 * This component has been replaced by AuthForm.tsx
 * Kept for backward compatibility during migration
 * TODO: Remove this component once AuthForm is fully integrated
 */

import AuthForm from './Auth/AuthForm';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  return <AuthForm onAuthSuccess={onLogin} />;
}
