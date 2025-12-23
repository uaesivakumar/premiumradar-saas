/**
 * User Preference Layer (UPL) v0.1
 *
 * GUARDRAILS (NON-NEGOTIABLE):
 * 1. No changes to: os_verticals, os_sub_verticals, os_personas,
 *    os_persona_policies, os_workspace_bindings
 * 2. UPL is LEAF-ONLY - soft overrides for tone, depth, pacing
 * 3. Policy wins silently on conflict
 * 4. Per-user per-workspace scoping
 * 5. Defaults always exist (no null preference state)
 *
 * Authorization Code: S253-UPL-V01-20251223
 */

import { queryOne, insert, getPool } from './client';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface NotificationPrefs {
  email: boolean;
  in_app: boolean;
}

export interface UserPreferences {
  verbosity: 'low' | 'medium' | 'high';
  evidence_depth: 'summary' | 'detailed';
  automation_level: 'assist' | 'recommend' | 'auto';
  risk_tolerance: 'conservative' | 'balanced' | 'aggressive';
  notification_pref: NotificationPrefs;
}

export interface UserPreferencesRow {
  id: string;
  tenant_id: string;
  workspace_id: string;
  user_id: string;
  prefs: Partial<UserPreferences>;
  created_at: Date;
  updated_at: Date;
}

export type PreferenceSource = 'DEFAULT' | 'DB';

export interface ResolvedPreferences {
  prefs: UserPreferences;
  source: PreferenceSource;
}

// ============================================================
// DEFAULT PREFERENCES (SERVER-SIDE CONSTANT)
// ============================================================

/**
 * Default preferences - always returned when no DB row exists.
 * Ensures no "null preference" state in runtime.
 */
export const DEFAULT_PREFS: UserPreferences = {
  verbosity: 'medium',
  evidence_depth: 'summary',
  automation_level: 'assist',
  risk_tolerance: 'balanced',
  notification_pref: {
    email: true,
    in_app: true,
  },
};

// ============================================================
// ALLOWED KEYS WHITELIST
// ============================================================

/**
 * Hard whitelist of allowed preference keys.
 * Rejects unknown keys to avoid prefs becoming a dumping ground.
 */
export const ALLOWED_PREF_KEYS: (keyof UserPreferences)[] = [
  'verbosity',
  'evidence_depth',
  'automation_level',
  'risk_tolerance',
  'notification_pref',
];

// ============================================================
// ENUM VALIDATORS
// ============================================================

const VALID_VERBOSITY = ['low', 'medium', 'high'] as const;
const VALID_EVIDENCE_DEPTH = ['summary', 'detailed'] as const;
const VALID_AUTOMATION_LEVEL = ['assist', 'recommend', 'auto'] as const;
const VALID_RISK_TOLERANCE = ['conservative', 'balanced', 'aggressive'] as const;

/**
 * Validate preferences against allowed enums.
 * Returns null if valid, or error message if invalid.
 */
export function validatePreferences(prefs: Partial<UserPreferences>): string | null {
  // Check for unknown keys
  const unknownKeys = Object.keys(prefs).filter(
    (key) => !ALLOWED_PREF_KEYS.includes(key as keyof UserPreferences)
  );
  if (unknownKeys.length > 0) {
    return `Unknown preference keys: ${unknownKeys.join(', ')}`;
  }

  // Validate enums
  if (prefs.verbosity && !VALID_VERBOSITY.includes(prefs.verbosity)) {
    return `Invalid verbosity: ${prefs.verbosity}. Must be one of: ${VALID_VERBOSITY.join(', ')}`;
  }

  if (prefs.evidence_depth && !VALID_EVIDENCE_DEPTH.includes(prefs.evidence_depth)) {
    return `Invalid evidence_depth: ${prefs.evidence_depth}. Must be one of: ${VALID_EVIDENCE_DEPTH.join(', ')}`;
  }

  if (prefs.automation_level && !VALID_AUTOMATION_LEVEL.includes(prefs.automation_level)) {
    return `Invalid automation_level: ${prefs.automation_level}. Must be one of: ${VALID_AUTOMATION_LEVEL.join(', ')}`;
  }

  if (prefs.risk_tolerance && !VALID_RISK_TOLERANCE.includes(prefs.risk_tolerance)) {
    return `Invalid risk_tolerance: ${prefs.risk_tolerance}. Must be one of: ${VALID_RISK_TOLERANCE.join(', ')}`;
  }

  // Validate notification_pref structure
  if (prefs.notification_pref !== undefined) {
    if (typeof prefs.notification_pref !== 'object' || prefs.notification_pref === null) {
      return 'notification_pref must be an object';
    }
    const np = prefs.notification_pref;
    if (np.email !== undefined && typeof np.email !== 'boolean') {
      return 'notification_pref.email must be a boolean';
    }
    if (np.in_app !== undefined && typeof np.in_app !== 'boolean') {
      return 'notification_pref.in_app must be a boolean';
    }
  }

  return null;
}

