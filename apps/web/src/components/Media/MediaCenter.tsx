/**
 * Media Center Component
 * News, press releases, polls, and public opinion
 * WCAG 2.2 AA Compliant
 */

import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import './MediaCenter.css';

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  publishedAt: string;
  views: number;
}

interface Poll {
  id: string;
  question: string;
  options: string[];
  votes: number[];
  totalVotes: number;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'closed';
}

interface MediaCenterProps {
  userId: string;
  onError?: (error: string) => void;
}

export const MediaCenter: React.FC<MediaCenterProps> = ({ userId: _userId, onError }) => {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'news' | 'polls'>('news');
  const [votingPollId, setVotingPollId] = useState<string | null>(null);

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const [newsRes, pollsRes] = await Promise.all([api.getPressReleases(), api.getPolls()]);

      if (newsRes.success) setNews((newsRes.data as NewsArticle[]) || []);
      if (pollsRes.success) setPolls((pollsRes.data as Poll[]) || []);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to fetch media');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    fetchMedia();
    const interval = setInterval(fetchMedia, 30000);
    return () => clearInterval(interval);
  }, [fetchMedia]);

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (votingPollId) return; // Prevent multiple votes

    setVotingPollId(pollId);
    try {
      const response = await api.votePoll(pollId, optionIndex);
      if (response.success) {
        fetchMedia();
      } else {
        onError?.(response.error || 'Failed to vote');
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to vote');
    } finally {
      setVotingPollId(null);
    }
  };

  if (loading) {
    return (
      <div className="media-center loading">
        <p>Loading Media...</p>
      </div>
    );
  }

  return (
    <div className="media-center">
      <header className="media-header">
        <h1>Media Center</h1>
        <nav className="media-tabs">
          <button
            type="button"
            onClick={() => setActiveTab('news')}
            className={activeTab === 'news' ? 'active' : ''}
          >
            News ({news.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('polls')}
            className={activeTab === 'polls' ? 'active' : ''}
          >
            Polls ({polls.length})
          </button>
        </nav>
      </header>

      <main className="media-content">
        {activeTab === 'news' && (
          <section className="news-section">
            <div className="news-grid">
              {news.map(article => (
                <article key={article.id} className="news-card">
                  <h3>{article.title}</h3>
                  <p>{article.content.substring(0, 150)}...</p>
                  <footer>
                    <span>{article.author}</span>
                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                  </footer>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'polls' && (
          <section className="polls-section">
            <div className="polls-grid">
              {polls.map(poll => (
                <article key={poll.id} className="poll-card">
                  <h3>{poll.question}</h3>
                  <div className="poll-options">
                    {poll.options.map((option, idx) => (
                      <button
                        key={`${poll.id}-${option}`}
                        type="button"
                        onClick={() => handleVote(poll.id, idx)}
                        className="poll-option"
                        disabled={poll.status === 'closed' || votingPollId === poll.id}
                      >
                        <span>{option}</span>
                        <span className="poll-votes">
                          {poll.votes?.[idx] ?? 0} (
                          {Math.round(((poll.votes?.[idx] ?? 0) / (poll.totalVotes || 1)) * 100)}
                          %)
                        </span>
                      </button>
                    ))}
                  </div>
                  <footer>
                    <span>Total Votes: {poll.totalVotes}</span>
                    <span className={`status-${poll.status}`}>{poll.status}</span>
                  </footer>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default MediaCenter;
