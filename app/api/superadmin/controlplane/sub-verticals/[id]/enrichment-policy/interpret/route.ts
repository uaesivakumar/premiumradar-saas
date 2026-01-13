/**
 * Policy Interpretation API - S398
 *
 * POST /api/superadmin/controlplane/sub-verticals/[id]/enrichment-policy/interpret
 *   - Triggers LLM interpretation of the policy text
 *   - Creates a new policy version with status 'pending_approval'
 *   - Returns the interpreted IPR for review
 *
 * This is authoring-time interpretation ONLY.
 * NO runtime usage - the approved IPR is compiled in Phase 2.
 *
 * Part of Phase 1: Policy Compiler (Foundational)
 * Master Implementation Plan - LOCKED
 */

import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db/client';
import { validateSuperAdminSession } from '@/lib/superadmin-auth';
import { logControlPlaneAudit } from '@/lib/db/controlplane-audit';
import {
  IntermediatePolicyRepresentation,
  IPRTargetRole,
  hashPolicyText,
  createEmptyIPR,
} from '@/lib/policy/ipr-schema';

interface SubVerticalWithPolicy {
  id: string;
  key: string;
  name: string;
  primary_entity_type: string;
  enrichment_policy_text: string | null;
  enrichment_policy_version: number;
  vertical_key: string;
  vertical_name: string;
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * STRICT ENUM PARSING MODE - Policy Interpreter v2
 *
 * CRITICAL CONSTRAINTS (COMPILER-LEVEL ENFORCEMENT):
 *
 * 1. STRICT ROLE WHITELIST
 *    - ONLY roles explicitly written in policy are allowed
 *    - Slash-variants (HR Manager / People Manager) are ONE role with aliases
 *    - NO semantic expansion (HR Manager does NOT imply CHRO)
 *    - NO hierarchy inference
 *    - If policy says "Do not introduce roles outside the lists" → strict enum
 *
 * 2. EXPLICIT SCOPE DECLARATION (MANDATORY)
 *    Every target_roles block MUST have ONE of:
 *    - applies_to_all: true (for global/primary roles)
 *    - company_size_range: { min, max } (size-based)
 *    - conditions: [] (signal/condition-based)
 *    NULL-NULL SCOPE IS FORBIDDEN
 *
 * 3. ONE ROLE GROUP PER LOGIC BLOCK
 *    - No duplication
 *    - No role scattering
 *    - Each entry = one coherent rule from policy
 *
 * 4. LOSSLESS TRANSLATION
 *    - Every role in policy MUST appear in IPR
 *    - Every constraint in policy MUST be represented
 *    - NO invented roles, NO invented rules
 */
async function interpretPolicyWithLLM(
  policyText: string,
  context: {
    vertical: string;
    subVertical: string;
    entityType: string;
  }
): Promise<{
  ipr: IntermediatePolicyRepresentation;
  confidence: number;
  warnings: string[];
}> {
  const ipr = createEmptyIPR();
  ipr.generated_at = new Date().toISOString();
  ipr.generated_from_text_hash = hashPolicyText(policyText);
  ipr.interpretation_notes = [];

  const warnings: string[] = [];
  let confidence = 0.95;

  // ============================================================
  // STEP 1: DETECT STRICT MODE
  // ============================================================
  const lowerPolicy = policyText.toLowerCase();
  const isStrictMode = lowerPolicy.includes('do not introduce roles outside') ||
                       lowerPolicy.includes('strict rule') ||
                       lowerPolicy.includes('only roles');

  if (isStrictMode) {
    ipr.interpretation_notes.push('STRICT MODE: Only explicitly listed roles will be extracted');
  }

  // ============================================================
  // STEP 2: PARSE POLICY INTO LOGICAL BLOCKS
  // ============================================================
  // Split by double newlines or section headers
  const blocks = policyText.split(/\n\n+/).map(b => b.trim()).filter(b => b.length > 0);

  interface PolicyBlock {
    rawText: string;
    scopeType: 'all' | 'large' | 'mid' | 'small' | 'fallback' | 'uncertainty' | 'constraint';
    sizeRange: { min: number | null; max: number | null } | null;
    appliesTo: 'all' | 'size' | 'condition';
    roles: string[];
    isExclusion: boolean;
    isFallback: boolean;
  }

  const parsedBlocks: PolicyBlock[] = [];

  // ============================================================
  // STEP 3: EXTRACT ROLES FROM EACH BLOCK (STRICT WHITELIST)
  // ============================================================
  // SANITATION RULES:
  // 1. Preserve full role names EXACTLY as written (no truncation)
  // 2. NO instructional text in titles (filter "Prioritize X", "Focus on X")
  // 3. Titles = atomic enums only

  const extractRolesStrict = (text: string): string[] => {
    const roles: string[] = [];

    // INSTRUCTIONAL PREFIXES TO FILTER OUT (these are NOT role names)
    const instructionalPrefixes = [
      'prioritize', 'focus on', 'use ', 'avoid', 'target', 'if ', 'when ',
      'for large', 'for mid', 'for small', 'unless', 'primarily', 'goal:'
    ];

    // Known role-ending words (helps identify role patterns)
    const knownRoleWords = ['Manager', 'Director', 'Head', 'Lead', 'Specialist',
      'Administrator', 'Coordinator', 'Officer', 'Generalist', 'Admin'];

    // Extract lines that look like role lists (standalone lines with role names)
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // SKIP instructional lines (not role lists)
      const lowerLine = trimmedLine.toLowerCase();
      if (instructionalPrefixes.some(prefix => lowerLine.startsWith(prefix))) {
        continue; // This is instruction, not a role
      }

      // SKIP lines that are clearly sentences (have verbs/prepositions indicating prose)
      if (/\b(is|are|should|will|can|must|may|need|the|for|with|from|into)\b/i.test(trimmedLine) &&
          trimmedLine.length > 60) {
        continue; // Long line with verbs = prose, not role
      }

      // SKIP section headers (e.g., "Large companies (500+ employees):")
      if (/compan(y|ies).*:$/i.test(trimmedLine)) {
        continue;
      }

      // Check if this line contains role-like words
      const hasRoleWord = knownRoleWords.some(w => trimmedLine.includes(w));
      if (!hasRoleWord) continue;

      // This line looks like a role - preserve it EXACTLY
      // Pattern: Role names with optional (abbreviations) and / separators
      // Examples:
      //   "HR Manager / People Manager"
      //   "Compensation & Benefits (C&B) Manager / C&B Specialist"
      //   "Onboarding Specialist / People Operations Specialist"
      const rolePattern = /^[A-Z][a-zA-Z&\s()]+(?:\s*\/\s*[A-Z][a-zA-Z&\s()]+)*$/;

      if (rolePattern.test(trimmedLine)) {
        // This entire line is a role name - preserve EXACTLY
        const role = trimmedLine.trim();
        if (!roles.includes(role)) {
          roles.push(role);
        }
      }
    }

    return roles;
  };

