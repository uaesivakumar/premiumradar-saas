/**
 * SIVA Intelligence Enhancement Sprints
 *
 * Vision: "SIVA will be the sales bible for all sales rep in the planet soon"
 *
 * Creates multiple sprints (S218-S223) with features following existing format.
 * All intelligence rules are CONFIG-DRIVEN via Super Admin UI.
 *
 * Usage: NOTION_TOKEN="..." node scripts/notion/createSIVAIntelligenceSprint.js
 */

import { Client } from '@notionhq/client';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SPRINTS_DB = '5c32e26d-641a-4711-a9fb-619703943fb9';
const FEATURES_DB = '26ae5afe-4b5f-4d97-b402-5c459f188944';

const notion = new Client({ auth: NOTION_TOKEN });

async function createSprint(sprintNumber, name, goal, outcomes) {
  return await notion.pages.create({
    parent: { database_id: SPRINTS_DB },
    properties: {
      'Sprint': { title: [{ text: { content: `S${sprintNumber}: ${name}` } }] },
      'Status': { select: { name: 'Backlog' } },
      'Repo': { select: { name: 'Both' } },
      'Goal': { rich_text: [{ text: { content: goal } }] },
      'Outcomes': { rich_text: [{ text: { content: outcomes } }] },
      'Business Value': { rich_text: [{ text: { content: 'SIVA Intelligence - Sales Bible for every rep on the planet' } }] },
    },
  });
}

async function createFeature(name, sprintNumber, priority, complexity, notes, tags) {
  return await notion.pages.create({
    parent: { database_id: FEATURES_DB },
    properties: {
      'Features': { title: [{ text: { content: name } }] },
      'Sprint': { number: sprintNumber },
      'Status': { select: { name: 'Backlog' } },
      'Priority': { select: { name: priority } },
      'Complexity': { select: { name: complexity } },
      'Notes': { rich_text: [{ text: { content: notes } }] },
      'Tags': { multi_select: tags.map(t => ({ name: t })) },
    },
  });
}

