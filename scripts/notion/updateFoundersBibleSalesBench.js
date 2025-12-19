/**
 * Update Founders Bible (Knowledge Page) with Sales-Bench v1
 * Appends new section for S241-S248 Sales-Bench implementation
 */

import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });

const TODAY = new Date().toISOString().split('T')[0];

// ============================================================================
// SALES-BENCH v1 CONTENT
// ============================================================================

const SALES_BENCH_QUICK_REF = {
  module: 'Sales-Bench v1',
  prd: 'PRD v1.3 Appendix',
  purpose: 'Behavioral evaluation system for SIVA',
  principle: 'Advisory only - never alters SIVA runtime',
  sprints: 'S241-S248 (8 sprints, 53 features)',
  deployed: '2025-12-19',
};

const CRS_DIMENSIONS = [
  { name: 'Qualification', weight: '15%', description: 'Identifies BANT (Budget, Authority, Need, Timeline)' },
  { name: 'Needs Discovery', weight: '15%', description: 'Uncovers pain points and requirements' },
  { name: 'Value Articulation', weight: '15%', description: 'Connects solution to customer needs' },
  { name: 'Objection Handling', weight: '15%', description: 'Addresses concerns professionally' },
  { name: 'Process Adherence', weight: '10%', description: 'Follows sales methodology' },
  { name: 'Compliance', weight: '10%', description: 'Maintains regulatory compliance' },
  { name: 'Relationship Building', weight: '10%', description: 'Builds rapport and trust' },
  { name: 'Next Step Secured', weight: '10%', description: 'Advances deal to next stage' },
];

const MANDATORY_BOTS = [
  { name: 'Budget Blocker', trigger: 'price_objection', behavior: 'Always objects to price, claims no budget' },
  { name: 'Compliance Gatekeeper', trigger: 'compliance_question', behavior: 'Demands certifications and approvals' },
  { name: 'Competitor Advocate', trigger: 'competitor_mention', behavior: 'Favors competitor, skeptical of our solution' },
  { name: 'Information Gatherer', trigger: 'info_request', behavior: 'Asks questions but never commits' },
  { name: 'Aggressive Skeptic', trigger: 'pushback', behavior: 'Challenges every statement' },
];

const KEY_CONCEPTS = {
  authorityInvariance: 'Sales-Bench CANNOT modify envelopes, personas, or policies. Advisory only.',
  crossVerticalProhibition: 'Cannot aggregate scores across different verticals (PRD v1.3 §7.3)',
  deterministicReplay: 'Same seed produces identical Buyer Bot behavior. Reproducible tests.',
  hardOutcomes: 'PASS (sale progressed), FAIL (opportunity lost), BLOCK (compliance override)',
  spearmanCorrelation: 'Calibration quality metric. Requires n>=30 samples.',
};

const API_ENDPOINTS = [
  { path: '/api/os/sales-bench/scenarios', methods: 'GET/POST/DELETE', purpose: 'Scenario CRUD (immutable)' },
  { path: '/api/os/sales-bench/runs', methods: 'GET/POST', purpose: 'Run management (append-only)' },
  { path: '/api/os/sales-bench/buyer-bots', methods: 'GET/POST/PATCH/DELETE', purpose: 'Buyer Bot registry' },
  { path: '/api/os/sales-bench/mandatory', methods: 'GET/POST', purpose: 'Mandatory adversarial bots' },
  { path: '/api/os/sales-bench/crs', methods: 'GET/POST', purpose: 'CRS scoring (8 dimensions)' },
  { path: '/api/os/sales-bench/execution', methods: 'POST/GET', purpose: 'Path execution (golden/kill)' },
  { path: '/api/os/sales-bench/calibration', methods: 'GET/POST', purpose: 'Human calibration (Spearman)' },
];

// ============================================================================
// BUILD NOTION BLOCKS
// ============================================================================

