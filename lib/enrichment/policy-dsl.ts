/**
 * POLICY DSL COMPILER
 *
 * Deterministic parser for Enrichment Policy DSL.
 * NO LLM in the critical path. 100% deterministic compilation.
 *
 * DSL Format:
 * ```
 * SCOPE:
 * - vertical: Working Capital
 * - sub_vertical: Mid-Market - Infrastructure/EPC
 * - entity: company_contact
 * - geo_enforcement: discovery_region_to_apollo
 *
 * PRIMARY:
 * - Finance Manager
 * - Accounts Manager
 *
 * SECONDARY:
 * - Operations Manager
 *
 * FALLBACK:
 * - Administration Manager
 *
 * EXCLUDE:
 * - CEO
 * - CFO
 * ```
 *
 * Architecture:
 * - Policy DSL → Deterministic Compiler → Validated IPR JSON
 * - No LLM interpretation. LLM can only SUGGEST drafts.
 * - Region is NOT in policy; flows via Discovery.region → Apollo.person_locations
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Policy Scope metadata (not role definitions)
 */
export interface PolicyScope {
  vertical?: string;
  sub_vertical?: string;
  entity: 'company_contact' | 'individual' | 'company';
  geo_enforcement: 'discovery_region_to_apollo' | 'post_fetch' | 'none';
}

/**
 * IPR (Intermediate Policy Representation) - the canonical runtime format
 * This is the AST that runtime uses. DSL compiles to this.
 */
export interface IPR {
  version: string;
  scope: PolicyScope;
  target_roles: {
    primary: string[];      // Priority 1
    secondary: string[];    // Priority 2
    fallback: string[];     // Priority 3
  };
  skip_rules: {
    exclusions: string[];   // Never target these
  };
  seniorities: string[];    // Apollo seniority filter
  metadata: {
    compiled_at: string;
    policy_hash: string;
    source_format: 'dsl' | 'legacy_free_text';
  };
}

/**
 * DSL Parse Result
 */
export interface DSLParseResult {
  success: boolean;
  ipr?: IPR;
  errors: DSLError[];
  warnings: DSLWarning[];
}

export interface DSLError {
  line: number;
  code: string;
  message: string;
}

export interface DSLWarning {
  line: number;
  code: string;
  message: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * DSL Compiler Version - used for audit trail and reproducibility
 * Increment when compiler logic changes.
 */
export const DSL_COMPILER_VERSION = 'dsl_compiler_v2.0';

/**
 * Required sections in the DSL (order matters for validation)
 */
const REQUIRED_SECTIONS = ['PRIMARY', 'EXCLUDE'] as const;
const OPTIONAL_SECTIONS = ['SCOPE', 'SECONDARY', 'FALLBACK'] as const;
const ALL_SECTIONS = ['SCOPE', 'PRIMARY', 'SECONDARY', 'FALLBACK', 'EXCLUDE'] as const;

/**
 * Executive titles that MUST be in EXCLUDE, never in PRIMARY/SECONDARY/FALLBACK
 */
const EXECUTIVE_PATTERNS = [
  /\bceo\b/i,
  /\bcfo\b/i,
  /\bcoo\b/i,
  /\bcto\b/i,
  /\bchro\b/i,
  /\bmanaging\s*director\b/i,
  /\bgroup\s*(ceo|cfo|head)\b/i,
  /\bchief\s+(executive|financial|operating|technology|people)\s+officer\b/i,
  /\bpromoter\b/i,
  /\bboard\s*member\b/i,
  /\bdirector\s*general\b/i,
  /\bpresident\b/i,
  /\bvice\s*president\b/i,
  /\bvp\b/i,
  /\bsvp\b/i,
  /\bevp\b/i,
];

/**
 * Role keywords that must be present for a valid role title
 */
const ROLE_KEYWORDS = [
  'manager', 'head', 'director', 'executive', 'officer', 'lead',
  'coordinator', 'supervisor', 'analyst', 'specialist', 'controller',
];

/**
 * Invalid patterns in role titles
 */
const INVALID_ROLE_PATTERNS = [
  /\([^)]*\)/,           // Parentheses with content
  /\b(only|if|when|for)\b/i,  // Instructional words
  /\b(large|mid|small)\s*(market|company|companies)\b/i,  // Size conditionals
];

