/**
 * S253: User Preference Layer v0.1 (UPL)
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

-- ============================================================
-- USER PREFERENCES TABLE (LEAF-ONLY LAYER)
-- ============================================================

CREATE TABLE IF NOT EXISTS os_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scope (per-user per-workspace)
  tenant_id UUID NOT NULL,
  workspace_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,

  -- Preferences (JSONB for flexibility)
  -- v0.1 Schema:
  -- {
  --   "verbosity": "low|medium|high",
  --   "evidence_depth": "summary|detailed",
  --   "automation_level": "assist|recommend|auto",
  --   "risk_tolerance": "conservative|balanced|aggressive",
  --   "notification_pref": { "email": true, "in_app": true }
  -- }
  prefs JSONB NOT NULL DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one row per user per workspace per tenant
  CONSTRAINT os_user_preferences_unique UNIQUE (tenant_id, workspace_id, user_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Primary lookup: tenant + workspace (for workspace-scoped queries)
CREATE INDEX idx_os_user_prefs_tenant_workspace
  ON os_user_preferences(tenant_id, workspace_id);

-- Secondary lookup: tenant + user (for user-scoped queries across workspaces)
CREATE INDEX idx_os_user_prefs_tenant_user
  ON os_user_preferences(tenant_id, user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION update_os_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_os_user_preferences_updated_at
  BEFORE UPDATE ON os_user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_os_user_preferences_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (TENANT ISOLATION)
-- ============================================================

ALTER TABLE os_user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see preferences in their tenant
CREATE POLICY os_user_prefs_tenant_isolation ON os_user_preferences
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE os_user_preferences IS
  'UPL v0.1: User Preference Layer. Leaf-only soft overrides (tone, depth, pacing). Policy wins on conflict.';

COMMENT ON COLUMN os_user_preferences.prefs IS
  'JSONB preferences: verbosity, evidence_depth, automation_level, risk_tolerance, notification_pref';

COMMENT ON COLUMN os_user_preferences.workspace_id IS
  'Workspace scope - same user can have different prefs per workspace';
