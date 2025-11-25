/**
 * Create Stream 10 Sprints (S21-S25) in Notion
 * Premium UI + Motion Experience Layer
 */

import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });

const SPRINTS_DB_ID = dbIds.sprints_db_id;
const FEATURES_DB_ID = dbIds.module_features_db_id;

const STREAM_10_SPRINTS = [
  {
    number: 21,
    name: 'Sprint S21',
    goal: 'Motion Engine + Animation Framework - Bring life to the UI with comprehensive motion system',
    notes: 'Stream 10 - Premium UI + Motion Experience. Global motion system with Framer Motion + Spring physics, timing curves library, scroll-triggered animations, route transitions.',
    features: [
      { name: 'Global Motion System (Framer + Spring)', priority: 'High', complexity: 'High' },
      { name: 'Timing curves library', priority: 'High', complexity: 'Medium' },
      { name: 'Viewport enter/exit animations', priority: 'High', complexity: 'Medium' },
      { name: 'Motion presets (fade, rise, slide, scale, stagger)', priority: 'High', complexity: 'Medium' },
      { name: 'Scroll-triggered animation engine', priority: 'High', complexity: 'High' },
      { name: 'Hero reveal motion (title + orb + CTA)', priority: 'High', complexity: 'Medium' },
      { name: 'Floating CTA micro animations', priority: 'Medium', complexity: 'Low' },
      { name: 'Hover morph transitions for buttons', priority: 'Medium', complexity: 'Low' },
      { name: 'Landing sections staggered reveal', priority: 'High', complexity: 'Medium' },
      { name: 'Dashboard animated card loading', priority: 'Medium', complexity: 'Medium' },
      { name: 'Drawer slide animations', priority: 'Medium', complexity: 'Low' },
      { name: 'Modal open/close scaling', priority: 'Medium', complexity: 'Low' },
      { name: 'Route transition animation system', priority: 'High', complexity: 'High' },
      { name: 'Motion debugging overlay (dev only)', priority: 'Low', complexity: 'Low' },
    ],
  },
  {
    number: 22,
    name: 'Sprint S22',
    goal: '3D AI Orb + Neural Mesh Engine - Create signature visual identity with WebGL',
    notes: 'Stream 10 - Premium UI. WebGL/Three.js 3D Orb with reactive lighting, neural mesh background with procedural animation, industry-based color theming, mobile-optimized fallbacks.',
    features: [
      { name: 'WebGL/Three.js 3D Orb surface', priority: 'High', complexity: 'High' },
      { name: 'Reactive lighting (listening → thinking → responding)', priority: 'High', complexity: 'High' },
      { name: 'Particle emission bursts on interaction', priority: 'Medium', complexity: 'Medium' },
      { name: 'Soft glow shaders', priority: 'High', complexity: 'Medium' },
      { name: 'Neural texture map (dynamic)', priority: 'High', complexity: 'High' },
      { name: 'Orbiting micro-spheres (AI cognition effect)', priority: 'Medium', complexity: 'Medium' },
      { name: 'Depth-of-field camera setup', priority: 'Medium', complexity: 'Medium' },
      { name: 'Auto-pixel density scaling (mobile)', priority: 'High', complexity: 'Medium' },
      { name: 'Energy pulse when AI types', priority: 'Medium', complexity: 'Low' },
      { name: 'Cursor proximity interaction (magnet effect)', priority: 'Medium', complexity: 'Medium' },
      { name: 'Three.js neural mesh grid', priority: 'High', complexity: 'High' },
      { name: 'Procedural noise movement', priority: 'High', complexity: 'Medium' },
      { name: 'Color gradients based on industry', priority: 'High', complexity: 'Low' },
      { name: 'Subtle parallax motion', priority: 'Medium', complexity: 'Low' },
      { name: 'FPS governor (max 45fps)', priority: 'High', complexity: 'Low' },
      { name: 'Mobile fallback (2D animated mesh)', priority: 'High', complexity: 'Medium' },
      { name: 'Smooth fade-in/out transitions', priority: 'Medium', complexity: 'Low' },
      { name: 'Orb central placement + shadow', priority: 'High', complexity: 'Low' },
      { name: 'Mesh depth behind hero', priority: 'High', complexity: 'Low' },
    ],
  },
  {
    number: 23,
    name: 'Sprint S23',
    goal: 'Dynamic Vertical Landing Engine - Visitor industry rewires the entire landing page in real time',
    notes: 'Stream 10 - Premium UI. Industry-aware landing page morphing, dynamic content switching (hero, features, CTAs), vertical-specific color theming. Supports Banking, Insurance, Real Estate, Tech, Recruitment.',
    features: [
      { name: 'Landing page morph based on detected industry', priority: 'High', complexity: 'High' },
      { name: 'Hero subtitle rewritten for industry', priority: 'High', complexity: 'Low' },
      { name: 'Feature cards swapped dynamically', priority: 'High', complexity: 'Medium' },
      { name: 'Pricing hints change per vertical', priority: 'Medium', complexity: 'Low' },
      { name: 'CTA text changes per vertical', priority: 'High', complexity: 'Low' },
      { name: 'Orb color & glow shift based on vertical', priority: 'High', complexity: 'Low' },
      { name: 'Mesh color theme shift', priority: 'High', complexity: 'Low' },
      { name: 'Quick intent cards updated per vertical', priority: 'High', complexity: 'Medium' },
      { name: 'Chat model prompt tweaked per vertical', priority: 'Medium', complexity: 'Medium' },
      { name: 'Header links reorder based on B2B/B2C', priority: 'Low', complexity: 'Low' },
      { name: 'AI explanation differences per vertical', priority: 'Medium', complexity: 'Medium' },
    ],
  },
  {
    number: 24,
    name: 'Sprint S24',
    goal: 'Micro-Demo Cinematic Experience - Create magic moment before signup with guided demo',
    notes: 'Stream 10 - Premium UI. 30-second cinematic guided demo, progressive demo states with timeline, glassmorphism visual effects, smooth workspace transition.',
    features: [
      { name: '30-second cinematic guided demo', priority: 'High', complexity: 'High' },
      { name: 'Step-by-step progressive demo states', priority: 'High', complexity: 'High' },
      { name: 'Auto-run animation timeline', priority: 'High', complexity: 'Medium' },
      { name: 'Demo → Workspace morph transition', priority: 'High', complexity: 'High' },
      { name: 'Animated path lines (discovery→score→outreach)', priority: 'Medium', complexity: 'Medium' },
      { name: 'Live scrolling text "AI reasoning preview"', priority: 'Medium', complexity: 'Medium' },
      { name: 'CTA reveal at the end', priority: 'High', complexity: 'Low' },
      { name: 'Instant workspace loading animation', priority: 'High', complexity: 'Medium' },
      { name: 'Glassmorphism containers', priority: 'High', complexity: 'Low' },
      { name: 'Blurred background orbs', priority: 'Medium', complexity: 'Low' },
      { name: 'Spotlight effect on active step', priority: 'Medium', complexity: 'Medium' },
      { name: 'Emoji-motion interactions for demo steps', priority: 'Low', complexity: 'Low' },
    ],
  },
  {
    number: 25,
    name: 'Sprint S25',
    goal: 'Premium SaaS Polish & Branding Layer - Final touches that create the premium feel',
    notes: 'Stream 10 - Premium UI. Typography and spacing system, premium visual enhancements, auto dark mode theme, WCAG 2.1 AA accessibility compliance.',
    features: [
      { name: 'PremiumRadar typography scale', priority: 'High', complexity: 'Medium' },
      { name: 'System-wide spacing rules', priority: 'High', complexity: 'Medium' },
      { name: 'Golden-ratio vertical rhythm', priority: 'Medium', complexity: 'Low' },
      { name: 'Curved radius design system', priority: 'High', complexity: 'Low' },
      { name: 'Shadows elevation levels 1-4', priority: 'High', complexity: 'Low' },
      { name: 'Adaptive content width per breakpoint', priority: 'High', complexity: 'Medium' },
      { name: 'Gradient-enhanced buttons', priority: 'High', complexity: 'Low' },
      { name: 'Soft neon edge glows', priority: 'Medium', complexity: 'Low' },
      { name: 'Hover elevation animations', priority: 'Medium', complexity: 'Low' },
      { name: 'Opacity ripple feedback', priority: 'Medium', complexity: 'Low' },
      { name: 'Auto-dark mode theme', priority: 'High', complexity: 'High' },
      { name: 'Gradient borders (thin)', priority: 'Medium', complexity: 'Low' },
      { name: 'Section dividers (ambient lines)', priority: 'Low', complexity: 'Low' },
      { name: 'Motion-aware shadows', priority: 'Medium', complexity: 'Medium' },
      { name: 'Loading skeletons (premium glow)', priority: 'High', complexity: 'Medium' },
      { name: 'WCAG 2.1 AA color contrast validation', priority: 'High', complexity: 'Medium' },
      { name: 'Focus rings', priority: 'High', complexity: 'Low' },
      { name: 'Skip-navigation keyboard support', priority: 'High', complexity: 'Low' },
      { name: 'ARIA roles on all interactive components', priority: 'High', complexity: 'Medium' },
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
        select: { name: 'Not Started' },
      },
      'Sprint Notes': {
        rich_text: [{ text: { content: sprint.notes } }],
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
        select: { name: 'Not Started' },
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

async function main() {
  console.log('='.repeat(60));
  console.log('STREAM 10: Premium UI + Motion Experience (S21-S25)');
  console.log('='.repeat(60));

  let totalFeatures = 0;

  for (const sprint of STREAM_10_SPRINTS) {
    await createSprint(sprint);

    for (const feature of sprint.features) {
      await createFeature(feature, sprint.number);
      totalFeatures++;
      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`COMPLETE: Created 5 sprints with ${totalFeatures} features`);
  console.log('='.repeat(60));
}

main().catch(console.error);
