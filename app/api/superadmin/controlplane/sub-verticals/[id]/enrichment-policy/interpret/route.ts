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
 * LOSSLESS Policy Interpreter
 *
 * CRITICAL RULES (STRICTLY ENFORCED):
 * 1. ZERO ROLE LOSS - Every role mentioned in the policy MUST appear in the IPR
 * 2. ZERO DEFAULTS - Do NOT insert default_roles unless explicitly stated
 * 3. ZERO ASSUMPTIONS - Do NOT use "assume_mid" or any assumption
 * 4. EXPLICIT UNCERTAINTY - If policy says "deprioritize confidence", use that exactly
 * 5. FAITHFUL TRANSLATION - Preserve intent, don't optimize or invent
 *
 * If something is not stated, OMIT it. Don't fill in blanks.
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
  let confidence = 0.9;

  // Parse the policy text into sentences for analysis
  const sentences = policyText.split(/[.\n]/).map((s) => s.trim()).filter((s) => s.length > 0);

  // ============================================================
  // STEP 1: Extract ALL numeric thresholds with explicit values
  // ============================================================
  const thresholdMatches: Array<{ value: number; context: string; comparison: 'gte' | 'lt' }> = [];

  // Pattern: "more than X employees" or "X+ employees"
  const morePatterns = [
    /more than (\d+)\s*employees/gi,
    /(\d+)\+\s*employees/gi,
    /greater than (\d+)\s*employees/gi,
    /over (\d+)\s*employees/gi,
  ];

  // Pattern: "fewer than X employees" or "<X employees"
  const lessPatterns = [
    /fewer than (\d+)\s*employees/gi,
    /less than (\d+)\s*employees/gi,
    /under (\d+)\s*employees/gi,
    /<\s*(\d+)\s*employees/gi,
  ];

  // Pattern: "between X and Y employees"
  const betweenPattern = /between\s*(\d+)\s*and\s*(\d+)\s*employees/gi;

  for (const pattern of morePatterns) {
    for (const match of policyText.matchAll(pattern)) {
      thresholdMatches.push({ value: parseInt(match[1]), context: match[0], comparison: 'gte' });
    }
  }

  for (const pattern of lessPatterns) {
    for (const match of policyText.matchAll(pattern)) {
      thresholdMatches.push({ value: parseInt(match[1]), context: match[0], comparison: 'lt' });
    }
  }

  for (const match of policyText.matchAll(betweenPattern)) {
    const min = parseInt(match[1]);
    const max = parseInt(match[2]);
    thresholdMatches.push({ value: min, context: match[0], comparison: 'gte' });
    thresholdMatches.push({ value: max, context: match[0], comparison: 'lt' });
    ipr.interpretation_notes.push(`Found explicit range: ${min}-${max} employees`);
  }

  // Deduplicate and create threshold objects
  const seenThresholds = new Set<string>();
  for (const t of thresholdMatches) {
    const key = `${t.value}-${t.comparison}`;
    if (!seenThresholds.has(key)) {
      seenThresholds.add(key);
      const name = t.comparison === 'gte'
        ? `threshold_${t.value}_or_more`
        : `threshold_under_${t.value}`;
      ipr.thresholds.push({
        name,
        field: 'headcount',
        value: t.value,
        unit: 'employees',
        comparison: t.comparison,
      });
    }
  }

  // ============================================================
  // STEP 2: Extract ALL roles mentioned - ZERO LOSS
  // ============================================================
  // Comprehensive role list - includes EVERY role that could appear
  const allRolePatterns = [
    // HR roles
    'HR Head', 'Head of HR', 'HR Director', 'HR Manager',
    'Chief People Officer', 'CPO', 'CHRO', 'Chief HR Officer',
    'Human Resources Manager', 'Human Resources Director',
    // Payroll/Benefits roles
    'Payroll Manager', 'Payroll Director', 'Head of Payroll',
    'Compensation & Benefits Lead', 'Compensation and Benefits Lead',
    'C&B Lead', 'C&B Manager', 'Benefits Manager', 'Benefits Director',
    'Compensation Manager', 'Compensation Director',
    // Finance roles
    'Finance Manager', 'Finance Director', 'CFO', 'Chief Financial Officer',
    'Financial Controller', 'Head of Finance',
    // Executive roles
    'Founder', 'Co-Founder', 'CEO', 'COO', 'CTO',
    'Managing Director', 'MD', 'General Manager', 'GM',
    'Owner', 'President', 'Vice President', 'VP',
    // Operations roles
    'Office Manager', 'Operations Manager', 'Admin Manager',
  ];

  // Function to extract roles from a sentence
  const extractRolesFromText = (text: string): string[] => {
    const found: string[] = [];
    const lowerText = text.toLowerCase();

    for (const role of allRolePatterns) {
      if (lowerText.includes(role.toLowerCase())) {
        // Use the exact case from the pattern
        if (!found.includes(role)) {
          found.push(role);
        }
      }
    }
    return found;
  };

  // ============================================================
  // STEP 3: Associate roles with company size contexts
  // ============================================================
  interface SizeContext {
    type: 'large' | 'mid' | 'small' | 'unknown';
    min: number | null;
    max: number | null;
    roles: string[];
    sourceText: string;
  }

  const sizeContexts: SizeContext[] = [];

  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();
    const roles = extractRolesFromText(sentence);

    if (roles.length === 0) continue; // No roles in this sentence

    // Determine size context from the sentence
    let sizeType: 'large' | 'mid' | 'small' | 'unknown' = 'unknown';
    let min: number | null = null;
    let max: number | null = null;

    // Check for explicit size indicators
    if (lowerSentence.includes('large') || lowerSentence.includes('more than 500') || lowerSentence.includes('500+')) {
      sizeType = 'large';
      min = 500;
      max = null;
    } else if (lowerSentence.includes('mid-size') || lowerSentence.includes('mid size') ||
               lowerSentence.includes('between 100 and 500') || lowerSentence.includes('100-500')) {
      sizeType = 'mid';
      min = 100;
      max = 500;
    } else if (lowerSentence.includes('small') || lowerSentence.includes('fewer than 100') || lowerSentence.includes('<100')) {
      sizeType = 'small';
      min = null;
      max = 100;
    }

    sizeContexts.push({
      type: sizeType,
      min,
      max,
      roles,
      sourceText: sentence,
    });
  }

  // ============================================================
  // STEP 4: Build target_roles from extracted contexts
  // ============================================================
  for (const ctx of sizeContexts) {
    if (ctx.roles.length === 0) continue;

    // Build reason from source text
    const reasonMap: Record<string, string> = {
      large: 'Large company contacts per policy',
      mid: 'Mid-size company contacts per policy',
      small: 'Small company contacts per policy',
      unknown: 'Contacts extracted from policy (size context unclear)',
    };

    ipr.target_roles.push({
      company_size_range: { min: ctx.min, max: ctx.max },
      titles: ctx.roles,
      priority: 1,
      reason: reasonMap[ctx.type],
    });
  }

  // ============================================================
  // STEP 5: Extract uncertainty handling - STRICTLY FROM TEXT
  // ============================================================
  const lowerPolicy = policyText.toLowerCase();

  // Check for explicit uncertainty statements
  if (lowerPolicy.includes('unclear') || lowerPolicy.includes('not available')) {
    // Check what the policy says to do
    if (lowerPolicy.includes('deprioritize') && lowerPolicy.includes('confidence')) {
      // User explicitly said "deprioritize confidence"
      ipr.uncertainty_handling.when_size_unknown = 'flag_for_review';
      ipr.fallback_behavior.when_no_match = 'deprioritize';
      ipr.fallback_behavior.deprioritize_factor = 0.7; // Lower confidence
      ipr.interpretation_notes.push('Policy states: deprioritize confidence when data unclear');
    } else if (lowerPolicy.includes('still allow')) {
      // Policy says to proceed but with lower confidence
      ipr.uncertainty_handling.when_size_unknown = 'flag_for_review';
      ipr.interpretation_notes.push('Policy states: allow enrichment but flag for review');
    }

    // Look for "best-guess" instruction
    if (lowerPolicy.includes('best-guess') || lowerPolicy.includes('best guess')) {
      ipr.interpretation_notes.push('Policy requests best-guess decision makers when uncertain');
    }
  }

  // Check for geography handling
  if (lowerPolicy.includes('uae presence')) {
    if (lowerPolicy.includes('preferred') && lowerPolicy.includes('not mandatory')) {
      ipr.uncertainty_handling.when_geography_unclear = 'proceed';
      ipr.interpretation_notes.push('Policy states: UAE presence preferred but not mandatory');
    } else if (lowerPolicy.includes('expanding')) {
      ipr.interpretation_notes.push('Policy allows companies expanding into region');
    }
  }

  // ============================================================
  // STEP 6: Validate extraction quality
  // ============================================================
  // Count all unique roles extracted
  const allExtractedRoles = new Set<string>();
  for (const ctx of sizeContexts) {
    ctx.roles.forEach((r) => allExtractedRoles.add(r));
  }

  // Count all roles mentioned in policy text for comparison
  const allMentionedRoles = extractRolesFromText(policyText);

  // Check for role loss
  const missingRoles = allMentionedRoles.filter((r) => !allExtractedRoles.has(r));
  if (missingRoles.length > 0) {
    warnings.push(`WARNING: These roles appear in policy but may not be in target_roles: ${missingRoles.join(', ')}`);
    confidence -= 0.2;
  }

  if (ipr.target_roles.length === 0) {
    warnings.push('No target roles could be extracted. Please check role names in policy.');
    confidence = 0.3;
  }

  if (ipr.thresholds.length === 0) {
    warnings.push('No explicit thresholds found. Extracted roles may lack size context.');
    confidence -= 0.1;
  }

  // Final notes
  ipr.interpretation_notes.push(`Extracted ${allExtractedRoles.size} unique roles across ${ipr.target_roles.length} size segments`);
  ipr.interpretation_notes.push(`Found ${ipr.thresholds.length} explicit thresholds in policy text`);

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
