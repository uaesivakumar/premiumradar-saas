/**
 * Persona Schema Validation (S148)
 *
 * Validates persona configurations before saving to prevent:
 * - Missing required identity fields
 * - Invalid entity types
 * - Malformed contact priority rules
 * - Invalid edge case configurations
 * - Broken scoring configs
 * - Missing required outreach doctrine fields
 *
 * Personas are the brain of SIVA per sub-vertical. Invalid personas = broken intelligence.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface PersonaValidationResult {
  valid: boolean;
  errors: PersonaValidationError[];
  warnings: PersonaValidationWarning[];
  completeness: PersonaCompleteness;
}

export interface PersonaValidationError {
  code: string;
  field: string;
  message: string;
  severity: 'critical' | 'error';
}

export interface PersonaValidationWarning {
  code: string;
  field: string;
  message: string;
}

export interface PersonaCompleteness {
  score: number; // 0-100
  sections: {
    identity: boolean;
    targeting: boolean;
    timing: boolean;
    outreach: boolean;
    scoring: boolean;
    advanced: boolean;
  };
}

export interface PersonaConfig {
  id?: string;
  slug: string;
  sub_vertical_slug: string;
  persona_name: string;
  persona_role?: string;
  persona_organization?: string;
  mission_statement?: string;
  entity_type: 'company' | 'individual';

  // Targeting
  contact_priority_rules?: ContactPriorityRules;
  edge_cases?: EdgeCases;

  // Timing
  timing_rules?: TimingRules;

  // Outreach
  outreach_doctrine?: OutreachDoctrine;

  // Scoring
  scoring_config?: PersonaScoringConfig;

  // Quality
  quality_standards?: QualityStandards;

  // Advanced
  anti_patterns?: AntiPattern[];
  confidence_gates?: ConfidenceGates;
  success_patterns?: Pattern[];
  failure_patterns?: FailurePattern[];

  // Metadata
  version?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ContactPriorityRules {
  tiers: ContactTier[];
}

export interface ContactTier {
  size_min?: number;
  size_max?: number | null;
  age_min?: number;
  age_max?: number | null;
  titles: string[];
  priority: number;
}

export interface EdgeCases {
  blockers: EdgeCase[];
  boosters: EdgeCase[];
}

export interface EdgeCase {
  type: string;
  values: string[];
  multiplier: number;
  reason?: string;
}

export interface TimingRules {
  calendar: CalendarRule[];
  signal_freshness: FreshnessRule[];
}

export interface CalendarRule {
  period: string;
  months: number[];
  multiplier: number;
}

export interface FreshnessRule {
  days_max: number;
  multiplier: number;
  label: string;
}

export interface OutreachDoctrine {
  always: string[];
  never: string[];
  tone: string;
  formality: string;
  channels: string[];
}

export interface PersonaScoringConfig {
  weights: {
    q_score: number;
    t_score: number;
    l_score: number;
    e_score: number;
  };
  thresholds: {
    hot: number;
    warm: number;
    cold: number;
  };
}

export interface QualityStandards {
  minimum_data_fields: string[];
  preferred_data_sources: string[];
  data_freshness_days: number;
}

export interface AntiPattern {
  pattern: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ConfidenceGates {
  minimum_confidence: number;
  require_verification_below: number;
  auto_approve_above: number;
}

export interface Pattern {
  pattern: string;
  indicator: string;
  action: string;
}

export interface FailurePattern {
  pattern: string;
  indicator: string;
  recovery: string;
}

// =============================================================================
// VALID VALUES
// =============================================================================

const VALID_ENTITY_TYPES = new Set(['company', 'individual']);
const VALID_TONES = new Set(['professional', 'friendly', 'casual', 'formal', 'authoritative']);
const VALID_FORMALITIES = new Set(['formal', 'casual', 'semi-formal']);
const VALID_CHANNELS = new Set(['email', 'linkedin', 'phone', 'whatsapp', 'sms', 'in-person']);
const VALID_EDGE_CASE_TYPES = new Set([
  'company_name', 'sector', 'industry', 'license_type', 'company_age',
  'headcount', 'revenue', 'location', 'funding_stage', 'ownership_type'
]);
const VALID_SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);

// =============================================================================
// VALIDATORS
// =============================================================================

/**
 * Validate a persona configuration
 */
