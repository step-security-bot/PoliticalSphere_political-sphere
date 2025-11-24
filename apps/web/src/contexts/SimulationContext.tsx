/**
 * Simulation Context
 * Manages global simulation state for the single-world political simulation
 * WCAG 2.2 AA Compliant
 */

import type React from 'react';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type SimulationState } from '../services/api';
import { getMockSimulationState } from '../services/simulationMock';

interface SimulationContextType {
  simulation: SimulationState | null;
  isLoading: boolean;
  error: string | null;
  refreshSimulation: () => Promise<void>;
  updateSimulation: (updates: Partial<SimulationState>) => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

interface SimulationProviderProps {
  children: ReactNode;
}

export const SimulationProvider: React.FC<SimulationProviderProps> = ({ children }) => {
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSimulation = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.getSimulationState();

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch simulation state');
      }

      setSimulation(response.data as SimulationState);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch simulation state';
      setError(message);
      // Populate a fallback state so the UI remains usable when the API is unavailable
      if (!simulation) {
        setSimulation({
          ...getMockSimulationState(),
          lastUpdated: new Date().toISOString(),
        });
      }
      // eslint-disable-next-line no-console
      console.error('Simulation fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSimulation = async () => {
    await fetchSimulation();
  };

  const updateSimulation = (updates: Partial<SimulationState>) => {
    if (simulation) {
      setSimulation({ ...simulation, ...updates });
    }
  };

  useEffect(() => {
    fetchSimulation();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchSimulation, 30000);
    return () => clearInterval(interval);
  }, []);

  const value: SimulationContextType = {
    simulation,
    isLoading,
    error,
    refreshSimulation,
    updateSimulation,
  };

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
};

export default SimulationContext;