async function updateFoundersBible() {
  console.log('Updating Founders Bible with Sales-Bench v1...\n');

  const pageId = dbIds.knowledge_page_id;
  const blocks = [];

  // ========== SALES-BENCH HEADER ==========
  blocks.push({ object: 'block', type: 'divider', divider: {} });

  blocks.push({
    object: 'block',
    type: 'heading_1',
    heading_1: { rich_text: [{ type: 'text', text: { content: '9. Sales-Bench v1 (PRD v1.3 Appendix)' } }] },
  });

  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [{
        type: 'text',
        text: { content: `Added: ${TODAY} | Sprints: S241-S248 | Status: DEPLOYED` },
        annotations: { italic: true, color: 'gray' },
      }],
    },
  });

  // ========== QUICK REFERENCE ==========
  blocks.push({
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [{
        type: 'text',
        text: { content: `SALES-BENCH QUICK REFERENCE

Module: ${SALES_BENCH_QUICK_REF.module}
PRD: ${SALES_BENCH_QUICK_REF.prd}
Purpose: ${SALES_BENCH_QUICK_REF.purpose}
Principle: ${SALES_BENCH_QUICK_REF.principle}
Sprints: ${SALES_BENCH_QUICK_REF.sprints}
Deployed: ${SALES_BENCH_QUICK_REF.deployed}` },
      }],
      icon: { emoji: '🧪' },
      color: 'purple_background',
    },
  });

  // ========== CRS DIMENSIONS (8 fixed weights) ==========
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
      children: CRS_DIMENSIONS.map(dim => ({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{
            type: 'text',
            text: { content: `${dim.name} (${dim.weight}): ${dim.description}` },
          }],
        },
      })),
    },
  });

  // ========== BUYER BOTS ==========
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
      children: MANDATORY_BOTS.map(bot => ({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{
            type: 'text',
            text: { content: `${bot.name}: ${bot.behavior}` },
          }],
        },
      })),
    },
  });

  // ========== KEY CONCEPTS ==========
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: '9.3 Key Concepts' } }] },
  });

  blocks.push({
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [{
        type: 'text',
        text: { content: `AUTHORITY INVARIANCE
${KEY_CONCEPTS.authorityInvariance}

CROSS-VERTICAL PROHIBITION
${KEY_CONCEPTS.crossVerticalProhibition}

DETERMINISTIC REPLAY
${KEY_CONCEPTS.deterministicReplay}

HARD OUTCOMES
${KEY_CONCEPTS.hardOutcomes}

SPEARMAN CORRELATION
${KEY_CONCEPTS.spearmanCorrelation}` },
      }],
      icon: { emoji: '⚠️' },
      color: 'red_background',
    },
  });

  // ========== PATH TYPES ==========
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: '9.4 Golden vs Kill Paths' } }] },
  });

  blocks.push({
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: 'Golden Path (Positive Sales)' }, annotations: { bold: true } }],
      children: [{
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: { content: `Step-wise progression toward sale. Tests SIVA's ability to:
- Qualify opportunities correctly
- Handle standard objections
- Advance deals through stages
- Secure commitments

Expected Outcome: PASS (deal advanced) or FAIL (opportunity lost)
Minimum 3 mandatory adversarial bots required.` },
          }],
        },
      }],
    },
  });

  blocks.push({
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: 'Kill Path (Adversarial Refusal)' }, annotations: { bold: true } }],
      children: [{
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{
            type: 'text',
            text: { content: `Tests SIVA's ability to gracefully handle impossible scenarios:
- Buyer has no budget and never will
- Compliance blocks entire product category
- Competitor has exclusive contract
- Buyer is information gathering only

Expected Outcome: FAIL (graceful exit) or BLOCK (compliance override)
ALL 5 mandatory adversarial bots required for Kill paths.` },
          }],
        },
      }],
    },
  });

  // ========== API ENDPOINTS ==========
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: '9.5 API Endpoints' } }] },
  });

  blocks.push({
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: 'Click to expand API Reference' }, annotations: { bold: true } }],
      children: API_ENDPOINTS.map(ep => ({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{
            type: 'text',
            text: { content: `${ep.path} [${ep.methods}]: ${ep.purpose}` },
          }],
        },
      })),
    },
  });

  // ========== SPRINT SUMMARY ==========
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: [{ type: 'text', text: { content: '9.6 Sprint Summary (S241-S248)' } }] },
  });

  blocks.push({
    object: 'block',
    type: 'toggle',
    toggle: {
      rich_text: [{ type: 'text', text: { content: 'Click to expand Sprint Details' }, annotations: { bold: true } }],
      children: [
        { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: 'S241: Sales-Bench Foundation (types, guards, authority invariance)' } }] } },
        { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: 'S242: Scenario Management API (immutable scenarios, append-only runs)' } }] } },
        { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: 'S243: Buyer Bot Framework (hidden states, failure triggers, variants)' } }] } },
        { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: 'S244: Mandatory Adversarial Bots (5 required test harnesses)' } }] } },
        { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: 'S245: CRS Foundation (8 dimensions, fixed weights summing to 1.0)' } }] } },
        { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: 'S246: CRS Dimension Scoring (pattern-based conversation analysis)' } }] } },
        { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: 'S247: Golden & Kill Path Execution (deterministic replay)' } }] } },
        { object: 'block', type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ type: 'text', text: { content: 'S248: Human Calibration Tooling (Spearman correlation, n>=30)' } }] } },
      ],
    },
  });

  // ========== FOOTER ==========
  blocks.push({
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: [{ type: 'text', text: { content: `Sales-Bench v1 deployed ${TODAY}. Commit: 6e2d2b4. 8 sprints, 53 features. CRS is ADVISORY ONLY - never alters SIVA runtime.` } }],
      icon: { emoji: '✅' },
      color: 'green_background',
    },
  });

  // ==================== APPEND TO NOTION ====================
  try {
    console.log('Appending Sales-Bench section to Knowledge Page...');
    await notion.blocks.children.append({ block_id: pageId, children: blocks });

    console.log('\n=== Founders Bible Updated ===');
    console.log(`Added ${blocks.length} blocks`);
    console.log('New section: 9. Sales-Bench v1 (PRD v1.3 Appendix)');
    console.log('Subsections:');
    console.log('  9.1 CRS Dimensions (8 fixed weights)');
    console.log('  9.2 Mandatory Adversarial Bots (5 bots)');
    console.log('  9.3 Key Concepts (authority invariance, etc.)');
    console.log('  9.4 Golden vs Kill Paths');
    console.log('  9.5 API Endpoints');
    console.log('  9.6 Sprint Summary (S241-S248)');

  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

updateFoundersBible().catch(console.error);
