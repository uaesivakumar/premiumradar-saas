-- S269: Auto-Activation Resolver Audit Log
--
-- This table stores all resolver decisions for:
-- 1. Audit trail (who activated what, when)
-- 2. Replay support (debug/investigate past decisions)
-- 3. Analytics (activation patterns, failure reasons)

CREATE TABLE IF NOT EXISTS os_resolver_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Input context
  user_id UUID NOT NULL REFERENCES users(id),
  persona_id UUID REFERENCES os_personas(id),

  -- Resolved context
  user_type VARCHAR(20), -- 'enterprise' | 'individual'

  -- Decision
  reason_code VARCHAR(50) NOT NULL,
  activated BOOLEAN NOT NULL DEFAULT false,

  -- Output (if activated)
  binding_id UUID,
  workspace_id UUID,

  -- Full metadata (for replay)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_resolver_audit_user_id ON os_resolver_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_resolver_audit_persona_id ON os_resolver_audit_log(persona_id);
CREATE INDEX IF NOT EXISTS idx_resolver_audit_reason_code ON os_resolver_audit_log(reason_code);
CREATE INDEX IF NOT EXISTS idx_resolver_audit_created_at ON os_resolver_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resolver_audit_activated ON os_resolver_audit_log(activated);

-- Add owner_user_id to workspaces if not exists (for personal workspaces)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workspaces' AND column_name = 'owner_user_id'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN owner_user_id UUID REFERENCES users(id);
    CREATE INDEX idx_workspaces_owner_user_id ON workspaces(owner_user_id);
  END IF;
END $$;

-- Add tenant_id to os_workspace_bindings if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'os_workspace_bindings' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE os_workspace_bindings ADD COLUMN tenant_id UUID REFERENCES tenants(id);
    CREATE INDEX idx_workspace_bindings_tenant_id ON os_workspace_bindings(tenant_id);
  END IF;
END $$;

COMMENT ON TABLE os_resolver_audit_log IS 'S269: Auto-activation resolver audit trail';
