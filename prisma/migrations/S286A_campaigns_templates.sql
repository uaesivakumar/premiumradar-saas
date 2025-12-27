-- S286A: Campaigns & Templates Tables
-- Part of User & Enterprise Management Program v1.1
-- Phase B - Data Model & Migration (PATCH SPRINT)
--
-- Creates enterprise_campaigns, campaign_assets, message_templates tables

-- ============================================================
-- ENTERPRISE CAMPAIGNS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS enterprise_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL,

  -- Campaign details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,  -- email, linkedin, multi-channel, etc.

  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),

  -- Configuration
  settings JSONB DEFAULT '{}',
  target_criteria JSONB DEFAULT '{}',

  -- Versioning
  version INTEGER DEFAULT 1,

  -- Audit
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign key (deferred to avoid circular deps)
  CONSTRAINT fk_campaigns_enterprise FOREIGN KEY (enterprise_id)
    REFERENCES enterprises(enterprise_id) ON DELETE CASCADE
);

-- ============================================================
-- CAMPAIGN ASSETS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS campaign_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,

  -- Asset details
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,  -- image, document, video, etc.
  mime_type VARCHAR(100),
  url TEXT,
  storage_key VARCHAR(500),

  -- Metadata
  metadata JSONB DEFAULT '{}',
  file_size_bytes BIGINT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_assets_campaign FOREIGN KEY (campaign_id)
    REFERENCES enterprise_campaigns(id) ON DELETE CASCADE
);

-- ============================================================
-- MESSAGE TEMPLATES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL,

  -- Template details
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  body TEXT NOT NULL,

  -- Type
  type VARCHAR(50) DEFAULT 'email' CHECK (type IN ('email', 'sms', 'linkedin', 'whatsapp', 'custom')),

  -- Variables (for template rendering)
  variables JSONB DEFAULT '[]',

  -- Versioning
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,

  -- Audit
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_templates_enterprise FOREIGN KEY (enterprise_id)
    REFERENCES enterprises(enterprise_id) ON DELETE CASCADE
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_campaigns_enterprise ON enterprise_campaigns(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON enterprise_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON enterprise_campaigns(type);

CREATE INDEX IF NOT EXISTS idx_assets_campaign ON campaign_assets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON campaign_assets(type);

CREATE INDEX IF NOT EXISTS idx_templates_enterprise ON message_templates(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON message_templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_active ON message_templates(is_active) WHERE is_active = true;

-- ============================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================

CREATE OR REPLACE FUNCTION update_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS campaigns_updated_at ON enterprise_campaigns;
CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON enterprise_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_campaigns_updated_at();

DROP TRIGGER IF EXISTS templates_updated_at ON message_templates;
CREATE TRIGGER templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION update_campaigns_updated_at();

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE enterprise_campaigns IS 'Marketing/outreach campaigns owned by enterprises';
COMMENT ON TABLE campaign_assets IS 'Assets (images, docs) attached to campaigns';
COMMENT ON TABLE message_templates IS 'Reusable message templates for outreach';

-- ============================================================
-- VERIFICATION
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enterprise_campaigns') THEN
    RAISE EXCEPTION 'enterprise_campaigns table missing';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'message_templates') THEN
    RAISE EXCEPTION 'message_templates table missing';
  END IF;

  RAISE NOTICE 'S286A: campaigns and templates tables created successfully';
END $$;
