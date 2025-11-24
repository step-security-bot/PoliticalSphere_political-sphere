import { z } from 'zod';

export const SimulationStateSchema = z.object({
  id: z.string(),
  currentTurn: z.number(),
  status: z.enum(['active', 'paused', 'completed']),
  players: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      role: z.string(),
      influence: z.number(),
    })
  ),
  policies: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      status: z.enum(['proposed', 'active', 'passed', 'rejected']),
      votes: z.object({
        yes: z.number(),
        no: z.number(),
        abstain: z.number(),
      }),
    })
  ),
  economy: z.object({
    gdp: z.number(),
    unemployment: z.number(),
    inflation: z.number(),
  }),
  society: z.object({
    happiness: z.number(),
    education: z.number(),
    health: z.number(),
  }),
  environment: z.object({
    pollution: z.number(),
    renewableEnergy: z.number(),
    biodiversity: z.number(),
  }),
  lastUpdated: z.string(),
});

export type SimulationState = z.infer<typeof SimulationStateSchema>;
