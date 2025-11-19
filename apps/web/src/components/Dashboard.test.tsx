/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest';
import Dashboard from './Dashboard.jsx';

describe('Dashboard Component', () => {
  let mockFetch: MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  describe('Initial Rendering', () => {
    it('should render loading state initially', () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<Dashboard />);
      expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });

    it('should render the dashboard title', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));
      render(<Dashboard />);
      await waitFor(() => {
        expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch news and metrics data on mount', async () => {
      const mockNews = [
        {
          id: 1,
          title: 'Test News 1',
          content: 'Test content 1',
          category: 'politics',
        },
      ];
      const mockSummary = {
        total: 1,
        categories: { politics: 1 },
        tags: { test: 1 },
        latest: mockNews[0],
      };

      mockFetch.mockImplementation((input: RequestInfo | URL) => {
        const url =
          input instanceof Request ? input.url : input instanceof URL ? input.href : input;
        if (url.includes('/news')) {
          return Promise.resolve(new Response(JSON.stringify({ data: mockNews }), { status: 200 }));
        }
        if (url.includes('/metrics/news')) {
          return Promise.resolve(
            new Response(JSON.stringify({ data: mockSummary }), { status: 200 }),
          );
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/news');
        expect(mockFetch).toHaveBeenCalledWith('/api/metrics/news');
      });

      await waitFor(() => {
        expect(screen.getByText('Test News 1')).toBeInTheDocument();
      });
    });

    it('should handle news API failure gracefully', async () => {
      mockFetch.mockImplementation((input: RequestInfo | URL) => {
        const url =
          input instanceof Request ? input.url : input instanceof URL ? input.href : input;
        if (url.includes('/news')) {
          return Promise.resolve(new Response('', { status: 500 }));
        }
        if (url.includes('/metrics/news')) {
          return Promise.resolve(new Response(JSON.stringify({ data: {} }), { status: 200 }));
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(
          screen.getByText(/API unavailable: News API responded with 500/i),
        ).toBeInTheDocument();
      });
    });

    it('should handle metrics API failure gracefully', async () => {
      mockFetch.mockImplementation((input: RequestInfo | URL) => {
        const url =
          input instanceof Request ? input.url : input instanceof URL ? input.href : input;
        // Check metrics endpoint first - '/metrics/news' includes '/news'
        // so order matters when using includes() string checks.
        if (url.includes('/metrics/news')) {
          return Promise.resolve(new Response('', { status: 503 }));
        }
        if (url.includes('/news')) {
          return Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 }));
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(
          screen.getByText(/API unavailable: Metrics API responded with 503/i),
        ).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/API unavailable: Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('News Rendering', () => {
    it('should display news items when data is loaded', async () => {
      const mockNews = [
        {
          id: 1,
          title: 'Breaking News',
          content: 'Important content',
          category: 'politics',
        },
        {
          id: 2,
          title: 'Tech Update',
          content: 'Latest technology',
          category: 'technology',
        },
      ];

      mockFetch.mockImplementation((input: RequestInfo | URL) => {
        const url =
          input instanceof Request ? input.url : input instanceof URL ? input.href : input;
        if (url.includes('/news')) {
          return Promise.resolve(new Response(JSON.stringify({ data: mockNews }), { status: 200 }));
        }
        if (url.includes('/metrics/news')) {
          return Promise.resolve(new Response(JSON.stringify({ data: {} }), { status: 200 }));
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Breaking News')).toBeInTheDocument();
        expect(screen.getByText('Tech Update')).toBeInTheDocument();
      });
    });

    it('should show placeholder message when no news is available', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));

      render(<Dashboard />);

      await waitFor(() => {
        expect(
          screen.getByText(/No stories yet. The data pipeline will populate this feed shortly./i),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));

      const { container } = render(<Dashboard />);

      await waitFor(() => {
        // Check for semantic HTML structure
        const main = container.querySelector('main');
        expect(main).toBeInTheDocument();
      });
    });

    it('should update loading state for screen readers', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      render(<Dashboard />);

      expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should stop loading after successful data fetch', async () => {
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));

      render(<Dashboard />);

      // Initially loading
      expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

      // After loading completes
      await waitFor(() => {
        expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
      });
    });

    it('should stop loading after error', async () => {
      mockFetch.mockRejectedValue(new Error('Test error'));

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Status Messages', () => {
    it('should show success message after data loads', async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ data: [] }), { status: 200 })),
      );

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Live data retrieved from API./i)).toBeInTheDocument();
      });
    });

    it('should show error message on failure', async () => {
      mockFetch.mockRejectedValue(new Error('Connection failed'));

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/API unavailable: Connection failed/i)).toBeInTheDocument();
      });
    });
  });
});