// =============================================================================
// DSL PARSER (DETERMINISTIC - NO LLM)
// =============================================================================

/**
 * Parse Policy DSL into IPR (Intermediate Policy Representation)
 *
 * This parser is 100% deterministic. No LLM interpretation.
 * Invalid policies are rejected with clear errors.
 *
 * @param dslText - The raw DSL text from Control Plane
 * @returns DSLParseResult with either valid IPR or errors
 */
export function compilePolicyDSL(dslText: string): DSLParseResult {
  const errors: DSLError[] = [];
  const warnings: DSLWarning[] = [];

  // Normalize line endings
  const lines = dslText.replace(/\r\n/g, '\n').split('\n');

  // Parse sections
  const sections = parseSections(lines, errors);

  if (errors.length > 0) {
    return { success: false, errors, warnings };
  }

  // Validate required sections
  validateRequiredSections(sections, errors);

  if (errors.length > 0) {
    return { success: false, errors, warnings };
  }

  // Parse SCOPE section
  const scope = parseScope(sections.SCOPE || [], errors, warnings);

  // Parse role sections
  const primary = parseRoles(sections.PRIMARY || [], 'PRIMARY', errors, warnings);
  const secondary = parseRoles(sections.SECONDARY || [], 'SECONDARY', errors, warnings);
  const fallback = parseRoles(sections.FALLBACK || [], 'FALLBACK', errors, warnings);
  const exclusions = parseExclusions(sections.EXCLUDE || [], errors, warnings);

  // Lint: Check for executives in target roles
  lintExecutivesInRoles(primary, 'PRIMARY', errors);
  lintExecutivesInRoles(secondary, 'SECONDARY', errors);
  lintExecutivesInRoles(fallback, 'FALLBACK', errors);

  // Lint: Check for role overlap
  lintRoleOverlap(primary, secondary, fallback, warnings);

  if (errors.length > 0) {
    return { success: false, errors, warnings };
  }

  // Generate policy hash
  const policyHash = generatePolicyHash(dslText);

  // Build IPR
  const ipr: IPR = {
    version: '2.0',
    scope: scope || {
      entity: 'company_contact',
      geo_enforcement: 'discovery_region_to_apollo',
    },
    target_roles: {
      primary,
      secondary,
      fallback,
    },
    skip_rules: {
      exclusions,
    },
    seniorities: ['manager', 'senior', 'director'],
    metadata: {
      compiled_at: new Date().toISOString(),
      policy_hash: policyHash,
      source_format: 'dsl',
    },
  };

  return { success: true, ipr, errors: [], warnings };
}

// =============================================================================
// SECTION PARSER
// =============================================================================

interface ParsedSections {
  SCOPE?: { line: number; content: string }[];
  PRIMARY?: { line: number; content: string }[];
  SECONDARY?: { line: number; content: string }[];
  FALLBACK?: { line: number; content: string }[];
  EXCLUDE?: { line: number; content: string }[];
}

