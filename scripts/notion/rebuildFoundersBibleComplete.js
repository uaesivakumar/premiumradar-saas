/**
 * Rebuild Complete Founders Bible with Sales-Bench v1 Integration
 * All 8 mandatory sections + Section 9 (Sales-Bench)
 */

import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });

const TODAY = new Date().toISOString().split('T')[0];

// ============================================================================
// SECTION DATA
// ============================================================================

const QUICK_REF = {
  product: 'PremiumRadar + UPR OS',
  tagline: 'AI-Powered Sales Enablement Platform',
  problem: 'Salespeople waste 60% of time on non-selling activities',
  solution: 'SIVA AI delivers qualified leads with actionable intelligence',
  market: 'Banking (UAE) first, multi-vertical expansion planned',
  moat: 'First AI-native sales OS with behavioral evaluation (Sales-Bench)',
};

const SECTION_1_ESSENTIALS = `**Product:** PremiumRadar SaaS + UPR OS
**Tagline:** AI-Powered Sales Enablement Platform

**Problem Solved:**
Salespeople in Banking (and soon other verticals) spend 60%+ of time on non-selling activities: researching leads, qualifying prospects, and managing follow-ups. They miss opportunities and lack real-time intelligence.

**Target Audience:**
- Banking salespeople (Employee Banking, Corporate Banking, SME Banking)
- Future: Insurance, Real Estate, Recruitment, SaaS Sales

**Unique Value:**
- SIVA: Intelligent agent that discovers, scores, and ranks leads
- OS: Operating system layer with model routing, control plane
- Sales-Bench: Behavioral evaluation for SIVA quality assurance`;

const SECTION_2_FRAMEWORKS = {
  frontend: ['Next.js 14 (App Router)', 'React 18', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'Zustand'],
  backend: ['Express.js (OS)', 'Next.js API (SaaS)', 'Prisma ORM', 'PostgreSQL'],
  ai: ['Anthropic Claude', 'OpenAI GPT-4', 'Model Router (multi-provider)'],
  os: ['SIVA Intelligence Layer', 'Control Plane', 'Model Router', 'Sales-Bench v1'],
  security: ['JWT Auth', 'OIDC', 'Zero-Trust Tokens', 'WAF', 'Rate Limiting'],
};

const SECTION_3_TECH = {
  languages: ['TypeScript', 'JavaScript (ES2022)', 'SQL', 'Bash'],
  databases: ['PostgreSQL 15', 'Prisma ORM'],
  cloud: ['GCP: Cloud Run, Cloud SQL, Secret Manager, Pub/Sub, Cloud Armor'],
  apis: ['Anthropic API', 'OpenAI API', 'Stripe API', 'Notion API', 'Apollo API'],
  salesBench: ['Buyer Bot Engine', 'CRS Scorer', 'Path Executor', 'Calibration Engine'],
};

const SECTION_4_CAPABILITIES = [
  'SIVA Discovery - AI-powered lead discovery from signals',
  'SIVA Scoring - Q/T/L/E scoring with reasoning',
  'SIVA Ranking - Priority ranking based on persona context',
  'Model Router - Dynamic LLM selection per capability',
  'Control Plane - Super-Admin configuration management',
  'Sales-Bench v1 - Behavioral evaluation with CRS (8 dimensions)',
  'Buyer Bots - 5 mandatory adversarial test harnesses',
  'Golden/Kill Paths - Positive and adversarial scenario testing',
  'Human Calibration - Spearman correlation quality metrics',
];

const SECTION_5_ELI5 = `Imagine you're a salesperson trying to find the best companies to sell to.

PremiumRadar + SIVA is like having a super-smart assistant who:
- Finds companies that might need your product RIGHT NOW (signals like hiring, expansion)
- Tells you WHO to talk to and WHY they might buy
- Gives you talking points for each conversation
- Learns what works and gets better over time

Sales-Bench is like a practice arena where we test SIVA with fake buyers:
- Some buyers are nice (Golden Path)
- Some buyers are really tough (Kill Path - like a buyer who has no budget!)
- This helps SIVA learn to handle ALL situations`;

