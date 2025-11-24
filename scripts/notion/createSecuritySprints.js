/**
 * Create Security Sprints (S1-S6) in Notion
 *
 * MANDATORY BEFORE SPRINT 1: Creates all security foundation sprints
 *
 * Usage: NOTION_TOKEN="..." node scripts/notion/createSecuritySprints.js
 */

import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });

const SPRINTS_DB_ID = dbIds.sprints_db_id;
const FEATURES_DB_ID = dbIds.module_features_db_id;

// Security Sprints Definition
const SECURITY_SPRINTS = [
  {
    number: 1,
    name: 'Sprint S1',
    goal: 'Prompt Injection Firewall v1.0',
    features: [
      { name: 'Input Sanitization Layer', priority: 'Critical', complexity: 'High' },
      { name: 'Pattern-based jailbreak detector', priority: 'Critical', complexity: 'High' },
      { name: 'RAG isolation (no direct OS access)', priority: 'Critical', complexity: 'Medium' },
      { name: 'Output leakage filter', priority: 'Critical', complexity: 'Medium' },
      { name: 'LLM Response Guardrail Templates', priority: 'Critical', complexity: 'Medium' },
      { name: 'Public-mode persona mask', priority: 'Critical', complexity: 'Low' }
    ]
  },
  {
    number: 2,
    name: 'Sprint S2',
    goal: 'OS Identity & Token Hardening',
    features: [
      { name: 'SaaS→OS token rotation policy', priority: 'Critical', complexity: 'High' },
      { name: 'OIDC envelope validation', priority: 'Critical', complexity: 'Medium' },
      { name: 'Anti-replay defense (nonce)', priority: 'Critical', complexity: 'Medium' },
      { name: 'User-level scoping for enterprise', priority: 'High', complexity: 'Medium' },
      { name: 'Expired-token anomaly alarms', priority: 'High', complexity: 'Low' }
    ]
  },
  {
    number: 3,
    name: 'Sprint S3',
    goal: 'Anti-Reverse-Engineering Architecture',
    features: [
      { name: 'Full JS Obfuscation (Terser + Obfuscator)', priority: 'Critical', complexity: 'High' },
      { name: 'Remove comments, types, dead code', priority: 'Critical', complexity: 'Low' },
      { name: 'Split logic into micro-modules', priority: 'High', complexity: 'Medium' },
      { name: 'Real-time checksum validation', priority: 'High', complexity: 'Medium' },
      { name: 'Hidden build-time environment injectors', priority: 'Medium', complexity: 'Medium' },
      { name: 'Cloud Armor + User-Agent fingerprinting', priority: 'High', complexity: 'Medium' }
    ]
  },
  {
    number: 4,
    name: 'Sprint S4',
    goal: 'Red-Team Suite v1.0 (Killer Sprint)',
    features: [
      { name: 'Create 150 red-team prompts library', priority: 'Critical', complexity: 'Very High' },
      { name: 'Jailbreak attack prompts (20+)', priority: 'Critical', complexity: 'High' },
      { name: 'Meta-prompt override prompts (15+)', priority: 'Critical', complexity: 'High' },
      { name: 'Prompt-leak attack prompts (15+)', priority: 'Critical', complexity: 'Medium' },
      { name: 'Schema-leak attack prompts (10+)', priority: 'Critical', complexity: 'Medium' },
      { name: 'SQL injection attack prompts (15+)', priority: 'Critical', complexity: 'Medium' },
      { name: 'Config discovery attack prompts (10+)', priority: 'Critical', complexity: 'Medium' },
      { name: 'Tool hijacking attack prompts (10+)', priority: 'High', complexity: 'Medium' },
      { name: 'Hidden chain-of-thought extraction (15+)', priority: 'High', complexity: 'Medium' },
      { name: 'Role escalation attack prompts (15+)', priority: 'Critical', complexity: 'Medium' },
      { name: 'Model fingerprinting attack prompts (10+)', priority: 'Medium', complexity: 'Low' },
      { name: 'Automated CI red-team test runner', priority: 'Critical', complexity: 'High' },
      { name: 'Block deployment on vulnerability detection', priority: 'Critical', complexity: 'Medium' },
      { name: 'Staging red-team attack dashboard', priority: 'High', complexity: 'Medium' }
    ]
  },
  {
    number: 5,
    name: 'Sprint S5',
    goal: 'WAF + Abuse Prevention',
    features: [
      { name: 'Cloud Armor strict mode configuration', priority: 'Critical', complexity: 'Medium' },
      { name: 'Rate limiter (API/Chat/Uploads)', priority: 'Critical', complexity: 'Medium' },
      { name: 'Abuse IP reputation scoring', priority: 'High', complexity: 'Medium' },
      { name: 'Country-based anomaly tracking', priority: 'Medium', complexity: 'Medium' },
      { name: 'Forced CAPTCHA under attack', priority: 'High', complexity: 'Medium' },
      { name: 'DDoS protection patterns', priority: 'Critical', complexity: 'High' }
    ]
  },
  {
    number: 6,
    name: 'Sprint S6',
    goal: 'Immutable Security Change Log',
    features: [
      { name: 'Tamper-proof log table (PostgreSQL)', priority: 'Critical', complexity: 'Medium' },
      { name: 'Signed commits for security changes', priority: 'Critical', complexity: 'Low' },
      { name: 'Release/version bump automation', priority: 'High', complexity: 'Low' },
      { name: 'Slack/webhook notifications', priority: 'Medium', complexity: 'Low' },
      { name: 'Auto-generate SECURITY_CHANGELOG.md', priority: 'Medium', complexity: 'Medium' }
    ]
  }
];