function parseSections(lines: string[], errors: DSLError[]): ParsedSections {
  const sections: ParsedSections = {};
  let currentSection: keyof ParsedSections | null = null;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('#') || line.startsWith('//')) {
      continue;
    }

    // Check for section header
    const sectionMatch = line.match(/^(SCOPE|PRIMARY|SECONDARY|FALLBACK|EXCLUDE):$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1] as keyof ParsedSections;
      if (sections[currentSection]) {
        errors.push({
          line: lineNum,
          code: 'DUPLICATE_SECTION',
          message: `Duplicate section: ${currentSection}. Each section can only appear once.`,
        });
      }
      sections[currentSection] = [];
      continue;
    }

    // Check for invalid section header (missing colon or wrong format)
    const invalidSectionMatch = line.match(/^(SCOPE|PRIMARY|SECONDARY|FALLBACK|EXCLUDE)(\s|$)/i);
    if (invalidSectionMatch && !sectionMatch) {
      errors.push({
        line: lineNum,
        code: 'INVALID_SECTION_HEADER',
        message: `Invalid section header. Expected "${invalidSectionMatch[1].toUpperCase()}:" with a colon.`,
      });
      continue;
    }

    // Check for unrecognized section
    const unknownSectionMatch = line.match(/^([A-Z_]+):$/);
    if (unknownSectionMatch && !ALL_SECTIONS.includes(unknownSectionMatch[1] as any)) {
      errors.push({
        line: lineNum,
        code: 'UNKNOWN_SECTION',
        message: `Unknown section: ${unknownSectionMatch[1]}. Valid sections are: ${ALL_SECTIONS.join(', ')}`,
      });
      continue;
    }

    // Parse content line
    if (currentSection) {
      // Must start with "-" for bullet list
      if (!line.startsWith('-')) {
        errors.push({
          line: lineNum,
          code: 'INVALID_LIST_FORMAT',
          message: `Lines in ${currentSection} must start with "- ". Got: "${line.substring(0, 30)}..."`,
        });
        continue;
      }

      const content = line.substring(1).trim();
      if (content) {
        sections[currentSection]!.push({ line: lineNum, content });
      }
    } else {
      // Content without section header
      errors.push({
        line: lineNum,
        code: 'CONTENT_WITHOUT_SECTION',
        message: `Content found before any section header. Start with SCOPE:, PRIMARY:, etc.`,
      });
    }
  }

  return sections;
}

// =============================================================================
// VALIDATION
// =============================================================================

function validateRequiredSections(sections: ParsedSections, errors: DSLError[]): void {
  for (const required of REQUIRED_SECTIONS) {
    if (!sections[required] || sections[required]!.length === 0) {
      errors.push({
        line: 0,
        code: 'MISSING_REQUIRED_SECTION',
        message: `Missing required section: ${required}. Policy must have at least PRIMARY and EXCLUDE sections.`,
      });
    }
  }
}

// =============================================================================
// SCOPE PARSER
// =============================================================================

function parseScope(
  items: { line: number; content: string }[],
  errors: DSLError[],
  warnings: DSLWarning[]
): PolicyScope | null {
  if (items.length === 0) {
    warnings.push({
      line: 0,
      code: 'NO_SCOPE',
      message: 'No SCOPE section. Using defaults: entity=company_contact, geo_enforcement=discovery_region_to_apollo',
    });
    return null;
  }

  const scope: Partial<PolicyScope> = {};

  for (const item of items) {
    const match = item.content.match(/^(\w+):\s*(.+)$/);
    if (!match) {
      errors.push({
        line: item.line,
        code: 'INVALID_SCOPE_FORMAT',
        message: `Invalid SCOPE format. Expected "key: value". Got: "${item.content}"`,
      });
      continue;
    }

    const [, key, value] = match;
    switch (key.toLowerCase()) {
      case 'vertical':
        scope.vertical = value.trim();
        break;
      case 'sub_vertical':
        scope.sub_vertical = value.trim();
        break;
      case 'entity':
        if (!['company_contact', 'individual', 'company'].includes(value.trim())) {
          errors.push({
            line: item.line,
            code: 'INVALID_ENTITY',
            message: `Invalid entity: "${value}". Must be: company_contact, individual, or company`,
          });
        } else {
          scope.entity = value.trim() as PolicyScope['entity'];
        }
        break;
      case 'geo_enforcement':
        if (!['discovery_region_to_apollo', 'post_fetch', 'none'].includes(value.trim())) {
          errors.push({
            line: item.line,
            code: 'INVALID_GEO_ENFORCEMENT',
            message: `Invalid geo_enforcement: "${value}". Must be: discovery_region_to_apollo, post_fetch, or none`,
          });
        } else {
          scope.geo_enforcement = value.trim() as PolicyScope['geo_enforcement'];
        }
        break;
      default:
        warnings.push({
          line: item.line,
          code: 'UNKNOWN_SCOPE_KEY',
          message: `Unknown SCOPE key: "${key}". Ignoring.`,
        });
    }
  }

  return {
    entity: scope.entity || 'company_contact',
    geo_enforcement: scope.geo_enforcement || 'discovery_region_to_apollo',
    vertical: scope.vertical,
    sub_vertical: scope.sub_vertical,
  };
}

