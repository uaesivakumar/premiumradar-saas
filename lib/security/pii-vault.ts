/**
 * PII Vault - Encryption Service
 *
 * S368: PII Vault & Tokenization
 * Requirement: Zero plain-text PII in database
 *
 * Architecture:
 * - AES-256-GCM encryption for PII at rest
 * - SHA-256 hashing for deduplication lookups
 * - Tenant-scoped encryption keys
 * - Decrypt only with tenant-authorized access
 *
 * Usage:
 * ```typescript
 * import { piiVault } from '@/lib/security/pii-vault';
 *
 * // Encrypt before storing
 * const encrypted = await piiVault.encrypt(tenantId, 'contact@company.com');
 * const hash = piiVault.hash('contact@company.com');
 *
 * // Decrypt when displaying
 * const decrypted = await piiVault.decrypt(tenantId, encrypted);
 * ```
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash, scryptSync } from 'crypto';
import { logger } from '@/lib/logging/structured-logger';

// ============================================================
// CONFIGURATION
// ============================================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

/**
 * Get the master encryption key from environment
 * In production, this should come from GCP KMS or Secret Manager
 */
function getMasterKey(): string {
  const key = process.env.ENCRYPTION_KEY || process.env.PII_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY not configured - PII vault cannot operate');
  }
  return key;
}

// ============================================================
// PII VAULT CLASS
// ============================================================

class PIIVault {
  /**
   * Derive a tenant-specific key from master key
   * This ensures tenant isolation even with a single master key
   */
  private deriveKey(tenantId: string, salt: Buffer): Buffer {
    const masterKey = getMasterKey();
    const keyMaterial = `${masterKey}:${tenantId}`;
    return scryptSync(keyMaterial, salt, KEY_LENGTH);
  }

  /**
   * Encrypt PII data
   *
   * @param tenantId - Tenant ID for key derivation
   * @param plaintext - Plain text PII to encrypt
   * @returns Encrypted string in format: salt:iv:authTag:ciphertext (all base64)
   */
  async encrypt(tenantId: string, plaintext: string): Promise<string> {
    if (!plaintext) {
      return '';
    }

    try {
      // Generate random salt and IV
      const salt = randomBytes(SALT_LENGTH);
      const iv = randomBytes(IV_LENGTH);

      // Derive tenant-specific key
      const key = this.deriveKey(tenantId, salt);

      // Encrypt
      const cipher = createCipheriv(ALGORITHM, key, iv);
      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
      ]);

      // Get auth tag for integrity verification
      const authTag = cipher.getAuthTag();

      // Combine: salt:iv:authTag:ciphertext
      const result = [
        salt.toString('base64'),
        iv.toString('base64'),
        authTag.toString('base64'),
        encrypted.toString('base64'),
      ].join(':');

