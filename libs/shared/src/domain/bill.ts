import { z } from 'zod';

/**
 * Allowed lifecycle states for a bill.
 */
export const BillStatusSchema = z.enum(['proposed', 'debating', 'passed', 'rejected']);

/**
 * Type: BillStatus
 */
export type BillStatus = z.infer<typeof BillStatusSchema>;

/**
 * Zod schema for a Bill record.
 */
export const BillSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  proposerId: z.string().uuid(),
  status: BillStatusSchema.default('proposed'),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Type: Bill
 */
export type Bill = z.infer<typeof BillSchema>;

/**
 * Schema for creating a new Bill.  allows a plain string
 * so tests may use sentinel values; services should enforce UUIDs where required.
 */
export const CreateBillSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  proposerId: z.string(),
});

export type CreateBillInput = z.infer<typeof CreateBillSchema>;

/**
 * Schema for updating an existing Bill. Requires at least one field.
 */
export const UpdateBillSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    status: BillStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateBillInput = z.infer<typeof UpdateBillSchema>;