// =============================================================================
// ROLE PARSER
// =============================================================================

function parseRoles(
  items: { line: number; content: string }[],
  section: string,
  errors: DSLError[],
  warnings: DSLWarning[]
): string[] {
  const roles: string[] = [];

  for (const item of items) {
    const role = item.content.trim();

    // Check for invalid patterns
    for (const pattern of INVALID_ROLE_PATTERNS) {
      if (pattern.test(role)) {
        errors.push({
          line: item.line,
          code: 'INVALID_ROLE_FORMAT',
          message: `Invalid role format in ${section}: "${role}". Roles must be clean titles without parentheses or conditional text.`,
        });
        continue;
      }
    }

    // Check for role keyword (warning, not error)
    const hasRoleKeyword = ROLE_KEYWORDS.some(kw =>
      role.toLowerCase().includes(kw)
    );
    if (!hasRoleKeyword) {
      warnings.push({
        line: item.line,
        code: 'MISSING_ROLE_KEYWORD',
        message: `Role "${role}" may not be valid - missing keywords like Manager, Director, Head, etc.`,
      });
    }

    // Normalize role (trim, single spaces)
    const normalizedRole = role.replace(/\s+/g, ' ').trim();
    if (normalizedRole && !roles.includes(normalizedRole)) {
      roles.push(normalizedRole);
    }
  }

  return roles;
}

// =============================================================================
// EXCLUSION PARSER
// =============================================================================

function parseExclusions(
  items: { line: number; content: string }[],
  errors: DSLError[],
  warnings: DSLWarning[]
): string[] {
  const exclusions: string[] = [];

  for (const item of items) {
    const exclusion = item.content.trim();

    // Check for invalid patterns
    for (const pattern of INVALID_ROLE_PATTERNS) {
      if (pattern.test(exclusion)) {
        errors.push({
          line: item.line,
          code: 'INVALID_EXCLUSION_FORMAT',
          message: `Invalid exclusion format: "${exclusion}". Use clean titles only.`,
        });
        continue;
      }
    }

    // Normalize
    const normalized = exclusion.replace(/\s+/g, ' ').trim();
    if (normalized && !exclusions.includes(normalized)) {
      exclusions.push(normalized);
    }
  }

  return exclusions;
}

// =============================================================================
// LINT RULES
// =============================================================================

function lintExecutivesInRoles(
  roles: string[],
  section: string,
  errors: DSLError[]
): void {
  for (const role of roles) {
    for (const pattern of EXECUTIVE_PATTERNS) {
      if (pattern.test(role)) {
        errors.push({
          line: 0,
          code: 'EXECUTIVE_IN_TARGET_ROLES',
          message: `Executive title "${role}" found in ${section}. Executives must be in EXCLUDE section, not target roles.`,
        });
        break;
      }
    }
  }
}

