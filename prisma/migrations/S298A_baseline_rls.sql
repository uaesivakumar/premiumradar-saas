-- S298A: Baseline RLS Policies
-- Part of User & Enterprise Management Program v1.1
-- Phase C Patch - Backend & API
--
-- Row Level Security for enterprise data isolation

-- ============================================================
-- HELPER FUNCTIONS FOR RLS
-- ============================================================

-- Get current user's enterprise ID from session context
CREATE OR REPLACE FUNCTION get_current_enterprise_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_enterprise_id', true), '')::UUID;
$$ LANGUAGE sql SECURITY DEFINER;

-- Get current user's ID from session context
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::UUID;
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if current user is a super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT current_setting('app.current_role', true) = 'SUPER_ADMIN';
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if current user is an enterprise admin
CREATE OR REPLACE FUNCTION is_enterprise_admin()
RETURNS BOOLEAN AS $$
  SELECT current_setting('app.current_role', true) IN ('SUPER_ADMIN', 'ENTERPRISE_ADMIN', 'TENANT_ADMIN');
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- ENABLE RLS ON TABLES
-- ============================================================

-- Enterprises table
ALTER TABLE enterprises ENABLE ROW LEVEL SECURITY;

-- Workspaces table
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Users table (careful with this one)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Evidence packs
ALTER TABLE evidence_packs ENABLE ROW LEVEL SECURITY;

-- Demo policies (admin only)
ALTER TABLE demo_policies ENABLE ROW LEVEL SECURITY;

-- Campaigns
ALTER TABLE enterprise_campaigns ENABLE ROW LEVEL SECURITY;

-- Templates
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Campaign assets
ALTER TABLE campaign_assets ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES - ENTERPRISES
-- ============================================================

-- Super admins can see all enterprises
DROP POLICY IF EXISTS enterprises_super_admin_all ON enterprises;
CREATE POLICY enterprises_super_admin_all ON enterprises
  FOR ALL
  TO PUBLIC
  USING (is_super_admin());

-- Users can see their own enterprise
DROP POLICY IF EXISTS enterprises_user_own ON enterprises;
CREATE POLICY enterprises_user_own ON enterprises
  FOR SELECT
  TO PUBLIC
  USING (enterprise_id = get_current_enterprise_id());

-- ============================================================
-- RLS POLICIES - WORKSPACES
-- ============================================================

-- Super admins can see all workspaces
DROP POLICY IF EXISTS workspaces_super_admin_all ON workspaces;
CREATE POLICY workspaces_super_admin_all ON workspaces
  FOR ALL
  TO PUBLIC
  USING (is_super_admin());

-- Users can see workspaces in their enterprise
DROP POLICY IF EXISTS workspaces_enterprise_users ON workspaces;
CREATE POLICY workspaces_enterprise_users ON workspaces
  FOR SELECT
  TO PUBLIC
  USING (enterprise_id = get_current_enterprise_id());

-- Enterprise admins can manage workspaces
DROP POLICY IF EXISTS workspaces_enterprise_admin_manage ON workspaces;
CREATE POLICY workspaces_enterprise_admin_manage ON workspaces
  FOR ALL
  TO PUBLIC
  USING (enterprise_id = get_current_enterprise_id() AND is_enterprise_admin());

-- ============================================================
-- RLS POLICIES - USERS
-- ============================================================

-- Super admins can see all users
DROP POLICY IF EXISTS users_super_admin_all ON users;
CREATE POLICY users_super_admin_all ON users
  FOR ALL
  TO PUBLIC
  USING (is_super_admin());

-- Users can see themselves
DROP POLICY IF EXISTS users_self ON users;
CREATE POLICY users_self ON users
  FOR SELECT
  TO PUBLIC
  USING (id = get_current_user_id());

-- Enterprise admins can see users in their enterprise
DROP POLICY IF EXISTS users_enterprise_admin_view ON users;
CREATE POLICY users_enterprise_admin_view ON users
  FOR SELECT
  TO PUBLIC
  USING (enterprise_id = get_current_enterprise_id() AND is_enterprise_admin());

-- Users can update themselves
DROP POLICY IF EXISTS users_self_update ON users;
CREATE POLICY users_self_update ON users
  FOR UPDATE
  TO PUBLIC
  USING (id = get_current_user_id());

-- ============================================================
-- RLS POLICIES - EVIDENCE PACKS
-- ============================================================

-- Users can see their own evidence packs
DROP POLICY IF EXISTS evidence_packs_user_own ON evidence_packs;
CREATE POLICY evidence_packs_user_own ON evidence_packs
  FOR SELECT
  TO PUBLIC
  USING (user_id = get_current_user_id() OR enterprise_id = get_current_enterprise_id());

-- Users can create their own evidence packs
DROP POLICY IF EXISTS evidence_packs_user_insert ON evidence_packs;
CREATE POLICY evidence_packs_user_insert ON evidence_packs
  FOR INSERT
  TO PUBLIC
  WITH CHECK (user_id = get_current_user_id());

-- Users can delete their own evidence packs
DROP POLICY IF EXISTS evidence_packs_user_delete ON evidence_packs;
CREATE POLICY evidence_packs_user_delete ON evidence_packs
  FOR DELETE
  TO PUBLIC
  USING (user_id = get_current_user_id());

