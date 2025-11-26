/**
 * Update S44-S47 Sprints to Done in Notion
 * Stream 13: SIVA Intelligence & Routing Layer (Complete)
 */

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const SPRINTS_DB = '5c32e26d-641a-4711-a9fb-619703943fb9';
const FEATURES_DB = '26ae5afe-4b5f-4d97-b402-5c459f188944';

const TODAY = new Date().toISOString().split('T')[0];
const BRANCH = 'intelligent-shockley';

const SPRINT_UPDATES = [
  {
    sprint: 'S44',
    outcomes: 'EvidenceCollector with UAE banking templates, SignalReasoner (5-stage chain), ScoreJustifier (Q/T/L/E), evidence-store.ts, useEvidenceWrapper integration',
    highlights: 'Evidence Engine v1 complete. SIVA now explains WHY through evidence collection, reasoning chains, and score justification.',
    learnings: 'Signal templates enable contextual evidence. 5-stage reasoning (gather→filter→weight→combine→justify) provides transparent logic.',
  },
  {
    sprint: 'S45',
    outcomes: 'AgentRegistry with capabilities, ToolRouter with intent-based selection, Orchestrator with parallel/sequential execution, routing-store.ts, useRoutingWrapper integration',
    highlights: 'Tool Routing v1 complete. SIVA now decides WHO handles queries through intelligent agent selection and orchestration.',
    learnings: 'Agent capabilities enable precise routing. Parallel groups optimize multi-agent execution.',
  },
  {
    sprint: 'S46',
    outcomes: 'LiveObjectFactory with enrichment, ThreadManager for conversations, ObjectInspector with signals/reasoning views, object-store.ts',
    highlights: 'Output Objects v2 complete. Objects now have live state, threads, inspector data, and full history.',
    learnings: 'Object-centric design enables follow-up conversations. Inspector provides transparency into AI decisions.',
  },
  {
    sprint: 'S47',
    outcomes: 'TonePackRegistry (professional/friendly/concise/detailed/executive/consultative), PersonaEngine with trait application, persona-store.ts, usePersonaWrapper integration',
    highlights: 'Persona System v1 complete. SIVA now has consistent voice through tone packs and personality traits.',
    learnings: 'Vocabulary replacements and trait modifiers enable nuanced tone control. Context-aware tone selection improves communication.',
  },
];

async function updateSprints() {
  console.log('Updating S44-S47 to Done...\n');

  for (const update of SPRINT_UPDATES) {
    // Find sprint
    const sprints = await notion.databases.query({
      database_id: SPRINTS_DB,
      filter: {
        property: 'Sprint',
        title: { contains: update.sprint }
      }
    });

    if (sprints.results.length === 0) {
      console.log(`${update.sprint} sprint not found`);
      continue;
    }

    const sprintId = sprints.results[0].id;

    // Update sprint
    await notion.pages.update({
      page_id: sprintId,
      properties: {
        'Status': { select: { name: 'Done' } },
        'Outcomes': {
          rich_text: [{ text: { content: update.outcomes } }]
        },
        'Highlights': {
          rich_text: [{ text: { content: update.highlights } }]
        },
        'Learnings': {
          rich_text: [{ text: { content: update.learnings } }]
        },
        'Branch': { rich_text: [{ text: { content: BRANCH } }] },
        'Completed At': { date: { start: TODAY } },
        'Synced At': { date: { start: TODAY } },
        'Phases Updated': { multi_select: [{ name: 'Done' }] },
      }
    });

    console.log(`✅ ${update.sprint} Sprint updated to Done`);

    // Update features
    const sprintNum = parseInt(update.sprint.replace('S', ''));
    const features = await notion.databases.query({
      database_id: FEATURES_DB,
      filter: {
        property: 'Sprint',
        number: { equals: sprintNum }
      }
    });

    console.log(`   Updating ${features.results.length} features...`);

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
      console.log(`   ✅ ${title}`);
    }

    console.log('');
  }

  console.log('✅ All S44-S47 sprints and features updated to Done');
  console.log('\n📊 Stream 13 Summary:');
  console.log('   S43: Intent & Contextual Understanding (NLP Kernel)');
  console.log('   S44: Evidence & Signals Reasoning (WHY Engine)');
  console.log('   S45: Tool Routing & Multi-Agent (WHO Router)');
  console.log('   S46: Output Object Engine v2 (HOW Output)');
  console.log('   S47: Agent Personality & Tone (SOUND Persona)');
}

updateSprints().catch(console.error);