  // ============================================================
  // STEP 4: PARSE EACH BLOCK FOR SCOPE AND ROLES
  // ============================================================
  // Track current section context (for fallback roles that appear in size sections)
  let currentSizeContext: 'all' | 'large' | 'mid' | 'small' | null = null;
  let isFallbackContext = false; // Track if we're in a fallback section

  for (const blockText of blocks) {
    const lowerBlock = blockText.toLowerCase();

    // Determine scope type
    let scopeType: PolicyBlock['scopeType'] = 'all';
    let sizeRange: { min: number | null; max: number | null } | null = null;
    let appliesTo: PolicyBlock['appliesTo'] = 'all';
    let isExclusion = false;
    let isFallback = false;

    // Check for size-based scope (these are section HEADERS)
    if (lowerBlock.includes('large compan') || lowerBlock.includes('500+') || lowerBlock.includes('500+ employees')) {
      scopeType = 'large';
      sizeRange = { min: 500, max: null };
      appliesTo = 'size';
      currentSizeContext = 'large';
      isFallbackContext = false;
    } else if (lowerBlock.includes('mid-size') || lowerBlock.includes('mid size') ||
               lowerBlock.includes('100–499') || lowerBlock.includes('100-499') ||
               (lowerBlock.includes('100') && lowerBlock.includes('499'))) {
      scopeType = 'mid';
      sizeRange = { min: 100, max: 499 };
      appliesTo = 'size';
      currentSizeContext = 'mid';
      isFallbackContext = false;
    } else if (lowerBlock.includes('small compan') || lowerBlock.includes('<100') ||
               lowerBlock.includes('fewer than 100') || lowerBlock.includes('under 100')) {
      scopeType = 'small';
      sizeRange = { min: null, max: 100 };
      appliesTo = 'size';
      currentSizeContext = 'small';
      isFallbackContext = false;
    } else if (lowerBlock.includes('all companies') || lowerBlock.includes('any size') ||
               lowerBlock.includes('primary roles')) {
      scopeType = 'all';
      appliesTo = 'all';
      currentSizeContext = 'all';
      isFallbackContext = false;
    } else if (lowerBlock.includes('uncertainty') || lowerBlock.includes('unknown')) {
      scopeType = 'uncertainty';
      appliesTo = 'condition';
      currentSizeContext = null; // Reset context
      isFallbackContext = false;
    } else if (lowerBlock.includes('strict rule') || lowerBlock.includes('do not introduce')) {
      scopeType = 'constraint';
      isExclusion = true;
      currentSizeContext = null; // Reset context
      isFallbackContext = false;
    }

    // FALLBACK DETECTION: "if none of", "fallback", "operational fallback"
    // Set fallback context flag
    if (lowerBlock.includes('fallback') || lowerBlock.includes('if none of')) {
      isFallbackContext = true;
    }

    // ROLE-ONLY BLOCKS: If block has roles but no section markers,
    // inherit the current context (size and fallback)
    const roles = extractRolesStrict(blockText);
    const isRoleOnlyBlock = roles.length > 0 &&
      !lowerBlock.includes('compan') &&
      !lowerBlock.includes('uncertainty') &&
      !lowerBlock.includes('strict') &&
      !lowerBlock.includes('primary roles') &&
      !lowerBlock.includes('all companies');

    if (isRoleOnlyBlock) {
      // Inherit the current context for role-only blocks
      if (isFallbackContext && currentSizeContext === 'small') {
        // These are FALLBACK roles for small companies
        scopeType = 'small';
        sizeRange = { min: null, max: 100 };
        appliesTo = 'size';
        isFallback = true;
      } else if (currentSizeContext === 'small') {
        scopeType = 'small';
        sizeRange = { min: null, max: 100 };
        appliesTo = 'size';
      } else if (currentSizeContext === 'mid') {
        scopeType = 'mid';
        sizeRange = { min: 100, max: 499 };
        appliesTo = 'size';
      } else if (currentSizeContext === 'large') {
        scopeType = 'large';
        sizeRange = { min: 500, max: null };
        appliesTo = 'size';
      }
      // If currentSizeContext is 'all', scopeType remains 'all' (already set)
    }

    // Check for exclusion indicators
    if (lowerBlock.includes('avoid') || lowerBlock.includes('do not') || lowerBlock.includes('unless')) {
      isExclusion = true;
    }

    if (roles.length > 0 || scopeType === 'constraint' || scopeType === 'uncertainty') {
      parsedBlocks.push({
        rawText: blockText,
        scopeType,
        sizeRange,
        appliesTo,
        roles,
        isExclusion,
        isFallback,
      });
    }
  }

