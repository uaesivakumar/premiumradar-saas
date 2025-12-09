/**
 * MFA Module - Sprint S141.1
 *
 * Exports TOTP MFA service and types.
 */

export {
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
  encryptSecret,
  decryptSecret,
  type MFAEnrollment,
  type MFAVerificationResult,
  type MFAStatus,
} from './totp-service';
