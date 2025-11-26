/**
 * Update S43 Sprint to Done in Notion
 */

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const SPRINTS_DB = '5c32e26d-641a-4711-a9fb-619703943fb9';
const FEATURES_DB = '26ae5afe-4b5f-4d97-b402-5c459f188944';

const TODAY = new Date().toISOString().split('T')[0];
const COMMIT = 'edf1bfc';
const BRANCH = 'intelligent-shockley';

async function updateS43() {
  console.log('Updating S43 to Done...\n');

  // Find S43 sprint
  const sprints = await notion.databases.query({
    database_id: SPRINTS_DB,
    filter: {
      property: 'Sprint',
      title: { contains: 'S43' }
    }
  });

  if (sprints.results.length === 0) {
    console.log('S43 sprint not found');
    return;
  }

  const sprintId = sprints.results[0].id;

  // Update sprint
  await notion.pages.update({
    page_id: sprintId,
    properties: {
      'Status': { select: { name: 'Done' } },
      'Outcomes': {
        rich_text: [{
          text: {
            content: 'IntentClassifier with 20+ intents, EntityExtractor (companies, sectors, regions, signals, metrics), QueryNormalizer, ContextMemory with pronoun resolution, intent-store.ts, useIntentWrapper integration'
          }
        }]
      },
      'Highlights': {
        rich_text: [{
          text: {
            content: 'NLP Kernel v1 complete. SIVA now understands WHAT user wants through semantic intent classification and entity extraction.'
          }
        }]
      },
      'Learnings': {
        rich_text: [{
          text: {
            content: 'Keyword + pattern matching provides good baseline accuracy. Context memory enables natural follow-up queries. Wrapper pattern ensures zero interference with existing code.'
          }
        }]
      },
      'Commit': { rich_text: [{ text: { content: COMMIT } }] },
      'Git Tag': { rich_text: [{ text: { content: 'sprint-s43-certified' } }] },
      'Branch': { rich_text: [{ text: { content: BRANCH } }] },
      'Completed At': { date: { start: TODAY } },
      'Synced At': { date: { start: TODAY } },
      'Phases Updated': { multi_select: [{ name: 'Done' }] },
      'Commits Count': { number: 2 }
    }
  });

  console.log('✅ S43 Sprint updated to Done\n');

  // Update S43 features
  const features = await notion.databases.query({
    database_id: FEATURES_DB,
    filter: {
      property: 'Sprint',
      number: { equals: 43 }
    }
  });

  console.log(`Updating ${features.results.length} features...`);

  for (const feature of features.results) {
    await notion.pages.update({
      page_id: feature.id,
      properties: {
        'Status': { select: { name: 'Done' } },
        'Done?': { checkbox: true },
        'Completed At': { date: { start: TODAY } }
      }
    });
    const title = feature.properties.Features?.title?.[0]?.plain_text || 'Unknown';
    console.log(`  ✅ ${title}`);
  }

  console.log('\n✅ All S43 features updated to Done');
}

updateS43().catch(console.error);