export function validatePersonaConfig(persona: PersonaConfig): PersonaValidationResult {
  const errors: PersonaValidationError[] = [];
  const warnings: PersonaValidationWarning[] = [];

  // =========================================================================
  // REQUIRED FIELDS (Critical)
  // =========================================================================

  if (!persona.slug) {
    errors.push({
      code: 'MISSING_SLUG',
      field: 'slug',
      message: 'Persona slug is required',
      severity: 'critical',
    });
  } else if (!/^[a-z][a-z0-9-]*$/.test(persona.slug)) {
    errors.push({
      code: 'INVALID_SLUG_FORMAT',
      field: 'slug',
      message: 'Slug must start with letter and contain only lowercase letters, numbers, and hyphens',
      severity: 'error',
    });
  }

  if (!persona.sub_vertical_slug) {
    errors.push({
      code: 'MISSING_SUB_VERTICAL',
      field: 'sub_vertical_slug',
      message: 'Sub-vertical slug is required - persona must belong to a sub-vertical',
      severity: 'critical',
    });
  }

  if (!persona.persona_name) {
    errors.push({
      code: 'MISSING_PERSONA_NAME',
      field: 'persona_name',
      message: 'Persona name is required (e.g., "EB Sales Officer")',
      severity: 'critical',
    });
  }

  if (!persona.entity_type) {
    errors.push({
      code: 'MISSING_ENTITY_TYPE',
      field: 'entity_type',
      message: 'Entity type is required (company or individual)',
      severity: 'critical',
    });
  } else if (!VALID_ENTITY_TYPES.has(persona.entity_type)) {
    errors.push({
      code: 'INVALID_ENTITY_TYPE',
      field: 'entity_type',
      message: `Invalid entity type: "${persona.entity_type}". Must be "company" or "individual"`,
      severity: 'critical',
    });
  }

  // =========================================================================
  // CONTACT PRIORITY RULES
  // =========================================================================

  if (persona.contact_priority_rules?.tiers) {
    const tiers = persona.contact_priority_rules.tiers;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const fieldPrefix = `contact_priority_rules.tiers[${i}]`;

      // Must have either size or age bounds
      const hasSize = tier.size_min !== undefined || tier.size_max !== undefined;
      const hasAge = tier.age_min !== undefined || tier.age_max !== undefined;

      if (!hasSize && !hasAge) {
        errors.push({
          code: 'TIER_MISSING_BOUNDS',
          field: fieldPrefix,
          message: 'Contact tier must have size or age bounds defined',
          severity: 'error',
        });
      }

      // Size validation
      if (hasSize) {
        if (tier.size_min !== undefined && tier.size_min < 0) {
          errors.push({
            code: 'INVALID_SIZE_MIN',
            field: `${fieldPrefix}.size_min`,
            message: `Size minimum cannot be negative: ${tier.size_min}`,
            severity: 'error',
          });
        }
        if (tier.size_max !== null && tier.size_max !== undefined) {
          if (tier.size_min !== undefined && tier.size_max < tier.size_min) {
            errors.push({
              code: 'INVALID_SIZE_RANGE',
              field: fieldPrefix,
              message: `Size max (${tier.size_max}) cannot be less than min (${tier.size_min})`,
              severity: 'error',
            });
          }
        }
      }

      // Titles validation
      if (!tier.titles || tier.titles.length === 0) {
        errors.push({
          code: 'TIER_MISSING_TITLES',
          field: `${fieldPrefix}.titles`,
          message: 'Contact tier must have at least one target title',
          severity: 'error',
        });
      }

      // Priority validation
      if (tier.priority === undefined || tier.priority < 1) {
        errors.push({
          code: 'INVALID_PRIORITY',
          field: `${fieldPrefix}.priority`,
          message: 'Priority must be a positive integer',
          severity: 'error',
        });
      }
    }

    // Check for overlapping tiers
    for (let i = 0; i < tiers.length; i++) {
      for (let j = i + 1; j < tiers.length; j++) {
        if (tiersOverlap(tiers[i], tiers[j])) {
          warnings.push({
            code: 'OVERLAPPING_TIERS',
            field: 'contact_priority_rules.tiers',
            message: `Tiers ${i} and ${j} have overlapping size/age ranges`,
          });
        }
      }
    }
  }

  // =========================================================================
  // EDGE CASES
  // =========================================================================

  if (persona.edge_cases) {
    // Validate blockers
    if (persona.edge_cases.blockers) {
      for (let i = 0; i < persona.edge_cases.blockers.length; i++) {
        const blocker = persona.edge_cases.blockers[i];
        const fieldPrefix = `edge_cases.blockers[${i}]`;

        validateEdgeCase(blocker, fieldPrefix, errors, warnings);

        // Blocker multipliers should be < 1
        if (blocker.multiplier >= 1) {
          warnings.push({
            code: 'BLOCKER_HIGH_MULTIPLIER',
            field: `${fieldPrefix}.multiplier`,
            message: `Blocker multiplier ${blocker.multiplier} >= 1 won't reduce score`,
          });
        }
      }
    }

    // Validate boosters
    if (persona.edge_cases.boosters) {
      for (let i = 0; i < persona.edge_cases.boosters.length; i++) {
        const booster = persona.edge_cases.boosters[i];
        const fieldPrefix = `edge_cases.boosters[${i}]`;

        validateEdgeCase(booster, fieldPrefix, errors, warnings);

        // Booster multipliers should be > 1
        if (booster.multiplier <= 1) {
          warnings.push({
            code: 'BOOSTER_LOW_MULTIPLIER',
            field: `${fieldPrefix}.multiplier`,
            message: `Booster multiplier ${booster.multiplier} <= 1 won't increase score`,
          });
        }
      }
    }
  }

  // =========================================================================
  // OUTREACH DOCTRINE
  // =========================================================================

  if (persona.outreach_doctrine) {
    const doctrine = persona.outreach_doctrine;

    if (doctrine.tone && !VALID_TONES.has(doctrine.tone)) {
      warnings.push({
        code: 'UNKNOWN_TONE',
        field: 'outreach_doctrine.tone',
        message: `Unknown tone "${doctrine.tone}". Consider using: ${[...VALID_TONES].join(', ')}`,
      });
    }

    if (doctrine.formality && !VALID_FORMALITIES.has(doctrine.formality)) {
      warnings.push({
        code: 'UNKNOWN_FORMALITY',
        field: 'outreach_doctrine.formality',
        message: `Unknown formality "${doctrine.formality}". Consider using: ${[...VALID_FORMALITIES].join(', ')}`,
      });
    }

    if (doctrine.channels) {
      for (const channel of doctrine.channels) {
        if (!VALID_CHANNELS.has(channel)) {
          warnings.push({
            code: 'UNKNOWN_CHANNEL',
            field: 'outreach_doctrine.channels',
            message: `Unknown channel "${channel}". Consider using: ${[...VALID_CHANNELS].join(', ')}`,
          });
        }
      }
    }

    // Check for conflicting rules
    if (doctrine.always && doctrine.never) {
      for (const alwaysRule of doctrine.always) {
        for (const neverRule of doctrine.never) {
          if (alwaysRule.toLowerCase().includes(neverRule.toLowerCase()) ||
              neverRule.toLowerCase().includes(alwaysRule.toLowerCase())) {
            warnings.push({
              code: 'CONFLICTING_OUTREACH_RULES',
              field: 'outreach_doctrine',
              message: `Potential conflict between ALWAYS "${alwaysRule}" and NEVER "${neverRule}"`,
            });
          }
        }
      }
    }
  }

  // =========================================================================
  // SCORING CONFIG
  // =========================================================================

  if (persona.scoring_config) {
    const { weights, thresholds } = persona.scoring_config;

    if (weights) {
      const totalWeight = weights.q_score + weights.t_score + weights.l_score + weights.e_score;
      if (Math.abs(totalWeight - 1) > 0.01) {
        errors.push({
          code: 'INVALID_WEIGHT_SUM',
          field: 'scoring_config.weights',
          message: `QTLE weights must sum to 1.0, got: ${totalWeight.toFixed(2)}`,
          severity: 'error',
        });
      }

      for (const [key, value] of Object.entries(weights)) {
        if (value < 0 || value > 1) {
          errors.push({
            code: 'INVALID_WEIGHT_VALUE',
            field: `scoring_config.weights.${key}`,
            message: `Weight "${key}" must be between 0 and 1, got: ${value}`,
            severity: 'error',
          });
        }
      }
    }

    if (thresholds) {
      if (thresholds.hot <= thresholds.warm) {
        errors.push({
          code: 'INVALID_THRESHOLD_ORDER',
          field: 'scoring_config.thresholds',
          message: `HOT threshold (${thresholds.hot}) must be > WARM (${thresholds.warm})`,
          severity: 'error',
        });
      }
      if (thresholds.warm <= thresholds.cold) {
        errors.push({
          code: 'INVALID_THRESHOLD_ORDER',
          field: 'scoring_config.thresholds',
          message: `WARM threshold (${thresholds.warm}) must be > COLD (${thresholds.cold})`,
          severity: 'error',
        });
      }
    }
  }

  // =========================================================================
  // CONFIDENCE GATES
  // =========================================================================

  if (persona.confidence_gates) {
    const gates = persona.confidence_gates;

    if (gates.minimum_confidence < 0 || gates.minimum_confidence > 1) {
      errors.push({
        code: 'INVALID_CONFIDENCE_RANGE',
        field: 'confidence_gates.minimum_confidence',
        message: `Confidence must be between 0 and 1, got: ${gates.minimum_confidence}`,
        severity: 'error',
      });
    }

    if (gates.require_verification_below >= gates.auto_approve_above) {
      errors.push({
        code: 'INVALID_CONFIDENCE_THRESHOLDS',
        field: 'confidence_gates',
        message: 'require_verification_below must be less than auto_approve_above',
        severity: 'error',
      });
    }
  }

  // =========================================================================
  // ANTI-PATTERNS
  // =========================================================================

  if (persona.anti_patterns) {
    for (let i = 0; i < persona.anti_patterns.length; i++) {
      const ap = persona.anti_patterns[i];
      const fieldPrefix = `anti_patterns[${i}]`;

      if (!ap.pattern) {
        errors.push({
          code: 'MISSING_PATTERN',
          field: `${fieldPrefix}.pattern`,
          message: 'Anti-pattern must have a pattern description',
          severity: 'error',
        });
      }

      if (ap.severity && !VALID_SEVERITIES.has(ap.severity)) {
        warnings.push({
          code: 'UNKNOWN_SEVERITY',
          field: `${fieldPrefix}.severity`,
          message: `Unknown severity "${ap.severity}". Use: ${[...VALID_SEVERITIES].join(', ')}`,
        });
      }
    }
  }

  // =========================================================================
  // CALCULATE COMPLETENESS
  // =========================================================================

  const completeness = calculateCompleteness(persona);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    completeness,
  };
}

