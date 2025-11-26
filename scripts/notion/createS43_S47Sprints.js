/**
 * Create S43-S47 Sprint Entries in Notion
 * Stream 13: SIVA Intelligence & Routing Layer
 */

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const SPRINTS_DB = '5c32e26d-641a-4711-a9fb-619703943fb9';
const FEATURES_DB = '26ae5afe-4b5f-4d97-b402-5c459f188944';

const TODAY = new Date().toISOString().split('T')[0];

// S43-S47 Sprint Definitions (Stream 13: SIVA Intelligence & Routing Layer)
const SPRINTS = [
  {
    number: 43,
    name: 'S43 — Intent & Contextual Understanding (NLP Kernel v1)',
    goal: 'Move from keyword-based routing to semantic, context-aware intent understanding',
    businessValue: 'SIVA understands WHAT the user wants - foundation for intelligent routing and response quality',
    sprintNotes: 'Stream 13: SIVA Intelligence & Routing Layer. First sprint establishing the NLP foundation for intent classification and entity extraction.',
    features: [
      { name: 'IntentClassifier module with 20+ intents', type: 'Feature', priority: 'High', complexity: 'High', tags: ['AI', 'Core', 'NLP'], notes: 'Classify user queries into Discovery, Ranking, Outreach, General, and compound intents' },
      { name: 'Multi-label intent routing (Discovery + Ranking + Outreach combined)', type: 'Feature', priority: 'High', complexity: 'High', tags: ['AI', 'Core'], notes: 'Handle queries that span multiple intents simultaneously' },
      { name: 'User context memory (short-term thread memory)', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['State', 'Core'], notes: 'Maintain conversation context for follow-up queries and pronoun resolution' },
      { name: 'Entity extraction (company, sector, region, signals)', type: 'Feature', priority: 'High', complexity: 'High', tags: ['AI', 'NLP'], notes: 'Extract structured entities from natural language queries' },
      { name: 'Query normalization engine', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['AI', 'Core'], notes: 'Transform casual queries into structured requests (e.g., "find good companies UAE" → structured API call)' },
      { name: 'Intent confidence scoring', type: 'Feature', priority: 'Medium', complexity: 'Low', tags: ['AI'], notes: 'Score confidence level for each detected intent' },
      { name: 'IntentRouter integration with SIVASurface', type: 'Infrastructure', priority: 'High', complexity: 'Medium', tags: ['Core', 'UI'], notes: 'Wire intent classification into the main SIVA input flow' },
    ]
  },
  {
    number: 44,
    name: 'S44 — Evidence & Signals Reasoning Engine',
    goal: 'Every answer must include evidence, signals, sources, and reasoning trace',
    businessValue: 'SIVA explains WHY - builds trust by showing reasoning chain and evidence for every recommendation',
    sprintNotes: 'Stream 13: SIVA Intelligence & Routing Layer. Core reasoning engine that ensures every output is backed by evidence.',
    features: [
      { name: 'EvidenceCollector module', type: 'Feature', priority: 'High', complexity: 'High', tags: ['AI', 'Core'], notes: 'Gather evidence from multiple sources for each claim/recommendation' },
      { name: 'SignalReasoner (5-stage reasoning chain)', type: 'Feature', priority: 'High', complexity: 'High', tags: ['AI', 'Core'], notes: 'Multi-stage reasoning: Gather → Filter → Weight → Combine → Justify' },
      { name: 'Score justification module', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['AI', 'Core'], notes: 'Explain why a company received its Q/T/L/E scores with specific evidence' },
      { name: 'RankingEvidencePack', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['AI', 'Core'], notes: 'Structured evidence package for ranking decisions' },
      { name: 'OutreachEvidencePack', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['AI', 'Core'], notes: 'Evidence package for outreach recommendations (why this message, why this timing)' },
      { name: 'Confidence scoring (0-1 scale)', type: 'Feature', priority: 'Medium', complexity: 'Low', tags: ['AI'], notes: 'Numerical confidence for each evidence-backed claim' },
      { name: 'Evidence display in ReasoningOverlay', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['UI', 'AI'], notes: 'Visual representation of evidence chain in the reasoning panel' },
    ]
  },
  {
    number: 45,
    name: 'S45 — Tool Routing & Multi-Agent Orchestration',
    goal: 'SIVA chooses which tools to use, how many, in what order (Autonomous Mode)',
    businessValue: 'SIVA knows HOW - intelligently routes queries to appropriate tools and agents without manual intervention',
    sprintNotes: 'Stream 13: SIVA Intelligence & Routing Layer. Autonomous orchestration layer enabling SIVA to operate independently.',
    features: [
      { name: 'ToolRouter (Discovery → Enrichment → Ranking → Outreach)', type: 'Feature', priority: 'High', complexity: 'High', tags: ['AI', 'Core'], notes: 'Intelligent routing to appropriate tools based on intent and context' },
      { name: 'Autonomous mode toggle', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core', 'UI'], notes: 'Allow SIVA to operate fully autonomously vs. step-by-step confirmation' },
      { name: 'Multi-agent collaboration (DiscoveryAgent + RankingAgent + OutreachAgent)', type: 'Feature', priority: 'High', complexity: 'High', tags: ['AI', 'Core'], notes: 'Coordinate multiple specialized agents to complete complex tasks' },
      { name: 'Routing logs + heatmaps', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['UI', 'Analytics'], notes: 'Visual logs showing which tools were called and decision paths' },
      { name: 'Failure fallback paths', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core'], notes: 'Graceful degradation when tools fail or return low-confidence results' },
      { name: 'Tool execution queue with prioritization', type: 'Infrastructure', priority: 'Medium', complexity: 'Medium', tags: ['Core'], notes: 'Manage concurrent tool executions with smart prioritization' },
      { name: 'Agent handoff protocol', type: 'Infrastructure', priority: 'Medium', complexity: 'Medium', tags: ['Core', 'AI'], notes: 'Clean context passing between agents during collaboration' },
    ]
  },
  {
    number: 46,
    name: 'S46 — Output Object Engine v2 (Pageless Workspace)',
    goal: 'Make SIVA output feel like a live, evolving sales workspace',
    businessValue: 'SIVA shows WHAT it found - rich, interactive output objects that feel like a premium AI workspace',
    sprintNotes: 'Stream 13: SIVA Intelligence & Routing Layer. Enhanced output system for the pageless workspace experience.',
    features: [
      { name: 'Live-updating objects', type: 'Feature', priority: 'High', complexity: 'High', tags: ['UI', 'State'], notes: 'Objects that update in real-time as new data arrives' },
      { name: 'Multi-object linking (Discovery → Ranking → Outreach)', type: 'Feature', priority: 'High', complexity: 'High', tags: ['UI', 'Core'], notes: 'Connect related objects with visual links and data flow' },
      { name: 'Threaded insights per object', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['UI', 'AI'], notes: 'Attach AI-generated insights as threads on each object' },
      { name: 'Object inspector (metadata, signals, reasoning)', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['UI'], notes: 'Deep-dive panel showing full metadata and reasoning for any object' },
      { name: 'Pin & stack objects', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['UI', 'State'], notes: 'Pin important objects, stack related ones for comparison' },
      { name: 'Saved object sessions', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['State', 'Core'], notes: 'Save and restore workspace states with all objects' },
      { name: 'Object action menu (Enrich, Rank, Outreach, Export)', type: 'Feature', priority: 'High', complexity: 'Low', tags: ['UI'], notes: 'Quick actions available on any output object' },
    ]
  },
  {
    number: 47,
    name: 'S47 — Agent Personality & Tone Pack System',
    goal: 'Make SIVA feel like a premium banking-focused AI partner',
    businessValue: 'SIVA sounds like SKC - personalized, professional tone that matches banking sales culture',
    sprintNotes: 'Stream 13: SIVA Intelligence & Routing Layer. Final polish sprint for personality and communication style.',
    features: [
      { name: 'Banking persona kernel', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['AI', 'Core'], notes: 'Core banking-focused personality traits and knowledge base' },
      { name: 'NLP Tone packs (Formal, Friendly, Executive, Banking Sale Mode)', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['AI', 'Core'], notes: 'Switchable tone presets for different contexts' },
      { name: 'Cross-agent personality alignment', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['AI', 'Core'], notes: 'Ensure all agents maintain consistent personality' },
      { name: 'Personalization memory (SIVA learns user style)', type: 'Feature', priority: 'High', complexity: 'High', tags: ['AI', 'State'], notes: 'Learn and adapt to user preferences over time' },
      { name: 'Outreach Tone Packs (Email, LinkedIn, Call Script)', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['AI', 'Core'], notes: 'Specialized tone packs for different outreach channels' },
      { name: 'Tone preview in settings', type: 'Feature', priority: 'Low', complexity: 'Low', tags: ['UI'], notes: 'Preview how SIVA sounds in each tone before applying' },
      { name: 'Persona settings persistence', type: 'Infrastructure', priority: 'Medium', complexity: 'Low', tags: ['State'], notes: 'Save user tone preferences to profile' },
    ]
  }
];

async function createSprints() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Creating S43-S47 Sprints - Stream 13: SIVA Intelligence');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let totalFeatures = 0;

  for (const sprint of SPRINTS) {
    console.log(`Creating S${sprint.number}: ${sprint.name}...`);

    try {
      const response = await notion.pages.create({
        parent: { database_id: SPRINTS_DB },
        properties: {
          'Sprint': {
            title: [{ text: { content: sprint.name } }]
          },
          'Status': {
            select: { name: 'Backlog' }
          },
          'Goal': {
            rich_text: [{ text: { content: sprint.goal } }]
          },
          'Sprint Notes': {
            rich_text: [{ text: { content: sprint.sprintNotes } }]
          },
          'Outcomes': {
            rich_text: [{ text: { content: 'To be filled upon completion' } }]
          },
          'Highlights': {
            rich_text: [{ text: { content: 'To be filled upon completion' } }]
          },
          'Business Value': {
            rich_text: [{ text: { content: sprint.businessValue } }]
          },
          'Learnings': {
            rich_text: [{ text: { content: 'To be filled upon completion' } }]
          },
          'Branch': {
            rich_text: [{ text: { content: `feat/sprint-s${sprint.number}` } }]
          },
          'Phases Updated': {
            multi_select: [{ name: 'Backlog' }]
          },
        }
      });

      console.log(`  ✅ Created: ${sprint.name}`);

      // Create features for this sprint
      for (const feature of sprint.features) {
        try {
          await notion.pages.create({
            parent: { database_id: FEATURES_DB },
            properties: {
              'Features': {
                title: [{ text: { content: feature.name } }]
              },
              'Sprint': {
                number: sprint.number
              },
              'Status': {
                select: { name: 'Backlog' }
              },
              'Priority': {
                select: { name: feature.priority }
              },
              'Complexity': {
                select: { name: feature.complexity }
              },
              'Type': {
                select: { name: feature.type }
              },
              'Notes': {
                rich_text: [{ text: { content: feature.notes } }]
              },
              'Tags': {
                multi_select: feature.tags.map(t => ({ name: t }))
              },
              'Assignee': {
                rich_text: [{ text: { content: 'Claude (TC)' } }]
              },
              'Done?': {
                checkbox: false
              }
            }
          });
          console.log(`    ✅ Feature: ${feature.name}`);
          totalFeatures++;
        } catch (error) {
          console.error(`    ❌ Feature failed: ${feature.name} - ${error.message}`);
        }
      }

    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
    }

    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  ✅ CREATION COMPLETE`);
  console.log(`  Sprints: 5 (S43-S47)`);
  console.log(`  Features: ${totalFeatures}`);
  console.log('═══════════════════════════════════════════════════════════════');
}

// Execute
createSprints()
  .then(() => {
    console.log('\n📋 AWAITING APPROVAL');
    console.log('Please review the created sprints in Notion.');
    console.log('Reply "approved" to begin execution.\n');
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