async function main() {
  console.log('Creating SIVA Intelligence Sprints...\n');

  // S218: Competitor Filtering
  console.log('Creating S218: Competitor Filtering...');
  await createSprint(218, 'SIVA Competitor Filtering',
    'Config-driven competitor filtering via Super Admin. Banks should never see competitor banks as leads.',
    'EdgeCasesTool reads competitor list from pack config, employer auto-detection, Super Admin UI for blocklist'
  );

  const s218Features = [
    { name: 'Add COMPETITOR_BANK edge case to pack config schema', priority: 'Critical', complexity: 'Medium', notes: 'Add to edge_cases array in employee-banking.json. Also add competitor_blocklist array.', tags: ['Backend', 'Config'] },
    { name: 'Super Admin UI for competitor blocklist editor', priority: 'Critical', complexity: 'High', notes: 'UI to manage competitor_blocklist per sub-vertical. Add/remove banks: ENBD, FAB, DIB, Mashreq, ADCB, etc.', tags: ['Frontend', 'Admin'] },
    { name: 'Enhance EdgeCasesTool to read competitor list from pack config', priority: 'Critical', complexity: 'High', notes: 'Load competitor_blocklist from pack config. Check if lead matches any competitor. Block if match.', tags: ['Backend', 'SIVA'] },
    { name: 'Auto-detect user employer from email domain', priority: 'High', complexity: 'Medium', notes: 'Map @emiratesnbd.com to ENBD, @fab.ae to FAB. Store in user profile as employer_id.', tags: ['Backend', 'Security'] },
  ];

  for (const f of s218Features) {
    await createFeature(f.name, 218, f.priority, f.complexity, f.notes, f.tags);
    console.log('  + ' + f.name.substring(0, 50));
  }

  // S219: Progressive Delivery
  console.log('\nCreating S219: Progressive Delivery...');
  await createSprint(219, 'SIVA Progressive Delivery',
    'Config-driven progressive lead delivery. Show 3-5 leads at a time, not data dumping.',
    'Batch sizes configurable in pack config, lead queue with priority ordering, feedback-driven next batch'
  );

  const s219Features = [
    { name: 'Add progressive_delivery config to pack schema', priority: 'Critical', complexity: 'Low', notes: 'Add to pack config: { initial_batch: 5, subsequent_batch: 3, require_feedback: true }', tags: ['Backend', 'Config'] },
    { name: 'Implement progressive delivery in discovery route', priority: 'Critical', complexity: 'High', notes: 'Read batch size from pack config. Return initial_batch on first call, subsequent_batch on show more.', tags: ['Backend', 'SIVA'] },
    { name: 'Show More pagination with feedback context', priority: 'High', complexity: 'Medium', notes: 'Show 3 more leads button. Send user feedback (liked leads) to OS for smarter next batch.', tags: ['Frontend', 'UX'] },
    { name: 'Lead queue with priority ordering', priority: 'High', complexity: 'High', notes: 'SIVA maintains ranked queue per session. Like = similar leads up, Dismiss = similar leads down.', tags: ['Backend', 'SIVA'] },
  ];

  for (const f of s219Features) {
    await createFeature(f.name, 219, f.priority, f.complexity, f.notes, f.tags);
    console.log('  + ' + f.name.substring(0, 50));
  }

  // S220: Preference Learning
  console.log('\nCreating S220: Preference Learning...');
  await createSprint(220, 'SIVA Preference Learning',
    'Learn user preferences from feedback. SIVA adapts to what user likes.',
    'DB schema for preferences, learning algorithm, preference context in SIVA reasoning'
  );

  const s220Features = [
    { name: 'Create user preferences schema', priority: 'High', complexity: 'Medium', notes: 'Table: user_lead_preferences. Fields: user_id, company_id, action (liked/dismissed/saved), timestamp, reason.', tags: ['Database', 'Backend'] },
    { name: 'Implement preference learning algorithm', priority: 'High', complexity: 'High', notes: 'Analyze liked companies: industry, size, location, signals. Build user taste profile for scoring boost/penalty.', tags: ['Backend', 'SIVA', 'AI'] },
    { name: 'Add preference context to SIVA reasoning', priority: 'High', complexity: 'Medium', notes: 'Include user preferences in SIVA context. "User previously liked similar tech startups" in reasoning.', tags: ['Backend', 'SIVA'] },
  ];

  for (const f of s220Features) {
    await createFeature(f.name, 220, f.priority, f.complexity, f.notes, f.tags);
    console.log('  + ' + f.name.substring(0, 50));
  }

  // S221: Save/Favorites & Feedback UI
  console.log('\nCreating S221: Save & Feedback UI...');
  await createSprint(221, 'SIVA Save & Feedback UI',
    'Save/favorite leads and provide feedback (thumbs up/down).',
    'Save button, Saved Leads page, thumbs up/down, dismiss reasons, feedback wired to learning'
  );

  const s221Features = [
    { name: 'Add Save/Favorite button to lead cards', priority: 'High', complexity: 'Low', notes: 'Star/bookmark icon. Click = save to user favorites. Show "Saved" badge.', tags: ['Frontend', 'UX'] },
    { name: 'Create Saved Leads page', priority: 'High', complexity: 'Medium', notes: 'Grid of all saved companies. Sort by: recently saved, company size. Quick actions: unsave, start outreach.', tags: ['Frontend', 'UI'] },
    { name: 'Add saved leads API endpoints', priority: 'High', complexity: 'Medium', notes: 'GET: list saved. POST: save. DELETE: unsave. Include company details and latest signals.', tags: ['Backend', 'API'] },
    { name: 'Add thumbs up/down feedback buttons', priority: 'Critical', complexity: 'Low', notes: 'Thumbs up (like) and thumbs down (not interested) buttons on lead cards. Instant visual feedback.', tags: ['Frontend', 'UX'] },
    { name: 'Add "Why not interested?" quick reasons', priority: 'Medium', complexity: 'Low', notes: 'On thumbs down, show: "Wrong industry", "Too small", "Already contacted", "Competitor".', tags: ['Frontend', 'UX'] },
    { name: 'Wire feedback to preference learning', priority: 'High', complexity: 'Medium', notes: 'POST feedback to OS. OS updates preference model. Next batch reflects feedback.', tags: ['Backend', 'API'] },
  ];

  for (const f of s221Features) {
    await createFeature(f.name, 221, f.priority, f.complexity, f.notes, f.tags);
    console.log('  + ' + f.name.substring(0, 50));
  }

  // S222: Conversational UX
  console.log('\nCreating S222: Conversational UX...');
  await createSprint(222, 'SIVA Conversational UX',
    'Natural language interaction. "Find more like Emirates Steel", SIVA commentary on results.',
    'Conversational prompts, Find more like X, SIVA commentary, natural language refinement'
  );

  const s222Features = [
    { name: 'Add conversational prompts to discovery', priority: 'High', complexity: 'Medium', notes: 'After showing leads, SIVA asks: "Want more like Emirates Steel?" or "Should I focus on larger companies?"', tags: ['Frontend', 'UX', 'SIVA'] },
    { name: 'Implement "Find more like X" command', priority: 'High', complexity: 'High', notes: 'User clicks "Find more like this". SIVA analyzes: industry, size, signals. Returns similar companies.', tags: ['Backend', 'SIVA'] },
    { name: 'Add SIVA commentary to lead results', priority: 'Medium', complexity: 'Medium', notes: 'SIVA explains: "I found 5 tech companies expanding in Dubai - perfect for EB given their hiring patterns."', tags: ['Frontend', 'SIVA'] },
    { name: 'Implement natural language refinement', priority: 'Medium', complexity: 'High', notes: 'User types: "Show only 100+ employees" or "Focus on DIFC". SIVA parses and applies filters.', tags: ['Frontend', 'Backend', 'SIVA'] },
  ];

  for (const f of s222Features) {
    await createFeature(f.name, 222, f.priority, f.complexity, f.notes, f.tags);
    console.log('  + ' + f.name.substring(0, 50));
  }

  // S223: Super Admin Config & Metrics
  console.log('\nCreating S223: Intelligence Config & Metrics...');
  await createSprint(223, 'SIVA Intelligence Config & Metrics',
    'Super Admin UI for all intelligence settings. Metrics dashboard.',
    'Unified intelligence config UI, pack config API, quality metrics dashboard, test suite'
  );

  const s223Features = [
    { name: 'Add Intelligence Config section to Super Admin', priority: 'High', complexity: 'High', notes: 'Unified UI: progressive_delivery, competitor_blocklist, preference_learning settings. All stored in pack config.', tags: ['Frontend', 'Admin'] },
    { name: 'Add pack config API for intelligence settings', priority: 'High', complexity: 'Medium', notes: 'GET/PUT for pack intelligence config. Validates schema. Syncs to OS pack files.', tags: ['Backend', 'API'] },
    { name: 'Add intelligence quality metrics dashboard', priority: 'Medium', complexity: 'Medium', notes: 'Track: Lead acceptance rate, Conversion to outreach, Feedback patterns, Session engagement time.', tags: ['Analytics', 'Admin'] },
    { name: 'Create SIVA Intelligence test suite', priority: 'High', complexity: 'Medium', notes: 'Tests: Competitor filtering from config, Preferences affect ranking, Progressive delivery respects batch size.', tags: ['Testing'] },
  ];

  for (const f of s223Features) {
    await createFeature(f.name, 223, f.priority, f.complexity, f.notes, f.tags);
    console.log('  + ' + f.name.substring(0, 50));
  }

  console.log('\n========================================');
  console.log('SIVA INTELLIGENCE SPRINTS CREATED');
  console.log('========================================');
  console.log('S218: Competitor Filtering (4 features)');
  console.log('S219: Progressive Delivery (4 features)');
  console.log('S220: Preference Learning (3 features)');
  console.log('S221: Save & Feedback UI (6 features)');
  console.log('S222: Conversational UX (4 features)');
  console.log('S223: Intelligence Config & Metrics (4 features)');
  console.log('\nTotal: 6 sprints, 25 features');
  console.log('\nAll config-driven via Super Admin UI');
}

main().catch(console.error);
