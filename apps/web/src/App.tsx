/**
 * Main App Component
 * Single-World Political Simulation
 * Users log in and directly enter the persistent simulation
 */

import { useState } from 'react';
import './App.css';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import MainGame from './components/MainGame';
import { AuthProvider, useAuth } from './contexts/AuthContext';

type Screen = 'login' | 'register' | 'simulation';

function AppContent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [screen, setScreen] = useState<Screen>('login');

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Loading Political Sphere...</p>
      </div>
    );
  }

  // Not authenticated - show login/register
  if (!isAuthenticated) {
    if (screen === 'register') {
      return (
        <Register
          onRegisterSuccess={() => setScreen('simulation')}
          onSwitchToLogin={() => setScreen('login')}
        />
      );
    }

    return (
      <Login
        onLoginSuccess={() => setScreen('simulation')}
        onSwitchToRegister={() => setScreen('register')}
      />
    );
  }

  // Authenticated - show simulation
  // Single world simulation - no game ID needed
  return (
    <MainGame
      userId={user?.id || ''}
      username={user?.username || 'Player'}
      onLogout={async () => {
        await logout();
        setScreen('login');
      }}
    />
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
