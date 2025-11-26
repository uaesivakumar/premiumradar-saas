/**
 * Fix Stream 11 (S26-S30) Notion Entries
 *
 * 1. Update Features with ALL properties
 * 2. Create proper Knowledge child pages (topics)
 */

import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });

const FEATURES_DB_ID = dbIds.module_features_db_id;
const KNOWLEDGE_PAGE_ID = dbIds.knowledge_page_id;

// ============================================================================
// PART 1: Update all S26-S30 features with full properties
// ============================================================================

async function updateFeaturesWithFullProperties() {
  console.log('='.repeat(60));
  console.log('UPDATING FEATURES WITH FULL PROPERTIES');
  console.log('='.repeat(60));

  // Query all features for sprints 26-30
  const response = await notion.databases.query({
    database_id: FEATURES_DB_ID,
    filter: {
      and: [
        { property: 'Sprint', number: { greater_than_or_equal_to: 26 } },
        { property: 'Sprint', number: { less_than_or_equal_to: 30 } },
      ],
    },
  });

  console.log(`Found ${response.results.length} features to update\n`);

  for (const page of response.results) {
    const title = page.properties.Features?.title?.[0]?.plain_text || 'Unknown';
    const sprint = page.properties.Sprint?.number || 0;

    // Determine type based on feature name
    let type = 'Feature';
    if (title.toLowerCase().includes('test') || title.toLowerCase().includes('qa')) {
      type = 'Testing';
    } else if (title.toLowerCase().includes('deploy') || title.toLowerCase().includes('build') || title.toLowerCase().includes('index') || title.toLowerCase().includes('store')) {
      type = 'Infrastructure';
    }

    // Determine tags based on content
    const tags = [];
    if (title.toLowerCase().includes('ui') || title.toLowerCase().includes('component') || title.toLowerCase().includes('overlay') || title.toLowerCase().includes('panel')) {
      tags.push('UI');
    }
    if (title.toLowerCase().includes('agent') || title.toLowerCase().includes('ai') || title.toLowerCase().includes('siva') || title.toLowerCase().includes('reasoning')) {
      tags.push('AI');
    }
    if (title.toLowerCase().includes('animation') || title.toLowerCase().includes('motion') || title.toLowerCase().includes('drag')) {
      tags.push('Animation');
    }
    if (title.toLowerCase().includes('store') || title.toLowerCase().includes('state') || title.toLowerCase().includes('zustand')) {
      tags.push('State');
    }
    if (tags.length === 0) tags.push('Core');

    console.log(`Updating: ${title} (S${sprint})`);

    try {
      await notion.pages.update({
        page_id: page.id,
        properties: {
          'Status': { select: { name: 'Done' } },
          'Type': { select: { name: type } },
          'Notes': {
            rich_text: [{
              text: {
                content: `Implemented as part of Sprint S${sprint} - AI Surface Extension Phase (Stream 11). ${getFeatureDescription(title)}`
              }
            }]
          },
          'Tags': { multi_select: tags.map(t => ({ name: t })) },
          'Assignee': { rich_text: [{ text: { content: 'Claude (TC)' } }] },
          'Done?': { checkbox: true },
          'Started At': { date: { start: '2025-11-25' } },
          'Completed At': { date: { start: '2025-11-25' } },
        },
      });
      console.log(`  ✓ Updated`);
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 350));
  }
}