const SECTION_6_ANALOGY = `**UPR OS = Salesforce + ChatGPT had a baby**

Traditional CRM: You enter data, it stores data
PremiumRadar: AI FINDS the data and tells you what to do

**Sales-Bench = Flight Simulator for SIVA**

Just as pilots practice in simulators before flying real planes:
- SIVA practices with Buyer Bots before talking to real prospects
- We test edge cases (budget blockers, skeptics) safely
- CRS scores measure "how good was that conversation?"

No crashes in production because we crashed 1000 times in simulation.`;

const SECTION_7_AUDIENCES = {
  investors: {
    title: 'For Investors',
    content: `**Market:** Banking sales enablement (UAE first)
**Moat:** First AI-native sales OS with behavioral evaluation
**Model:** SaaS + consumption-based LLM costs
**Status:** MVP live, Sales-Bench v1 deployed
**Validation:** 8 sprints, 53 features, deterministic replay`,
  },
  cxos: {
    title: 'For CXOs',
    content: `**Problem:** Sales teams waste time on low-quality leads
**Solution:** SIVA AI discovers and qualifies automatically
**Quality:** Sales-Bench ensures SIVA behaves correctly
**ROI:** 60% time savings, higher conversion rates`,
  },
  engineers: {
    title: 'For Engineers',
    content: `**Architecture:** SaaS → OS → SIVA (3-tier)
**Key Patterns:** Model routing, authority invariance, deterministic seeding
**Quality:** Sales-Bench with 8 CRS dimensions, Spearman correlation
**Stack:** TypeScript, Express, Next.js, PostgreSQL, Claude/GPT-4`,
  },
};

const SECTION_8_INNOVATION = {
  unique: [
    'AI-First Sales OS - Not retrofitted, built for AI from day 1',
    'Sales-Bench - Only platform with behavioral evaluation for sales AI',
    'Model Router - Dynamic LLM selection per capability',
    'Authority Invariance - Sales-Bench cannot affect production',
    'Deterministic Replay - Same seed = identical test results',
  ],
  salesBenchMoat: `Sales-Bench is our secret weapon:
- 8 CRS dimensions with FIXED weights (can't game the scores)
- 5 mandatory adversarial bots (tests edge cases)
- Spearman correlation (n>=30) for calibration quality
- Human-in-the-loop calibration for continuous improvement`,
  vision: `Phase 1 (Now): Banking UAE with SIVA + Sales-Bench
Phase 2 (Q1): Multi-vertical expansion
Phase 3 (Q2): Advanced Sales-Bench with auto-calibration
Phase 4 (2026): AI-Managed Sales Intelligence Platform`,
};

