/**
 * Government Dashboard Component
 * Displays government information, cabinet, ministers, and executive actions
 * WCAG 2.2 AA Compliant
 */

import React, { useState, useEffect, useCallback } from 'react';
import './GovernmentDashboard.css';

interface Minister {
  id: string;
  userId: string;
  position: string;
  department?: string;
  appointedAt: string;
  status: string;
}

interface Government {
  id: string;
  gameId: string;
  name: string;
  type: 'coalition' | 'majority' | 'minority';
  leadPartyId: string;
  formedAt: string;
  status: string;
  confidenceVotes: number;
  noConfidenceVotes: number;
}

interface ExecutiveAction {
  id: string;
  type: string;
  title: string;
  description: string;
  issuedBy: string;
  status: string;
  issuedAt: string;
}

interface GovernmentDashboardProps {
  gameId: string;
  onAppointMinister?: (data: { position: string; userId: string }) => void;
  onIssueAction?: (data: { type: string; title: string; description: string }) => void;
}

const GovernmentDashboard: React.FC<GovernmentDashboardProps> = ({
  gameId,
  onAppointMinister,
  onIssueAction,
}) => {
  const [government, setGovernment] = useState<Government | null>(null);
  const [ministers, setMinisters] = useState<Minister[]>([]);
  const [actions, setActions] = useState<ExecutiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cabinet' | 'actions'>('cabinet');

  const fetchGovernment = useCallback(async () => {
    try {
      const response = await fetch(`/api/government?gameId=${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch government');
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        setGovernment(data.data[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [gameId]);

  const fetchMinisters = useCallback(async () => {
    if (!government) return;
    try {
      const response = await fetch(`/api/government/${government.id}/ministers`);
      if (!response.ok) throw new Error('Failed to fetch ministers');
      const data = await response.json();
      if (data.success) {
        setMinisters(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [government]);

  const fetchActions = useCallback(async () => {
    if (!government) return;
    try {
      const response = await fetch(`/api/government/${government.id}/actions`);
      if (!response.ok) throw new Error('Failed to fetch actions');
      const data = await response.json();
      if (data.success) {
        setActions(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [government]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchGovernment();
      setLoading(false);
    };
    loadData();
  }, [fetchGovernment]);

  useEffect(() => {
    if (government) {
      fetchMinisters();
      fetchActions();
    }
  }, [government, fetchMinisters, fetchActions]);

  const handleAppointMinister = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const position = formData.get('position') as string;
    const userId = formData.get('userId') as string;

    if (position && userId && onAppointMinister) {
      onAppointMinister({ position, userId });
      event.currentTarget.reset();
    }
  };

  const handleIssueAction = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const type = formData.get('actionType') as string;
    const title = formData.get('actionTitle') as string;
    const description = formData.get('actionDescription') as string;

    if (type && title && description && onIssueAction) {
      onIssueAction({ type, title, description });
      event.currentTarget.reset();
    }
  };

  if (loading) {
    return (
      <div className="government-dashboard" role="status" aria-live="polite">
        <p>Loading government information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="government-dashboard" role="alert">
        <p className="error">Error: {error}</p>
      </div>
    );
  }

  if (!government) {
    return (
      <div className="government-dashboard">
        <h2>No Government Formed</h2>
        <p>A government has not yet been formed for this game.</p>
      </div>
    );
  }

  return (
    <div className="government-dashboard">
      <header className="government-header">
        <h1>{government.name}</h1>
        <div className="government-meta">
          <span className="government-type" aria-label="Government type">
            {government.type.charAt(0).toUpperCase() + government.type.slice(1)} Government
          </span>
          <span className="government-status" aria-label="Government status">
            Status: {government.status}
          </span>
        </div>
        <div className="confidence-tracker" aria-label="Confidence votes">
          <span className="confidence-for">
            Confidence: {government.confidenceVotes}
          </span>
          <span className="confidence-against">
            No Confidence: {government.noConfidenceVotes}
          </span>
        </div>
      </header>

      <nav className="government-tabs" role="tablist" aria-label="Government sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'cabinet'}
          aria-controls="cabinet-panel"
          id="cabinet-tab"
          onClick={() => setActiveTab('cabinet')}
          className={activeTab === 'cabinet' ? 'active' : ''}
        >
          Cabinet & Ministers
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'actions'}
          aria-controls="actions-panel"
          id="actions-tab"
          onClick={() => setActiveTab('actions')}
          className={activeTab === 'actions' ? 'active' : ''}
        >
          Executive Actions
        </button>
      </nav>

      {activeTab === 'cabinet' && (
        <section
          id="cabinet-panel"
          role="tabpanel"
          aria-labelledby="cabinet-tab"
          className="cabinet-section"
        >
          <h2>Cabinet Members</h2>
          
          {ministers.length === 0 ? (
            <p>No ministers appointed yet.</p>
          ) : (
            <ul className="ministers-list" aria-label="List of cabinet ministers">
              {ministers.map((minister) => (
                <li key={minister.id} className="minister-card">
                  <div className="minister-info">
                    <h3>{minister.position}</h3>
                    {minister.department && (
                      <p className="minister-department">{minister.department}</p>
                    )}
                    <p className="minister-meta">
                      Appointed: {new Date(minister.appointedAt).toLocaleDateString()}
                    </p>
                    <span className={`minister-status status-${minister.status}`}>
                      {minister.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {onAppointMinister && (
            <form
              className="appoint-minister-form"
              onSubmit={handleAppointMinister}
              aria-labelledby="appoint-minister-heading"
            >
              <h3 id="appoint-minister-heading">Appoint New Minister</h3>
              
              <div className="form-group">
                <label htmlFor="minister-position">
                  Position <span aria-label="required">*</span>
                </label>
                <select
                  id="minister-position"
                  name="position"
                  required
                  aria-required="true"
                >
                  <option value="">Select position...</option>
                  <option value="prime_minister">Prime Minister</option>
                  <option value="chancellor">Chancellor of the Exchequer</option>
                  <option value="foreign_secretary">Foreign Secretary</option>
                  <option value="home_secretary">Home Secretary</option>
                  <option value="defence_secretary">Defence Secretary</option>
                  <option value="health_secretary">Health Secretary</option>
                  <option value="education_secretary">Education Secretary</option>
                  <option value="justice_secretary">Justice Secretary</option>
                  <option value="transport_secretary">Transport Secretary</option>
                  <option value="environment_secretary">Environment Secretary</option>
                  <option value="business_secretary">Business Secretary</option>
                  <option value="culture_secretary">Culture Secretary</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="minister-user">
                  User ID <span aria-label="required">*</span>
                </label>
                <input
                  type="text"
                  id="minister-user"
                  name="userId"
                  required
                  aria-required="true"
                  placeholder="Enter user ID"
                />
              </div>

              <button type="submit" className="btn-primary">
                Appoint Minister
              </button>
            </form>
          )}
        </section>
      )}

      {activeTab === 'actions' && (
        <section
          id="actions-panel"
          role="tabpanel"
          aria-labelledby="actions-tab"
          className="actions-section"
        >
          <h2>Executive Actions</h2>
          
          {actions.length === 0 ? (
            <p>No executive actions issued yet.</p>
          ) : (
            <ul className="actions-list" aria-label="List of executive actions">
              {actions.map((action) => (
                <li key={action.id} className="action-card">
                  <div className="action-header">
                    <h3>{action.title}</h3>
                    <span className={`action-type type-${action.type}`}>
                      {action.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="action-description">{action.description}</p>
                  <div className="action-meta">
                    <span>Issued: {new Date(action.issuedAt).toLocaleDateString()}</span>
                    <span className={`action-status status-${action.status}`}>
                      {action.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {onIssueAction && (
            <form
              className="issue-action-form"
              onSubmit={handleIssueAction}
              aria-labelledby="issue-action-heading"
            >
              <h3 id="issue-action-heading">Issue Executive Action</h3>
              
              <div className="form-group">
                <label htmlFor="action-type">
                  Action Type <span aria-label="required">*</span>
                </label>
                <select
                  id="action-type"
                  name="actionType"
                  required
                  aria-required="true"
                >
                  <option value="">Select type...</option>
                  <option value="order">Executive Order</option>
                  <option value="regulation">Regulation</option>
                  <option value="treaty">Treaty</option>
                  <option value="appointment">Appointment</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="action-title">
                  Title <span aria-label="required">*</span>
                </label>
                <input
                  type="text"
                  id="action-title"
                  name="actionTitle"
                  required
                  aria-required="true"
                  maxLength={200}
                  placeholder="Enter action title"
                />
              </div>

              <div className="form-group">
                <label htmlFor="action-description">
                  Description <span aria-label="required">*</span>
                </label>
                <textarea
                  id="action-description"
                  name="actionDescription"
                  required
                  aria-required="true"
                  maxLength={5000}
                  rows={4}
                  placeholder="Describe the executive action"
                />
              </div>

              <button type="submit" className="btn-primary">
                Issue Action
              </button>
            </form>
          )}
        </section>
      )}
    </div>
  );
};

export default GovernmentDashboard;
