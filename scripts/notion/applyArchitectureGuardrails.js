/**
 * Apply Architecture Guardrails to S218-S223
 *
 * Step 1: Tag each feature with ownership:
 *   - OS_AUTHORITY (stores, decides, owns)
 *   - OS_REASONING (SIVA reasons)
 *   - SAAS_RENDER_ONLY (displays what OS returns)
 *   - SAAS_EVENT_ONLY (emits events, no logic)
 *
 * Step 2: Add guardrail note to each sprint
 *
 * Step 3: Update execution order
 */

import { Client } from '@notionhq/client';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SPRINTS_DB = '5c32e26d-641a-4711-a9fb-619703943fb9';
const FEATURES_DB = '26ae5afe-4b5f-4d97-b402-5c459f188944';

const notion = new Client({ auth: NOTION_TOKEN });

const GUARDRAIL_NOTE = `[Architecture Guardrail]
SaaS must not store state, run algorithms, or generate intelligence.
All decisions, learning, and reasoning occur in OS.
Violations require PRD version bump.`;

// Feature ownership mapping
const featureOwnership = {
  // S218 - Competitor Filtering
  'Add COMPETITOR_BANK edge case to pack config schema': {
    owner: 'OS_AUTHORITY',
    notes: '[OS_AUTHORITY] OS owns pack config schema. OS decides what blockers exist.'
  },
  'Super Admin UI for competitor blocklist editor': {
    owner: 'SAAS_RENDER_ONLY',
    notes: '[SAAS_RENDER_ONLY] SaaS renders config UI. Sends updates to OS. OS validates and applies.'
  },
  'Enhance EdgeCasesTool to read competitor list from pack config': {
    owner: 'OS_AUTHORITY',
    notes: '[OS_AUTHORITY] OS owns EdgeCasesTool. OS decides blocking logic. SIVA reasons over blockers.'
  },
  'Auto-detect user employer from email domain': {
    owner: 'OS_AUTHORITY',
    notes: '[OS_AUTHORITY] OS detects employer. OS stores mapping. SaaS passes email, receives employer_id.'
  },

  // S219 - Progressive Delivery
  'Add progressive_delivery config to pack schema': {
    owner: 'OS_AUTHORITY',
    notes: '[OS_AUTHORITY] OS owns pack config. OS decides batch sizes.'
  },
  'Implement progressive delivery in discovery route': {
    owner: 'OS_AUTHORITY',
    notes: '[OS_AUTHORITY] OS decides what leads to show. OS tracks session state. OS returns batch.'
  },
  'Show More pagination with feedback context': {
    owner: 'SAAS_EVENT_ONLY',
    notes: '[SAAS_EVENT_ONLY] SaaS emits {intent: "SHOW_MORE", session_id}. OS decides next batch. SaaS renders.'
  },
  'Lead queue with priority ordering': {
    owner: 'OS_AUTHORITY',
    notes: '[OS_AUTHORITY] OS maintains queue. OS updates priority. SIVA reasons over queue for ranking.'
  },

  // S220 - Preference Learning (ALL OS)
  'Create user preferences schema': {
    owner: 'OS_AUTHORITY',
    notes: '[OS_AUTHORITY] OS owns preference storage. NOT in SaaS DB. OS persists all preference signals.'
  },
  'Implement preference learning algorithm': {
    owner: 'OS_AUTHORITY',
    notes: '[OS_AUTHORITY] OS runs algorithm. OS updates model. SIVA reasons over preferences (stateless).'
  },
  'Add preference context to SIVA reasoning': {
    owner: 'OS_REASONING',
    notes: '[OS_REASONING] OS passes preference snapshot to SIVA. SIVA reasons (stateless). OS decides context.'
  },

  // S221 - Save & Feedback UI
  'Add Save/Favorite button to lead cards': {
    owner: 'SAAS_EVENT_ONLY',
    notes: '[SAAS_EVENT_ONLY] SaaS renders button. Emits {event: "SAVE", company_id}. OS persists.'
  },
  'Create Saved Leads page': {
    owner: 'SAAS_RENDER_ONLY',
    notes: '[SAAS_RENDER_ONLY] SaaS fetches saved leads from OS. Renders list. No local storage.'
  },
  'Add saved leads API endpoints': {
    owner: 'OS_AUTHORITY',
    notes: '[OS_AUTHORITY] OS owns saved leads storage. OS provides GET/POST/DELETE. SaaS calls only.'
  },
  'Add thumbs up/down feedback buttons': {
    owner: 'SAAS_EVENT_ONLY',
    notes: '[SAAS_EVENT_ONLY] SaaS renders buttons. Emits {event: "LIKE"/"DISLIKE", company_id}. OS interprets.'
  },
  'Add "Why not interested?" quick reasons': {
    owner: 'SAAS_EVENT_ONLY',
    notes: '[SAAS_EVENT_ONLY] SaaS renders options. Emits {event: "DISMISS", reason}. OS stores and learns.'
  },
  'Wire feedback to preference learning': {
    owner: 'OS_AUTHORITY',
    notes: '[OS_AUTHORITY] OS receives events from SaaS. OS updates preference model. OS decides next context.'
  },

  // S222 - Conversational UX
  'Add conversational prompts to discovery': {
    owner: 'SAAS_RENDER_ONLY',
    notes: '[SAAS_RENDER_ONLY] SaaS renders prompts returned by OS. SIVA generates prompts. SaaS never phrases.'
  },
  'Implement "Find more like X" command': {
    owner: 'OS_AUTHORITY',
    notes: '[OS_AUTHORITY] OS receives {intent: "FIND_MORE_LIKE", company_id}. OS analyzes. SIVA reasons. OS returns leads.'
  },
  'Add SIVA commentary to lead results': {
    owner: 'OS_REASONING',
    notes: '[OS_REASONING] SIVA generates commentary over OS context. SaaS renders. No SaaS generation.'
  },
  'Implement natural language refinement': {
    owner: 'OS_AUTHORITY',
    notes: '[OS_AUTHORITY] SaaS sends raw text. OS parses intent. OS applies filters. SaaS renders result.'
  },

  // S223 - Intelligence Config & Metrics
  'Add Intelligence Config section to Super Admin': {
    owner: 'SAAS_RENDER_ONLY',
    notes: '[SAAS_RENDER_ONLY] SaaS renders config UI. Sends to OS. OS validates and applies. SaaS never applies directly.'
  },
  'Add pack config API for intelligence settings': {
    owner: 'OS_AUTHORITY',
    notes: '[OS_AUTHORITY] OS owns API. OS validates schema. OS applies config. SaaS is consumer only.'
  },
  'Add intelligence quality metrics dashboard': {
    owner: 'SAAS_RENDER_ONLY',
    notes: '[SAAS_RENDER_ONLY] SaaS renders metrics from OS. OS computes all metrics. SaaS never calculates.'
  },
  'Create SIVA Intelligence test suite': {
    owner: 'OS_AUTHORITY',
    notes: '[OS_AUTHORITY] Tests live in OS repo. Validate OS behavior. SaaS has integration tests only.'
  }
};

