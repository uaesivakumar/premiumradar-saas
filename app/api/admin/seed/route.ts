/**
 * Seed API Endpoint
 *
 * Seeds the database with vertical configs.
 * POST /api/admin/seed?vertical=banking
 */

import { NextRequest, NextResponse } from 'next/server';
import { seedVerticalConfig, type VerticalConfigData } from '@/lib/admin/vertical-config-service';

export const dynamic = 'force-dynamic';

// =============================================================================
// BANKING / EMPLOYEE BANKING / UAE CONFIG
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
      templates: [],
    },
    {
      type: 'funding-round',
      name: 'Funding Round',
      description: 'Capital raised - banking relationship opportunity',
      relevance: 0.8,
      templates: [],
    },
    {
      type: 'market-entry',
      name: 'Market Entry',
      description: 'Entering new market/region - needs local banking services',
      relevance: 0.8,
      templates: [],
    },
    {
      type: 'leadership-hiring',
      name: 'Leadership Hiring',
      description: 'New C-level hire - decision maker change',
      relevance: 0.7,
      templates: [],
    },
  ],

  scoringWeights: {
    quality: 0.3,
    timing: 0.25,
    liquidity: 0.25,
    endUser: 0.2,
  },

  scoringFactors: [
    {
      id: 'company-size',
      name: 'Company Size',
      weight: 0.25,
      description: 'Larger companies = larger payroll opportunity',
    },
    {
      id: 'hiring-velocity',
      name: 'Hiring Velocity',
      weight: 0.25,
      description: 'Faster hiring = immediate payroll needs',
    },
    {
      id: 'headcount-growth',
      name: 'Headcount Growth',
      weight: 0.2,
      description: 'Growing workforce = new salary accounts',
    },
    {
      id: 'news-signals',
      name: 'News Signals',
      weight: 0.15,
      description: 'Recent news indicates active expansion',
    },
    {
      id: 'region-match',
      name: 'Region Match',
      weight: 0.15,
      description: 'Company in target region',
    },
  ],

  regionalWeights: [
    { region: 'UAE', qualityBoost: 1.25, timingBoost: 1.30, marketMaturity: 0.95 },
    { region: 'UAE-Dubai', qualityBoost: 1.30, timingBoost: 1.35, marketMaturity: 1.0 },
    { region: 'UAE-AbuDhabi', qualityBoost: 1.25, timingBoost: 1.25, marketMaturity: 0.90 },
    { region: 'KSA', qualityBoost: 1.35, timingBoost: 1.40, marketMaturity: 0.85 },
  ],

  timingSignals: [
    {
      id: 'cbuae-open-banking',
      name: 'CBUAE Open Banking Deadline',
      description: 'Central Bank UAE open banking framework compliance',
      deadline: '2025-06-01',
      urgencyMultiplier: 1.5,
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

  // DISCOVERY SOURCES: SERP + LLM (Primary)
  // ENRICHMENT SOURCES: Apollo (Secondary)
  enrichmentSources: [
    {
      id: 'serp-news',
      name: 'SERP News Discovery',
      type: 'custom',
      enabled: true,
      priority: 1,
      fields: ['hiring_news', 'expansion_signals', 'company_discovery'],
      description: 'Search hiring news to discover companies actively expanding',
    },
    {
      id: 'llm-extraction',
      name: 'LLM Company Extraction',
      type: 'custom',
      enabled: true,
      priority: 2,
      fields: ['company_names', 'signal_extraction', 'structured_data'],
      description: 'Extract company names and signals from news using LLM',
    },
    {
      id: 'apollo',
      name: 'Apollo Enrichment',
      type: 'apollo',
      enabled: true,
      priority: 3,
      fields: ['headcount', 'headcount_growth', 'contacts', 'hr_director', 'cfo'],
      description: 'Enrich discovered companies with headcount and contact data',
    },
  ],

  outreachChannels: [
    { id: 'linkedin', channel: 'linkedin', enabled: true, priority: 1 },
    { id: 'email', channel: 'email', enabled: true, priority: 2 },
    { id: 'phone', channel: 'phone', enabled: true, priority: 3 },
  ],

  journeyStages: [
    { id: 'discovered', name: 'Discovered', order: 1, actions: ['research', 'qualify'], exitCriteria: ['meets_icp'] },
    { id: 'qualified', name: 'Qualified', order: 2, actions: ['reach_out'], exitCriteria: ['response_received'] },
    { id: 'engaged', name: 'Engaged', order: 3, actions: ['present_solution'], exitCriteria: ['interest_confirmed'] },
    { id: 'proposal', name: 'Proposal', order: 4, actions: ['send_proposal'], exitCriteria: ['proposal_reviewed'] },
    { id: 'negotiation', name: 'Negotiation', order: 5, actions: ['negotiate_terms'], exitCriteria: ['terms_agreed'] },
    { id: 'won', name: 'Won', order: 6, actions: ['close_deal'], exitCriteria: ['contract_signed'] },
    { id: 'lost', name: 'Lost', order: 7, actions: ['analyze_loss'], exitCriteria: ['feedback_collected'] },
  ],
};

/**
 * POST /api/admin/seed
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vertical = searchParams.get('vertical') || 'banking';

    if (vertical === 'banking') {
      const result = await seedVerticalConfig({
        vertical: 'banking',
        subVertical: 'employee-banking',
        regionCountry: 'UAE',
        name: 'Employee Banking - UAE',
        radarTarget: 'companies',
        isActive: true,
        config: BANKING_EMPLOYEE_UAE_CONFIG,
      });

      return NextResponse.json({
        success: true,
        message: 'Banking Employee Banking UAE seeded successfully',
        data: {
          id: result.id,
          vertical: result.vertical,
          subVertical: result.subVertical,
          regionCountry: result.regionCountry,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: `Unknown vertical: ${vertical}` },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Seed] Error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/seed - Check status
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Seed endpoint ready',
    availableVerticals: ['banking'],
    usage: 'POST /api/admin/seed?vertical=banking',
  });
}