function getFeatureDescription(title) {
  const descriptions = {
    'SIVASurface': 'Full-screen AI canvas replacing traditional AppShell dashboard',
    'Neural mesh': 'Animated gradient background with industry-aware theming',
    'SIVAInputBar': 'Command bar with Cmd+K shortcut, quick actions dropdown',
    'SIVAPersonaPanel': 'AI state display showing listening/thinking/generating states',
    'Zustand': 'Lightweight state management for SIVA conversation and output objects',
    'Industry-aware': 'Dynamic theming based on detected industry vertical',
    'Quick start': 'Onboarding cards with example prompts',
    'Keyboard': 'Cmd+K shortcut for quick command access',
    'ObjectContainer': 'Draggable/pinnable container using Framer Motion',
    'DiscoveryObject': 'Company discovery results with signal indicators',
    'ScoringObject': 'Q/T/L/E radar visualization with SVG',
    'RankingObject': 'Ranked prospects list with score breakdown',
    'OutreachObject': 'Message composer with tone selection and copy',
    'Expand/collapse': 'Toggle output object expansion state',
    'Context menu': 'Right-click menu with share, export, pin actions',
    'Object export': 'Export output objects as JSON or CSV',
    'Agent types': 'TypeScript interfaces for agent orchestration',
    'Agent registry': 'Central registry with 5 specialized agents',
    'Discovery Agent': 'Finds prospects matching criteria with signal detection',
    'Ranking Agent': 'Scores prospects using Q/T/L/E methodology',
    'Outreach Agent': 'Drafts personalized messages for engagement',
    'Enrichment Agent': 'Gathers firmographic and technographic data',
    'Demo Agent': 'Interactive demonstrations of SIVA capabilities',
    'AgentSwitcher': 'Horizontal selection bar with Auto mode',
    'Confidence-based': 'Routes queries to best agent by confidence score',
    'Keyword matching': 'NLP-based intent detection for agent routing',
    'ReasoningOverlay': 'Chain-of-thought visualization panel',
    'TimelineView': 'Linear step-by-step reasoning display',
    'GraphView': 'Visual flow representation of reasoning',
    'ReasoningToggle': 'Floating button to show/hide reasoning',
    'Reasoning step': 'Individual step visualization with status',
    'Progress bar': 'Animated progress indicator',
    'View mode': 'Toggle between timeline and graph views',
    'Active agent': 'Indicator showing current active agent',
    'Component index': 'Barrel exports for all SIVA components',
    'integration': 'Wiring components into SIVASurface',
    'Build verification': 'TypeScript compilation and linting',
    'Deployment': 'Cloud Run staging deployment',
    'QA certification': 'Full QA validation and certification',
  };

  for (const [key, desc] of Object.entries(descriptions)) {
    if (title.toLowerCase().includes(key.toLowerCase())) {
      return desc;
    }
  }
  return 'Core feature implementation for AI Surface workspace';
}

// ============================================================================
// PART 2: Create Knowledge child pages (proper topics)
// ============================================================================

