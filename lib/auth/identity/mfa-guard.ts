/**
 * MFA Guard - Sprint S48 Feature 7
 * Require MFA verification for sensitive operations
 *
 * - Vertical overrides
 * - Admin actions
 * - Consulting mode changes
 */

import { MFA_REQUIREMENTS } from './types';

export type MfaOperation =
  | 'vertical_override'
  | 'admin_override'
  | 'consulting_mode_enable'
  | 'consulting_mode_disable'
  | 'sensitive_data_access';

export interface MfaChallenge {
  challengeId: string;
  userId: string;
  operation: MfaOperation;
  createdAt: string;
  expiresAt: string;
  verified: boolean;
  method: 'totp' | 'sms' | 'email' | null;
}

export interface MfaVerificationResult {
  success: boolean;
  challengeId: string;
  error?: string;
  verifiedAt?: string;
}

// In-memory store for challenges (use Redis/database in production)
const mfaChallenges = new Map<string, MfaChallenge>();

// Challenge expiry time (5 minutes)
const CHALLENGE_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Generate unique challenge ID
 */
function generateChallengeId(): string {
  return `mfa_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Check if operation requires MFA
 */
export function requiresMfa(operation: MfaOperation): boolean {
  switch (operation) {
    case 'vertical_override':
      return MFA_REQUIREMENTS.VERTICAL_OVERRIDE;
    case 'admin_override':
      return MFA_REQUIREMENTS.ADMIN_OVERRIDE;
    case 'consulting_mode_enable':
      return MFA_REQUIREMENTS.CONSULTING_MODE_ENABLE;
    case 'consulting_mode_disable':
      return true;
    case 'sensitive_data_access':
      return true;
    default:
      return false;
  }
}

/**
 * Create MFA challenge for operation
 */
export function createMfaChallenge(
  userId: string,
  operation: MfaOperation
): MfaChallenge {
  const challengeId = generateChallengeId();
  const now = new Date();

  const challenge: MfaChallenge = {
    challengeId,
    userId,
    operation,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + CHALLENGE_EXPIRY_MS).toISOString(),
    verified: false,
    method: null,
  };

  mfaChallenges.set(challengeId, challenge);

  return challenge;
}

/**
 * Get MFA challenge by ID
 */
export function getMfaChallenge(challengeId: string): MfaChallenge | null {
  return mfaChallenges.get(challengeId) || null;
}

/**
 * Check if challenge is still valid (not expired)
 */
export function isChallengeValid(challenge: MfaChallenge): boolean {
  const now = new Date();
  const expiresAt = new Date(challenge.expiresAt);
  return now < expiresAt && !challenge.verified;
}

/**
 * Verify MFA challenge with TOTP code
 * In production, this would validate against the user's TOTP secret
 */
export async function verifyTotpCode(
  challengeId: string,
  code: string,
  userId: string
): Promise<MfaVerificationResult> {
  const challenge = getMfaChallenge(challengeId);

  if (!challenge) {
    return { success: false, challengeId, error: 'Challenge not found' };
  }

  if (challenge.userId !== userId) {
    return { success: false, challengeId, error: 'Challenge does not belong to user' };
  }

  if (!isChallengeValid(challenge)) {
    return { success: false, challengeId, error: 'Challenge expired or already used' };
  }

  // In production: Validate TOTP code against user's secret
  // For now, we simulate validation
  const isValid = validateTotpCode(code);

  if (!isValid) {
    return { success: false, challengeId, error: 'Invalid verification code' };
  }

  // Mark challenge as verified
  challenge.verified = true;
  challenge.method = 'totp';
  mfaChallenges.set(challengeId, challenge);

  return {
    success: true,
    challengeId,
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * Verify MFA via email code
 */
export async function verifyEmailCode(
  challengeId: string,
  code: string,
  userId: string
): Promise<MfaVerificationResult> {
  const challenge = getMfaChallenge(challengeId);

  if (!challenge) {
    return { success: false, challengeId, error: 'Challenge not found' };
  }

  if (challenge.userId !== userId) {
    return { success: false, challengeId, error: 'Challenge does not belong to user' };
  }

  if (!isChallengeValid(challenge)) {
    return { success: false, challengeId, error: 'Challenge expired or already used' };
  }

  // In production: Validate email code
  const isValid = code.length === 6 && /^\d+$/.test(code);

  if (!isValid) {
    return { success: false, challengeId, error: 'Invalid verification code' };
  }

  challenge.verified = true;
  challenge.method = 'email';
  mfaChallenges.set(challengeId, challenge);

  return {
    success: true,
    challengeId,
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * Check if challenge is verified
 */
export function isChallengeVerified(challengeId: string): boolean {
  const challenge = getMfaChallenge(challengeId);
  return challenge?.verified ?? false;
}

/**
 * Validate TOTP code format and timing
 * In production, use a library like 'otplib'
 */
function validateTotpCode(code: string): boolean {
  // Basic validation: 6 digits
  if (code.length !== 6 || !/^\d+$/.test(code)) {
    return false;
  }

  // In production: Validate against user's TOTP secret
  // For now, accept any valid format
  return true;
}

/**
 * Clean up expired challenges
 */
export function cleanupExpiredChallenges(): number {
  const now = new Date();
  let cleaned = 0;

  for (const [id, challenge] of mfaChallenges.entries()) {
    if (new Date(challenge.expiresAt) < now) {
      mfaChallenges.delete(id);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * MFA guard wrapper for operations
 * Use this to wrap sensitive operations
 */
export async function withMfaGuard<T>(
  userId: string,
  operation: MfaOperation,
  challengeId: string | null,
  action: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string; requiresMfa?: boolean }> {
  // Check if operation requires MFA
  if (!requiresMfa(operation)) {
    const data = await action();
    return { success: true, data };
  }

  // No challenge provided
  if (!challengeId) {
    return {
      success: false,
      error: 'MFA verification required',
      requiresMfa: true,
    };
  }

  // Verify challenge
  if (!isChallengeVerified(challengeId)) {
    return {
      success: false,
      error: 'MFA challenge not verified',
      requiresMfa: true,
    };
  }

  // Challenge verified - execute action
  const data = await action();
  return { success: true, data };
}

export default {
  requiresMfa,
  createMfaChallenge,
  getMfaChallenge,
  isChallengeValid,
  verifyTotpCode,
  verifyEmailCode,
  isChallengeVerified,
  cleanupExpiredChallenges,
  withMfaGuard,
};
