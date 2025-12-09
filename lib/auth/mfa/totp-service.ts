/**
 * TOTP MFA Service - Sprint S141.1
 *
 * Implements Time-based One-Time Password (TOTP) authentication using otplib.
 * Supports enrollment, verification, and enforcement for SUPER_ADMIN + TENANT_ADMIN.
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// ============================================================
// CONFIGURATION
// ============================================================

const APP_NAME = 'PremiumRadar';
const TOTP_WINDOW = 1; // Allow 1 step tolerance (30 seconds before/after)
const ENCRYPTION_KEY = process.env.MFA_ENCRYPTION_KEY || 'default-key-change-in-production';

// Configure authenticator
authenticator.options = {
  window: TOTP_WINDOW,
  step: 30, // 30 second intervals
  digits: 6,
};

// ============================================================
// TYPES
// ============================================================

export interface MFAEnrollment {
  userId: string;
  secret: string; // Encrypted
  secretPlain?: string; // Only returned during enrollment
  otpauthUrl: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
  enrolledAt: string;
  verified: boolean;
}

export interface MFAVerificationResult {
  success: boolean;
  error?: string;
  verifiedAt?: string;
}

export interface MFAStatus {
  userId: string;
  enabled: boolean;
  method: 'totp' | null;
  enrolledAt: string | null;
  lastVerifiedAt: string | null;
}

// In-memory store for demo (use database in production)
const mfaStore = new Map<string, {
  secret: string;
  backupCodes: string[];
  enrolledAt: string;
  verified: boolean;
  lastVerifiedAt: string | null;
}>();

// ============================================================
// ENCRYPTION HELPERS
// ============================================================

/**
 * Derive encryption key from password
 */
function deriveKey(password: string): Buffer {
  return scryptSync(password, 'salt', 32);
}

/**
 * Encrypt MFA secret for storage
 */