      return result;
    } catch (error) {
      logger.error('PII encryption failed', { tenantId }, error as Error);
      throw new Error('Failed to encrypt PII');
    }
  }

  /**
   * Decrypt PII data
   *
   * @param tenantId - Tenant ID for key derivation
   * @param ciphertext - Encrypted string from encrypt()
   * @returns Decrypted plain text
   */
  async decrypt(tenantId: string, ciphertext: string): Promise<string> {
    if (!ciphertext) {
      return '';
    }

    try {
      // Parse components
      const parts = ciphertext.split(':');
      if (parts.length !== 4) {
        throw new Error('Invalid ciphertext format');
      }

      const [saltB64, ivB64, authTagB64, encryptedB64] = parts;
      const salt = Buffer.from(saltB64, 'base64');
      const iv = Buffer.from(ivB64, 'base64');
      const authTag = Buffer.from(authTagB64, 'base64');
      const encrypted = Buffer.from(encryptedB64, 'base64');

      // Derive same key
      const key = this.deriveKey(tenantId, salt);

      // Decrypt
      const decipher = createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      logger.error('PII decryption failed', { tenantId }, error as Error);
      throw new Error('Failed to decrypt PII');
    }
  }

  /**
   * Generate a deterministic hash for deduplication
   * Uses SHA-256 with a salt to prevent rainbow table attacks
   *
   * @param value - Value to hash (email, phone, etc.)
   * @returns Hex-encoded hash
   */
  hash(value: string): string {
    if (!value) {
      return '';
    }

    // Normalize before hashing (lowercase, trim)
    const normalized = value.toLowerCase().trim();

    // Use a consistent salt from the master key
    const masterKey = getMasterKey();
    const salted = `${masterKey}:pii-dedup:${normalized}`;

    return createHash('sha256').update(salted).digest('hex');
  }

  /**
   * Hash an email address for deduplication
   * Normalizes email format before hashing
   */
  hashEmail(email: string): string {
    if (!email) {
      return '';
    }

    // Normalize: lowercase, trim, handle gmail dots
    let normalized = email.toLowerCase().trim();

    // For Gmail addresses, remove dots before @ (gmail ignores them)
    const atIndex = normalized.indexOf('@');
    if (atIndex > 0) {
      const localPart = normalized.substring(0, atIndex);
      const domain = normalized.substring(atIndex);

      if (domain === '@gmail.com' || domain === '@googlemail.com') {
        normalized = localPart.replace(/\./g, '') + domain;
      }
    }

    return this.hash(normalized);
  }

  /**
   * Hash a phone number for deduplication
   * Normalizes phone format (digits only)
   */
  hashPhone(phone: string): string {
    if (!phone) {
      return '';
    }

    // Extract only digits
    const digitsOnly = phone.replace(/\D/g, '');

    // Handle country codes - normalize to include them
    // If starts with 0, assume local and prepend country code would be needed
    // For now, just hash the normalized digits
    return this.hash(digitsOnly);
  }

  /**
   * Encrypt multiple PII fields at once
   */
  async encryptFields(
    tenantId: string,
    fields: Record<string, string | undefined>
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(fields)) {
      if (value) {
        result[key] = await this.encrypt(tenantId, value);
      } else {
        result[key] = '';
      }
    }

    return result;
  }

  /**
   * Decrypt multiple PII fields at once
   */
  async decryptFields(
    tenantId: string,
    fields: Record<string, string | undefined>
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(fields)) {
      if (value) {
        result[key] = await this.decrypt(tenantId, value);
      } else {
        result[key] = '';
      }
    }

    return result;
  }

  /**
   * Generate hashes for deduplication fields
   */
  generateDedupHashes(fields: {
    email?: string;
    phone?: string;
    name?: string;
  }): {
    emailHash: string;
    phoneHash: string;
    nameHash: string;
  } {
    return {
      emailHash: fields.email ? this.hashEmail(fields.email) : '',
      phoneHash: fields.phone ? this.hashPhone(fields.phone) : '',
      nameHash: fields.name ? this.hash(fields.name.toLowerCase().trim()) : '',
    };
  }

  /**
   * Verify that encryption is properly configured
   */
  async verifyConfiguration(): Promise<{ valid: boolean; error?: string }> {
    try {
      getMasterKey();

      // Test encrypt/decrypt roundtrip
      const testData = 'pii-vault-test-' + Date.now();
      const testTenant = 'test-tenant';

      const encrypted = await this.encrypt(testTenant, testData);
      const decrypted = await this.decrypt(testTenant, encrypted);

      if (decrypted !== testData) {
        return { valid: false, error: 'Encryption roundtrip failed' };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

export const piiVault = new PIIVault();

// Export class for testing
export { PIIVault };

// Export types
export interface EncryptedPII {
  encrypted: string;
  hash: string;
}

export interface LeadPII {
  contactEmail?: string;
  contactPhone?: string;
  contactName?: string;
}

export interface EncryptedLeadPII {
  contactEmailEncrypted: string;
  contactEmailHash: string;
  contactPhoneEncrypted: string;
  contactPhoneHash: string;
  contactNameEncrypted: string;
  contactNameHash: string;
}

/**
 * Helper to encrypt all lead PII fields
 */
export async function encryptLeadPII(
  tenantId: string,
  pii: LeadPII
): Promise<EncryptedLeadPII> {
  const hashes = piiVault.generateDedupHashes({
    email: pii.contactEmail,
    phone: pii.contactPhone,
    name: pii.contactName,
  });

  const encrypted = await piiVault.encryptFields(tenantId, {
    email: pii.contactEmail,
    phone: pii.contactPhone,
    name: pii.contactName,
  });

  return {
    contactEmailEncrypted: encrypted.email || '',
    contactEmailHash: hashes.emailHash,
    contactPhoneEncrypted: encrypted.phone || '',
    contactPhoneHash: hashes.phoneHash,
    contactNameEncrypted: encrypted.name || '',
    contactNameHash: hashes.nameHash,
  };
}

/**
 * Helper to decrypt all lead PII fields
 */
export async function decryptLeadPII(
  tenantId: string,
  encrypted: Partial<EncryptedLeadPII>
): Promise<LeadPII> {
  const decrypted = await piiVault.decryptFields(tenantId, {
    email: encrypted.contactEmailEncrypted,
    phone: encrypted.contactPhoneEncrypted,
    name: encrypted.contactNameEncrypted,
  });

  return {
    contactEmail: decrypted.email || undefined,
    contactPhone: decrypted.phone || undefined,
    contactName: decrypted.name || undefined,
  };
}
