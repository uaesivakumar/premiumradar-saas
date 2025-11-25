#!/usr/bin/env node
/**
 * Create Colorful Knowledge Pages for Stream 6: Discovery & Outreach UI
 *
 * Creates rich, colorful pages covering:
 * - Signal Viewer & Types
 * - Company Profiles & Enrichment
 * - Discovery Engine
 * - Ranking & Explanations
 * - Outreach Workflow
 */

import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });

const TODAY = '2025-11-25';

// ============================================================
// BLOCK HELPERS (Following UPR Template)
// ============================================================

const coloredHeading = (text, color) => ({
  object: 'block',
  type: 'heading_2',
  heading_2: {
    rich_text: [{ type: 'text', text: { content: text } }],
    color: color,
  },
});

const yellowCallout = (text, emoji = '💡') => ({
  object: 'block',
  type: 'callout',
  callout: {
    rich_text: [{ type: 'text', text: { content: text } }],
    icon: { type: 'emoji', emoji: emoji },
    color: 'yellow_background',
  },
});

const greenQuote = (text) => ({
  object: 'block',
  type: 'quote',
  quote: {
    rich_text: [{ type: 'text', text: { content: text } }],
    color: 'green_background',
  },
});

const brownCallout = (text, emoji = '📌') => ({
  object: 'block',
  type: 'callout',
  callout: {
    rich_text: [{ type: 'text', text: { content: text } }],
    icon: { type: 'emoji', emoji: emoji },
    color: 'brown_background',
  },
});

const paragraph = (text) => ({
  object: 'block',
  type: 'paragraph',
  paragraph: { rich_text: [{ type: 'text', text: { content: text } }] },
});

const bullet = (text) => ({
  object: 'block',
  type: 'bulleted_list_item',
  bulleted_list_item: { rich_text: [{ type: 'text', text: { content: text } }] },
});

const code = (text, language = 'typescript') => ({
  object: 'block',
  type: 'code',
  code: {
    rich_text: [{ type: 'text', text: { content: text } }],
    language: language,
  },
});

const divider = () => ({ object: 'block', type: 'divider', divider: {} });

// ============================================================
// KNOWLEDGE PAGES FOR STREAM 6
// ============================================================