async function createSecuritySprints() {
  console.log('\n='.repeat(60));
  console.log('CREATING SECURITY SPRINTS (S1-S6)');
  console.log('='.repeat(60) + '\n');

  for (const sprint of SECURITY_SPRINTS) {
    console.log(`\nCreating ${sprint.name}: ${sprint.goal}...`);

    try {
      // Create Sprint
      const sprintPage = await notion.pages.create({
        parent: { database_id: SPRINTS_DB_ID },
        properties: {
          'Sprint': {
            title: [
              {
                text: {
                  content: sprint.name
                }
              }
            ]
          },
          'Goal': {
            rich_text: [
              {
                text: {
                  content: sprint.goal
                }
              }
            ]
          },
          'Status': {
            select: {
              name: 'Planned'
            }
          },
          'Sprint Notes': {
            rich_text: [
              {
                text: {
                  content: 'MANDATORY SECURITY SPRINT - Must complete before product Sprint 1'
                }
              }
            ]
          }
        }
      });

      console.log(`  ✅ Sprint created: ${sprint.name}`);

      // Create Features for this sprint
      let featureCount = 0;
      for (const feature of sprint.features) {
        await notion.pages.create({
          parent: { database_id: FEATURES_DB_ID },
          properties: {
            'Features': {
              title: [
                {
                  text: {
                    content: feature.name
                  }
                }
              ]
            },
            'Sprint': {
              number: sprint.number
            },
            'Status': {
              select: {
                name: 'To-Do'
              }
            },
            'Priority': {
              select: {
                name: feature.priority
              }
            },
            'Complexity': {
              select: {
                name: feature.complexity
              }
            },
            'Type': {
              select: {
                name: 'Infra'
              }
            },
            'Notes': {
              rich_text: [
                {
                  text: {
                    content: `${sprint.name}: ${sprint.goal}`
                  }
                }
              ]
            }
          }
        });
        featureCount++;
      }

      console.log(`  ✅ Created ${featureCount} features for ${sprint.name}`);

    } catch (error) {
      console.error(`  ❌ Error creating ${sprint.name}:`, error.message);
      if (error.body) {
        console.error('     Details:', JSON.stringify(error.body, null, 2));
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SECURITY SPRINTS CREATION COMPLETE');
  console.log('='.repeat(60));
  console.log('\nNext Steps:');
  console.log('1. Review sprints in Notion');
  console.log('2. Begin executing S1, S2, S3, S5 in parallel');
  console.log('3. S4 (Red-Team) after S1-S3 complete');
  console.log('4. S6 (Change Log) tracks all changes');
  console.log('5. ALL must complete before Sprint 1 (product)');
  console.log('');
}

createSecuritySprints().catch(console.error);
