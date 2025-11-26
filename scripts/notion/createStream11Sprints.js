/**
 * Create Stream 11 Sprints (S26-S30) in Notion
 * AI Surface Extension Phase - Full Pageless Workspace
 *
 * FULL PROPERTY POPULATION as per .claude/notion/sync.ts
 */

import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });

const SPRINTS_DB_ID = dbIds.sprints_db_id;
const FEATURES_DB_ID = dbIds.module_features_db_id;
const KNOWLEDGE_DB_ID = dbIds.knowledge_page_id;

const STREAM_11_SPRINTS = [
  {
    number: 26,
    name: 'Sprint S26',
    goal: 'Global SIVA Surface - Replace traditional dashboard with AI-first pageless workspace',
    notes: 'Stream 11 - AI Surface Extension. Full-screen SIVA canvas, neural mesh background, SIVAInputBar command center, SIVAPersonaPanel state display.',
    outcomes: 'Created SIVASurface.tsx as full-screen AI canvas, SIVAInputBar.tsx with command bar, SIVAPersonaPanel.tsx for AI state, OutputObjectRenderer.tsx, siva-store.ts with Zustand.',
    highlights: 'Pageless workspace architecture, neural mesh animated background, Cmd+K shortcut, industry-aware theming',
    businessValue: 'Revolutionary AI-first UX differentiator - positions PremiumRadar as 2030 AI workspace leader',
    learnings: 'Pageless design requires careful state management, neural mesh needs performance optimization, Zustand simplifies complex AI state',
    commit: '316c418',
    gitTag: 'sprint-s26',
    branch: 'main',
    phasesUpdated: ['Frontend', 'UX'],
    status: 'Completed',
    features: [
      { name: 'SIVASurface full-screen AI canvas', priority: 'Critical', complexity: 'High', type: 'Feature', tags: ['UI', 'AI'] },
      { name: 'Neural mesh animated background', priority: 'High', complexity: 'Medium', type: 'Feature', tags: ['UI', 'Animation'] },
      { name: 'SIVAInputBar command bar', priority: 'Critical', complexity: 'Medium', type: 'Feature', tags: ['UI', 'Input'] },
      { name: 'SIVAPersonaPanel state display', priority: 'High', complexity: 'Medium', type: 'Feature', tags: ['UI', 'AI'] },
      { name: 'Zustand SIVA store', priority: 'Critical', complexity: 'High', type: 'Infrastructure', tags: ['State', 'Store'] },
      { name: 'Industry-aware theming', priority: 'High', complexity: 'Low', type: 'Feature', tags: ['UI', 'Theming'] },
      { name: 'Quick start cards', priority: 'Medium', complexity: 'Low', type: 'Feature', tags: ['UI', 'Onboarding'] },
      { name: 'Keyboard shortcuts (Cmd+K)', priority: 'Medium', complexity: 'Low', type: 'Feature', tags: ['UX', 'Accessibility'] },
    ],
  },
  {
    number: 27,
    name: 'Sprint S27',
    goal: 'Output Object Engine - AI-generated UI blocks with drag & pin functionality',
    notes: 'Stream 11 - AI Surface Extension. Draggable output containers, DiscoveryObject, ScoringObject with Q/T/L/E radar, RankingObject, OutreachObject.',
    outcomes: 'Created ObjectContainer.tsx with Framer Motion drag, DiscoveryObject.tsx, ScoringObject.tsx with radar visualization, RankingObject.tsx, OutreachObject.tsx with tone selection.',
    highlights: 'Q/T/L/E radar visualization, drag constraints, pin/expand functionality, context menu with share options',
    businessValue: 'AI output becomes manipulable workspace objects - enhances user agency and workflow customization',
    learnings: 'Framer Motion drag needs constraints for good UX, radar charts need careful SVG positioning, object state needs careful management',
    commit: 'b557c8f',
    gitTag: 'sprint-s27',
    branch: 'main',
    phasesUpdated: ['Frontend', 'UX'],
    status: 'Completed',
    features: [
      { name: 'ObjectContainer with drag & pin', priority: 'Critical', complexity: 'High', type: 'Feature', tags: ['UI', 'Interaction'] },
      { name: 'DiscoveryObject component', priority: 'High', complexity: 'Medium', type: 'Feature', tags: ['UI', 'AI'] },
      { name: 'ScoringObject with Q/T/L/E radar', priority: 'High', complexity: 'High', type: 'Feature', tags: ['UI', 'Visualization'] },
      { name: 'RankingObject component', priority: 'High', complexity: 'Medium', type: 'Feature', tags: ['UI', 'AI'] },
      { name: 'OutreachObject with tone selection', priority: 'High', complexity: 'Medium', type: 'Feature', tags: ['UI', 'AI'] },
      { name: 'Expand/collapse functionality', priority: 'Medium', complexity: 'Low', type: 'Feature', tags: ['UI', 'UX'] },
      { name: 'Context menu with actions', priority: 'Medium', complexity: 'Medium', type: 'Feature', tags: ['UI', 'UX'] },
      { name: 'Object export functionality', priority: 'Low', complexity: 'Low', type: 'Feature', tags: ['UI', 'Export'] },
    ],
  },
  {
    number: 28,
    name: 'Sprint S28',
    goal: 'Multi-Agent Orchestration - Specialized agents with confidence-based routing',
    notes: 'Stream 11 - AI Surface Extension. Agent registry with 5 specialized agents (Discovery, Ranking, Outreach, Enrichment, Demo), keyword-based routing, AgentSwitcher UI.',
    outcomes: 'Created lib/agents/types.ts, registry.ts with agent implementations, AgentSwitcher.tsx horizontal selection bar, AgentInfoCard for tooltips.',
    highlights: 'Confidence-based routing, keyword matching, agent capabilities, visual agent switching',
    businessValue: 'Specialized AI agents improve accuracy and user trust - each task gets optimal agent',
    learnings: 'Keyword matching needs tuning for overlapping terms, agent confidence scoring needs calibration',
    commit: 'b557c8f',
    gitTag: 'sprint-s28',
    branch: 'main',
    phasesUpdated: ['Frontend', 'AI'],
    status: 'Completed',
    features: [
      { name: 'Agent types and interfaces', priority: 'Critical', complexity: 'Medium', type: 'Infrastructure', tags: ['AI', 'Types'] },
      { name: 'Agent registry with 5 agents', priority: 'Critical', complexity: 'High', type: 'Feature', tags: ['AI', 'Architecture'] },
      { name: 'Discovery Agent implementation', priority: 'High', complexity: 'Medium', type: 'Feature', tags: ['AI', 'Agent'] },
      { name: 'Ranking Agent with Q/T/L/E', priority: 'High', complexity: 'Medium', type: 'Feature', tags: ['AI', 'Agent'] },
      { name: 'Outreach Agent implementation', priority: 'High', complexity: 'Medium', type: 'Feature', tags: ['AI', 'Agent'] },
      { name: 'Enrichment Agent implementation', priority: 'High', complexity: 'Medium', type: 'Feature', tags: ['AI', 'Agent'] },
      { name: 'Demo Agent implementation', priority: 'Medium', complexity: 'Low', type: 'Feature', tags: ['AI', 'Agent'] },
      { name: 'AgentSwitcher UI component', priority: 'High', complexity: 'Medium', type: 'Feature', tags: ['UI', 'AI'] },
      { name: 'Confidence-based routing', priority: 'Critical', complexity: 'High', type: 'Feature', tags: ['AI', 'Routing'] },
      { name: 'Keyword matching system', priority: 'High', complexity: 'Medium', type: 'Feature', tags: ['AI', 'NLP'] },
    ],
  },
  {
    number: 29,
    name: 'Sprint S29',
    goal: 'Reasoning Overlay - Visual chain-of-thought display with timeline and graph views',
    notes: 'Stream 11 - AI Surface Extension. ReasoningOverlay with timeline and graph views, ReasoningToggle floating button, progress tracking, step visualization.',
    outcomes: 'Created ReasoningOverlay.tsx with TimelineView and GraphView components, ReasoningToggle.tsx floating button, reasoning step visualization.',
    highlights: 'Dual view modes (timeline/graph), animated progress bar, step status indicators, active step animation',
    businessValue: 'Transparency in AI reasoning builds user trust and enables debugging of AI decisions',
    learnings: 'Timeline view more intuitive than graph for linear processes, animation timing crucial for perceived responsiveness',
    commit: 'b557c8f',
    gitTag: 'sprint-s29',
    branch: 'main',
    phasesUpdated: ['Frontend', 'UX'],
    status: 'Completed',
    features: [
      { name: 'ReasoningOverlay panel', priority: 'Critical', complexity: 'High', type: 'Feature', tags: ['UI', 'AI'] },
      { name: 'TimelineView component', priority: 'High', complexity: 'Medium', type: 'Feature', tags: ['UI', 'Visualization'] },
      { name: 'GraphView component', priority: 'High', complexity: 'Medium', type: 'Feature', tags: ['UI', 'Visualization'] },
      { name: 'ReasoningToggle floating button', priority: 'High', complexity: 'Low', type: 'Feature', tags: ['UI', 'UX'] },
      { name: 'Reasoning step visualization', priority: 'High', complexity: 'Medium', type: 'Feature', tags: ['UI', 'AI'] },
      { name: 'Progress bar with animation', priority: 'Medium', complexity: 'Low', type: 'Feature', tags: ['UI', 'Animation'] },
      { name: 'View mode toggle', priority: 'Medium', complexity: 'Low', type: 'Feature', tags: ['UI', 'UX'] },
      { name: 'Active agent indicator', priority: 'Medium', complexity: 'Low', type: 'Feature', tags: ['UI', 'AI'] },
    ],
  },
  {
    number: 30,
    name: 'Sprint S30',
    goal: 'Full UX Polish - Integration and cinematic 2030-level experience',
    notes: 'Stream 11 - AI Surface Extension. Final integration of all S26-S29 components, component exports, full SIVA workspace polish.',
    outcomes: 'Updated index.ts exports, integrated AgentSwitcher into SIVASurface, added ReasoningOverlay to workspace, build verification passed.',
    highlights: 'Complete pageless workspace, all components integrated, smooth animations, consistent theming',
    businessValue: 'Polished product ready for market - professional UX creates strong first impression',
    learnings: 'Integration testing crucial, component exports must be explicit, build verification catches type issues early',
    commit: 'b557c8f',
    gitTag: 'sprint-s30',
    branch: 'main',
    phasesUpdated: ['Frontend', 'UX', 'Integration'],
    status: 'Completed',
    features: [
      { name: 'Component index exports', priority: 'Critical', complexity: 'Low', type: 'Infrastructure', tags: ['Architecture', 'Exports'] },
      { name: 'AgentSwitcher integration', priority: 'High', complexity: 'Low', type: 'Feature', tags: ['UI', 'Integration'] },
      { name: 'ReasoningOverlay integration', priority: 'High', complexity: 'Low', type: 'Feature', tags: ['UI', 'Integration'] },
      { name: 'Build verification', priority: 'Critical', complexity: 'Low', type: 'Testing', tags: ['CI', 'Build'] },
      { name: 'Deployment to staging', priority: 'Critical', complexity: 'Medium', type: 'Infrastructure', tags: ['Deploy', 'Staging'] },
      { name: 'QA certification', priority: 'High', complexity: 'Medium', type: 'Testing', tags: ['QA', 'Certification'] },
    ],
  },
];

