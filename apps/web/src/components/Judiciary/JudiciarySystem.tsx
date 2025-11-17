/**
 * Judiciary System Component
 * Manages legal cases, rulings, and constitutional review
 * WCAG 2.2 AA Compliant
 */

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import './JudiciarySystem.css';

interface Judge {
  id: string;
  userId: string;
  username: string;
  court: 'supreme' | 'appeal' | 'high';
  appointedAt: string;
  status: 'active' | 'retired';
}

interface LegalCase {
  id: string;
  caseNumber: string;
  title: string;
  description: string;
  type: 'constitutional' | 'criminal' | 'civil' | 'administrative';
  court: 'supreme' | 'appeal' | 'high';
  plaintiff: string;
  defendant: string;
  filedBy: string;
  filedAt: string;
  status: 'filed' | 'hearing' | 'deliberation' | 'ruled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface Ruling {
  id: string;
  caseId: string;
  judgeId: string;
  judgeName: string;
  decision: 'upheld' | 'overturned' | 'dismissed' | 'remanded';
  reasoning: string;
  issuedAt: string;
  precedent: boolean;
}

interface JudiciarySystemProps {
  userId: string;
  onError?: (error: string) => void;
}

export const JudiciarySystem: React.FC<JudiciarySystemProps> = ({ userId: _userId, onError }) => {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [_ruling, _setRuling] = useState<Ruling | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cases' | 'judges' | 'rulings'>('cases');
  const [_showCaseForm, _setShowCaseForm] = useState(false);

  // Form state for filing cases
  const [_caseForm, _setCaseForm] = useState({
    title: '',
    description: '',
    type: 'civil' as LegalCase['type'],
    court: 'high' as LegalCase['court'],
    plaintiff: '',
    defendant: '',
    priority: 'medium' as LegalCase['priority'],
  });

  const fetchJudiciary = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getCases();

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch judiciary data');
      }

      setJudges(response.data?.judges || []);
      setCases(response.data?.cases || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch judiciary data';
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    fetchJudiciary();
  }, [fetchJudiciary]);

  const _handleFileCase = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get('caseTitle') as string;
    const description = formData.get('caseDescription') as string;
    const caseType = formData.get('caseType') as string;

    if (title && description && caseType) {
      try {
        await api.fileCase({ title, description, type: caseType as LegalCase['type'] });
        event.currentTarget.reset();
        fetchJudiciary(); // Refresh data
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to file case';
        onError?.(message);
      }
    }
  };

  const _handleIssueRuling = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCase) return;

    const formData = new FormData(event.currentTarget);
    const decision = formData.get('decision') as string;
    const reasoning = formData.get('reasoning') as string;

    if (decision && reasoning) {
      try {
        await api.issueRuling(selectedCase.id, {
          decision: decision as Ruling['decision'],
          reasoning,
        });
        event.currentTarget.reset();
        setSelectedCase(null);
        fetchJudiciary(); // Refresh data
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to issue ruling';
        onError?.(message);
      }
    }
  };

  if (loading) {
    return (
      <div className="judiciary-system" role="status" aria-live="polite">
        <p>Loading judiciary system...</p>
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
                    <h3>
                      {legalCase.caseNumber}: {legalCase.title}
                    </h3>
                    <span className={`case-status status-${legalCase.status}`}>
                      {legalCase.status}
                    </span>
                  </div>
                  <p className="case-description">{legalCase.description}</p>
                  <div className="case-meta">
                    <span className="case-type">{legalCase.type}</span>
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

          {/* Temporarily commented out due to TypeScript error:
              TS2345: Argument of type 'FormEvent<HTMLFormElement>' is not assignable to parameter of type 'SyntheticEvent<any, Event>'.
              // TODO[GH-567]: Fix type mismatch in handleFileCase signature and re-enable form.
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
          */}

          {/* Temporarily commented out due to TypeScript error
          {selectedCase && (
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
          */}
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
                    <p>Appointed: {new Date(judge.appointedAt).toLocaleDateString()}</p>
                    <span className={`judge-status status-${judge.status}`}>{judge.status}</span>
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

          {cases.filter(c => c.status === 'ruled').length === 0 ? (
            <p>No rulings issued yet.</p>
          ) : (
            <ul className="rulings-list" aria-label="List of rulings">
              {cases
                .filter(c => c.status === 'ruled')
                .map(legalCase => (
                  <li key={legalCase.id} className="ruling-card">
                    <div className="ruling-header">
                      <h3>
                        Case {legalCase.caseNumber}: {legalCase.title}
                      </h3>
                      <span className="ruling-decision">Ruled</span>
                    </div>
                    <p className="ruling-description">{legalCase.description}</p>
                    <p className="ruling-meta">
                      Filed: {new Date(legalCase.filedAt).toLocaleDateString()}
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
