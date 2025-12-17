/**
 * SIVA Intelligence Enhancement Sprint
 *
 * Vision: "SIVA will be the sales bible for all sales rep in the planet soon"
 *
 * This sprint transforms SIVA from data delivery to intelligent sales assistance:
 * - Progressive lead delivery (not data dumping)
 * - Competitor filtering (don't show competitor banks to salespeople)
 * - User preference learning
 * - Conversational UX
 *
 * ARCHITECTURE PRINCIPLE:
 * All intelligence rules are CONFIG-DRIVEN via Super Admin UI, not hardcoded.
 * - Competitor banks: Added to pack config edge_cases via Super Admin
 * - Batch size: Config per sub-vertical
 * - Blockers: EdgeCasesTool reads from pack config
 *
 * Usage: NOTION_TOKEN="..." node scripts/notion/createSIVAIntelligenceSprint.js
 */

import { Client } from '@notionhq/client';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SPRINTS_DB = '5c32e26d-641a-4711-a9fb-619703943fb9';
const FEATURES_DB = '26ae5afe-4b5f-4d97-b402-5c459f188944';

const notion = new Client({ auth: NOTION_TOKEN });

async function findNextSprintNumber() {
  const sprints = await notion.databases.query({
    database_id: SPRINTS_DB,
    sorts: [{ property: 'Sprint', direction: 'descending' }],
    page_size: 5
  });

  let maxNum = 0;
  for (const page of sprints.results) {
    const title = page.properties.Sprint?.title?.[0]?.plain_text || '';
    const match = title.match(/^S(\d+)/);
    if (match) {
      const num = parseInt(match[1]);
      if (num > maxNum) maxNum = num;
    }
  }
  return maxNum + 1;
}

async function createSprint(sprintNumber, name, goal, repo, outcomes, highlights, businessValue) {
  return await notion.pages.create({
    parent: { database_id: SPRINTS_DB },
    properties: {
      'Sprint': { title: [{ text: { content: 'S' + sprintNumber + ': ' + name } }] },
      'Status': { select: { name: 'Backlog' } },
      'Repo': { select: { name: repo } },
      'Goal': { rich_text: [{ text: { content: goal } }] },
      'Sprint Notes': { rich_text: [{ text: { content: 'SIVA Intelligence - Transform from data delivery to intelligent sales assistant. Vision: Sales Bible for every rep on the planet.' } }] },
      'Outcomes': { rich_text: [{ text: { content: outcomes } }] },
      'Highlights': { rich_text: [{ text: { content: highlights } }] },
      'Business Value': { rich_text: [{ text: { content: businessValue } }] },
      'Branch': { rich_text: [{ text: { content: 'feat/siva-intelligence' } }] },
      'Phases Updated': { multi_select: [{ name: 'Backlog' }] },
    },
  });
}

async function createFeature(name, sprintNumber, type, priority, complexity, notes, tags, repo) {
  return await notion.pages.create({
    parent: { database_id: FEATURES_DB },
    properties: {
      'Features': { title: [{ text: { content: name } }] },
      'Sprint': { number: sprintNumber },
      'Status': { select: { name: 'Backlog' } },
      'Repo': { select: { name: repo } },
      'Priority': { select: { name: priority } },
      'Complexity': { select: { name: complexity } },
      'Type': { select: { name: type } },
      'Notes': { rich_text: [{ text: { content: notes } }] },
      'Tags': { multi_select: tags.map(function(t) { return { name: t }; }) },
      'Assignee': { rich_text: [{ text: { content: 'Claude (TC)' } }] },
      'Done?': { checkbox: false },
      'Started At': { date: { start: new Date().toISOString().split('T')[0] } },
    },
  });
}