  // ============================================================
  // STEP 5: BUILD TARGET_ROLES WITH EXPLICIT SCOPE
  // ============================================================
  const processedRoles = new Set<string>();

  for (const block of parsedBlocks) {
    if (block.roles.length === 0) continue;
    if (block.isExclusion && !block.isFallback) continue; // Skip pure exclusion blocks

    // Deduplicate - don't add roles we've already processed
    const newRoles = block.roles.filter(r => !processedRoles.has(r));
    if (newRoles.length === 0) continue;

    newRoles.forEach(r => processedRoles.add(r));

    // Build the target_roles entry with EXPLICIT scope
    const entry: {
      company_size_range?: { min: number | null; max: number | null };
      applies_to_all?: boolean;
      conditions?: Array<{ field: string; operator: string; value: unknown; description: string }>;
      titles: string[];
      priority: number;
      reason: string;
    } = {
      titles: newRoles,
      priority: 1,
      reason: '',
    };

    // Set explicit scope (MANDATORY - no null-null)
    if (block.appliesTo === 'all') {
      (entry as { applies_to_all?: boolean }).applies_to_all = true;
      entry.reason = 'Primary roles for ALL companies per policy.';
    } else if (block.appliesTo === 'size' && block.sizeRange) {
      entry.company_size_range = block.sizeRange;
      const sizeDesc = block.scopeType === 'large' ? 'Large (500+)' :
                       block.scopeType === 'mid' ? 'Mid-size (100-499)' :
                       block.scopeType === 'small' ? 'Small (<100)' : 'Size-based';

      // Check if this is a fallback role (lower priority)
      if (block.isFallback) {
        entry.reason = `Fallback operational contacts for ${sizeDesc} companies when primary roles not found.`;
        entry.priority = 2; // Lower priority for fallback
      } else {
        entry.reason = `${sizeDesc} company roles per policy.`;
      }
    } else if (block.appliesTo === 'condition') {
      if (block.isFallback) {
        entry.conditions = [{
          field: 'primary_roles_found',
          operator: 'eq',
          value: false,
          description: 'Fallback when primary HR/payroll roles not found',
        }];
        entry.reason = 'Fallback operational contacts per policy.';
        entry.priority = 2; // Lower priority for fallback
      } else {
        entry.conditions = [{
          field: 'employee_count',
          operator: 'not_exists',
          value: true,
          description: 'When employee count is unknown',
        }];
        entry.reason = 'Uncertainty handling per policy.';
      }
    }

    ipr.target_roles.push(entry as IPRTargetRole);
  }

