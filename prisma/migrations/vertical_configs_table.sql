/**
 * Vertical Configs Table
 *
 * Stores all vertical/sub-vertical/region configurations.
 * This is the SINGLE SOURCE OF TRUTH for vertical definitions.
 *
 * Banking/Employee Banking/UAE is seeded as the first example.
 * Other verticals are added via Super-Admin Panel.
 */

-- Create vertical_configs table
CREATE TABLE IF NOT EXISTS vertical_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Identity
  vertical VARCHAR(50) NOT NULL,
  sub_vertical VARCHAR(50) NOT NULL,
  region_country VARCHAR(50) NOT NULL,
  region_city VARCHAR(100),
  region_territory VARCHAR(100),

  -- Display
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Radar target (what entity type this vertical sells to)
  radar_target VARCHAR(50) NOT NULL CHECK (radar_target IN ('companies', 'individuals', 'families', 'candidates')),

  -- Configuration (JSON blob)
  -- Contains: allowedSignalTypes, scoringFactors, playbooks, enrichmentSources, outreachFlows, journeyRules
  config JSONB NOT NULL DEFAULT '{}',

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_seeded BOOLEAN NOT NULL DEFAULT false,  -- true = system-seeded, cannot delete

  -- Unique constraint: one config per vertical/sub-vertical/region combo
  CONSTRAINT unique_vertical_config UNIQUE (vertical, sub_vertical, region_country)
);

-- Create indexes
CREATE INDEX idx_vertical_configs_lookup ON vertical_configs(vertical, sub_vertical, region_country);
CREATE INDEX idx_vertical_configs_active ON vertical_configs(is_active) WHERE is_active = true;
CREATE INDEX idx_vertical_configs_vertical ON vertical_configs(vertical);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_vertical_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vertical_configs_updated_at
  BEFORE UPDATE ON vertical_configs
  FOR EACH ROW EXECUTE FUNCTION update_vertical_configs_updated_at();

-- Comments for documentation
COMMENT ON TABLE vertical_configs IS 'Vertical/Sub-Vertical/Region configurations for plug-and-play sales intelligence';
COMMENT ON COLUMN vertical_configs.radar_target IS 'Entity type: companies (banking), individuals (insurance), families (real-estate), candidates (recruitment)';
COMMENT ON COLUMN vertical_configs.config IS 'JSON config containing signals, scoring, playbooks, enrichment, outreach, journeys';
COMMENT ON COLUMN vertical_configs.is_seeded IS 'System-seeded configs cannot be deleted (e.g., Banking/Employee Banking/UAE)';
