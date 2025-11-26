#!/usr/bin/env node
/**
 * Stream 11 – User Journey Spine Rebuild (S31-S36)
 * Creates Sprints S31-S36 and all 41 features
 *
 * Replace all placeholder flows with unified 2030 AI-first onboarding journey:
 * Landing → Signup → AI-Guided Onboarding → Workspace Selection → Vertical Setup → SIVA Pageless Surface
 */

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const SPRINTS_DB = '5c32e26d-641a-4711-a9fb-619703943fb9';
const FEATURES_DB = '26ae5afe-4b5f-4d97-b402-5c459f188944';

const STREAM_NAME = 'Stream 11 – User Journey Spine Rebuild';

// Sprint definitions with full property population
const sprints = [
  {
    number: 31,
    name: 'AI-First Signup',
    goal: 'Replace old /login and /signup with 2030 AI-first UI featuring SIVA-assisted flows',
    outcomes: 'New SIVAAuthFrame, AnimatedInput, AuthScaffold components; /login and /signup routes rebuilt',
    highlights: 'Neural floating background, magnetic focus inputs, social login redesign, dark/light adaptive',
    businessValue: 'First impression point - establishes PremiumRadar as 2030 AI-first product from moment of signup',
    branch: 'feat/sprint-s31-ai-signup',
  },
  {
    number: 32,
    name: 'SIVA Welcome + Identity Setup',
    goal: 'SIVA greets user on first signup with AI-driven identity setup flow',
    outcomes: 'SIVAGreeting, IdentityForm components; /onboarding/welcome route; user profile persistence',
    highlights: 'SIVA greeting animation, motion sequences (fade/slide/counters), role/region capture',
    businessValue: 'Personalizes experience from first interaction - user feels known, not processed',
    branch: 'feat/sprint-s32-siva-welcome',
  },
  {
    number: 33,
    name: 'Workspace Creation Flow',
    goal: '2030 UI for workspace setup with SIVA-driven prompts and magnetic interactions',
    outcomes: 'WorkspaceCreator component; /onboarding/workspace route; workspace API integration',
    highlights: 'SIVA prompts ("What shall we name your workspace?"), magnetic buttons, workspace type selection',
    businessValue: 'Workspace is the container for all user intelligence - must feel significant, not administrative',
    branch: 'feat/sprint-s33-workspace-flow',
  },
  {
    number: 34,
    name: 'Vertical Selection + Intelligence Setup',
    goal: 'Replace dropdowns with AI-first cinematic selection grid for industry verticals',
    outcomes: 'VerticalSelector, VerticalExplainer components; /onboarding/vertical route; intelligence module loading',
    highlights: 'Cinematic selection grid, SIVA explains each vertical, auto-load intelligence modules',
    businessValue: 'Vertical selection determines intelligence context - this is where PremiumRadar becomes specific to user',
    branch: 'feat/sprint-s34-vertical-setup',
  },
  {
    number: 35,
    name: 'Transition Sequence → SIVA Pageless Workspace',
    goal: 'Full-screen cinematic transition from onboarding into SIVA pageless surface',
    outcomes: 'LoadingSequence, VerticalBootSequence components; /onboarding/transition route; dashboard redirect',
    highlights: '"Configuring your intelligence layer..." animation, vertical-specific progress, SIVA readiness prompt',
    businessValue: 'Transition builds anticipation and signals the AI is preparing specifically for this user',
    branch: 'feat/sprint-s35-transition',
  },
  {
    number: 36,
    name: 'Connected Journey QA + UX Cohesion',
    goal: 'Ensure zero design discontinuity across all 5 surfaces with route protection',
    outcomes: 'Full UX audit, middleware route enforcement, legacy component removal, QA report',
    highlights: 'Spacing/typography/motion/color consistency, neural background presence, onboarding enforcement',
    businessValue: 'Cohesive journey builds trust - any discontinuity breaks the 2030 AI-first illusion',
    branch: 'feat/sprint-s36-ux-cohesion',
  },
];

