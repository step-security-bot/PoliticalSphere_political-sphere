import { z } from 'zod';

export const ComplianceFrameworkSchema = z.enum(['DSA', 'GDPR', 'ISO27001', 'COPPA']);

export type ComplianceFramework = z.infer<typeof ComplianceFrameworkSchema>;

export const ComplianceSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

export type ComplianceSeverity = z.infer<typeof ComplianceSeveritySchema>;

export const ComplianceStatusSchema = z.enum(['pending', 'acknowledged', 'resolved', 'dismissed']);

export type ComplianceStatus = z.infer<typeof ComplianceStatusSchema>;
