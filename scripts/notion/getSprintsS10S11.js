import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function getSprintsS10S11() {
  const response = await notion.databases.query({
    database_id: dbIds.module_features_db_id,
    filter: {
      or: [
        { property: 'Sprint', number: { equals: 10 } },
        { property: 'Sprint', number: { equals: 11 } }
      ]
    },
    sorts: [{ property: 'Sprint', direction: 'ascending' }]
  });

  console.log('============================================================');
  console.log('SPRINTS S10-S11 FEATURES');
  console.log('============================================================');

  let currentSprint = 0;
  const counts = { 10: { done: 0, total: 0 }, 11: { done: 0, total: 0 } };

  for (const page of response.results) {
    const props = page.properties;
    const sprint = props['Sprint']?.number;

    if (sprint !== currentSprint) {
      console.log('\n\n📦 SPRINT ' + sprint);
      console.log('─'.repeat(60));
      currentSprint = sprint;
    }

    const name = props['Features']?.title?.[0]?.text?.content || 'EMPTY';
    const status = props['Status']?.select?.name || 'Unknown';
    const notes = (props['Notes']?.rich_text?.[0]?.text?.content || 'No notes').substring(0, 80);
    const priority = props['Priority']?.select?.name || 'P1';
    const complexity = props['Complexity']?.select?.name || 'Medium';

    const statusIcon = status === 'Done' ? '✅' : status === 'In Progress' ? '🔄' : '⬜';

    if (counts[sprint]) {
      counts[sprint].total++;
      if (status === 'Done') counts[sprint].done++;
    }

    console.log('\n' + statusIcon + ' ' + (name === 'EMPTY' ? notes : name));
    console.log('   [' + priority + '/' + complexity + '] ' + status);
  }

  console.log('\n\n============================================================');
  console.log('SUMMARY');
  console.log('============================================================');
  console.log('Sprint 10: ' + counts[10].done + '/' + counts[10].total + ' complete');
  console.log('Sprint 11: ' + counts[11].done + '/' + counts[11].total + ' complete');
  console.log('\nTOTAL: ' + (counts[10].done + counts[11].done) + '/' + (counts[10].total + counts[11].total) + ' features');
}

getSprintsS10S11().catch(console.error);
