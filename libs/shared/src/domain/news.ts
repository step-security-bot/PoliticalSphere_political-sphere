import { z } from 'zod';

/**
 * NewsCategorySchema enumerates categories for news and press releases.
 */
export const NewsCategorySchema = z.enum([
  'politics',
  'economy',
  'legislation',
  'elections',
  'government',
  'international',
  'other',
]);

/**
 * Alias type for NewsCategory values inferred from schema.
 */
export type NewsCategory = z.infer<typeof NewsCategorySchema>;

/**
 * CreateNewsSchema describes the payload required to create a news article or press release.
 */
export const CreateNewsSchema = z.object({
  title: z.string().min(10).max(200),
  content: z.string().min(50).max(10000),
  category: NewsCategorySchema,
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
  source: z.string().url().optional(),
  publishedAt: z.string().datetime().optional(),
});

/**
 * CreateNewsInput type inferred from CreateNewsSchema.
 */
export type CreateNewsInput = z.infer<typeof CreateNewsSchema>;

/**
 * UpdateNewsSchema describes the allowed fields when updating a news entry.
 */
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

/**
 * UpdateNewsInput type inferred from UpdateNewsSchema.
 */
export type UpdateNewsInput = z.infer<typeof UpdateNewsSchema>;
