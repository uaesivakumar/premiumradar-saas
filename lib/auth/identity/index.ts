/**
 * Identity Intelligence Module - Sprint S48
 * PremiumRadar SaaS - Identity & Vertical Lock System
 *
 * Features:
 * 1. Email Domain → Company Extraction
 * 2. Enrichment-based Industry Detection (via OS API)
 * 3. Vertical Suggestion at Onboarding
 * 4. Vertical Lock After Confirmation
 * 5. Super-Admin Vertical Override
 * 6. Consulting-Mode Vertical
 * 7. MFA for Vertical Overrides
 * 8. Session Validation (Vertical-bound)
 * 9. Corporate Email MX Verification
 * 10. Industry Confidence Score
 */

// Types
export * from './types';

// Feature 1: Email Domain → Company Extraction
export {
  extractDomain,
  extractDomainInfo,
  isPersonalEmailDomain,
  extractCompanyNameFromDomain,
  isValidEmail,
  getDomainCategory,
  analyzeEmail,
  type EmailAnalysis,
  type DomainCategory,
} from './domain-extractor';

// Feature 9: Corporate Email MX Verification
export {
  verifyMXRecords,
  isValidCorporateEmailDomain,
  getEmailSecurityScore,
} from './mx-verification';

// Features 2 & 10: Industry Detection + Confidence Score
export {
  detectIndustryFromDomain,
  mapIndustryToVertical,
  calculateConfidenceScore,
  shouldAutoSuggestVertical,
  getConfidenceLevel,
  getConfidenceMessage,
} from './industry-detector';

// Feature 3: Vertical Suggestion at Onboarding
export {
  getVerticalSuggestionFromEmail,
  isSuggestionActionable,
  getSuggestionBadgeText,
  getSuggestionBadgeColor,
  type VerticalSuggestion,
} from './vertical-suggestion';

// Features 4, 5, 6: Vertical Lock, Admin Override, Consulting Mode
export {
  createVerticalLock,
  getVerticalLockState,
  isVerticalLocked,
  canAccessVertical,
  getUserVertical,
  lockVertical,
  requiresMfaForOverride,
  adminOverrideVertical,
  enableConsultingMode,
  disableConsultingMode,
  switchConsultingVertical,
  getVerticalAuditLog,
  type VerticalAuditEntry,
} from './vertical-lock';

// Feature 7: MFA for Vertical Overrides
export {
  requiresMfa,
  createMfaChallenge,
  getMfaChallenge,
  isChallengeValid,
  verifyTotpCode,
  verifyEmailCode,
  isChallengeVerified,
  cleanupExpiredChallenges,
  withMfaGuard,
  type MfaOperation,
  type MfaChallenge,
  type MfaVerificationResult,
} from './mfa-guard';

// Feature 8: Session Validation (Vertical-bound)
export {
  createVerticalSession,
  getSession,
  validateSession,
  validateVerticalAccess,
  refreshSession,
  invalidateSession,
  invalidateUserSessions,
  updateSessionVertical,
  getUserSessions,
  cleanupExpiredSessions,
  validateRequestSession,
  type SessionValidationResult,
} from './session-validator';

/**
 * Main identity intelligence flow for onboarding
 *
 * Usage:
 * ```typescript
 * import { analyzeEmailAndSuggestVertical, lockUserVertical } from '@/lib/auth/identity';
 *
 * // During onboarding - get vertical suggestion
 * const suggestion = await analyzeEmailAndSuggestVertical(email);
 * if (suggestion.suggestedVertical) {
 *   // Show suggestion in UI
 * }
 *
 * // After user confirms vertical
 * const lockState = lockUserVertical(userId, selectedVertical);
 * ```
 */

import { analyzeEmail } from './domain-extractor';
import { getVerticalSuggestionFromEmail } from './vertical-suggestion';
import { lockVertical, getVerticalLockState } from './vertical-lock';
import { createVerticalSession } from './session-validator';
import { VerticalId } from '@/lib/stores/onboarding-store';

/**
 * Complete identity analysis and vertical suggestion
 * Call this when user enters email during onboarding
 */
export async function analyzeEmailAndSuggestVertical(email: string) {
  const emailAnalysis = analyzeEmail(email);
  const suggestion = await getVerticalSuggestionFromEmail(email);

  return {
    email: emailAnalysis,
    suggestion,
  };
}

/**
 * Lock user to a vertical and create session
 * Call this when user confirms vertical selection
 */
export function lockUserVertical(
  userId: string,
  vertical: VerticalId,
  lockedBy: 'user' | 'admin' | 'system' = 'user'
) {
  const lockState = lockVertical(userId, vertical, lockedBy);
  const session = createVerticalSession(userId);

  return {
    lockState,
    session,
  };
}

/**
 * Get user's current identity state
 */
export function getUserIdentityState(userId: string) {
  const lockState = getVerticalLockState(userId);

  return {
    hasVerticalLock: !!lockState,
    vertical: lockState?.vertical ?? null,
    isLocked: lockState?.isLocked ?? false,
    isConsultingMode: lockState?.isConsultingMode ?? false,
    allowedVerticals: lockState?.allowedVerticals ?? [],
  };
}
