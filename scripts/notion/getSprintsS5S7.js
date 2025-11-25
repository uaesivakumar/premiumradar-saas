import { Client } from '@notionhq/client';
const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function getFullFeatureDetails() {
  const response = await notion.databases.query({
    database_id: '26ae5afe-4b5f-4d97-b402-5c459f188944',
    filter: {
      or: [
        { property: 'Sprint', number: { equals: 5 } },
        { property: 'Sprint', number: { equals: 6 } },
        { property: 'Sprint', number: { equals: 7 } }
      ]
    },
    sorts: [
      { property: 'Sprint', direction: 'ascending' }
    ]
  });

  console.log('\n============================================================');
  console.log('SPRINTS S5-S7 - FULL FEATURE DETAILS');
  console.log('============================================================');

  let currentSprint = 0;
  let sprintCounts = { 5: { done: 0, total: 0 }, 6: { done: 0, total: 0 }, 7: { done: 0, total: 0 } };

  for (const page of response.results) {
    const props = page.properties;
    const sprint = props['Sprint']?.number;

    if (sprint !== currentSprint) {
      console.log('\n\n📦 SPRINT ' + sprint);
      console.log('─'.repeat(60));
      currentSprint = sprint;
    }

    const name = props['Feature Name']?.title?.[0]?.text?.content || 'EMPTY';
    const status = props['Status']?.select?.name || 'Unknown';
    const notes = (props['Notes']?.rich_text?.[0]?.text?.content || 'No notes').substring(0, 100);
    const tags = props['Tags']?.multi_select?.map(t => t.name).join(', ') || 'None';
    const priority = props['Priority']?.select?.name || 'P1';
    const complexity = props['Complexity']?.select?.name || 'Medium';

    const statusIcon = status === 'Done' ? '✅' : status === 'In Progress' ? '🔄' : '⬜';

    if (sprintCounts[sprint]) {
      sprintCounts[sprint].total++;
      if (status === 'Done') sprintCounts[sprint].done++;
    }

    console.log('\n' + statusIcon + ' ' + name);
    console.log('   [' + priority + '/' + complexity + '] ' + status);
    console.log('   Notes: ' + notes);
    console.log('   Tags: ' + tags);
  }

  console.log('\n\n============================================================');
  console.log('SUMMARY');
  console.log('============================================================');
  for (const sprint of [5, 6, 7]) {
    const c = sprintCounts[sprint];
    console.log('Sprint ' + sprint + ': ' + c.done + '/' + c.total + ' complete');
  }
  const totalDone = Object.values(sprintCounts).reduce((a, b) => a + b.done, 0);
  const totalAll = Object.values(sprintCounts).reduce((a, b) => a + b.total, 0);
  console.log('\nTOTAL: ' + totalDone + '/' + totalAll + ' features');
}

getFullFeatureDetails().catch(console.error);
