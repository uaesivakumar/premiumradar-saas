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

// =============================================================================
// MIGRATION SQL
// =============================================================================

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
    // Check if table exists
    const tableCheck = await query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'vertical_configs'
      )
    `);

    const tableExists = tableCheck[0]?.exists || false;

    // Count configs if table exists
    let configCount = 0;
    if (tableExists) {
      const countResult = await query<{ count: string }>(`
        SELECT COUNT(*) as count FROM vertical_configs
      `);
      configCount = parseInt(countResult[0]?.count || '0', 10);
    }

    return NextResponse.json({
      status: 'ok',
      database: {
        connected: true,
        tableExists,
        configCount,
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