const SALES_BENCH_SECTION = {
  quickRef: {
    module: 'Sales-Bench v1',
    prd: 'PRD v1.3 Appendix',
    purpose: 'Behavioral evaluation system for SIVA',
    principle: 'ADVISORY ONLY - never alters SIVA runtime',
    sprints: 'S241-S248 (8 sprints, 53 features)',
    deployed: '2025-12-19',
    commit: '6e2d2b4',
  },
  crsDimensions: [
    { name: 'Qualification', weight: '15%' },
    { name: 'Needs Discovery', weight: '15%' },
    { name: 'Value Articulation', weight: '15%' },
    { name: 'Objection Handling', weight: '15%' },
    { name: 'Process Adherence', weight: '10%' },
    { name: 'Compliance', weight: '10%' },
    { name: 'Relationship Building', weight: '10%' },
    { name: 'Next Step Secured', weight: '10%' },
  ],
  mandatoryBots: [
    'Budget Blocker - Always objects to price',
    'Compliance Gatekeeper - Demands certifications',
    'Competitor Advocate - Favors competitor',
    'Information Gatherer - Asks but never commits',
    'Aggressive Skeptic - Challenges everything',
  ],
  keyRules: [
    'Authority Invariance: Cannot modify envelopes/personas/policies',
    'Cross-Vertical Prohibition: Cannot aggregate across verticals (§7.3)',
    'Deterministic Replay: Same seed = identical Buyer Bot behavior',
    'CRS Advisory Only: Never alters SIVA runtime decisions',
    'Spearman Correlation: n>=30 for valid calibration quality',
  ],
  endpoints: [
    '/api/os/sales-bench/scenarios - Scenario CRUD (immutable)',
    '/api/os/sales-bench/runs - Run management (append-only)',
    '/api/os/sales-bench/buyer-bots - Buyer Bot registry',
    '/api/os/sales-bench/mandatory - Mandatory adversarial bots',
    '/api/os/sales-bench/crs - CRS scoring (8 dimensions)',
    '/api/os/sales-bench/execution - Path execution (golden/kill)',
    '/api/os/sales-bench/calibration - Human calibration (Spearman)',
  ],
};

// ============================================================================
// BUILD NOTION BLOCKS
// ============================================================================

