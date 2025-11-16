import { z } from 'zod';

export const VerificationMethodSchema = z.enum([
  'self_declaration',
  'document',
  'credit_card',
  'third_party',
]);

export type VerificationMethod = z.infer<typeof VerificationMethodSchema>;

export const VerificationStatusSchema = z.enum([
  'pending',
  'verified',
  'rejected',
  'expired',
]);

export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const InitiateVerificationSchema = z.object({
  method: VerificationMethodSchema.default('self_declaration'),
  dateOfBirth: z.string().optional(),
});

export type InitiateVerificationInput = z.infer<typeof InitiateVerificationSchema>;

export const CompleteVerificationSchema = z.object({
  verificationId: z.string().min(1),
  dateOfBirth: z.string().optional(),
  documentId: z.string().optional(),
  documentType: z.string().optional(),
  parentalConsent: z.boolean().optional(),
});

export type CompleteVerificationInput = z.infer<typeof CompleteVerificationSchema>;
