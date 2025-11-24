import { z } from 'zod';

/**
 * Zod schema for validating vote type enumeration.
import { z } from 'zod';

/**
 * Zod schema for validating vote type enumeration.
 * Defines the possible vote options in parliamentary voting.
 */
export const VoteTypeSchema = z.enum(['aye', 'nay', 'abstain']);

/**
 * Type representing the possible vote types in the system.
 * Inferred from VoteTypeSchema for type safety.
 */
export type VoteType = z.infer<typeof VoteTypeSchema>;

/**
 * Zod schema for validating complete vote data structure.
 * Defines the vote object with all required fields for database storage.
 */
export const VoteSchema = z.object({
  id: z.string().uuid(),
  billId: z.string().uuid(),
  userId: z.string().uuid(),
  vote: VoteTypeSchema,
  createdAt: z.date(),
});

/**
 * Type representing a parliamentary vote in the system.
 * Inferred from VoteSchema for type safety and validation.
 */
export type Vote = z.infer<typeof VoteSchema>;

/**
 * Zod schema for validating vote creation input.
 * Contains only the fields required to cast a new vote.
 * Excludes server-generated fields like id and createdAt.
 */
export const CreateVoteSchema = z.object({
  billId: z.string().min(1),
  userId: z.string().min(1),
  vote: VoteTypeSchema,
});

/**
 * Type representing input data for casting a new vote.
 * Inferred from CreateVoteSchema for type safety.
 */
export type CreateVoteInput = z.infer<typeof CreateVoteSchema>;

/**
 * Zod schema for validating vote update input.
 * Currently only allows updating the vote type, but requires at least one field.
 * Used for correcting votes within allowed time windows.
 */
export const UpdateVoteSchema = z
  .object({
    vote: VoteTypeSchema.optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/**
 * Type representing input data for updating an existing vote.
 * Inferred from UpdateVoteSchema for type safety.
 */
export type UpdateVoteInput = z.infer<typeof UpdateVoteSchema>;
