import type { SimulationState } from './api';

// Shared mock state to keep the UI usable when the API gateway is unavailable.
const createMockSimulationState = (): SimulationState => ({
  id: 'local-fallback',
  currentTurn: 1,
  status: 'active',
  players: [
    {
      id: 'player-1',
      name: 'Prime Minister',
      role: 'Prime Minister',
      influence: 50,
    },
  ],
  policies: [
    {
      id: 'policy-1',
      title: 'Healthcare Reform',
      description: 'Improve healthcare access',
      status: 'proposed',
      votes: { yes: 0, no: 0, abstain: 0 },
    },
  ],
  economy: {
    gdp: 1000000,
    unemployment: 0.05,
    inflation: 0.02,
  },
  society: {
    happiness: 0.7,
    education: 0.8,
    health: 0.75,
  },
  environment: {
    pollution: 0.3,
    renewableEnergy: 0.4,
    biodiversity: 0.6,
  },
  lastUpdated: new Date().toISOString(),
});

let mockSimulationState = createMockSimulationState();

export const getMockSimulationState = (): SimulationState => {
  mockSimulationState.lastUpdated = new Date().toISOString();
  return mockSimulationState;
};

export const updateMockSimulationState = (updates: Partial<SimulationState>): SimulationState => {
  mockSimulationState = {
    ...mockSimulationState,
    ...updates,
    lastUpdated: new Date().toISOString(),
  };
  return mockSimulationState;
};

export const resetMockSimulationState = (): void => {
  mockSimulationState = createMockSimulationState();
};
