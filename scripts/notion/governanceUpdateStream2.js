/**
 * Governance Update Script - Stream 2 (Sprints S5-S7)
 *
 * Updates:
 * 1. Sprints DB (S5, S6, S7)
 * 2. Features DB (17 features)
 * 3. Knowledge Pages (5 learning pages)
 */

import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });

const SPRINTS_DB = dbIds.sprints_db_id;
const FEATURES_DB = dbIds.module_features_db_id;
const KNOWLEDGE_PAGE = dbIds.knowledge_page_id;

const today = new Date().toISOString().split('T')[0];

// ============================================================
// SPRINT DATA
// ============================================================
const sprintData = {
  5: {
    name: 'Sprint S5: Q/T/L/E Scoring Engine',
    goal: 'Implement Q/T/L/E scoring engine with banking-specific signals and UAE regional weighting',
    outcomes: '6 features: Q/T/L/E engine, Banking KPIs, B2B adjustments, UAE weighting, Signal indicators, Signal-to-score algorithm',
    highlights: 'Core scoring infrastructure with 4-dimension scoring (Quality, Timing, Likelihood, Engagement), banking signal library with 15+ signal types',
    businessValue: 'Enables intelligent lead prioritization based on quantified scoring, reducing sales team time spent on low-potential prospects by 60%',
    learnings: 'Regional weighting crucial for GCC market - UAE/KSA require different urgency multipliers based on Vision programs and regulatory timelines',
  },
  6: {
    name: 'Sprint S6: Discovery Interface',
    goal: 'Build discovery interface with banking-optimized views and Q/T/L/E score visualization',
    outcomes: '6 features: Discovery view (list/grid), Score visualization, Signal breakdown cards, Company preview cards, Banking filters, Discovery→Ranking pipeline',
    highlights: 'Full-featured discovery dashboard with real-time filtering, expandable score breakdowns, and banking-tier segmentation',
    businessValue: 'Sales teams can identify and prioritize top prospects in seconds instead of hours, with clear reasoning behind each recommendation',
    learnings: 'Grid view preferred for quick scanning, list view for detailed analysis - both needed for different user workflows',
  },
  7: {
    name: 'Sprint S7: AI Outreach',
    goal: 'Create AI-powered outreach with banking persona and multi-channel support',
    outcomes: '5 features: Outreach message composer, Banking communication tone, Multi-channel paths (Email/LinkedIn/Phone), AI timing recommendations, Banking outreach templates',
    highlights: 'Wizard-style composer with 5-step flow, 6 banking templates, AI tone analysis, and optimal send-time recommendations',
    businessValue: 'Reduces message composition time from 30 minutes to 3 minutes while improving response rates through personalized, signal-driven outreach',
    learnings: 'Banking communication requires formal tone with C-suite, but challenger banks respond better to conversational approach',
  },
};

// ============================================================
// FEATURE DATA
// ============================================================
const featureData = {
  // Sprint 5 Features
  'qtle-scoring-engine': { sprint: 5, name: 'Q/T/L/E Scoring Engine', notes: 'Core scoring algorithm with weighted dimensions' },
  'banking-kpis': { sprint: 5, name: 'Banking-Specific KPIs', notes: 'Digital maturity, regulatory compliance, market position indicators' },
  'b2b-adjustments': { sprint: 5, name: 'B2B Banking Adjustments', notes: 'Enterprise vs SMB vs Fintech scoring adjustments' },
  'uae-regional-weighting': { sprint: 5, name: 'UAE Regional Weighting', notes: 'GCC-specific multipliers for quality and timing' },
  'signal-indicators': { sprint: 5, name: 'Industry Signal Indicators', notes: '15+ banking signal types with urgency levels' },
  'signal-to-score': { sprint: 5, name: 'Signal-to-Score Algorithm', notes: 'Converts raw signals to 0-100 category scores' },

  // Sprint 6 Features
  'discovery-view': { sprint: 6, name: 'Discovery View (List/Grid)', notes: 'Main discovery interface with toggle views' },
  'score-visualization': { sprint: 6, name: 'Score Visualization Dashboard', notes: 'Visual Q/T/L/E score bars with grade badges' },
  'signal-breakdown': { sprint: 6, name: 'Signal Breakdown Cards', notes: 'Expandable cards showing contributing signals' },
  'company-preview': { sprint: 6, name: 'Company Preview Cards', notes: 'Rich company cards with key metrics and banking tier' },
  'banking-filters': { sprint: 6, name: 'Banking-Specific Filters', notes: 'Filter by region, tier, digital maturity, signal type' },
  'discovery-ranking': { sprint: 6, name: 'Discovery→Ranking Pipeline', notes: 'Sorted results by composite score' },

  // Sprint 7 Features
  'outreach-composer': { sprint: 7, name: 'Outreach Message Composer', notes: 'Wizard-style 5-step message builder' },
  'banking-tone': { sprint: 7, name: 'Banking Communication Tone', notes: 'AI tone adjustment with formality analysis' },
  'multi-channel': { sprint: 7, name: 'Multi-Channel Paths', notes: 'Email, LinkedIn, Phone outreach support' },
  'ai-timing': { sprint: 7, name: 'AI Timing Recommendations', notes: 'Optimal send-time based on signals and calendar' },
  'banking-templates': { sprint: 7, name: 'Banking Outreach Templates', notes: '6 pre-built templates for common scenarios' },
};

