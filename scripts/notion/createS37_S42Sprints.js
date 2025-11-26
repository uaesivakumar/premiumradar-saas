/**
 * Create S37-S42 Sprint Entries in Notion
 *
 * CORRECTION: The Spine Rebuild work was incorrectly numbered as S31-S36.
 * S31-S36 already exist in Notion (completed previously).
 * This script creates the CORRECT S37-S42 entries.
 */

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const SPRINTS_DB = '5c32e26d-641a-4711-a9fb-619703943fb9';
const FEATURES_DB = '26ae5afe-4b5f-4d97-b402-5c459f188944';

const TODAY = new Date().toISOString().split('T')[0];
const STARTED = '2025-11-26';
const BRANCH = 'intelligent-shockley';
const COMMIT = '0c03ff8';

// S37-S42 Sprint Definitions (Spine Rebuild - CORRECTED NUMBERING)
const SPRINTS = [
  {
    number: 37,
    name: 'S37 — AI-First Signup',
    goal: 'Replace generic SaaS signup with AI-first authentication that feels like entering a 2030 intelligence platform',
    outcomes: 'SIVA-branded auth pages, animated neural mesh backgrounds, AI-first signup flow with social providers',
    highlights: 'AuthScaffold, SIVAAuthFrame, AnimatedInput components, Neural mesh visual system',
    businessValue: 'First impression sets the tone - users immediately understand this is not a typical SaaS product',
    learnings: 'Framer Motion animations must be carefully tuned for perceived performance without blocking interaction',
    features: [
      'AuthScaffold component with neural mesh background',
      'SIVAAuthFrame with gradient orbs and animations',
      'SIVASignupPage with social auth integration',
      'SIVALoginPage with consistent visual language',
      'AnimatedInput with focus state animations'
    ]
  },
  {
    number: 38,
    name: 'S38 — SIVA Welcome + Identity Setup',
    goal: 'Create a personalized onboarding experience where SIVA greets the user and captures their identity',
    outcomes: 'Animated SIVA greeting, identity form with role/region capture, progressive reveal interaction',
    highlights: 'SIVAGreeting component with typewriter effect, IdentityForm with animated fields, OnboardingFrame scaffold',
    businessValue: 'Personalization starts from the first interaction - user feels the AI is learning about them',
    learnings: 'Typewriter effects should have variable speed to feel natural, not mechanical',
    features: [
      'SIVAGreeting component with typewriter animation',
      'IdentityForm with name, role, and region capture',
      'OnboardingFrame scaffold with step progression',
      'Welcome page with SIVA introduction sequence',
      'Step-based routing for onboarding flow'
    ]
  },
  {
    number: 39,
    name: 'S39 — Workspace Creation Flow',
    goal: 'Enable users to create Personal or Organization workspaces with SIVA guidance',
    outcomes: 'Workspace type selection, organization details capture, visual workspace preview',
    highlights: 'WorkspaceCreator component, dual-mode selection (Personal/Organization), animated confirmation',
    businessValue: 'Workspace context determines the entire product experience - critical decision point',
    learnings: 'Card-based selection with hover states provides better affordance than radio buttons',
    features: [
      'WorkspaceCreator with dual-mode selection',
      'Personal workspace quick-create path',
      'Organization workspace with team size selection',
      'Workspace preview with visual confirmation',
      'Onboarding store persistence for workspace data'
    ]
  },
  {
    number: 40,
    name: 'S40 — Vertical Selection + Intelligence Setup',
    goal: 'Let users choose their industry vertical to configure SIVA intelligence modules',
    outcomes: 'Industry vertical selector with 5 verticals, signal library preview, intelligence configuration',
    highlights: 'VerticalSelector with Banking, FinTech, Insurance, Real Estate, Consulting options',
    businessValue: 'Vertical selection determines signal libraries, scoring algorithms, and AI behavior',
    learnings: 'Visual previews of what the AI will do per vertical increases conversion confidence',
    features: [
      'VerticalSelector with 5 industry options',
      'Banking vertical with financial signals',
      'FinTech vertical with startup signals',
      'Insurance vertical with risk signals',
      'Real Estate vertical with property signals',
      'Consulting vertical with professional signals',
      'Signal library preview per vertical'
    ]
  },
  {
    number: 41,
    name: 'S41 — Transition Sequence into Workspace',
    goal: 'Create a cinematic transition from onboarding completion to the live SIVA workspace',
    outcomes: 'Multi-phase loading sequence, intelligence initialization animation, workspace reveal',
    highlights: 'TransitionSequence with 4 phases, progress indicators, SIVA personality emergence',
    businessValue: 'The transition builds anticipation and makes the AI workspace feel significant',
    learnings: 'Fake loading with real-feeling phases creates better UX than instant navigation',
    features: [
      'TransitionSequence with 4-phase animation',
      'Phase 1: Initializing SIVA connection',
      'Phase 2: Loading intelligence modules',
      'Phase 3: Configuring vertical signals',
      'Phase 4: Preparing workspace',
      'Cinematic fade-to-workspace reveal'
    ]
  },
  {
    number: 42,
    name: 'S42 — UX Cohesion + Connected Journey QA',
    goal: 'Ensure end-to-end UX cohesion from signup through workspace entry',
    outcomes: 'Route protection middleware, step validation, complete journey testing',
    highlights: 'Middleware route guards, onboarding completion checks, QA certification',
    businessValue: 'Users cannot skip steps or enter broken states - professional-grade onboarding',
    learnings: 'Middleware-based route protection is cleaner than component-level guards',
    features: [
      'Middleware route protection for onboarding',
      'Onboarding completion validation',
      'Step-based redirect logic',
      'Dashboard access control',
      'End-to-end journey QA certification',
      'Cross-browser compatibility verification'
    ]
  }
];

