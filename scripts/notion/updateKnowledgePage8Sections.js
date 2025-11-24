/**
 * Update Knowledge Page with ALL 8 Learning Sections
 * ORGANIZED VERSION - Easy to navigate with collapsible sections
 */

import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });

// ============================================================================
// CONTENT DATA
// ============================================================================

const QUICK_REF = {
  product: 'PremiumRadar',
  tagline: 'AI-Powered Intelligence for Premium Domain Investing',
  problem: 'Domain investors waste 100+ hrs/week on manual research',
  solution: 'AI analysis in seconds with explainable reasoning',
  market: '$10B+ premium domain market, 15% YoY growth',
  moat: 'First AI-native platform, proprietary algorithms, security-first',
};

const SECTION_1_ESSENTIALS = `**Product:** PremiumRadar
**Tagline:** AI-Powered Intelligence Platform for Premium Domain Investing

**Problem Solved:**
Premium domain investors spend 100+ hours/week manually researching domains. They lack real-time intelligence, miss opportunities, and make costly mistakes. PremiumRadar reduces research time by 90% while improving decision quality.

**Target Audience:**
- Premium domain investors ($10K-$10M+ portfolios)
- Domain brokers and agencies
- Brand protection teams at enterprises
- Domaining enthusiasts transitioning to professionals

**Unique Value:**
The ONLY platform combining: AI-powered analysis (not just data), real-time market intelligence, investment scoring with explainable reasoning, and enterprise-grade security.`;

const SECTION_2_FRAMEWORKS = {
  frontend: ['Next.js 14 (App Router)', 'React 18', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'Zustand'],
  backend: ['Next.js API Routes', 'Prisma ORM', 'OpenAI GPT-4', 'OIDC Auth', 'Custom OS Layer'],
  infra: ['Cloud Run', 'Cloud SQL (PostgreSQL)', 'Pub/Sub', 'Secret Manager', 'Cloud Armor WAF', 'GitHub Actions'],
  security: ['7-Layer Prompt Firewall', 'Zero-Trust Tokens', '4-Tier Rate Limiting', 'WAF (SQLi/XSS)', 'Anti-RE Pipeline', 'Immutable Audit Logs'],
};

const SECTION_3_TECH = {
  languages: ['TypeScript', 'JavaScript (ES2022)', 'SQL', 'Bash'],
  databases: ['PostgreSQL 15', 'Prisma ORM', 'Redis (planned)'],
  cloud: ['GCP: Cloud Run, Cloud SQL, Pub/Sub, Secret Manager, Cloud Armor, Logging, Monitoring'],
  apis: ['OpenAI API', 'Stripe API', 'Notion API', 'Domain registrar APIs (planned)'],
};

const SECTION_4_CAPABILITIES = [
  'AI Domain Analysis - Instant valuation and investment scoring',
  'Natural Language Queries - Ask in plain English',
  'Portfolio Intelligence - AI-powered optimization',
  'Market Monitoring - Real-time alerts',
  'Investment Scoring - 1-100 with reasoning',
  'Bulk Analysis - Thousands of domains at once',
  'Enterprise Security - 7-layer protection',
];

const SECTION_5_ELI5 = `Imagine you want to buy special toys that might be worth money someday. But there are millions of toys!

PremiumRadar is like a super-smart friend who:
- Looks at every toy and tells you which ones are special
- Explains WHY a toy might be valuable
- Warns you if a toy costs too much
- Tells you when a really good toy becomes available

For grown-ups buying website names (domains), PremiumRadar does the same thing - it's an AI helper that finds the best domains to invest in!`;

const SECTION_6_ANALOGY = `**PremiumRadar = Bloomberg Terminal for Domain Investing**

Just as Wall Street traders use Bloomberg ($24K/year) for:
- Real-time market data
- Investment analysis
- Portfolio monitoring
- Market alerts

Domain investors use PremiumRadar for:
- AI-powered domain analysis
- Investment opportunities
- Portfolio optimization
- Domain availability alerts

Key Difference: Affordable + AI explains everything in plain English.

Also like: Zillow for real estate → PremiumRadar for domains`;

const SECTION_7_AUDIENCES = {
  investors: {
    title: 'For Investors',
    content: `**Market:** $10B+ annually, 15% YoY growth
**Opportunity:** First AI-native platform in $2B TAM
**Model:** SaaS with 80%+ gross margins
**Traction:** Security foundation complete, MVP Q1 2025
**Ask:** $500K seed for 12-month runway to PMF`,
  },
  cxos: {
    title: 'For CXOs',
    content: `**Problem:** Manual domain research = wasted time
**Solution:** Automate monitoring, AI threat detection
**ROI:** 90% time reduction, faster response
**Security:** Zero-trust, SOC2 roadmap, 99.9% SLA`,
  },
  bdms: {
    title: 'For Sales/BDMs',
    content: `**Pain Points:** "40+ hrs/week researching" "Missed opportunities"
**Value Prop:** AI in seconds, never miss deals, explainable reasoning
**Pricing:** Starter $49/mo | Pro $149/mo | Enterprise custom`,
  },
  hiring: {
    title: 'For Hiring Managers',
    content: `**Stack:** Next.js 14, TypeScript, Prisma, PostgreSQL, GCP
**Challenges:** <500ms AI, millions of analyses/day, explainable AI
**Culture:** AI-assisted dev, 150+ red-team tests, remote-first`,
  },
  engineers: {
    title: 'For Engineers',
    content: `**Architecture:** [SaaS] --OIDC--> [OS] --OIDC--> [Worker]
**Key Decisions:** Service separation, 30-min token rotation, streaming AI
**Security:** 7-layer firewall, nonce anti-replay, 4-tier rate limiting
**Quality:** TypeScript strict, 153 attack prompt tests, immutable logs`,
  },
};

