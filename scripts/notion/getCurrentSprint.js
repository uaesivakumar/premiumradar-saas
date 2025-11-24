/**
 * Get current sprint features from Notion
 * Usage: NOTION_TOKEN="..." node scripts/notion/getCurrentSprint.js [sprint_number]
 *
 * Examples:
 *   node scripts/notion/getCurrentSprint.js       # Auto-detect or default to 64
 *   node scripts/notion/getCurrentSprint.js 65    # Show Sprint 65
 */

import { Client } from '@notionhq/client';

// PremiumRadar-SAAS Notion Workspace
const SPRINTS_DB_ID = '5c32e26d-641a-4711-a9fb-619703943fb9';
const FEATURES_DB_ID = '26ae5afe-4b5f-4d97-b402-5c459f188944';
const PHASE_2_START = 1; // Fresh workspace starts at Sprint 1

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function getCurrentSprint() {
  // Check for command line argument
  const argSprintNumber = process.argv[2] ? parseInt(process.argv[2]) : null;
  let sprintNumber = argSprintNumber;

  if (!sprintNumber) {
    // Find active sprint (In Progress or Active status)
    const sprints = await notion.databases.query({
      database_id: SPRINTS_DB_ID,
      filter: {
        or: [
          { property: 'Status', select: { equals: 'In Progress' } },
          { property: 'Status', select: { equals: 'Active' } }
        ]
      },
      sorts: [{ property: 'Sprint', direction: 'descending' }],
      page_size: 1
    });

    if (sprints.results.length > 0) {
      const sprintTitle = sprints.results[0].properties.Sprint?.title?.[0]?.plain_text || '';
      const match = sprintTitle.match(/Sprint\s*(\d+)/i);
      sprintNumber = match ? parseInt(match[1]) : null;
    }
  }

  if (!sprintNumber) {
    // Default to Phase 2 start
    sprintNumber = PHASE_2_START;
    console.log(`No active sprint found. Defaulting to Sprint ${sprintNumber} (Phase 2 start)`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`CURRENT SPRINT: Sprint ${sprintNumber}`);
  console.log(`${'='.repeat(60)}\n`);

  // Get features for current sprint
  const features = await notion.databases.query({
    database_id: FEATURES_DB_ID,
    filter: {
      property: 'Sprint',
      number: { equals: sprintNumber }
    },
    sorts: [
      { property: 'Priority', direction: 'ascending' },
      { property: 'Status', direction: 'ascending' }
    ]
  });

  const inProgress = [];
  const notStarted = [];
  const done = [];
  const blocked = [];

  features.results.forEach(f => {
    const name = f.properties.Features?.title?.[0]?.plain_text || 'Unnamed';
    const status = f.properties.Status?.select?.name || 'Not Started';
    const priority = f.properties.Priority?.select?.name || 'Medium';
    const complexity = f.properties.Complexity?.select?.name || 'Medium';

    const item = { name, status, priority, complexity };

    switch (status) {
      case 'In Progress':
        inProgress.push(item);
        break;
      case 'Done':
        done.push(item);
        break;
      case 'Blocked':
        blocked.push(item);
        break;
      default:
        notStarted.push(item);
    }
  });

  // Report
  if (inProgress.length > 0) {
    console.log('IN PROGRESS:');
    inProgress.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name} [${f.priority}/${f.complexity}]`);
    });
    console.log('');
  }

  if (notStarted.length > 0) {
    console.log('NOT STARTED:');
    notStarted.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name} [${f.priority}/${f.complexity}]`);
    });
    console.log('');
  }

  if (blocked.length > 0) {
    console.log('BLOCKED:');
    blocked.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name} [${f.priority}/${f.complexity}]`);
    });
    console.log('');
  }

  if (done.length > 0) {
    console.log('DONE:');
    done.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.name}`);
    });
    console.log('');
  }

  console.log(`${'='.repeat(60)}`);
  console.log(`SUMMARY: ${done.length}/${features.results.length} complete | ${inProgress.length} in progress | ${notStarted.length} remaining`);
  console.log(`${'='.repeat(60)}\n`);
}

getCurrentSprint().catch(console.error);