export function encryptSecret(secret: string): string {
  const key = deriveKey(ENCRYPTION_KEY);
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt MFA secret from storage
 */
export function decryptSecret(encrypted: string): string {
  const [ivHex, encryptedData] = encrypted.split(':');
  const key = deriveKey(ENCRYPTION_KEY);
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ============================================================
// BACKUP CODES
// ============================================================

/**
 * Generate backup codes for account recovery
 */
function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric codes
    const code = randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

// ============================================================
// ENROLLMENT
// ============================================================

/**
 * Start MFA enrollment for a user
 */
export async function startMFAEnrollment(
  userId: string,
  userEmail: string
): Promise<MFAEnrollment> {
  // Generate new secret
  const secret = authenticator.generateSecret();

  // Generate otpauth URL
  const otpauthUrl = authenticator.keyuri(userEmail, APP_NAME, secret);

  // Generate QR code
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  // Generate backup codes
  const backupCodes = generateBackupCodes(10);

  // Encrypt secret for storage
  const encryptedSecret = encryptSecret(secret);

  // Store enrollment (not yet verified)
  mfaStore.set(userId, {
    secret: encryptedSecret,
    backupCodes,
    enrolledAt: new Date().toISOString(),
    verified: false,
    lastVerifiedAt: null,
  });

  return {
    userId,
    secret: encryptedSecret,
    secretPlain: secret, // Only shown once during enrollment
    otpauthUrl,
    qrCodeDataUrl,
    backupCodes,
    enrolledAt: new Date().toISOString(),
    verified: false,
  };
}

/**
 * Complete MFA enrollment by verifying first code
 */
export function completeMFAEnrollment(
  userId: string,
  code: string
): MFAVerificationResult {
  const enrollment = mfaStore.get(userId);

  if (!enrollment) {
    return { success: false, error: 'No enrollment found for user' };
  }

  if (enrollment.verified) {
    return { success: false, error: 'MFA already enrolled and verified' };
  }

  // Decrypt and verify
  const secret = decryptSecret(enrollment.secret);
  const isValid = authenticator.verify({ token: code, secret });

  if (!isValid) {
    return { success: false, error: 'Invalid verification code' };
  }

  // Mark as verified
  enrollment.verified = true;
  enrollment.lastVerifiedAt = new Date().toISOString();
  mfaStore.set(userId, enrollment);

  return {
    success: true,
    verifiedAt: enrollment.lastVerifiedAt,
  };
}

// ============================================================
// VERIFICATION
// ============================================================

/**
 * Verify TOTP code during login
 */
export function verifyTOTPCode(
  userId: string,
  code: string
): MFAVerificationResult {
  const enrollment = mfaStore.get(userId);

  if (!enrollment) {
    return { success: false, error: 'MFA not enrolled for user' };
  }

  if (!enrollment.verified) {
    return { success: false, error: 'MFA enrollment not completed' };
  }

  // Decrypt and verify
  const secret = decryptSecret(enrollment.secret);
  const isValid = authenticator.verify({ token: code, secret });

  if (!isValid) {
    return { success: false, error: 'Invalid verification code' };
  }

  // Update last verified
  enrollment.lastVerifiedAt = new Date().toISOString();
  mfaStore.set(userId, enrollment);

  return {
    success: true,
    verifiedAt: enrollment.lastVerifiedAt,
  };
}

/**
 * Verify backup code (single use)
 */
export function verifyBackupCode(
  userId: string,
  code: string
): MFAVerificationResult {
  const enrollment = mfaStore.get(userId);

  if (!enrollment) {
    return { success: false, error: 'MFA not enrolled for user' };
  }

  // Find and remove backup code
  const codeIndex = enrollment.backupCodes.findIndex(
    (bc) => bc.toUpperCase() === code.toUpperCase().replace(/\s/g, '')
  );

  if (codeIndex === -1) {
    return { success: false, error: 'Invalid backup code' };
  }

  // Remove used backup code
  enrollment.backupCodes.splice(codeIndex, 1);
  enrollment.lastVerifiedAt = new Date().toISOString();
  mfaStore.set(userId, enrollment);

  return {
    success: true,
    verifiedAt: enrollment.lastVerifiedAt,
  };
}

// ============================================================
// STATUS & MANAGEMENT
// ============================================================

/**
 * Get MFA status for user
 */
export function getMFAStatus(userId: string): MFAStatus {
  const enrollment = mfaStore.get(userId);

  if (!enrollment) {
    return {
      userId,
      enabled: false,
      method: null,
      enrolledAt: null,
      lastVerifiedAt: null,
    };
  }

  return {
    userId,
    enabled: enrollment.verified,
    method: 'totp',
    enrolledAt: enrollment.enrolledAt,
    lastVerifiedAt: enrollment.lastVerifiedAt,
  };
}

/**
 * Disable MFA for user
 */
export function disableMFA(userId: string): boolean {
  return mfaStore.delete(userId);
}

/**
 * Regenerate backup codes
 */
export function regenerateBackupCodes(userId: string): string[] | null {
  const enrollment = mfaStore.get(userId);

  if (!enrollment || !enrollment.verified) {
    return null;
  }

  const newCodes = generateBackupCodes(10);
  enrollment.backupCodes = newCodes;
  mfaStore.set(userId, enrollment);

  return newCodes;
}

/**
 * Get remaining backup codes count
 */
export function getBackupCodesCount(userId: string): number {
  const enrollment = mfaStore.get(userId);
  return enrollment?.backupCodes.length || 0;
}

// ============================================================
// ENFORCEMENT HELPERS
// ============================================================

/**
 * Check if MFA is required for user based on role
 */
export function isMFARequired(role: string): boolean {
  return role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN';
}

/**
 * Check if user has MFA enabled and verified
 */
export function hasMFAEnabled(userId: string): boolean {
  const status = getMFAStatus(userId);
  return status.enabled;
}

export default {
  startMFAEnrollment,
  completeMFAEnrollment,
  verifyTOTPCode,
  verifyBackupCode,
  getMFAStatus,
  disableMFA,
  regenerateBackupCodes,
  getBackupCodesCount,
  isMFARequired,
  hasMFAEnabled,
};
