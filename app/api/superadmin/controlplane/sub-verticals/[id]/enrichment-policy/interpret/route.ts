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
 * Generate IPR using LLM
 *
 * In production, this would call the UPR-OS policy interpretation service.
 * For Phase 1, we'll use a structured extraction approach.
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
  // For Phase 1 demo, we'll use a rule-based extraction
  // In production, this would call POST /api/os/policy/interpret

  const ipr = createEmptyIPR();
  ipr.generated_at = new Date().toISOString();
  ipr.generated_from_text_hash = hashPolicyText(policyText);

  const warnings: string[] = [];
  let confidence = 0.8;

  // Parse the policy text to extract rules
  const lines = policyText.split('\n').map((l) => l.trim()).filter((l) => l);

  // Extract thresholds
  const sizePatterns = [
    { pattern: /(\d+)\+?\s*employees?/gi, type: 'headcount' },
    { pattern: /large.*?(\d+)/gi, type: 'large' },
    { pattern: /small.*?(\d+)/gi, type: 'small' },
    { pattern: /mid-?size.*?(\d+)/gi, type: 'mid' },
  ];

  const foundThresholds = new Map<string, number>();

  for (const { pattern, type } of sizePatterns) {
    const matches = policyText.matchAll(pattern);
    for (const match of matches) {
      const value = parseInt(match[1]);
      if (!isNaN(value)) {
        foundThresholds.set(type, value);
      }
    }
  }

  // Create thresholds
  if (foundThresholds.has('large') || foundThresholds.get('headcount')) {
    ipr.thresholds.push({
      name: 'large_company',
      field: 'headcount',
      value: foundThresholds.get('large') || foundThresholds.get('headcount') || 500,
      unit: 'employees',
      comparison: 'gte',
    });
  }

  if (foundThresholds.has('small')) {
    ipr.thresholds.push({
      name: 'small_company',
      field: 'headcount',
      value: foundThresholds.get('small') || 100,
      unit: 'employees',
      comparison: 'lt',
    });
  }

  // Extract target roles from policy text
  const rolePatterns = [
    { pattern: /prioritize[:\s]+([^.]+)/gi, priority: 1 },
    { pattern: /focus on[:\s]+([^.]+)/gi, priority: 1 },
    { pattern: /target[:\s]+([^.]+)/gi, priority: 1 },
    { pattern: /fall\s*back[^:]*:[^.]+([^.]+)/gi, priority: 3 },
  ];

  // Common role keywords to extract
  const roleKeywords = [
    'HR Head', 'Chief People Officer', 'CPO', 'CHRO',
    'HR Director', 'HR Manager', 'Human Resources',
    'Payroll Manager', 'Payroll Director', 'Benefits Manager',
    'Finance Manager', 'Finance Director', 'CFO',
    'Founder', 'CEO', 'COO', 'Managing Director',
    'Office Manager', 'Operations Manager',
  ];

  // Extract roles based on company size context
  let currentSizeContext: 'large' | 'mid' | 'small' | null = null;
  const rolesBySize: Record<string, string[]> = { large: [], mid: [], small: [], default: [] };

  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Detect size context
    if (lowerLine.includes('large') || lowerLine.includes('500+')) {
      currentSizeContext = 'large';
    } else if (lowerLine.includes('mid-size') || lowerLine.includes('mid size') || lowerLine.includes('100-500')) {
      currentSizeContext = 'mid';
    } else if (lowerLine.includes('small') || lowerLine.includes('<100')) {
      currentSizeContext = 'small';
    }

    // Extract roles from this line
    for (const roleKeyword of roleKeywords) {
      if (line.toLowerCase().includes(roleKeyword.toLowerCase())) {
        const targetArray = currentSizeContext ? rolesBySize[currentSizeContext] : rolesBySize.default;
        if (!targetArray.includes(roleKeyword)) {
          targetArray.push(roleKeyword);
        }
      }
    }
  }

  // Build target_roles from extracted data
  if (rolesBySize.large.length > 0) {
    ipr.target_roles.push({
      company_size_range: { min: 500, max: null },
      titles: rolesBySize.large,
      priority: 1,
      reason: 'Large company - operational contacts for payroll/benefits',
    });
  }

  if (rolesBySize.mid.length > 0) {
    ipr.target_roles.push({
      company_size_range: { min: 100, max: 500 },
      titles: rolesBySize.mid,
      priority: 1,
      reason: 'Mid-size company - HR leadership owns decisions',
    });
  }

  if (rolesBySize.small.length > 0) {
    ipr.target_roles.push({
      company_size_range: { min: null, max: 100 },
      titles: rolesBySize.small,
      priority: 1,
      reason: 'Small company - direct access to decision makers',
    });
  }

  // Add default fallback if we found default roles
  if (rolesBySize.default.length > 0) {
    ipr.fallback_behavior.default_roles = rolesBySize.default;
  }

  // Extract skip rules
  const skipPatterns = [
    /skip[^.]*government/gi,
    /exclude[^.]*government/gi,
    /skip[^.]*(?:if|when)[^.]+/gi,
  ];

  for (const pattern of skipPatterns) {
    const matches = policyText.matchAll(pattern);
    for (const match of matches) {
      const skipText = match[0];
      if (skipText.toLowerCase().includes('government')) {
        ipr.skip_rules.push({
          condition: {
            field: 'company_type',
            operator: 'eq',
            value: 'government',
            description: 'Government entities',
          },
          reason: 'Government entities excluded per policy',
        });
      }
    }
  }

  // Extract uncertainty handling
  if (policyText.toLowerCase().includes('unclear') || policyText.toLowerCase().includes('needs verification')) {
    ipr.uncertainty_handling.when_geography_unclear = 'flag_for_review';
    ipr.interpretation_notes = ipr.interpretation_notes || [];
    ipr.interpretation_notes.push('Policy mentions handling unclear data - set to flag for review');
  }

  // Calculate confidence based on extraction quality
  if (ipr.target_roles.length === 0) {
    warnings.push('No target roles could be extracted. Please add role specifications.');
    confidence = 0.3;
  } else if (ipr.target_roles.length < 2) {
    warnings.push('Only one target role rule found. Consider adding rules for different company sizes.');
    confidence = 0.6;
  }

  if (ipr.thresholds.length === 0) {
    warnings.push('No size thresholds extracted. Using defaults (small: <100, mid: 100-500, large: 500+).');
    // Add default thresholds
    ipr.thresholds = [
      { name: 'small_company', field: 'headcount', value: 100, unit: 'employees', comparison: 'lt' },
      { name: 'large_company', field: 'headcount', value: 500, unit: 'employees', comparison: 'gte' },
    ];
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
