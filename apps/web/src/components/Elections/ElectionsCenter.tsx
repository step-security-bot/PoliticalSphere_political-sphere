/**
 * Elections Center Component
 * Campaigns, constituencies, and voting
 * WCAG 2.2 AA Compliant
 */

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { api, type Election, type Constituency } from '../../services/api';
import './ElectionsCenter.css';

interface ElectionsCenterProps {
  userId: string;
  onError?: (error: string) => void;
}

export const ElectionsCenter: React.FC<ElectionsCenterProps> = ({ onError }) => {
  const [elections, setElections] = useState<Election[]>([]);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'elections' | 'constituencies'>('elections');

  const fetchElections = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getElections();
      if (response.success) {
        setElections(response.data?.elections || []);
        setConstituencies(response.data?.constituencies || []);
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to fetch elections');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    fetchElections();
    const interval = setInterval(fetchElections, 30000);
    return () => clearInterval(interval);
  }, [fetchElections]);

  if (loading) {
    return (
      <div className="elections-center loading">
        <p>Loading Elections...</p>
      </div>
    );
  }

  return (
    <div className="elections-center">
      <header className="elections-header">
        <h1>Elections</h1>
        <nav className="elections-tabs">
          <button
            type="button"
            onClick={() => setActiveTab('elections')}
            className={activeTab === 'elections' ? 'active' : ''}
          >
            Elections ({elections.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('constituencies')}
            className={activeTab === 'constituencies' ? 'active' : ''}
          >
            Constituencies ({constituencies.length})
          </button>
        </nav>
      </header>

      <main className="elections-content">
        {activeTab === 'elections' && (
          <section className="elections-section">
            <div className="elections-grid">
              {elections.map(election => (
                <button type="button" key={election.id} className="election-card">
                  <h3>{election.name}</h3>
                  <div className="election-meta">
                    <span className={`type-badge type-${election.type}`}>{election.type}</span>
                    <span className={`status-badge status-${election.status}`}>
                      {election.status}
                    </span>
                  </div>
                  <dl>
                    <dt>Start:</dt>
                    <dd>{new Date(election.startDate).toLocaleDateString()}</dd>
                    <dt>End:</dt>
                    <dd>{new Date(election.endDate).toLocaleDateString()}</dd>
                    <dt>Turnout:</dt>
                    <dd>
                      {election.totalVoters && election.totalVoters > 0
                        ? `${election.turnout} / ${election.totalVoters} (${Math.round((election.turnout / election.totalVoters) * 100)}%)`
                        : 'N/A'}
                    </dd>
                  </dl>
                </button>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'constituencies' && (
          <section className="constituencies-section">
            <div className="constituencies-grid">
              {constituencies.map(constituency => (
                <article key={constituency.id} className="constituency-card">
                  <h3>{constituency.name}</h3>
                  <p className="region">{constituency.region}</p>
                  <dl>
                    <dt>Population:</dt>
                    <dd>{constituency.population?.toLocaleString() || 'N/A'}</dd>
                    <dt>Registered Voters:</dt>
                    <dd>{constituency.registeredVoters?.toLocaleString() || 'N/A'}</dd>
                    <dt>Candidates:</dt>
                    <dd>{constituency.candidates?.length || 0}</dd>
                  </dl>
                  {(constituency.candidates?.length || 0) > 0 && (
                    <div className="candidates-list">
                      {constituency.candidates?.map(candidate => (
                        <div key={candidate.id} className="candidate-item">
                          <span className="candidate-name">{candidate.name || 'Unknown'}</span>
                          <span className="candidate-party">
                            {candidate.party || 'Independent'}
                          </span>
                          <span className="candidate-votes">{candidate.votes || 0} votes</span>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ElectionsCenter;
