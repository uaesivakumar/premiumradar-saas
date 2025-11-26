/**
 * Banking / Employee Banking / UAE Seed Data
 *
 * This is the FIRST vertical config - the demo vertical.
 * All logic extracted from hardcoded defaults in the codebase.
 *
 * Run: npx ts-node scripts/seeds/banking-employee-uae.ts
 */

import { seedVerticalConfig, type VerticalConfigData } from '../../lib/admin/vertical-config-service';

// =============================================================================
// BANKING / EMPLOYEE BANKING / UAE CONFIG
// =============================================================================

const BANKING_EMPLOYEE_UAE_CONFIG: VerticalConfigData = {
  // =========================================================================
  // SIGNALS
  // =========================================================================
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
        {
          title: 'Growth Announcement',
          content: 'Press release announcing expansion plans',
          confidence: 0.75,
          relevance: 0.8,
        },
      ],
    },
    {
      type: 'subsidiary-creation',
      name: 'Subsidiary Creation',
      description: 'New subsidiary entity - needs separate banking',
      relevance: 0.9,
      templates: [
        {
          title: 'Corporate Restructuring',
          content: 'New subsidiary or business unit established',
          confidence: 0.85,
          relevance: 0.85,
        },
      ],
    },
    {
      type: 'funding-round',
      name: 'Funding Round',
      description: 'Capital raised - banking relationship opportunity',
      relevance: 0.8,
      templates: [
        {
          title: 'Investment Round',
          content: 'Recent funding or investment announcement',
          confidence: 0.9,
          relevance: 0.9,
        },
      ],
    },
    {
      type: 'market-entry',
      name: 'Market Entry',
      description: 'Entering new market/region - needs local banking services',
      relevance: 0.8,
      templates: [
        {
          title: 'Regional Expansion',
          content: 'Company entering new geographic market',
          confidence: 0.8,
          relevance: 0.8,
        },
      ],
    },
    {
      type: 'merger-acquisition',
      name: 'Merger/Acquisition',
      description: 'M&A activity - banking consolidation opportunity',
      relevance: 0.75,
      templates: [
        {
          title: 'M&A Activity',
          content: 'Merger or acquisition announcement',
          confidence: 0.9,
          relevance: 0.85,
        },
      ],
    },
    {
      type: 'leadership-hiring',
      name: 'Leadership Hiring',
      description: 'New C-level hire - decision maker change',
      relevance: 0.7,
      templates: [
        {
          title: 'Executive Appointment',
          content: 'New senior leadership appointment announced',
          confidence: 0.9,
          relevance: 0.8,
        },
      ],
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

  // =========================================================================
  // SCORING
  // =========================================================================
  scoringWeights: {
    quality: 0.30,    // Q - Quality of fit
    timing: 0.25,     // T - Timing/urgency
    liquidity: 0.20,  // L - Deal size/value
    endUser: 0.25,    // E - End-user/decision maker access
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
      region: 'UAE-AbuDhabi',
      qualityBoost: 1.25,
      timingBoost: 1.25,
      marketMaturity: 0.90,
    },
    {
      region: 'KSA',
      qualityBoost: 1.35,
      timingBoost: 1.40,
      marketMaturity: 0.85,
    },
    {
      region: 'KSA-Riyadh',
      qualityBoost: 1.40,
      timingBoost: 1.45,
      marketMaturity: 0.90,
    },
    {
      region: 'Qatar',
      qualityBoost: 1.20,
      timingBoost: 1.15,
      marketMaturity: 0.80,
    },
    {
      region: 'Bahrain',
      qualityBoost: 1.15,
      timingBoost: 1.20,
      marketMaturity: 0.85,
    },
    {
      region: 'Kuwait',
      qualityBoost: 1.10,
      timingBoost: 1.05,
      marketMaturity: 0.75,
    },
    {
      region: 'Oman',
      qualityBoost: 1.05,
      timingBoost: 1.10,
      marketMaturity: 0.70,
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
      id: 'fatf-compliance',
      name: 'FATF Compliance Review',
      description: 'Anti-money laundering compliance review',
      deadline: '2025-03-01',
      urgencyMultiplier: 1.4,
    },
    {
      id: 'uae-pass-integration',
      name: 'UAE Pass Integration',
      description: 'Digital identity integration requirement',
      deadline: '2025-12-31',
      urgencyMultiplier: 1.2,
    },
    {
      id: 'q4-budget-planning',
      name: 'Q4 Budget Planning',
      description: 'Annual budget planning period',
      months: [9, 10, 11],
      urgencyMultiplier: 1.3,
    },
    {
      id: 'q1-budget-release',
      name: 'Q1 Budget Release',
      description: 'New fiscal year budget available',
      months: [0, 1, 2],
      urgencyMultiplier: 1.25,
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

  // =========================================================================
  // ENRICHMENT
  // =========================================================================
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
    {
      id: 'crunchbase',
      name: 'Crunchbase',
      type: 'crunchbase',
      enabled: true,
      priority: 3,
      fields: ['funding', 'investors', 'acquisitions', 'news'],
    },
  ],

  // =========================================================================
  // OUTREACH
  // =========================================================================
  outreachChannels: [
    {
      id: 'email',
      channel: 'email',
      enabled: true,
      priority: 1,
      templates: ['initial-outreach', 'follow-up-1', 'follow-up-2', 'meeting-request'],
    },
    {
      id: 'linkedin',
      channel: 'linkedin',
      enabled: true,
      priority: 2,
      templates: ['connection-request', 'inmail-intro', 'engagement'],
    },
    {
      id: 'phone',
      channel: 'phone',
      enabled: true,
      priority: 3,
    },
    {
      id: 'whatsapp',
      channel: 'whatsapp',
      enabled: false,
      priority: 4,
    },
  ],

  // =========================================================================
  // JOURNEY
  // =========================================================================
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
    {
      id: 'engagement',
      name: 'Engagement',
      order: 5,
      actions: ['meeting-prep', 'proposal-generation', 'follow-up'],
      exitCriteria: ['deal-progressed', 'opportunity-created'],
    },
  ],

  // =========================================================================
  // COMPANY PROFILES (UAE Banks)
  // =========================================================================
  companyProfiles: [
    {
      name: 'Emirates NBD',
      description: 'One of the largest banking groups in the Middle East with strong digital innovation focus.',
      signals: [
        {
          title: 'Leading UAE Bank',
          content: 'Emirates NBD is one of the largest banking groups in the Middle East with a strong focus on digital innovation.',
          confidence: 0.95,
          relevance: 0.9,
        },
        {
          title: 'Digital Transformation Leader',
          content: 'Invested heavily in AI and digital banking capabilities through Liv digital bank.',
          confidence: 0.9,
          relevance: 0.95,
        },
        {
          title: 'Strong Financial Position',
          content: 'Consistent revenue growth and market leadership in UAE retail banking.',
          confidence: 0.9,
          relevance: 0.85,
        },
      ],
    },
    {
      name: 'First Abu Dhabi Bank',
      description: 'Largest bank in UAE and one of the world\'s largest and safest financial institutions.',
      signals: [
        {
          title: 'Largest UAE Bank by Assets',
          content: 'FAB is the largest bank in the UAE and one of the world\'s largest and safest financial institutions.',
          confidence: 0.95,
          relevance: 0.9,
        },
        {
          title: 'International Expansion',
          content: 'Active expansion into international markets including Egypt, Saudi Arabia.',
          confidence: 0.85,
          relevance: 0.85,
        },
      ],
    },
    {
      name: 'ADCB',
      description: 'Abu Dhabi Commercial Bank - leading financial services group in UAE.',
      signals: [
        {
          title: 'Major UAE Bank',
          content: 'Abu Dhabi Commercial Bank is a leading financial services group in the UAE.',
          confidence: 0.95,
          relevance: 0.9,
        },
        {
          title: 'Digital Innovation',
          content: 'Launched ADCB Hayyak for digital account opening and banking.',
          confidence: 0.85,
          relevance: 0.9,
        },
      ],
    },
    {
      name: 'Mashreq',
      description: 'One of the leading financial institutions in UAE with strong digital capabilities.',
      signals: [
        {
          title: 'Digital Pioneer',
          content: 'One of the leading financial institutions in the UAE with strong digital capabilities.',
          confidence: 0.9,
          relevance: 0.9,
        },
        {
          title: 'Mashreq Neo',
          content: 'Launched Mashreq Neo, a fully digital banking platform.',
          confidence: 0.9,
          relevance: 0.95,
        },
      ],
    },
    {
      name: 'Dubai Islamic Bank',
      description: 'Largest Islamic bank in UAE and pioneer in Islamic banking.',
      signals: [
        {
          title: 'Largest Islamic Bank in UAE',
          content: 'DIB is the largest Islamic bank in the UAE and a pioneer in Islamic banking.',
          confidence: 0.95,
          relevance: 0.9,
        },
        {
          title: 'Sharia-Compliant Innovation',
          content: 'Leading in Islamic fintech and digital Sharia-compliant products.',
          confidence: 0.85,
          relevance: 0.85,
        },
      ],
    },
  ],

  // =========================================================================
  // DEFAULT KPIs
  // =========================================================================
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
// SEED FUNCTION
// =============================================================================

export async function seedBankingEmployeeUAE(): Promise<void> {
  console.log('[Seed] Seeding Banking / Employee Banking / UAE...');

  try {
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

    console.log(`[Seed] ✓ Seeded: ${result.name} (ID: ${result.id})`);
  } catch (error) {
    console.error('[Seed] ✗ Failed to seed Banking/Employee Banking/UAE:', error);
    throw error;
  }
}

export { BANKING_EMPLOYEE_UAE_CONFIG };

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  seedBankingEmployeeUAE()
    .then(() => {
      console.log('[Seed] Complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Seed] Failed:', error);
      process.exit(1);
    });
}