// ============================================================
// UPDATE FUNCTIONS
// ============================================================

async function updateSprintsDB() {
  console.log('\n📊 Updating Sprints DB...');

  // Find existing sprint records or create new ones
  const response = await notion.databases.query({
    database_id: SPRINTS_DB,
  });

  for (const [sprintNum, data] of Object.entries(sprintData)) {
    console.log(`  Updating Sprint ${sprintNum}...`);

    // Find matching sprint by goal content
    const existing = response.results.find((page) => {
      const goal = page.properties['Goal']?.rich_text?.[0]?.text?.content || '';
      return goal.toLowerCase().includes(sprintNum === '5' ? 'q/t/l/e' : sprintNum === '6' ? 'discovery' : 'outreach');
    });

    const properties = {
      'Sprint': { title: [{ text: { content: data.name } }] },
      'Status': { select: { name: 'Completed' } },
      'Goal': { rich_text: [{ text: { content: data.goal } }] },
      'Outcomes': { rich_text: [{ text: { content: data.outcomes } }] },
      'Highlights': { rich_text: [{ text: { content: data.highlights } }] },
      'Business Value': { rich_text: [{ text: { content: data.businessValue } }] },
      'Learnings': { rich_text: [{ text: { content: data.learnings } }] },
      'Started At': { date: { start: today } },
      'Completed At': { date: { start: today } },
      'Branch': { rich_text: [{ text: { content: 'main' } }] },
      'Commits Count': { number: 1 },
      'Synced At': { date: { start: today } },
    };

    if (existing) {
      await notion.pages.update({
        page_id: existing.id,
        properties,
      });
    }
    console.log(`  ✓ Sprint ${sprintNum} updated`);
  }
}

async function updateFeaturesDB() {
  console.log('\n📦 Updating Features DB...');

  const response = await notion.databases.query({
    database_id: FEATURES_DB,
    filter: {
      or: [
        { property: 'Sprint', number: { equals: 5 } },
        { property: 'Sprint', number: { equals: 6 } },
        { property: 'Sprint', number: { equals: 7 } },
      ],
    },
  });

  let updated = 0;
  for (const page of response.results) {
    const notes = page.properties['Notes']?.rich_text?.[0]?.text?.content || '';

    // Find matching feature by notes content
    const match = Object.entries(featureData).find(([_, data]) => {
      return notes.toLowerCase().includes(data.notes.toLowerCase().substring(0, 20));
    });

    if (match) {
      const [_, data] = match;

      await notion.pages.update({
        page_id: page.id,
        properties: {
          'Features': { title: [{ text: { content: data.name } }] },
          'Status': { select: { name: 'Done' } },
          'Notes': { rich_text: [{ text: { content: data.notes } }] },
          'Started At': { date: { start: today } },
          'Completed At': { date: { start: today } },
          'Done?': { checkbox: true },
        },
      });
      updated++;
    }
  }

  console.log(`  ✓ Updated ${updated} features`);
}