const SECTION_8_INNOVATION = {
  unique: [
    'AI-First Design - Built for AI, not retrofitted',
    'Explainable Intelligence - Every score has reasoning',
    'Security-First - Enterprise-grade from day 1',
    'Real-Time - Live signals, not stale cache',
    'Natural Language - Ask questions, get answers',
  ],
  competitive: `vs. Estibot: Rule-based → We: AI with reasoning
vs. NameBio: Historical only → We: Predictive + historical
vs. ChatGPT: No domain expertise → We: Specialized + live data
Our Moat: Proprietary prompts, network effects, data advantage, security`,
  vision: `Phase 1 (Now): AI Analysis Platform
Phase 2 (6mo): Market Intelligence + Alerts
Phase 3 (12mo): Transaction Platform
Phase 4 (24mo): AI-Managed Domain Fund
Vision: "Blackrock of Domains" - managing billions with AI`,
};

// ============================================================================
// BUILD NOTION BLOCKS
// ============================================================================

async function updateKnowledgePage() {
  console.log('Updating Knowledge Page (ORGANIZED VERSION)...\n');

  const pageId = dbIds.knowledge_page_id;
  const blocks = [];

  // ========== HEADER ==========
  blocks.push({
    object: 'block',
    type: 'heading_1',
    heading_1: { rich_text: [{ type: 'text', text: { content: 'PremiumRadar Knowledge Base' } }] },
  });

  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [{
        type: 'text',
        text: { content: `Last Updated: ${new Date().toISOString().split('T')[0]} by Claude (TC)` },
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

  // ========== TABLE OF CONTENTS ==========
  blocks.push({
    object: 'block',
    type: 'table_of_contents',
    table_of_contents: { color: 'gray' },
  });

  blocks.push({ object: 'block', type: 'divider', divider: {} });

  // ========== SECTION 1: PRODUCT ESSENTIALS (Toggle) ==========
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

  // ========== SECTION 2: CORE FRAMEWORKS (Toggle) ==========
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
        { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: `Infrastructure: ${SECTION_2_FRAMEWORKS.infra.join(' | ')}` } }] } },
        { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: `Security: ${SECTION_2_FRAMEWORKS.security.join(' | ')}` } }] } },
      ],
    },
  });

  // ========== SECTION 3: TECHNOLOGIES (Toggle) ==========
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
      ],
    },
  });

  // ========== SECTION 4: KEY CAPABILITIES (Toggle) ==========
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

  // ========== SECTION 5: ELI5 (Callout) ==========
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

  // ========== SECTION 6: REAL-WORLD ANALOGY (Callout) ==========
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

  // ========== SECTION 7: AUDIENCES (Multiple Toggles) ==========
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

  // ========== SECTION 8: INNOVATION (Toggle) ==========
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
      rich_text: [{ type: 'text', text: { content: 'Competitive Advantage' }, annotations: { bold: true } }],
      children: [{
        object: 'block',
        type: 'paragraph',
        paragraph: { rich_text: [{ type: 'text', text: { content: SECTION_8_INNOVATION.competitive } }] },
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

  // ========== FOOTER ==========
  blocks.push({ object: 'block', type: 'divider', divider: {} });

  blocks.push({
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [{ type: 'text', text: { content: 'This Knowledge Page is maintained by TC (Claude). Updated after every stretch. All 8 sections are mandatory.' } }],
      icon: { emoji: '🤖' },
      color: 'gray_background',
    },
  });

  // ==================== SYNC TO NOTION ====================
  try {
    console.log('Fetching existing blocks...');
    const existingBlocks = await notion.blocks.children.list({ block_id: pageId, page_size: 100 });

    console.log(`Clearing ${existingBlocks.results.length} existing blocks...`);
    for (const block of existingBlocks.results) {
      await notion.blocks.delete({ block_id: block.id });
    }

    // Check for more blocks (pagination)
    let hasMore = existingBlocks.has_more;
    let nextCursor = existingBlocks.next_cursor;
    while (hasMore) {
      const moreBlocks = await notion.blocks.children.list({ block_id: pageId, page_size: 100, start_cursor: nextCursor });
      for (const block of moreBlocks.results) {
        await notion.blocks.delete({ block_id: block.id });
      }
      hasMore = moreBlocks.has_more;
      nextCursor = moreBlocks.next_cursor;
    }

    console.log('Appending new organized content...');
    await notion.blocks.children.append({ block_id: pageId, children: blocks });

    console.log('\n=== Knowledge Page Updated (ORGANIZED) ===');
    console.log(`Total blocks: ${blocks.length}`);
    console.log('Structure:');
    console.log('  - Quick Reference Card (always visible)');
    console.log('  - Table of Contents (auto-generated)');
    console.log('  - 8 Sections with collapsible toggles');
    console.log('  - ELI5 & Analogy as highlighted callouts');
    console.log('\nReady for SKC review!');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

updateKnowledgePage().catch(console.error);
