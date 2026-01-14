/**
 * Policy Interpretation API - S398 (v2: DSL Compiler)
 *
 * POST /api/superadmin/controlplane/sub-verticals/[id]/enrichment-policy/interpret
 *   - Detects if policy is DSL format or legacy free text
 *   - DSL format: Uses DETERMINISTIC compiler (no LLM, no regression)
 *   - Legacy format: Uses LLM interpretation (deprecated, will be removed)
 *   - Creates a new policy version with status 'pending_approval'
 *   - Returns the interpreted IPR for review
 *
 * ARCHITECTURE (2030-STABLE):
 * - Policy DSL → Deterministic Compiler → Validated IPR JSON
 * - NO LLM in critical path for DSL format
 * - LLM only for legacy migration assistance
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
import {
  compilePolicyDSL,
  isDSLFormat,
  suggestDSLFromFreeText,
  IPR as DSL_IPR,
  DSL_COMPILER_VERSION,
} from '@/lib/enrichment/policy-dsl';

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

// =============================================================================
// DSL → LEGACY IPR CONVERTER
// =============================================================================

/**
 * Convert DSL IPR to legacy IntermediatePolicyRepresentation format
 * This maintains compatibility with existing approval/runtime code
 */
function convertDSLToLegacyIPR(dslIPR: DSL_IPR): IntermediatePolicyRepresentation {
  const ipr = createEmptyIPR();

  ipr.generated_at = dslIPR.metadata.compiled_at;
  ipr.generated_from_text_hash = dslIPR.metadata.policy_hash;
  ipr.interpretation_notes = [
    'COMPILED FROM DSL: Deterministic compilation, no LLM',
    `Source format: ${dslIPR.metadata.source_format}`,
    `Version: ${dslIPR.version}`,
  ];

  // Convert target_roles with tier structure
  // PRIMARY (Tier 1) - applies_to_all: true
  if (dslIPR.target_roles.primary.length > 0) {
    ipr.target_roles.push({
      applies_to_all: true,
      titles: dslIPR.target_roles.primary,
      priority: 1,
      reason: 'Tier 1 PRIMARY roles: Always prioritize these roles first per DSL policy.',
    });
    ipr.interpretation_notes.push(`PRIMARY: ${dslIPR.target_roles.primary.length} roles`);
  }

  // SECONDARY (Tier 2) - conditional
  if (dslIPR.target_roles.secondary.length > 0) {
    ipr.target_roles.push({
      conditions: [{
        field: 'tier_2_context',
        operator: 'eq',
        value: true,
        description: 'Secondary roles: Try when primary roles yield insufficient results',
      }],
      titles: dslIPR.target_roles.secondary,
      priority: 2,
      reason: 'Tier 2 SECONDARY roles: Conditional targeting when primary roles insufficient.',
    });
    ipr.interpretation_notes.push(`SECONDARY: ${dslIPR.target_roles.secondary.length} roles`);
  }

  // FALLBACK (Tier 3) - only when primary not found
  if (dslIPR.target_roles.fallback.length > 0) {
    ipr.target_roles.push({
      conditions: [{
        field: 'primary_roles_found',
        operator: 'eq',
        value: false,
        description: 'Fallback: Only when finance/primary roles do not exist in company',
      }],
      titles: dslIPR.target_roles.fallback,
      priority: 3,
      reason: 'Tier 3 FALLBACK roles: Only target when primary roles not available.',
    });
    ipr.interpretation_notes.push(`FALLBACK: ${dslIPR.target_roles.fallback.length} roles`);
  }

  // EXCLUSIONS → skip_rules
  if (dslIPR.skip_rules.exclusions.length > 0) {
    ipr.skip_rules.push({
      condition: {
        field: 'job_title',
        operator: 'in',
        value: dslIPR.skip_rules.exclusions,
        description: 'Executive/C-level titles excluded per DSL policy',
      },
      reason: 'These roles are explicitly excluded from enrichment targets per DSL policy.',
    });
    ipr.interpretation_notes.push(`EXCLUDE: ${dslIPR.skip_rules.exclusions.length} exclusions`);
  }

  // Total summary
  const totalRoles =
    dslIPR.target_roles.primary.length +
    dslIPR.target_roles.secondary.length +
    dslIPR.target_roles.fallback.length;
  ipr.interpretation_notes.push(`Total: ${totalRoles} target roles, ${dslIPR.skip_rules.exclusions.length} exclusions`);

  return ipr;
}

