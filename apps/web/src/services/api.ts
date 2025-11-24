/**
 * API Service
 * Centralized API client for the Political Sphere application
 * Handles authentication, error handling, and request/response formatting
 * WCAG 2.2 AA Compliant (no direct UI impact)
 */

import type { AxiosResponse } from 'axios';
import axios from 'axios';
import { getMockSimulationState, updateMockSimulationState } from './simulationMock';

export interface SimulationState {
  id: string;
  currentTurn: number;
  status: 'active' | 'paused' | 'completed';
  players: Array<{
    id: string;
    name: string;
    role: string;
    influence: number;
  }>;
  policies: Array<{
    id: string;
    title: string;
    description: string;
    status: 'proposed' | 'active' | 'rejected';
    votes: {
      yes: number;
      no: number;
      abstain: number;
    };
  }>;
  economy: {
    gdp: number;
    unemployment: number;
    inflation: number;
  };
  society: {
    happiness: number;
    education: number;
    health: number;
  };
  environment: {
    pollution: number;
    renewableEnergy: number;
    biodiversity: number;
  };
  lastUpdated: string;
}

export interface Proposal {
  id: string;
  title: string;
  description?: string;
  status: 'proposed' | 'active' | 'rejected';
  votes: { yes: number; no: number; abstain: number };
  createdAt?: string;
}

export interface VoteResults {
  proposalId: string;
  totals: { yes: number; no: number; abstain: number };
}

export interface VoteCastResult {
  voteId?: string;
  status?: string;
}

export interface Election {
  id: string;
  gameId: string;
  name: string;
  electionType: 'general' | 'by_election' | 'local' | 'referendum';
  type?: 'general' | 'by_election' | 'local' | 'referendum'; // Alias for electionType
  startDate: string;
  endDate: string;
  description?: string;
  status: 'scheduled' | 'active' | 'closed' | 'certified';
  createdAt: string;
  totalVotes: number;
  totalVoters?: number; // Alias for totalVotes
  turnout: number;
  certifiedAt?: string;
}

export interface Constituency {
  id: string;
  electionId: string;
  name: string;
  population: number;
  registeredVoters: number;
  region: string;
  createdAt: string;
  votesCast: number;
  turnoutPercentage: number;
  candidates?: Array<{
    id: string;
    name: string;
    party: string;
    votes?: number;
  }>;
}

export interface ElectionVoteResult {
  electionId: string;
  constituencyId: string;
  voteCast: boolean;
}

export interface Government {
  id: string;
  cabinet: unknown[];
  actions: unknown[];
  policies: unknown[];
}

export interface Chamber {
  id: string;
  name: string;
  type: string;
}

export interface Motion {
  id: string;
  title: string;
  status: string;
}