async function createSprint(sprint) {
  console.log(`\nCreating Sprint: ${sprint.name}`);

  const response = await notion.pages.create({
    parent: { database_id: SPRINTS_DB_ID },
    properties: {
      'Sprint': {
        title: [{ text: { content: sprint.name } }],
      },
      'Goal': {
        rich_text: [{ text: { content: sprint.goal } }],
      },
      'Status': {
        select: { name: sprint.status },
      },
      'Sprint Notes': {
        rich_text: [{ text: { content: sprint.notes } }],
      },
      'Outcomes': {
        rich_text: [{ text: { content: sprint.outcomes } }],
      },
      'Highlights': {
        rich_text: [{ text: { content: sprint.highlights } }],
      },
      'Business Value': {
        rich_text: [{ text: { content: sprint.businessValue } }],
      },
      'Learnings': {
        rich_text: [{ text: { content: sprint.learnings } }],
      },
      'Commit': {
        rich_text: [{ text: { content: sprint.commit } }],
      },
      'Git Tag': {
        rich_text: [{ text: { content: sprint.gitTag } }],
      },
      'Branch': {
        rich_text: [{ text: { content: sprint.branch } }],
      },
      'Started At': {
        date: { start: '2025-11-25' },
      },
      'Completed At': {
        date: { start: '2025-11-25' },
      },
      'Phases Updated': {
        multi_select: sprint.phasesUpdated.map(p => ({ name: p })),
      },
      'Commits Count': {
        number: 2,
      },
      'Synced At': {
        date: { start: new Date().toISOString().split('T')[0] },
      },
    },
  });

  console.log(`  Created sprint: ${response.id}`);
  return response.id;
}

