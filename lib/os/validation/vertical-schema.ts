/**
 * Vertical Schema Validation (S147.1)
 *
 * Validates vertical configurations before saving to prevent:
 * - Missing required keys
 * - Duplicate signal IDs
 * - Conflicting ranking rules
 * - Territory/region mismatch
 * - Forbidden fields (OS-level protected keys)
 * - Invalid persona references
 *
 * This prevents catastrophic OS breakage from bad Super Admin saves.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  field: string;
  message: string;
  severity: 'critical' | 'error';
}

export interface ValidationWarning {
  code: string;
  field: string;
  message: string;
}

export interface VerticalConfig {
  slug: string;
  name: string;
  description?: string;
  is_active?: boolean;
  icon?: string;
  color?: string;
  sub_verticals?: SubVerticalConfig[];
  signal_types?: SignalTypeConfig[];
  scoring_config?: ScoringConfig;
  territory_bindings?: TerritoryBinding[];
  persona_refs?: string[];
  config?: Record<string, unknown>;
}

export interface SubVerticalConfig {
  slug: string;
  name: string;
  description?: string;
  is_active?: boolean;
  persona_ref?: string;
}

export interface SignalTypeConfig {
  id?: string;
  slug: string;
  name: string;
  category?: string;
  weight: number;
  is_active?: boolean;
}

export interface ScoringConfig {
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

export interface TerritoryBinding {
  territory_slug: string;
  is_primary?: boolean;
  config_override?: Record<string, unknown>;
}

// =============================================================================
// PROTECTED FIELDS (OS-level, cannot be modified via Super Admin)
// =============================================================================

const PROTECTED_FIELDS = new Set([
  'id',
  'created_at',
  'updated_at',
  'created_by',
  'version',
  'internal_flags',
  '_system',
  '_audit',
  'encryption_key',
  'api_credentials',
]);

const RESERVED_SLUGS = new Set([
  'system',
  'admin',
  'superadmin',
  'root',
  'os',
  'internal',
  'test',
  '_default',
]);

// =============================================================================
// VALIDATORS
// =============================================================================

/**
 * Validate a vertical configuration
 */
