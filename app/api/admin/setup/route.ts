/**
 * Admin Setup API - Run migrations and seed data
 *
 * POST /api/admin/setup
 *
 * This endpoint runs database migrations and seeds.
 * Protected by admin authentication in production.
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/client';
import { seedVerticalConfig, type VerticalConfigData } from '@/lib/admin/vertical-config-service';
import { SYSTEM_CONFIG_TABLE_SQL, seedDefaultConfigs } from '@/lib/admin/system-config';

// =============================================================================
// MIGRATION SQL
// =============================================================================

// =============================================================================
// SIVA METRICS TABLE SQL
// =============================================================================

const SIVA_METRICS_SQL = `
-- SIVA Metrics Table
-- Tracks every AI/API call for the SIVA Intelligence Dashboard.

CREATE TABLE IF NOT EXISTS siva_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Call identification
  provider VARCHAR(50) NOT NULL,           -- 'openai', 'apollo', 'serp'
  operation VARCHAR(100) NOT NULL,         -- 'enrichment', 'signal_detection', etc.
  integration_id UUID,

  -- Context
  tenant_id UUID,
  user_id UUID,
  vertical VARCHAR(50),
  sub_vertical VARCHAR(100),

  -- Request details
  request_type VARCHAR(100),
  model VARCHAR(100),

  -- Token usage
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  -- Cost tracking (in cents)
  cost_cents INTEGER DEFAULT 0,

  -- Performance
  response_time_ms INTEGER,

  -- Status
  success BOOLEAN NOT NULL DEFAULT true,
  error_code VARCHAR(100),
  error_message TEXT,

  -- Quality signals
  quality_score DECIMAL(5,2),
  accuracy_score DECIMAL(5,2),
  user_feedback INTEGER,

  -- Raw data
  request_summary TEXT,
  response_summary TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_siva_metrics_created_at ON siva_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_siva_metrics_provider ON siva_metrics(provider);
CREATE INDEX IF NOT EXISTS idx_siva_metrics_operation ON siva_metrics(operation);
CREATE INDEX IF NOT EXISTS idx_siva_metrics_success ON siva_metrics(success);

-- Daily stats view
CREATE OR REPLACE VIEW siva_daily_stats AS
SELECT
  DATE(created_at) as date,
  provider,
  COUNT(*) as total_calls,
  COUNT(*) FILTER (WHERE success = true) as successful_calls,
  COUNT(*) FILTER (WHERE success = false) as failed_calls,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(cost_cents) as total_cost_cents,
  AVG(response_time_ms) as avg_response_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time_ms,
  AVG(quality_score) FILTER (WHERE quality_score IS NOT NULL) as avg_quality_score,
  AVG(accuracy_score) FILTER (WHERE accuracy_score IS NOT NULL) as avg_accuracy_score,
  AVG(user_feedback) FILTER (WHERE user_feedback IS NOT NULL) as avg_user_feedback
FROM siva_metrics
GROUP BY DATE(created_at), provider
ORDER BY DATE(created_at) DESC, provider;
`;

// =============================================================================
// GCP COSTS AND FINANCIALS TABLES SQL
// =============================================================================

// =============================================================================
// S396: ENRICHMENT PERSISTENCE SQL
// =============================================================================

const ENRICHMENT_PERSISTENCE_SQL = `
-- S396: Enrichment Persistence
-- Persist enriched contacts to database so they survive server restarts

CREATE TABLE IF NOT EXISTS enrichment_sessions (
  id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT,
  stage TEXT NOT NULL DEFAULT 'CONTACT_DISCOVERY_STARTED',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  contacts_found INTEGER DEFAULT 0,
  contacts_scored INTEGER DEFAULT 0,
  provider_calls INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrichment_sessions_entity ON enrichment_sessions(entity_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_sessions_user ON enrichment_sessions(user_id);

CREATE TABLE IF NOT EXISTS enriched_contacts (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES enrichment_sessions(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  email TEXT,
  linkedin_url TEXT,
  phone TEXT,
  role TEXT NOT NULL,
  seniority TEXT NOT NULL,
  department TEXT NOT NULL,
  qtle_score INTEGER NOT NULL,
  score_breakdown JSONB NOT NULL,
  priority TEXT NOT NULL,
  priority_rank INTEGER NOT NULL,
  why_recommended TEXT NOT NULL,
  confidence TEXT NOT NULL,
  source_provider TEXT NOT NULL,
  source_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enriched_contacts_session ON enriched_contacts(session_id);
CREATE INDEX IF NOT EXISTS idx_enriched_contacts_entity ON enriched_contacts(entity_id);
CREATE INDEX IF NOT EXISTS idx_enriched_contacts_priority ON enriched_contacts(entity_id, priority, priority_rank);

CREATE TABLE IF NOT EXISTS enrichment_evidence (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES enrichment_sessions(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  raw_payload JSONB,
  normalized_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrichment_evidence_session ON enrichment_evidence(session_id);

-- Update trigger
CREATE OR REPLACE FUNCTION update_enrichment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enrichment_sessions_updated_at ON enrichment_sessions;
CREATE TRIGGER enrichment_sessions_updated_at
  BEFORE UPDATE ON enrichment_sessions
  FOR EACH ROW EXECUTE FUNCTION update_enrichment_updated_at();

DROP TRIGGER IF EXISTS enriched_contacts_updated_at ON enriched_contacts;
CREATE TRIGGER enriched_contacts_updated_at
  BEFORE UPDATE ON enriched_contacts
  FOR EACH ROW EXECUTE FUNCTION update_enrichment_updated_at();
`;

const FINANCIALS_SQL = `
-- GCP Costs Table
CREATE TABLE IF NOT EXISTS gcp_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  service VARCHAR(100) NOT NULL,
  sku VARCHAR(200),
  description TEXT,
  cost_usd DECIMAL(12,4) NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  project VARCHAR(100),
  labels JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_gcp_cost_entry UNIQUE (date, service, sku)
);

CREATE INDEX IF NOT EXISTS idx_gcp_costs_date ON gcp_costs(date DESC);
CREATE INDEX IF NOT EXISTS idx_gcp_costs_service ON gcp_costs(service);

-- Revenue Table
CREATE TABLE IF NOT EXISTS revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('subscription', 'one-time', 'pilot', 'other')),
  description TEXT,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  customer_id UUID,
  customer_name VARCHAR(200),
  recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue(date DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_type ON revenue(type);

-- Other Expenses Table
CREATE TABLE IF NOT EXISTS other_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'USD',
  vendor VARCHAR(200),
  recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_other_expenses_date ON other_expenses(date DESC);
`;

const MIGRATION_SQL = `
-- Vertical Configs Table for PremiumRadar SaaS
-- Stores plug-and-play vertical configurations

CREATE TABLE IF NOT EXISTS vertical_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vertical hierarchy
  vertical VARCHAR(50) NOT NULL,
  sub_vertical VARCHAR(50) NOT NULL,
  region_country VARCHAR(50) NOT NULL,
  region_city VARCHAR(100),
  region_territory VARCHAR(100),

  -- Display info
  name VARCHAR(200) NOT NULL,
  description TEXT,

  -- What this vertical targets
  radar_target VARCHAR(50) NOT NULL CHECK (radar_target IN ('companies', 'individuals', 'families', 'candidates')),

  -- The full configuration (JSONB for flexibility)
  config JSONB NOT NULL DEFAULT '{}',

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_seeded BOOLEAN DEFAULT false,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_by VARCHAR(100),

  -- Unique constraint per vertical/sub-vertical/region combination
  CONSTRAINT unique_vertical_config UNIQUE (vertical, sub_vertical, region_country)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_vertical_configs_lookup
  ON vertical_configs(vertical, sub_vertical, region_country);

-- Index for active configs
CREATE INDEX IF NOT EXISTS idx_vertical_configs_active
  ON vertical_configs(is_active) WHERE is_active = true;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_vertical_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vertical_configs_updated_at ON vertical_configs;
CREATE TRIGGER trigger_vertical_configs_updated_at
  BEFORE UPDATE ON vertical_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_vertical_configs_updated_at();

-- Add region_territory column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vertical_configs' AND column_name = 'region_territory'
  ) THEN
    ALTER TABLE vertical_configs ADD COLUMN region_territory VARCHAR(100);
  END IF;
END $$;
`;

// =============================================================================
// BANKING / EMPLOYEE BANKING / UAE SEED DATA
// =============================================================================

const BANKING_EMPLOYEE_UAE_CONFIG: VerticalConfigData = {
  allowedSignalTypes: [
    'hiring-expansion',
    'office-opening',
    'market-entry',
    'project-award',
    'headcount-jump',
    'subsidiary-creation',
    'leadership-hiring',
    'funding-round',
    'merger-acquisition',
    'expansion-announcement',
  ],

  signalConfigs: [
    {
      type: 'hiring-expansion',
      name: 'Hiring Expansion',
      description: 'Company is actively hiring - indicates growth and potential payroll needs',
      relevance: 1.0,
      templates: [
        {
          title: 'Talent Acquisition',
          content: 'Active hiring in technology and digital roles',
          confidence: 0.85,
          relevance: 0.8,
        },
        {
          title: 'Executive Hire',
          content: 'New C-level or senior executive appointment',
          confidence: 0.9,
          relevance: 0.85,
        },
      ],
    },
    {
      type: 'headcount-jump',
      name: 'Headcount Jump',
      description: 'Significant increase in employee count - immediate payroll opportunity',
      relevance: 0.95,
      templates: [
        {
          title: 'Workforce Growth',
          content: 'Company headcount increased significantly',
          confidence: 0.85,
          relevance: 0.9,
        },
      ],
    },
    {
      type: 'office-opening',
      name: 'Office Opening',
      description: 'New office location - new accounts opportunity',
      relevance: 0.85,
      templates: [
        {
          title: 'Market Expansion',
          content: 'Opening new branches or entering new markets',
          confidence: 0.8,
          relevance: 0.85,
        },
      ],
    },
    {
      type: 'subsidiary-creation',
      name: 'Subsidiary Creation',
      description: 'New subsidiary entity - needs separate banking',
      relevance: 0.9,
    },
    {
      type: 'funding-round',
      name: 'Funding Round',
      description: 'Capital raised - banking relationship opportunity',
      relevance: 0.8,
    },
    {
      type: 'market-entry',
      name: 'Market Entry',
      description: 'Entering new market/region - needs local banking services',
      relevance: 0.8,
    },
    {
      type: 'merger-acquisition',
      name: 'Merger/Acquisition',
      description: 'M&A activity - banking consolidation opportunity',
      relevance: 0.75,
    },
    {
      type: 'leadership-hiring',
      name: 'Leadership Hiring',
      description: 'New C-level hire - decision maker change',
      relevance: 0.7,
    },
    {
      type: 'project-award',
      name: 'Project Award',
      description: 'Won major project - cash flow increase',
      relevance: 0.65,
    },
    {
      type: 'expansion-announcement',
      name: 'Expansion Announcement',
      description: 'General expansion news - growth signals',
      relevance: 0.6,
    },
  ],

  scoringWeights: {
    quality: 0.30,
    timing: 0.25,
    liquidity: 0.20,
    endUser: 0.25,
  },

  scoringFactors: [
    {
      id: 'company-size',
      name: 'Company Size',
      weight: 0.25,
      description: 'Larger companies = more employees = bigger payroll',
    },
    {
      id: 'growth-rate',
      name: 'Growth Rate',
      weight: 0.2,
      description: 'Fast-growing companies need banking partners',
    },
    {
      id: 'industry-fit',
      name: 'Industry Fit',
      weight: 0.15,
      description: 'Industries with high payroll activity',
    },
    {
      id: 'signal-strength',
      name: 'Signal Strength',
      weight: 0.2,
      description: 'Strength of detected expansion signals',
    },
    {
      id: 'decision-maker-access',
      name: 'Decision Maker Access',
      weight: 0.2,
      description: 'Access to CFO/HR Director',
    },
  ],

  regionalWeights: [
    {
      region: 'UAE',
      qualityBoost: 1.25,
      timingBoost: 1.30,
      marketMaturity: 0.95,
    },
    {
      region: 'UAE-Dubai',
      qualityBoost: 1.30,
      timingBoost: 1.35,
      marketMaturity: 1.0,
    },
    {
      region: 'KSA',
      qualityBoost: 1.35,
      timingBoost: 1.40,
      marketMaturity: 0.85,
    },
  ],

  timingSignals: [
    {
      id: 'cbuae-open-banking',
      name: 'CBUAE Open Banking Deadline',
      description: 'Central Bank UAE open banking framework compliance',
      deadline: '2025-06-01',
      urgencyMultiplier: 1.5,
    },
    {
      id: 'q4-budget-planning',
      name: 'Q4 Budget Planning',
      description: 'Annual budget planning period',
      months: [9, 10, 11],
      urgencyMultiplier: 1.3,
    },
  ],

  b2bAdjustments: {
    companySize: {
      enterprise: 1.3,
      'mid-market': 1.2,
      smb: 1.0,
      startup: 0.9,
    },
    decisionSpeed: {
      privateBank: 0.8,
      governmentBank: 1.5,
      internationalBank: 1.0,
      fintech: 0.6,
    },
    dealCycle: {
      tier1Bank: 12,
      tier2Bank: 9,
      challengerBank: 6,
      fintech: 3,
    },
  },

  enrichmentSources: [
    {
      id: 'apollo',
      name: 'Apollo',
      type: 'apollo',
      enabled: true,
      priority: 1,
      fields: ['company_size', 'headcount', 'revenue', 'industry', 'technologies'],
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      type: 'linkedin',
      enabled: true,
      priority: 2,
      fields: ['employee_count', 'growth_rate', 'job_openings', 'decision_makers'],
    },
  ],

  outreachChannels: [
    {
      id: 'email',
      channel: 'email',
      enabled: true,
      priority: 1,
      templates: ['initial-outreach', 'follow-up-1', 'follow-up-2'],
    },
    {
      id: 'linkedin',
      channel: 'linkedin',
      enabled: true,
      priority: 2,
      templates: ['connection-request', 'inmail-intro'],
    },
  ],

  journeyStages: [
    {
      id: 'discovery',
      name: 'Discovery',
      order: 1,
      actions: ['signal-detection', 'company-research', 'initial-enrichment'],
      exitCriteria: ['company-qualified', 'signals-verified'],
    },
    {
      id: 'enrichment',
      name: 'Enrichment',
      order: 2,
      actions: ['apollo-enrich', 'contact-discovery', 'org-chart-mapping'],
      exitCriteria: ['contacts-found', 'decision-maker-identified'],
    },
    {
      id: 'scoring',
      name: 'Scoring',
      order: 3,
      actions: ['qtle-scoring', 'regional-adjustment', 'ranking'],
      exitCriteria: ['score-above-threshold'],
    },
    {
      id: 'outreach',
      name: 'Outreach',
      order: 4,
      actions: ['sequence-creation', 'email-personalization', 'send-initial'],
      exitCriteria: ['response-received', 'meeting-booked'],
    },
  ],

  companyProfiles: [
    {
      name: 'Emirates NBD',
      description: 'One of the largest banking groups in the Middle East',
      signals: [
        {
          title: 'Leading UAE Bank',
          content: 'Emirates NBD is one of the largest banking groups in the Middle East.',
          confidence: 0.95,
          relevance: 0.9,
        },
      ],
    },
    {
      name: 'First Abu Dhabi Bank',
      description: 'Largest bank in UAE by assets',
      signals: [
        {
          title: 'Largest UAE Bank by Assets',
          content: 'FAB is the largest bank in the UAE.',
          confidence: 0.95,
          relevance: 0.9,
        },
      ],
    },
  ],

  defaultKPIs: [
    {
      product: 'Payroll Accounts',
      target: 20,
      unit: 'accounts',
      period: 'quarterly',
    },
    {
      product: 'Employee Benefits',
      target: 500000,
      unit: 'AED',
      period: 'quarterly',
    },
  ],
};

// =============================================================================
// API HANDLERS
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    const results: string[] = [];

    // Step 1: Run migration
    if (action === 'migrate' || action === 'all') {
      console.log('[Setup] Running migration...');
      await query(MIGRATION_SQL);
      results.push('✓ Migration completed: vertical_configs table created');

      // Also run SIVA metrics migration
      console.log('[Setup] Running SIVA metrics migration...');
      await query(SIVA_METRICS_SQL);
      results.push('✓ Migration completed: siva_metrics table + siva_daily_stats view created');

      // Run financials tables migration
      console.log('[Setup] Running financials tables migration...');
      await query(FINANCIALS_SQL);
      results.push('✓ Migration completed: gcp_costs, revenue, other_expenses tables created');

      // S396: Run enrichment persistence migration
      console.log('[Setup] Running S396 enrichment persistence migration...');
      await query(ENRICHMENT_PERSISTENCE_SQL);
      results.push('✓ Migration completed: enrichment_sessions, enriched_contacts, enrichment_evidence tables created');

      // Run system_config tables migration
      console.log('[Setup] Running system_config migration...');
      await query(SYSTEM_CONFIG_TABLE_SQL);
      results.push('✓ Migration completed: system_config + system_config_history tables created');

      // Seed default configurations
      console.log('[Setup] Seeding default configurations...');
      const configsSeeded = await seedDefaultConfigs();
      results.push(`✓ Seeded ${configsSeeded} default system configurations`);
    }

    // Step 2: Seed Banking/Employee Banking/UAE
    if (action === 'seed' || action === 'all') {
      console.log('[Setup] Seeding Banking/Employee Banking/UAE...');

      const result = await seedVerticalConfig({
        vertical: 'banking',
        subVertical: 'employee-banking',
        regionCountry: 'UAE',
        regionCity: 'Dubai',
        name: 'Banking - Employee Banking (UAE)',
        description: 'Payroll accounts, salary accounts, employee benefits for companies in UAE',
        radarTarget: 'companies',
        config: BANKING_EMPLOYEE_UAE_CONFIG,
        isActive: true,
      });

      results.push(`✓ Seeded: ${result.name} (ID: ${result.id})`);
    }

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Setup] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check if vertical_configs table exists
    const tableCheck = await query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'vertical_configs'
      )
    `);
    const tableExists = tableCheck[0]?.exists || false;

    // Check if siva_metrics table exists
    const sivaTableCheck = await query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'siva_metrics'
      )
    `);
    const sivaTableExists = sivaTableCheck[0]?.exists || false;

    // Count configs if table exists
    let configCount = 0;
    if (tableExists) {
      const countResult = await query<{ count: string }>(`
        SELECT COUNT(*) as count FROM vertical_configs
      `);
      configCount = parseInt(countResult[0]?.count || '0', 10);
    }

    // Count SIVA metrics if table exists
    let sivaMetricsCount = 0;
    if (sivaTableExists) {
      const countResult = await query<{ count: string }>(`
        SELECT COUNT(*) as count FROM siva_metrics
      `);
      sivaMetricsCount = parseInt(countResult[0]?.count || '0', 10);
    }

    // Check if system_config table exists
    const systemConfigCheck = await query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'system_config'
      )
    `);
    const systemConfigExists = systemConfigCheck[0]?.exists || false;

    // S396: Check if enrichment_sessions table exists
    const enrichmentCheck = await query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'enrichment_sessions'
      )
    `);
    const enrichmentSessionsExists = enrichmentCheck[0]?.exists || false;

    // Count system configs if table exists
    let systemConfigCount = 0;
    if (systemConfigExists) {
      const countResult = await query<{ count: string }>(`
        SELECT COUNT(*) as count FROM system_config
      `);
      systemConfigCount = parseInt(countResult[0]?.count || '0', 10);
    }

    return NextResponse.json({
      status: 'ok',
      database: {
        connected: true,
        tables: {
          vertical_configs: tableExists,
          siva_metrics: sivaTableExists,
          system_config: systemConfigExists,
          enrichment_sessions: enrichmentSessionsExists,
        },
        configCount,
        sivaMetricsCount,
        systemConfigCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      timestamp: new Date().toISOString(),
    });
  }
}