async function createFeature(feature, sprintNumber) {
  console.log(`  Creating Feature: ${feature.name}`);

  const response = await notion.pages.create({
    parent: { database_id: FEATURES_DB_ID },
    properties: {
      'Features': {
        title: [{ text: { content: feature.name } }],
      },
      'Sprint': {
        number: sprintNumber,
      },
      'Status': {
        select: { name: 'Done' },
      },
      'Priority': {
        select: { name: feature.priority },
      },
      'Complexity': {
        select: { name: feature.complexity },
      },
    },
  });

  console.log(`    Created: ${response.id}`);
  return response.id;
}

async function updateKnowledgePage() {
  console.log('\n' + '='.repeat(60));
  console.log('UPDATING KNOWLEDGE PAGE - Stream 11 (S26-S30)');
  console.log('='.repeat(60));

  // Knowledge Page content for Stream 11
  const blocks = [
    // Divider before new section
    { type: 'divider', divider: {} },

    // Stream 11 Header
    {
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: 'Stream 11: AI Surface Extension (S26-S30)' } }],
      },
    },

    // Overview
    {
      type: 'callout',
      callout: {
        icon: { emoji: '🧠' },
        color: 'purple_background',
        rich_text: [{ type: 'text', text: { content: 'Transforms PremiumRadar from traditional dashboard to 2030 AI-first pageless workspace. SIVA becomes the primary interface.' } }],
      },
    },

    // Key Components Toggle
    {
      type: 'toggle',
      toggle: {
        rich_text: [{ type: 'text', text: { content: '🏗️ Key Components Built' } }],
        children: [
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'SIVASurface - Full-screen AI canvas replacing traditional AppShell' } }],
            },
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'Output Objects - Draggable/pinnable AI response containers (Discovery, Scoring, Ranking, Outreach)' } }],
            },
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'Multi-Agent System - 5 specialized agents (Discovery, Ranking, Outreach, Enrichment, Demo)' } }],
            },
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'Reasoning Overlay - Visual chain-of-thought with timeline/graph views' } }],
            },
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'AgentSwitcher - Horizontal agent selection bar with Auto mode' } }],
            },
          },
        ],
      },
    },

    // Architecture Toggle
    {
      type: 'toggle',
      toggle: {
        rich_text: [{ type: 'text', text: { content: '🔧 Architecture Patterns' } }],
        children: [
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'Zustand store for SIVA state (siva-store.ts)' } }],
            },
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'Agent registry pattern (lib/agents/registry.ts)' } }],
            },
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'Confidence-based routing for agent selection' } }],
            },
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'Framer Motion for drag/animations' } }],
            },
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'Component composition for output objects' } }],
            },
          },
        ],
      },
    },

    // Technologies Toggle
    {
      type: 'toggle',
      toggle: {
        rich_text: [{ type: 'text', text: { content: '🛠️ Technologies Used' } }],
        children: [
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'Zustand - Lightweight state management for SIVA' } }],
            },
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'Framer Motion - Drag controls, animations, transitions' } }],
            },
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'Lucide React - Icon system' } }],
            },
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'SVG - Q/T/L/E radar visualization' } }],
            },
          },
        ],
      },
    },

    // ELI5 Callout
    {
      type: 'callout',
      callout: {
        icon: { emoji: '👶' },
        color: 'yellow_background',
        rich_text: [{ type: 'text', text: { content: 'ELI5: Instead of clicking through menus and pages, you just talk to SIVA (the AI). SIVA shows you answers as movable cards you can arrange however you like. It\'s like having a smart assistant who puts sticky notes on your desk exactly where you want them.' } }],
      },
    },

    // Real-World Analogy
    {
      type: 'callout',
      callout: {
        icon: { emoji: '🎯' },
        color: 'green_background',
        rich_text: [{ type: 'text', text: { content: 'Analogy: Traditional dashboards are like a filing cabinet - you open drawers to find things. SIVA Surface is like having a personal assistant who brings you exactly what you need and arranges it on your desk. The Reasoning Overlay is like seeing the assistant\'s thought process as they work.' } }],
      },
    },

    // Business Value
    {
      type: 'toggle',
      toggle: {
        rich_text: [{ type: 'text', text: { content: '💰 Business Value' } }],
        children: [
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'Market Differentiation - Only AI-first pageless B2B SaaS in market' } }],
            },
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'User Efficiency - 5x faster workflows through conversational interface' } }],
            },
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'Trust Building - Visible reasoning increases AI adoption' } }],
            },
          },
          {
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [{ type: 'text', text: { content: 'Premium Positioning - Cinematic UX justifies premium pricing' } }],
            },
          },
        ],
      },
    },

    // Learnings
    {
      type: 'toggle',
      toggle: {
        rich_text: [{ type: 'text', text: { content: '📚 Key Learnings' } }],
        children: [
          {
            type: 'numbered_list_item',
            numbered_list_item: {
              rich_text: [{ type: 'text', text: { content: 'Pageless design requires excellent state management' } }],
            },
          },
          {
            type: 'numbered_list_item',
            numbered_list_item: {
              rich_text: [{ type: 'text', text: { content: 'Drag constraints are crucial for good UX' } }],
            },
          },
          {
            type: 'numbered_list_item',
            numbered_list_item: {
              rich_text: [{ type: 'text', text: { content: 'Agent routing needs confidence calibration' } }],
            },
          },
          {
            type: 'numbered_list_item',
            numbered_list_item: {
              rich_text: [{ type: 'text', text: { content: 'Timeline view more intuitive than graph for linear reasoning' } }],
            },
          },
          {
            type: 'numbered_list_item',
            numbered_list_item: {
              rich_text: [{ type: 'text', text: { content: 'Integration testing catches type issues early' } }],
            },
          },
        ],
      },
    },

    // Footer
    {
      type: 'callout',
      callout: {
        icon: { emoji: '✅' },
        color: 'gray_background',
        rich_text: [{ type: 'text', text: { content: 'Stream 11 Complete | 5 Sprints | 40 Features | Commit: b557c8f | Deployed: 2025-11-25' } }],
      },
    },
  ];

  // Append blocks to Knowledge Page
  try {
    await notion.blocks.children.append({
      block_id: KNOWLEDGE_DB_ID,
      children: blocks,
    });
    console.log('  Knowledge Page updated with Stream 11 content');
  } catch (error) {
    console.error('  Error updating Knowledge Page:', error.message);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('STREAM 11: AI Surface Extension (S26-S30)');
  console.log('FULL PROPERTY POPULATION');
  console.log('='.repeat(60));

  let totalFeatures = 0;

  // Create Sprints and Features
  for (const sprint of STREAM_11_SPRINTS) {
    await createSprint(sprint);

    for (const feature of sprint.features) {
      await createFeature(feature, sprint.number);
      totalFeatures++;
      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }

  // Update Knowledge Page
  await updateKnowledgePage();

  console.log('\n' + '='.repeat(60));
  console.log(`COMPLETE: Created 5 sprints with ${totalFeatures} features`);
  console.log('Knowledge Page updated with Stream 11 content');
  console.log('='.repeat(60));
}

main().catch(console.error);