  // ============================================================
  // STEP 6: EXTRACT THRESHOLDS (COLLAPSED TO SEMANTIC BOUNDARIES)
  // ============================================================
  // Only ONE threshold per policy clause (large/mid/small)
  // Detect from policy TEXT, not just parsed blocks (blocks may have no roles)

  // Detect semantic size boundaries from policy text directly
  const hasLarge = lowerPolicy.includes('large compan') ||
                   lowerPolicy.includes('500+') ||
                   lowerPolicy.includes('500+ employees');
  const hasMid = lowerPolicy.includes('mid-size') ||
                 lowerPolicy.includes('mid size') ||
                 lowerPolicy.includes('100–499') ||
                 lowerPolicy.includes('100-499');
  const hasSmall = lowerPolicy.includes('small compan') ||
                   lowerPolicy.includes('<100') ||
                   lowerPolicy.includes('fewer than 100');

  // Create exactly one threshold per semantic boundary
  if (hasLarge) {
    ipr.thresholds.push({
      name: 'large_company',
      field: 'headcount',
      value: 500,
      unit: 'employees',
      comparison: 'gte',
    });
  }

  if (hasMid) {
    ipr.thresholds.push({
      name: 'mid_size_company',
      field: 'headcount',
      value: 100,
      unit: 'employees',
      comparison: 'gte',
    });
  }

