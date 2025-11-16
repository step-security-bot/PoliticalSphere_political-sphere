import { z } from 'zod';

export const VoteTypeSchema = z.enum(['aye', 'nay', 'abstain']);

export type VoteType = z.infer<typeof VoteTypeSchema>;

export const VoteSchema = z.object({
  id: z.string().uuid(),
  billId: z.string().uuid(),
  userId: z.string().uuid(),
  vote: VoteTypeSchema,
  createdAt: z.date(),
});

export type Vote = z.infer<typeof VoteSchema>;

export const CreateVoteSchema = z.object({
  billId: z.string().min(1),
  userId: z.string().min(1),
  vote: VoteTypeSchema,
});

export type CreateVoteInput = z.infer<typeof CreateVoteSchema>;

export const UpdateVoteSchema = z
  .object({
    vote: VoteTypeSchema.optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateVoteInput = z.infer<typeof UpdateVoteSchema>;
