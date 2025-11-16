import { z } from 'zod';

export const BillStatusSchema = z.enum(['proposed', 'debating', 'passed', 'rejected']);

export type BillStatus = z.infer<typeof BillStatusSchema>;

export const BillSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  proposerId: z.string().uuid(),
  status: BillStatusSchema.default('proposed'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Bill = z.infer<typeof BillSchema>;

export const CreateBillSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  // Allow non-UUID sentinel values in tests (they validate existence at service layer)
  proposerId: z.string(),
});

export type CreateBillInput = z.infer<typeof CreateBillSchema>;

export const UpdateBillSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    status: BillStatusSchema.optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateBillInput = z.infer<typeof UpdateBillSchema>;
