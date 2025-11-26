/**
 * Create PremiumRadar Master Roadmap (S48-S66) in Notion
 *
 * 19 Sprints across 5 Phases:
 * - Phase 1: Journey Engine (S48-S52)
 * - Phase 2: Admin & Super-Admin (S53-S55)
 * - Phase 3: Workspace & Object Intelligence (S56-S58)
 * - Phase 4: Autonomous Mode (S59-S62)
 * - Phase 5: Launch Polish (S63-S66)
 */

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const SPRINTS_DB = '5c32e26d-641a-4711-a9fb-619703943fb9';
const FEATURES_DB = '26ae5afe-4b5f-4d97-b402-5c459f188944';

// =============================================================================
// SPRINT DEFINITIONS
// =============================================================================

const SPRINTS = [
  // PHASE 1: Journey Engine (S48-S52)
  {
    number: 48,
    name: 'Journey Engine v1 (State Machine)',
    goal: 'Define Discovery → Score → Rank → Engage state graph with persistence',
    phase: 'Phase 1: Journey Engine',
    businessValue: 'Enables multi-step automated sales workflows',
    features: [
      { name: 'Journey state graph definition', type: 'Infrastructure', priority: 'High', complexity: 'High', tags: ['Core', 'State'], notes: 'Define Discovery → Score → Rank → Engage state graph' },
      { name: 'Journey state persistence', type: 'Infrastructure', priority: 'High', complexity: 'High', tags: ['Core', 'State'], notes: 'Persist journey state to database' },
      { name: 'Step transitions engine', type: 'Infrastructure', priority: 'High', complexity: 'Medium', tags: ['Core'], notes: 'Handle state transitions with preconditions' },
      { name: 'Transition preconditions', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core'], notes: 'Define and check preconditions before transitions' },
      { name: 'Journey error handling', type: 'Infrastructure', priority: 'High', complexity: 'Medium', tags: ['Core'], notes: 'Error handling and recovery' },
      { name: 'Journey fallback logic', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['Core'], notes: 'Fallback paths when steps fail' },
    ]
  },
  {
    number: 49,
    name: 'Promptable Journeys',
    goal: 'Natural-language → journey orchestration with AI path selection',
    phase: 'Phase 1: Journey Engine',
    businessValue: 'Users can describe workflows in natural language',
    features: [
      { name: 'NL → Journey orchestrator', type: 'Feature', priority: 'High', complexity: 'High', tags: ['AI', 'Core'], notes: 'Parse natural language to journey steps' },
      { name: 'Find → Score → Draft pipeline', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core'], notes: 'Standard sales workflow pipeline' },
      { name: 'AI journey path selection', type: 'Feature', priority: 'High', complexity: 'High', tags: ['AI'], notes: 'AI automatically chooses optimal journey path' },
      { name: 'Auto-context injection', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core', 'State'], notes: 'Automatically inject context into journey steps' },
    ]
  },
  {
    number: 50,
    name: 'Auto-Object Chains',
    goal: 'Generate next objects automatically based on dependencies',
    phase: 'Phase 1: Journey Engine',
    businessValue: 'Zero-friction object generation flow',
    features: [
      { name: 'Auto object generation', type: 'Feature', priority: 'High', complexity: 'High', tags: ['Core', 'AI'], notes: 'Generate next objects without user instruction' },
      { name: 'Object dependency graph', type: 'Infrastructure', priority: 'High', complexity: 'High', tags: ['Core'], notes: 'Discovery → Ranking → Outreach dependencies' },
      { name: 'Auto-populated CompanyObject', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core', 'UI'], notes: 'Auto-fill CompanyObject from enrichment' },
      { name: 'Vertical-aware chaining', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core'], notes: 'Chain objects based on vertical config' },
    ]
  },
  {
    number: 51,
    name: 'Branching Journeys',
    goal: 'Conditional routing with abort/resume and vertical-aware rules',
    phase: 'Phase 1: Journey Engine',
    businessValue: 'Smart workflow adaptation based on results',
    features: [
      { name: 'Conditional routing engine', type: 'Infrastructure', priority: 'High', complexity: 'High', tags: ['Core'], notes: 'If score < 60 → enrich more logic' },
      { name: 'Fallback routing', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core'], notes: 'If no Apollo match → fallback to web scrape' },
      { name: 'Journey abort logic', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core', 'State'], notes: 'Graceful journey abort handling' },
      { name: 'Journey resume logic', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core', 'State'], notes: 'Resume paused/failed journeys' },
      { name: 'Vertical-aware branching', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['Core'], notes: 'Branching rules per vertical config' },
    ]
  },
  {
    number: 52,
    name: 'Journey QA & Multi-Run Tests',
    goal: '50+ journey tests including stress tests and conflict resolution',
    phase: 'Phase 1: Journey Engine',
    businessValue: 'Production-ready journey engine',
    features: [
      { name: '50+ journey test suite', type: 'Testing', priority: 'High', complexity: 'High', tags: ['Core'], notes: 'Comprehensive journey tests' },
      { name: 'Multi-step reasoning tests', type: 'Testing', priority: 'High', complexity: 'Medium', tags: ['AI'], notes: 'Test reasoning across journey steps' },
      { name: 'Vertical-specific journey QA', type: 'Testing', priority: 'High', complexity: 'Medium', tags: ['Core'], notes: 'QA per vertical configuration' },
      { name: 'Stress test: 200 objects', type: 'Testing', priority: 'High', complexity: 'High', tags: ['Core'], notes: '200 object generation stress test' },
      { name: 'SIVA conflict resolution tests', type: 'Testing', priority: 'High', complexity: 'Medium', tags: ['Core', 'AI'], notes: 'Test SIVA conflict handling' },
    ]
  },

  // PHASE 2: Admin & Super-Admin (S53-S55)
  {
    number: 53,
    name: 'Super-Admin Panel (Root Controls)',
    goal: 'Full vertical/region management with audit and version control',
    phase: 'Phase 2: Admin & Super-Admin',
    businessValue: 'Centralized control for multi-vertical SaaS',
    features: [
      { name: 'Vertical management UI', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['UI', 'Core'], notes: 'CRUD for verticals' },
      { name: 'Sub-vertical editor', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['UI', 'Core'], notes: 'Edit sub-verticals per vertical' },
      { name: 'Region/Territory editor', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['UI', 'Core'], notes: 'Manage regions and territories' },
      { name: 'VerticalConfig editor', type: 'Feature', priority: 'High', complexity: 'High', tags: ['UI', 'Core'], notes: 'Full config editor with JSON view' },
      { name: 'Super-admin access control', type: 'Infrastructure', priority: 'High', complexity: 'Medium', tags: ['Core'], notes: 'Role-based access for super-admin' },
      { name: 'Server-side validation', type: 'Infrastructure', priority: 'High', complexity: 'Medium', tags: ['Core', 'API'], notes: 'Validate config changes server-side' },
      { name: 'Config version history', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['Core'], notes: 'Track config versions' },
      { name: 'Audit logs', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['Core'], notes: 'Log all changes with who/when' },
    ]
  },
  {
    number: 54,
    name: 'Admin Panel (Tenant-Level Controls)',
    goal: 'Enterprise tenant controls for features, users, and billing',
    phase: 'Phase 2: Admin & Super-Admin',
    businessValue: 'Self-service for enterprise customers',
    features: [
      { name: 'Feature toggles', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['UI', 'Core'], notes: 'Enable/disable features per tenant' },
      { name: 'Allowed verticals selector', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['UI'], notes: 'Select allowed verticals/sub-verticals' },
      { name: 'Allowed regions selector', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['UI'], notes: 'Select allowed regions' },
      { name: 'Custom enrichment pipelines', type: 'Feature', priority: 'Medium', complexity: 'High', tags: ['Core'], notes: 'Configure enrichment sources' },
      { name: 'Outreach templates manager', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['UI'], notes: 'Manage outreach templates' },
      { name: 'User & Role management', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['UI', 'Core'], notes: 'Manage team users and roles' },
      { name: 'Team-level configs', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['Core'], notes: 'Team-specific settings' },
      { name: 'Billing visibility', type: 'Feature', priority: 'Medium', complexity: 'Low', tags: ['UI'], notes: 'Read-only billing info (Stripe)' },
    ]
  },
  {
    number: 55,
    name: 'VerticalConfig v3 (Full Domain Modeling)',
    goal: 'Complete domain model for plug-and-play verticals',
    phase: 'Phase 2: Admin & Super-Admin',
    businessValue: 'Fully configurable without code changes',
    features: [
      { name: 'RadarTarget config', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core'], notes: 'Companies/Individuals/Families/Candidates' },
      { name: 'Signals per vertical', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core'], notes: 'Configure signals per vertical' },
      { name: 'Q/T/L/E scoring rules', type: 'Feature', priority: 'High', complexity: 'High', tags: ['Core', 'AI'], notes: 'Scoring rules with weights' },
      { name: 'Enrichment modules config', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core', 'API'], notes: 'Configure enrichment sources' },
      { name: 'Outreach modules config', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['Core'], notes: 'Configure outreach channels' },
      { name: 'Journey presets', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['Core'], notes: 'Pre-defined journey templates' },
      { name: 'Metrics thresholds', type: 'Feature', priority: 'Medium', complexity: 'Low', tags: ['Core'], notes: 'Configure metric thresholds' },
      { name: 'Territory capacity rules', type: 'Feature', priority: 'Low', complexity: 'Medium', tags: ['Core'], notes: 'Territory-based capacity limits' },
      { name: 'ICP scoring config', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core', 'AI'], notes: 'Ideal Customer Profile scoring' },
      { name: 'Timing signals config', type: 'Feature', priority: 'Medium', complexity: 'Low', tags: ['Core'], notes: 'Configure timing-based signals' },
      { name: 'B2B adjustments config', type: 'Feature', priority: 'Medium', complexity: 'Low', tags: ['Core'], notes: 'B2B-specific adjustments' },
    ]
  },

  // PHASE 3: Workspace & Object Intelligence (S56-S58)
  {
    number: 56,
    name: 'Output Objects v3 (Interactive + Reasoning)',
    goal: 'Enhanced objects with reasoning panels and entity linking',
    phase: 'Phase 3: Workspace & Object Intelligence',
    businessValue: 'Rich, interactive intelligence objects',
    features: [
      { name: 'CompanyObject v3', type: 'Feature', priority: 'High', complexity: 'High', tags: ['UI', 'Core'], notes: 'Enhanced company object with reasoning' },
      { name: 'ScoreObject v3', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['UI', 'Core'], notes: 'Enhanced scoring object' },
      { name: 'RankingObject v2', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['UI', 'Core'], notes: 'Enhanced ranking object' },
      { name: 'OutreachObject v2', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['UI', 'Core'], notes: 'Enhanced outreach object' },
      { name: 'Reasoning + Evidence panels', type: 'Feature', priority: 'High', complexity: 'High', tags: ['UI', 'AI'], notes: 'Show reasoning and evidence' },
      { name: 'Object history timeline', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['UI'], notes: 'Track object changes over time' },
      { name: 'Inspector drawer', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['UI'], notes: 'Deep-dive object inspector' },
      { name: 'Object metadata linking', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['Core'], notes: 'Link metadata across objects' },
      { name: 'Entity graph linking', type: 'Feature', priority: 'Medium', complexity: 'High', tags: ['Core'], notes: 'Link entities across objects' },
    ]
  },
  {
    number: 57,
    name: 'Pageless Workspace v2',
    goal: 'High-performance workspace with gestures and smart features',
    phase: 'Phase 3: Workspace & Object Intelligence',
    businessValue: '60fps workspace experience',
    features: [
      { name: 'Gesture support', type: 'Feature', priority: 'High', complexity: 'High', tags: ['UI', 'Animation'], notes: 'Touch and mouse gestures' },
      { name: 'Speed optimizations', type: 'Infrastructure', priority: 'High', complexity: 'High', tags: ['Core'], notes: 'Performance optimizations' },
      { name: 'Zoom levels', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['UI'], notes: 'Workspace zoom controls' },
      { name: 'Auto-stacking', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['UI'], notes: 'Automatic object stacking' },
      { name: 'Smart threads', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['UI'], notes: 'Intelligent thread management' },
      { name: 'Cross-object dragging', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['UI'], notes: 'Drag content between objects' },
      { name: 'Live positioning fixes', type: 'Bug', priority: 'High', complexity: 'Medium', tags: ['UI'], notes: 'Fix positioning issues' },
      { name: 'ThreadRecorder enhancements', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['Core'], notes: 'Enhanced thread recording' },
    ]
  },
  {
    number: 58,
    name: 'SIVA Reasoning Kernel v2',
    goal: 'Multi-path reasoning with confidence and evidence chains',
    phase: 'Phase 3: Workspace & Object Intelligence',
    businessValue: 'Explainable AI decisions',
    features: [
      { name: 'Multi-path reasoning', type: 'Feature', priority: 'High', complexity: 'High', tags: ['AI', 'Core'], notes: 'Multiple reasoning paths' },
      { name: 'Confidence index', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['AI'], notes: 'Confidence scoring for decisions' },
      { name: 'Evidence chain trace', type: 'Feature', priority: 'High', complexity: 'High', tags: ['AI'], notes: 'Trace evidence through reasoning' },
      { name: 'Time-weighted reasoning', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['AI'], notes: 'Weight reasoning by recency' },
      { name: 'Multi-agent arbitration', type: 'Feature', priority: 'Medium', complexity: 'High', tags: ['AI', 'Core'], notes: 'Resolve multi-agent conflicts' },
      { name: 'Vertical-aware reasoning', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['AI', 'Core'], notes: 'Reasoning rules per vertical' },
    ]
  },

  // PHASE 4: Autonomous Mode (S59-S62)
  {
    number: 59,
    name: 'Autonomous Discovery',
    goal: 'Daily automated scans with notifications',
    phase: 'Phase 4: Autonomous Mode',
    businessValue: 'Continuous lead generation',
    features: [
      { name: 'Daily hiring scans', type: 'Feature', priority: 'High', complexity: 'High', tags: ['Core', 'API'], notes: 'Automated daily hiring signal scans' },
      { name: 'Daily enrichment', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core', 'API'], notes: 'Auto-enrich new discoveries' },
      { name: 'Auto-score + auto-rank', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core', 'AI'], notes: 'Automatic scoring and ranking' },
      { name: 'Notification engine', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core'], notes: 'Alert users of new discoveries' },
      { name: 'Region-aware discovery', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['Core'], notes: 'Discover based on user region' },
      { name: 'Vertical-specific tasks', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['Core'], notes: 'Periodic tasks per vertical' },
    ]
  },
  {
    number: 60,
    name: 'Autonomous Outreach Prep',
    goal: 'Auto-draft personalized outreach sequences',
    phase: 'Phase 4: Autonomous Mode',
    businessValue: 'Zero-effort outreach preparation',
    features: [
      { name: 'Auto-draft outreach', type: 'Feature', priority: 'High', complexity: 'High', tags: ['AI', 'Core'], notes: 'Automatically draft outreach' },
      { name: 'Auto-personalized sequences', type: 'Feature', priority: 'High', complexity: 'High', tags: ['AI'], notes: 'Personalized follow-up sequences' },
      { name: 'TonePack integration', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['AI'], notes: 'Apply tone packs to outreach' },
      { name: 'Persona-aware outreach', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['AI'], notes: 'Outreach based on persona' },
      { name: 'Journey completion mode', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['Core'], notes: 'Auto-complete journey to outreach' },
    ]
  },
  {
    number: 61,
    name: 'Memory Engine v2',
    goal: 'Long-term memory for companies, users, and outcomes',
    phase: 'Phase 4: Autonomous Mode',
    businessValue: 'Learning from past interactions',
    features: [
      { name: 'Long-term company memory', type: 'Feature', priority: 'High', complexity: 'High', tags: ['Core', 'AI'], notes: 'Remember company interactions' },
      { name: 'Per-user memory', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core'], notes: 'User-specific memory' },
      { name: 'Per-vertical memory', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['Core'], notes: 'Vertical-specific patterns' },
      { name: 'Enrichment memory', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['Core', 'API'], notes: 'Cache enrichment results' },
      { name: 'Outcome memory', type: 'Feature', priority: 'High', complexity: 'High', tags: ['Core', 'AI'], notes: 'Learn from success/failure' },
    ]
  },
  {
    number: 62,
    name: 'AI Trust & Audit Layer',
    goal: 'Transparency, citations, and compliance controls',
    phase: 'Phase 4: Autonomous Mode',
    businessValue: 'Enterprise-grade AI trust',
    features: [
      { name: 'Evidence transparency', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['AI', 'UI'], notes: 'Show evidence for decisions' },
      { name: 'Citations system', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['AI'], notes: 'Cite sources for claims' },
      { name: 'Reasoning explainability', type: 'Feature', priority: 'High', complexity: 'High', tags: ['AI', 'UI'], notes: 'Explain AI reasoning' },
      { name: 'Journey audit trail', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core'], notes: 'Full journey audit log' },
      { name: 'Red-team safety', type: 'Feature', priority: 'Medium', complexity: 'High', tags: ['Core', 'AI'], notes: 'Safety functions and limits' },
      { name: 'Compliance controls', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['Core'], notes: 'Compliance with regulations' },
    ]
  },

  // PHASE 5: Launch Polish (S63-S66)
  {
    number: 63,
    name: 'Performance & UX Polish',
    goal: 'Lighthouse 90+ with 60fps workspace',
    phase: 'Phase 5: Launch Polish',
    businessValue: 'Premium user experience',
    features: [
      { name: 'Dashboard route optimization', type: 'Infrastructure', priority: 'High', complexity: 'Medium', tags: ['Core'], notes: 'Optimize all dashboard routes' },
      { name: 'RSC tuning', type: 'Infrastructure', priority: 'High', complexity: 'Medium', tags: ['Core'], notes: 'React Server Components tuning' },
      { name: 'Lighthouse 90+ audit', type: 'Testing', priority: 'High', complexity: 'Medium', tags: ['Core'], notes: 'Achieve Lighthouse 90+' },
      { name: 'CDN + caching tuning', type: 'Infrastructure', priority: 'Medium', complexity: 'Medium', tags: ['Core'], notes: 'Optimize CDN and caching' },
      { name: 'Mobile polish', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['UI'], notes: 'Mobile responsiveness' },
      { name: 'Safari/Firefox testing', type: 'Testing', priority: 'High', complexity: 'Low', tags: ['Core'], notes: 'Cross-browser testing' },
      { name: 'Workspace 60fps', type: 'Infrastructure', priority: 'High', complexity: 'High', tags: ['UI', 'Animation'], notes: 'Achieve 60fps workspace' },
    ]
  },
  {
    number: 64,
    name: 'Documentation & Marketing',
    goal: 'Product explainers, API docs, and playbooks',
    phase: 'Phase 5: Launch Polish',
    businessValue: 'Market-ready documentation',
    features: [
      { name: 'Product explainer', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['UI'], notes: 'Product explanation content' },
      { name: 'Investor deck', type: 'Feature', priority: 'High', complexity: 'Medium', tags: [], notes: 'Investor presentation' },
      { name: 'API documentation', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['API'], notes: 'Full API docs' },
      { name: 'Whitepaper (optional)', type: 'Feature', priority: 'Low', complexity: 'High', tags: [], notes: 'Technical whitepaper' },
      { name: 'Use-case playbooks', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: [], notes: 'Playbooks per vertical' },
      { name: 'Guided onboarding', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['UI'], notes: 'Onboarding screens' },
    ]
  },
  {
    number: 65,
    name: 'Growth Layer',
    goal: 'Analytics, tracking, and AB testing',
    phase: 'Phase 5: Launch Polish',
    businessValue: 'Data-driven growth',
    features: [
      { name: 'Mixpanel instrumentation', type: 'Infrastructure', priority: 'High', complexity: 'Medium', tags: ['Core'], notes: 'Event tracking setup' },
      { name: 'Feature analytics', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core'], notes: 'Track feature usage' },
      { name: 'Conversion tracking', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core'], notes: 'Track conversions' },
      { name: 'User personalization', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['Core', 'AI'], notes: 'Personalize user experience' },
      { name: 'AB testing framework', type: 'Infrastructure', priority: 'Medium', complexity: 'High', tags: ['Core'], notes: 'AB testing infrastructure' },
    ]
  },
  {
    number: 66,
    name: 'Launch Kit',
    goal: 'Landing page, pricing, and beta program',
    phase: 'Phase 5: Launch Polish',
    businessValue: 'Launch-ready assets',
    features: [
      { name: 'Landing page v2', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['UI'], notes: 'Updated landing page' },
      { name: 'Pricing page v2', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['UI'], notes: 'Updated pricing page' },
      { name: 'Authentication polish', type: 'Feature', priority: 'High', complexity: 'Low', tags: ['UI', 'Core'], notes: 'Polish auth flows' },
      { name: 'Invite flows', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['UI', 'Core'], notes: 'Team invite system' },
      { name: 'Email templates', type: 'Feature', priority: 'Medium', complexity: 'Low', tags: [], notes: 'Transactional emails' },
      { name: 'Press & PR material', type: 'Feature', priority: 'Medium', complexity: 'Low', tags: [], notes: 'Press kit' },
      { name: 'First 100 customer kit', type: 'Feature', priority: 'High', complexity: 'Medium', tags: [], notes: 'Onboarding kit for first customers' },
      { name: 'Beta access program', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Core'], notes: 'Beta access system' },
    ]
  },
];

// =============================================================================
// CREATE FUNCTIONS
// =============================================================================

async function createSprint(sprint) {
  console.log(`Creating Sprint S${sprint.number}: ${sprint.name}...`);

  try {
    const response = await notion.pages.create({
      parent: { database_id: SPRINTS_DB },
      properties: {
        'Sprint': { title: [{ text: { content: `S${sprint.number}: ${sprint.name}` } }] },
        'Status': { select: { name: 'Backlog' } },
        'Goal': { rich_text: [{ text: { content: sprint.goal } }] },
        'Sprint Notes': { rich_text: [{ text: { content: `${sprint.phase}. ${sprint.goal}` } }] },
        'Outcomes': { rich_text: [{ text: { content: 'To be filled upon completion' } }] },
        'Highlights': { rich_text: [{ text: { content: 'To be filled upon completion' } }] },
        'Business Value': { rich_text: [{ text: { content: sprint.businessValue } }] },
        'Branch': { rich_text: [{ text: { content: `feat/sprint-s${sprint.number}` } }] },
        'Phases Updated': { multi_select: [{ name: 'Backlog' }] },
      },
    });

    console.log(`  ✓ Created Sprint S${sprint.number}`);
    return response.id;
  } catch (error) {
    console.error(`  ✗ Failed to create Sprint S${sprint.number}:`, error.message);
    throw error;
  }
}

async function createFeature(feature, sprintNumber) {
  try {
    const response = await notion.pages.create({
      parent: { database_id: FEATURES_DB },
      properties: {
        'Features': { title: [{ text: { content: feature.name } }] },
        'Sprint': { number: sprintNumber },
        'Status': { select: { name: 'Backlog' } },
        'Priority': { select: { name: feature.priority } },
        'Complexity': { select: { name: feature.complexity } },
        'Type': { select: { name: feature.type } },
        'Notes': { rich_text: [{ text: { content: feature.notes } }] },
        'Tags': { multi_select: feature.tags.map(t => ({ name: t })) },
        'Assignee': { rich_text: [{ text: { content: 'Claude (TC)' } }] },
        'Done?': { checkbox: false },
      },
    });

    return response.id;
  } catch (error) {
    console.error(`    ✗ Failed to create feature "${feature.name}":`, error.message);
    throw error;
  }
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  PREMIUMRADAR MASTER ROADMAP (S48-S66)');
  console.log('  Creating 19 Sprints and ~90 Features');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');

  let totalSprints = 0;
  let totalFeatures = 0;

  for (const sprint of SPRINTS) {
    await createSprint(sprint);
    totalSprints++;

    // Create features for this sprint
    for (const feature of sprint.features) {
      await createFeature(feature, sprint.number);
      totalFeatures++;
    }

    console.log(`    → ${sprint.features.length} features created`);
    console.log('');

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  COMPLETE!`);
  console.log(`  Sprints: ${totalSprints}`);
  console.log(`  Features: ${totalFeatures}`);
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('📋 View in Notion:');
  console.log('   Sprints: https://notion.so/5c32e26d641a47119fb619703943fb9');
  console.log('   Features: https://notion.so/26ae5afe4b5f4d97b402c5459f188944');
  console.log('');
  console.log('⏳ AWAITING APPROVAL before execution.');
  console.log('');
}

main().catch(console.error);