// =============================================================================
// DSL COMPILER ENTRY POINT
// =============================================================================

/**
 * Compile policy using deterministic DSL compiler
 * Returns legacy IPR format for compatibility
 */
function compilePolicyWithDSL(
  policyText: string
): {
  ipr: IntermediatePolicyRepresentation;
  confidence: number;
  warnings: string[];
  isDSL: true;
} {
  console.log('[PolicyCompiler] Using DETERMINISTIC DSL compiler');

  const result = compilePolicyDSL(policyText);

  if (!result.success) {
    // Compilation failed - return errors as warnings with low confidence
    const ipr = createEmptyIPR();
    ipr.interpretation_notes = [
      'DSL COMPILATION FAILED',
      ...result.errors.map(e => `ERROR (line ${e.line}): ${e.message}`),
    ];

    return {
      ipr,
      confidence: 0.0,
      warnings: result.errors.map(e => `[${e.code}] Line ${e.line}: ${e.message}`),
      isDSL: true,
    };
  }

  // Success - convert to legacy format
  const legacyIPR = convertDSLToLegacyIPR(result.ipr!);

  return {
    ipr: legacyIPR,
    confidence: 1.0, // DSL compilation is deterministic - always 100% confidence
    warnings: result.warnings.map(w => `[${w.code}] Line ${w.line}: ${w.message}`),
    isDSL: true,
  };
}

/**
 * STRICT ENUM PARSING MODE - Policy Interpreter v3
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
 *    - applies_to_all: true (ONLY for Tier 1 PRIMARY roles)
 *    - company_size_range: { min, max } (size-based)
 *    - conditions: [] (signal/condition-based for SECONDARY/FALLBACK)
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
 *
 * 5. TIER-BASED HIERARCHY PRESERVATION (v3)
 *    - TIER 1 (PRIMARY): applies_to_all: true, priority: 1
 *    - TIER 2 (SECONDARY): conditions-based, priority: 2
 *    - TIER 3 (FALLBACK): fallback conditions, priority: 3
 *    - EXCLUSIONS: go to skip_rules ONLY, NEVER target_roles
 *
 * 6. EXECUTIVES NEVER IN TARGET_ROLES
 *    - MD, CEO, Promoter, Board Member, CFO → skip_rules ONLY
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

  const lowerPolicy = policyText.toLowerCase();

  // ============================================================
  // STEP 1: DETECT POLICY STRUCTURE TYPE
  // ============================================================
  // Two modes: TIER-BASED (Primary/Secondary/Fallback) or SIZE-BASED (Large/Mid/Small)
  const isTierBasedPolicy =
    lowerPolicy.includes('primary') ||
    lowerPolicy.includes('secondary') ||
    lowerPolicy.includes('tier 1') ||
    lowerPolicy.includes('tier 2') ||
    lowerPolicy.includes('tier 3') ||
    (lowerPolicy.includes('fallback') && !lowerPolicy.includes('small'));

  const isStrictMode =
    lowerPolicy.includes('do not introduce roles outside') ||
    lowerPolicy.includes('strict rule') ||
    lowerPolicy.includes('only roles') ||
    lowerPolicy.includes('strict enum');

  if (isStrictMode) {
    ipr.interpretation_notes.push('STRICT MODE: Only explicitly listed roles will be extracted');
  }

  if (isTierBasedPolicy) {
    ipr.interpretation_notes.push('TIER-BASED POLICY: Detected Primary/Secondary/Fallback structure');
    return interpretTierBasedPolicy(policyText, ipr, warnings, confidence);
  }

  // ============================================================
  // SIZE-BASED POLICY PARSING (legacy mode)
  // ============================================================
  ipr.interpretation_notes.push('SIZE-BASED POLICY: Detected Large/Mid/Small structure');
  return interpretSizeBasedPolicy(policyText, lowerPolicy, ipr, warnings, confidence, isStrictMode);
}

/**
 * TIER-BASED POLICY INTERPRETER (v3)
 *
 * Handles policies structured as:
 * - TIER 1 / PRIMARY: Always try first (applies_to_all: true)
 * - TIER 2 / SECONDARY: Conditional, NOT applies_to_all
 * - TIER 3 / FALLBACK: Only when primary not found
 * - EXCLUSIONS: Go to skip_rules ONLY
 */
