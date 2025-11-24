import { z } from 'zod';

/**
 * ElectionStatusSchema enumerates the lifecycle stages for an election.
 * - ANNOUNCED: Upcoming election announced
 * - POLLING: Voting is currently open
 * - COUNTING: Votes are being counted
 * - DECLARED: Election results have been declared
 */
export const ElectionStatusSchema = z.enum(['ANNOUNCED', 'POLLING', 'COUNTING', 'DECLARED']);

/**
 * ElectionSchema represents a single election instance within a world and constituency.
 */
export const ElectionSchema = z.object({
  id: z.string().uuid(),
  worldId: z.string().uuid(),
  constituencyId: z.string().uuid(),
  status: ElectionStatusSchema,
  startedAt: z.string().date(),
  endedAt: z.string().date().optional(),
});
/**
 * Election model type inferred from Zod schema.
 */
export type Election = z.infer<typeof ElectionSchema>;

/**
 * ElectionStatus type alias representing permitted status values for an election.
 */
export type ElectionStatus = z.infer<typeof ElectionStatusSchema>;
