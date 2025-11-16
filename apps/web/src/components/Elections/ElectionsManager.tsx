/**
 * Elections Manager Component
 * Manages elections, campaigns, constituencies, and voting
 * WCAG 2.2 AA Compliant
 */

import React, { useState, useEffect, useCallback } from 'react';
import './ElectionsManager.css';

interface Election {
  id: string;
  gameId: string;
  name: string;
  electionType: 'general' | 'by_election' | 'local' | 'referendum';
  startDate: string;
  endDate: string;
  status: string;
  totalVotes: number;
  turnout: number;
}

interface Constituency {
  id: string;
  name: string;
  population: number;
  registeredVoters: number;
  region: string;
  votesCast: number;
  turnoutPercentage: number;
}

interface Candidate {
  id: string;
  userId: string;
  constituencyId: string;
  partyId?: string;
  independent: boolean;
  votesReceived: number;
  votePercentage: number;
  status: string;
}

interface ElectionsManagerProps {
  gameId: string;
  onCreateElection?: (data: { name: string; electionType: string; startDate: string; endDate: string }) => void;
  onCastVote?: (data: { electionId: string; constituencyId: string; candidateId: string }) => void;
}

const ElectionsManager: React.FC<ElectionsManagerProps> = ({
  gameId,
  onCreateElection,
  onCastVote,
}) => {
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedConstituency, setSelectedConstituency] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'elections' | 'constituencies' | 'results'>('elections');

  const fetchElections = useCallback(async () => {
    try {
      const response = await fetch(`/api/elections?gameId=${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch elections');
      const data = await response.json();
      if (data.success) {
        setElections(data.data);
        if (data.data.length > 0 && !selectedElection) {
          setSelectedElection(data.data[0]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [gameId, selectedElection]);

  const fetchConstituencies = useCallback(async () => {
    if (!selectedElection) return;
    try {
      const response = await fetch(`/api/elections/${selectedElection.id}/constituencies`);
      if (!response.ok) throw new Error('Failed to fetch constituencies');
      const data = await response.json();
      if (data.success) {
        setConstituencies(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [selectedElection]);

  const fetchCandidates = useCallback(async () => {
    if (!selectedElection || !selectedConstituency) return;
    try {
      const response = await fetch(
        `/api/elections/${selectedElection.id}/candidates?constituencyId=${selectedConstituency}`
      );
      if (!response.ok) throw new Error('Failed to fetch candidates');
      const data = await response.json();
      if (data.success) {
        setCandidates(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [selectedElection, selectedConstituency]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchElections();
      setLoading(false);
    };
    loadData();
  }, [fetchElections]);

  useEffect(() => {
    if (selectedElection) {
      fetchConstituencies();
    }
  }, [selectedElection, fetchConstituencies]);

  useEffect(() => {
    if (selectedConstituency) {
      fetchCandidates();
    }
  }, [selectedConstituency, fetchCandidates]);

  const handleCreateElection = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get('electionName') as string;
    const electionType = formData.get('electionType') as string;
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;

    if (name && electionType && startDate && endDate && onCreateElection) {
      onCreateElection({ name, electionType, startDate, endDate });
      event.currentTarget.reset();
    }
  };

  const handleVote = (candidateId: string) => {
    if (selectedElection && selectedConstituency && onCastVote) {
      onCastVote({
        electionId: selectedElection.id,
        constituencyId: selectedConstituency,
        candidateId,
      });
    }
  };

  const getElectionStatus = (election: Election): string => {
    const now = new Date();
    const start = new Date(election.startDate);
    const end = new Date(election.endDate);

    if (now < start) return 'Upcoming';
    if (now >= start && now <= end) return 'Active';
    if (now > end && election.status !== 'certified') return 'Closed';
    return 'Certified';
  };

  if (loading) {
    return (
      <div className="elections-manager" role="status" aria-live="polite">
        <p>Loading elections...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="elections-manager" role="alert">
        <p className="error">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="elections-manager">
      <header className="elections-header">
        <h1>Elections Manager</h1>
        <p className="elections-subtitle">Manage elections, constituencies, and voting</p>
      </header>

      <nav className="elections-nav" role="tablist" aria-label="Election views">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'elections'}
          aria-controls="elections-panel"
          id="elections-tab"
          onClick={() => setActiveView('elections')}
          className={activeView === 'elections' ? 'active' : ''}
        >
          Elections
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'constituencies'}
          aria-controls="constituencies-panel"
          id="constituencies-tab"
          onClick={() => setActiveView('constituencies')}
          className={activeView === 'constituencies' ? 'active' : ''}
          disabled={!selectedElection}
        >
          Constituencies
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'results'}
          aria-controls="results-panel"
          id="results-tab"
          onClick={() => setActiveView('results')}
          className={activeView === 'results' ? 'active' : ''}
          disabled={!selectedElection}
        >
          Results
        </button>
      </nav>

      {activeView === 'elections' && (
        <section
          id="elections-panel"
          role="tabpanel"
          aria-labelledby="elections-tab"
          className="elections-section"
        >
          <h2>Elections</h2>

          {elections.length === 0 ? (
            <p>No elections scheduled yet.</p>
          ) : (
            <ul className="elections-list" aria-label="List of elections">
              {elections.map((election) => (
                <li
                  key={election.id}
                  className={`election-card ${selectedElection?.id === election.id ? 'selected' : ''}`}
                  onClick={() => setSelectedElection(election)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedElection(election);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={selectedElection?.id === election.id}
                >
                  <div className="election-header">
                    <h3>{election.name}</h3>
                    <span className={`election-status status-${getElectionStatus(election).toLowerCase()}`}>
                      {getElectionStatus(election)}
                    </span>
                  </div>
                  <div className="election-meta">
                    <span className="election-type">{election.electionType.replace('_', ' ')}</span>
                    <span>Votes: {election.totalVotes.toLocaleString()}</span>
                    <span>Turnout: {election.turnout.toFixed(1)}%</span>
                  </div>
                  <div className="election-dates">
                    <span>Start: {new Date(election.startDate).toLocaleDateString()}</span>
                    <span>End: {new Date(election.endDate).toLocaleDateString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {onCreateElection && (
            <form
              className="create-election-form"
              onSubmit={handleCreateElection}
              aria-labelledby="create-election-heading"
            >
              <h3 id="create-election-heading">Create New Election</h3>

              <div className="form-group">
                <label htmlFor="election-name">
                  Election Name <span aria-label="required">*</span>
                </label>
                <input
                  type="text"
                  id="election-name"
                  name="electionName"
                  required
                  aria-required="true"
                  maxLength={200}
                  placeholder="e.g., 2025 General Election"
                />
              </div>

              <div className="form-group">
                <label htmlFor="election-type">
                  Election Type <span aria-label="required">*</span>
                </label>
                <select
                  id="election-type"
                  name="electionType"
                  required
                  aria-required="true"
                >
                  <option value="">Select type...</option>
                  <option value="general">General Election</option>
                  <option value="by_election">By-Election</option>
                  <option value="local">Local Election</option>
                  <option value="referendum">Referendum</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="start-date">
                    Start Date <span aria-label="required">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="start-date"
                    name="startDate"
                    required
                    aria-required="true"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="end-date">
                    End Date <span aria-label="required">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="end-date"
                    name="endDate"
                    required
                    aria-required="true"
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary">
                Create Election
              </button>
            </form>
          )}
        </section>
      )}

      {activeView === 'constituencies' && selectedElection && (
        <section
          id="constituencies-panel"
          role="tabpanel"
          aria-labelledby="constituencies-tab"
          className="constituencies-section"
        >
          <h2>Constituencies - {selectedElection.name}</h2>

          {constituencies.length === 0 ? (
            <p>No constituencies configured for this election.</p>
          ) : (
            <ul className="constituencies-list" aria-label="List of constituencies">
              {constituencies.map((constituency) => (
                <li
                  key={constituency.id}
                  className={`constituency-card ${selectedConstituency === constituency.id ? 'selected' : ''}`}
                  onClick={() => setSelectedConstituency(constituency.id)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedConstituency(constituency.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={selectedConstituency === constituency.id}
                >
                  <h3>{constituency.name}</h3>
                  <div className="constituency-stats">
                    <span>Region: {constituency.region}</span>
                    <span>Population: {constituency.population.toLocaleString()}</span>
                    <span>Registered: {constituency.registeredVoters.toLocaleString()}</span>
                    <span>Votes Cast: {constituency.votesCast.toLocaleString()}</span>
                    <span className="turnout">
                      Turnout: {constituency.turnoutPercentage.toFixed(1)}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {selectedConstituency && candidates.length > 0 && (
            <div className="candidates-section">
              <h3>Candidates</h3>
              <ul className="candidates-list" aria-label="List of candidates">
                {candidates.map((candidate) => (
                  <li key={candidate.id} className="candidate-card">
                    <div className="candidate-info">
                      <h4>
                        {candidate.independent ? 'Independent' : `Party: ${candidate.partyId}`}
                      </h4>
                      <span className={`candidate-status status-${candidate.status}`}>
                        {candidate.status}
                      </span>
                    </div>
                    <div className="candidate-results">
                      <span className="votes">Votes: {candidate.votesReceived.toLocaleString()}</span>
                      <span className="percentage">{candidate.votePercentage.toFixed(1)}%</span>
                    </div>
                    {onCastVote && getElectionStatus(selectedElection) === 'Active' && (
                      <button
                        type="button"
                        onClick={() => handleVote(candidate.id)}
                        className="btn-vote"
                      >
                        Vote for this candidate
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {activeView === 'results' && selectedElection && (
        <section
          id="results-panel"
          role="tabpanel"
          aria-labelledby="results-tab"
          className="results-section"
        >
          <h2>Election Results - {selectedElection.name}</h2>

          <div className="results-summary">
            <div className="result-stat">
              <span className="stat-label">Total Votes</span>
              <span className="stat-value">{selectedElection.totalVotes.toLocaleString()}</span>
            </div>
            <div className="result-stat">
              <span className="stat-label">Turnout</span>
              <span className="stat-value">{selectedElection.turnout.toFixed(1)}%</span>
            </div>
            <div className="result-stat">
              <span className="stat-label">Status</span>
              <span className="stat-value">{getElectionStatus(selectedElection)}</span>
            </div>
          </div>

          {constituencies.length > 0 && (
            <div className="results-by-constituency">
              <h3>Results by Constituency</h3>
              {constituencies.map((constituency) => (
                <div key={constituency.id} className="constituency-result">
                  <h4>{constituency.name}</h4>
                  <div className="constituency-result-stats">
                    <span>Votes Cast: {constituency.votesCast.toLocaleString()}</span>
                    <span>Turnout: {constituency.turnoutPercentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default ElectionsManager;
