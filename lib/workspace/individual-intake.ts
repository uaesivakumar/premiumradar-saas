/**
 * Individual Intake Module
 *
 * S365: Individual Lead Intake
 * Behavior Contract B015: Individual lead intake with dedup
 *
 * Handles intake of individual leads (manual entry, single imports)
 * with deduplication and validation.
 *
 * Architecture:
 * - Validates lead data before intake
 * - Checks for duplicates using fingerprinting
 * - Enriches basic data automatically
 * - Scores lead immediately
 * - Assigns to user or distribution queue
 */

import { query, queryOne } from '@/lib/db/client';
import { logger } from '@/lib/logging/structured-logger';
import { fingerprintEngine } from '@/lib/memory/fingerprint-engine';

// ============================================================
// TYPES
// ============================================================

export interface IndividualLeadInput {
  companyName: string;
  companyDomain?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactTitle?: string;
  region?: string;
  vertical?: string;
  subVertical?: string;
  notes?: string;
  source?: string;
  sourceDetail?: string;
}

export interface IntakeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  normalizedData: IndividualLeadInput;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchType?: 'exact' | 'fuzzy' | 'none';
  existingLead?: {
    id: string;
    companyName: string;
    status: string;
    assignedTo: string;
    createdAt: Date;
  };
  similarLeads?: Array<{
    id: string;
    companyName: string;
    similarity: number;
  }>;
}

export interface IntakeResult {
  success: boolean;
  leadId?: string;
  isDuplicate: boolean;
  duplicateInfo?: DuplicateCheckResult;
  validationErrors?: string[];
  message: string;
}

// ============================================================
// VALIDATION
// ============================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_REGEX = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
const PHONE_REGEX = /^[\d\s\+\-\(\)]{7,20}$/;

/**
 * Validate and normalize lead input data
 */
export function validateLeadInput(input: IndividualLeadInput): IntakeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const normalizedData = { ...input };

  // Required: Company name
  if (!input.companyName?.trim()) {
    errors.push('Company name is required');
  } else {
    normalizedData.companyName = input.companyName.trim();
  }

  // Optional but validated: Email
  if (input.contactEmail) {
    const email = input.contactEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      errors.push('Invalid email format');
    } else {
      normalizedData.contactEmail = email;
    }
  }

  // Optional but validated: Domain
  if (input.companyDomain) {
    const domain = input.companyDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    if (!DOMAIN_REGEX.test(domain)) {
      warnings.push('Company domain may be invalid');
    }
    normalizedData.companyDomain = domain;
  } else if (input.contactEmail) {
    // Extract domain from email if not provided
    const emailDomain = input.contactEmail.split('@')[1];
    if (emailDomain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(emailDomain)) {
      normalizedData.companyDomain = emailDomain;
      warnings.push(`Company domain inferred from email: ${emailDomain}`);
    }
  }

  // Optional but validated: Phone
  if (input.contactPhone) {
    const phone = input.contactPhone.trim();
    if (!PHONE_REGEX.test(phone)) {
      warnings.push('Phone number format may be invalid');
    }
    normalizedData.contactPhone = phone;
  }

  // Normalize optional strings
  if (input.contactName) {
    normalizedData.contactName = input.contactName.trim();
  }
  if (input.contactTitle) {
    normalizedData.contactTitle = input.contactTitle.trim();
  }
  if (input.region) {
    normalizedData.region = input.region.trim().toUpperCase();
  }
  if (input.notes) {
    normalizedData.notes = input.notes.trim().substring(0, 1000); // Limit notes length
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    normalizedData,
  };
}

// ============================================================
// INDIVIDUAL INTAKE ENGINE
// ============================================================

