/**
 * Vertical Configuration Database Operations (S147)
 *
 * Persists vertical configurations locally with:
 * - Schema validation before save
 * - Version tracking
 * - Conflict detection
 * - Audit logging
 */

import { query, queryOne, insert } from './client';
import {
  validateVerticalConfig,
  validateVerticalUpdate,
  type VerticalConfig,
  type ValidationResult,
} from '@/lib/os/validation/vertical-schema';

// =============================================================================
// TYPES
// =============================================================================

export interface VerticalConfigRecord {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  config: Record<string, unknown>;
  version: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface VerticalConfigVersion {
  id: string;
  vertical_id: string;
  version: number;
  config: Record<string, unknown>;
  changed_by: string | null;
  change_reason: string | null;
  created_at: Date;
}

export interface SaveResult {
  success: boolean;
  data?: VerticalConfigRecord;
  validation?: ValidationResult;
  error?: string;
}

// =============================================================================
// SCHEMA (Run this to create tables)
// =============================================================================

export const SCHEMA = `
-- Vertical configurations (local persistence)
CREATE TABLE IF NOT EXISTS vertical_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Version history for rollback
CREATE TABLE IF NOT EXISTS vertical_config_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical_id UUID REFERENCES vertical_configs(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  config JSONB NOT NULL,
  changed_by VARCHAR(255),
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vertical_id, version)
);

-- Sub-vertical configurations
CREATE TABLE IF NOT EXISTS sub_vertical_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical_id UUID REFERENCES vertical_configs(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  persona_id UUID,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vertical_id, slug)
);

-- Signal type configurations per vertical
CREATE TABLE IF NOT EXISTS signal_type_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical_id UUID REFERENCES vertical_configs(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  weight DECIMAL(4,3) DEFAULT 0.5,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vertical_id, slug)
);

-- Audit log for all config changes
CREATE TABLE IF NOT EXISTS vertical_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical_id UUID REFERENCES vertical_configs(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  actor VARCHAR(255),
  before_state JSONB,
  after_state JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vertical_configs_slug ON vertical_configs(slug);
CREATE INDEX IF NOT EXISTS idx_vertical_configs_active ON vertical_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_sub_vertical_configs_vertical ON sub_vertical_configs(vertical_id);
CREATE INDEX IF NOT EXISTS idx_signal_type_configs_vertical ON signal_type_configs(vertical_id);
CREATE INDEX IF NOT EXISTS idx_vertical_audit_vertical ON vertical_audit_log(vertical_id);
CREATE INDEX IF NOT EXISTS idx_vertical_audit_created ON vertical_audit_log(created_at);
`;

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

/**
 * List all vertical configs
 */
export async function listVerticals(options?: {
  activeOnly?: boolean;
  includeSubVerticals?: boolean;
}): Promise<VerticalConfigRecord[]> {
  let sql = 'SELECT * FROM vertical_configs';
  const params: unknown[] = [];

  if (options?.activeOnly) {
    sql += ' WHERE is_active = true';
  }

  sql += ' ORDER BY name ASC';

  return query<VerticalConfigRecord>(sql, params);
}

/**
 * Get vertical config by slug
 */
export async function getVertical(slug: string): Promise<VerticalConfigRecord | null> {
  return queryOne<VerticalConfigRecord>(
    'SELECT * FROM vertical_configs WHERE slug = $1',
    [slug]
  );
}

/**
 * Get vertical config by ID
 */
export async function getVerticalById(id: string): Promise<VerticalConfigRecord | null> {
  return queryOne<VerticalConfigRecord>(
    'SELECT * FROM vertical_configs WHERE id = $1',
    [id]
  );
}

/**
 * Create a new vertical config with validation
 */
export async function createVertical(
  config: VerticalConfig,
  createdBy?: string
): Promise<SaveResult> {
  // Validate first
  const validation = validateVerticalConfig(config);
  if (!validation.valid) {
    return { success: false, validation, error: 'Validation failed' };
  }

  // Check for duplicate slug
  const existing = await getVertical(config.slug);
  if (existing) {
    return {
      success: false,
      error: `Vertical with slug "${config.slug}" already exists`,
    };
  }

  try {
    const record = await insert<VerticalConfigRecord>(
      `INSERT INTO vertical_configs
       (slug, name, description, icon, color, is_active, config, version, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8, $8)
       RETURNING *`,
      [
        config.slug,
        config.name,
        config.description || null,
        config.icon || null,
        config.color || null,
        config.is_active ?? true,
        JSON.stringify(config.config || {}),
        createdBy || null,
      ]
    );

    // Create initial version
    await createVersion(record.id, 1, config.config || {}, createdBy, 'Initial creation');

    // Audit log
    await logAudit(record.id, 'CREATE', createdBy, null, record);

    return { success: true, data: record, validation };
  } catch (error) {
    console.error('[DB:VerticalConfig] Create error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update vertical config with validation
 */
export async function updateVertical(
  slug: string,
  updates: Partial<VerticalConfig>,
  updatedBy?: string,
  changeReason?: string
): Promise<SaveResult> {
  // Get current config
  const current = await getVertical(slug);
  if (!current) {
    return { success: false, error: `Vertical "${slug}" not found` };
  }

  // Merge current with updates for validation
  const merged: VerticalConfig = {
    slug: current.slug,
    name: updates.name ?? current.name,
    description: updates.description ?? current.description ?? undefined,
    icon: updates.icon ?? current.icon ?? undefined,
    color: updates.color ?? current.color ?? undefined,
    is_active: updates.is_active ?? current.is_active,
    config: updates.config ?? current.config,
  };

  // Validate update
  const validation = validateVerticalUpdate(
    { slug: current.slug, name: current.name, config: current.config },
    merged
  );
  if (!validation.valid) {
    return { success: false, validation, error: 'Validation failed' };
  }

  try {
    const newVersion = current.version + 1;

    const record = await insert<VerticalConfigRecord>(
      `UPDATE vertical_configs
       SET name = $1, description = $2, icon = $3, color = $4,
           is_active = $5, config = $6, version = $7,
           updated_by = $8, updated_at = NOW()
       WHERE slug = $9
       RETURNING *`,
      [
        merged.name,
        merged.description || null,
        merged.icon || null,
        merged.color || null,
        merged.is_active,
        JSON.stringify(merged.config || {}),
        newVersion,
        updatedBy || null,
        slug,
      ]
    );

    // Create version snapshot
    await createVersion(record.id, newVersion, merged.config || {}, updatedBy, changeReason);

    // Audit log
    await logAudit(record.id, 'UPDATE', updatedBy, current, record);

    return { success: true, data: record, validation };
  } catch (error) {
    console.error('[DB:VerticalConfig] Update error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete vertical config (soft delete by default)
 */
export async function deleteVertical(
  slug: string,
  deletedBy?: string,
  hardDelete = false
): Promise<{ success: boolean; error?: string }> {
  const current = await getVertical(slug);
  if (!current) {
    return { success: false, error: `Vertical "${slug}" not found` };
  }

  try {
    if (hardDelete) {
      await query('DELETE FROM vertical_configs WHERE slug = $1', [slug]);
    } else {
      await query(
        'UPDATE vertical_configs SET is_active = false, updated_by = $1, updated_at = NOW() WHERE slug = $2',
        [deletedBy || null, slug]
      );
    }

    // Audit log
    await logAudit(current.id, hardDelete ? 'HARD_DELETE' : 'SOFT_DELETE', deletedBy, current, null);

    return { success: true };
  } catch (error) {
    console.error('[DB:VerticalConfig] Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// VERSION MANAGEMENT
// =============================================================================

/**
 * Create a version snapshot
 */
async function createVersion(
  verticalId: string,
  version: number,
  config: Record<string, unknown>,
  changedBy?: string,
  changeReason?: string
): Promise<void> {
  await insert(
    `INSERT INTO vertical_config_versions
     (vertical_id, version, config, changed_by, change_reason)
     VALUES ($1, $2, $3, $4, $5)`,
    [verticalId, version, JSON.stringify(config), changedBy || null, changeReason || null]
  );
}

/**
 * Get version history for a vertical
 */
export async function getVersionHistory(
  slug: string,
  limit = 10
): Promise<VerticalConfigVersion[]> {
  return query<VerticalConfigVersion>(
    `SELECT v.* FROM vertical_config_versions v
     JOIN vertical_configs c ON v.vertical_id = c.id
     WHERE c.slug = $1
     ORDER BY v.version DESC
     LIMIT $2`,
    [slug, limit]
  );
}

/**
 * Rollback to a specific version
 */
export async function rollbackToVersion(
  slug: string,
  version: number,
  rolledBackBy?: string
): Promise<SaveResult> {
  const current = await getVertical(slug);
  if (!current) {
    return { success: false, error: `Vertical "${slug}" not found` };
  }

  // Get target version
  const targetVersion = await queryOne<VerticalConfigVersion>(
    `SELECT v.* FROM vertical_config_versions v
     JOIN vertical_configs c ON v.vertical_id = c.id
     WHERE c.slug = $1 AND v.version = $2`,
    [slug, version]
  );

  if (!targetVersion) {
    return { success: false, error: `Version ${version} not found for "${slug}"` };
  }

  // Apply rollback as a new update
  return updateVertical(
    slug,
    { config: targetVersion.config },
    rolledBackBy,
    `Rollback to version ${version}`
  );
}

// =============================================================================
// SUB-VERTICALS
// =============================================================================

export interface SubVerticalRecord {
  id: string;
  vertical_id: string;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  persona_id: string | null;
  config: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

/**
 * Get sub-verticals for a vertical
 */
export async function getSubVerticals(verticalSlug: string): Promise<SubVerticalRecord[]> {
  return query<SubVerticalRecord>(
    `SELECT s.* FROM sub_vertical_configs s
     JOIN vertical_configs v ON s.vertical_id = v.id
     WHERE v.slug = $1
     ORDER BY s.name ASC`,
    [verticalSlug]
  );
}

/**
 * Create sub-vertical
 */
export async function createSubVertical(
  verticalSlug: string,
  subVertical: {
    slug: string;
    name: string;
    description?: string;
    is_active?: boolean;
    persona_id?: string;
    config?: Record<string, unknown>;
  }
): Promise<SubVerticalRecord | null> {
  const vertical = await getVertical(verticalSlug);
  if (!vertical) return null;

  return insert<SubVerticalRecord>(
    `INSERT INTO sub_vertical_configs
     (vertical_id, slug, name, description, is_active, persona_id, config)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      vertical.id,
      subVertical.slug,
      subVertical.name,
      subVertical.description || null,
      subVertical.is_active ?? true,
      subVertical.persona_id || null,
      JSON.stringify(subVertical.config || {}),
    ]
  );
}

/**
 * Update sub-vertical
 */
export async function updateSubVertical(
  verticalSlug: string,
  subVerticalSlug: string,
  updates: Partial<{
    name: string;
    description: string;
    is_active: boolean;
    persona_id: string;
    config: Record<string, unknown>;
  }>
): Promise<SubVerticalRecord | null> {
  return queryOne<SubVerticalRecord>(
    `UPDATE sub_vertical_configs s
     SET name = COALESCE($1, s.name),
         description = COALESCE($2, s.description),
         is_active = COALESCE($3, s.is_active),
         persona_id = COALESCE($4, s.persona_id),
         config = COALESCE($5, s.config),
         updated_at = NOW()
     FROM vertical_configs v
     WHERE s.vertical_id = v.id
       AND v.slug = $6
       AND s.slug = $7
     RETURNING s.*`,
    [
      updates.name || null,
      updates.description || null,
      updates.is_active ?? null,
      updates.persona_id || null,
      updates.config ? JSON.stringify(updates.config) : null,
      verticalSlug,
      subVerticalSlug,
    ]
  );
}

// =============================================================================
// SIGNAL TYPES
// =============================================================================

export interface SignalTypeRecord {
  id: string;
  vertical_id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  weight: number;
  is_active: boolean;
  config: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

/**
 * Get signal types for a vertical
 */
export async function getSignalTypes(verticalSlug: string): Promise<SignalTypeRecord[]> {
  return query<SignalTypeRecord>(
    `SELECT st.* FROM signal_type_configs st
     JOIN vertical_configs v ON st.vertical_id = v.id
     WHERE v.slug = $1
     ORDER BY st.category, st.name ASC`,
    [verticalSlug]
  );
}

// =============================================================================
// AUDIT LOGGING
// =============================================================================

async function logAudit(
  verticalId: string,
  action: string,
  actor: string | undefined,
  beforeState: unknown,
  afterState: unknown,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await insert(
      `INSERT INTO vertical_audit_log
       (vertical_id, action, actor, before_state, after_state, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        verticalId,
        action,
        actor || null,
        beforeState ? JSON.stringify(beforeState) : null,
        afterState ? JSON.stringify(afterState) : null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  } catch (error) {
    console.error('[DB:VerticalConfig] Audit log error:', error);
    // Don't throw - audit log failure shouldn't break operations
  }
}