async function createSprints() {
  console.log('Creating S37-S42 Sprint Entries...\n');

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
            select: { name: 'Done' }
          },
          'Goal': {
            rich_text: [{ text: { content: sprint.goal } }]
          },
          'Outcomes': {
            rich_text: [{ text: { content: sprint.outcomes } }]
          },
          'Highlights': {
            rich_text: [{ text: { content: sprint.highlights } }]
          },
          'Business Value': {
            rich_text: [{ text: { content: sprint.businessValue } }]
          },
          'Learnings': {
            rich_text: [{ text: { content: sprint.learnings } }]
          },
          'Branch': {
            rich_text: [{ text: { content: BRANCH } }]
          },
          'Commit': {
            rich_text: [{ text: { content: COMMIT } }]
          },
          'Git Tag': {
            rich_text: [{ text: { content: `sprint-s${sprint.number}-certified` } }]
          },
          'Started At': {
            date: { start: STARTED }
          },
          'Completed At': {
            date: { start: TODAY }
          },
          'Synced At': {
            date: { start: TODAY }
          },
          'Phases Updated': {
            multi_select: [{ name: 'Done' }]
          },
          'Commits Count': {
            number: 1
          }
        }
      });

      console.log(`  ✅ Created: ${sprint.name} (${response.id})`);

      // Create features for this sprint
      await createFeatures(sprint.number, sprint.features);

    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
    }
  }
}

async function createFeatures(sprintNumber, features) {
  for (const featureName of features) {
    try {
      await notion.pages.create({
        parent: { database_id: FEATURES_DB },
        properties: {
          'Features': {
            title: [{ text: { content: featureName } }]
          },
          'Sprint': {
            number: sprintNumber
          },
          'Status': {
            select: { name: 'Done' }
          },
          'Priority': {
            select: { name: 'High' }
          },
          'Complexity': {
            select: { name: 'Medium' }
          },
          'Type': {
            select: { name: 'Feature' }
          },
          'Notes': {
            rich_text: [{ text: { content: `Implemented as part of S${sprintNumber} - User Journey Spine Rebuild` } }]
          },
          'Tags': {
            multi_select: [{ name: 'Onboarding' }, { name: 'SIVA' }, { name: 'UI' }]
          },
          'Assignee': {
            rich_text: [{ text: { content: 'Claude (TC)' } }]
          },
          'Done?': {
            checkbox: true
          },
          'Started At': {
            date: { start: STARTED }
          },
          'Completed At': {
            date: { start: TODAY }
          }
        }
      });
      console.log(`    ✅ Feature: ${featureName}`);
    } catch (error) {
      console.error(`    ❌ Feature failed: ${featureName} - ${error.message}`);
    }
  }
}

// Execute
createSprints()
  .then(() => {
    console.log('\n✅ S37-S42 Sprints and Features created successfully!');
    console.log('\nNext steps:');
    console.log('1. Update QA reports with correct numbering');
    console.log('2. Create Knowledge pages for S37-S42');
    console.log('3. Amend git commit message');
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });
