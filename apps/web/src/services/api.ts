/**
 * API Client Service
 * Centralized API communication with authentication
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
    this.loadTokens();
  }

  private loadTokens(): void {
    // Tokens are now managed by httpOnly cookies on the server side
    // Client-side storage removed for security
  }

  private saveTokens(): void {
    // Tokens are now managed by httpOnly cookies on the server side
    // Client-side storage removed for security
  }

  private clearTokens(): void {
    // Tokens are now managed by httpOnly cookies on the server side
    // Client-side storage removed for security
  }

  private async refreshAccessToken(): Promise<boolean> {
    // Token refresh is now handled server-side with httpOnly cookies
    // Client-side refresh removed for security
    return false;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
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
  async login(email: string, password: string): Promise<ApiResponse> {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Tokens are now managed server-side with httpOnly cookies
    // No client-side token storage

    return response;
  }

  async register(username: string, email: string, password: string): Promise<ApiResponse> {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });

    // Tokens are now managed server-side with httpOnly cookies
    // No client-side token storage

    return response;
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', {
      method: 'POST',
    });
    // Cookies are cleared server-side
  }

  // Parliament (Single World - no gameId needed)
  async getChambers(): Promise<ApiResponse> {
    return this.request('/parliament/chambers');
  }

  async createChamber(data: any): Promise<ApiResponse> {
    return this.request('/parliament/chambers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMotions(chamberId: string): Promise<ApiResponse> {
    return this.request(`/parliament/motions?chamberId=${chamberId}`);
  }

  async createMotion(data: any): Promise<ApiResponse> {
    return this.request('/parliament/motions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async castVote(motionId: string, vote: string): Promise<ApiResponse> {
    return this.request('/parliament/votes', {
      method: 'POST',
      body: JSON.stringify({ motionId, vote }),
    });
  }

  async getVoteResults(motionId: string): Promise<ApiResponse> {
    return this.request(`/parliament/motions/${motionId}/results`);
  }

  // Government (Single World)
  async getGovernment(): Promise<ApiResponse> {
    return this.request('/government');
  }

  async formGovernment(data: any): Promise<ApiResponse> {
    return this.request('/government', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async appointMinister(governmentId: string, data: any): Promise<ApiResponse> {
    return this.request(`/government/${governmentId}/ministers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async issueExecutiveAction(governmentId: string, data: any): Promise<ApiResponse> {
    return this.request(`/government/${governmentId}/actions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Elections (Single World)
  async getElections(): Promise<ApiResponse> {
    return this.request('/elections');
  }

  async createElection(data: any): Promise<ApiResponse> {
    return this.request('/elections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async registerCandidate(electionId: string, data: any): Promise<ApiResponse> {
    return this.request(`/elections/${electionId}/candidates`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async castElectionVote(electionId: string, data: any): Promise<ApiResponse> {
    return this.request(`/elections/${electionId}/vote`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Judiciary (Single World)
  async getCases(): Promise<ApiResponse> {
    return this.request('/judiciary/cases');
  }

  async fileCase(data: any): Promise<ApiResponse> {
    return this.request('/judiciary/cases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async issueRuling(caseId: string, data: any): Promise<ApiResponse> {
    return this.request(`/judiciary/cases/${caseId}/ruling`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCaseRuling(caseId: string): Promise<ApiResponse> {
    return this.request(`/judiciary/cases/${caseId}/ruling`);
  }

  // Media (Single World)
  async getPressReleases(): Promise<ApiResponse> {
    return this.request('/media/press');
  }

  async publishPressRelease(data: any): Promise<ApiResponse> {
    return this.request('/media/press', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPolls(): Promise<ApiResponse> {
    return this.request('/media/polls');
  }

  async createPoll(data: any): Promise<ApiResponse> {
    return this.request('/media/polls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async votePoll(pollId: string, optionIndex: number): Promise<ApiResponse> {
    return this.request(`/media/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionIndex }),
    });
  }

  // User Profile
  async getProfile(userId: string): Promise<ApiResponse> {
    return this.request(`/users/${userId}`);
  }

  async updateProfile(userId: string, data: any): Promise<ApiResponse> {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getUserStats(userId: string): Promise<ApiResponse> {
    return this.request(`/users/${userId}/stats`);
  }

  // Simulation State (Single World)
  async getSimulationState(): Promise<ApiResponse> {
    return this.request('/simulation/state');
  }

  async getActivePlayers(): Promise<ApiResponse> {
    return this.request('/simulation/players');
  }

  async getSimulationStats(): Promise<ApiResponse> {
    return this.request('/simulation/stats');
  }

  // Game Management (Multi-World)
  async listGames(): Promise<ApiResponse> {
    return this.request('/games');
  }

  async getMyGames(): Promise<ApiResponse> {
    return this.request('/games/my');
  }

  async createGame(name: string): Promise<ApiResponse> {
    return this.request('/games', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async joinGame(gameId: string): Promise<ApiResponse> {
    return this.request(`/games/${gameId}/join`, {
      method: 'POST',
    });
  }

  async getGameState(gameId: string): Promise<ApiResponse> {
    return this.request(`/games/${gameId}/state`);
  }
}

// Export singleton instance
export const api = new ApiClient();
export default api;