export function validateVerticalConfig(config: VerticalConfig): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required fields
  if (!config.slug) {
    errors.push({
      code: 'MISSING_SLUG',
      field: 'slug',
      message: 'Vertical slug is required',
      severity: 'critical',
    });
  } else {
    // Slug format validation
    if (!/^[a-z][a-z0-9-]*$/.test(config.slug)) {
      errors.push({
        code: 'INVALID_SLUG_FORMAT',
        field: 'slug',
        message: 'Slug must start with letter and contain only lowercase letters, numbers, and hyphens',
        severity: 'error',
      });
    }
    if (RESERVED_SLUGS.has(config.slug)) {
      errors.push({
        code: 'RESERVED_SLUG',
        field: 'slug',
        message: `Slug "${config.slug}" is reserved and cannot be used`,
        severity: 'critical',
      });
    }
  }

  if (!config.name) {
    errors.push({
      code: 'MISSING_NAME',
      field: 'name',
      message: 'Vertical name is required',
      severity: 'critical',
    });
  }

  // Check for protected fields in config
  if (config.config) {
    for (const key of Object.keys(config.config)) {
      if (PROTECTED_FIELDS.has(key)) {
        errors.push({
          code: 'PROTECTED_FIELD',
          field: `config.${key}`,
          message: `Field "${key}" is protected and cannot be modified`,
          severity: 'critical',
        });
      }
    }
  }

  // Validate signal types
  if (config.signal_types) {
    const signalSlugs = new Set<string>();
    const signalIds = new Set<string>();

    for (let i = 0; i < config.signal_types.length; i++) {
      const signal = config.signal_types[i];
      const fieldPrefix = `signal_types[${i}]`;

      // Check for duplicate slugs
      if (signalSlugs.has(signal.slug)) {
        errors.push({
          code: 'DUPLICATE_SIGNAL_SLUG',
          field: `${fieldPrefix}.slug`,
          message: `Duplicate signal slug: "${signal.slug}"`,
          severity: 'error',
        });
      }
      signalSlugs.add(signal.slug);

      // Check for duplicate IDs
      if (signal.id) {
        if (signalIds.has(signal.id)) {
          errors.push({
            code: 'DUPLICATE_SIGNAL_ID',
            field: `${fieldPrefix}.id`,
            message: `Duplicate signal ID: "${signal.id}"`,
            severity: 'critical',
          });
        }
        signalIds.add(signal.id);
      }

      // Validate weight range
      if (signal.weight < 0 || signal.weight > 1) {
        errors.push({
          code: 'INVALID_SIGNAL_WEIGHT',
          field: `${fieldPrefix}.weight`,
          message: `Signal weight must be between 0 and 1, got: ${signal.weight}`,
          severity: 'error',
        });
      }
    }
  }

  // Validate scoring config
  if (config.scoring_config) {
    const { weights, thresholds } = config.scoring_config;

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

      // Check individual weights
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
      // Thresholds must be in descending order: hot > warm > cold
      if (thresholds.hot <= thresholds.warm) {
        errors.push({
          code: 'INVALID_THRESHOLD_ORDER',
          field: 'scoring_config.thresholds',
          message: `HOT threshold (${thresholds.hot}) must be greater than WARM (${thresholds.warm})`,
          severity: 'error',
        });
      }
      if (thresholds.warm <= thresholds.cold) {
        errors.push({
          code: 'INVALID_THRESHOLD_ORDER',
          field: 'scoring_config.thresholds',
          message: `WARM threshold (${thresholds.warm}) must be greater than COLD (${thresholds.cold})`,
          severity: 'error',
        });
      }

      // Thresholds should be reasonable (0-100)
      for (const [key, value] of Object.entries(thresholds)) {
        if (value < 0 || value > 100) {
          warnings.push({
            code: 'UNUSUAL_THRESHOLD',
            field: `scoring_config.thresholds.${key}`,
            message: `Threshold "${key}" value ${value} is outside typical 0-100 range`,
          });
        }
      }
    }
  }

  // Validate sub-verticals
  if (config.sub_verticals) {
    const subSlugs = new Set<string>();

    for (let i = 0; i < config.sub_verticals.length; i++) {
      const sub = config.sub_verticals[i];
      const fieldPrefix = `sub_verticals[${i}]`;

      if (!sub.slug) {
        errors.push({
          code: 'MISSING_SUB_SLUG',
          field: `${fieldPrefix}.slug`,
          message: 'Sub-vertical slug is required',
          severity: 'error',
        });
      } else if (subSlugs.has(sub.slug)) {
        errors.push({
          code: 'DUPLICATE_SUB_SLUG',
          field: `${fieldPrefix}.slug`,
          message: `Duplicate sub-vertical slug: "${sub.slug}"`,
          severity: 'error',
        });
      }
      subSlugs.add(sub.slug);

      if (!sub.name) {
        errors.push({
          code: 'MISSING_SUB_NAME',
          field: `${fieldPrefix}.name`,
          message: 'Sub-vertical name is required',
          severity: 'error',
        });
      }
    }
  }

  // Validate territory bindings
  if (config.territory_bindings) {
    const territories = new Set<string>();

    for (let i = 0; i < config.territory_bindings.length; i++) {
      const binding = config.territory_bindings[i];
      const fieldPrefix = `territory_bindings[${i}]`;

      if (!binding.territory_slug) {
        errors.push({
          code: 'MISSING_TERRITORY_SLUG',
          field: `${fieldPrefix}.territory_slug`,
          message: 'Territory slug is required for binding',
          severity: 'error',
        });
      } else if (territories.has(binding.territory_slug)) {
        warnings.push({
          code: 'DUPLICATE_TERRITORY_BINDING',
          field: `${fieldPrefix}.territory_slug`,
          message: `Duplicate territory binding: "${binding.territory_slug}"`,
        });
      }
      territories.add(binding.territory_slug);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate vertical config update (partial)
 */
export function validateVerticalUpdate(
  currentConfig: VerticalConfig,
  updates: Partial<VerticalConfig>
): ValidationResult {
  // Merge for full validation
  const merged: VerticalConfig = {
    ...currentConfig,
    ...updates,
    // Deep merge arrays if both exist
    signal_types: updates.signal_types ?? currentConfig.signal_types,
    sub_verticals: updates.sub_verticals ?? currentConfig.sub_verticals,
    territory_bindings: updates.territory_bindings ?? currentConfig.territory_bindings,
    scoring_config: updates.scoring_config
      ? { ...currentConfig.scoring_config, ...updates.scoring_config }
      : currentConfig.scoring_config,
  };

  const result = validateVerticalConfig(merged);

  // Additional update-specific checks
  if (updates.slug && updates.slug !== currentConfig.slug) {
    result.warnings.push({
      code: 'SLUG_CHANGE',
      field: 'slug',
      message: 'Changing slug may break existing references. Ensure all dependent configs are updated.',
    });
  }

  return result;
}

/**
 * Check for conflicts between two vertical configs
 */
export function checkVerticalConflicts(
  config1: VerticalConfig,
  config2: VerticalConfig
): ValidationError[] {
  const conflicts: ValidationError[] = [];

  // Check for signal ID conflicts
  const signalIds1 = new Set(
    config1.signal_types?.filter(s => s.id).map(s => s.id) || []
  );
  const signalIds2 = new Set(
    config2.signal_types?.filter(s => s.id).map(s => s.id) || []
  );

  for (const id of signalIds1) {
    if (signalIds2.has(id)) {
      conflicts.push({
        code: 'SIGNAL_ID_CONFLICT',
        field: 'signal_types',
        message: `Signal ID "${id}" exists in both "${config1.slug}" and "${config2.slug}"`,
        severity: 'critical',
      });
    }
  }

  // Check for territory binding conflicts (same territory, different primaries)
  const territories1 = new Map(
    config1.territory_bindings?.map(t => [t.territory_slug, t.is_primary]) || []
  );
  const territories2 = new Map(
    config2.territory_bindings?.map(t => [t.territory_slug, t.is_primary]) || []
  );

  for (const [territory, isPrimary1] of territories1) {
    const isPrimary2 = territories2.get(territory);
    if (isPrimary2 !== undefined && isPrimary1 && isPrimary2) {
      conflicts.push({
        code: 'TERRITORY_PRIMARY_CONFLICT',
        field: 'territory_bindings',
        message: `Territory "${territory}" is marked as primary in both "${config1.slug}" and "${config2.slug}"`,
        severity: 'error',
      });
    }
  }

  return conflicts;
}

/**
 * Validate persona reference exists
 */
export async function validatePersonaRefs(
  personaRefs: string[],
  existingPersonas: Set<string>
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  for (const ref of personaRefs) {
    if (!existingPersonas.has(ref)) {
      errors.push({
        code: 'INVALID_PERSONA_REF',
        field: 'persona_refs',
        message: `Referenced persona "${ref}" does not exist`,
        severity: 'error',
      });
    }
  }

  return errors;
}
