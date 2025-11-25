/**
 * Create Sprints S16-S18 in Notion
 *
 * Sprint 16: Analytics & Tracking (8 features)
 * Sprint 17: Demo Mode (6 features)
 * Sprint 18: Marketing & SEO Pages (5 features)
 */

import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });

const SPRINTS_DB_ID = dbIds.sprints_db_id;
const FEATURES_DB_ID = dbIds.module_features_db_id;

// Sprint definitions
const SPRINTS = [
  {
    number: 16,
    name: 'Sprint S16',
    goal: 'Build Mixpanel/PostHog-style analytics with charts, retention, funnels, heatmaps, and AI usage tracking',
    features: [
      { name: 'Mixpanel Charts Clone', priority: 'High', complexity: 'High' },
      { name: 'Retention Analysis', priority: 'High', complexity: 'Medium' },
      { name: 'Funnel Conversion', priority: 'High', complexity: 'Medium' },
      { name: 'AI Usage Tracking', priority: 'High', complexity: 'Medium' },
      { name: 'Error Event Tracking', priority: 'Medium', complexity: 'Medium' },
      { name: 'Token Inference Stats', priority: 'Medium', complexity: 'Low' },
      { name: 'Heatmaps', priority: 'Medium', complexity: 'High' },
      { name: 'Vertical Popularity', priority: 'Medium', complexity: 'Low' },
    ],
  },
  {
    number: 17,
    name: 'Sprint S17',
    goal: 'Build demo mode with fake data generation, locked features, and conversion CTAs for booking meetings',
    features: [
      { name: 'Fake Domain Data', priority: 'High', complexity: 'Medium' },
      { name: 'Fake Pipeline', priority: 'High', complexity: 'Medium' },
      { name: 'Safe Demo Scoring', priority: 'High', complexity: 'Low' },
      { name: 'Locked Actions', priority: 'High', complexity: 'Medium' },
      { name: 'Demo Discovery List', priority: 'Medium', complexity: 'Low' },
      { name: 'Book-a-Meeting CTA', priority: 'High', complexity: 'Medium' },
    ],
  },
  {
    number: 18,
    name: 'Sprint S18',
    goal: 'Build pricing, legal, documentation pages with SEO schema markup',
    features: [
      { name: 'Pricing Page', priority: 'High', complexity: 'Medium' },
      { name: 'Legal Pages', priority: 'High', complexity: 'Medium' },
      { name: 'Documentation Pages', priority: 'High', complexity: 'Medium' },
      { name: 'SEO Pages', priority: 'Medium', complexity: 'Low' },
      { name: 'Schema Markup', priority: 'Medium', complexity: 'Medium' },
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
        select: { name: 'Done' },
      },
      'Sprint Notes': {
        rich_text: [{ text: { content: `Stream 7: Analytics & Growth - ${sprint.features.length} features completed` } }],
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

async function main() {
  console.log('Creating Sprints S16-S18 in Notion...\n');

  for (const sprint of SPRINTS) {
    await createSprint(sprint);

    for (const feature of sprint.features) {
      await createFeature(feature, sprint.number);
      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }

  console.log('\n✅ All sprints and features created successfully!');
  console.log(
    `Total: ${SPRINTS.length} sprints, ${SPRINTS.reduce((sum, s) => sum + s.features.length, 0)} features`
  );
}

main().catch(console.error);
