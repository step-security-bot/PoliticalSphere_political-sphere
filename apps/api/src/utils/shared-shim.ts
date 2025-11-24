// Local shim to access shared helpers and schemas from API code without relying on Vite aliases

import cjsShared from '../../../../libs/shared/cjs-shared.cjs'; // eslint-disable-line @nx/enforce-module-boundaries, no-restricted-imports

// Re-export all named exports
/**
 * Re-exports selected helpers and schemas from the shared package for use
 * within the API build. These are selected to avoid bundler aliasing issues.
 */
export const {
  createLogger,
  getLogger,
  CreateUserSchema,
  UpdateUserSchema,
  CreateBillSchema,
  UpdateBillSchema,
  CreateVoteSchema,
  UpdateVoteSchema,
  CreatePartySchema,
  UpdatePartySchema,
  AnalyzeContentSchema,
  CreateReportSchema,
  ReviewContentSchema,
  CreateNewsSchema,
  UpdateNewsSchema,
  InitiateVerificationSchema,
  CompleteVerificationSchema,
  sanitizeHtml,
  isValidInput,
  isValidLength,
  validateCategory,
  validateTag,
  isValidUrl,
  SECURITY_HEADERS,
  getCorsHeaders,
  _rateState,
  checkRateLimit,
  getRateLimitInfo,
  isIpAllowed,
} = cjsShared;
