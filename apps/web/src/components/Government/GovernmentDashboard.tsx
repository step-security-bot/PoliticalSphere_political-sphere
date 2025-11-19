/**
 * Government Dashboard Component
 * Manages cabinet, ministers, and executive actions
 * WCAG 2.2 AA Compliant
 */

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import './GovernmentDashboard.css';

interface Minister {
  id: string;
  userId: string;
  username: string;
  portfolio: string;
  appointedAt: string;
  status: 'active' | 'resigned' | 'dismissed';
}

interface Cabinet {
  id: string;
  primeMinisterId: string;
  primeMinisterName: string;
  party: string;
  formedAt: string;
  status: 'active' | 'dissolved';
  ministers: Minister[];
}

interface ExecutiveAction {
  id: string;
  ministerId: string;
  ministerName: string;
  portfolio: string;
  type: 'policy' | 'appointment' | 'budget' | 'emergency';
  title: string;
  description: string;
  status: 'proposed' | 'approved' | 'rejected' | 'implemented';
  createdAt: string;
}

interface Policy {
  id: string;
  title: string;
  description: string;
  portfolio: string;
  status: 'draft' | 'active' | 'suspended' | 'repealed';
  implementedAt?: string;
}

interface GovernmentDashboardProps {
  userId: string;
  onError?: (error: string) => void;
}