const PAGES = [
  {
    title: `Signal Viewer & Types (Updated: ${TODAY})`,
    icon: '📊',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        'Remember report cards in school? You got grades for Math, Reading, Science. Each grade told your parents something different. Domain signals are like report cards for websites - Traffic grade, SEO grade, Brand grade. All together they tell us how "healthy" a domain is!',
      ),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        'Like a health checkup: A doctor checks your blood pressure, cholesterol, heart rate, etc. Each test reveals something about your health. Signals are the same - traffic shows popularity, SEO shows search visibility, brand shows recognition. Together they give a complete health picture of a domain.',
      ),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        '8 signal types: traffic, seo, social, brand, market, technical, financial, legal. Each signal has strength (strong/moderate/weak/neutral/negative), value (0-100), confidence (0-1), and trend (up/down/stable).',
      ),
      brownCallout(
        'Signal types: Traffic (visitor metrics), SEO (search ranking), Social (mentions), Brand (recognition), Market (comparable sales), Technical (SSL/DNS), Financial (estimated value), Legal (disputes)',
        '🎛️',
      ),
      code(
        `// Signal structure
interface Signal {
  type: SignalType;
  strength: 'strong' | 'moderate' | 'weak' | 'neutral' | 'negative';
  value: number;  // 0-100 normalized
  rawValue: string | number;  // Original value
  confidence: number;  // 0-1
  trend?: 'up' | 'down' | 'stable';
}`,
      ),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/discovery/types.ts - Signal, SignalGroup, SignalSummary types'),
      bullet('lib/discovery/signals.ts - useSignalStore, calculateSignalScore'),
      bullet('components/discovery/SignalViewer.tsx - Visual signal display'),
      bullet('groupSignals() - Groups signals by type with aggregate scores'),
      bullet('SIGNAL_TYPE_CONFIG - Icons, labels, colors for each type'),
    ],
  },
  {
    title: `Company Profiles & Enrichment (Updated: ${TODAY})`,
    icon: '🏢',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        'When you meet a new friend, you want to know about them - their name, where they live, what they do. Company profiles are like making a "friend card" for businesses that own domains. We gather info about who they are, how big they are, and what they do!',
      ),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        'Like LinkedIn for companies: You see their name, industry, employee count, funding stage, headquarters. Enrichment is like a research assistant that fills in missing info from multiple sources - checking Clearbit, LinkedIn, Crunchbase to build a complete picture.',
      ),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        'CompanyProfile contains: name, domain, industry, employee range, revenue range, funding stage, headquarters, technologies, social profiles. Enrichment pulls data from 8 sources: whois, dns, ssl, traffic, seo, social, company, market.',
      ),
      brownCallout(
        'Data Quality: Score (0-100) based on completeness (% fields filled), freshness (days since update), accuracy (source reliability). 90-day decay for freshness.',
        '📈',
      ),
      code(
        `// Enrichment sources
type EnrichmentSource =
  'whois' | 'dns' | 'ssl' | 'traffic' |
  'seo' | 'social' | 'company' | 'market';

// Data quality calculation
score = completeness * 0.4 + freshness * 0.3 + accuracy * 0.3`,
      ),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/discovery/company-profiles.ts - Profile store and helpers'),
      bullet('lib/discovery/enrichment.ts - Multi-source enrichment engine'),
      bullet('components/discovery/CompanyProfile.tsx - Profile display component'),
      bullet('enrichDomain() - Orchestrates enrichment from multiple sources'),
      bullet('calculateDataQuality() - Computes quality score from profile'),
    ],
  },
  {
    title: `Discovery Engine (Updated: ${TODAY})`,
    icon: '🔍',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        'Remember playing "hide and seek"? Discovery is like being really good at finding hidden things! We help find valuable domains that are hiding in the internet - by searching keywords, finding similar ones, or catching ones about to expire.',
      ),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        'Like a real estate agent with special tools: They can search "3-bedroom homes under $500K near good schools" with specific filters. Discovery lets you search "tech domains under $10K, no hyphens, high traffic" and find exactly what you want.',
      ),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        '5 discovery modes: keyword (search terms), similar (like reference domain), competitor (same vertical), trending (gaining traction), expiring (about to drop). Results include Q/T/L/E scores, availability, price, and match reason.',
      ),
      brownCallout(
        'Filters: TLDs, length range, price range, min score, exclude hyphens/numbers, vertical, registrar, expiring within days',
        '🎯',
      ),
      code(
        `// Discovery query
const query = buildDiscoveryQuery('keyword', 'fintech', {
  tlds: ['.com', '.io'],
  maxPrice: 25000,
  minScore: 60,
  excludeHyphens: true,
  vertical: 'Finance',
});

// Results with scores
{ domain, scores: { quality, traffic, liquidity, endUser, composite } }`,
      ),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/discovery/discovery-engine.ts - Core search and filtering'),
      bullet('useDiscoveryStore() - Results, saved searches, watchlist'),
      bullet('components/discovery/DiscoveryResults.tsx - Results display'),
      bullet('buildDiscoveryQuery() - Creates query with defaults'),
      bullet('sortResults() - Sort by score, price, length, or match'),
    ],
  },
  {
    title: `Ranking & Explanations (Updated: ${TODAY})`,
    icon: '🏆',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        'In sports, players get ranked #1, #2, #3 based on their stats. We rank domains the same way! But we also explain WHY - "This domain is #1 because it has great traffic AND a short memorable name." No mystery rankings!',
      ),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        'Like college rankings with explanations: US News ranks universities but shows WHY - research output, graduation rate, faculty ratio. Our rankings show WHY a domain scored high - length bonus, .com TLD, strong traffic. Transparent and educational.',
      ),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        'Q/T/L/E scoring: Quality (0.30), Traffic (0.25), Liquidity (0.20), End-User (0.25). Modifiers add/subtract: premium TLD (+10), short length (+15), hyphens (-15), numbers (-10). Tiers: excellent (85+), good (70+), fair (50+), poor (<50).',
      ),
      brownCallout(
        'Explanations include: Summary text, top factors (positive/negative), detailed breakdown per category, comparisons to similar domains, actionable recommendations',
        '📋',
      ),
      code(
        `// Explanation structure
interface RankingExplanation {
  summary: string;
  topFactors: ExplanationFactor[];  // Impact: positive/negative
  detailedBreakdown: ScoreBreakdown[];  // Per category
  comparisons: DomainComparison[];  // vs similar
  recommendations: string[];  // Action items
}`,
      ),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/ranking/ranking-engine.ts - Score calculation, modifiers'),
      bullet('lib/ranking/explanations.ts - Human-readable explanations'),
      bullet('components/ranking/RankingCard.tsx - Ranked domain display'),
      bullet('components/ranking/RankingExplanation.tsx - Full breakdown view'),
      bullet('generateSummary() - Creates natural language explanation'),
    ],
  },
  {
    title: `Outreach Workflow (Updated: ${TODAY})`,
    icon: '📤',
    blocks: [
      coloredHeading('🎯 Simple Explanation (ELI5)', 'orange'),
      yellowCallout(
        'Before sending a letter, you write it, check for mistakes, maybe ask mom to read it, then put it in an envelope and mail it. Outreach workflow is the same - compose, preview, schedule or send. Step by step so nothing goes wrong!',
      ),

      divider(),

      coloredHeading('🌍 Real-World Analogy', 'green'),
      greenQuote(
        'Like email marketing tools (Mailchimp): You write your message, preview how it looks on different devices, schedule it for the best time, then confirm before sending. Our workflow is compose → preview → schedule → confirm → send.',
      ),

      divider(),

      coloredHeading('⚙️ Technical Explanation', 'purple'),
      paragraph(
        '7 workflow stages: compose, preview, schedule, confirm, sending, sent, failed. Supports 3 channels: email, linkedin, phone. Draft includes recipient, channel, subject, body, tone, template. Validation ensures required fields before sending.',
      ),
      brownCallout(
        'Tone analysis: Formality (word length), Friendliness (questions), Urgency (exclamations), Professionalism (overall). Real-time feedback as you type.',
        '🎨',
      ),
      code(
        `// Workflow stages
type WorkflowStage =
  'compose' | 'preview' | 'schedule' |
  'confirm' | 'sending' | 'sent' | 'failed';

// Send result
interface SendResult {
  success: boolean;
  sentAt?: Date;
  deliveryStatus?: 'pending' | 'delivered' | 'bounced' | 'opened';
}`,
      ),

      divider(),

      coloredHeading('🛠️ Implementation Details', 'blue'),
      bullet('lib/outreach/workflow.ts - Workflow store and progression'),
      bullet('components/outreach/SendWorkflow.tsx - Complete workflow UI'),
      bullet('components/outreach/OutreachPreview.tsx - Message preview'),
      bullet('useOutreachWorkflowStore() - Draft, schedule, send actions'),
      bullet('validateDraft() - Ensures required fields per channel'),
    ],
  },
];

