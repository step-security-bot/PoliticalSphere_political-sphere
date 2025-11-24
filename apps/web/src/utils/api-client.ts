/**
 * API Client
 * Handles all API communication with authentication
 */

const API_BASE_URL =
  (import.meta.env?.VITE_API_URL as string | undefined) || 'http://localhost:3001';

/**
 * Client for making authenticated API requests to the Political Sphere backend.
 * Manages JWT tokens, automatic token refresh, and provides typed request methods.
 * Handles authentication state and token persistence in localStorage.
 */
class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.refreshToken) {
      // Try to refresh token
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (refreshResponse.ok) {
          const { accessToken } = await refreshResponse.json();
          this.accessToken = accessToken;
          localStorage.setItem('accessToken', accessToken);

          // Retry original request
          headers.Authorization = `Bearer ${accessToken}`;
          const retryResponse = await fetch(url, { ...options, headers });
          if (!retryResponse.ok) {
            throw new Error(`HTTP ${retryResponse.status}`);
          }
          return retryResponse.json();
        } else {
          // Refresh failed, clear tokens
          this.clearTokens();
          window.location.href = '/login';
          throw new Error('Session expired');
        }
      } catch {
        this.clearTokens();
        window.location.href = '/login';
        throw new Error('Session expired');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async register(username: string, password: string, email?: string) {
    const data = await this.request<{
      user: any;
      tokens: { accessToken: string; refreshToken: string };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    });
    this.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    return data.user;
  }

  async login(username: string, password: string) {
    const data = await this.request<{
      user: any;
      tokens: { accessToken: string; refreshToken: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    return data.user;
  }

  logout(): void {
    this.clearTokens();
    window.location.href = '/login';
  }

  async getCurrentUser() {
    return this.request<{ user: any }>('/auth/me');
  }

  // Game endpoints
  async createGame(name: string) {
    return this.request<{ game: any }>('/game/create', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async listGames() {
    return this.request<{ games: any[] }>('/game/list');
  }

  async getMyGames() {
    return this.request<{ games: any[] }>('/game/my-games');
  }

  async getGame(gameId: string) {
    return this.request<{ game: any }>(`/game/${gameId}`);
  }

  async joinGame(gameId: string) {
    return this.request<{ game: any }>(`/game/${gameId}/join`, {
      method: 'POST',
    });
  }

  async startGame(gameId: string) {
    return this.request<{ game: any }>(`/game/${gameId}/start`, {
      method: 'POST',
    });
  }

  async sendAction(gameId: string, type: string, payload: any = {}) {
    return this.request<{ game: any }>(`/game/${gameId}/action`, {
      method: 'POST',
      body: JSON.stringify({ type, payload }),
    });
  }

  async deleteGame(gameId: string) {
    return this.request<{ success: boolean }>(`/game/${gameId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
