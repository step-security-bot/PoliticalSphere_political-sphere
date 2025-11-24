import { z } from 'zod';

// Government Status Schema
export const GovernmentStatusSchema = z.enum(['active', 'dissolved']);
export type GovernmentStatus = z.infer<typeof GovernmentStatusSchema>;

// Government Schema
export const GovernmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  leaderId: z.string().uuid().optional(),
  status: GovernmentStatusSchema.default('active'),
  formedAt: z.date(),
  dissolvedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Government = z.infer<typeof GovernmentSchema>;

// Create Government Input
export const CreateGovernmentSchema = z.object({
  name: z.string().min(1),
  leaderId: z.string().uuid().optional(),
});
export type CreateGovernmentInput = z.infer<typeof CreateGovernmentSchema>;

// Minister Schema
export const MinisterSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  governmentId: z.string().uuid(),
  portfolio: z.string().min(1),
  appointedAt: z.date(),
  resignedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Minister = z.infer<typeof MinisterSchema>;

// Create Minister Input
export const CreateMinisterSchema = z.object({
  userId: z.string().uuid(),
  governmentId: z.string().uuid(),
  portfolio: z.string().min(1),
});
export type CreateMinisterInput = z.infer<typeof CreateMinisterSchema>;

// Executive Action Type Schema
export const ExecutiveActionTypeSchema = z.enum(['decree', 'order', 'policy']);
export type ExecutiveActionType = z.infer<typeof ExecutiveActionTypeSchema>;

// Executive Action Status Schema
export const ExecutiveActionStatusSchema = z.enum(['proposed', 'signed', 'rejected']);
export type ExecutiveActionStatus = z.infer<typeof ExecutiveActionStatusSchema>;

// Executive Action Schema
export const ExecutiveActionSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: ExecutiveActionTypeSchema,
  status: ExecutiveActionStatusSchema.default('proposed'),
  signedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type ExecutiveAction = z.infer<typeof ExecutiveActionSchema>;

// Create Executive Action Input
export const CreateExecutiveActionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: ExecutiveActionTypeSchema,
});
export type CreateExecutiveActionInput = z.infer<typeof CreateExecutiveActionSchema>;

// Cabinet Meeting Status Schema
export const CabinetMeetingStatusSchema = z.enum(['scheduled', 'active', 'completed', 'cancelled']);
export type CabinetMeetingStatus = z.infer<typeof CabinetMeetingStatusSchema>;

// Cabinet Meeting Schema
export const CabinetMeetingSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  agenda: z.string().optional(),
  scheduledAt: z.date(),
  status: CabinetMeetingStatusSchema.default('scheduled'),
  minutes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type CabinetMeeting = z.infer<typeof CabinetMeetingSchema>;

// Create Cabinet Meeting Input
export const CreateCabinetMeetingSchema = z.object({
  title: z.string().min(1),
  agenda: z.string().optional(),
  scheduledAt: z.date(),
});
export type CreateCabinetMeetingInput = z.infer<typeof CreateCabinetMeetingSchema>;

// Chamber Type Schema
export const ChamberTypeSchema = z.enum(['commons', 'lords']);
export type ChamberType = z.infer<typeof ChamberTypeSchema>;

// Chamber Schema
export const ChamberSchema = z.object({
  id: z.string().uuid(),
  gameId: z.string().uuid(),
  name: z.string().min(1),
  type: ChamberTypeSchema,
  maxSeats: z.number().positive(),
  quorumPercentage: z.number().min(0).max(100).default(50),
  createdAt: z.date(),
});
export type Chamber = z.infer<typeof ChamberSchema>;

// Motion Type Schema
export const MotionTypeSchema = z.enum(['debate', 'vote', 'amendment', 'procedural']);
export type MotionType = z.infer<typeof MotionTypeSchema>;

// Motion Status Schema
export const MotionStatusSchema = z.enum(['proposed', 'debate', 'voting', 'completed']);
export type MotionStatus = z.infer<typeof MotionStatusSchema>;

// Motion Result Schema
export const MotionResultSchema = z.enum(['passed', 'failed']);
export type MotionResult = z.infer<typeof MotionResultSchema>;

// Motion Schema
export const MotionSchema = z.object({
  id: z.string().uuid(),
  gameId: z.string().uuid(),
  chamberId: z.string().uuid(),
  proposerId: z.string().uuid(),
  type: MotionTypeSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  status: MotionStatusSchema.default('proposed'),
  votingStarted: z.date().optional(),
  votingEnded: z.date().optional(),
  result: MotionResultSchema.optional(),
  createdAt: z.date(),
});
export type Motion = z.infer<typeof MotionSchema>;

// Debate Status Schema
export const DebateStatusSchema = z.enum(['scheduled', 'active', 'completed']);
export type DebateStatus = z.infer<typeof DebateStatusSchema>;

// Debate Schema
export const DebateSchema = z.object({
  id: z.string().uuid(),
  gameId: z.string().uuid(),
  motionId: z.string().uuid(),
  chamberId: z.string().uuid(),
  startTime: z.date(),
  duration: z.number().positive(),
  speakingOrder: z.array(z.string().uuid()),
  timePerSpeaker: z.number().positive(),
  status: DebateStatusSchema.default('scheduled'),
  currentSpeakerIndex: z.number().default(0),
  createdAt: z.date(),
});
export type Debate = z.infer<typeof DebateSchema>;

// Speech Schema
export const SpeechSchema = z.object({
  id: z.string().uuid(),
  debateId: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string().min(1),
  duration: z.number().positive(),
  createdAt: z.date(),
});
export type Speech = z.infer<typeof SpeechSchema>;

// Parliament Vote Schema (different from election vote)
export const ParliamentVoteSchema = z.object({
  id: z.string().uuid(),
  gameId: z.string().uuid(),
  motionId: z.string().uuid(),
  debateId: z.string().uuid().optional(),
  userId: z.string().uuid(),
  vote: z.enum(['aye', 'no', 'abstain']),
  createdAt: z.date(),
});
export type ParliamentVote = z.infer<typeof ParliamentVoteSchema>;

// Parliament Vote Results Schema
export const ParliamentVoteResultsSchema = z.object({
  total: z.number(),
  aye: z.number(),
  no: z.number(),
  abstain: z.number(),
});
export type ParliamentVoteResults = z.infer<typeof ParliamentVoteResultsSchema>;