// =============================================================================
// HELPERS
// =============================================================================

function validateEdgeCase(
  edgeCase: EdgeCase,
  fieldPrefix: string,
  errors: PersonaValidationError[],
  warnings: PersonaValidationWarning[]
): void {
  if (!edgeCase.type) {
    errors.push({
      code: 'MISSING_EDGE_TYPE',
      field: `${fieldPrefix}.type`,
      message: 'Edge case type is required',
      severity: 'error',
    });
  } else if (!VALID_EDGE_CASE_TYPES.has(edgeCase.type)) {
    warnings.push({
      code: 'UNKNOWN_EDGE_TYPE',
      field: `${fieldPrefix}.type`,
      message: `Unknown edge case type "${edgeCase.type}". Consider using: ${[...VALID_EDGE_CASE_TYPES].join(', ')}`,
    });
  }

  if (!edgeCase.values || edgeCase.values.length === 0) {
    errors.push({
      code: 'MISSING_EDGE_VALUES',
      field: `${fieldPrefix}.values`,
      message: 'Edge case must have at least one value',
      severity: 'error',
    });
  }

  if (edgeCase.multiplier === undefined || edgeCase.multiplier < 0) {
    errors.push({
      code: 'INVALID_MULTIPLIER',
      field: `${fieldPrefix}.multiplier`,
      message: 'Multiplier must be a non-negative number',
      severity: 'error',
    });
  }
}

