/**
 * Media System Component
 * Manages press releases, polls, media coverage, and public opinion
 * WCAG 2.2 AA Compliant
 */

import React, { useState, useEffect, useCallback } from 'react';
import './MediaSystem.css';

interface PressRelease {
  id: string;
  title: string;
  content: string;
  issuedBy: string;
  issuedAt: string;
  category: string;
  views: number;
}

interface Poll {
  id: string;
  question: string;
  options: string[];
  startDate: string;
  endDate: string;
  status: string;
  totalVotes: number;
}

interface MediaCoverage {
  id: string;
  outlet: string;
  headline: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  publishedAt: string;
  reach: number;
}

interface ApprovalRating {
  entity: string;
  rating: number;
  change: number;
  lastUpdated: string;
}

interface MediaSystemProps {
  gameId: string;
  onPublishRelease?: (data: { title: string; content: string; category: string }) => void;
  onCreatePoll?: (data: { question: string; options: string[] }) => void;
  onVotePoll?: (data: { pollId: string; option: string }) => void;
}

const MediaSystem: React.FC<MediaSystemProps> = ({
  gameId,
  onPublishRelease,
  onCreatePoll,
  onVotePoll,
}) => {
  const [pressReleases, setPressReleases] = useState<PressRelease[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [coverage, setCoverage] = useState<MediaCoverage[]>([]);
  const [approvalRatings, setApprovalRatings] = useState<ApprovalRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'press' | 'polls' | 'coverage' | 'opinion'>('press');

  const fetchPressReleases = useCallback(async () => {
    try {
      const response = await fetch(`/api/media/press-releases?gameId=${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch press releases');
      const data = await response.json();
      if (data.success) {
        setPressReleases(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [gameId]);

  const fetchPolls = useCallback(async () => {
    try {
      const response = await fetch(`/api/media/polls?gameId=${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch polls');
      const data = await response.json();
      if (data.success) {
        setPolls(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [gameId]);

  const fetchCoverage = useCallback(async () => {
    try {
      const response = await fetch(`/api/media/coverage?gameId=${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch coverage');
      const data = await response.json();
      if (data.success) {
        setCoverage(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [gameId]);

  const fetchApprovalRatings = useCallback(async () => {
    try {
      const response = await fetch(`/api/media/approval-ratings?gameId=${gameId}`);
      if (!response.ok) throw new Error('Failed to fetch approval ratings');
      const data = await response.json();
      if (data.success) {
        setApprovalRatings(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [gameId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPressReleases(),
        fetchPolls(),
        fetchCoverage(),
        fetchApprovalRatings(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchPressReleases, fetchPolls, fetchCoverage, fetchApprovalRatings]);

  const handlePublishRelease = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get('releaseTitle') as string;
    const content = formData.get('releaseContent') as string;
    const category = formData.get('releaseCategory') as string;

    if (title && content && category && onPublishRelease) {
      onPublishRelease({ title, content, category });
      event.currentTarget.reset();
    }
  };

  const handleCreatePoll = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const question = formData.get('pollQuestion') as string;
    const optionsText = formData.get('pollOptions') as string;
    const options = optionsText.split('\n').filter(opt => opt.trim());

    if (question && options.length >= 2 && onCreatePoll) {
      onCreatePoll({ question, options });
      event.currentTarget.reset();
    }
  };

  if (loading) {
    return (
      <div className="media-system" role="status" aria-live="polite">
        <p>Loading media system...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="media-system" role="alert">
        <p className="error">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="media-system">
      <header className="media-header">
        <h1>Media & Public Opinion</h1>
        <p className="media-subtitle">Press, polls, and public sentiment</p>
      </header>

      <nav className="media-tabs" role="tablist" aria-label="Media sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'press'}
          aria-controls="press-panel"
          id="press-tab"
          onClick={() => setActiveTab('press')}
          className={activeTab === 'press' ? 'active' : ''}
        >
          Press Releases
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'polls'}
          aria-controls="polls-panel"
          id="polls-tab"
          onClick={() => setActiveTab('polls')}
          className={activeTab === 'polls' ? 'active' : ''}
        >
          Opinion Polls
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'coverage'}
          aria-controls="coverage-panel"
          id="coverage-tab"
          onClick={() => setActiveTab('coverage')}
          className={activeTab === 'coverage' ? 'active' : ''}
        >
          Media Coverage
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'opinion'}
          aria-controls="opinion-panel"
          id="opinion-tab"
          onClick={() => setActiveTab('opinion')}
          className={activeTab === 'opinion' ? 'active' : ''}
        >
          Public Opinion
        </button>
      </nav>

      {activeTab === 'press' && (
        <section
          id="press-panel"
          role="tabpanel"
          aria-labelledby="press-tab"
          className="press-section"
        >
          <h2>Press Releases</h2>

          {pressReleases.length === 0 ? (
            <p>No press releases published yet.</p>
          ) : (
            <ul className="press-list" aria-label="List of press releases">
              {pressReleases.map(release => (
                <li key={release.id} className="press-card">
                  <div className="press-header">
                    <h3>{release.title}</h3>
                    <span className={`press-category category-${release.category}`}>
                      {release.category}
                    </span>
                  </div>
                  <p className="press-content">{release.content}</p>
                  <div className="press-meta">
                    <span>By: {release.issuedBy}</span>
                    <span>Published: {new Date(release.issuedAt).toLocaleDateString()}</span>
                    <span>Views: {release.views.toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {onPublishRelease && (
            <form
              className="publish-release-form"
              onSubmit={handlePublishRelease}
              aria-labelledby="publish-release-heading"
            >
              <h3 id="publish-release-heading">Publish Press Release</h3>

              <div className="form-group">
                <label htmlFor="release-title">
                  Title <span aria-label="required">*</span>
                </label>
                <input
                  type="text"
                  id="release-title"
                  name="releaseTitle"
                  required
                  aria-required="true"
                  maxLength={200}
                  placeholder="Enter press release title"
                />
              </div>

              <div className="form-group">
                <label htmlFor="release-category">
                  Category <span aria-label="required">*</span>
                </label>
                <select
                  id="release-category"
                  name="releaseCategory"
                  required
                  aria-required="true"
                >
                  <option value="">Select category...</option>
                  <option value="policy">Policy Announcement</option>
                  <option value="statement">Official Statement</option>
                  <option value="response">Response</option>
                  <option value="update">Update</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="release-content">
                  Content <span aria-label="required">*</span>
                </label>
                <textarea
                  id="release-content"
                  name="releaseContent"
                  required
                  aria-required="true"
                  maxLength={5000}
                  rows={6}
                  placeholder="Write press release content"
                />
              </div>

              <button type="submit" className="btn-primary">
                Publish Release
              </button>
            </form>
          )}
        </section>
      )}

      {activeTab === 'polls' && (
        <section
          id="polls-panel"
          role="tabpanel"
          aria-labelledby="polls-tab"
          className="polls-section"
        >
          <h2>Opinion Polls</h2>

          {polls.length === 0 ? (
            <p>No polls created yet.</p>
          ) : (
            <ul className="polls-list" aria-label="List of opinion polls">
              {polls.map(poll => (
                <li key={poll.id} className="poll-card">
                  <div className="poll-header">
                    <h3>{poll.question}</h3>
                    <span className={`poll-status status-${poll.status}`}>
                      {poll.status}
                    </span>
                  </div>
                  <div className="poll-options">
                    {poll.options.map((option, index) => (
                      <div key={index} className="poll-option">
                        <span>{option}</span>
                        {onVotePoll && poll.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => onVotePoll({ pollId: poll.id, option })}
                            className="btn-vote-option"
                          >
                            Vote
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="poll-meta">
                    <span>Total Votes: {poll.totalVotes.toLocaleString()}</span>
                    <span>
                      {new Date(poll.startDate).toLocaleDateString()} -{' '}
                      {new Date(poll.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {onCreatePoll && (
            <form
              className="create-poll-form"
              onSubmit={handleCreatePoll}
              aria-labelledby="create-poll-heading"
            >
              <h3 id="create-poll-heading">Create Opinion Poll</h3>

              <div className="form-group">
                <label htmlFor="poll-question">
                  Question <span aria-label="required">*</span>
                </label>
                <input
                  type="text"
                  id="poll-question"
                  name="pollQuestion"
                  required
                  aria-required="true"
                  maxLength={200}
                  placeholder="Enter poll question"
                />
              </div>

              <div className="form-group">
                <label htmlFor="poll-options">
                  Options (one per line) <span aria-label="required">*</span>
                </label>
                <textarea
                  id="poll-options"
                  name="pollOptions"
                  required
                  aria-required="true"
                  rows={4}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                />
              </div>

              <button type="submit" className="btn-primary">
                Create Poll
              </button>
            </form>
          )}
        </section>
      )}

      {activeTab === 'coverage' && (
        <section
          id="coverage-panel"
          role="tabpanel"
          aria-labelledby="coverage-tab"
          className="coverage-section"
        >
          <h2>Media Coverage</h2>

          {coverage.length === 0 ? (
            <p>No media coverage yet.</p>
          ) : (
            <ul className="coverage-list" aria-label="List of media coverage">
              {coverage.map(item => (
                <li key={item.id} className="coverage-card">
                  <div className="coverage-header">
                    <h3>{item.headline}</h3>
                    <span className={`sentiment-badge sentiment-${item.sentiment}`}>
                      {item.sentiment}
                    </span>
                  </div>
                  <div className="coverage-meta">
                    <span className="outlet">{item.outlet}</span>
                    <span>Published: {new Date(item.publishedAt).toLocaleDateString()}</span>
                    <span>Reach: {item.reach.toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {activeTab === 'opinion' && (
        <section
          id="opinion-panel"
          role="tabpanel"
          aria-labelledby="opinion-tab"
          className="opinion-section"
        >
          <h2>Public Opinion & Approval Ratings</h2>

          {approvalRatings.length === 0 ? (
            <p>No approval ratings available yet.</p>
          ) : (
            <ul className="approval-list" aria-label="List of approval ratings">
              {approvalRatings.map((rating, index) => (
                <li key={index} className="approval-card">
                  <div className="approval-entity">{rating.entity}</div>
                  <div className="approval-rating">
                    <span className="rating-value">{rating.rating}%</span>
                    <span className={`rating-change ${rating.change >= 0 ? 'positive' : 'negative'}`}>
                      {rating.change >= 0 ? '+' : ''}{rating.change}%
                    </span>
                  </div>
                  <div className="approval-bar">
                    <div
                      className="approval-fill"
                      style={{ width: `${rating.rating}%` }}
                      role="progressbar"
                      aria-valuenow={rating.rating}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${rating.entity} approval rating`}
                    />
                  </div>
                  <div className="approval-meta">
                    Last updated: {new Date(rating.lastUpdated).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};

export default MediaSystem;
