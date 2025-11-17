/**
 * Main Game Interface
 * Integrates all game systems: Parliament, Government, Judiciary, Media, Elections
 * WCAG 2.2 AA Compliant
 */

import { type FC, useCallback, useEffect, useState } from 'react';
import ElectionsCenter from './Elections/ElectionsCenter';
import GovernmentDashboard from './Government/GovernmentDashboard';
import JudiciarySystem from './Judiciary/JudiciarySystem';
import './MainGame.css';
import MediaCenter from './Media/MediaCenter';
import ParliamentChamber from './Parliament/ParliamentChamber';

interface MainGameProps {
  userId: string;
  username: string;
  onLogout: () => void;
}

type GameView =
  | 'overview'
  | 'parliament'
  | 'government'
  | 'judiciary'
  | 'media'
  | 'elections'
  | 'profile';

interface GameData {
  name?: string;
  players?: { id: string; name: string }[];
  currentTurn?: number;
  status?: string;
}

const MainGame: FC<MainGameProps> = ({ userId, username, onLogout }) => {
  const [currentView, setCurrentView] = useState<GameView>('overview');
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);

  const fetchGameData = useCallback(async () => {
    try {
      // Fetch simulation state (single world)
      const response = await fetch('/api/simulation/state');
      if (!response.ok) throw new Error('Failed to fetch simulation data');
      const data = await response.json();
      if (data.success) {
        setGameData(data.data);
      }
    } catch (error) {
      console.error('Error fetching simulation data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGameData();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchGameData, 30000);
    return () => clearInterval(interval);
  }, [fetchGameData]);

  const addNotification = (message: string) => {
    setNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setNotifications(prev => prev.slice(1));
    }, 5000);
  };

  // Placeholder handlers for future implementation
  const _handleParliamentAction = async (_action: Record<string, unknown>) => {
    try {
      // Handle parliament actions
      addNotification('Parliament action submitted');
      await fetchGameData();
    } catch (error) {
      console.error('Parliament action failed:', error);
      addNotification('Action failed');
    }
  };

  const _handleGovernmentAction = async (_action: Record<string, unknown>) => {
    try {
      // Handle government actions
      addNotification('Government action submitted');
      await fetchGameData();
    } catch (error) {
      console.error('Government action failed:', error);
      addNotification('Action failed');
    }
  };

  const _handleElectionAction = async (_action: Record<string, unknown>) => {
    try {
      // Handle election actions
      addNotification('Election action submitted');
      await fetchGameData();
    } catch (error) {
      console.error('Election action failed:', error);
      addNotification('Action failed');
    }
  };

  if (loading) {
    return (
      <output className="main-game loading" aria-live="polite">
        <output className="loading-spinner" />
        <p>Loading game...</p>
      </output>
    );
  }

  return (
    <div className="main-game">
      {/* Top Navigation Bar */}
      <header className="game-header">
        <div className="header-content">
          <div className="game-title">
            <h1>Political Sphere</h1>
            <span className="game-status">UK Political Simulation</span>
            <span className="user-info">Welcome, {username}</span>
          </div>

          <nav className="header-nav" aria-label="Main navigation">
            <button
              type="button"
              onClick={() => setCurrentView('overview')}
              className={currentView === 'overview' ? 'active' : ''}
              aria-current={currentView === 'overview' ? 'page' : undefined}
            >
              <span className="nav-icon">🏛️</span>
              Overview
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('parliament')}
              className={currentView === 'parliament' ? 'active' : ''}
              aria-current={currentView === 'parliament' ? 'page' : undefined}
            >
              <span className="nav-icon">⚖️</span>
              Parliament
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('government')}
              className={currentView === 'government' ? 'active' : ''}
              aria-current={currentView === 'government' ? 'page' : undefined}
            >
              <span className="nav-icon">🏢</span>
              Government
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('judiciary')}
              className={currentView === 'judiciary' ? 'active' : ''}
              aria-current={currentView === 'judiciary' ? 'page' : undefined}
            >
              <span className="nav-icon">⚖️</span>
              Judiciary
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('media')}
              className={currentView === 'media' ? 'active' : ''}
              aria-current={currentView === 'media' ? 'page' : undefined}
            >
              <span className="nav-icon">📰</span>
              Media
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('elections')}
              className={currentView === 'elections' ? 'active' : ''}
              aria-current={currentView === 'elections' ? 'page' : undefined}
            >
              <span className="nav-icon">🗳️</span>
              Elections
            </button>
            <button
              type="button"
              onClick={() => setCurrentView('profile')}
              className={currentView === 'profile' ? 'active' : ''}
              aria-current={currentView === 'profile' ? 'page' : undefined}
            >
              <span className="nav-icon">👤</span>
              Profile
            </button>
          </nav>

          <button type="button" onClick={onLogout} className="btn-logout" aria-label="Log out">
            Log Out
          </button>
        </div>
      </header>

      {/* Notifications */}
      {notifications.length > 0 && (
        <output className="notifications" aria-live="polite" aria-atomic="true">
          {notifications.map(notification => (
            <div key={notification} className="notification">
              {notification}
            </div>
          ))}
        </output>
      )}

      {/* Main Content Area */}
      <main className="game-content">
        {currentView === 'overview' && (
          <div className="overview-view">
            <h2>Game Overview</h2>

            <div className="overview-grid">
              <section className="overview-card" aria-labelledby="parliament-overview">
                <h3 id="parliament-overview">Parliament</h3>
                <p>Active motions, debates, and voting sessions</p>
                <button
                  type="button"
                  onClick={() => setCurrentView('parliament')}
                  className="btn-primary"
                >
                  Go to Parliament
                </button>
              </section>

              <section className="overview-card" aria-labelledby="government-overview">
                <h3 id="government-overview">Government</h3>
                <p>Cabinet, ministers, and executive actions</p>
                <button
                  type="button"
                  onClick={() => setCurrentView('government')}
                  className="btn-primary"
                >
                  Go to Government
                </button>
              </section>

              <section className="overview-card" aria-labelledby="judiciary-overview">
                <h3 id="judiciary-overview">Judiciary</h3>
                <p>Legal cases, rulings, and constitutional review</p>
                <button
                  type="button"
                  onClick={() => setCurrentView('judiciary')}
                  className="btn-primary"
                >
                  Go to Judiciary
                </button>
              </section>

              <section className="overview-card" aria-labelledby="media-overview">
                <h3 id="media-overview">Media</h3>
                <p>Press releases, polls, and public opinion</p>
                <button
                  type="button"
                  onClick={() => setCurrentView('media')}
                  className="btn-primary"
                >
                  Go to Media
                </button>
              </section>

              <section className="overview-card" aria-labelledby="elections-overview">
                <h3 id="elections-overview">Elections</h3>
                <p>Campaigns, constituencies, and voting</p>
                <button
                  type="button"
                  onClick={() => setCurrentView('elections')}
                  className="btn-primary"
                >
                  Go to Elections
                </button>
              </section>

              <section className="overview-card" aria-labelledby="profile-overview">
                <h3 id="profile-overview">Your Profile</h3>
                <p>Settings, achievements, and statistics</p>
                <button
                  type="button"
                  onClick={() => setCurrentView('profile')}
                  className="btn-primary"
                >
                  Go to Profile
                </button>
              </section>
            </div>

            <section className="recent-activity" aria-labelledby="recent-activity-heading">
              <h3 id="recent-activity-heading">Recent Activity</h3>
              <ul className="activity-list">
                <li>No recent activity</li>
              </ul>
            </section>
          </div>
        )}

        {currentView === 'parliament' && (
          <ParliamentChamber userId={userId} onError={addNotification} />
        )}

        {currentView === 'government' && (
          <GovernmentDashboard userId={userId} onError={addNotification} />
        )}

        {currentView === 'judiciary' && (
          <JudiciarySystem userId={userId} onError={addNotification} />
        )}

        {currentView === 'media' && <MediaCenter userId={userId} onError={addNotification} />}

        {currentView === 'elections' && (
          <ElectionsCenter userId={userId} onError={addNotification} />
        )}

        {currentView === 'profile' && (
          <div className="placeholder-view">
            <h2>User Profile</h2>
            <p>Profile management coming soon...</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="game-footer">
        <p>Political Sphere - UK Political Simulation Game</p>
        <p className="footer-meta">
          Active Players: {gameData?.players?.length || 0} | Current Turn:{' '}
          {gameData?.currentTurn || 1}
        </p>
      </footer>
    </div>
  );
};

export default MainGame;
