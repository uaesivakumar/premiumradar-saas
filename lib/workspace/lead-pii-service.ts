/**
 * Lead PII Service
 *
 * S368: PII Vault & Tokenization
 * Handles decryption of lead PII for display purposes.
 *
 * Usage:
 * ```typescript
 * import { leadPIIService } from '@/lib/workspace/lead-pii-service';
 *
 * // Decrypt a single lead
 * const lead = await leadPIIService.decryptLead(tenantId, rawLead);
 *
 * // Decrypt multiple leads
 * const leads = await leadPIIService.decryptLeads(tenantId, rawLeads);
 * ```
 */

import { piiVault, decryptLeadPII } from '@/lib/security/pii-vault';
import { logger } from '@/lib/logging/structured-logger';

// ============================================================
// TYPES
// ============================================================

/**
 * Raw lead from database with encrypted PII
 */
export interface RawLead {
  id: string;
  tenant_id: string;
  company_name: string;
  company_domain?: string;
  // Encrypted fields
  contact_name_encrypted?: string;
  contact_email_encrypted?: string;
  contact_phone_encrypted?: string;
  // Hash fields (for dedup, not display)
  contact_name_hash?: string;
  contact_email_hash?: string;
  contact_phone_hash?: string;
  // Legacy plain-text fields (may exist during migration)
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  // Other fields
  contact_title?: string;
  pii_encrypted?: boolean;
  [key: string]: unknown;
}

/**
 * Lead with decrypted PII for display
 */
export interface DecryptedLead extends Omit<RawLead,
  'contact_name_encrypted' | 'contact_email_encrypted' | 'contact_phone_encrypted' |
  'contact_name_hash' | 'contact_email_hash' | 'contact_phone_hash'
> {
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

// ============================================================
// LEAD PII SERVICE
// ============================================================

class LeadPIIService {
  /**
   * Decrypt PII fields in a single lead
   *
   * Handles both encrypted and legacy plain-text formats:
   * - If pii_encrypted=true, decrypts from *_encrypted fields
   * - If pii_encrypted=false, uses legacy plain-text fields
   */
  async decryptLead<T extends RawLead>(
    tenantId: string,
    lead: T
  ): Promise<DecryptedLead & Omit<T, keyof RawLead>> {
    // If not encrypted, return as-is (legacy support during migration)
    if (!lead.pii_encrypted) {
      return lead as DecryptedLead & Omit<T, keyof RawLead>;
    }

    try {
      // Decrypt PII fields
      const decrypted = await decryptLeadPII(tenantId, {
        contactEmailEncrypted: lead.contact_email_encrypted,
        contactPhoneEncrypted: lead.contact_phone_encrypted,
        contactNameEncrypted: lead.contact_name_encrypted,
      });

      // Build result with decrypted PII
      const result: DecryptedLead & Omit<T, keyof RawLead> = {
        ...lead,
        contact_name: decrypted.contactName || undefined,
        contact_email: decrypted.contactEmail || undefined,
        contact_phone: decrypted.contactPhone || undefined,
      } as DecryptedLead & Omit<T, keyof RawLead>;

      // Remove encrypted fields from result
      delete (result as Record<string, unknown>).contact_name_encrypted;
      delete (result as Record<string, unknown>).contact_email_encrypted;
      delete (result as Record<string, unknown>).contact_phone_encrypted;
      delete (result as Record<string, unknown>).contact_name_hash;
      delete (result as Record<string, unknown>).contact_email_hash;
      delete (result as Record<string, unknown>).contact_phone_hash;

      return result;
    } catch (error) {
      logger.error('Failed to decrypt lead PII', {
        leadId: lead.id,
        tenantId,
      }, error as Error);

      // Return with PII fields as undefined on error
      return {
        ...lead,
        contact_name: undefined,
        contact_email: undefined,
        contact_phone: undefined,
      } as DecryptedLead & Omit<T, keyof RawLead>;
    }
  }

  /**
   * Decrypt PII fields in multiple leads
   */
  async decryptLeads<T extends RawLead>(
    tenantId: string,
    leads: T[]
  ): Promise<Array<DecryptedLead & Omit<T, keyof RawLead>>> {
    return Promise.all(
      leads.map(lead => this.decryptLead(tenantId, lead))
    );
  }

  /**
   * Check if a lead has encrypted PII
   */
  isEncrypted(lead: RawLead): boolean {
    return lead.pii_encrypted === true;
  }

  /**
   * Get masked email for display (e.g., "j***@company.com")
   * Use when full email should not be shown
   */
  maskEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return '***@***.***';
    }

    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 1
      ? local[0] + '***'
      : '***';

    return `${maskedLocal}@${domain}`;
  }

  /**
   * Get masked phone for display (e.g., "+1 *** *** 1234")
   * Use when full phone should not be shown
   */
  maskPhone(phone: string): string {
    if (!phone) {
      return '*** *** ****';
    }

    // Keep only last 4 digits visible
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 4) {
      return '*** ***';
    }

    return `*** *** ${digits.slice(-4)}`;
  }

  /**
   * Get masked name for display (e.g., "J*** D***")
   * Use when full name should not be shown
   */
  maskName(name: string): string {
    if (!name) {
      return '***';
    }

    const parts = name.trim().split(/\s+/);
    return parts.map(part =>
      part.length > 1 ? part[0] + '***' : '***'
    ).join(' ');
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

export const leadPIIService = new LeadPIIService();

// Export class for testing
export { LeadPIIService };