function tiersOverlap(tier1: ContactTier, tier2: ContactTier): boolean {
  // Check size overlap
  if (tier1.size_min !== undefined && tier2.size_min !== undefined) {
    const t1Max = tier1.size_max ?? Infinity;
    const t2Max = tier2.size_max ?? Infinity;
    const t1Min = tier1.size_min;
    const t2Min = tier2.size_min;

    if (t1Min <= t2Max && t2Min <= t1Max) {
      return true;
    }
  }

  // Check age overlap
  if (tier1.age_min !== undefined && tier2.age_min !== undefined) {
    const t1Max = tier1.age_max ?? Infinity;
    const t2Max = tier2.age_max ?? Infinity;
    const t1Min = tier1.age_min;
    const t2Min = tier2.age_min;

    if (t1Min <= t2Max && t2Min <= t1Max) {
      return true;
    }
  }

  return false;
}

function calculateCompleteness(persona: PersonaConfig): PersonaCompleteness {
  const sections = {
    identity: !!(persona.persona_name && persona.entity_type),
    targeting: !!(persona.contact_priority_rules?.tiers?.length),
    timing: !!(persona.timing_rules?.calendar?.length || persona.timing_rules?.signal_freshness?.length),
    outreach: !!(persona.outreach_doctrine?.always?.length || persona.outreach_doctrine?.never?.length),
    scoring: !!(persona.scoring_config?.weights && persona.scoring_config?.thresholds),
    advanced: !!(persona.anti_patterns?.length || persona.confidence_gates),
  };

  const completedSections = Object.values(sections).filter(Boolean).length;
  const totalSections = Object.keys(sections).length;
  const score = Math.round((completedSections / totalSections) * 100);

  return { score, sections };
}

/**
 * Validate persona update (partial)
 */
export function validatePersonaUpdate(
  currentPersona: PersonaConfig,
  updates: Partial<PersonaConfig>
): PersonaValidationResult {
  const merged: PersonaConfig = {
    ...currentPersona,
    ...updates,
  };

  return validatePersonaConfig(merged);
}
