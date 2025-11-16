/**
 * Parliament Chamber Component
 * Displays parliamentary chamber with debates, motions, and voting
 */

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import './ParliamentChamber.css';

interface Chamber {
  id: string;
  gameId: string;
  type: 'commons' | 'lords';
  name: string;
  maxSeats: number;
  quorumPercentage: number;
  seats: string[];
  status: string;
  createdAt: string;
}

interface Motion {
  id: string;
  gameId: string;
  chamberId: string;
  proposerId: string;
  type: 'debate' | 'vote' | 'amendment' | 'procedural';
  title: string;
  description: string;
  status: 'proposed' | 'debate' | 'voting' | 'completed';
  createdAt: string;
  result?: 'passed' | 'failed';
}

interface VoteResults {
  total: number;
  aye: number;
  no: number;
  abstain: number;
}

interface ParliamentChamberProps {
  gameId: string;
  userId: string;
  onError?: (error: string) => void;
}

export const ParliamentChamber: React.FC<ParliamentChamberProps> = ({
  gameId,
  userId,
  onError,
}) => {
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [selectedChamber, setSelectedChamber] = useState<Chamber | null>(null);
  const [motions, setMotions] = useState<Motion[]>([]);
  const [selectedMotion, setSelectedMotion] = useState<Motion | null>(null);
  const [voteResults, setVoteResults] = useState<VoteResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateMotion, setShowCreateMotion] = useState(false);

  // Form state for creating motions
  const [motionForm, setMotionForm] = useState({
    type: 'debate' as Motion['type'],
    title: '',
    description: '',
  });

  const fetchChambers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/parliament/chambers?gameId=${gameId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chambers');
      }

      const data = await response.json();
      setChambers(data.data || []);
      
      // Auto-select first chamber
      if (data.data && data.data.length > 0) {
        setSelectedChamber(data.data[0]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch chambers';
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }, [gameId, onError]);

  const fetchMotions = useCallback(async (chamberId: string) => {
    try {
      const response = await fetch(`/api/parliament/motions?chamberId=${chamberId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch motions');
      }

      const data = await response.json();
      setMotions(data.data || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch motions';
      onError?.(message);
    }
  }, [onError]);

  const fetchVoteResults = useCallback(async (motionId: string) => {
    try {
      const response = await fetch(`/api/parliament/votes/results/${motionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch vote results');
      }

      const data = await response.json();
      setVoteResults(data.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch vote results';
      onError?.(message);
    }
  }, [onError]);

  // Fetch chambers on mount
  useEffect(() => {
    fetchChambers();
  }, [fetchChambers]);

  // Fetch motions when chamber is selected
  useEffect(() => {
    if (selectedChamber) {
      fetchMotions(selectedChamber.id);
    }
  }, [selectedChamber, fetchMotions]);

  // Fetch vote results when motion is selected
  useEffect(() => {
    if (selectedMotion && selectedMotion.status === 'voting') {
      fetchVoteResults(selectedMotion.id);
      // Poll for updates every 5 seconds
      const interval = setInterval(() => {
        fetchVoteResults(selectedMotion.id);
      }, 5000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [selectedMotion, fetchVoteResults]);

  const handleCreateMotion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedChamber) {
      onError?.('Please select a chamber first');
      return;
    }

    try {
      const response = await fetch('/api/parliament/motions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          gameId,
          chamberId: selectedChamber.id,
          proposerId: userId,
          ...motionForm,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create motion');
      }

      // Reset form and refresh motions
      setMotionForm({ type: 'debate', title: '', description: '' });
      setShowCreateMotion(false);
      fetchMotions(selectedChamber.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create motion';
      onError?.(message);
    }
  };

  const handleCastVote = async (motionId: string, vote: 'aye' | 'no' | 'abstain') => {
    try {
      const response = await fetch('/api/parliament/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          motionId,
          vote,
          userId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cast vote');
      }

      // Refresh vote results
      fetchVoteResults(motionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cast vote';
      onError?.(message);
    }
  };

  if (loading) {
    return (
      <div className="parliament-chamber loading" aria-live="polite">
        <p>Loading Parliament...</p>
      </div>
    );
  }

  if (chambers.length === 0) {
    return (
      <div className="parliament-chamber empty">
        <h2>No Parliamentary Chambers</h2>
        <p>No chambers have been created for this game yet.</p>
      </div>
    );
  }

  return (
    <div className="parliament-chamber">
      <header className="parliament-header">
        <h1>Parliament</h1>
        <nav aria-label="Chamber selection">
          {chambers.map(chamber => (
            <button
              type="button"
              key={chamber.id}
              onClick={() => setSelectedChamber(chamber)}
              className={selectedChamber?.id === chamber.id ? 'active' : ''}
              aria-pressed={selectedChamber?.id === chamber.id}
            >
              {chamber.name}
            </button>
          ))}
        </nav>
      </header>

      {selectedChamber && (
        <main className="chamber-content">
          <section className="chamber-info">
            <h2>{selectedChamber.name}</h2>
            <dl>
              <dt>Type:</dt>
              <dd>{selectedChamber.type === 'commons' ? 'House of Commons' : 'House of Lords'}</dd>
              <dt>Seats:</dt>
              <dd>{selectedChamber.seats.length} / {selectedChamber.maxSeats}</dd>
              <dt>Quorum:</dt>
              <dd>{selectedChamber.quorumPercentage}%</dd>
            </dl>
          </section>

          <section className="motions-section">
            <header className="motions-header">
              <h2>Motions</h2>
              <button
                type="button"
                onClick={() => setShowCreateMotion(!showCreateMotion)}
                className="btn-primary"
                aria-expanded={showCreateMotion}
              >
                {showCreateMotion ? 'Cancel' : 'Propose Motion'}
              </button>
            </header>

            {showCreateMotion && (
              <form onSubmit={handleCreateMotion} className="motion-form">
                <div className="form-group">
                  <label htmlFor="motion-type">Type:</label>
                  <select
                    id="motion-type"
                    value={motionForm.type}
                    onChange={e => setMotionForm({ ...motionForm, type: e.target.value as Motion['type'] })}
                    required
                  >
                    <option value="debate">Debate</option>
                    <option value="vote">Vote</option>
                    <option value="amendment">Amendment</option>
                    <option value="procedural">Procedural</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="motion-title">Title:</label>
                  <input
                    id="motion-title"
                    type="text"
                    value={motionForm.title}
                    onChange={e => setMotionForm({ ...motionForm, title: e.target.value })}
                    required
                    maxLength={200}
                    aria-describedby="title-help"
                  />
                  <span id="title-help" className="help-text">
                    Brief summary of the motion (max 200 characters)
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="motion-description">Description:</label>
                  <textarea
                    id="motion-description"
                    value={motionForm.description}
                    onChange={e => setMotionForm({ ...motionForm, description: e.target.value })}
                    required
                    maxLength={5000}
                    rows={6}
                    aria-describedby="description-help"
                  />
                  <span id="description-help" className="help-text">
                    Detailed explanation of the motion (max 5000 characters)
                  </span>
                </div>

                <button type="submit" className="btn-primary">
                  Submit Motion
                </button>
              </form>
            )}

            <ul className="motions-list">
              {motions.length === 0 ? (
                <p className="empty-state">No motions have been proposed yet.</p>
              ) : (
                motions.map(motion => (
                  <li
                    key={motion.id}
                    className={`motion-card ${selectedMotion?.id === motion.id ? 'selected' : ''}`}
                    onClick={() => setSelectedMotion(motion)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedMotion(motion);
                      }
                    }}
                  >
                    <header>
                      <h3>{motion.title}</h3>
                      <span className={`status-badge status-${motion.status}`}>
                        {motion.status}
                      </span>
                    </header>
                    <p>{motion.description}</p>
                    <footer>
                      <span className="motion-type">{motion.type}</span>
                      <time dateTime={motion.createdAt}>
                        {new Date(motion.createdAt).toLocaleDateString()}
                      </time>
                    </footer>
                  </li>
                ))
              )}
            </ul>
          </section>

          {selectedMotion && (
            <aside className="motion-details">
              <h2>Motion Details</h2>
              <article>
                <header>
                  <h3>{selectedMotion.title}</h3>
                  <span className={`status-badge status-${selectedMotion.status}`}>
                    {selectedMotion.status}
                  </span>
                </header>

                <div className="motion-content">
                  <p>{selectedMotion.description}</p>
                </div>

                {selectedMotion.status === 'voting' && (
                  <section className="voting-section">
                    <h4>Cast Your Vote</h4>
                    <fieldset className="vote-buttons" aria-label="Voting options">
                      <button
                        type="button"
                        onClick={() => handleCastVote(selectedMotion.id, 'aye')}
                        className="btn-vote btn-aye"
                        aria-label="Vote Aye"
                      >
                        Aye
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCastVote(selectedMotion.id, 'no')}
                        className="btn-vote btn-no"
                        aria-label="Vote No"
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCastVote(selectedMotion.id, 'abstain')}
                        className="btn-vote btn-abstain"
                        aria-label="Abstain from voting"
                      >
                        Abstain
                      </button>
                    </fieldset>

                    {voteResults && (
                      <div className="vote-results" aria-live="polite">
                        <h5>Current Results</h5>
                        <dl>
                          <dt>Ayes:</dt>
                          <dd>{voteResults.aye}</dd>
                          <dt>Noes:</dt>
                          <dd>{voteResults.no}</dd>
                          <dt>Abstentions:</dt>
                          <dd>{voteResults.abstain}</dd>
                          <dt>Total:</dt>
                          <dd>{voteResults.total}</dd>
                        </dl>
                      </div>
                    )}
                  </section>
                )}

                {selectedMotion.status === 'completed' && selectedMotion.result && (
                  <div className={`motion-result result-${selectedMotion.result}`}>
                    <strong>Result:</strong> {selectedMotion.result.toUpperCase()}
                  </div>
                )}
              </article>
            </aside>
          )}
        </main>
      )}
    </div>
  );
};

export default ParliamentChamber;
