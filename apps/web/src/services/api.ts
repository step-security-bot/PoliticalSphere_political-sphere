/**
 * API Client Service
 * Centralized API communication with authentication
 */

// Type definitions based on shared schemas
export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bill {
  id: string;
  title: string;
  description?: string;
  proposerId: string;
  status: 'proposed' | 'debating' | 'passed' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface Party {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: Date;
}

export interface Vote {
  id: string;
  billId: string;
  userId: string;
  vote: 'aye' | 'nay' | 'abstain';
  createdAt: Date;
}

export interface VoteCounts {
  aye: number;
  nay: number;
  abstain: number;
  total: number;
}

export interface Judge {
  id: string;
  userId: string;
  username: string;
  court: 'supreme' | 'appeal' | 'high';
  appointedAt: string;
  status: 'active' | 'retired';
}

export interface Case {
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

export interface JudiciaryData {
  judges: Judge[];
  cases: Case[];
}

export interface CaseResponse {
  id: string;
  title: string;
  description: string;
  type: 'constitutional' | 'criminal' | 'civil' | 'administrative';
  createdAt: string;
}

export interface RulingResponse {
  id: string;
  caseId: string;
  decision: 'upheld' | 'overturned' | 'dismissed' | 'remanded';
  reasoning: string;
  issuedAt: string;
}

export interface BillsResponse {
  bills: Bill[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface PartiesResponse {
  parties: Party[];
}

export interface VotesResponse {
  votes: Vote[];
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Internal API payload helpers (avoid `any`)
interface ElectionSource {
  id: string | number;
  name: string;
  electionType?: string;
  startDate?: string;
  endDate?: string;
  status?: 'upcoming' | 'active' | 'completed';
  gameId?: string;
  totalVoters?: number;
  turnout?: number;
}

type GovernmentPayload = { cabinet?: unknown; actions?: unknown[]; policies?: unknown[] } | null;

type ChamberRaw = {
  id: string;
  gameId?: string;
  type?: string;
  name?: string;
  maxSeats?: number;
  quorumPercentage?: number;
  seats?: string[];
  status?: string;
  createdAt?: string;
};

type MotionRaw = {
  id: string;
  gameId?: string;
  chamberId: string;
  proposerId?: string;
  type?: string;
  title?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  result?: 'passed' | 'failed';
};

type PressRelease = {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  publishedAt: string;
  views: number;
};

type MediaPoll = {
  id: string;
  question: string;
  options: string[];
  votes: number[];
  totalVotes: number;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'closed';
};

// Deprecated: kept for historical reference; single-world mode no longer uses game summaries
type _GameSummary = {
  id: string;
  name: string;
  status: string;
  players?: Array<{ username: string }>;
  settings?: { maxPlayers?: number };
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    // Tokens are now managed by httpOnly cookies on the server side
  }

  // Elections
  async getElections(params?: { gameId?: string }): Promise<
    ApiResponse<{
      elections: Array<{
        id: string;
        name: string;
        type: 'general' | 'by-election' | 'local' | string;
        status: 'upcoming' | 'active' | 'completed';
        startDate: string;
        endDate: string;
        totalVoters: number;
        turnout: number;
      }>;
      constituencies: Array<{
        id: string;
        name: string;
        region?: string;
        population?: number;
        registeredVoters?: number;
        candidates?: Array<{
          id: string;
          userId?: string;
          username?: string;
          party?: string;
          votes?: number;
          manifesto?: string;
        }>;
      }>;
    }>
  > {
    const qs = params?.gameId ? `?gameId=${encodeURIComponent(params.gameId)}` : '';
    const res = await this.request<ElectionSource[] | unknown>(`/elections${qs}`);
    if (!res.success) {
      return { success: true, data: { elections: [], constituencies: [] } };
    }

    const raw: ElectionSource[] = Array.isArray(res.data) ? (res.data as ElectionSource[]) : [];
    const elections = raw.map(e => ({
      id: String(e.id ?? ''),
      name: String(e.name ?? 'Election'),
      type: (e.electionType as string) || 'general',
      status: (e.status as 'upcoming' | 'active' | 'completed') ?? 'upcoming',
      startDate: String(e.startDate ?? new Date().toISOString()),
      endDate: String(e.endDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
      totalVoters: Number(e.totalVoters ?? 0),
      turnout: Number(e.turnout ?? 0),
    }));

    return { success: true, data: { elections, constituencies: [] } };
  }

  async castElectionVote(
    electionId: string,
    data: { constituencyId?: string; candidateId?: string },
  ): Promise<ApiResponse<{ voted: boolean }>> {
    return this.request(`/elections/${encodeURIComponent(electionId)}/vote`, {
      method: 'POST',
      body: JSON.stringify(data ?? {}),
    });
  }

  // Government
  async getGovernment(): Promise<
    ApiResponse<{
      cabinet: unknown | null;
      actions: unknown[];
      policies: unknown[];
    }>
  > {
    const res = await this.request<GovernmentPayload>('/government');
    if (!res.success) {
      return { success: true, data: { cabinet: null, actions: [], policies: [] } };
    }
    // Some stubs return {success:true,data:null}; normalize to expected structure
    const base: GovernmentPayload = (res.data as GovernmentPayload) || {};
    return {
      success: true,
      data: {
        cabinet: base.cabinet ?? base ?? null,
        actions: base.actions ?? [],
        policies: base.policies ?? [],
      },
    };
  }

  async issueExecutiveAction(
    governmentId: string,
    data: {
      ministerId: string;
      type: 'policy' | 'appointment' | 'budget' | 'emergency' | string;
      title: string;
      description: string;
      portfolio?: string;
    },
  ): Promise<ApiResponse<{ id: string } | { executed: boolean }>> {
    return this.request(`/government/${encodeURIComponent(governmentId)}/actions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Parliament
  async getChambers(gameId?: string): Promise<ApiResponse<ChamberRaw[]>> {
    const qs = gameId ? `?gameId=${encodeURIComponent(gameId)}` : '';
    const res = await this.request<ChamberRaw[] | unknown>(`/parliament/chambers${qs}`);
    if (!res.success) return { success: true, data: [] };
    return { success: true, data: (Array.isArray(res.data) ? res.data : []) as ChamberRaw[] };
  }

  async getMotions(chamberId: string): Promise<ApiResponse<MotionRaw[]>> {
    const res = await this.request<MotionRaw[] | unknown>(
      `/parliament/motions?chamberId=${encodeURIComponent(chamberId)}`,
    );
    if (!res.success) return { success: true, data: [] };
    return {
      success: true,
      data: (Array.isArray(res.data) ? (res.data as MotionRaw[]) : []) as MotionRaw[],
    };
  }

  async getVoteResults(
    motionId: string,
  ): Promise<ApiResponse<{ total: number; aye: number; no: number; abstain: number }>> {
    const res = await this.request(`/parliament/votes/results/${encodeURIComponent(motionId)}`);
    if (!res.success) return { success: true, data: { total: 0, aye: 0, no: 0, abstain: 0 } };
    return res as ApiResponse<{ total: number; aye: number; no: number; abstain: number }>;
  }

  async createMotion(data: {
    chamberId: string;
    proposerId: string;
    type: 'debate' | 'vote' | 'amendment' | 'procedural' | string;
    title: string;
    description: string;
    gameId?: string;
  }): Promise<
    ApiResponse<{
      id?: string;
      gameId?: string;
      chamberId?: string;
      proposerId?: string;
      type?: string;
      title?: string;
      description?: string;
      status?: string;
      createdAt?: string;
    }>
  > {
    return this.request('/parliament/motions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async castVote(
    motionId: string,
    vote: 'aye' | 'no' | 'abstain',
  ): Promise<ApiResponse<{ id?: string }>> {
    return this.request('/parliament/votes', {
      method: 'POST',
      body: JSON.stringify({ motionId, vote }),
    });
  }

  // Media
  async getPressReleases(): Promise<
    ApiResponse<
      Array<{
        id: string;
        title: string;
        content: string;
        author: string;
        category: string;
        publishedAt: string;
        views: number;
      }>
    >
  > {
    const res = await this.request<PressRelease[] | unknown>('/media/press');
    if (!res.success) return { success: true, data: [] };
    return {
      success: true,
      data: (Array.isArray(res.data) ? (res.data as PressRelease[]) : []) as PressRelease[],
    };
  }

  async getPolls(): Promise<
    ApiResponse<
      Array<{
        id: string;
        question: string;
        options: string[];
        votes: number[];
        totalVotes: number;
        createdAt: string;
        expiresAt: string;
        status: 'active' | 'closed';
      }>
    >
  > {
    const res = await this.request<MediaPoll[] | unknown>('/media/polls');
    if (!res.success) return { success: true, data: [] };
    return {
      success: true,
      data: (Array.isArray(res.data) ? (res.data as MediaPoll[]) : []) as MediaPoll[],
    };
  }

  async votePoll(pollId: string, optionIndex: number): Promise<ApiResponse<MediaPoll>> {
    return this.request(`/media/polls/${encodeURIComponent(pollId)}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionIndex }),
    });
  }

  // Single-world mode: no lobby endpoints required

  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Authorization is now handled via httpOnly cookies
    // No client-side token management

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies for authentication
      });

      // If unauthorized, redirect to login
      if (response.status === 401) {
        window.location.href = '/login';
        throw new Error('Session expired. Please log in again.');
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || 'Request failed',
        };
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch {
      return {
        success: false,
        error: 'Network error',
      };
    }
  }

  // Authentication
  async login(emailOrUsername: string, password: string): Promise<ApiResponse<{ user: User }>> {
    const response = await this.request<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: emailOrUsername.includes('@') ? emailOrUsername : undefined,
        username: emailOrUsername.includes('@') ? undefined : emailOrUsername,
        password,
      }),
    });

    return response;
  }

  async register(username: string, email: string, password: string): Promise<ApiResponse<{ user: User }>> {
    const response = await this.request<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });

    return response;
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // User Management
  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.request('/users');
  }

  async getUser(userId: string): Promise<ApiResponse<User>> {
    return this.request(`/users/${userId}`);
  }

  async updateUser(userId: string, data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse> {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Bill Operations
  async getBills(page?: number, limit?: number): Promise<ApiResponse<BillsResponse>> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/bills${query}`);
  }

  async getBill(billId: string): Promise<ApiResponse<Bill>> {
    return this.request(`/bills/${billId}`);
  }

  async createBill(data: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Bill>> {
    return this.request('/bills', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBill(
    billId: string,
    data: Partial<Pick<Bill, 'title' | 'description' | 'status'>>,
  ): Promise<ApiResponse<Bill>> {
    return this.request(`/bills/${billId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Party Management
  async getParties(): Promise<ApiResponse<PartiesResponse>> {
    return this.request('/parties');
  }

  async getParty(partyId: string): Promise<ApiResponse<Party>> {
    return this.request(`/parties/${partyId}`);
  }

  async createParty(data: Omit<Party, 'id' | 'createdAt'>): Promise<ApiResponse<Party>> {
    return this.request('/parties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateParty(
    partyId: string,
    data: Partial<Pick<Party, 'name' | 'description' | 'color'>>,
  ): Promise<ApiResponse<Party>> {
    return this.request(`/parties/${partyId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteParty(partyId: string): Promise<ApiResponse> {
    return this.request(`/parties/${partyId}`, {
      method: 'DELETE',
    });
  }

  // Voting
  async createVote(data: Omit<Vote, 'id' | 'createdAt'>): Promise<ApiResponse<Vote>> {
    return this.request('/votes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getVotesForBill(billId: string): Promise<ApiResponse<VotesResponse>> {
    return this.request(`/bills/${billId}/votes`);
  }

  async getVoteCounts(billId: string): Promise<ApiResponse<VoteCounts>> {
    return this.request(`/bills/${billId}/vote-counts`);
  }

  // Judiciary
  async getCases(gameId: string = 'default'): Promise<ApiResponse<JudiciaryData>> {
    return this.request(`/judiciary/cases?gameId=${gameId}`);
  }

  async fileCase(data: {
    gameId?: string;
    plaintiffId?: string | null;
    defendantId?: string | null;
    title: string;
    description: string;
    type: 'constitutional' | 'criminal' | 'civil' | 'administrative';
    court?: 'supreme' | 'appeal' | 'high';
    plaintiff?: string;
    defendant?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    legalBasis?: string;
    targetLawId?: string | null;
    targetActionId?: string | null;
  }): Promise<ApiResponse<CaseResponse>> {
    return this.request('/judiciary/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async issueRuling(
    caseId: string,
    data: {
      decision: 'upheld' | 'overturned' | 'dismissed' | 'remanded';
      reasoning: string;
      precedentSetting?: boolean;
      constitutionalImpact?: 'none' | 'low' | 'moderate' | 'high';
    },
  ): Promise<ApiResponse<RulingResponse>> {
    return this.request(`/judiciary/rulings`, {
      method: 'POST',
      body: JSON.stringify({ caseId, ...data }),
    });
  }
}

// Export singleton instance
export const api = new ApiClient();
export default api;