export const GovernmentDashboard: React.FC<GovernmentDashboardProps> = ({ userId, onError }) => {
  const [cabinet, setCabinet] = useState<Cabinet | null>(null);
  const [actions, setActions] = useState<ExecutiveAction[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cabinet' | 'actions' | 'policies'>('cabinet');
  const [showActionForm, setShowActionForm] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Form state for executive actions
  const [actionForm, setActionForm] = useState({
    type: 'policy' as ExecutiveAction['type'],
    title: '',
    description: '',
    portfolio: '',
  });

  const fetchGovernment = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getGovernment();

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch government data');
      }

      setCabinet((response.data?.cabinet as Cabinet) || null);
      setActions((response.data?.actions as ExecutiveAction[]) || []);
      setPolicies((response.data?.policies as Policy[]) || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch government data';
      onError?.(message);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    fetchGovernment();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchGovernment, 30000);
    return () => clearInterval(interval);
  }, [fetchGovernment]);

  const handleProposeAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAction(true);

    try {
      const response = await api.issueExecutiveAction(cabinet?.id || '', {
        ...actionForm,
        ministerId: userId,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to propose action');
      }

      // Reset form and refresh
      setActionForm({ type: 'policy', title: '', description: '', portfolio: '' });
      setShowActionForm(false);
      fetchGovernment();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to propose action';
      onError?.(message);
    } finally {
      setSubmittingAction(false);
    }
  };

  const isMinister = cabinet?.ministers.some(m => m.userId === userId && m.status === 'active');
  const isPrimeMinister = cabinet?.primeMinisterId === userId;

  if (loading) {
    return (
      <div className="government-dashboard loading" aria-live="polite">
        <p>Loading Government...</p>
      </div>
    );
  }

  if (!cabinet) {
    return (
      <div className="government-dashboard empty">
        <h2>No Government Formed</h2>
        <p>No government has been formed yet. A government must be formed after elections.</p>
      </div>
    );
  }

  return (
    <div className="government-dashboard">
      <header className="government-header">
        <div className="government-title">
          <h1>Her Majesty's Government</h1>
          <div className="government-meta">
            <span className="pm-name">
              Prime Minister: <strong>{cabinet.primeMinisterName}</strong>
            </span>
            <span className="party-badge">{cabinet.party}</span>
            <span className="status-badge status-{cabinet.status}">{cabinet.status}</span>
          </div>
        </div>

        <nav className="government-tabs" aria-label="Government sections">
          <button
            type="button"
            onClick={() => setActiveTab('cabinet')}
            className={activeTab === 'cabinet' ? 'active' : ''}
            aria-current={activeTab === 'cabinet' ? 'page' : undefined}
          >
            Cabinet ({cabinet.ministers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('actions')}
            className={activeTab === 'actions' ? 'active' : ''}
            aria-current={activeTab === 'actions' ? 'page' : undefined}
          >
            Executive Actions ({actions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('policies')}
            className={activeTab === 'policies' ? 'active' : ''}
            aria-current={activeTab === 'policies' ? 'page' : undefined}
          >
            Policies ({policies.length})
          </button>
        </nav>
      </header>

      <main className="government-content">
        {activeTab === 'cabinet' && (
          <section className="cabinet-section">
            <header className="section-header">
              <h2>Cabinet Ministers</h2>
              {isPrimeMinister && (
                <button type="button" className="btn-primary">
                  Appoint Minister
                </button>
              )}
            </header>

            <div className="ministers-grid">
              {cabinet.ministers.map(minister => (
                <article key={minister.id} className="minister-card">
                  <header>
                    <h3>{minister.username}</h3>
                    <span className="portfolio-badge">{minister.portfolio}</span>
                  </header>
                  <dl>
                    <dt>Status:</dt>
                    <dd>
                      <span className={`status-badge status-${minister.status}`}>
                        {minister.status}
                      </span>
                    </dd>
                    <dt>Appointed:</dt>
                    <dd>
                      <time dateTime={minister.appointedAt}>
                        {new Date(minister.appointedAt).toLocaleDateString()}
                      </time>
                    </dd>
                  </dl>
                  {isPrimeMinister && minister.status === 'active' && (
                    <footer>
                      <button type="button" className="btn-secondary btn-sm">
                        Reassign Portfolio
                      </button>
                      <button type="button" className="btn-danger btn-sm">
                        Dismiss
                      </button>
                    </footer>
                  )}
                </article>
              ))}
            </div>

            {cabinet.ministers.length === 0 && (
              <p className="empty-state">No ministers appointed yet.</p>
            )}
          </section>
        )}

        {activeTab === 'actions' && (
          <section className="actions-section">
            <header className="section-header">
              <h2>Executive Actions</h2>
              {isMinister && (
                <button
                  type="button"
                  onClick={() => setShowActionForm(!showActionForm)}
                  className="btn-primary"
                  aria-expanded={showActionForm}
                >
                  {showActionForm ? 'Cancel' : 'Propose Action'}
                </button>
              )}
            </header>

            {showActionForm && (
              <form onSubmit={handleProposeAction} className="action-form">
                <div className="form-group">
                  <label htmlFor="action-type">Type:</label>
                  <select
                    id="action-type"
                    value={actionForm.type}
                    onChange={e =>
                      setActionForm({
                        ...actionForm,
                        type: e.target.value as ExecutiveAction['type'],
                      })
                    }
                    required
                  >
                    <option value="policy">Policy</option>
                    <option value="appointment">Appointment</option>
                    <option value="budget">Budget</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="action-portfolio">Portfolio:</label>
                  <input
                    id="action-portfolio"
                    type="text"
                    value={actionForm.portfolio}
                    onChange={e => setActionForm({ ...actionForm, portfolio: e.target.value })}
                    required
                    placeholder="e.g., Health, Education, Defence"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="action-title">Title:</label>
                  <input
                    id="action-title"
                    type="text"
                    value={actionForm.title}
                    onChange={e => setActionForm({ ...actionForm, title: e.target.value })}
                    required
                    maxLength={200}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="action-description">Description:</label>
                  <textarea
                    id="action-description"
                    value={actionForm.description}
                    onChange={e => setActionForm({ ...actionForm, description: e.target.value })}
                    required
                    maxLength={2000}
                    rows={6}
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={submittingAction}>
                  {submittingAction ? 'Submitting...' : 'Propose Action'}
                </button>
              </form>
            )}

            <ul className="actions-list">
              {actions.length === 0 ? (
                <p className="empty-state">No executive actions proposed yet.</p>
              ) : (
                actions.map(action => (
                  <li key={action.id} className="action-card">
                    <header>
                      <h3>{action.title}</h3>
                      <div className="action-meta">
                        <span className="type-badge type-{action.type}">{action.type}</span>
                        <span className={`status-badge status-${action.status}`}>
                          {action.status}
                        </span>
                      </div>
                    </header>
                    <p>{action.description}</p>
                    <footer>
                      <span className="minister-info">
                        {action.ministerName} ({action.portfolio})
                      </span>
                      <time dateTime={action.createdAt}>
                        {new Date(action.createdAt).toLocaleDateString()}
                      </time>
                    </footer>
                  </li>
                ))
              )}
            </ul>
          </section>
        )}

        {activeTab === 'policies' && (
          <section className="policies-section">
            <header className="section-header">
              <h2>Government Policies</h2>
            </header>

            <div className="policies-grid">
              {policies.length === 0 ? (
                <p className="empty-state">No policies implemented yet.</p>
              ) : (
                policies.map(policy => (
                  <article key={policy.id} className="policy-card">
                    <header>
                      <h3>{policy.title}</h3>
                      <span className={`status-badge status-${policy.status}`}>
                        {policy.status}
                      </span>
                    </header>
                    <p>{policy.description}</p>
                    <dl>
                      <dt>Portfolio:</dt>
                      <dd>{policy.portfolio}</dd>
                      {policy.implementedAt && (
                        <>
                          <dt>Implemented:</dt>
                          <dd>
                            <time dateTime={policy.implementedAt}>
                              {new Date(policy.implementedAt).toLocaleDateString()}
                            </time>
                          </dd>
                        </>
                      )}
                    </dl>
                  </article>
                ))
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default GovernmentDashboard;