// ============================================================
// MERGE LOGIC
// ============================================================

/**
 * Merge saved preferences with defaults.
 * Partial prefs are merged with DEFAULT_PREFS to ensure complete object.
 */
export function mergeWithDefaults(saved: Partial<UserPreferences>): UserPreferences {
  return {
    verbosity: saved.verbosity ?? DEFAULT_PREFS.verbosity,
    evidence_depth: saved.evidence_depth ?? DEFAULT_PREFS.evidence_depth,
    automation_level: saved.automation_level ?? DEFAULT_PREFS.automation_level,
    risk_tolerance: saved.risk_tolerance ?? DEFAULT_PREFS.risk_tolerance,
    notification_pref: {
      email: saved.notification_pref?.email ?? DEFAULT_PREFS.notification_pref.email,
      in_app: saved.notification_pref?.in_app ?? DEFAULT_PREFS.notification_pref.in_app,
    },
  };
}

// ============================================================
// DATABASE OPERATIONS
// ============================================================

/**
 * Get user preferences from database.
 * Returns null if no row exists.
 */
export async function getUserPreferencesFromDB(
  tenantId: string,
  workspaceId: string,
  userId: string
): Promise<UserPreferencesRow | null> {
  return queryOne<UserPreferencesRow>(
    `SELECT id, tenant_id, workspace_id, user_id, prefs, created_at, updated_at
     FROM os_user_preferences
     WHERE tenant_id = $1 AND workspace_id = $2 AND user_id = $3`,
    [tenantId, workspaceId, userId]
  );
}

/**
 * Upsert user preferences.
 * Inserts new row or updates existing row on conflict.
 */
export async function upsertUserPreferences(
  tenantId: string,
  workspaceId: string,
  userId: string,
  prefs: Partial<UserPreferences>
): Promise<UserPreferencesRow> {
  // Merge with existing prefs if updating
  const existing = await getUserPreferencesFromDB(tenantId, workspaceId, userId);
  const mergedPrefs = existing
    ? { ...existing.prefs, ...prefs }
    : prefs;

  return insert<UserPreferencesRow>(
    `INSERT INTO os_user_preferences (tenant_id, workspace_id, user_id, prefs)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (tenant_id, workspace_id, user_id)
     DO UPDATE SET prefs = $4, updated_at = NOW()
     RETURNING id, tenant_id, workspace_id, user_id, prefs, created_at, updated_at`,
    [tenantId, workspaceId, userId, JSON.stringify(mergedPrefs)]
  );
}

// ============================================================
// MAIN RESOLUTION FUNCTION
// ============================================================

/**
 * Get resolved user preferences.
 * This is the ONLY function that should be used to get preferences.
 *
 * GUARANTEES:
 * - Always returns complete UserPreferences (no null values)
 * - Merges DB prefs with DEFAULT_PREFS
 * - Returns source = 'DEFAULT' if no DB row exists
 * - Returns source = 'DB' if DB row exists
 */
export async function getResolvedUserPrefs(params: {
  tenantId: string;
  workspaceId: string;
  userId: string;
}): Promise<ResolvedPreferences> {
  const { tenantId, workspaceId, userId } = params;

  try {
    const row = await getUserPreferencesFromDB(tenantId, workspaceId, userId);

    if (!row) {
      // No DB row - return defaults
      return {
        prefs: { ...DEFAULT_PREFS },
        source: 'DEFAULT',
      };
    }

    // Merge DB prefs with defaults
    return {
      prefs: mergeWithDefaults(row.prefs),
      source: 'DB',
    };
  } catch (error) {
    // On error, return defaults (fail-safe)
    console.error('[UPL] Error reading preferences, using defaults:', error);
    return {
      prefs: { ...DEFAULT_PREFS },
      source: 'DEFAULT',
    };
  }
}

// ============================================================
// TABLE EXISTENCE CHECK
// ============================================================

/**
 * Check if os_user_preferences table exists.
 * Useful for graceful degradation before migration.
 */
export async function userPreferencesTableExists(): Promise<boolean> {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'os_user_preferences'
      ) as exists
    `);
    return result.rows[0]?.exists ?? false;
  } catch {
    return false;
  }
}
