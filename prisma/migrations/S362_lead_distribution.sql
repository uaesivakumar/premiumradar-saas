-- S362: Lead Distribution Schema
-- Behavior Contract B013: Leads distributed fairly with explanation
--
-- Tracks team members, lead assignments, and distribution metrics.

-- Team members table (assignment targets)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  territories TEXT[] DEFAULT '{}',
  verticals TEXT[] DEFAULT '{}',
  sub_verticals TEXT[] DEFAULT '{}',
  max_capacity INTEGER DEFAULT 50,
  current_load INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0.1,
  is_active BOOLEAN DEFAULT true,
  last_assigned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT fk_team_members_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_team_members_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,

  -- Unique user per tenant
  CONSTRAINT uq_team_members_user UNIQUE (tenant_id, user_id)
);

-- Lead assignments table
CREATE TABLE IF NOT EXISTS lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  user_id UUID NOT NULL,
  distribution_factors JSONB DEFAULT '{}',
  is_reassignment BOOLEAN DEFAULT false,
  reassignment_reason TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT fk_lead_assignments_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_lead_assignments_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_members_tenant_active
  ON team_members(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_team_members_territories
  ON team_members USING GIN(territories);

CREATE INDEX IF NOT EXISTS idx_lead_assignments_tenant_user
  ON lead_assignments(tenant_id, user_id, assigned_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead
  ON lead_assignments(lead_id, assigned_at DESC);

-- Distribution fairness view
CREATE OR REPLACE VIEW distribution_fairness AS
SELECT
  tenant_id,
  user_id,
  COUNT(*) as total_assigned,
  COUNT(*) FILTER (WHERE assigned_at > NOW() - INTERVAL '7 days') as last_7_days,
  COUNT(*) FILTER (WHERE assigned_at > NOW() - INTERVAL '24 hours') as last_24_hours,
  MAX(assigned_at) as last_assignment
FROM lead_assignments
WHERE assigned_at > NOW() - INTERVAL '30 days'
GROUP BY tenant_id, user_id;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_team_members_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_team_members_updated_at ON team_members;
CREATE TRIGGER tr_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_team_members_timestamp();

-- Comment
COMMENT ON TABLE team_members IS 'S362: Team members available for lead distribution';
COMMENT ON TABLE lead_assignments IS 'S362: Audit trail of lead assignments with factors';