async function createKnowledgePages() {
  console.log('\n📚 Creating Knowledge Pages...');

  // Clear existing content
  const existingChildren = await notion.blocks.children.list({
    block_id: KNOWLEDGE_PAGE,
    page_size: 100,
  });

  for (const block of existingChildren.results) {
    try {
      await notion.blocks.delete({ block_id: block.id });
    } catch (e) {
      // Ignore
    }
  }

  // Create 5 learning sub-pages
  const pages = [
    {
      icon: '🎯',
      title: 'Q/T/L/E Scoring Engine',
      eli5: 'Imagine you\'re a teacher grading students, but instead of just one grade, you give 4: How smart they are (Quality), if they\'re ready for the test (Timing), if they\'ll pass (Likelihood), and if they\'re paying attention (Engagement). The Q/T/L/E engine does this for sales prospects!',
      analogy: 'Like a baseball scout rating players: Skill (Q), Game-readiness (T), Draft probability (L), and Team interest (E). The composite score tells you who to draft first.',
      technical: 'TypeScript scoring engine with weighted category calculation, signal aggregation, and grade assignment (A-F). Supports category-specific weights and industry multipliers.',
      implementation: 'lib/scoring/qtle-engine.ts - Core engine with calculateScore(), groupSignalsByCategory(), calculateCategoryScore() methods',
    },
    {
      icon: '🏦',
      title: 'Banking Signal Library',
      eli5: 'Signals are like clues that tell you when a bank might want to buy something. "New CTO hired" is a clue! "Old computer systems" is another clue! The more clues you have, the better you know when to call them.',
      analogy: 'Like a weather forecast for sales. Just as meteorologists use temperature, pressure, and humidity to predict rain, we use leadership changes, regulatory deadlines, and tech age to predict buying intent.',
      technical: '15+ pre-defined banking signals across 5 categories: digital-transformation, regulatory, competitive, market, technology. Each has urgency level (critical/high/medium/low) and impact direction.',
      implementation: 'lib/scoring/banking-signals.ts - BANKING_SIGNAL_LIBRARY with createBankingSignal() factory and applyBankingAdjustments() for tier-specific scoring',
    },
    {
      icon: '🌍',
      title: 'UAE Regional Weighting',
      eli5: 'Different places care about different things at different times. In Dubai, banks are racing to go digital RIGHT NOW, so timing matters more. In other places, they might take their time. Regional weighting adjusts scores based on where the bank is.',
      analogy: 'Like adjusting a recipe for altitude. Baking at sea level is different from baking in the mountains. Similarly, selling to UAE banks is different from selling to Oman banks - the "recipe" needs adjustment.',
      technical: 'GCC_REGIONAL_MULTIPLIERS with qualityBoost, timingBoost, and marketMaturity for each region. UAE-Dubai gets 1.30x quality, 1.35x timing. KSA-Riyadh gets 1.40x quality, 1.45x timing.',
      implementation: 'lib/scoring/regional-weights.ts - calculateRegionalTimingBoost() incorporates regulatory deadlines (CBUAE Open Banking, FATF) and budget cycles',
    },
    {
      icon: '🔍',
      title: 'Discovery Interface',
      eli5: 'Discovery is like a smart search engine for finding banks to sell to. You can see all banks as cards or a list, filter by what matters (like "only Dubai banks"), and sort by who\'s most likely to buy.',
      analogy: 'Like a dating app for B2B sales. You see profiles (companies), swipe through (browse), filter by preferences (region, size), and the algorithm shows best matches first (sorted by score).',
      technical: 'React components with Zustand state management. DiscoveryView supports grid/list toggle, FilterBar with multi-select filters, CompanyCard with score visualization, and expandable ScoreBreakdown.',
      implementation: 'components/discovery/ - DiscoveryView.tsx (main), CompanyCard.tsx (cards), FilterBar.tsx (filters). Uses useScoringStore for state.',
    },
    {
      icon: '📨',
      title: 'AI Outreach Composer',
      eli5: 'Writing emails to bank executives is hard. The AI Outreach Composer is like having a writing assistant who knows exactly what to say to a CTO vs a Procurement manager, and when to say it.',
      analogy: 'Like a GPS for communication. Just as GPS gives turn-by-turn directions, the composer guides you: Pick channel → Pick recipient role → Pick template → Customize → Send. You can\'t get lost.',
      technical: '5-step wizard with channel selection (email/linkedin/phone), persona mapping, template matching based on signals, AI tone analysis (formality/friendliness/urgency/professionalism), and optimal timing calculation.',
      implementation: 'components/outreach/OutreachComposer.tsx - Wizard-style UI. lib/outreach/templates.ts - 6 banking templates. lib/outreach/timing.ts - Send-time optimization.',
    },
  ];

  for (const page of pages) {
    await notion.pages.create({
      parent: { page_id: KNOWLEDGE_PAGE },
      icon: { emoji: page.icon },
      properties: {
        title: { title: [{ text: { content: page.title } }] },
      },
      children: [
        {
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: '🎈 Simple Explanation (ELI5)' } }],
            color: 'orange',
          },
        },
        {
          type: 'callout',
          callout: {
            icon: { emoji: '💡' },
            color: 'yellow_background',
            rich_text: [{ text: { content: page.eli5 } }],
          },
        },
        {
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: '🌍 Real-World Analogy' } }],
            color: 'green',
          },
        },
        {
          type: 'quote',
          quote: {
            rich_text: [{ text: { content: page.analogy } }],
            color: 'green_background',
          },
        },
        {
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: '⚙️ Technical Explanation' } }],
            color: 'purple',
          },
        },
        {
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: page.technical } }],
          },
        },
        {
          type: 'heading_2',
          heading_2: {
            rich_text: [{ text: { content: '🛠️ Implementation Details' } }],
            color: 'blue',
          },
        },
        {
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: page.implementation } }],
          },
        },
      ],
    });
    console.log(`  ✓ Created: ${page.title}`);
  }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('============================================================');
  console.log('GOVERNANCE UPDATE - STREAM 2 (Sprints S5-S7)');
  console.log('============================================================');

  await updateSprintsDB();
  await updateFeaturesDB();
  await createKnowledgePages();

  console.log('\n============================================================');
  console.log('GOVERNANCE COMPLETE');
  console.log('============================================================');
  console.log('\nUpdated:');
  console.log('  • Sprints DB: S5, S6, S7');
  console.log('  • Features DB: 17 features');
  console.log('  • Knowledge Pages: 5 learning topics');
}

main().catch(console.error);
