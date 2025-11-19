/**
 * Judiciary System Component
 * Manages legal cases, rulings, and constitutional review
 * WCAG 2.2 AA Compliant
 */

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { z } from 'zod';
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

const _FileCaseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  type: z.enum(['constitutional', 'criminal', 'civil', 'administrative']),
  court: z.enum(['supreme', 'appeal', 'high']),
  plaintiff: z.string().min(1),
  defendant: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

const _IssueRulingSchema = z.object({
  decision: z.enum(['upheld', 'overturned', 'dismissed', 'remanded']),
  reasoning: z.string().min(1).max(10000),
});

export const JudiciarySystem: React.FC<JudiciarySystemProps> = ({ userId, onError }) => {
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

  const handleFileCase = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      gameId: 'default',
      plaintiffId: userId,
      defendantId: null,
      title: formData.get('caseTitle') as string,
      description: formData.get('caseDescription') as string,
      type: formData.get('caseType') as 'constitutional' | 'criminal' | 'civil' | 'administrative',
      court: formData.get('caseCourt') as 'supreme' | 'appeal' | 'high',
      plaintiff: formData.get('plaintiff') as string,
      defendant: formData.get('defendant') as string,
      priority: formData.get('priority') as 'low' | 'medium' | 'high' | 'urgent',
      legalBasis: 'Filed via judiciary system',
      targetLawId: null,
      targetActionId: null,
    };

    try {
      api
        .fileCase(data)
        .then(() => {
          event.currentTarget.reset();
          fetchJudiciary(); // Refresh data
        })
        .catch(_error => {
          const message = _error instanceof Error ? _error.message : 'Failed to file case';
          onError?.(message);
        });
    } catch {
      onError?.('Invalid form data');
    }
  };

  const handleIssueRuling = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCase) return;

    const formData = new FormData(event.currentTarget);
    const data = {
      caseId: selectedCase.id,
      judgeId: userId,
      decision: formData.get('decision') as 'upheld' | 'overturned' | 'dismissed' | 'remanded',
      reasoning: formData.get('reasoning') as string,
      precedentSetting: false,
      constitutionalImpact: 'none' as const,
    };

    try {
      api
        .issueRuling(selectedCase.id, data)
        .then(() => {
          event.currentTarget.reset();
          setSelectedCase(null);
          fetchJudiciary(); // Refresh data
        })
        .catch(_error => {
          const message = _error instanceof Error ? _error.message : 'Failed to issue ruling';
          onError?.(message);
        });
    } catch {
      onError?.('Invalid form data');
    }
  };

  if (loading) {
    return (
      <output className="judiciary-system" aria-live="polite">
        Loading judiciary system...
      </output>
    );
  }

  return (
    <div className="judiciary-system">
      <header className="judiciary-header">
        <h1>Judiciary System</h1>
        <p className="judiciary-subtitle">Supreme Court and Legal System</p>
      </header>

      <nav className="judiciary-tabs" aria-label="Judiciary sections">
        <div role="tablist" aria-label="Judiciary sections">
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
        </div>
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
                <li key={legalCase.id} className="case-card">
                  <button
                    type="button"
                    className="case-card-button"
                    aria-pressed={selectedCase?.id === legalCase.id}
                    onClick={() => setSelectedCase(legalCase)}
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
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form
            className="file-case-form"
            onSubmit={handleFileCase}
            aria-labelledby="file-case-heading"
          >
            <h3 id="file-case-heading">File New Case</h3>

            <div className="form-group">
              <label htmlFor="case-title">
                Case Title <span aria-hidden="true">*</span>
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
                Case Type <span aria-hidden="true">*</span>
              </label>
              <select id="case-type" name="caseType" required aria-required="true">
                <option value="">Select type...</option>
                <option value="constitutional">Constitutional Review</option>
                <option value="civil">Civil Case</option>
                <option value="criminal">Criminal Case</option>
                <option value="administrative">Administrative Law</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="case-court">
                Court <span aria-hidden="true">*</span>
              </label>
              <select id="case-court" name="caseCourt" required aria-required="true">
                <option value="">Select court...</option>
                <option value="supreme">Supreme Court</option>
                <option value="appeal">Appeal Court</option>
                <option value="high">High Court</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="plaintiff">
                Plaintiff <span aria-hidden="true">*</span>
              </label>
              <input
                type="text"
                id="plaintiff"
                name="plaintiff"
                required
                aria-required="true"
                placeholder="Enter plaintiff name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="defendant">
                Defendant <span aria-hidden="true">*</span>
              </label>
              <input
                type="text"
                id="defendant"
                name="defendant"
                required
                aria-required="true"
                placeholder="Enter defendant name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="priority">
                Priority <span aria-hidden="true">*</span>
              </label>
              <select id="priority" name="priority" required aria-required="true">
                <option value="">Select priority...</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="case-description">
                Description <span aria-hidden="true">*</span>
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

          {selectedCase && (
            <form
              className="issue-ruling-form"
              onSubmit={handleIssueRuling}
              aria-labelledby="issue-ruling-heading"
            >
              <h3 id="issue-ruling-heading">Issue Ruling for {selectedCase.caseNumber}</h3>

              <div className="form-group">
                <label htmlFor="ruling-decision">
                  Decision <span aria-hidden="true">*</span>
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
                  Reasoning <span aria-hidden="true">*</span>
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
