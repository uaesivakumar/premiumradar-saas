/**
 * Update Sprint S71: Multi-Vertical Persona Architecture
 */
import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });

const TODAY = new Date().toISOString().split('T')[0];

const SPRINT_DATA = {
  number: 71,
  name: 'S71: Multi-Vertical Persona Architecture',
  goal: 'Implement persona-per-sub-vertical architecture enabling SIVA to dynamically load personas from database for vertical-specific intelligence behavior.',
  outcomes: 'sub_vertical_personas table with JSONB config, PersonaService with CRUD+caching, personaLoader helper for SIVA tools, EdgeCasesTool/TimingScoreTool/ContactTierTool v3.0 with persona loading, Super Admin Persona tab, SIVA client v3.0 with sub_vertical_slug.',
  highlights: 'Dynamic persona loading by sub-vertical, blocker/booster matching for enterprise brands and government, timing rules for Q1/Summer/Q4, contact priority tiers by company size, QTLE scoring weights (T=0.35 highest for EB)',
  businessValue: 'Foundation for multi-vertical expansion - each sub-vertical can have unique persona config. Sales teams get vertical-optimized intelligence without code changes.',
  learnings: 'Persona architecture: Vertical=WHAT industry, Sub-Vertical=WHO salesperson is, Persona=HOW SIVA thinks. Fallback persona essential for graceful degradation.',
};

async function findOrCreateSprint(sprintNum, sprintName) {
  const response = await notion.databases.query({
    database_id: dbIds.sprints_db_id,
    filter: {
      property: 'Sprint',
      title: { starts_with: `Sprint ${sprintNum}:` }
    }
  });

  if (response.results.length > 0) {
    return { id: response.results[0].id, exists: true };
  }

  const newPage = await notion.pages.create({
    parent: { database_id: dbIds.sprints_db_id },
    properties: {
      'Sprint': { title: [{ text: { content: `Sprint ${sprintNum}: ${sprintName}` } }] },
    }
  });

  return { id: newPage.id, exists: false };
}

async function updateSprint(pageId, data) {
  await notion.pages.update({
    page_id: pageId,
    properties: {
      'Status': { select: { name: 'Done' } },
      'Goal': { rich_text: [{ text: { content: data.goal } }] },
      'Sprint Notes': { rich_text: [{ text: { content: `${data.name} - Multi-Vertical Persona Architecture for SIVA Tools` } }] },
      'Outcomes': { rich_text: [{ text: { content: data.outcomes } }] },
      'Highlights': { rich_text: [{ text: { content: data.highlights } }] },
      'Business Value': { rich_text: [{ text: { content: data.businessValue } }] },
      'Learnings': { rich_text: [{ text: { content: data.learnings } }] },
      'Branch': { rich_text: [{ text: { content: 'main' } }] },
      'Commit': { rich_text: [{ text: { content: 'feat(s71): Multi-Vertical Persona Architecture' } }] },
      'Git Tag': { rich_text: [{ text: { content: 'sprint-saas-s71-certified' } }] },
      'Started At': { date: { start: TODAY } },
      'Completed At': { date: { start: TODAY } },
      'Synced At': { date: { start: TODAY } },
      'Phases Updated': { multi_select: [{ name: 'Done' }] },
    },
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Updating Sprint S71: Multi-Vertical Persona Architecture');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    const { id, exists } = await findOrCreateSprint(SPRINT_DATA.number, SPRINT_DATA.name.split(': ')[1]);

    if (exists) {
      console.log(`Found Sprint ${SPRINT_DATA.number}, updating...`);
    } else {
      console.log(`Created Sprint ${SPRINT_DATA.number}, populating...`);
    }

    await updateSprint(id, SPRINT_DATA);
    console.log(`✓ Sprint ${SPRINT_DATA.number}: ${SPRINT_DATA.name} → Done\n`);

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ✅ Sprint S71 updated successfully!');
    console.log('═══════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error(`✗ Sprint ${SPRINT_DATA.number} failed:`, error.message);
    process.exit(1);
  }
}

main().catch(console.error);
