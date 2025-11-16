/**
 * User Profile Component
 * Manages user settings, preferences, and profile information
 * WCAG 2.2 AA Compliant
 */

import React, { useState, useEffect, useCallback } from 'react';
import './UserProfile.css';

interface UserData {
  id: string;
  email: string;
  displayName?: string;
  role: string;
  createdAt: string;
  verifiedAge?: number;
  contentRating?: string;
}

interface UserStats {
  proposalsCreated: number;
  votesCast: number;
  debatesParticipated: number;
  reputation: number;
}

interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    largeText: boolean;
  };
}

interface UserProfileProps {
  userId: string;
  onUpdateProfile?: (data: Partial<UserData>) => void;
  onUpdatePreferences?: (preferences: UserPreferences) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  onUpdateProfile,
  onUpdatePreferences,
}) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    pushNotifications: false,
    theme: 'auto',
    language: 'en',
    accessibility: {
      reducedMotion: false,
      highContrast: false,
      largeText: false,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'settings'>('profile');
  const [isEditing, setIsEditing] = useState(false);

  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch user data');
      const data = await response.json();
      if (data.success) {
        setUserData(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [userId]);

  const fetchUserStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/users/${userId}/stats`);
      if (!response.ok) throw new Error('Failed to fetch user stats');
      const data = await response.json();
      if (data.success) {
        setUserStats(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [userId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchUserData(), fetchUserStats()]);
      setLoading(false);
    };
    loadData();
  }, [fetchUserData, fetchUserStats]);

  const handleProfileUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const displayName = formData.get('displayName') as string;

    if (displayName && onUpdateProfile) {
      onUpdateProfile({ displayName });
      setIsEditing(false);
    }
  };

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    if (onUpdatePreferences) {
      onUpdatePreferences(newPreferences);
    }
  };

  const handleAccessibilityChange = (key: keyof UserPreferences['accessibility'], value: boolean) => {
    const newPreferences = {
      ...preferences,
      accessibility: {
        ...preferences.accessibility,
        [key]: value,
      },
    };
    setPreferences(newPreferences);
    if (onUpdatePreferences) {
      onUpdatePreferences(newPreferences);
    }
  };

  if (loading) {
    return (
      <div className="user-profile" role="status" aria-live="polite">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile" role="alert">
        <p className="error">Error: {error}</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="user-profile">
        <p>User not found</p>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <header className="profile-header">
        <div className="profile-avatar" aria-label="User avatar">
          {userData.displayName?.[0]?.toUpperCase() || userData.email[0].toUpperCase()}
        </div>
        <div className="profile-info">
          <h1>{userData.displayName || userData.email}</h1>
          <p className="profile-role">{userData.role}</p>
          <p className="profile-joined">
            Joined: {new Date(userData.createdAt).toLocaleDateString()}
          </p>
        </div>
      </header>

      <nav className="profile-tabs" role="tablist" aria-label="Profile sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'profile'}
          aria-controls="profile-panel"
          id="profile-tab"
          onClick={() => setActiveTab('profile')}
          className={activeTab === 'profile' ? 'active' : ''}
        >
          Profile
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'stats'}
          aria-controls="stats-panel"
          id="stats-tab"
          onClick={() => setActiveTab('stats')}
          className={activeTab === 'stats' ? 'active' : ''}
        >
          Statistics
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'settings'}
          aria-controls="settings-panel"
          id="settings-tab"
          onClick={() => setActiveTab('settings')}
          className={activeTab === 'settings' ? 'active' : ''}
        >
          Settings
        </button>
      </nav>

      {activeTab === 'profile' && (
        <section
          id="profile-panel"
          role="tabpanel"
          aria-labelledby="profile-tab"
          className="profile-section"
        >
          <h2>Profile Information</h2>

          {!isEditing ? (
            <div className="profile-display">
              <div className="profile-field">
                <label>Email:</label>
                <span>{userData.email}</span>
              </div>
              <div className="profile-field">
                <label>Display Name:</label>
                <span>{userData.displayName || 'Not set'}</span>
              </div>
              <div className="profile-field">
                <label>Role:</label>
                <span>{userData.role}</span>
              </div>
              {userData.verifiedAge && (
                <div className="profile-field">
                  <label>Age Verified:</label>
                  <span>Yes</span>
                </div>
              )}
              {userData.contentRating && (
                <div className="profile-field">
                  <label>Content Rating:</label>
                  <span>{userData.contentRating}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="btn-primary"
              >
                Edit Profile
              </button>
            </div>
          ) : (
            <form className="profile-edit-form" onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label htmlFor="display-name">Display Name</label>
                <input
                  type="text"
                  id="display-name"
                  name="displayName"
                  defaultValue={userData.displayName}
                  maxLength={50}
                  placeholder="Enter display name"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {activeTab === 'stats' && (
        <section
          id="stats-panel"
          role="tabpanel"
          aria-labelledby="stats-tab"
          className="stats-section"
        >
          <h2>Your Statistics</h2>

          {userStats ? (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{userStats.proposalsCreated}</div>
                <div className="stat-label">Proposals Created</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{userStats.votesCast}</div>
                <div className="stat-label">Votes Cast</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{userStats.debatesParticipated}</div>
                <div className="stat-label">Debates Participated</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{userStats.reputation}</div>
                <div className="stat-label">Reputation Score</div>
              </div>
            </div>
          ) : (
            <p>No statistics available yet.</p>
          )}
        </section>
      )}

      {activeTab === 'settings' && (
        <section
          id="settings-panel"
          role="tabpanel"
          aria-labelledby="settings-tab"
          className="settings-section"
        >
          <h2>Settings & Preferences</h2>

          <div className="settings-group">
            <h3>Notifications</h3>
            <div className="setting-item">
              <label htmlFor="email-notifications">
                <input
                  type="checkbox"
                  id="email-notifications"
                  checked={preferences.emailNotifications}
                  onChange={e => handlePreferenceChange('emailNotifications', e.target.checked)}
                />
                Email Notifications
              </label>
            </div>
            <div className="setting-item">
              <label htmlFor="push-notifications">
                <input
                  type="checkbox"
                  id="push-notifications"
                  checked={preferences.pushNotifications}
                  onChange={e => handlePreferenceChange('pushNotifications', e.target.checked)}
                />
                Push Notifications
              </label>
            </div>
          </div>

          <div className="settings-group">
            <h3>Appearance</h3>
            <div className="setting-item">
              <label htmlFor="theme-select">Theme</label>
              <select
                id="theme-select"
                value={preferences.theme}
                onChange={e => handlePreferenceChange('theme', e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>
          </div>

          <div className="settings-group">
            <h3>Accessibility</h3>
            <div className="setting-item">
              <label htmlFor="reduced-motion">
                <input
                  type="checkbox"
                  id="reduced-motion"
                  checked={preferences.accessibility.reducedMotion}
                  onChange={e => handleAccessibilityChange('reducedMotion', e.target.checked)}
                />
                Reduce Motion
              </label>
              <p className="setting-description">Minimize animations and transitions</p>
            </div>
            <div className="setting-item">
              <label htmlFor="high-contrast">
                <input
                  type="checkbox"
                  id="high-contrast"
                  checked={preferences.accessibility.highContrast}
                  onChange={e => handleAccessibilityChange('highContrast', e.target.checked)}
                />
                High Contrast
              </label>
              <p className="setting-description">Increase contrast for better visibility</p>
            </div>
            <div className="setting-item">
              <label htmlFor="large-text">
                <input
                  type="checkbox"
                  id="large-text"
                  checked={preferences.accessibility.largeText}
                  onChange={e => handleAccessibilityChange('largeText', e.target.checked)}
                />
                Large Text
              </label>
              <p className="setting-description">Increase text size throughout the app</p>
            </div>
          </div>

          <div className="settings-group">
            <h3>Language</h3>
            <div className="setting-item">
              <label htmlFor="language-select">Preferred Language</label>
              <select
                id="language-select"
                value={preferences.language}
                onChange={e => handlePreferenceChange('language', e.target.value)}
              >
                <option value="en">English</option>
                <option value="cy">Welsh (Cymraeg)</option>
                <option value="gd">Scottish Gaelic (Gàidhlig)</option>
              </select>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default UserProfile;
