/**
 * Persona Database Operations (S148 + S148.1)
 *
 * Persists persona configurations with:
 * - Full CRUD operations
 * - Version tracking with rollback
 * - Deprecation instead of immediate delete
 * - Audit logging for SOC2 compliance
 */

import { query, queryOne, insert } from './client';
import {
  validatePersonaConfig,
  validatePersonaUpdate,
  type PersonaConfig,
  type PersonaValidationResult,
} from '@/lib/os/validation/persona-schema';

// =============================================================================
// TYPES
// =============================================================================

export interface PersonaRecord {
  id: string;
  slug: string;
  sub_vertical_id: string;
  sub_vertical_slug: string;
  persona_name: string;
  persona_role: string | null;
  persona_organization: string | null;
  mission_statement: string | null;
  entity_type: 'company' | 'individual' | 'deal';
  contact_priority_rules: Record<string, unknown> | null;
  edge_cases: Record<string, unknown> | null;
  timing_rules: Record<string, unknown> | null;
  outreach_doctrine: Record<string, unknown> | null;
  scoring_config: Record<string, unknown> | null;
  quality_standards: Record<string, unknown> | null;
  anti_patterns: unknown[] | null;
  confidence_gates: Record<string, unknown> | null;
  success_patterns: unknown[] | null;
  failure_patterns: unknown[] | null;
  version: number;
  status: 'active' | 'deprecated' | 'archived';
  is_active: boolean;
  created_by: string | null;
  updated_by: string | null;
  deprecated_at: Date | null;
  deprecated_by: string | null;
  deprecation_reason: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PersonaVersion {
  id: string;
  persona_id: string;
  version: number;
  config: Record<string, unknown>;
  changed_by: string | null;
  change_reason: string | null;
  created_at: Date;
}

export interface PersonaSaveResult {
  success: boolean;
  data?: PersonaRecord;
  validation?: PersonaValidationResult;
  error?: string;
}

// =============================================================================
// SCHEMA
// =============================================================================

export const PERSONA_SCHEMA = `
-- Persona configurations
CREATE TABLE IF NOT EXISTS personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  sub_vertical_id UUID REFERENCES sub_vertical_configs(id) ON DELETE SET NULL,
  sub_vertical_slug VARCHAR(100) NOT NULL,

  -- Identity
  persona_name VARCHAR(255) NOT NULL,
  persona_role VARCHAR(255),
  persona_organization VARCHAR(255),
  mission_statement TEXT,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('company', 'individual', 'deal')),

  -- Targeting
  contact_priority_rules JSONB,
  edge_cases JSONB,

  -- Timing
  timing_rules JSONB,

  -- Outreach
  outreach_doctrine JSONB,

  -- Scoring
  scoring_config JSONB,

  -- Quality
  quality_standards JSONB,

  -- Advanced
  anti_patterns JSONB,
  confidence_gates JSONB,
  success_patterns JSONB,
  failure_patterns JSONB,

  -- Versioning
  version INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'deprecated', 'archived')),
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deprecated_at TIMESTAMPTZ,
  deprecated_by VARCHAR(255),
  deprecation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Persona version history (for rollback)
CREATE TABLE IF NOT EXISTS persona_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  config JSONB NOT NULL,
  changed_by VARCHAR(255),
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(persona_id, version)
);

-- Persona audit log
CREATE TABLE IF NOT EXISTS persona_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID REFERENCES personas(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  actor VARCHAR(255),
  before_state JSONB,
  after_state JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personas_slug ON personas(slug);
CREATE INDEX IF NOT EXISTS idx_personas_sub_vertical ON personas(sub_vertical_slug);
CREATE INDEX IF NOT EXISTS idx_personas_active ON personas(is_active, status);
CREATE INDEX IF NOT EXISTS idx_persona_versions_persona ON persona_versions(persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_audit_persona ON persona_audit_log(persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_audit_created ON persona_audit_log(created_at);
`;

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

/**
 * List all personas
 */
export async function listPersonas(options?: {
  subVerticalSlug?: string;
  activeOnly?: boolean;
  includeDeprecated?: boolean;
}): Promise<PersonaRecord[]> {
  let sql = 'SELECT * FROM personas WHERE 1=1';
  const params: unknown[] = [];
  let paramIndex = 1;

  if (options?.subVerticalSlug) {
    sql += ` AND sub_vertical_slug = $${paramIndex++}`;
    params.push(options.subVerticalSlug);
  }

  if (options?.activeOnly) {
    sql += ' AND is_active = true';
  }

  if (!options?.includeDeprecated) {
    sql += ` AND status != 'deprecated'`;
  }

  sql += ' ORDER BY persona_name ASC';

  return query<PersonaRecord>(sql, params);
}

/**
 * Get persona by slug
 */
export async function getPersona(slug: string): Promise<PersonaRecord | null> {
  return queryOne<PersonaRecord>(
    'SELECT * FROM personas WHERE slug = $1',
    [slug]
  );
}

/**
 * Get persona by ID
 */
export async function getPersonaById(id: string): Promise<PersonaRecord | null> {
  return queryOne<PersonaRecord>(
    'SELECT * FROM personas WHERE id = $1',
    [id]
  );
}

/**
 * Get active persona for a sub-vertical
 */
export async function getActivePersonaForSubVertical(
  subVerticalSlug: string
): Promise<PersonaRecord | null> {
  return queryOne<PersonaRecord>(
    `SELECT * FROM personas
     WHERE sub_vertical_slug = $1 AND is_active = true AND status = 'active'
     ORDER BY version DESC
     LIMIT 1`,
    [subVerticalSlug]
  );
}

/**
 * Create a new persona with validation
 */
export async function createPersona(
  config: PersonaConfig,
  createdBy?: string
): Promise<PersonaSaveResult> {
  // Validate first
  const validation = validatePersonaConfig(config);
  if (!validation.valid) {
    return { success: false, validation, error: 'Validation failed' };
  }

  // Check for duplicate slug
  const existing = await getPersona(config.slug);
  if (existing) {
    return {
      success: false,
      error: `Persona with slug "${config.slug}" already exists`,
    };
  }

  try {
    const record = await insert<PersonaRecord>(
      `INSERT INTO personas (
        slug, sub_vertical_slug, persona_name, persona_role, persona_organization,
        mission_statement, entity_type, contact_priority_rules, edge_cases,
        timing_rules, outreach_doctrine, scoring_config, quality_standards,
        anti_patterns, confidence_gates, success_patterns, failure_patterns,
        version, status, is_active, created_by, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        1, 'active', true, $18, $18
      ) RETURNING *`,
      [
        config.slug,
        config.sub_vertical_slug,
        config.persona_name,
        config.persona_role || null,
        config.persona_organization || null,
        config.mission_statement || null,
        config.entity_type,
        config.contact_priority_rules ? JSON.stringify(config.contact_priority_rules) : null,
        config.edge_cases ? JSON.stringify(config.edge_cases) : null,
        config.timing_rules ? JSON.stringify(config.timing_rules) : null,
        config.outreach_doctrine ? JSON.stringify(config.outreach_doctrine) : null,
        config.scoring_config ? JSON.stringify(config.scoring_config) : null,
        config.quality_standards ? JSON.stringify(config.quality_standards) : null,
        config.anti_patterns ? JSON.stringify(config.anti_patterns) : null,
        config.confidence_gates ? JSON.stringify(config.confidence_gates) : null,
        config.success_patterns ? JSON.stringify(config.success_patterns) : null,
        config.failure_patterns ? JSON.stringify(config.failure_patterns) : null,
        createdBy || null,
      ]
    );

    // Create initial version
    await createPersonaVersion(record.id, 1, personaToConfig(record), createdBy, 'Initial creation');

    // Audit log
    await logPersonaAudit(record.id, 'CREATE', createdBy, null, record);

    return { success: true, data: record, validation };
  } catch (error) {
    console.error('[DB:Persona] Create error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update persona with validation and version increment
 */
export async function updatePersona(
  slug: string,
  updates: Partial<PersonaConfig>,
  updatedBy?: string,
  changeReason?: string
): Promise<PersonaSaveResult> {
  // Get current persona
  const current = await getPersona(slug);
  if (!current) {
    return { success: false, error: `Persona "${slug}" not found` };
  }

  // Merge for validation
  const merged = mergePersonaConfig(current, updates);

  // Validate update
  const validation = validatePersonaUpdate(personaToConfig(current), merged);
  if (!validation.valid) {
    return { success: false, validation, error: 'Validation failed' };
  }

  try {
    const newVersion = current.version + 1;

    const record = await insert<PersonaRecord>(
      `UPDATE personas SET
        persona_name = $1, persona_role = $2, persona_organization = $3,
        mission_statement = $4, entity_type = $5, contact_priority_rules = $6,
        edge_cases = $7, timing_rules = $8, outreach_doctrine = $9,
        scoring_config = $10, quality_standards = $11, anti_patterns = $12,
        confidence_gates = $13, success_patterns = $14, failure_patterns = $15,
        version = $16, updated_by = $17, updated_at = NOW()
       WHERE slug = $18
       RETURNING *`,
      [
        merged.persona_name,
        merged.persona_role || null,
        merged.persona_organization || null,
        merged.mission_statement || null,
        merged.entity_type,
        merged.contact_priority_rules ? JSON.stringify(merged.contact_priority_rules) : null,
        merged.edge_cases ? JSON.stringify(merged.edge_cases) : null,
        merged.timing_rules ? JSON.stringify(merged.timing_rules) : null,
        merged.outreach_doctrine ? JSON.stringify(merged.outreach_doctrine) : null,
        merged.scoring_config ? JSON.stringify(merged.scoring_config) : null,
        merged.quality_standards ? JSON.stringify(merged.quality_standards) : null,
        merged.anti_patterns ? JSON.stringify(merged.anti_patterns) : null,
        merged.confidence_gates ? JSON.stringify(merged.confidence_gates) : null,
        merged.success_patterns ? JSON.stringify(merged.success_patterns) : null,
        merged.failure_patterns ? JSON.stringify(merged.failure_patterns) : null,
        newVersion,
        updatedBy || null,
        slug,
      ]
    );

    // Create version snapshot
    await createPersonaVersion(record.id, newVersion, merged, updatedBy, changeReason);

    // Audit log
    await logPersonaAudit(record.id, 'UPDATE', updatedBy, current, record, { change_reason: changeReason });

    return { success: true, data: record, validation };
  } catch (error) {
    console.error('[DB:Persona] Update error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Deprecate persona (soft delete - does NOT delete immediately)
 * Old persona remains available for rollback
 */
export async function deprecatePersona(
  slug: string,
  deprecatedBy?: string,
  reason?: string
): Promise<PersonaSaveResult> {
  const current = await getPersona(slug);
  if (!current) {
    return { success: false, error: `Persona "${slug}" not found` };
  }

  if (current.status === 'deprecated') {
    return { success: false, error: `Persona "${slug}" is already deprecated` };
  }

  try {
    const record = await insert<PersonaRecord>(
      `UPDATE personas SET
        status = 'deprecated',
        is_active = false,
        deprecated_at = NOW(),
        deprecated_by = $1,
        deprecation_reason = $2,
        updated_by = $1,
        updated_at = NOW()
       WHERE slug = $3
       RETURNING *`,
      [deprecatedBy || null, reason || null, slug]
    );

    // Audit log
    await logPersonaAudit(record.id, 'DEPRECATE', deprecatedBy, current, record, { reason });

    return { success: true, data: record };
  } catch (error) {
    console.error('[DB:Persona] Deprecate error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Reactivate a deprecated persona
 */
export async function reactivatePersona(
  slug: string,
  reactivatedBy?: string
): Promise<PersonaSaveResult> {
  const current = await getPersona(slug);
  if (!current) {
    return { success: false, error: `Persona "${slug}" not found` };
  }

  if (current.status !== 'deprecated') {
    return { success: false, error: `Persona "${slug}" is not deprecated` };
  }

  try {
    const record = await insert<PersonaRecord>(
      `UPDATE personas SET
        status = 'active',
        is_active = true,
        deprecated_at = NULL,
        deprecated_by = NULL,
        deprecation_reason = NULL,
        updated_by = $1,
        updated_at = NOW()
       WHERE slug = $2
       RETURNING *`,
      [reactivatedBy || null, slug]
    );

    // Audit log
    await logPersonaAudit(record.id, 'REACTIVATE', reactivatedBy, current, record);

    return { success: true, data: record };
  } catch (error) {
    console.error('[DB:Persona] Reactivate error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Archive persona (final state - cannot be rolled back)
 */
export async function archivePersona(
  slug: string,
  archivedBy?: string
): Promise<{ success: boolean; error?: string }> {
  const current = await getPersona(slug);
  if (!current) {
    return { success: false, error: `Persona "${slug}" not found` };
  }

  try {
    await query(
      `UPDATE personas SET
        status = 'archived',
        is_active = false,
        updated_by = $1,
        updated_at = NOW()
       WHERE slug = $2`,
      [archivedBy || null, slug]
    );

    // Audit log
    await logPersonaAudit(current.id, 'ARCHIVE', archivedBy, current, null);

    return { success: true };
  } catch (error) {
    console.error('[DB:Persona] Archive error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// VERSION MANAGEMENT (S148.1)
// =============================================================================

/**
 * Create a version snapshot
 */
async function createPersonaVersion(
  personaId: string,
  version: number,
  config: PersonaConfig,
  changedBy?: string,
  changeReason?: string
): Promise<void> {
  await insert(
    `INSERT INTO persona_versions
     (persona_id, version, config, changed_by, change_reason)
     VALUES ($1, $2, $3, $4, $5)`,
    [personaId, version, JSON.stringify(config), changedBy || null, changeReason || null]
  );
}

/**
 * Get version history for a persona
 */
export async function getPersonaVersionHistory(
  slug: string,
  limit = 10
): Promise<PersonaVersion[]> {
  return query<PersonaVersion>(
    `SELECT v.* FROM persona_versions v
     JOIN personas p ON v.persona_id = p.id
     WHERE p.slug = $1
     ORDER BY v.version DESC
     LIMIT $2`,
    [slug, limit]
  );
}

/**
 * Get a specific version of a persona
 */
export async function getPersonaVersion(
  slug: string,
  version: number
): Promise<PersonaVersion | null> {
  return queryOne<PersonaVersion>(
    `SELECT v.* FROM persona_versions v
     JOIN personas p ON v.persona_id = p.id
     WHERE p.slug = $1 AND v.version = $2`,
    [slug, version]
  );
}

/**
 * Rollback to a specific version
 */
export async function rollbackPersonaToVersion(
  slug: string,
  targetVersion: number,
  rolledBackBy?: string
): Promise<PersonaSaveResult> {
  const current = await getPersona(slug);
  if (!current) {
    return { success: false, error: `Persona "${slug}" not found` };
  }

  // Get target version
  const versionRecord = await getPersonaVersion(slug, targetVersion);
  if (!versionRecord) {
    return { success: false, error: `Version ${targetVersion} not found for persona "${slug}"` };
  }

  const targetConfig = versionRecord.config as unknown as PersonaConfig;

  // Apply rollback as a new update
  return updatePersona(
    slug,
    targetConfig,
    rolledBackBy,
    `Rollback to version ${targetVersion}`
  );
}

/**
 * Compare two versions
 */
export async function comparePersonaVersions(
  slug: string,
  version1: number,
  version2: number
): Promise<{
  version1: PersonaVersion | null;
  version2: PersonaVersion | null;
  differences: string[];
}> {
  const [v1, v2] = await Promise.all([
    getPersonaVersion(slug, version1),
    getPersonaVersion(slug, version2),
  ]);

  const differences: string[] = [];

  if (v1 && v2) {
    const config1 = v1.config as Record<string, unknown>;
    const config2 = v2.config as Record<string, unknown>;

    // Compare top-level keys
    const allKeys = new Set([...Object.keys(config1), ...Object.keys(config2)]);
    for (const key of allKeys) {
      const val1 = JSON.stringify(config1[key]);
      const val2 = JSON.stringify(config2[key]);
      if (val1 !== val2) {
        differences.push(key);
      }
    }
  }

  return { version1: v1, version2: v2, differences };
}

// =============================================================================
// HELPERS
// =============================================================================

function personaToConfig(record: PersonaRecord): PersonaConfig {
  return {
    slug: record.slug,
    sub_vertical_slug: record.sub_vertical_slug,
    persona_name: record.persona_name,
    persona_role: record.persona_role || undefined,
    persona_organization: record.persona_organization || undefined,
    mission_statement: record.mission_statement || undefined,
    entity_type: record.entity_type,
    contact_priority_rules: record.contact_priority_rules as unknown as PersonaConfig['contact_priority_rules'],
    edge_cases: record.edge_cases as unknown as PersonaConfig['edge_cases'],
    timing_rules: record.timing_rules as unknown as PersonaConfig['timing_rules'],
    outreach_doctrine: record.outreach_doctrine as unknown as PersonaConfig['outreach_doctrine'],
    scoring_config: record.scoring_config as unknown as PersonaConfig['scoring_config'],
    quality_standards: record.quality_standards as unknown as PersonaConfig['quality_standards'],
    anti_patterns: record.anti_patterns as unknown as PersonaConfig['anti_patterns'],
    confidence_gates: record.confidence_gates as unknown as PersonaConfig['confidence_gates'],
    success_patterns: record.success_patterns as unknown as PersonaConfig['success_patterns'],
    failure_patterns: record.failure_patterns as unknown as PersonaConfig['failure_patterns'],
    version: record.version,
    is_active: record.is_active,
  };
}

function mergePersonaConfig(
  current: PersonaRecord,
  updates: Partial<PersonaConfig>
): PersonaConfig {
  return {
    slug: current.slug,
    sub_vertical_slug: updates.sub_vertical_slug ?? current.sub_vertical_slug,
    persona_name: updates.persona_name ?? current.persona_name,
    persona_role: updates.persona_role ?? current.persona_role ?? undefined,
    persona_organization: updates.persona_organization ?? current.persona_organization ?? undefined,
    mission_statement: updates.mission_statement ?? current.mission_statement ?? undefined,
    entity_type: updates.entity_type ?? current.entity_type,
    contact_priority_rules: updates.contact_priority_rules ?? (current.contact_priority_rules as unknown as PersonaConfig['contact_priority_rules']),
    edge_cases: updates.edge_cases ?? (current.edge_cases as unknown as PersonaConfig['edge_cases']),
    timing_rules: updates.timing_rules ?? (current.timing_rules as unknown as PersonaConfig['timing_rules']),
    outreach_doctrine: updates.outreach_doctrine ?? (current.outreach_doctrine as unknown as PersonaConfig['outreach_doctrine']),
    scoring_config: updates.scoring_config ?? (current.scoring_config as unknown as PersonaConfig['scoring_config']),
    quality_standards: updates.quality_standards ?? (current.quality_standards as unknown as PersonaConfig['quality_standards']),
    anti_patterns: updates.anti_patterns ?? (current.anti_patterns as unknown as PersonaConfig['anti_patterns']),
    confidence_gates: updates.confidence_gates ?? (current.confidence_gates as unknown as PersonaConfig['confidence_gates']),
    success_patterns: updates.success_patterns ?? (current.success_patterns as unknown as PersonaConfig['success_patterns']),
    failure_patterns: updates.failure_patterns ?? (current.failure_patterns as unknown as PersonaConfig['failure_patterns']),
  };
}

// =============================================================================
// AUDIT LOGGING
// =============================================================================

async function logPersonaAudit(
  personaId: string,
  action: string,
  actor: string | undefined,
  beforeState: unknown,
  afterState: unknown,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await insert(
      `INSERT INTO persona_audit_log
       (persona_id, action, actor, before_state, after_state, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        personaId,
        action,
        actor || null,
        beforeState ? JSON.stringify(beforeState) : null,
        afterState ? JSON.stringify(afterState) : null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  } catch (error) {
    console.error('[DB:Persona] Audit log error:', error);
    // Don't throw - audit log failure shouldn't break operations
  }
}

/**
 * Get audit log for a persona
 */
export async function getPersonaAuditLog(
  slug: string,
  limit = 50
): Promise<Array<{
  id: string;
  action: string;
  actor: string | null;
  before_state: unknown;
  after_state: unknown;
  metadata: unknown;
  created_at: Date;
}>> {
  return query(
    `SELECT a.* FROM persona_audit_log a
     JOIN personas p ON a.persona_id = p.id
     WHERE p.slug = $1
     ORDER BY a.created_at DESC
     LIMIT $2`,
    [slug, limit]
  );
}
