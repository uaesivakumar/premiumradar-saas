#!/usr/bin/env node
/**
 * Create Sprints S14-S15 for Stream 6: Discovery, Ranking & Outreach UI
 */

import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });

const TODAY = '2025-11-25';

const SPRINTS = [
  {
    sprint: 'S14',
    name: 'S14: Discovery & Enrichment',
    status: 'Done',
    startDate: TODAY,
    endDate: TODAY,
    goals: 'Signal Viewer, Company Profiles, Enrichment Module, Discovery Module',
    stream: 'Stream 6: Discovery & Outreach UI',
  },
  {
    sprint: 'S15',
    name: 'S15: Ranking & Outreach UI',
    status: 'Done',
    startDate: TODAY,
    endDate: TODAY,
    goals: 'Ranking Module UI, Ranking Explanations, Preview + Send Workflow, Outreach Module UI',
    stream: 'Stream 6: Discovery & Outreach UI',
  },
];

async function main() {
  console.log('\n📅 Creating Sprints S14-S15 for Stream 6...\n');

  for (const s of SPRINTS) {
    try {
      await notion.pages.create({
        parent: { database_id: dbIds.sprints_db_id },
        properties: {
          'Sprint': { title: [{ text: { content: s.name } }] },
          'Status': { select: { name: s.status } },
        },
      });
      console.log(`✅ ${s.sprint}: Created`);
    } catch (err) {
      console.error(`❌ ${s.sprint}: ${err.message}`);
    }
  }

  console.log('\n✅ Stream 6 sprints created!\n');
}

main().catch(console.error);
