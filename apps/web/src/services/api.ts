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
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  private saveTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data = await response.json();
      this.saveTokens(data.accessToken, data.refreshToken);
      return true;
    } catch (error) {
      this.clearTokens();
      return false;
    }
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

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      let response = await fetch(url, {
        ...options,
        headers,
      });

      // If unauthorized, try to refresh token
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed && this.accessToken) {
          // Retry request with new token
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          response = await fetch(url, {
            ...options,
            headers,
          });
        } else {
          // Refresh failed, redirect to login
          window.location.href = '/login';
          throw new Error('Session expired. Please log in again.');
        }
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
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error',
      };
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, displayName?: string): Promise<ApiResponse> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
  }

  async logout(): Promise<void> {
    if (this.refreshToken) {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });
    }
    this.clearTokens();
  }

  // Parliament
  async getChambers(gameId: string): Promise<ApiResponse> {
    return this.request(`/parliament/chambers?gameId=${gameId}`);
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

  // Government
  async getGovernment(gameId: string): Promise<ApiResponse> {
    return this.request(`/government?gameId=${gameId}`);
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

  // Elections
  async getElections(gameId: string): Promise<ApiResponse> {
    return this.request(`/elections?gameId=${gameId}`);
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

  // Judiciary
  async getCases(gameId: string): Promise<ApiResponse> {
    return this.request(`/judiciary/cases?gameId=${gameId}`);
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

  // Media
  async getPressReleases(gameId: string): Promise<ApiResponse> {
    return this.request(`/media/press?gameId=${gameId}`);
  }

  async publishPressRelease(data: any): Promise<ApiResponse> {
    return this.request('/media/press', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPolls(gameId: string): Promise<ApiResponse> {
    return this.request(`/media/polls?gameId=${gameId}`);
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
}

// Export singleton instance
export const api = new ApiClient();
export default api;