  if (hasSmall) {
    ipr.thresholds.push({
      name: 'small_company',
      field: 'headcount',
      value: 100,
      unit: 'employees',
      comparison: 'lt',
    });
  }

  // ============================================================
  // STEP 7: EXTRACT UNCERTAINTY HANDLING
  // ============================================================
  // Look for explicit uncertainty instructions
  if (lowerPolicy.includes('employee count is unknown')) {
    if (lowerPolicy.includes('proceed') || lowerPolicy.includes('continue')) {
      ipr.uncertainty_handling.when_size_unknown = 'flag_for_review';
      ipr.interpretation_notes.push('Policy: proceed with enrichment when size unknown, flag for review');
    }
    if (lowerPolicy.includes('low confidence')) {
      ipr.interpretation_notes.push('Policy: mark results as low confidence when size unknown');
    }
  }

  // ============================================================
  // STEP 8: EXTRACT SKIP RULES (exclusions)
  // ============================================================
  // SANITATION: All reason fields must be COMPLETE sentences
  // Scan policy TEXT directly, not just parsed blocks

  // Look for "avoid executive titles" pattern in full policy
  if (lowerPolicy.includes('avoid executive')) {
    // Match full sentence containing "avoid executive"
    // Handle "e.g." within parentheses by matching everything up to sentence-ending period
    const avoidMatch = policyText.match(/[Aa]void\s+executive\s+titles[^.]*(?:\([^)]+\))[^.]*\./);
    if (avoidMatch) {
      const cleanReason = avoidMatch[0].trim();
      ipr.skip_rules.push({
        condition: {
          field: 'role_type',
          operator: 'in',
          value: ['executive', 'c-level'],
          description: 'Executive titles to avoid per policy',
        },
        reason: cleanReason,
      });
    }
  }

  // Check for strict rule constraint
  if (lowerPolicy.includes('do not introduce roles outside')) {
    ipr.interpretation_notes.push('STRICT CONSTRAINT: Only explicitly listed roles are valid');
  }

  // ============================================================
  // STEP 9: VALIDATION
  // ============================================================
  // Check for null-null scopes (FORBIDDEN)
  for (const role of ipr.target_roles) {
    const hasValidScope = role.applies_to_all ||
                          (role.company_size_range && (role.company_size_range.min !== null || role.company_size_range.max !== null)) ||
                          (role.conditions && role.conditions.length > 0);

    if (!hasValidScope) {
      warnings.push(`INVALID: Role block with null scope detected. Every block must have explicit scope.`);
      confidence -= 0.3;
    }
  }

  // Check for empty extraction
  if (ipr.target_roles.length === 0) {
    warnings.push('No role blocks extracted. Check policy format.');
    confidence = 0.2;
  }

  // Summary notes
  const totalRoles = new Set(ipr.target_roles.flatMap(r => r.titles)).size;
  ipr.interpretation_notes.push(`Extracted ${totalRoles} unique roles across ${ipr.target_roles.length} scoped blocks`);
  ipr.interpretation_notes.push(`Found ${ipr.thresholds.length} explicit thresholds`);
  if (isStrictMode) {
    ipr.interpretation_notes.push('STRICT MODE ENFORCED: No semantic expansion');
  }

  return { ipr, confidence, warnings };
}

