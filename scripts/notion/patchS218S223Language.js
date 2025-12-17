/**
 * PRD v1.2 Language Alignment Patch for S218-S223
 *
 * LANGUAGE PATCH ONLY - NO FUNCTIONAL CHANGE
 *
 * Corrects wording to align with:
 *   OS decides.
 *   SIVA reasons.
 *   SaaS renders.
 *
 * Usage: NOTION_TOKEN="..." node scripts/notion/patchS218S223Language.js
 */

import { Client } from '@notionhq/client';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SPRINTS_DB = '5c32e26d-641a-4711-a9fb-619703943fb9';
const FEATURES_DB = '26ae5afe-4b5f-4d97-b402-5c459f188944';

const notion = new Client({ auth: NOTION_TOKEN });

async function main() {
  console.log('=== PRD v1.2 LANGUAGE ALIGNMENT ===');
  console.log('Language patch only. No functional change.\n');

  const sprintNums = [218, 219, 220, 221, 222, 223];
  const alignmentNote = '[PRD v1.2 Aligned] OS decides. SIVA reasons. SaaS renders.';

  // 1. Update sprint notes with alignment marker
  console.log('Updating sprint notes...');
  for (const num of sprintNums) {
    const sprints = await notion.databases.query({
      database_id: SPRINTS_DB,
      filter: { property: 'Sprint', title: { contains: `S${num}:` } }
    });

    if (sprints.results.length > 0) {
      const sprint = sprints.results[0];
      const current = sprint.properties['Sprint Notes']?.rich_text?.[0]?.plain_text || '';

      if (current.indexOf('PRD v1.2') === -1) {
        const newNote = alignmentNote + (current ? ' | ' + current : '');
        await notion.pages.update({
          page_id: sprint.id,
          properties: {
            'Sprint Notes': { rich_text: [{ text: { content: newNote } }] }
          }
        });
        console.log(`  S${num}: Added alignment note`);
      } else {
        console.log(`  S${num}: Already aligned`);
      }
    }
  }

  // 2. Patch feature language
  console.log('\nPatching feature language...');

  const features = await notion.databases.query({
    database_id: FEATURES_DB,
    filter: {
      or: sprintNums.map(n => ({ property: 'Sprint', number: { equals: n } }))
    }
  });

  const patches = [
    {
      match: 'Lead queue with priority ordering',
      find: 'SIVA maintains ranked queue',
      replace: 'OS maintains ranked queue. OS updates on feedback. SIVA reasons over queue to rank'
    },
    {
      match: 'Implement preference learning algorithm',
      find: 'Analyze liked companies',
      replace: 'OS stores preferences. OS passes context to SIVA. SIVA reasons (stateless) for scoring'
    },
    {
      match: 'Add preference context to SIVA reasoning',
      find: 'Include user preferences in SIVA context',
      replace: 'OS passes preference snapshot to SIVA. SIVA reasons (stateless). OS decides context'
    },
    {
      match: 'Wire feedback to preference learning',
      find: 'OS updates preference model. Next batch reflects feedback',
      replace: 'SaaS emits event to OS. OS updates model. OS decides next context. SIVA reasons only'
    },
    {
      match: 'conversational prompts',
      find: 'SIVA asks:',
      replace: 'SIVA generates prompts (reasoning). OS decides when. SaaS renders only.'
    },
    {
      match: 'SIVA commentary',
      find: 'SIVA explains:',
      replace: 'SIVA generates commentary (reasoning over OS context). SaaS renders. No SaaS generation.'
    }
  ];

  let patchedCount = 0;
  for (const feature of features.results) {
    const title = feature.properties.Features?.title?.[0]?.plain_text || '';
    const notes = feature.properties.Notes?.rich_text?.[0]?.plain_text || '';

    for (const patch of patches) {
      if (title.toLowerCase().includes(patch.match.toLowerCase())) {
        if (notes.includes(patch.find)) {
          const newNotes = notes.replace(patch.find, patch.replace);
          await notion.pages.update({
            page_id: feature.id,
            properties: {
              Notes: { rich_text: [{ text: { content: newNotes } }] }
            }
          });
          console.log(`  Patched: ${title.substring(0, 40)}...`);
          patchedCount++;
        }
      }
    }
  }

  console.log('\n=== LANGUAGE PATCH COMPLETE ===');
  console.log(`Sprints aligned: ${sprintNums.length}`);
  console.log(`Features patched: ${patchedCount}`);
  console.log('\nLocked abstraction:');
  console.log('  OS decides.');
  console.log('  SIVA reasons.');
  console.log('  SaaS renders.');
}

main().catch(console.error);
