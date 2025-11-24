import { z } from 'zod';

// Bill Status Schema (adapted from shared and game engine)
export const BillStatusSchema = z.enum([
  'proposed',
  'debate',
  'voting',
  'enacted',
  'rejected',
  'flagged',
]);
export type BillStatus = z.infer<typeof BillStatusSchema>;

// Bill Schema (adapted from shared and game engine Proposal)
export const BillSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  proposerId: z.string().uuid(),
  createdAt: z.date(),
  status: BillStatusSchema.default('proposed'),
  debateId: z.string().uuid().optional().nullable(),
  moderationStatus: z.string().optional(),
  flaggedReasons: z.array(z.string()).optional(),
  reviewedAt: z.date().optional(),
  reviewedBy: z.string().uuid().optional(),
  reviewNote: z.string().optional().nullable(),
  contentRating: z.string().optional(),
  updatedAt: z.date(),
});
export type Bill = z.infer<typeof BillSchema>;

// Create Bill Input
export const CreateBillSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  proposerId: z.string().min(1), // Allow non-UUID in tests
});
export type CreateBillInput = z.infer<typeof CreateBillSchema>;

// Update Bill Input
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

// Judge Court Schema
export const JudgeCourtSchema = z.enum(['supreme', 'appeal', 'high']);
export type JudgeCourt = z.infer<typeof JudgeCourtSchema>;

// Judge Schema (adapted from shared)
export const JudgeSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  username: z.string().min(1).max(50),
  court: JudgeCourtSchema,
  appointedAt: z.date(),
  status: z.enum(['active', 'retired']).default('active'),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Judge = z.infer<typeof JudgeSchema>;

// Legal Case Type Schema
export const LegalCaseTypeSchema = z.enum([
  'constitutional',
  'criminal',
  'civil',
  'administrative',
]);
export type LegalCaseType = z.infer<typeof LegalCaseTypeSchema>;

// Legal Case Status Schema
export const LegalCaseStatusSchema = z.enum(['filed', 'hearing', 'deliberation', 'ruled']);
export type LegalCaseStatus = z.infer<typeof LegalCaseStatusSchema>;

// Legal Case Priority Schema
export const LegalCasePrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export type LegalCasePriority = z.infer<typeof LegalCasePrioritySchema>;

// Legal Case Schema (adapted from shared)
export const LegalCaseSchema = z.object({
  id: z.string().uuid(),
  caseNumber: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  type: LegalCaseTypeSchema,
  court: JudgeCourtSchema,
  plaintiff: z.string().min(1),
  defendant: z.string().min(1),
  filedBy: z.string().uuid(),
  filedAt: z.date(),
  status: LegalCaseStatusSchema.default('filed'),
  priority: LegalCasePrioritySchema.default('medium'),
  decidedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type LegalCase = z.infer<typeof LegalCaseSchema>;

// File Case Input
export const FileCaseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  type: LegalCaseTypeSchema,
  court: JudgeCourtSchema,
  plaintiff: z.string().min(1),
  defendant: z.string().min(1),
  priority: LegalCasePrioritySchema,
});
export type FileCaseInput = z.infer<typeof FileCaseSchema>;

// Ruling Decision Schema
export const RulingDecisionSchema = z.enum(['upheld', 'overturned', 'dismissed', 'remanded']);
export type RulingDecision = z.infer<typeof RulingDecisionSchema>;

// Ruling Schema (adapted from shared)
export const RulingSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  judgeId: z.string().uuid(),
  judgeName: z.string().min(1),
  decision: RulingDecisionSchema,
  reasoning: z.string().min(1).max(10000),
  issuedAt: z.date(),
  precedent: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Ruling = z.infer<typeof RulingSchema>;

// Issue Ruling Input
export const IssueRulingSchema = z.object({
  decision: RulingDecisionSchema,
  reasoning: z.string().min(1).max(10000),
});
export type IssueRulingInput = z.infer<typeof IssueRulingSchema>;

// Review Type Schema
export const ReviewTypeSchema = z.enum(['appeal', 'judicial_review']);
export type ReviewType = z.infer<typeof ReviewTypeSchema>;

// Review Status Schema
export const ReviewStatusSchema = z.enum(['pending', 'granted', 'denied']);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

// Review Schema
export const ReviewSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  type: ReviewTypeSchema,
  status: ReviewStatusSchema.default('pending'),
  filedAt: z.date(),
  decidedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Review = z.infer<typeof ReviewSchema>;

// Create Review Input
export const CreateReviewSchema = z.object({
  caseId: z.string().uuid(),
  type: ReviewTypeSchema,
});
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

// Precedent Schema
export const PrecedentSchema = z.object({
  id: z.string().uuid(),
  citation: z.string().min(1),
  summary: z.string().min(1).max(1000),
  holding: z.string().min(1).max(2000),
  caseId: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Precedent = z.infer<typeof PrecedentSchema>;

// Create Precedent Input
export const CreatePrecedentSchema = z.object({
  citation: z.string().min(1),
  summary: z.string().min(1).max(1000),
  holding: z.string().min(1).max(2000),
  caseId: z.string().uuid().optional(),
});
export type CreatePrecedentInput = z.infer<typeof CreatePrecedentSchema>;

// Legislation Response Schema
export const LegislationResponseSchema = z.object({
  bills: z.array(BillSchema),
  cases: z.array(LegalCaseSchema),
  judges: z.array(JudgeSchema),
});
export type LegislationResponse = z.infer<typeof LegislationResponseSchema>;
