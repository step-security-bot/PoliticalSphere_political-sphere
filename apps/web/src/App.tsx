/**
 * Main App Component
 * Handles authentication and routing
 */

import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { Lobby } from './components/Lobby';
import MainGame from './components/MainGame';
import './App.css';

type Screen = 'login' | 'register' | 'lobby' | 'game';

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [screen, setScreen] = useState<Screen>('login');
  const [currentGameId, setCurrentGameId] = useState<string>('demo-game-1');

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // Not authenticated - show login/register
  if (!isAuthenticated) {
    if (screen === 'register') {
      return (
        <Register
          onRegisterSuccess={() => setScreen('lobby')}
          onSwitchToLogin={() => setScreen('login')}
        />
      );
    }

    return (
      <Login
        onLoginSuccess={() => setScreen('lobby')}
        onSwitchToRegister={() => setScreen('register')}
      />
    );
  }

  // Authenticated - show lobby or game
  if (screen === 'lobby') {
    return (
      <Lobby
        onJoinGame={(gameId: string) => {
          setCurrentGameId(gameId);
          setScreen('game');
        }}
      />
    );
  }

  if (screen === 'game') {
    return (
      <MainGame
        gameId={currentGameId}
        onLeaveGame={() => setScreen('lobby')}
      />
    );
  }

  return <div>Error: Invalid state</div>;
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