async function main() {
  console.log('════════════════════════════════════════════════════════════════════');
  console.log('APPLYING ARCHITECTURE GUARDRAILS (S218-S223)');
  console.log('════════════════════════════════════════════════════════════════════\n');

  const sprintNums = [218, 219, 220, 221, 222, 223];

  // Step 1: Update sprint notes with guardrail
  console.log('Step 1: Adding guardrail notes to sprints...\n');

  for (const num of sprintNums) {
    const sprints = await notion.databases.query({
      database_id: SPRINTS_DB,
      filter: { property: 'Sprint', title: { contains: `S${num}:` } }
    });

    if (sprints.results.length > 0) {
      const sprint = sprints.results[0];
      const current = sprint.properties['Sprint Notes']?.rich_text?.[0]?.plain_text || '';

      if (current.indexOf('Architecture Guardrail') === -1) {
        const newNote = GUARDRAIL_NOTE + '\n\n' + current;
        await notion.pages.update({
          page_id: sprint.id,
          properties: {
            'Sprint Notes': { rich_text: [{ text: { content: newNote } }] }
          }
        });
        console.log(`  S${num}: Guardrail added`);
      } else {
        console.log(`  S${num}: Already has guardrail`);
      }
    }
  }

  // Step 2: Update feature ownership tags
  console.log('\nStep 2: Tagging feature ownership...\n');

  const features = await notion.databases.query({
    database_id: FEATURES_DB,
    filter: {
      or: sprintNums.map(n => ({ property: 'Sprint', number: { equals: n } }))
    }
  });

  let tagged = 0;
  for (const feature of features.results) {
    const title = feature.properties.Features?.title?.[0]?.plain_text || '';
    const currentNotes = feature.properties.Notes?.rich_text?.[0]?.plain_text || '';

    // Find matching ownership
    for (const [featureName, ownership] of Object.entries(featureOwnership)) {
      if (title.includes(featureName) || featureName.includes(title.substring(0, 30))) {
        // Check if already tagged
        if (currentNotes.indexOf('[OS_') === -1 && currentNotes.indexOf('[SAAS_') === -1) {
          const newNotes = ownership.notes + '\n\n' + currentNotes;
          await notion.pages.update({
            page_id: feature.id,
            properties: {
              Notes: { rich_text: [{ text: { content: newNotes } }] }
            }
          });
          console.log(`  [${ownership.owner}] ${title.substring(0, 45)}...`);
          tagged++;
        }
        break;
      }
    }
  }

  // Step 3: Display frozen execution order
  console.log('\n════════════════════════════════════════════════════════════════════');
  console.log('FROZEN EXECUTION ORDER');
  console.log('════════════════════════════════════════════════════════════════════');
  console.log(`
Phase 1: OS Foundation (upr-os repo first)
  S218 → Competitor Filtering (OS_AUTHORITY)
  S219 → Progressive Delivery (OS_AUTHORITY)
  S220 → Preference Learning (OS_AUTHORITY) ← ALL in OS

Phase 2: OS Intelligence (upr-os repo)
  S222 → Conversational UX - OS parts (OS_AUTHORITY + OS_REASONING)

Phase 3: SaaS Thin Layer (premiumradar-saas repo)
  S221 → Save & Feedback UI (SAAS_EVENT_ONLY + SAAS_RENDER_ONLY)
  S222 → Conversational UX - UI only (SAAS_RENDER_ONLY)
  S223 → Intelligence Config - UI only (SAAS_RENDER_ONLY)

⚠️  UI work MUST NOT start before OS contracts exist.
`);

  console.log('════════════════════════════════════════════════════════════════════');
  console.log('GUARDRAILS APPLIED');
  console.log('════════════════════════════════════════════════════════════════════');
  console.log(`Sprints with guardrail: ${sprintNums.length}`);
  console.log(`Features tagged: ${tagged}`);
  console.log(`\nOwnership tags used:`);
  console.log(`  OS_AUTHORITY    - OS stores, decides, owns`);
  console.log(`  OS_REASONING    - SIVA reasons (stateless)`);
  console.log(`  SAAS_RENDER_ONLY - Displays what OS returns`);
  console.log(`  SAAS_EVENT_ONLY  - Emits events, no logic`);
}

main().catch(console.error);
