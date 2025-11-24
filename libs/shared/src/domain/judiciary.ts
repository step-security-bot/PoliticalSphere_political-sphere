import { z } from 'zod';

/**
 * JudgeSchema models an appointed judicial officer with metadata about appointment and status.
 */
export const JudgeSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  username: z.string().min(1).max(50),
  court: z.enum(['supreme', 'appeal', 'high']),
  appointedAt: z.string().datetime(),
  status: z.enum(['active', 'retired']),
});

/**
 * Judge type inferred from JudgeSchema.
 */
export type Judge = z.infer<typeof JudgeSchema>;

/**
 * LegalCaseSchema models a registered case in the judicial system, including parties and court metadata.
 */
export const LegalCaseSchema = z.object({
  id: z.string().uuid(),
  caseNumber: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  type: z.enum(['constitutional', 'criminal', 'civil', 'administrative']),
  court: z.enum(['supreme', 'appeal', 'high']),
  plaintiff: z.string().min(1),
  defendant: z.string().min(1),
  filedBy: z.string().uuid(),
  filedAt: z.string().datetime(),
  status: z.enum(['filed', 'hearing', 'deliberation', 'ruled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

/**
 * LegalCase type inferred from LegalCaseSchema.
 */
export type LegalCase = z.infer<typeof LegalCaseSchema>;

/**
 * RulingSchema models the outcome of a judicial adjudication and whether it establishes precedent.
 */
export const RulingSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  judgeId: z.string().uuid(),
  judgeName: z.string().min(1),
  decision: z.enum(['upheld', 'overturned', 'dismissed', 'remanded']),
  reasoning: z.string().min(1).max(10000),
  issuedAt: z.string().datetime(),
  precedent: z.boolean(),
});

/**
 * Ruling type inferred from RulingSchema.
 */
export type Ruling = z.infer<typeof RulingSchema>;

/**
 * Input schema for filing a case; includes required information to create a new case record.
 */
export const FileCaseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  type: z.enum(['constitutional', 'criminal', 'civil', 'administrative']),
  court: z.enum(['supreme', 'appeal', 'high']),
  plaintiff: z.string().min(1),
  defendant: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

/**
 * FileCaseInput type inferred from FileCaseSchema.
 */
export type FileCaseInput = z.infer<typeof FileCaseSchema>;

/**
 * Input schema for issuing a ruling in a case; includes decision and reasoning.
 */
export const IssueRulingSchema = z.object({
  decision: z.enum(['upheld', 'overturned', 'dismissed', 'remanded']),
  reasoning: z.string().min(1).max(10000),
});

/**
 * IssueRulingInput type inferred from IssueRulingSchema.
 */
export type IssueRulingInput = z.infer<typeof IssueRulingSchema>;

/**
 * Response schema for judiciary endpoints listing judges and cases.
 */
export const JudiciaryResponseSchema = z.object({
  judges: z.array(JudgeSchema),
  cases: z.array(LegalCaseSchema),
});

/**
 * JudiciaryResponse type used by endpoint responses.
 */
export type JudiciaryResponse = z.infer<typeof JudiciaryResponseSchema>;
