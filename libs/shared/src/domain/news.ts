import { z } from 'zod';

export const NewsCategorySchema = z.enum([
  'politics',
  'economy',
  'legislation',
  'elections',
  'government',
  'international',
  'other',
]);

export type NewsCategory = z.infer<typeof NewsCategorySchema>;

export const CreateNewsSchema = z.object({
  title: z.string().min(10).max(200),
  content: z.string().min(50).max(10000),
  category: NewsCategorySchema,
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
  source: z.string().url().optional(),
  publishedAt: z.string().datetime().optional(),
});

export type CreateNewsInput = z.infer<typeof CreateNewsSchema>;

export const UpdateNewsSchema = z
  .object({
    title: z.string().min(10).max(200).optional(),
    content: z.string().min(50).max(10000).optional(),
    category: NewsCategorySchema.optional(),
    tags: z.array(z.string().min(1).max(50)).max(10).optional(),
    source: z.string().url().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateNewsInput = z.infer<typeof UpdateNewsSchema>;