// ============================================================
// MAIN
// ============================================================

async function createPages() {
  console.log('\n🎨 Creating COLORFUL Knowledge Pages for Stream 6...\n');

  for (const page of PAGES) {
    try {
      // Archive existing pages with same base title
      const baseTitle = page.title.split('(')[0].trim();
      const existing = await notion.search({
        query: baseTitle,
        filter: { property: 'object', value: 'page' },
      });

      for (const result of existing.results) {
        if (result.parent?.page_id === dbIds.knowledge_page_id) {
          await notion.pages.update({ page_id: result.id, archived: true });
          console.log(`  📦 Archived old: ${baseTitle}`);
        }
      }

      // Create new page under Knowledge parent
      await notion.pages.create({
        parent: { page_id: dbIds.knowledge_page_id },
        icon: { type: 'emoji', emoji: page.icon },
        properties: {
          title: { title: [{ text: { content: page.title } }] },
        },
        children: page.blocks,
      });

      console.log(`✅ ${page.icon} ${page.title}`);
    } catch (err) {
      console.error(`❌ ${page.title}: ${err.message}`);
    }
  }

  console.log(`
═══════════════════════════════════════════════════════════════
  Stream 6 Knowledge Pages Complete!
═══════════════════════════════════════════════════════════════

Created 5 colorful pages:
  📊 Signal Viewer & Types
  🏢 Company Profiles & Enrichment
  🔍 Discovery Engine
  🏆 Ranking & Explanations
  📤 Outreach Workflow

Each page includes:
  🟠 Orange headers for ELI5
  🟢 Green sections for Analogies
  🟣 Purple sections for Technical Details
  🔵 Blue sections for Implementation
  🟡 Yellow callouts for key insights

`);
}

createPages().catch(console.error);