async function rebuildFoundersBible() {
  console.log('Rebuilding Complete Founders Bible...\n');

  const pageId = dbIds.knowledge_page_id;
  const blocks = [];

  // ========== HEADER ==========
  blocks.push({
    object: 'block',
    type: 'heading_1',
    heading_1: { rich_text: [{ type: 'text', text: { content: 'PremiumRadar Founders Bible' } }] },
  });

  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [{
        type: 'text',
        text: { content: `Last Updated: ${TODAY} | Sales-Bench v1 Integrated | By Claude (TC)` },
        annotations: { italic: true, color: 'gray' },
      }],
    },
  });

  // ========== QUICK REFERENCE CARD ==========
  blocks.push({
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [{
        type: 'text',
        text: { content: `QUICK REFERENCE

Product: ${QUICK_REF.product}
Tagline: ${QUICK_REF.tagline}
Problem: ${QUICK_REF.problem}
Solution: ${QUICK_REF.solution}
Market: ${QUICK_REF.market}
Moat: ${QUICK_REF.moat}` },
      }],
      icon: { emoji: '📌' },
      color: 'blue_background',
    },
  });

  blocks.push({ object: 'block', type: 'divider', divider: {} });
  blocks.push({ object: 'block', type: 'table_of_contents', table_of_contents: { color: 'gray' } });
  blocks.push({ object: 'block', type: 'divider', divider: {} });

  // ========== SECTION 1: PRODUCT ESSENTIALS ==========
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: '1. Product Essentials' } }] },
  });

  blocks.push({
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: 'Click to expand Product Essentials' }, annotations: { bold: true } }],
      children: [{
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: SECTION_1_ESSENTIALS } }] },
      }],
    },
  });

  // ========== SECTION 2: CORE FRAMEWORKS ==========
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: '2. Core Frameworks' } }] },
  });

  blocks.push({
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: 'Click to expand Core Frameworks' }, annotations: { bold: true } }],
      children: [
        { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: `Frontend: ${SECTION_2_FRAMEWORKS.frontend.join(' | ')}` } }] } },
        { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: `Backend: ${SECTION_2_FRAMEWORKS.backend.join(' | ')}` } }] } },
        { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: `AI Layer: ${SECTION_2_FRAMEWORKS.ai.join(' | ')}` } }] } },
        { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: `OS Modules: ${SECTION_2_FRAMEWORKS.os.join(' | ')}` }, annotations: { bold: true } }] } },
        { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: `Security: ${SECTION_2_FRAMEWORKS.security.join(' | ')}` } }] } },
      ],
    },
  });

  // ========== SECTION 3: TECHNOLOGIES ==========
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: '3. Technologies Used' } }] },
  });

  blocks.push({
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: 'Click to expand Technologies' }, annotations: { bold: true } }],
      children: [
        { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: `Languages: ${SECTION_3_TECH.languages.join(', ')}` } }] } },
        { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: `Databases: ${SECTION_3_TECH.databases.join(', ')}` } }] } },
        { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: SECTION_3_TECH.cloud[0] } }] } },
        { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: `APIs: ${SECTION_3_TECH.apis.join(', ')}` } }] } },
        { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: `Sales-Bench: ${SECTION_3_TECH.salesBench.join(', ')}` }, annotations: { bold: true } }] } },
      ],
    },
  });

  // ========== SECTION 4: KEY CAPABILITIES ==========
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: '4. Key Capabilities' } }] },
  });

  blocks.push({
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: 'Click to expand Key Capabilities' }, annotations: { bold: true } }],
      children: SECTION_4_CAPABILITIES.map(cap => ({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ type: 'text', text: { content: cap } }] },
      })),
    },
  });

  // ========== SECTION 5: ELI5 ==========
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: '5. ELI5 (Explain Like I\'m 5)' } }] },
  });

  blocks.push({
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [{ type: 'text', text: { content: SECTION_5_ELI5 } }],
      icon: { emoji: '🧒' },
      color: 'yellow_background',
    },
  });

  // ========== SECTION 6: ANALOGY ==========
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: '6. Real-World Analogy' } }] },
  });

  blocks.push({
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [{ type: 'text', text: { content: SECTION_6_ANALOGY } }],
      icon: { emoji: '🎯' },
      color: 'green_background',
    },
  });

  // ========== SECTION 7: AUDIENCES ==========
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: '7. Explain to Different Audiences' } }] },
  });

  for (const [key, data] of Object.entries(SECTION_7_AUDIENCES)) {
    blocks.push({
      object: 'block',
      type: 'toggle',
      toggle: {
        rich_text: [{ type: 'text', text: { content: data.title }, annotations: { bold: true } }],
        children: [{
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: data.content } }] },
        }],
      },
    });
  }

  // ========== SECTION 8: INNOVATION ==========
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: '8. Innovation & Differentiation' } }] },
  });

  blocks.push({
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: 'What Makes Us Unique' }, annotations: { bold: true } }],
      children: SECTION_8_INNOVATION.unique.map(item => ({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ type: 'text', text: { content: item } }] },
      })),
    },
  });

  blocks.push({
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: 'Sales-Bench Competitive Moat' }, annotations: { bold: true } }],
      children: [{
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: SECTION_8_INNOVATION.salesBenchMoat } }] },
      }],
    },
  });

  blocks.push({
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: 'Future Vision' }, annotations: { bold: true } }],
      children: [{
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: SECTION_8_INNOVATION.vision } }] },
      }],
    },
  });

  blocks.push({ object: 'block', type: 'divider', divider: {} });

  // ========== SECTION 9: SALES-BENCH v1 (Detailed) ==========
  blocks.push({
    object: 'block',
    type: 'heading_1',
    heading_1: { rich_text: [{ type: 'text', text: { content: '9. Sales-Bench v1 (PRD v1.3 Appendix)' } }] },
  });

  blocks.push({
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [{
        type: 'text',
        text: { content: `SALES-BENCH REFERENCE

Module: ${SALES_BENCH_SECTION.quickRef.module}
PRD: ${SALES_BENCH_SECTION.quickRef.prd}
Purpose: ${SALES_BENCH_SECTION.quickRef.purpose}
Principle: ${SALES_BENCH_SECTION.quickRef.principle}
Sprints: ${SALES_BENCH_SECTION.quickRef.sprints}
Deployed: ${SALES_BENCH_SECTION.quickRef.deployed}
Commit: ${SALES_BENCH_SECTION.quickRef.commit}` },
      }],
      icon: { emoji: '🧪' },
      color: 'purple_background',
    },
  });

  // 9.1 CRS Dimensions
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: '9.1 CRS Dimensions (Fixed Weights = 1.0)' } }] },
  });

  blocks.push({
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: 'Click to expand 8 CRS Dimensions' }, annotations: { bold: true } }],
      children: SALES_BENCH_SECTION.crsDimensions.map(dim => ({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ type: 'text', text: { content: `${dim.name} (${dim.weight})` } }] },
      })),
    },
  });

  // 9.2 Mandatory Bots
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: '9.2 Mandatory Adversarial Bots' } }] },
  });

  blocks.push({
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: 'Click to expand 5 Mandatory Bots' }, annotations: { bold: true } }],
      children: SALES_BENCH_SECTION.mandatoryBots.map(bot => ({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ type: 'text', text: { content: bot } }] },
      })),
    },
  });

  // 9.3 Key Rules
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: '9.3 Key Rules (MUST FOLLOW)' } }] },
  });

  blocks.push({
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [{ type: 'text', text: { content: SALES_BENCH_SECTION.keyRules.join('\n\n') } }],
      icon: { emoji: '⚠️' },
      color: 'red_background',
    },
  });

  // 9.4 API Endpoints
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: '9.4 API Endpoints' } }] },
  });

  blocks.push({
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: 'Click to expand API Reference' }, annotations: { bold: true } }],
      children: SALES_BENCH_SECTION.endpoints.map(ep => ({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: { rich_text: [{ type: 'text', text: { content: ep } }] },
      })),
    },
  });

  // ========== FOOTER ==========
  blocks.push({ object: 'block', type: 'divider', divider: {} });

  blocks.push({
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [{ type: 'text', text: { content: `Founders Bible maintained by Claude (TC). Last rebuild: ${TODAY}. All 9 sections complete with Sales-Bench v1 integrated.` } }],
      icon: { emoji: '🤖' },
      color: 'gray_background',
    },
  });

  // ==================== SYNC TO NOTION ====================
  try {
    console.log('Clearing existing content...');

    // Get and delete all existing blocks
    let hasMore = true;
    let cursor = undefined;
    while (hasMore) {
      const existingBlocks = await notion.blocks.children.list({
        block_id: pageId,
        page_size: 100,
        start_cursor: cursor
      });

      for (const block of existingBlocks.results) {
        await notion.blocks.delete({ block_id: block.id });
      }

      hasMore = existingBlocks.has_more;
      cursor = existingBlocks.next_cursor;
    }

    console.log('Appending new complete content...');

    // Notion has a limit of 100 blocks per append, so we batch
    const batchSize = 100;
    for (let i = 0; i < blocks.length; i += batchSize) {
      const batch = blocks.slice(i, i + batchSize);
      await notion.blocks.children.append({ block_id: pageId, children: batch });
      console.log(`  Appended blocks ${i + 1} to ${Math.min(i + batchSize, blocks.length)}`);
    }

    console.log('\n=== FOUNDERS BIBLE REBUILT ===');
    console.log(`Total blocks: ${blocks.length}`);
    console.log('');
    console.log('Structure:');
    console.log('  1. Product Essentials (with Sales-Bench mention)');
    console.log('  2. Core Frameworks (OS Modules includes Sales-Bench)');
    console.log('  3. Technologies (Sales-Bench engines listed)');
    console.log('  4. Key Capabilities (CRS, Buyer Bots, Paths)');
    console.log('  5. ELI5 (explains Sales-Bench simply)');
    console.log('  6. Real-World Analogy (Flight Simulator for SIVA)');
    console.log('  7. Different Audiences (mentions Sales-Bench)');
    console.log('  8. Innovation (Sales-Bench as competitive moat)');
    console.log('  9. Sales-Bench v1 Detailed (full reference)');
    console.log('');
    console.log('Sales-Bench v1 is now integrated throughout the Founders Bible!');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

rebuildFoundersBible().catch(console.error);