function lintRoleOverlap(
  primary: string[],
  secondary: string[],
  fallback: string[],
  warnings: DSLWarning[]
): void {
  const primarySet = new Set(primary.map(r => r.toLowerCase()));
  const secondarySet = new Set(secondary.map(r => r.toLowerCase()));

  // Check secondary overlap with primary
  for (const role of secondary) {
    if (primarySet.has(role.toLowerCase())) {
      warnings.push({
        line: 0,
        code: 'ROLE_OVERLAP',
        message: `Role "${role}" appears in both PRIMARY and SECONDARY. It will only be treated as PRIMARY.`,
      });
    }
  }

  // Check fallback overlap
  for (const role of fallback) {
    if (primarySet.has(role.toLowerCase())) {
      warnings.push({
        line: 0,
        code: 'ROLE_OVERLAP',
        message: `Role "${role}" appears in both PRIMARY and FALLBACK. It will only be treated as PRIMARY.`,
      });
    }
    if (secondarySet.has(role.toLowerCase())) {
      warnings.push({
        line: 0,
        code: 'ROLE_OVERLAP',
        message: `Role "${role}" appears in both SECONDARY and FALLBACK. It will only be treated as SECONDARY.`,
      });
    }
  }
}

// =============================================================================
// UTILITIES
// =============================================================================

function generatePolicyHash(text: string): string {
  // Simple hash for policy versioning
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

// =============================================================================
// LEGACY FREE TEXT DETECTOR
// =============================================================================

/**
 * Detect if text is DSL format or legacy free text
 */
export function isDSLFormat(text: string): boolean {
  // DSL format has explicit section headers
  const hasSectionHeaders = /^(SCOPE|PRIMARY|SECONDARY|FALLBACK|EXCLUDE):$/m.test(text);
  return hasSectionHeaders;
}

/**
 * Convert legacy free text to DSL format (best effort, for migration)
 * This is NOT used in the critical path - only for migration assistance.
 */
export function suggestDSLFromFreeText(freeText: string): string {
  // This is a SUGGESTION only, not authoritative compilation
  // Human must review and approve the DSL
  const lines = freeText.split('\n');

  let currentSection = '';
  const sections: Record<string, string[]> = {
    SCOPE: [],
    PRIMARY: [],
    SECONDARY: [],
    FALLBACK: [],
    EXCLUDE: [],
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect section hints
    if (/primary|tier\s*1/i.test(trimmed) && /:/.test(trimmed)) {
      currentSection = 'PRIMARY';
      continue;
    }
    if (/secondary|tier\s*2/i.test(trimmed) && /:/.test(trimmed)) {
      currentSection = 'SECONDARY';
      continue;
    }
    if (/fallback|tier\s*3/i.test(trimmed) && /:/.test(trimmed)) {
      currentSection = 'FALLBACK';
      continue;
    }
    if (/exclu|never|avoid|skip/i.test(trimmed) && /:/.test(trimmed)) {
      currentSection = 'EXCLUDE';
      continue;
    }

    // Extract role from bullet
    if (trimmed.startsWith('-') && currentSection) {
      const role = trimmed.substring(1).trim();
      // Clean up parenthetical content for suggestion
      const cleanRole = role.replace(/\s*\([^)]*\)/g, '').trim();
      if (cleanRole) {
        sections[currentSection].push(cleanRole);
      }
    }
  }

  // Build suggested DSL
  let dsl = 'SCOPE:\n- entity: company_contact\n- geo_enforcement: discovery_region_to_apollo\n\n';

  if (sections.PRIMARY.length > 0) {
    dsl += 'PRIMARY:\n';
    sections.PRIMARY.forEach(r => dsl += `- ${r}\n`);
    dsl += '\n';
  }

  if (sections.SECONDARY.length > 0) {
    dsl += 'SECONDARY:\n';
    sections.SECONDARY.forEach(r => dsl += `- ${r}\n`);
    dsl += '\n';
  }

  if (sections.FALLBACK.length > 0) {
    dsl += 'FALLBACK:\n';
    sections.FALLBACK.forEach(r => dsl += `- ${r}\n`);
    dsl += '\n';
  }

  dsl += 'EXCLUDE:\n';
  if (sections.EXCLUDE.length > 0) {
    sections.EXCLUDE.forEach(r => dsl += `- ${r}\n`);
  } else {
    // Default exclusions
    dsl += '- CEO\n- CFO\n- Managing Director\n- Promoter\n- Board Member\n';
  }

  return dsl;
}
