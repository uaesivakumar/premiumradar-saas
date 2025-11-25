/**
 * COMPLETE GOVERNANCE SCRIPT
 *
 * ONE script to rule them all. Run this after EVERY stretch.
 *
 * Usage: NOTION_TOKEN=xxx npx tsx scripts/notion/governanceComplete.js <sprint_start> <sprint_end>
 * Example: npx tsx scripts/notion/governanceComplete.js 8 9
 */

import { Client } from '@notionhq/client';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

// ============================================================
// CONFIGURATION
// ============================================================

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const TODAY = new Date().toISOString().split('T')[0];

const args = process.argv.slice(2);
const SPRINT_START = parseInt(args[0]) || 8;
const SPRINT_END = parseInt(args[1]) || 9;

console.log(`
╔══════════════════════════════════════════════════════════════╗
║           COMPLETE GOVERNANCE - SPRINTS ${SPRINT_START}-${SPRINT_END}                 ║
║                     ${TODAY}                            ║
╚══════════════════════════════════════════════════════════════╝
`);

// ============================================================
// BLOCK HELPERS
// ============================================================

const coloredHeading = (text, color) => ({
  object: 'block',
  type: 'heading_2',
  heading_2: {
    rich_text: [{ type: 'text', text: { content: text } }],
    color: color
  }
});

const yellowCallout = (text, emoji = '💡') => ({
  object: 'block',
  type: 'callout',
  callout: {
    rich_text: [{ type: 'text', text: { content: text } }],
    icon: { type: 'emoji', emoji: emoji },
    color: 'yellow_background'
  }
});

const greenQuote = (text) => ({
  object: 'block',
  type: 'quote',
  quote: {
    rich_text: [{ type: 'text', text: { content: text } }],
    color: 'green_background'
  }
});

const paragraph = (text) => ({
  object: 'block',
  type: 'paragraph',
  paragraph: { rich_text: [{ type: 'text', text: { content: text } }] }
});

const bullet = (text) => ({
  object: 'block',
  type: 'bulleted_list_item',
  bulleted_list_item: { rich_text: [{ type: 'text', text: { content: text } }] }
});

const divider = () => ({ object: 'block', type: 'divider', divider: {} });

// ============================================================
// STEP 1: UPDATE SPRINTS DB
// ============================================================

async function updateSprintsDB() {
  console.log('\n📅 STEP 1: UPDATING SPRINTS DATABASE');
  console.log('─'.repeat(60));

  let updated = 0;
  let created = 0;

  for (let i = SPRINT_START; i <= SPRINT_END; i++) {
    try {
      const existing = await notion.databases.query({
        database_id: dbIds.sprints_db_id,
        filter: { property: 'Sprint', title: { contains: `S${i}` } }
      });

      if (existing.results.length > 0) {
        await notion.pages.update({
          page_id: existing.results[0].id,
          properties: { 'Status': { select: { name: 'Done' } } }
        });
        console.log(`✅ S${i}: Status → Done`);
        updated++;
      } else {
        console.log(`⚠️  S${i}: Not found in database`);
      }
    } catch (err) {
      console.error(`❌ S${i}: ${err.message}`);
    }
  }

  return { updated, created };
}

// ============================================================
// STEP 2: UPDATE FEATURES DB
// ============================================================

async function updateFeaturesDB() {
  console.log('\n📦 STEP 2: UPDATING FEATURES DATABASE');
  console.log('─'.repeat(60));

  let updated = 0;

  // Build filter for all sprints in range
  const sprintFilters = [];
  for (let i = SPRINT_START; i <= SPRINT_END; i++) {
    sprintFilters.push({ property: 'Sprint', number: { equals: i } });
  }

  const features = await notion.databases.query({
    database_id: dbIds.module_features_db_id,
    filter: { or: sprintFilters }
  });

  for (const feat of features.results) {
    const name = feat.properties['Features']?.title?.[0]?.text?.content || 'Unknown';
    const currentStatus = feat.properties['Status']?.select?.name;

    if (currentStatus !== 'Done') {
      await notion.pages.update({
        page_id: feat.id,
        properties: { 'Status': { select: { name: 'Done' } } }
      });
      console.log(`✅ ${name}: Status → Done`);
      updated++;
    } else {
      console.log(`✓  ${name}: Already Done`);
    }
  }

  return { total: features.results.length, updated };
}

// ============================================================
// STEP 3: VERIFY BUILD
// ============================================================

async function verifyBuild() {
  console.log('\n🔨 STEP 3: VERIFYING BUILD');
  console.log('─'.repeat(60));

  try {
    execSync('npm run build', { stdio: 'pipe', timeout: 120000 });
    console.log('✅ Build: PASSED');
    return true;
  } catch (err) {
    console.error('❌ Build: FAILED');
    console.error(err.stdout?.toString() || err.message);
    return false;
  }
}

// ============================================================
// STEP 4: TYPE CHECK
// ============================================================

async function verifyTypes() {
  console.log('\n📝 STEP 4: TYPE CHECK');
  console.log('─'.repeat(60));

  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe', timeout: 60000 });
    console.log('✅ TypeScript: NO ERRORS');
    return true;
  } catch (err) {
    console.error('❌ TypeScript: ERRORS FOUND');
    console.error(err.stdout?.toString() || err.message);
    return false;
  }
}

// ============================================================
// STEP 5: CREATE KNOWLEDGE PAGES (Template - customize per stream)
// ============================================================

async function createKnowledgePages() {
  console.log('\n📚 STEP 5: KNOWLEDGE PAGES');
  console.log('─'.repeat(60));
  console.log('⚠️  Knowledge pages must be customized per stream.');
  console.log('   Run the stream-specific script after this.');
  return { created: 0 };
}

// ============================================================
// SUMMARY
// ============================================================

async function main() {
  const results = {
    sprints: { updated: 0, created: 0 },
    features: { total: 0, updated: 0 },
    build: false,
    types: false,
    knowledge: { created: 0 }
  };

  // Run all steps
  results.sprints = await updateSprintsDB();
  results.features = await updateFeaturesDB();
  results.build = await verifyBuild();
  results.types = await verifyTypes();
  results.knowledge = await createKnowledgePages();

  // Print summary
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    GOVERNANCE SUMMARY                        ║
╠══════════════════════════════════════════════════════════════╣
║ Sprints Updated:     ${String(results.sprints.updated).padEnd(38)}║
║ Features Updated:    ${String(results.features.updated + '/' + results.features.total).padEnd(38)}║
║ Build Status:        ${(results.build ? '✅ PASSED' : '❌ FAILED').padEnd(38)}║
║ Type Check:          ${(results.types ? '✅ PASSED' : '❌ FAILED').padEnd(38)}║
╠══════════════════════════════════════════════════════════════╣
║ ${results.build && results.types ? '✅ GOVERNANCE COMPLETE' : '❌ GOVERNANCE INCOMPLETE - FIX ERRORS'}                              ║
╚══════════════════════════════════════════════════════════════╝
`);

  // Exit with error if failed
  if (!results.build || !results.types) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ FATAL:', err.message);
  process.exit(1);
});
