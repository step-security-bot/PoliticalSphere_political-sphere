/**
 * Main App Component
 * Single-World Political Simulation
 * Users log in and directly enter the persistent simulation
 */

import './App.css';
import AuthForm from './components/Auth/AuthForm';
import MainGame from './components/MainGame';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Loading Political Sphere...</p>
      </div>
    );
  }

  // Not authenticated - show unified auth form
  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={() => {}} />;
  }

  // Authenticated - show simulation
  // Single world simulation - no game ID needed
  return (
    <MainGame userId={user?.id || ''} username={user?.username || 'Player'} onLogout={logout} />
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
