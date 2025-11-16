import { z } from 'zod';

export const ModerationDecisionSchema = z.enum(['approve', 'reject', 'escalate']);

export type ModerationDecision = z.infer<typeof ModerationDecisionSchema>;

export const ContentTypeSchema = z.enum(['text', 'image', 'video', 'audio', 'link']);

export type ContentType = z.infer<typeof ContentTypeSchema>;

export const ReportCategorySchema = z.enum([
  'harassment',
  'hate_speech',
  'violence',
  'spam',
  'misinformation',
  'other',
]);

export type ReportCategory = z.infer<typeof ReportCategorySchema>;

export const AnalyzeContentSchema = z.object({
  content: z.string().min(1).max(10000),
  type: ContentTypeSchema.default('text'),
  userId: z.string().optional(),
});

export type AnalyzeContentInput = z.infer<typeof AnalyzeContentSchema>;

export const CreateReportSchema = z.object({
  contentId: z.string().min(1),
  reason: z.string().min(10).max(1000),
  evidence: z.string().max(5000).optional(),
  category: ReportCategorySchema,
});

export type CreateReportInput = z.infer<typeof CreateReportSchema>;

export const ReviewContentSchema = z.object({
  decision: ModerationDecisionSchema,
  notes: z.string().max(2000).optional(),
});

export type ReviewContentInput = z.infer<typeof ReviewContentSchema>;