class IndividualIntakeEngine {
  /**
   * Intake an individual lead
   * B015: Validates, deduplicates, and creates lead
   */
  async intakeLead(
    tenantId: string,
    userId: string,
    input: IndividualLeadInput,
    options: {
      skipDuplicateCheck?: boolean;
      autoAssign?: boolean;
      assignToUserId?: string;
    } = {}
  ): Promise<IntakeResult> {
    try {
      // 1. Validate input
      const validation = validateLeadInput(input);
      if (!validation.valid) {
        return {
          success: false,
          isDuplicate: false,
          validationErrors: validation.errors,
          message: `Validation failed: ${validation.errors.join(', ')}`,
        };
      }

      const data = validation.normalizedData;

      // 2. Check for duplicates
      if (!options.skipDuplicateCheck) {
        const duplicateCheck = await this.checkForDuplicates(tenantId, data);
        if (duplicateCheck.isDuplicate && duplicateCheck.matchType === 'exact') {
          return {
            success: false,
            isDuplicate: true,
            duplicateInfo: duplicateCheck,
            message: `Duplicate detected: ${duplicateCheck.existingLead?.companyName} already exists`,
          };
        }
      }

      // 3. Create fingerprint
      const fingerprint = fingerprintEngine.generateFingerprint('individual_intake', {
        companyName: data.companyName,
        companyDomain: data.companyDomain,
        contactEmail: data.contactEmail,
      });

      // 4. Create the lead
      const leadResult = await query<{ id: string }>(
        `INSERT INTO leads (
          tenant_id,
          user_id,
          company_name,
          company_domain,
          contact_name,
          contact_email,
          contact_phone,
          contact_title,
          region,
          vertical,
          sub_vertical,
          notes,
          source,
          source_detail,
          fingerprint,
          status,
          score
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'new', 50)
        RETURNING id`,
        [
          tenantId,
          options.assignToUserId || userId,
          data.companyName,
          data.companyDomain || null,
          data.contactName || null,
          data.contactEmail || null,
          data.contactPhone || null,
          data.contactTitle || null,
          data.region || null,
          data.vertical || null,
          data.subVertical || null,
          data.notes || null,
          data.source || 'manual',
          data.sourceDetail || null,
          fingerprint,
        ]
      );

      const leadId = leadResult[0]?.id;

      // 5. Record fingerprint for future dedup
      await fingerprintEngine.checkAndRecord({
        tenantId,
        userId,
        actionType: 'individual_intake',
        actionParams: {
          companyName: data.companyName,
          companyDomain: data.companyDomain,
          contactEmail: data.contactEmail,
          leadId,
        },
        metadata: { leadId },
      });

      logger.info('Individual lead intake completed', {
        tenantId,
        userId,
        leadId,
        companyName: data.companyName,
        source: data.source || 'manual',
      });

      return {
        success: true,
        leadId,
        isDuplicate: false,
        message: `Lead "${data.companyName}" created successfully`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Individual intake failed', {
        tenantId,
        userId,
        error: errorMessage,
      });

      return {
        success: false,
        isDuplicate: false,
        message: `Intake failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Check for duplicate leads
   */
  async checkForDuplicates(
    tenantId: string,
    data: IndividualLeadInput
  ): Promise<DuplicateCheckResult> {
    // Check exact matches first
    const exactMatches = await query<{
      id: string;
      company_name: string;
      status: string;
      user_id: string;
      created_at: Date;
    }>(
      `SELECT id, company_name, status, user_id, created_at
       FROM leads
       WHERE tenant_id = $1
         AND (
           (company_domain IS NOT NULL AND LOWER(company_domain) = LOWER($2))
           OR (contact_email IS NOT NULL AND LOWER(contact_email) = LOWER($3))
         )
       LIMIT 1`,
      [tenantId, data.companyDomain || '', data.contactEmail || '']
    );

    if (exactMatches.length > 0) {
      const match = exactMatches[0];
      return {
        isDuplicate: true,
        matchType: 'exact',
        existingLead: {
          id: match.id,
          companyName: match.company_name,
          status: match.status,
          assignedTo: match.user_id,
          createdAt: match.created_at,
        },
      };
    }

    // Check fuzzy matches on company name
    const fuzzyMatches = await query<{
      id: string;
      company_name: string;
      similarity: number;
    }>(
      `SELECT id, company_name,
              similarity(LOWER(company_name), LOWER($2)) as similarity
       FROM leads
       WHERE tenant_id = $1
         AND similarity(LOWER(company_name), LOWER($2)) > 0.6
       ORDER BY similarity DESC
       LIMIT 5`,
      [tenantId, data.companyName]
    );

    if (fuzzyMatches.length > 0) {
      const topMatch = fuzzyMatches[0];
      if (topMatch.similarity > 0.85) {
        return {
          isDuplicate: true,
          matchType: 'fuzzy',
          existingLead: {
            id: topMatch.id,
            companyName: topMatch.company_name,
            status: 'unknown',
            assignedTo: 'unknown',
            createdAt: new Date(),
          },
          similarLeads: fuzzyMatches.map(m => ({
            id: m.id,
            companyName: m.company_name,
            similarity: Number(m.similarity),
          })),
        };
      }

      return {
        isDuplicate: false,
        matchType: 'none',
        similarLeads: fuzzyMatches.map(m => ({
          id: m.id,
          companyName: m.company_name,
          similarity: Number(m.similarity),
        })),
      };
    }

    return {
      isDuplicate: false,
      matchType: 'none',
    };
  }

  /**
   * Batch intake multiple leads
   */
  async intakeBatch(
    tenantId: string,
    userId: string,
    leads: IndividualLeadInput[],
    options: {
      skipDuplicates?: boolean;
      assignToUserId?: string;
    } = {}
  ): Promise<{
    success: number;
    failed: number;
    duplicates: number;
    results: IntakeResult[];
  }> {
    const results: IntakeResult[] = [];
    let success = 0;
    let failed = 0;
    let duplicates = 0;

    for (const lead of leads) {
      const result = await this.intakeLead(tenantId, userId, lead, {
        skipDuplicateCheck: false,
        assignToUserId: options.assignToUserId,
      });

      results.push(result);

      if (result.success) {
        success++;
      } else if (result.isDuplicate) {
        duplicates++;
        if (options.skipDuplicates) {
          // Still count as processed if skipping duplicates
        }
      } else {
        failed++;
      }
    }

    logger.info('Batch intake completed', {
      tenantId,
      userId,
      total: leads.length,
      success,
      failed,
      duplicates,
    });

    return { success, failed, duplicates, results };
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const individualIntake = new IndividualIntakeEngine();

export default individualIntake;