export interface JudicialCase {
  id: string;
  title: string;
  status: string;
  caseNumber?: string;
  description?: string;
  type?: 'constitutional' | 'criminal' | 'civil' | 'administrative';
  court?: 'supreme' | 'appeal' | 'high';
  plaintiff?: string;
  defendant?: string;
  filedBy?: string;
  filedAt?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface Judge {
  id: string;
  name: string;
  userId?: string;
  username?: string;
  court?: 'supreme' | 'appeal' | 'high';
  appointedAt?: string;
  status?: 'active' | 'retired';
}

export interface Poll {
  id: string;
  question: string;
  options: unknown[];
}

export interface PressRelease {
  id: string;
  title: string;
  content: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api';
const USE_SIMULATION_STUB =
  import.meta.env.VITE_USE_SIMULATION_STUB === 'true' ||
  (import.meta.env.DEV && !import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ApiMethods {
  // Authentication endpoints
  login: (credentials: {
    email: string;
    password: string;
  }) => Promise<ApiResponse<{ token: string }>>;
  register: (userData: {
    email: string;
    password: string;
    username: string;
  }) => Promise<ApiResponse<{ token: string }>>;
  logout: () => Promise<ApiResponse<void>>;
  // Simulation endpoints
  getSimulationState: () => Promise<ApiResponse<SimulationState>>;
  updateSimulationState: (
    updates: Partial<SimulationState>
  ) => Promise<ApiResponse<SimulationState>>;
  // Governance endpoints
  getProposals: () => Promise<ApiResponse<Proposal[]>>;
  createProposal: (proposal: Partial<Proposal>) => Promise<ApiResponse<Proposal>>;
  // Voting endpoints
  castVote: (voteData: {
    proposalId: string;
    vote: 'yes' | 'no' | 'abstain';
  }) => Promise<ApiResponse<VoteCastResult>>;
  getVoteResults: (proposalId: string) => Promise<ApiResponse<VoteResults>>;
  // Elections endpoints
  getElections: () => Promise<
    ApiResponse<{ elections: Election[]; constituencies: Constituency[] }>
  >;
  castElectionVote: (
    electionId: string,
    voteData: { candidateId: string }
  ) => Promise<ApiResponse<ElectionVoteResult>>;
  // Government endpoints
  getGovernment: () => Promise<ApiResponse<Government>>;
  issueExecutiveAction: (action: unknown) => Promise<ApiResponse<unknown>>;
  // Parliament endpoints
  getChambers: () => Promise<ApiResponse<Chamber[]>>;
  getMotions: () => Promise<ApiResponse<Motion[]>>;
  createMotion: (motion: unknown) => Promise<ApiResponse<Motion>>;
  // Judiciary endpoints
  getCases: () => Promise<ApiResponse<{ judges: Judge[]; cases: JudicialCase[] }>>;
  fileCase: (caseData: unknown) => Promise<ApiResponse<unknown>>;
  issueRuling: (ruling: unknown) => Promise<ApiResponse<unknown>>;
  // Media endpoints
  getPressReleases: () => Promise<ApiResponse<PressRelease[]>>;
  getPolls: () => Promise<ApiResponse<Poll[]>>;
  votePoll: (pollId: string, option: unknown) => Promise<ApiResponse<unknown>>;
}

export const api: ApiMethods = {
  // Authentication endpoints
  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{ token: string }>> => {
    try {
      const response: AxiosResponse = await apiClient.post('/auth/login', credentials);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  },

  register: async (userData: {
    email: string;
    password: string;
    username: string;
  }): Promise<ApiResponse<{ token: string }>> => {
    try {
      const response: AxiosResponse = await apiClient.post('/auth/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  },

  logout: async (): Promise<ApiResponse<void>> => {
    try {
      const response: AxiosResponse = await apiClient.post('/auth/logout');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  },

  // Simulation endpoints
  getSimulationState: async (): Promise<ApiResponse<SimulationState>> => {
    // Allow running the UI without the API gateway in local dev
    if (USE_SIMULATION_STUB) {
      return { success: true, data: getMockSimulationState() };
    }

    try {
      const response: AxiosResponse = await apiClient.get('/simulation/state');
      return { success: true, data: response.data };
    } catch (error) {
      // Fallback to mock state if the gateway is unavailable so the UI remains usable
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('Simulation API unreachable, using mock state instead.', error);
        return { success: true, data: getMockSimulationState() };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch simulation state',
      };
    }
  },

  updateSimulationState: async (
    updates: Partial<SimulationState>
  ): Promise<ApiResponse<SimulationState>> => {
    if (USE_SIMULATION_STUB) {
      return { success: true, data: updateMockSimulationState(updates) };
    }

    try {
      const response: AxiosResponse = await apiClient.patch('/simulation/state', updates);
      return { success: true, data: response.data };
    } catch (error) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('Simulation API unreachable, updating mock state locally.', error);
        return { success: true, data: updateMockSimulationState(updates) };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update simulation state',
      };
    }
  },

  // Governance endpoints
  getProposals: async (): Promise<ApiResponse<Proposal[]>> => {
    try {
      const response: AxiosResponse = await apiClient.get('/governance/proposals');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch proposals',
      };
    }
  },

  createProposal: async (proposal: Partial<Proposal>): Promise<ApiResponse<Proposal>> => {
    try {
      const response: AxiosResponse = await apiClient.post('/governance/proposals', proposal);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create proposal',
      };
    }
  },

  // Voting endpoints
  castVote: async (voteData: {
    proposalId: string;
    vote: 'yes' | 'no' | 'abstain';
  }): Promise<ApiResponse<VoteCastResult>> => {
    try {
      const response: AxiosResponse = await apiClient.post('/voting/cast', voteData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cast vote',
      };
    }
  },

  getVoteResults: async (proposalId: string): Promise<ApiResponse<VoteResults>> => {
    try {
      const response: AxiosResponse = await apiClient.get(`/voting/results/${proposalId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch vote results',
      };
    }
  },

  // Elections endpoints
  getElections: async (): Promise<
    ApiResponse<{ elections: Election[]; constituencies: Constituency[] }>
  > => {
    try {
      const response: AxiosResponse = await apiClient.get('/elections');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch elections',
      };
    }
  },

  castElectionVote: async (
    electionId: string,
    voteData: { candidateId: string }
  ): Promise<ApiResponse<ElectionVoteResult>> => {
    try {
      const response: AxiosResponse = await apiClient.post(
        `/elections/${electionId}/vote`,
        voteData
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cast election vote',
      };
    }
  },

  // Government endpoints
  getGovernment: async (): Promise<ApiResponse<Government>> => {
    try {
      const response: AxiosResponse = await apiClient.get('/government');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch government',
      };
    }
  },

  issueExecutiveAction: async (action: unknown): Promise<ApiResponse<unknown>> => {
    try {
      const response: AxiosResponse = await apiClient.post('/government/actions', action);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to issue executive action',
      };
    }
  },

  // Parliament endpoints
  getChambers: async (): Promise<ApiResponse<Chamber[]>> => {
    try {
      const response: AxiosResponse = await apiClient.get('/parliament/chambers');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch chambers',
      };
    }
  },

  getMotions: async (): Promise<ApiResponse<Motion[]>> => {
    try {
      const response: AxiosResponse = await apiClient.get('/parliament/motions');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch motions',
      };
    }
  },

  createMotion: async (motion: unknown): Promise<ApiResponse<Motion>> => {
    try {
      const response: AxiosResponse = await apiClient.post('/parliament/motions', motion);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create motion',
      };
    }
  },

  // Judiciary endpoints
  getCases: async (): Promise<ApiResponse<{ judges: Judge[]; cases: JudicialCase[] }>> => {
    try {
      const response: AxiosResponse = await apiClient.get('/judiciary/cases');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch cases',
      };
    }
  },

  fileCase: async (caseData: unknown): Promise<ApiResponse<unknown>> => {
    try {
      const response: AxiosResponse = await apiClient.post('/judiciary/cases', caseData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to file case',
      };
    }
  },

  issueRuling: async (ruling: unknown): Promise<ApiResponse<unknown>> => {
    try {
      const response: AxiosResponse = await apiClient.post('/judiciary/rulings', ruling);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to issue ruling',
      };
    }
  },

  // Media endpoints
  getPressReleases: async (): Promise<ApiResponse<PressRelease[]>> => {
    try {
      const response: AxiosResponse = await apiClient.get('/media/press-releases');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch press releases',
      };
    }
  },

  getPolls: async (): Promise<ApiResponse<Poll[]>> => {
    try {
      const response: AxiosResponse = await apiClient.get('/media/polls');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch polls',
      };
    }
  },

  votePoll: async (pollId: string, option: unknown): Promise<ApiResponse<unknown>> => {
    try {
      const response: AxiosResponse = await apiClient.post(`/media/polls/${pollId}/vote`, {
        option,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to vote on poll',
      };
    }
  },
};

export type { ApiResponse };