function interpretTierBasedPolicy(
  policyText: string,
  ipr: IntermediatePolicyRepresentation,
  warnings: string[],
  confidence: number
): { ipr: IntermediatePolicyRepresentation; confidence: number; warnings: string[] } {
  const lowerPolicy = policyText.toLowerCase();

  // ============================================================
  // STEP 2: EXTRACT EXCLUSIONS FIRST (CRITICAL)
  // ============================================================
  // Exclusions MUST go to skip_rules, NEVER to target_roles
  const exclusionPatterns = [
    /exclusion[s]?[:\s]*\n?([\s\S]*?)(?=\n\n|primary|secondary|fallback|tier|$)/i,
    /avoid[:\s]*([\s\S]*?)(?=\n\n|primary|secondary|fallback|tier|$)/i,
    /do not target[:\s]*([\s\S]*?)(?=\n\n|primary|secondary|fallback|tier|$)/i,
    /skip[:\s]*([\s\S]*?)(?=\n\n|primary|secondary|fallback|tier|$)/i,
  ];

  // Known executive/C-level titles to ALWAYS exclude from target_roles
  const knownExcludedTitles = [
    'Managing Director',
    'CEO',
    'Chief Executive Officer',
    'Promoter',
    'Board Member',
    'Group CFO',
    'Corporate CFO',
    'Chairman',
    'Vice Chairman',
    'Founder',
    'Co-Founder',
    'President',
    'COO',
    'Chief Operating Officer',
    'CTO',
    'Chief Technology Officer',
  ];

  // Extract excluded roles from policy text
  const extractedExclusions: string[] = [];
  for (const pattern of exclusionPatterns) {
    const match = policyText.match(pattern);
    if (match && match[1]) {
      const exclusionBlock = match[1];
      const roles = extractRolesFromBlock(exclusionBlock, 'exclusion');
      exclusionBlock.split('\n').forEach(line => {
        const trimmed = line.replace(/^[-•*]\s*/, '').trim();
        if (trimmed && !trimmed.toLowerCase().startsWith('they') && trimmed.length < 80) {
          // Check if this looks like a role name
          const hasRoleWord = /Manager|Director|Head|Lead|Officer|CEO|CFO|COO|CTO|MD|Promoter|Chairman|Board|Founder|President/i.test(trimmed);
          if (hasRoleWord && !extractedExclusions.includes(trimmed)) {
            extractedExclusions.push(trimmed);
          }
        }
      });
      roles.forEach(r => {
        if (!extractedExclusions.includes(r)) {
          extractedExclusions.push(r);
        }
      });
    }
  }

  // Always add known exclusions if they appear anywhere in policy
  for (const knownTitle of knownExcludedTitles) {
    if (policyText.includes(knownTitle) && !extractedExclusions.includes(knownTitle)) {
      // Check if this title appears in an exclusion context
      const escapedTitle = knownTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const inExclusionContext = new RegExp(`(exclusion|avoid|skip|do not|never)[^.]*${escapedTitle}`, 'i').test(policyText);
      if (inExclusionContext) {
        extractedExclusions.push(knownTitle);
      }
    }
  }

  // Add exclusions to skip_rules
  if (extractedExclusions.length > 0) {
    ipr.skip_rules.push({
      condition: {
        field: 'job_title',
        operator: 'in',
        value: extractedExclusions,
        description: 'Executive/C-level titles excluded per policy',
      },
      reason: 'These roles are explicitly excluded from enrichment targets per policy.',
    });
    ipr.interpretation_notes = ipr.interpretation_notes || [];
    ipr.interpretation_notes.push(`Extracted ${extractedExclusions.length} excluded roles → skip_rules`);
  }

  // ============================================================
  // STEP 3: PARSE TIER SECTIONS
  // ============================================================
  interface TierBlock {
    tier: 1 | 2 | 3;
    name: 'PRIMARY' | 'SECONDARY' | 'FALLBACK';
    roles: string[];
    rawText: string;
  }

  const tiers: TierBlock[] = [];

  // Pattern to match tier sections
  // IMPORTANT: Use [^\n]* to skip the rest of the header line,
  // then \n to require a newline before capturing content.
  // This handles markdown headers like "### TIER 1 — PRIMARY (always try first)"

  // Tier 1 / PRIMARY patterns
  const primaryPatterns = [
    /(?:tier\s*1|primary)[^\n]*\n([\s\S]*?)(?=###|tier\s*2|secondary|fallback|exclusion|$)/i,
    /(?:primary\s+roles?)[^\n]*\n([\s\S]*?)(?=###|secondary|fallback|exclusion|$)/i,
  ];

  // Tier 2 / SECONDARY patterns
  const secondaryPatterns = [
    /(?:tier\s*2|secondary)[^\n]*\n([\s\S]*?)(?=###|tier\s*3|fallback|exclusion|$)/i,
    /(?:secondary\s+roles?)[^\n]*\n([\s\S]*?)(?=###|fallback|exclusion|$)/i,
  ];

  // Tier 3 / FALLBACK patterns
  const fallbackPatterns = [
    /(?:tier\s*3|fallback)[^\n]*\n([\s\S]*?)(?=###|exclusion|$)/i,
    /(?:fallback\s+roles?)[^\n]*\n([\s\S]*?)(?=###|exclusion|$)/i,
    /(?:operational\s+fallback)[^\n]*\n([\s\S]*?)(?=###|exclusion|$)/i,
  ];

  // Extract PRIMARY (Tier 1)
  for (const pattern of primaryPatterns) {
    const match = policyText.match(pattern);
    if (match && match[1]) {
      const roles = extractRolesFromBlock(match[1], 'primary');
      if (roles.length > 0) {
        tiers.push({ tier: 1, name: 'PRIMARY', roles, rawText: match[1] });
        break;
      }
    }
  }

  // Extract SECONDARY (Tier 2)
  for (const pattern of secondaryPatterns) {
    const match = policyText.match(pattern);
    if (match && match[1]) {
      const roles = extractRolesFromBlock(match[1], 'secondary');
      if (roles.length > 0) {
        tiers.push({ tier: 2, name: 'SECONDARY', roles, rawText: match[1] });
        break;
      }
    }
  }

  // Extract FALLBACK (Tier 3)
  for (const pattern of fallbackPatterns) {
    const match = policyText.match(pattern);
    if (match && match[1]) {
      const roles = extractRolesFromBlock(match[1], 'fallback');
      if (roles.length > 0) {
        tiers.push({ tier: 3, name: 'FALLBACK', roles, rawText: match[1] });
        break;
      }
    }
  }

  // ============================================================
  // STEP 4: BUILD TARGET_ROLES WITH CORRECT SCOPE PER TIER
  // ============================================================
  // CRITICAL: applies_to_all ONLY for Tier 1

  // Filter out any excluded roles from all tiers
  const excludedSet = new Set(extractedExclusions.map(e => e.toLowerCase()));

  for (const tier of tiers) {
    // Filter out excluded roles
    const cleanRoles = tier.roles.filter(role => {
      const lowerRole = role.toLowerCase();
      // Check against exclusion list
      if (excludedSet.has(lowerRole)) {
        warnings.push(`Filtered excluded role "${role}" from ${tier.name} tier`);
        return false;
      }
      // Check for known executive patterns
      if (/\b(ceo|cfo|coo|cto|managing\s+director|promoter|chairman|board\s+member|founder|president)\b/i.test(role)) {
        warnings.push(`Filtered executive role "${role}" from ${tier.name} tier`);
        return false;
      }
      return true;
    });

    if (cleanRoles.length === 0) continue;

    // Build target_roles entry based on tier
    const entry: IPRTargetRole = {
      titles: cleanRoles,
      priority: tier.tier,
      reason: '',
    };

    switch (tier.tier) {
      case 1: // PRIMARY - applies_to_all: true
        entry.applies_to_all = true;
        entry.reason = `Tier 1 PRIMARY roles: Always prioritize these roles first per policy.`;
        break;

      case 2: // SECONDARY - conditional, NOT applies_to_all
        entry.conditions = [
          {
            field: 'tier_2_context',
            operator: 'eq',
            value: true,
            description: 'Secondary roles: Try when primary roles yield insufficient results',
          },
        ];
        entry.reason = `Tier 2 SECONDARY roles: Conditional targeting when primary roles insufficient.`;
        break;

      case 3: // FALLBACK - conditional, only when primary not found
        entry.conditions = [
          {
            field: 'primary_roles_found',
            operator: 'eq',
            value: false,
            description: 'Fallback: Only when finance/primary roles do not exist in company',
          },
        ];
        entry.reason = `Tier 3 FALLBACK roles: Only target when primary roles not available.`;
        break;
    }

    ipr.target_roles.push(entry);
  }

  // ============================================================
  // STEP 5: VALIDATION
  // ============================================================
  // Verify no executives leaked into target_roles
  const executivePattern = /\b(ceo|cfo|coo|cto|managing\s*director|promoter|chairman|board|founder|president)\b/i;
  for (const role of ipr.target_roles) {
    for (const title of role.titles) {
      if (executivePattern.test(title)) {
        warnings.push(`CRITICAL: Executive role "${title}" found in target_roles. This should be in skip_rules.`);
        confidence -= 0.3;
      }
    }
  }

  // Verify tier hierarchy is preserved
  const hasPrimary = ipr.target_roles.some(r => r.applies_to_all === true);
  const hasSecondary = ipr.target_roles.some(r => r.conditions?.some(c => c.field === 'tier_2_context'));
  const hasFallback = ipr.target_roles.some(r => r.conditions?.some(c => c.field === 'primary_roles_found'));

  if (!hasPrimary && tiers.some(t => t.tier === 1)) {
    warnings.push('PRIMARY tier detected in policy but not extracted correctly');
    confidence -= 0.2;
  }

  // Check for applies_to_all misuse
  const appliesAllCount = ipr.target_roles.filter(r => r.applies_to_all === true).length;
  if (appliesAllCount > 1) {
    warnings.push(`WARNING: applies_to_all=true on ${appliesAllCount} blocks. Should only be on PRIMARY tier.`);
    confidence -= 0.1;
  }

  // Summary
  const totalRoles = new Set(ipr.target_roles.flatMap(r => r.titles)).size;
  ipr.interpretation_notes = ipr.interpretation_notes || [];
  ipr.interpretation_notes.push(`Tier 1 (PRIMARY): ${tiers.find(t => t.tier === 1)?.roles.length || 0} roles, applies_to_all=true`);
  ipr.interpretation_notes.push(`Tier 2 (SECONDARY): ${tiers.find(t => t.tier === 2)?.roles.length || 0} roles, conditional`);
  ipr.interpretation_notes.push(`Tier 3 (FALLBACK): ${tiers.find(t => t.tier === 3)?.roles.length || 0} roles, fallback condition`);
  ipr.interpretation_notes.push(`Skip Rules: ${ipr.skip_rules.length} exclusion rules`);
  ipr.interpretation_notes.push(`Total: ${totalRoles} unique target roles across ${ipr.target_roles.length} scoped blocks`);

  return { ipr, confidence: Math.max(0.1, confidence), warnings };
}

/**
 * Extract roles from a policy block (tier or section)
 * STRICT: Only extract explicit role titles, no instructional text
 */
function extractRolesFromBlock(text: string, blockType: string): string[] {
  const roles: string[] = [];

  // Known role-ending words
  const roleWords = ['Manager', 'Director', 'Head', 'Lead', 'Specialist', 'Officer',
    'Coordinator', 'Administrator', 'Accountant', 'Controller', 'Analyst'];

  // Lines to skip (instructional, not roles)
  const skipPatterns = [
    /^(prioritize|focus|target|use|avoid|if |when |for |unless)/i,
    /^\(.*\)$/, // Pure parenthetical
    /^they\s/i, // Sentences starting with "they"
    /applies_to_all/i, // Meta-instruction
    /try first/i, // Instruction
    /only if/i, // Conditional instruction
  ];

  const lines = text.split('\n');
  for (const line of lines) {
    // Clean line: remove bullets, dashes, asterisks, leading numbers
    let trimmed = line.replace(/^[-•*]\s*/, '').replace(/^\d+[.)]\s*/, '').trim();
    if (!trimmed) continue;

    // Skip instructional lines
    if (skipPatterns.some(p => p.test(trimmed))) continue;

    // Skip very long lines (likely prose)
    if (trimmed.length > 100) continue;

    // Check if line contains a role word
    const hasRoleWord = roleWords.some(w => trimmed.includes(w));
    if (!hasRoleWord) continue;

    // Clean up the role title
    // Remove trailing context like "(Infrastructure / EPC projects only)"
    const contextMatch = trimmed.match(/^([^(]+)\s*\([^)]*projects?[^)]*\)$/i);
    if (contextMatch) {
      trimmed = contextMatch[1].trim();
    }

    // Remove trailing context like "– when applicable" or "– only for X"
    // BUT preserve role qualifiers like "Manager – Finance & Accounts"
    // Only strip if the text after dash looks like instructional context
    const dashContext = trimmed.match(/^([^–]+)\s*–\s*(.+)$/);
    if (dashContext) {
      const beforeDash = dashContext[1].trim();
      const afterDash = dashContext[2].trim();
      // Only strip if afterDash is instructional (contains "when", "only", "if", "for", "applicable")
      // Keep it if afterDash looks like a role qualifier (Finance, Accounts, etc.)
      const isInstructional = /\b(when|only|if|for|applicable|optional|required)\b/i.test(afterDash);
      const isRoleQualifier = roleWords.some(w => afterDash.includes(w)) ||
                             /\b(Finance|Accounts|HR|IT|Sales|Marketing|Operations|Treasury|Payroll)\b/i.test(afterDash);
      if (isInstructional && !isRoleQualifier) {
        trimmed = beforeDash;
      }
      // Otherwise keep the full title including the dash
    }

    // Validate it looks like a role title (starts with capital, contains role word)
    if (/^[A-Z][a-zA-Z&\s\-–\/()]+$/.test(trimmed) && hasRoleWord) {
      // Handle slash-separated variants as single role with aliases
      // E.g., "Finance Manager / Accounts Manager" stays as one entry
      if (!roles.includes(trimmed)) {
        roles.push(trimmed);
      }
    }
  }

  return roles;
}

/**
 * SIZE-BASED POLICY INTERPRETER (legacy)
 * Handles policies structured by company size (Large/Mid/Small)
 */
function interpretSizeBasedPolicy(
  policyText: string,
  lowerPolicy: string,
  ipr: IntermediatePolicyRepresentation,
  warnings: string[],
  confidence: number,
  isStrictMode: boolean
): { ipr: IntermediatePolicyRepresentation; confidence: number; warnings: string[] } {
  // ============================================================
  // STEP 2: PARSE POLICY INTO LOGICAL BLOCKS
  // ============================================================
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
  // STEP 3: EXTRACT ROLES (STRICT WHITELIST)
  // ============================================================
  const extractRolesStrict = (text: string): string[] => {
    const roles: string[] = [];

    const instructionalPrefixes = [
      'prioritize', 'focus on', 'use ', 'avoid', 'target', 'if ', 'when ',
      'for large', 'for mid', 'for small', 'unless', 'primarily', 'goal:'
    ];

    const knownRoleWords = ['Manager', 'Director', 'Head', 'Lead', 'Specialist',
      'Administrator', 'Coordinator', 'Officer', 'Generalist', 'Admin'];

    const lines = text.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      const lowerLine = trimmedLine.toLowerCase();
      if (instructionalPrefixes.some(prefix => lowerLine.startsWith(prefix))) {
        continue;
      }

      if (/\b(is|are|should|will|can|must|may|need|the|for|with|from|into)\b/i.test(trimmedLine) &&
          trimmedLine.length > 60) {
        continue;
      }

      if (/compan(y|ies).*:$/i.test(trimmedLine)) {
        continue;
      }

      const hasRoleWord = knownRoleWords.some(w => trimmedLine.includes(w));
      if (!hasRoleWord) continue;

      const rolePattern = /^[A-Z][a-zA-Z&\s()]+(?:\s*\/\s*[A-Z][a-zA-Z&\s()]+)*$/;

      if (rolePattern.test(trimmedLine)) {
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
  let currentSizeContext: 'all' | 'large' | 'mid' | 'small' | null = null;
  let isFallbackContext = false;

  for (const blockText of blocks) {
    const lowerBlock = blockText.toLowerCase();

    let scopeType: PolicyBlock['scopeType'] = 'all';
    let sizeRange: { min: number | null; max: number | null } | null = null;
    let appliesTo: PolicyBlock['appliesTo'] = 'all';
    let isExclusion = false;
    let isFallback = false;

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
      currentSizeContext = null;
      isFallbackContext = false;
    } else if (lowerBlock.includes('strict rule') || lowerBlock.includes('do not introduce')) {
      scopeType = 'constraint';
      isExclusion = true;
      currentSizeContext = null;
      isFallbackContext = false;
    }

    if (lowerBlock.includes('fallback') || lowerBlock.includes('if none of')) {
      isFallbackContext = true;
    }

    const roles = extractRolesStrict(blockText);
    const isRoleOnlyBlock = roles.length > 0 &&
      !lowerBlock.includes('compan') &&
      !lowerBlock.includes('uncertainty') &&
      !lowerBlock.includes('strict') &&
      !lowerBlock.includes('primary roles') &&
      !lowerBlock.includes('all companies');

    if (isRoleOnlyBlock) {
      if (isFallbackContext && currentSizeContext === 'small') {
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
    }

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
    if (block.isExclusion && !block.isFallback) continue;

    const newRoles = block.roles.filter(r => !processedRoles.has(r));
    if (newRoles.length === 0) continue;

    newRoles.forEach(r => processedRoles.add(r));

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

    if (block.appliesTo === 'all') {
      (entry as { applies_to_all?: boolean }).applies_to_all = true;
      entry.reason = 'Primary roles for ALL companies per policy.';
    } else if (block.appliesTo === 'size' && block.sizeRange) {
      entry.company_size_range = block.sizeRange;
      const sizeDesc = block.scopeType === 'large' ? 'Large (500+)' :
                       block.scopeType === 'mid' ? 'Mid-size (100-499)' :
                       block.scopeType === 'small' ? 'Small (<100)' : 'Size-based';

      if (block.isFallback) {
        entry.reason = `Fallback operational contacts for ${sizeDesc} companies when primary roles not found.`;
        entry.priority = 2;
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
        entry.priority = 2;
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
  // STEP 6: EXTRACT THRESHOLDS
  // ============================================================
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
  if (lowerPolicy.includes('employee count is unknown')) {
    ipr.interpretation_notes = ipr.interpretation_notes || [];
    if (lowerPolicy.includes('proceed') || lowerPolicy.includes('continue')) {
      ipr.uncertainty_handling.when_size_unknown = 'flag_for_review';
      ipr.interpretation_notes.push('Policy: proceed with enrichment when size unknown, flag for review');
    }
    if (lowerPolicy.includes('low confidence')) {
      ipr.interpretation_notes.push('Policy: mark results as low confidence when size unknown');
    }
  }

  // ============================================================
  // STEP 8: EXTRACT SKIP RULES
  // ============================================================
  if (lowerPolicy.includes('avoid executive')) {
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

  ipr.interpretation_notes = ipr.interpretation_notes || [];
  if (lowerPolicy.includes('do not introduce roles outside')) {
    ipr.interpretation_notes.push('STRICT CONSTRAINT: Only explicitly listed roles are valid');
  }

  // ============================================================
  // STEP 9: VALIDATION
  // ============================================================
  for (const role of ipr.target_roles) {
    const hasValidScope = role.applies_to_all ||
                          (role.company_size_range && (role.company_size_range.min !== null || role.company_size_range.max !== null)) ||
                          (role.conditions && role.conditions.length > 0);

    if (!hasValidScope) {
      warnings.push(`INVALID: Role block with null scope detected. Every block must have explicit scope.`);
      confidence -= 0.3;
    }
  }

  if (ipr.target_roles.length === 0) {
    warnings.push('No role blocks extracted. Check policy format.');
    confidence = 0.2;
  }

  const totalRoles = new Set(ipr.target_roles.flatMap(r => r.titles)).size;
  ipr.interpretation_notes.push(`Extracted ${totalRoles} unique roles across ${ipr.target_roles.length} scoped blocks`);
  ipr.interpretation_notes.push(`Found ${ipr.thresholds.length} explicit thresholds`);
  if (isStrictMode) {
    ipr.interpretation_notes.push('STRICT MODE ENFORCED: No semantic expansion');
  }

  return { ipr, confidence: Math.max(0.1, confidence), warnings };
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

    // ================================================================
    // POLICY COMPILATION: DSL (deterministic) vs LLM (legacy)
    // ================================================================
    const policyText = subVertical.enrichment_policy_text;
    const policyIsDSL = isDSLFormat(policyText);

    let ipr: IntermediatePolicyRepresentation;
    let confidence: number;
    let warnings: string[];
    let interpretedBy: string;
    let suggestedDSL: string | undefined;

    if (policyIsDSL) {
      // DSL FORMAT: Use deterministic compiler (no LLM, no regression)
      console.log('[PolicyCompiler] Detected DSL format - using deterministic compiler');
      const dslResult = compilePolicyWithDSL(policyText);
      ipr = dslResult.ipr;
      confidence = dslResult.confidence;
      warnings = dslResult.warnings;
      interpretedBy = 'dsl_compiler_v2';
    } else {
      // LEGACY FORMAT: Use LLM interpretation (deprecated)
      console.log('[PolicyCompiler] Detected legacy free text - using LLM interpretation');
      console.log('[PolicyCompiler] WARNING: LLM interpretation is deprecated. Convert to DSL format.');

      // Generate DSL suggestion for migration
      suggestedDSL = suggestDSLFromFreeText(policyText);

      const llmResult = await interpretPolicyWithLLM(
        policyText,
        {
          vertical: subVertical.vertical_key,
          subVertical: subVertical.key,
          entityType: subVertical.primary_entity_type,
        }
      );
      ipr = llmResult.ipr;
      confidence = llmResult.confidence;
      warnings = [
        'DEPRECATED: Free-text policies use LLM interpretation which may regress.',
        'RECOMMENDATION: Convert to DSL format for deterministic compilation.',
        ...llmResult.warnings,
      ];
      interpretedBy = 'llm_interpreter_v3';
    }

    // Compute policy hash for audit trail
    const policyHash = hashPolicyText(policyText);

    // Create new policy version with interpretation
    // Include DSL audit artifact fields for Phase 1 Approval Contract
    const policyVersion = await queryOne<{
      id: string;
      version: number;
      status: string;
      created_at: string;
    }>(
      `INSERT INTO enrichment_policy_versions (
         sub_vertical_id, version, policy_text, interpreted_ipr,
         interpretation_confidence, interpretation_warnings,
         interpreted_at, interpreted_by, status, created_by,
         source_format, dsl_text, compiler_version, policy_hash, runtime_binding
       ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, 'pending_approval', $8, $9, $10, $11, $12, $13)
       RETURNING id, version, status, created_at`,
      [
        id,
        newVersion,
        policyText,
        JSON.stringify(ipr),
        confidence,
        JSON.stringify(warnings),
        interpretedBy, // 'dsl_compiler_v2' or 'llm_interpreter_v3'
        actorUser,
        // DSL Audit Artifact Fields (Phase 1 Gate)
        policyIsDSL ? 'dsl' : 'legacy_free_text',           // source_format
        policyIsDSL ? policyText : null,                    // dsl_text (only for DSL)
        policyIsDSL ? DSL_COMPILER_VERSION : null,          // compiler_version
        policyHash,                                          // policy_hash
        policyIsDSL ? 'compiled_ipr_only' : 'interpreter_allowed', // runtime_binding
      ]
    );

    // Audit log
    await logControlPlaneAudit({
      actorUser,
      action: 'interpret_policy',
      targetType: 'enrichment_policy_version',
      targetId: policyVersion?.id || id,
      requestJson: {
        policy_text_length: policyText.length,
        format: policyIsDSL ? 'dsl' : 'legacy_free_text',
      },
      resultJson: {
        version: newVersion,
        confidence,
        warnings_count: warnings.length,
        target_roles_count: ipr.target_roles.length,
        compiler: interpretedBy,
      },
      success: true,
    });

    // Build response
    const responseData: Record<string, unknown> = {
      version_id: policyVersion?.id,
      version: newVersion,
      status: 'pending_approval',
      policy_text: policyText,
      policy_format: policyIsDSL ? 'dsl' : 'legacy_free_text',
      interpreted_ipr: ipr,
      interpretation_confidence: confidence,
      interpretation_warnings: warnings,
      interpreted_by: interpretedBy,
      created_at: policyVersion?.created_at,
    };

    // Include DSL suggestion for legacy policies
    if (suggestedDSL) {
      responseData.suggested_dsl = suggestedDSL;
      responseData.migration_hint = 'Replace your policy text with the suggested_dsl to use deterministic compilation.';
    }

    const message = policyIsDSL
      ? (confidence === 1.0
          ? 'Policy compiled successfully with DSL compiler (deterministic, no LLM).'
          : `DSL compilation failed with ${warnings.length} error(s). Fix the errors and try again.`)
      : `Policy interpreted with LLM (deprecated). ${warnings.length} warning(s). Consider converting to DSL format.`;

    return Response.json({
      success: confidence > 0,
      data: responseData,
      message,
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
