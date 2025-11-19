import { z } from 'zod';

export const JudgeSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  username: z.string().min(1).max(50),
  court: z.enum(['supreme', 'appeal', 'high']),
  appointedAt: z.string().datetime(),
  status: z.enum(['active', 'retired']),
});

export type Judge = z.infer<typeof JudgeSchema>;

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

export type LegalCase = z.infer<typeof LegalCaseSchema>;

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

export type Ruling = z.infer<typeof RulingSchema>;

export const FileCaseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  type: z.enum(['constitutional', 'criminal', 'civil', 'administrative']),
  court: z.enum(['supreme', 'appeal', 'high']),
  plaintiff: z.string().min(1),
  defendant: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

export type FileCaseInput = z.infer<typeof FileCaseSchema>;

export const IssueRulingSchema = z.object({
  decision: z.enum(['upheld', 'overturned', 'dismissed', 'remanded']),
  reasoning: z.string().min(1).max(10000),
});

export type IssueRulingInput = z.infer<typeof IssueRulingSchema>;

export const JudiciaryResponseSchema = z.object({
  judges: z.array(JudgeSchema),
  cases: z.array(LegalCaseSchema),
});

export type JudiciaryResponse = z.infer<typeof JudiciaryResponseSchema>;
