/**
 * Judiciary System Component
 * Manages legal cases, judges, rulings, and constitutional review
 * WCAG 2.2 AA Compliant
 */

import React, { useState, useEffect, useCallback } from 'react';
import './JudiciarySystem.css';

interface LegalCase {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  caseType: string;
  status: string;
  filedAt: string;
  plaintiff: string;
  defendant: string;
}

interface Judge {
  id: string;
  userId: string;
  court: string;
  appointedAt: string;
  status: string;
  casesHeard: number;
}

interface Ruling {
  id: string;
  caseId: string;
  decision: string;
  reasoning: string;
  issuedAt: string;
  unanimous: boolean;
}

interface JudiciarySystemProps {
  gameId: string;
  onFileCase?: (data: { title: string; description: string; caseType: string }) => void;
  onIssueRuling?: (data: { caseId: string; decision: string; reasoning: string }) => void;
}

const JudiciarySystem: React.FC<JudiciarySystemProps> = ({
  gameId,
  onFileCase,
  onIssueRuling,
}) => {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [rulings, setRulings] = useState<Ruling[]>([]);
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cases' | 'judges' | 'rulings'>('cases');

  const fetchCases = useCallback(async () => {
    try {
      const response = await fetch(`/api/judiciary/cases?gameId=${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch cases');
      const data = await response.json();
      if (data.success) {
        setCases(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [gameId]);

  const fetchJudges = useCallback(async () => {
    try {
      const response = await fetch(`/api/judiciary/judges?gameId=${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch judges');
      const data = await response.json();
      if (data.success) {
        setJudges(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [gameId]);

  const fetchRulings = useCallback(async () => {
    try {
      const response = await fetch(`/api/judiciary/rulings?gameId=${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch rulings');
      const data = await response.json();
      if (data.success) {
        setRulings(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [gameId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchCases(), fetchJudges(), fetchRulings()]);
      setLoading(false);
    };
    loadData();
  }, [fetchCases, fetchJudges, fetchRulings]);

  const handleFileCase = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get('caseTitle') as string;
    const description = formData.get('caseDescription') as string;
    const caseType = formData.get('caseType') as string;

    if (title && description && caseType && onFileCase) {
      onFileCase({ title, description, caseType });
      event.currentTarget.reset();
    }
  };

  const handleIssueRuling = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCase) return;

    const formData = new FormData(event.currentTarget);
    const decision = formData.get('decision') as string;
    const reasoning = formData.get('reasoning') as string;

    if (decision && reasoning && onIssueRuling) {
      onIssueRuling({ caseId: selectedCase.id, decision, reasoning });
      event.currentTarget.reset();
      setSelectedCase(null);
    }
  };

  if (loading) {
    return (
      <div className="judiciary-system" role="status" aria-live="polite">
        <p>Loading judiciary system...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="judiciary-system" role="alert">
        <p className="error">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="judiciary-system">
      <header className="judiciary-header">
        <h1>Judiciary System</h1>
        <p className="judiciary-subtitle">Supreme Court and Legal System</p>
      </header>

      <nav className="judiciary-tabs" role="tablist" aria-label="Judiciary sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'cases'}
          aria-controls="cases-panel"
          id="cases-tab"
          onClick={() => setActiveTab('cases')}
          className={activeTab === 'cases' ? 'active' : ''}
        >
          Legal Cases
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'judges'}
          aria-controls="judges-panel"
          id="judges-tab"
          onClick={() => setActiveTab('judges')}
          className={activeTab === 'judges' ? 'active' : ''}
        >
          Judges
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'rulings'}
          aria-controls="rulings-panel"
          id="rulings-tab"
          onClick={() => setActiveTab('rulings')}
          className={activeTab === 'rulings' ? 'active' : ''}
        >
          Rulings
        </button>
      </nav>

      {activeTab === 'cases' && (
        <section
          id="cases-panel"
          role="tabpanel"
          aria-labelledby="cases-tab"
          className="cases-section"
        >
          <h2>Legal Cases</h2>

          {cases.length === 0 ? (
            <p>No cases filed yet.</p>
          ) : (
            <ul className="cases-list" aria-label="List of legal cases">
              {cases.map(legalCase => (
                <li
                  key={legalCase.id}
                  className="case-card"
                  onClick={() => setSelectedCase(legalCase)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedCase(legalCase);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={selectedCase?.id === legalCase.id}
                >
                  <div className="case-header">
                    <h3>{legalCase.caseNumber}: {legalCase.title}</h3>
                    <span className={`case-status status-${legalCase.status}`}>
                      {legalCase.status}
                    </span>
                  </div>
                  <p className="case-description">{legalCase.description}</p>
                  <div className="case-meta">
                    <span className="case-type">{legalCase.caseType}</span>
                    <span>Filed: {new Date(legalCase.filedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="case-parties">
                    <span>Plaintiff: {legalCase.plaintiff}</span>
                    <span>Defendant: {legalCase.defendant}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {onFileCase && (
            <form
              className="file-case-form"
              onSubmit={handleFileCase}
              aria-labelledby="file-case-heading"
            >
              <h3 id="file-case-heading">File New Case</h3>

              <div className="form-group">
                <label htmlFor="case-title">
                  Case Title <span aria-label="required">*</span>
                </label>
                <input
                  type="text"
                  id="case-title"
                  name="caseTitle"
                  required
                  aria-required="true"
                  maxLength={200}
                  placeholder="Enter case title"
                />
              </div>

              <div className="form-group">
                <label htmlFor="case-type">
                  Case Type <span aria-label="required">*</span>
                </label>
                <select id="case-type" name="caseType" required aria-required="true">
                  <option value="">Select type...</option>
                  <option value="constitutional">Constitutional Review</option>
                  <option value="civil">Civil Case</option>
                  <option value="criminal">Criminal Case</option>
                  <option value="administrative">Administrative Law</option>
                  <option value="appeal">Appeal</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="case-description">
                  Description <span aria-label="required">*</span>
                </label>
                <textarea
                  id="case-description"
                  name="caseDescription"
                  required
                  aria-required="true"
                  maxLength={5000}
                  rows={4}
                  placeholder="Describe the case"
                />
              </div>

              <button type="submit" className="btn-primary">
                File Case
              </button>
            </form>
          )}

          {selectedCase && onIssueRuling && (
            <form
              className="issue-ruling-form"
              onSubmit={handleIssueRuling}
              aria-labelledby="issue-ruling-heading"
            >
              <h3 id="issue-ruling-heading">Issue Ruling for {selectedCase.caseNumber}</h3>

              <div className="form-group">
                <label htmlFor="ruling-decision">
                  Decision <span aria-label="required">*</span>
                </label>
                <select id="ruling-decision" name="decision" required aria-required="true">
                  <option value="">Select decision...</option>
                  <option value="upheld">Upheld</option>
                  <option value="overturned">Overturned</option>
                  <option value="dismissed">Dismissed</option>
                  <option value="remanded">Remanded</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="ruling-reasoning">
                  Reasoning <span aria-label="required">*</span>
                </label>
                <textarea
                  id="ruling-reasoning"
                  name="reasoning"
                  required
                  aria-required="true"
                  maxLength={10000}
                  rows={6}
                  placeholder="Provide detailed legal reasoning"
                />
              </div>

              <button type="submit" className="btn-primary">
                Issue Ruling
              </button>
            </form>
          )}
        </section>
      )}

      {activeTab === 'judges' && (
        <section
          id="judges-panel"
          role="tabpanel"
          aria-labelledby="judges-tab"
          className="judges-section"
        >
          <h2>Judges</h2>

          {judges.length === 0 ? (
            <p>No judges appointed yet.</p>
          ) : (
            <ul className="judges-list" aria-label="List of judges">
              {judges.map(judge => (
                <li key={judge.id} className="judge-card">
                  <div className="judge-info">
                    <h3>{judge.court}</h3>
                    <p>Cases Heard: {judge.casesHeard}</p>
                    <p>Appointed: {new Date(judge.appointedAt).toLocaleDateString()}</p>
                    <span className={`judge-status status-${judge.status}`}>
                      {judge.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {activeTab === 'rulings' && (
        <section
          id="rulings-panel"
          role="tabpanel"
          aria-labelledby="rulings-tab"
          className="rulings-section"
        >
          <h2>Rulings</h2>

          {rulings.length === 0 ? (
            <p>No rulings issued yet.</p>
          ) : (
            <ul className="rulings-list" aria-label="List of rulings">
              {rulings.map(ruling => (
                <li key={ruling.id} className="ruling-card">
                  <div className="ruling-header">
                    <h3>Decision: {ruling.decision}</h3>
                    {ruling.unanimous && (
                      <span className="unanimous-badge">Unanimous</span>
                    )}
                  </div>
                  <p className="ruling-reasoning">{ruling.reasoning}</p>
                  <p className="ruling-meta">
                    Issued: {new Date(ruling.issuedAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};

export default JudiciarySystem;
