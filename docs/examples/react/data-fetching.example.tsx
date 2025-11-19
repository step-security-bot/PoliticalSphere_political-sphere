/**
 * React Data Fetching Patterns
 *
 * Examples covering:
 * - Custom data fetching hooks
 * - Loading and error states
 * - Pagination and infinite scroll
 * - Real-time updates
 * - Optimistic updates
 *
 * @see docs/05-engineering-and-devops/languages/react.md
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// BASIC DATA FETCHING HOOK
// ============================================================================

interface UseDataResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Basic data fetching hook with loading and error states
 */
export function useData<T>(url: string): UseDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Usage Example
export function BillsList() {
  const { data: bills, loading, error, refetch } = useData<Bill[]>('/api/bills');

  if (loading) {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading bills...</span>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="error">
        <h2>Error Loading Bills</h2>
        <p>{error.message}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Bills ({bills?.length || 0})</h1>
      <button onClick={refetch} aria-label="Refresh bills list">
        Refresh
      </button>
      <ul>
        {bills?.map(bill => (
          <li key={bill.id}>
            <h3>{bill.title}</h3>
            <p>{bill.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// PAGINATION HOOK
// ============================================================================

interface UsePaginationResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}

export function usePagination<T>(baseUrl: string, pageSize = 20): UsePaginationResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = `${baseUrl}?page=${page}&limit=${pageSize}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        setData(json.data);
        setTotalPages(json.meta.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [baseUrl, page, pageSize]);

  return {
    data,
    loading,
    error,
    page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: () => setPage(p => Math.min(p + 1, totalPages)),
    prevPage: () => setPage(p => Math.max(p - 1, 1)),
    goToPage: newPage => setPage(Math.min(Math.max(newPage, 1), totalPages)),
  };
}

// Usage Example
export function PaginatedBillsList() {
  const {
    data: bills,
    loading,
    error,
    page,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
  } = usePagination<Bill>('/api/bills');

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;

  return (
    <div>
      <ul>
        {bills.map(bill => (
          <BillCard key={bill.id} bill={bill} />
        ))}
      </ul>

      <nav aria-label="Pagination" className="pagination">
        <button onClick={prevPage} disabled={!hasPrevPage} aria-label="Previous page">
          Previous
        </button>

        <span aria-live="polite">
          Page {page} of {totalPages}
        </span>

        <button onClick={nextPage} disabled={!hasNextPage} aria-label="Next page">
          Next
        </button>
      </nav>
    </div>
  );
}

// ============================================================================
// INFINITE SCROLL HOOK
// ============================================================================

interface UseInfiniteScrollResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
  sentinelRef: React.RefObject<HTMLDivElement>;
}

export function useInfiniteScroll<T>(baseUrl: string, pageSize = 20): UseInfiniteScrollResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      setError(null);

      const url = `${baseUrl}?page=${page}&limit=${pageSize}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = await response.json();

      setData(prev => [...prev, ...json.data]);
      setHasMore(json.meta.hasNextPage);
      setPage(p => p + 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [baseUrl, page, pageSize, loading, hasMore]);

  // Intersection Observer for automatic loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const sentinel = sentinelRef.current;
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, [loadMore, hasMore, loading]);

  return { data, loading, error, hasMore, loadMore, sentinelRef };
}

// Usage Example
export function InfiniteBillsList() {
  const {
    data: bills,
    loading,
    error,
    hasMore,
    sentinelRef,
  } = useInfiniteScroll<Bill>('/api/bills');

  return (
    <div>
      <h1>Bills</h1>

      {error && <ErrorDisplay error={error} />}

      <ul>
        {bills.map(bill => (
          <BillCard key={bill.id} bill={bill} />
        ))}
      </ul>

      {/* Sentinel element for intersection observer */}
      <div ref={sentinelRef} className="sentinel">
        {loading && <LoadingSpinner />}
        {!hasMore && <p>No more bills to load</p>}
      </div>
    </div>
  );
}

// ============================================================================
// REAL-TIME DATA HOOK (WebSocket)
// ============================================================================

export function useRealTimeData<T>(url: string, initialData: T[] = []) {
  const [data, setData] = useState<T[]>(initialData);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = event => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'INITIAL_DATA':
          setData(message.data);
          break;
        case 'ITEM_ADDED':
          setData(prev => [...prev, message.item]);
          break;
        case 'ITEM_UPDATED':
          setData(prev =>
            prev.map((item: any) => (item.id === message.item.id ? message.item : item))
          );
          break;
        case 'ITEM_DELETED':
          setData(prev => prev.filter((item: any) => item.id !== message.itemId));
          break;
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.log('WebSocket disconnected');
    };

    ws.onerror = error => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  return { data, connected };
}

// Usage Example
export function RealTimeVotes() {
  const { data: votes, connected } = useRealTimeData<Vote>('ws://localhost:3000/votes');

  return (
    <div>
      <div className="status-indicator">
        <span className={connected ? 'connected' : 'disconnected'}>
          {connected ? '🟢 Live' : '🔴 Disconnected'}
        </span>
      </div>

      <h1>Live Vote Count: {votes.length}</h1>

      <ul>
        {votes.map(vote => (
          <li key={vote.id}>
            User {vote.userId} voted {vote.position}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// OPTIMISTIC UPDATES HOOK
// ============================================================================

interface UseMutationOptions<T, V> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  optimisticUpdate?: (variables: V) => T;
}

export function useMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>,
  options: UseMutationOptions<T, V> = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (variables: V) => {
    try {
      setLoading(true);
      setError(null);

      // Optimistic update (if provided)
      if (options.optimisticUpdate) {
        const optimisticData = options.optimisticUpdate(variables);
        // Apply optimistic update immediately
      }

      const data = await mutationFn(variables);

      options.onSuccess?.(data);

      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);

      // Rollback optimistic update
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}

// Usage Example
export function VoteButton({ billId }: { billId: string }) {
  const [voteCount, setVoteCount] = useState(0);

  const { mutate: castVote, loading } = useMutation(
    async (position: 'for' | 'against') => {
      const response = await fetch(`/api/bills/${billId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position }),
      });
      return response.json();
    },
    {
      optimisticUpdate: () => {
        // Optimistically increment count
        setVoteCount(prev => prev + 1);
        return {} as any;
      },
      onError: () => {
        // Rollback on error
        setVoteCount(prev => prev - 1);
      },
    }
  );

  return (
    <div>
      <p>Vote Count: {voteCount}</p>
      <button onClick={() => castVote('for')} disabled={loading} aria-busy={loading}>
        {loading ? 'Voting...' : 'Vote For'}
      </button>
    </div>
  );
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Bill {
  id: string;
  title: string;
  status: 'draft' | 'proposed' | 'active_voting' | 'passed' | 'rejected';
  category: string;
}

interface Vote {
  id: string;
  billId: string;
  userId: string;
  position: 'for' | 'against' | 'abstain';
}

// Mock components
function LoadingSpinner() {
  return <div>Loading...</div>;
}

function ErrorDisplay({ error }: { error: Error }) {
  return <div>Error: {error.message}</div>;
}

function BillCard({ bill }: { bill: Bill }) {
  return <div>{bill.title}</div>;
}
