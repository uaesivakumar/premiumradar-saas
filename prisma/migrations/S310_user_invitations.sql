-- S310: User Invitations Table
-- Part of User & Enterprise Management Program v1.1
-- Phase D - Frontend & UI
--
-- Table for tracking user invitations

-- User Invitations Table
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'ENTERPRISE_USER',
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  invite_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enterprise_id, email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_invitations_enterprise ON user_invitations(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(invite_token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires ON user_invitations(expires_at) WHERE accepted_at IS NULL;

-- RLS Policy for user_invitations
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Enterprise admins can manage invitations
CREATE POLICY user_invitations_admin_policy ON user_invitations
  FOR ALL
  USING (
    enterprise_id = get_current_enterprise_id()
    AND (is_enterprise_admin() OR is_super_admin())
  )
  WITH CHECK (
    enterprise_id = get_current_enterprise_id()
    AND (is_enterprise_admin() OR is_super_admin())
  );

-- Comment
COMMENT ON TABLE user_invitations IS 'S310: Pending user invitations for enterprise membership';