// Feature definitions with full property population
const features = [
  // S31 - AI-First Signup (6 features)
  { sprint: 31, name: 'SIVAAuthFrame - Neural background auth container', type: 'Feature', priority: 'High', complexity: 'High', notes: 'Main auth frame with floating neural background matching homepage/SIVA surface', tags: ['UI', 'Animation'] },
  { sprint: 31, name: 'AnimatedInput - Magnetic focus input fields', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Input fields with magnetic focus animation, glow effects on interaction', tags: ['UI', 'Animation'] },
  { sprint: 31, name: 'AuthScaffold - Shared auth layout structure', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Scaffold component for login/signup shared layout and state', tags: ['UI', 'Core'] },
  { sprint: 31, name: 'Social login redesign - PremiumRadar style', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Google/GitHub OAuth buttons in 2030 AI-first style, not generic', tags: ['UI', 'Core'] },
  { sprint: 31, name: 'Dark/Light adaptive theme detection', type: 'Feature', priority: 'Medium', complexity: 'Low', notes: 'Auto-detect user preference, apply appropriate theme to auth flow', tags: ['UI', 'State'] },
  { sprint: 31, name: '/login and /signup route rebuild', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Complete replacement of old auth routes with new components', tags: ['Core'] },

  // S32 - SIVA Welcome + Identity Setup (5 features)
  { sprint: 32, name: 'SIVAGreeting - First-time user welcome', type: 'Feature', priority: 'High', complexity: 'High', notes: 'SIVA animated greeting on first signup, personalized welcome message', tags: ['UI', 'AI', 'Animation'] },
  { sprint: 32, name: 'IdentityForm - AI-driven profile capture', type: 'Feature', priority: 'High', complexity: 'Medium', notes: '"Who are you?" flow - name, role, region capture with SIVA guidance', tags: ['UI', 'AI', 'State'] },
  { sprint: 32, name: 'Motion sequences - Fade/slide/counter animations', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Reusable motion components for onboarding flow transitions', tags: ['UI', 'Animation'] },
  { sprint: 32, name: 'User profile persistence layer', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Save user profile data (name, role, region) to backend', tags: ['Core', 'State'] },
  { sprint: 32, name: '/onboarding/welcome route setup', type: 'Feature', priority: 'High', complexity: 'Low', notes: 'New route for SIVA welcome flow, integrated with auth redirect', tags: ['Core'] },

  // S33 - Workspace Creation Flow (6 features)
  { sprint: 33, name: 'WorkspaceCreator - 2030 UI workspace setup', type: 'Feature', priority: 'High', complexity: 'High', notes: 'Main workspace creation component with SIVA-driven prompts', tags: ['UI', 'AI'] },
  { sprint: 33, name: 'SIVA workspace prompts - Conversational UI', type: 'Feature', priority: 'High', complexity: 'Medium', notes: '"What shall we name your workspace?" - natural language prompts', tags: ['UI', 'AI'] },
  { sprint: 33, name: 'Magnetic workspace type buttons', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Personal vs Organization selection with magnetic hover effects', tags: ['UI', 'Animation'] },
  { sprint: 33, name: 'Workspace creation API integration', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Backend API for creating workspace, linking to user', tags: ['Core', 'API'] },
  { sprint: 33, name: 'Workspace memory - User association', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Store workspace reference in user record, enable switching', tags: ['Core', 'State'] },
  { sprint: 33, name: '/onboarding/workspace route setup', type: 'Feature', priority: 'High', complexity: 'Low', notes: 'New route for workspace creation flow', tags: ['Core'] },

  // S34 - Vertical Selection + Intelligence Setup (8 features)
  { sprint: 34, name: 'VerticalSelector - Cinematic selection grid', type: 'Feature', priority: 'High', complexity: 'High', notes: 'Replace dropdowns with AI-first cinematic industry selection', tags: ['UI', 'AI', 'Animation'] },
  { sprint: 34, name: 'VerticalExplainer - SIVA vertical tooltips', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'SIVA explains each vertical using motion and contextual tooltips', tags: ['UI', 'AI'] },
  { sprint: 34, name: 'Banking vertical card + intelligence', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Banking industry selection with specific SIVA intelligence modules', tags: ['UI', 'AI'] },
  { sprint: 34, name: 'FinTech vertical card + intelligence', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'FinTech industry selection with specific SIVA intelligence modules', tags: ['UI', 'AI'] },
  { sprint: 34, name: 'Insurance vertical card + intelligence', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Insurance industry selection with specific SIVA intelligence modules', tags: ['UI', 'AI'] },
  { sprint: 34, name: 'Real Estate vertical card + intelligence', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Real Estate industry selection with specific SIVA intelligence modules', tags: ['UI', 'AI'] },
  { sprint: 34, name: 'Consulting vertical card + intelligence', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Consulting industry selection with specific SIVA intelligence modules', tags: ['UI', 'AI'] },
  { sprint: 34, name: '/onboarding/vertical route setup', type: 'Feature', priority: 'High', complexity: 'Low', notes: 'New route for vertical selection flow', tags: ['Core'] },

  // S35 - Transition Sequence → SIVA Pageless Workspace (7 features)
  { sprint: 35, name: 'LoadingSequence - Cinematic transition screen', type: 'Feature', priority: 'High', complexity: 'High', notes: '"Configuring your intelligence layer..." full-screen animation', tags: ['UI', 'Animation'] },
  { sprint: 35, name: 'VerticalBootSequence - Vertical-specific loading', type: 'Feature', priority: 'High', complexity: 'High', notes: 'Animated progress bars customized to selected vertical', tags: ['UI', 'Animation', 'AI'] },
  { sprint: 35, name: 'SIVA readiness prompt - "Ready to begin?"', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Final SIVA confirmation before entering workspace', tags: ['UI', 'AI'] },
  { sprint: 35, name: 'Dashboard redirect logic', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Automatic redirect into /dashboard SIVA surface after transition', tags: ['Core', 'State'] },
  { sprint: 35, name: 'AppShell removal - SIVA surface only', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Ensure no legacy AppShell appears, pure SIVA surface', tags: ['UI', 'Core'] },
  { sprint: 35, name: '/onboarding/transition route setup', type: 'Feature', priority: 'High', complexity: 'Low', notes: 'New route for transition sequence', tags: ['Core'] },
  { sprint: 35, name: 'Onboarding completion state persistence', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Store onboarding completion status for route protection', tags: ['Core', 'State'] },

  // S36 - Connected Journey QA + UX Cohesion (9 features)
  { sprint: 36, name: 'Cross-surface spacing consistency audit', type: 'Testing', priority: 'High', complexity: 'Medium', notes: 'Audit spacing across Landing, Signup, Onboarding, Vertical, Workspace', tags: ['UI'] },
  { sprint: 36, name: 'Typography consistency enforcement', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Unify font sizes, weights, line heights across all surfaces', tags: ['UI'] },
  { sprint: 36, name: 'Motion curves standardization', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Standardize animation timing, easing curves across all surfaces', tags: ['UI', 'Animation'] },
  { sprint: 36, name: 'Color palette cohesion', type: 'Feature', priority: 'High', complexity: 'Low', notes: 'Ensure consistent use of PremiumRadar color system', tags: ['UI'] },
  { sprint: 36, name: 'Neural background presence verification', type: 'Testing', priority: 'High', complexity: 'Medium', notes: 'Verify neural/orb/mesh backgrounds appear correctly on all surfaces', tags: ['UI', 'Animation'] },
  { sprint: 36, name: 'Legacy component removal sweep', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Remove any remaining generic SaaS components', tags: ['Core'] },
  { sprint: 36, name: 'Middleware route protection', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: '/middleware.ts - force incomplete onboarding users to correct step', tags: ['Core', 'State'] },
  { sprint: 36, name: 'Onboarding step detection logic', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Detect which onboarding step user is on, redirect appropriately', tags: ['Core', 'State'] },
  { sprint: 36, name: 'Full QA report - QA_SPINE_REBUILD_FULL.md', type: 'Testing', priority: 'High', complexity: 'High', notes: 'Comprehensive QA report covering all 5 surfaces and journey flow', tags: ['Core'] },
];

async function createSprint(sprint) {
  console.log(`Creating Sprint S${sprint.number}: ${sprint.name}...`);

  try {
    const response = await notion.pages.create({
      parent: { database_id: SPRINTS_DB },
      properties: {
        'Sprint': { title: [{ text: { content: `S${sprint.number}: ${sprint.name}` } }] },
        'Status': { select: { name: 'Backlog' } },
        'Goal': { rich_text: [{ text: { content: sprint.goal } }] },
        'Sprint Notes': { rich_text: [{ text: { content: `${STREAM_NAME}. ${sprint.goal}` } }] },
        'Outcomes': { rich_text: [{ text: { content: sprint.outcomes } }] },
        'Highlights': { rich_text: [{ text: { content: sprint.highlights } }] },
        'Business Value': { rich_text: [{ text: { content: sprint.businessValue } }] },
        'Branch': { rich_text: [{ text: { content: sprint.branch } }] },
        'Phases Updated': { multi_select: [{ name: 'Backlog' }] },
      },
    });
    console.log(`  ✓ Created S${sprint.number}: ${response.id}`);
    return response;
  } catch (error) {
    console.error(`  ✗ Failed S${sprint.number}:`, error.message);
    throw error;
  }
}

async function createFeature(feature) {
  console.log(`  Creating: ${feature.name.substring(0, 50)}...`);

  try {
    const response = await notion.pages.create({
      parent: { database_id: FEATURES_DB },
      properties: {
        'Features': { title: [{ text: { content: feature.name } }] },
        'Sprint': { number: feature.sprint },
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
    console.log(`    ✓ Created`);
    return response;
  } catch (error) {
    console.error(`    ✗ Failed:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Stream 11 – User Journey Spine Rebuild');
  console.log('  Creating Sprints S31-S36 and 41 Features');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Create all sprints
  console.log('PHASE 1: Creating Sprints\n');
  for (const sprint of sprints) {
    await createSprint(sprint);
    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  // Create all features grouped by sprint
  console.log('\nPHASE 2: Creating Features\n');
  for (const sprint of sprints) {
    console.log(`\nSprint S${sprint.number} Features:`);
    const sprintFeatures = features.filter(f => f.sprint === sprint.number);
    for (const feature of sprintFeatures) {
      await createFeature(feature);
      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }

  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  CREATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Sprints Created: ${sprints.length} (S31-S36)`);
  console.log(`  Features Created: ${features.length}`);
  console.log('\n  Sprint Breakdown:');
  for (const sprint of sprints) {
    const count = features.filter(f => f.sprint === sprint.number).length;
    console.log(`    S${sprint.number}: ${sprint.name} (${count} features)`);
  }
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  AWAITING FOUNDER APPROVAL');
  console.log('  Review in Notion, then reply "approved" to begin execution');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
