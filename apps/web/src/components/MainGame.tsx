/**
 * Main Game Interface
 * Integrates all game systems: Parliament, Government, Judiciary, Media, Elections
 * WCAG 2.2 AA Compliant
 */

import React, { useState, useEffect, useCallback } from 'react';
import ParliamentChamber from './Parliament/ParliamentChamber';
import GovernmentDashboard from './Government/GovernmentDashboard';
import ElectionsManager from './Elections/ElectionsManager';
import JudiciarySystem from './Judiciary/JudiciarySystem';
import MediaSystem from './Media/MediaSystem';
import UserProfile from './Profile/UserProfile';
import './MainGame.css';

interface MainGameProps {
  gameId: string;
  onLeaveGame: () => void;
}

type GameView = 'overview' | 'parliament' | 'government' | 'judiciary' | 'media' | 'elections' | 'profile';

const MainGame: React.FC<MainGameProps> = ({ gameId, onLeaveGame }) => {
  const [currentView, setCurrentView] = useState<GameView>('overview');
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<string[]>([]);

  const fetchGameData = useCallback(async () => {
    try {
      const response = await fetch(`/api/games/${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch game data');
      const data = await response.json();
      if (data.success) {
        setGameData(data.data);
      }
    } catch (error) {
      console.error('Error fetching game data:', error);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

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

  const handleParliamentAction = async (action: any) => {
    try {
      // Handle parliament actions
      addNotification('Parliament action submitted');
      await fetchGameData();
    } catch (error) {
      console.error('Parliament action failed:', error);
      addNotification('Action failed');
    }
  };

  const handleGovernmentAction = async (action: any) => {
    try {
      // Handle government actions
      addNotification('Government action submitted');
      await fetchGameData();
    } catch (error) {
      console.error('Government action failed:', error);
      addNotification('Action failed');
    }
  };

  const handleElectionAction = async (action: any) => {
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
      <div className="main-game loading" role="status" aria-live="polite">
        <div className="loading-spinner" />
        <p>Loading game...</p>
      </div>
    );
  }

  return (
    <div className="main-game">
      {/* Top Navigation Bar */}
      <header className="game-header" role="banner">
        <div className="header-content">
          <div className="game-title">
            <h1>{gameData?.name || 'Political Sphere'}</h1>
            <span className="game-status">Active Game</span>
          </div>
          
          <nav className="header-nav" role="navigation" aria-label="Main navigation">
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

          <button
            type="button"
            onClick={onLeaveGame}
            className="btn-leave"
            aria-label="Leave game"
          >
            Leave Game
          </button>
        </div>
      </header>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notifications" role="status" aria-live="polite" aria-atomic="true">
          {notifications.map((notification, index) => (
            <div key={index} className="notification">
              {notification}
            </div>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <main className="game-content" role="main">
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
          <ParliamentChamber
            gameId={gameId}
            onMotionCreate={handleParliamentAction}
            onVote={handleParliamentAction}
          />
        )}

        {currentView === 'government' && (
          <GovernmentDashboard
            gameId={gameId}
            onAppointMinister={handleGovernmentAction}
            onIssueAction={handleGovernmentAction}
          />
        )}

        {currentView === 'judiciary' && (
          <JudiciarySystem
            gameId={gameId}
            onFileCase={handleGovernmentAction}
            onIssueRuling={handleGovernmentAction}
          />
        )}

        {currentView === 'media' && (
          <MediaSystem
            gameId={gameId}
            onPublishRelease={handleGovernmentAction}
            onCreatePoll={handleGovernmentAction}
            onVotePoll={handleGovernmentAction}
          />
        )}

        {currentView === 'elections' && (
          <ElectionsManager
            gameId={gameId}
            onCreateElection={handleElectionAction}
            onCastVote={handleElectionAction}
          />
        )}

        {currentView === 'profile' && (
          <UserProfile
            userId="current-user-id"
            onUpdateProfile={handleGovernmentAction}
            onUpdatePreferences={handleGovernmentAction}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="game-footer" role="contentinfo">
        <p>Political Sphere - UK Political Simulation Game</p>
        <p className="footer-meta">
          Game ID: {gameId} | Players: {gameData?.players?.length || 0}
        </p>
      </footer>
    </div>
  );
};

export default MainGame;
