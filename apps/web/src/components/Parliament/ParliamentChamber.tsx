/**
 * Parliament Chamber Component
 * Displays parliamentary chamber with debates, motions, and voting
 */

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import './ParliamentChamber.css';

interface Chamber {
  id: string;
  gameId?: string;
  type: string;
  name: string;
  maxSeats?: number;
  quorumPercentage?: number;
  seats?: string[];
  status?: string;
  createdAt?: string;
}

interface Motion {
  id: string;
  gameId?: string;
  chamberId: string;
  proposerId?: string;
  type: string;
  title: string;
  description: string;
  status: string;
  createdAt?: string;
  result?: 'passed' | 'failed';
}

interface VoteResults {
  total: number;
  aye: number;
  no: number;
  abstain: number;
}

interface ParliamentChamberProps {
  userId: string;
  onError?: (error: string) => void;
}

interface LoadingStates {
  chambers: boolean;
  motions: boolean;
  creatingMotion: boolean;
  voting: boolean;
  voteResults: boolean;
}

export const ParliamentChamber: React.FC<ParliamentChamberProps> = ({ userId, onError }) => {
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [selectedChamber, setSelectedChamber] = useState<Chamber | null>(null);
  const [motions, setMotions] = useState<Motion[]>([]);
  const [selectedMotion, setSelectedMotion] = useState<Motion | null>(null);
  const [voteResults, setVoteResults] = useState<VoteResults | null>(null);
  const [loading, setLoading] = useState<LoadingStates>({
    chambers: true,
    motions: false,
    creatingMotion: false,
    voting: false,
    voteResults: false,
  });
  const [showCreateMotion, setShowCreateMotion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for creating motions
  const [motionForm, setMotionForm] = useState({
    type: 'debate' as string,
    title: '',
    description: '',
  });

  const fetchChambers = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, chambers: true }));
      setError(null);
      // Single world - no gameId needed
      const response = await api.getChambers();

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch chambers');
      }

      setChambers((response.data || []) as Chamber[]);

      // Auto-select first chamber
      if (response.data && response.data.length > 0) {
        setSelectedChamber(response.data[0] as Chamber);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch chambers';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(prev => ({ ...prev, chambers: false }));
    }
  }, [onError]);

  const fetchMotions = useCallback(async () => {
    if (!selectedChamber) return;

    try {
      setLoading(prev => ({ ...prev, motions: true }));
      const response = await api.getMotions();

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch motions');
      }

      setMotions((response.data || []) as Motion[]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch motions';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(prev => ({ ...prev, motions: false }));
    }
  }, [onError]);

  const fetchVoteResults = useCallback(
    async (motionId: string) => {
      try {
        setLoading(prev => ({ ...prev, voteResults: true }));
        const response = await api.getVoteResults(motionId);

        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch vote results');
        }

        setVoteResults((response.data as unknown as VoteResults) || null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch vote results';
        setError(message);
        onError?.(message);
      } finally {
        setLoading(prev => ({ ...prev, voteResults: false }));
      }
    },
    [onError]
  );

  // Fetch chambers on mount
  useEffect(() => {
    fetchChambers();
  }, [fetchChambers]);

  // Fetch motions when chamber is selected
  useEffect(() => {
    if (selectedChamber) {
      fetchMotions();
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
      const message = 'Please select a chamber first';
      setError(message);
      onError?.(message);
      return;
    }

    try {
      setLoading(prev => ({ ...prev, creatingMotion: true }));
      setError(null);
      const response = await api.createMotion({
        chamberId: selectedChamber.id,
        proposerId: userId,
        ...motionForm,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to create motion');
      }

      // Reset form and refresh motions
      setMotionForm({ type: 'debate', title: '', description: '' });
      setShowCreateMotion(false);
      fetchMotions();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create motion';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(prev => ({ ...prev, creatingMotion: false }));
    }
  };

  const handleCastVote = async (motionId: string, vote: 'aye' | 'no' | 'abstain') => {
    try {
      setLoading(prev => ({ ...prev, voting: true }));
      setError(null);
      const response = await api.castVote({
        proposalId: motionId,
        vote: vote === 'aye' ? 'yes' : vote === 'no' ? 'no' : 'abstain',
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to cast vote');
      }

      // Refresh vote results
      fetchVoteResults(motionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cast vote';
      setError(message);
      onError?.(message);
    } finally {
      setLoading(prev => ({ ...prev, voting: false }));
    }
  };

  if (loading.chambers) {
    return (
      <div className="parliament-chamber loading" aria-live="polite">
        <p>Loading Parliament...</p>
      </div>
    );
  }

  if (error && chambers.length === 0) {
    return (
      <div className="parliament-chamber error" role="alert">
        <h2>Error Loading Parliament</h2>
        <p>{error}</p>
        <button
          type="button"
          onClick={fetchChambers}
          className="btn-primary"
          disabled={loading.chambers}
        >
          {loading.chambers ? 'Retrying...' : 'Retry'}
        </button>
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
              <dd>
                {selectedChamber.seats?.length || 0} / {selectedChamber.maxSeats || 0}
              </dd>
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
                    onChange={e => setMotionForm({ ...motionForm, type: e.target.value })}
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

                <button type="submit" className="btn-primary" disabled={loading.creatingMotion}>
                  {loading.creatingMotion ? 'Submitting...' : 'Submit Motion'}
                </button>
              </form>
            )}

            <ul className="motions-list">
              {loading.motions ? (
                <li className="loading-state" aria-live="polite">
                  <p>Loading motions...</p>
                </li>
              ) : motions.length === 0 ? (
                <p className="empty-state">No motions have been proposed yet.</p>
              ) : (
                motions.map(motion => (
                  <li key={motion.id}>
                    <button
                      type="button"
                      className={`motion-card ${selectedMotion?.id === motion.id ? 'selected' : ''}`}
                      onClick={() => setSelectedMotion(motion)}
                      aria-pressed={selectedMotion?.id === motion.id}
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
                        <time dateTime={motion.createdAt || ''}>
                          {motion.createdAt
                            ? new Date(motion.createdAt).toLocaleDateString()
                            : 'Unknown date'}
                        </time>
                      </footer>
                    </button>
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
                    <fieldset
                      className="vote-buttons"
                      aria-label="Voting options"
                      disabled={loading.voting}
                    >
                      <button
                        type="button"
                        onClick={() => handleCastVote(selectedMotion.id, 'aye')}
                        className="btn-vote btn-aye"
                        aria-label="Vote Aye"
                        disabled={loading.voting}
                      >
                        Aye
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCastVote(selectedMotion.id, 'no')}
                        className="btn-vote btn-no"
                        aria-label="Vote No"
                        disabled={loading.voting}
                      >
                        No
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCastVote(selectedMotion.id, 'abstain')}
                        className="btn-vote btn-abstain"
                        aria-label="Abstain from voting"
                        disabled={loading.voting}
                      >
                        Abstain
                      </button>
                    </fieldset>

                    {loading.voteResults ? (
                      <div className="vote-results loading" aria-live="polite">
                        <p>Loading vote results...</p>
                      </div>
                    ) : voteResults ? (
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
                    ) : null}
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