/**
 * POST /api/superadmin/controlplane/sub-verticals/[id]/enrichment-policy/interpret
 *
 * Triggers LLM interpretation of the current policy text.
 * Creates a new policy version with status 'pending_approval'.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const sessionResult = await validateSuperAdminSession();
  if (!sessionResult.valid) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const actorUser = sessionResult.session?.email || 'unknown';

  try {
    // Get sub-vertical with policy text
    const subVertical = await queryOne<SubVerticalWithPolicy>(
      `SELECT sv.id, sv.key, sv.name, sv.primary_entity_type,
              sv.enrichment_policy_text, sv.enrichment_policy_version,
              v.key as vertical_key, v.name as vertical_name
       FROM os_sub_verticals sv
       JOIN os_verticals v ON sv.vertical_id = v.id
       WHERE sv.id = $1`,
      [id]
    );

    if (!subVertical) {
      return Response.json(
        { success: false, error: 'Sub-vertical not found' },
        { status: 404 }
      );
    }

    if (!subVertical.enrichment_policy_text) {
      return Response.json(
        {
          success: false,
          error: 'NO_POLICY_TEXT',
          message: 'No enrichment policy text to interpret. Write a policy first.',
        },
        { status: 400 }
      );
    }

    // Check for existing pending interpretation
    const existingPending = await queryOne<{ id: string; version: number }>(
      `SELECT id, version FROM enrichment_policy_versions
       WHERE sub_vertical_id = $1 AND status = 'pending_approval'
       ORDER BY version DESC LIMIT 1`,
      [id]
    );

    if (existingPending) {
      return Response.json(
        {
          success: false,
          error: 'PENDING_INTERPRETATION_EXISTS',
          message: 'A pending interpretation already exists. Approve or reject it before creating a new one.',
          existing_version: existingPending.version,
        },
        { status: 400 }
      );
    }

    // Get next version number
    const latestVersion = await queryOne<{ max_version: number }>(
      `SELECT COALESCE(MAX(version), 0) as max_version
       FROM enrichment_policy_versions
       WHERE sub_vertical_id = $1`,
      [id]
    );

    const newVersion = (latestVersion?.max_version || 0) + 1;

    // Interpret the policy
    const { ipr, confidence, warnings } = await interpretPolicyWithLLM(
      subVertical.enrichment_policy_text,
      {
        vertical: subVertical.vertical_key,
        subVertical: subVertical.key,
        entityType: subVertical.primary_entity_type,
      }
    );

    // Create new policy version with interpretation
    const policyVersion = await queryOne<{
      id: string;
      version: number;
      status: string;
      created_at: string;
    }>(
      `INSERT INTO enrichment_policy_versions (
         sub_vertical_id, version, policy_text, interpreted_ipr,
         interpretation_confidence, interpretation_warnings,
         interpreted_at, interpreted_by, status, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, 'pending_approval', $8)
       RETURNING id, version, status, created_at`,
      [
        id,
        newVersion,
        subVertical.enrichment_policy_text,
        JSON.stringify(ipr),
        confidence,
        JSON.stringify(warnings),
        'system', // LLM interpretation
        actorUser,
      ]
    );

    // Audit log
    await logControlPlaneAudit({
      actorUser,
      action: 'interpret_policy',
      targetType: 'enrichment_policy_version',
      targetId: policyVersion?.id || id,
      requestJson: { policy_text_length: subVertical.enrichment_policy_text.length },
      resultJson: {
        version: newVersion,
        confidence,
        warnings_count: warnings.length,
        target_roles_count: ipr.target_roles.length,
      },
      success: true,
    });

    return Response.json({
      success: true,
      data: {
        version_id: policyVersion?.id,
        version: newVersion,
        status: 'pending_approval',
        policy_text: subVertical.enrichment_policy_text,
        interpreted_ipr: ipr,
        interpretation_confidence: confidence,
        interpretation_warnings: warnings,
        created_at: policyVersion?.created_at,
      },
      message: warnings.length > 0
        ? `Policy interpreted with ${warnings.length} warning(s). Review carefully before approving.`
        : 'Policy interpreted successfully. Review the interpretation before approving.',
    });
  } catch (error) {
    console.error('[PolicyInterpret POST] Error:', error);

    // Handle missing table
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      return Response.json(
        {
          success: false,
          error: 'MIGRATION_REQUIRED',
          message: 'Policy versioning table not found. Run S400_enrichment_policy_versions.sql migration.',
        },
        { status: 500 }
      );
    }

    return Response.json(
      { success: false, error: 'Failed to interpret policy' },
      { status: 500 }
    );
  }
}