-- Super admins can manage all
DROP POLICY IF EXISTS evidence_packs_super_admin_all ON evidence_packs;
CREATE POLICY evidence_packs_super_admin_all ON evidence_packs
  FOR ALL
  TO PUBLIC
  USING (is_super_admin());

-- ============================================================
-- RLS POLICIES - DEMO POLICIES (ADMIN ONLY)
-- ============================================================

-- Only super admins can manage demo policies
DROP POLICY IF EXISTS demo_policies_super_admin_all ON demo_policies;
CREATE POLICY demo_policies_super_admin_all ON demo_policies
  FOR ALL
  TO PUBLIC
  USING (is_super_admin());

-- All authenticated users can read demo policies
DROP POLICY IF EXISTS demo_policies_read_all ON demo_policies;
CREATE POLICY demo_policies_read_all ON demo_policies
  FOR SELECT
  TO PUBLIC
  USING (true);  -- Policies are public, enforcement happens in code

-- ============================================================
-- RLS POLICIES - CAMPAIGNS
-- ============================================================

-- Users can see campaigns in their enterprise
DROP POLICY IF EXISTS campaigns_enterprise_view ON enterprise_campaigns;
CREATE POLICY campaigns_enterprise_view ON enterprise_campaigns
  FOR SELECT
  TO PUBLIC
  USING (enterprise_id = get_current_enterprise_id());

-- Enterprise admins can manage campaigns
DROP POLICY IF EXISTS campaigns_enterprise_admin_manage ON enterprise_campaigns;
CREATE POLICY campaigns_enterprise_admin_manage ON enterprise_campaigns
  FOR ALL
  TO PUBLIC
  USING (enterprise_id = get_current_enterprise_id() AND is_enterprise_admin());

-- Super admins can manage all
DROP POLICY IF EXISTS campaigns_super_admin_all ON enterprise_campaigns;
CREATE POLICY campaigns_super_admin_all ON enterprise_campaigns
  FOR ALL
  TO PUBLIC
  USING (is_super_admin());

-- ============================================================
-- RLS POLICIES - TEMPLATES
-- ============================================================

-- Users can see templates in their enterprise
DROP POLICY IF EXISTS templates_enterprise_view ON message_templates;
CREATE POLICY templates_enterprise_view ON message_templates
  FOR SELECT
  TO PUBLIC
  USING (enterprise_id = get_current_enterprise_id());

-- Enterprise admins can manage templates
DROP POLICY IF EXISTS templates_enterprise_admin_manage ON message_templates;
CREATE POLICY templates_enterprise_admin_manage ON message_templates
  FOR ALL
  TO PUBLIC
  USING (enterprise_id = get_current_enterprise_id() AND is_enterprise_admin());

-- Super admins can manage all
DROP POLICY IF EXISTS templates_super_admin_all ON message_templates;
CREATE POLICY templates_super_admin_all ON message_templates
  FOR ALL
  TO PUBLIC
  USING (is_super_admin());

-- ============================================================
-- RLS POLICIES - CAMPAIGN ASSETS
-- ============================================================

-- Users can see assets for campaigns they can access
DROP POLICY IF EXISTS campaign_assets_enterprise_view ON campaign_assets;
CREATE POLICY campaign_assets_enterprise_view ON campaign_assets
  FOR SELECT
  TO PUBLIC
  USING (
    campaign_id IN (
      SELECT id FROM enterprise_campaigns
      WHERE enterprise_id = get_current_enterprise_id()
    )
  );

-- Enterprise admins can manage assets
DROP POLICY IF EXISTS campaign_assets_admin_manage ON campaign_assets;
CREATE POLICY campaign_assets_admin_manage ON campaign_assets
  FOR ALL
  TO PUBLIC
  USING (
    is_enterprise_admin() AND campaign_id IN (
      SELECT id FROM enterprise_campaigns
      WHERE enterprise_id = get_current_enterprise_id()
    )
  );

-- Super admins can manage all
DROP POLICY IF EXISTS campaign_assets_super_admin_all ON campaign_assets;
CREATE POLICY campaign_assets_super_admin_all ON campaign_assets
  FOR ALL
  TO PUBLIC
  USING (is_super_admin());

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON FUNCTION get_current_enterprise_id() IS 'S298A: Returns current user enterprise ID from session context';
COMMENT ON FUNCTION get_current_user_id() IS 'S298A: Returns current user ID from session context';
COMMENT ON FUNCTION is_super_admin() IS 'S298A: Checks if current user is a super admin';
COMMENT ON FUNCTION is_enterprise_admin() IS 'S298A: Checks if current user is an enterprise admin or higher';

-- ============================================================
-- VERIFICATION
-- ============================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  -- Count RLS policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname LIKE '%enterprise%' OR policyname LIKE '%super_admin%' OR policyname LIKE '%user%';

  IF policy_count < 10 THEN
    RAISE WARNING 'S298A: Expected at least 10 RLS policies, found %', policy_count;
  ELSE
    RAISE NOTICE 'S298A: Created % RLS policies successfully', policy_count;
  END IF;
END $$;
