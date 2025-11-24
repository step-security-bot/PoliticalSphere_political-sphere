/**
 * Simulation Routes
 * Handles simulation state management for the political simulation
 */

import type { Request, Response } from 'express';
import type { SimulationState } from '@political-sphere/shared';

/**
 * Mock simulation state used for local development and demos.
 * This is a simplified representation of the game state for UI development.
 */
// Mock simulation state for development
const mockSimulationState: SimulationState = {
  id: 'political-sphere-sim',
  currentTurn: 1,
  status: 'active',
  players: [
    {
      id: 'player-1',
      name: 'Player 1',
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
};

/**
 * Get simulation state
 * GET /api/simulation/state
 *
 * Returns the current persisted simulation state for UI clients and debug tooling.
 * @returns 200 with the current SimulationState
 */
export const getSimulationState = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Update lastUpdated
    mockSimulationState.lastUpdated = new Date().toISOString();

    res.json({
      success: true,
      data: mockSimulationState,
    });
  } catch (error) {
    // Log the error for diagnostics and keep a generic client-facing message
    // eslint-disable-next-line no-console
    console.error('getSimulationState error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch simulation state',
    });
  }
};

/**
 * Update simulation state
 * POST /api/simulation/state
 *
 * Accepts partial simulation state updates. Intended for development/harness use only.
 * @param {Partial<SimulationState>} req.body - Partial state to merge with current state
 * @returns 200 with the updated SimulationState
 */
/**
 * POST /api/simulation/state - Update the in-memory simulation state.
 * Intended for development and local harness use only. Accepts a partial
 * SimulationState in the request body and merges it into the current state.
 */
/**
 * Exported handler: `updateSimulationState` — apply partial updates to the
 * in-memory simulation state. Intended for development and test harness use.
 *
 * TODO: Document allowed fields and authentication requirements.
 */
export const updateSimulationState = async (req: Request, res: Response): Promise<void> => {
  try {
    const updates = req.body as Partial<SimulationState>;

    // Apply updates - mutate existing object to keep references stable for in-memory state
    Object.assign(mockSimulationState, updates, { lastUpdated: new Date().toISOString() });

    res.json({
      success: true,
      data: mockSimulationState,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('updateSimulationState error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update simulation state',
    });
  }
};