async function createKnowledgePages() {
  console.log('\n' + '='.repeat(60));
  console.log('CREATING KNOWLEDGE CHILD PAGES');
  console.log('='.repeat(60));

  const topics = [
    {
      title: 'SIVA Surface Architecture (Updated: 2025-11-25)',
      emoji: '🧠',
      content: [
        { type: 'callout', callout: { icon: { emoji: '🎯' }, color: 'blue_background', rich_text: [{ text: { content: 'Full-screen AI canvas replacing traditional dashboard. Pageless workspace where SIVA AI is the primary interface.' } }] } },
        { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Architecture' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'SIVASurface.tsx - Main full-screen canvas component' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'SIVAInputBar.tsx - Command bar with Cmd+K shortcut' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'SIVAPersonaPanel.tsx - AI state display (idle/thinking/generating)' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'OutputObjectRenderer.tsx - Dynamic object rendering' } }] } },
        { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'State Management' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Zustand store: lib/stores/siva-store.ts' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'States: idle | listening | thinking | generating | complete' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Manages: messages, outputObjects, reasoningSteps, activeAgent' } }] } },
        { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Key Patterns' } }] } },
        { type: 'numbered_list_item', numbered_list_item: { rich_text: [{ text: { content: 'Neural mesh background with industry-aware gradients' } }] } },
        { type: 'numbered_list_item', numbered_list_item: { rich_text: [{ text: { content: 'Auto-scroll to latest content' } }] } },
        { type: 'numbered_list_item', numbered_list_item: { rich_text: [{ text: { content: 'Quick start cards for onboarding' } }] } },
      ],
    },
    {
      title: 'Output Object System (Updated: 2025-11-25)',
      emoji: '📦',
      content: [
        { type: 'callout', callout: { icon: { emoji: '📦' }, color: 'purple_background', rich_text: [{ text: { content: 'AI-generated UI blocks that users can drag, pin, expand, and manipulate. Each response becomes a workspace object.' } }] } },
        { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Object Types' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'DiscoveryObject - Company search results with signals' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'ScoringObject - Q/T/L/E radar visualization' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'RankingObject - Prioritized prospect list' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'OutreachObject - Message composer with tone control' } }] } },
        { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'ObjectContainer Features' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Framer Motion drag with constraints' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Pin/unpin to workspace' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Expand/collapse toggle' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Context menu (share, export, fullscreen)' } }] } },
        { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Q/T/L/E Radar' } }] } },
        { type: 'paragraph', paragraph: { rich_text: [{ text: { content: 'Quality (Q), Timing (T), Likelihood (L), Engagement (E) - Four-axis radar chart using SVG with animated transitions.' } }] } },
      ],
    },
    {
      title: 'Multi-Agent Orchestration (Updated: 2025-11-25)',
      emoji: '🤖',
      content: [
        { type: 'callout', callout: { icon: { emoji: '🤖' }, color: 'green_background', rich_text: [{ text: { content: 'Specialized AI agents with confidence-based routing. Each agent has unique capabilities and keywords for intent matching.' } }] } },
        { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Agent Registry' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Discovery Agent - "find", "search", "discover", "companies"' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Ranking Agent - "rank", "score", "prioritize", "qtle"' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Outreach Agent - "write", "draft", "email", "message"' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Enrichment Agent - "enrich", "details", "info", "profile"' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'Demo Agent - "demo", "show me", "example", "tutorial"' } }] } },
        { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Routing Algorithm' } }] } },
        { type: 'numbered_list_item', numbered_list_item: { rich_text: [{ text: { content: 'Parse query for keywords' } }] } },
        { type: 'numbered_list_item', numbered_list_item: { rich_text: [{ text: { content: 'Calculate confidence score per agent' } }] } },
        { type: 'numbered_list_item', numbered_list_item: { rich_text: [{ text: { content: 'Route to highest confidence agent' } }] } },
        { type: 'numbered_list_item', numbered_list_item: { rich_text: [{ text: { content: 'Default to Discovery if no strong match' } }] } },
        { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Files' } }] } },
        { type: 'code', code: { language: 'plain text', rich_text: [{ text: { content: 'lib/agents/types.ts - Agent interfaces\nlib/agents/registry.ts - Agent implementations\ncomponents/siva/AgentSwitcher.tsx - UI component' } }] } },
      ],
    },
    {
      title: 'Reasoning Overlay System (Updated: 2025-11-25)',
      emoji: '🔍',
      content: [
        { type: 'callout', callout: { icon: { emoji: '🔍' }, color: 'yellow_background', rich_text: [{ text: { content: 'Visual chain-of-thought display. Shows AI reasoning process in real-time with timeline and graph views.' } }] } },
        { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Components' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'ReasoningOverlay - Main panel with view switcher' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'TimelineView - Linear step-by-step display' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'GraphView - Visual flow representation' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'ReasoningToggle - Floating button to toggle overlay' } }] } },
        { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Reasoning Step States' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'pending - Step not yet started (gray)' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'active - Currently processing (purple, animated)' } }] } },
        { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ text: { content: 'complete - Step finished (green checkmark)' } }] } },
        { type: 'heading_2', heading_2: { rich_text: [{ text: { content: 'Why It Matters' } }] } },
        { type: 'paragraph', paragraph: { rich_text: [{ text: { content: 'Transparency builds trust. Users can see how AI reaches conclusions, enabling debugging and validation of AI decisions. Critical for enterprise adoption.' } }] } },
      ],
    },
  ];

  for (const topic of topics) {
    console.log(`\nCreating: ${topic.title}`);

    try {
      const page = await notion.pages.create({
        parent: { page_id: KNOWLEDGE_PAGE_ID },
        icon: { emoji: topic.emoji },
        properties: {
          title: { title: [{ text: { content: topic.title } }] },
        },
        children: topic.content,
      });
      console.log(`  ✓ Created: ${page.id}`);
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 500));
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  await updateFeaturesWithFullProperties();
  await createKnowledgePages();

  console.log('\n' + '='.repeat(60));
  console.log('STREAM 11 FIX COMPLETE');
  console.log('='.repeat(60));
}

main().catch(console.error);