async function main() {
  console.log('Finding next sprint number...');
  const nextNum = await findNextSprintNumber();
  console.log('Next sprint number: S' + nextNum);

  // Create SIVA Intelligence Sprint
  console.log('\nCreating SIVA Intelligence Sprint...');
  const sprint = await createSprint(
    nextNum,
    'SIVA Intelligence Enhancement',
    'Transform SIVA from data delivery to intelligent sales assistant. Progressive lead delivery, competitor filtering, preference learning, conversational UX.',
    'UPR OS',
    '1. EdgeCasesTool filters competitor banks 2. Progressive delivery (3-5 leads at a time) 3. User preferences tracked 4. Save/favorite functionality 5. Conversational flow',
    'SI.1 EdgeCases, SI.2 Progressive, SI.3 Preferences, SI.4 Favorites, SI.5 Feedback UI, SI.6 Conversational',
    'CRITICAL DIFFERENTIATOR: Intelligence over data. SIVA becomes the trusted sales advisor that understands context, filters irrelevant leads, learns preferences, and guides discovery - not just data dumping. Vision: Sales Bible for every rep on the planet.'
  );
  console.log('Created Sprint: S' + nextNum + ': SIVA Intelligence Enhancement');

  // SIVA Intelligence Features
  const features = [
    // SI.1 - EdgeCasesTool: Competitor Filtering (CONFIG-DRIVEN via Super Admin)
    {
      name: 'SI.1.1: Add COMPETITOR_BANK edge case to pack config schema',
      type: 'Infrastructure',
      priority: 'Critical',
      complexity: 'Medium',
      notes: 'File: os/packs/banking/employee-banking.json. Add to edge_cases array: { type: "COMPETITOR_BANK", condition: "Lead is a competitor bank", action: "BLOCK", severity: "CRITICAL", can_override: false }. Also add "competitor_blocklist" array to pack config.',
      tags: ['Backend', 'Config', 'Core', 'SIVA'],
      repo: 'UPR OS'
    },
    {
      name: 'SI.1.2: Enhance Super Admin UI with competitor blocklist editor',
      type: 'Feature',
      priority: 'Critical',
      complexity: 'High',
      notes: 'File: app/super-admin/verticals/[id]/edge-cases/page.tsx. UI to manage competitor_blocklist per sub-vertical. Admins can add/remove banks: ENBD, FAB, DIB, Mashreq, ADCB, RAK Bank, CBD, NBF. Store domain mappings.',
      tags: ['Frontend', 'Admin', 'Config'],
      repo: 'SaaS Frontend'
    },
    {
      name: 'SI.1.3: Enhance EdgeCasesTool to read competitor list from pack config',
      type: 'Feature',
      priority: 'Critical',
      complexity: 'High',
      notes: 'File: server/siva-tools/EdgeCasesToolStandalone.js. Load competitor_blocklist from pack config. Check if lead company matches any competitor (by name or domain). Block if match found. Use fuzzy matching for name variations.',
      tags: ['Backend', 'AI', 'Core', 'SIVA'],
      repo: 'UPR OS'
    },
    {
      name: 'SI.1.4: Auto-detect user employer from email domain',
      type: 'Feature',
      priority: 'High',
      complexity: 'Medium',
      notes: 'File: lib/auth/identity/employer-detect.ts. Map @emiratesnbd.com to ENBD, @fab.ae to FAB, etc. Store in user profile as employer_id. Pass to EdgeCasesTool context so it knows user is from ENBD and should never see ENBD leads.',
      tags: ['Backend', 'Security', 'Core'],
      repo: 'SaaS Frontend'
    },

    // SI.2 - Progressive Lead Delivery (CONFIG-DRIVEN batch size)
    {
      name: 'SI.2.1: Add progressive_delivery config to pack schema',
      type: 'Infrastructure',
      priority: 'Critical',
      complexity: 'Low',
      notes: 'File: os/packs/banking/employee-banking.json. Add: "progressive_delivery": { "initial_batch": 5, "subsequent_batch": 3, "require_feedback": true }. Super Admin can configure batch sizes per sub-vertical.',
      tags: ['Backend', 'Config', 'Core'],
      repo: 'UPR OS'
    },
    {
      name: 'SI.2.2: Implement progressive delivery in discovery route',
      type: 'Feature',
      priority: 'Critical',
      complexity: 'High',
      notes: 'File: routes/os/discovery.js. Read batch size from pack config. Return initial_batch leads on first call. Track user session. Return subsequent_batch on "show more" calls. Forces engagement before overwhelming with data.',
      tags: ['Backend', 'AI', 'UX', 'Core'],
      repo: 'UPR OS'
    },
    {
      name: 'SI.2.3: Add "Show More" pagination with feedback context',
      type: 'Feature',
      priority: 'High',
      complexity: 'Medium',
      notes: 'File: components/discovery/LeadResults.tsx. "Show 3 more leads" button appears after viewing initial batch. Sends user feedback (liked leads) to OS. OS uses feedback to rank next batch smarter.',
      tags: ['Frontend', 'UI', 'UX'],
      repo: 'SaaS Frontend'
    },
    {
      name: 'SI.2.4: Implement lead queue with priority ordering',
      type: 'Feature',
      priority: 'High',
      complexity: 'High',
      notes: 'File: os/services/lead-queue.js. SIVA maintains ranked queue per user session. Top leads shown first. Queue reprioritizes based on feedback: Like = similar leads move up, Dismiss = similar leads move down.',
      tags: ['Backend', 'AI', 'Core', 'SIVA'],
      repo: 'UPR OS'
    },

    // SI.3 - User Preference Tracking
    {
      name: 'SI.3.1: Create user preferences schema',
      type: 'Infrastructure',
      priority: 'High',
      complexity: 'Medium',
      notes: 'Table: user_lead_preferences. Fields: user_id, company_id, action (liked/dismissed/saved), timestamp, reason (optional). Indexes for fast lookup. RLS policies.',
      tags: ['Database', 'Backend', 'Core'],
      repo: 'SaaS Frontend'
    },
    {
      name: 'SI.3.2: Implement preference learning algorithm',
      type: 'Feature',
      priority: 'High',
      complexity: 'High',
      notes: 'File: os/services/preference-learner.js. Analyze liked companies: industry, size, location, signals. Build user taste profile. Use for lead scoring boost/penalty. "This user likes tech companies 50-200 employees".',
      tags: ['Backend', 'AI', 'Core', 'SIVA'],
      repo: 'UPR OS'
    },
    {
      name: 'SI.3.3: Add preference context to SIVA reasoning',
      type: 'Feature',
      priority: 'High',
      complexity: 'Medium',
      notes: 'File: os/tools/siva-brain.js. Include user preferences in SIVA context. "User previously liked similar tech startups" in reasoning. Makes SIVA feel personalized.',
      tags: ['Backend', 'AI', 'SIVA'],
      repo: 'UPR OS'
    },

    // SI.4 - Save/Favorite Functionality
    {
      name: 'SI.4.1: Add Save/Favorite button to lead cards',
      type: 'Feature',
      priority: 'High',
      complexity: 'Low',
      notes: 'File: components/discovery/LeadCard.tsx. Star/bookmark icon. Click = save to user favorites. Saved leads persist across sessions. Show "Saved" badge.',
      tags: ['Frontend', 'UI', 'UX'],
      repo: 'SaaS Frontend'
    },
    {
      name: 'SI.4.2: Create Saved Leads page/view',
      type: 'Feature',
      priority: 'High',
      complexity: 'Medium',
      notes: 'File: app/dashboard/saved/page.tsx. Grid of all saved companies. Sort by: recently saved, company size, last signal. Filter by signal type. Quick actions: unsave, start outreach.',
      tags: ['Frontend', 'UI', 'Core'],
      repo: 'SaaS Frontend'
    },
    {
      name: 'SI.4.3: Add saved leads API endpoints',
      type: 'Feature',
      priority: 'High',
      complexity: 'Medium',
      notes: 'File: app/api/saved-leads/route.ts. GET: list saved leads. POST: save a lead. DELETE: unsave. Include company details and latest signals.',
      tags: ['Backend', 'API', 'Core'],
      repo: 'SaaS Frontend'
    },

    // SI.5 - Feedback UI
    {
      name: 'SI.5.1: Add thumbs up/down feedback buttons',
      type: 'Feature',
      priority: 'Critical',
      complexity: 'Low',
      notes: 'File: components/discovery/LeadCard.tsx. Thumbs up (like) and thumbs down (not interested) buttons. Instant visual feedback. State persists. Can change mind.',
      tags: ['Frontend', 'UI', 'UX'],
      repo: 'SaaS Frontend'
    },
    {
      name: 'SI.5.2: Add "Why not interested?" quick reasons',
      type: 'Feature',
      priority: 'Medium',
      complexity: 'Low',
      notes: 'File: components/discovery/DismissReason.tsx. On thumbs down, show quick options: "Wrong industry", "Too small", "Already contacted", "Competitor". Helps SIVA learn faster.',
      tags: ['Frontend', 'UI', 'UX'],
      repo: 'SaaS Frontend'
    },
    {
      name: 'SI.5.3: Wire feedback to preference learning',
      type: 'Feature',
      priority: 'High',
      complexity: 'Medium',
      notes: 'File: app/api/feedback/route.ts. POST feedback to OS. OS updates preference model. Next batch reflects feedback. Closed loop learning.',
      tags: ['Backend', 'API', 'AI'],
      repo: 'SaaS Frontend'
    },

    // SI.6 - Conversational UX
    {
      name: 'SI.6.1: Add conversational prompts to discovery',
      type: 'Feature',
      priority: 'High',
      complexity: 'Medium',
      notes: 'After showing leads, SIVA asks: "Want more companies like Emirates Steel?" or "Should I focus on larger companies?". Natural language guidance.',
      tags: ['Frontend', 'AI', 'UX', 'SIVA'],
      repo: 'SaaS Frontend'
    },
    {
      name: 'SI.6.2: Implement "Find more like X" command',
      type: 'Feature',
      priority: 'High',
      complexity: 'High',
      notes: 'File: os/tools/similar-leads.js. User clicks "Find more like this" on a company. SIVA analyzes: industry, size, signals, location. Finds similar companies. Returns next batch optimized.',
      tags: ['Backend', 'AI', 'Core', 'SIVA'],
      repo: 'UPR OS'
    },
    {
      name: 'SI.6.3: Add SIVA commentary to lead results',
      type: 'Feature',
      priority: 'Medium',
      complexity: 'Medium',
      notes: 'SIVA explains why it showed these leads: "I found 5 tech companies expanding in Dubai - perfect for EB given their hiring patterns." Not just data, but insight.',
      tags: ['Frontend', 'AI', 'UX', 'SIVA'],
      repo: 'SaaS Frontend'
    },
    {
      name: 'SI.6.4: Implement natural language refinement',
      type: 'Feature',
      priority: 'Medium',
      complexity: 'High',
      notes: 'User can type: "Show me only companies with 100+ employees" or "Focus on DIFC area". SIVA parses and applies filters conversationally.',
      tags: ['Frontend', 'Backend', 'AI', 'SIVA'],
      repo: 'Both'
    },

    // SI.7 - Super Admin Intelligence Config UI
    {
      name: 'SI.7.1: Add Intelligence Config section to Super Admin',
      type: 'Feature',
      priority: 'High',
      complexity: 'High',
      notes: 'File: app/super-admin/verticals/[id]/intelligence/page.tsx. Unified UI to configure: progressive_delivery (batch sizes), competitor_blocklist, preference_learning settings. All config stored in pack and loaded by OS.',
      tags: ['Frontend', 'Admin', 'Config'],
      repo: 'SaaS Frontend'
    },
    {
      name: 'SI.7.2: Add pack config API for intelligence settings',
      type: 'Feature',
      priority: 'High',
      complexity: 'Medium',
      notes: 'File: app/api/admin/pack-config/route.ts. GET/PUT for pack intelligence config. Validates schema. Syncs to OS pack files. Super Admin changes take effect immediately.',
      tags: ['Backend', 'API', 'Admin'],
      repo: 'SaaS Frontend'
    },

    // SI.8 - Intelligence Metrics & Validation
    {
      name: 'SI.8.1: Add intelligence quality metrics dashboard',
      type: 'Feature',
      priority: 'Medium',
      complexity: 'Medium',
      notes: 'Track: Lead acceptance rate, Conversion to outreach, Feedback patterns, Session engagement time. Dashboard in Super Admin for measuring SIVA intelligence effectiveness.',
      tags: ['Backend', 'Analytics', 'Core'],
      repo: 'SaaS Frontend'
    },
    {
      name: 'SI.8.2: Create SIVA Intelligence test suite',
      type: 'Testing',
      priority: 'High',
      complexity: 'Medium',
      notes: 'File: tests/siva-intelligence.test.js. Tests: Competitor filtering from config works, Preferences affect ranking, Progressive delivery respects config batch size, Feedback updates model.',
      tags: ['Testing', 'AI', 'Core'],
      repo: 'UPR OS'
    },
    {
      name: 'SI.8.3: Produce SI_CERTIFICATION.md',
      type: 'Testing',
      priority: 'High',
      complexity: 'Medium',
      notes: 'Final certification: Config-driven intelligence works, ENBD user never sees competitor banks, Leads delivered progressively per config, Preferences learned and applied, Conversational flow works, GO/NO-GO.',
      tags: ['Testing', 'Core'],
      repo: 'Both'
    },
  ];

  console.log('\nCreating ' + features.length + ' features...');
  let created = 0;
  for (const f of features) {
    await createFeature(f.name, nextNum, f.type, f.priority, f.complexity, f.notes, f.tags, f.repo);
    created++;
    console.log('  [' + created + '/' + features.length + '] ' + f.name.substring(0, 60) + '...');
  }

  console.log('\n========================================');
  console.log('SIVA INTELLIGENCE SPRINT CREATED');
  console.log('========================================');
  console.log('Sprint: S' + nextNum + ': SIVA Intelligence Enhancement');
  console.log('Features: ' + features.length + ' created');
  console.log('Repos: UPR OS + SaaS Frontend');
  console.log('\nVision: SIVA will be the sales bible for all sales rep on the planet.');
  console.log('\n=== ARCHITECTURE PRINCIPLE ===');
  console.log('All intelligence rules are CONFIG-DRIVEN via Super Admin UI:');
  console.log('  - Competitor banks: Pack config edge_cases (managed via Super Admin)');
  console.log('  - Batch sizes: Pack config progressive_delivery settings');
  console.log('  - EdgeCasesTool reads from pack config, NOT hardcoded');
  console.log('\nKey Capabilities:');
  console.log('  SI.1: Competitor Filtering - Config-driven blocker via Super Admin');
  console.log('  SI.2: Progressive Delivery - Config-driven batch sizes');
  console.log('  SI.3: Preference Learning - DB + algorithm (learns what user likes)');
  console.log('  SI.4: Save/Favorites - Persist interesting leads');
  console.log('  SI.5: Feedback UI - Thumbs up/down with reasons');
  console.log('  SI.6: Conversational UX - Natural language refinement');
  console.log('  SI.7: Super Admin UI - Configure all intelligence settings');
  console.log('  SI.8: Metrics & Validation - Measure intelligence effectiveness');
  console.log('\nView in Notion:');
  console.log('Sprints: https://www.notion.so/5c32e26d641a4711a9fb619703943fb9');
  console.log('Features: https://www.notion.so/26ae5afe4b5f4d97b4025c459f188944');
}

main().catch(console.error);
