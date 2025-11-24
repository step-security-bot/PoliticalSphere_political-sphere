import { z } from 'zod';

// Election Status Schema
export const ElectionStatusSchema = z.enum(['ANNOUNCED', 'POLLING', 'COUNTING', 'DECLARED']);
export type ElectionStatus = z.infer<typeof ElectionStatusSchema>;

// Election Schema
export const ElectionSchema = z.object({
  id: z.string().uuid(),
  worldId: z.string().uuid(),
  constituencyId: z.string().uuid(),
  status: ElectionStatusSchema,
  startedAt: z.string().date(),
  endedAt: z.string().date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Election = z.infer<typeof ElectionSchema>;

// Create Election Input
export const CreateElectionSchema = z.object({
  worldId: z.string().uuid(),
  constituencyId: z.string().uuid(),
});
export type CreateElectionInput = z.infer<typeof CreateElectionSchema>;

// Vote Type Schema (adapted from shared)
export const VoteTypeSchema = z.enum(['aye', 'nay', 'abstain']);
export type VoteType = z.infer<typeof VoteTypeSchema>;

// Vote Schema (adapted from shared and game engine)
export const VoteSchema = z.object({
  id: z.string().uuid(),
  proposalId: z.string().uuid(), // Align with game engine
  playerId: z.string().uuid(), // Align with game engine
  choice: z.enum(['for', 'against', 'abstain']), // Align with game engine
  timestamp: z.string(), // Align with game engine
  createdAt: z.date(), // Required field
});
export type Vote = z.infer<typeof VoteSchema>;

// Create Vote Input
export const CreateVoteSchema = z.object({
  proposalId: z.string().min(1),
  playerId: z.string().min(1),
  choice: z.enum(['for', 'against', 'abstain']),
});
export type CreateVoteInput = z.infer<typeof CreateVoteSchema>;

// Update Vote Input
export const UpdateVoteSchema = z
  .object({
    vote: VoteTypeSchema.optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
export type UpdateVoteInput = z.infer<typeof UpdateVoteSchema>;

// Vote Results
export const VoteResultsSchema = z.object({
  total: z.number(),
  aye: z.number(),
  nay: z.number(),
  abstain: z.number(),
});
export type VoteResults = z.infer<typeof VoteResultsSchema>;
