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
      'Sprint': { title: [{ text: { content: `S${sprintNumber}: ${name}` } }] },
      'Status': { select: { name: 'Backlog' } },
      'Repo': { select: { name: repo } },
      'Goal': { rich_text: [{ text: { content: goal } }] },
      'Sprint Notes': { rich_text: [{ text: { content: 'VS10 - LIVE SYSTEM WIRING - Mandatory blocker sprint for Private Beta' } }] },
      'Outcomes': { rich_text: [{ text: { content: outcomes } }] },
      'Highlights': { rich_text: [{ text: { content: highlights } }] },
      'Business Value': { rich_text: [{ text: { content: businessValue } }] },
      'Branch': { rich_text: [{ text: { content: 'feat/vs10-live-wiring' } }] },
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
      'Tags': { multi_select: tags.map(t => ({ name: t })) },
      'Assignee': { rich_text: [{ text: { content: 'Claude (TC)' } }] },
      'Done?': { checkbox: false },
      'Started At': { date: { start: new Date().toISOString().split('T')[0] } },
    },
  });
}

async function main() {
  console.log('Finding next sprint number...');
  const nextNum = await findNextSprintNumber();
  console.log(`Next sprint number: S${nextNum}`);

  // Create VS10 Sprint
  console.log('\nCreating VS10 Sprint...');
  await createSprint(
    nextNum,
    'VS10 - LIVE SYSTEM WIRING',
    'Connect all core infrastructure to real SaaS behaviour. A functioning product where a REAL USER can log in and perform EB workflows end-to-end.',
    'SaaS Frontend',
    'Real Supabase auth, Real signup with domain enforcement, Persistent vertical lock, Email sending with tracking, Live SIVA wiring, Pageless AI workspace',
    'VS10.1 Auth, VS10.2 Signup, VS10.3 Vertical Lock, VS10.4 Email, VS10.5 SIVA, VS10.6 Workspace',
    'CRITICAL: This is the final blocker before Private Beta. Without VS10, the product is a facade. With VS10, users can actually sign up, log in, and use the platform.'
  );
  console.log(`Created Sprint: S${nextNum}: VS10 - LIVE SYSTEM WIRING`);

  // VS10 Features
  const features = [
    // VS10.1 - Real Authentication
    { name: 'VS10.1.1: Replace mock Supabase client with real @supabase/ssr', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'File: lib/supabase/server.ts. Replace mockClient with createServerClient. Requires SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY', tags: ['Backend', 'Security', 'Core'] },
    { name: 'VS10.1.2: Implement real login API route', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'File: app/api/auth/login/route.ts. Flow: Validate email domain, Call Supabase signInWithPassword, Set session cookies', tags: ['API', 'Security', 'Backend'] },
    { name: 'VS10.1.3: Implement real session middleware', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'File: lib/auth/session.ts. Replace mock user ID with Supabase session.user.id', tags: ['Backend', 'Security', 'Core'] },

    // VS10.2 - Signup Flow
    { name: 'VS10.2.1: Build signup API endpoint with domain validation', type: 'Feature', priority: 'High', complexity: 'High', notes: 'File: app/api/auth/signup/route.ts. Validate domain (NO Gmail/Yahoo/Hotmail), Check MX records, Create Supabase user, Set default sub-vertical and region', tags: ['API', 'Security', 'Backend'] },
    { name: 'VS10.2.2: Wire frontend signup form to real API', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'File: components/auth/SIVASignupPage.tsx. Replace setTimeout mock with actual API call', tags: ['Frontend', 'UI', 'Security'] },
    { name: 'VS10.2.3: Save vertical choice on signup to database', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'File: lib/auth/identity/vertical-lock.ts. Persist to profiles table', tags: ['Backend', 'Database', 'Core'] },

    // VS10.3 - Vertical Lock Persistence
    { name: 'VS10.3.1: Create/verify user profiles table schema', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Fields: user_id, tenant_id, vertical, sub_vertical, region, created_at. Ensure RLS policies.', tags: ['Database', 'Security', 'Core'] },
    { name: 'VS10.3.2: Enforce vertical lock on login', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'File: lib/auth/identity/vertical-lock.ts. Vertical NOT editable after signup. Sub-vertical can change (with rate limit). Region fixed.', tags: ['Backend', 'Security', 'Core'] },
    { name: 'VS10.3.3: Wire VerticalSelector to real user ID', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'File: components/onboarding/VerticalSelector.tsx. Replace mockUserId with session.user.id', tags: ['Frontend', 'UI', 'Core'] },
    { name: 'VS10.3.4: Ensure OS receives correct SalesContext', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'File: lib/os-client.ts. Send tenant_id, user_id, vertical, sub_vertical, region in all requests', tags: ['Backend', 'API', 'Core'] },

    // VS10.4 - Email Delivery
    { name: 'VS10.4.1: Add Resend email sending module', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'File: lib/email/send.ts. Function: sendEmail({ to, subject, html, tracking }). Env: RESEND_API_KEY', tags: ['Backend', 'Core'] },
    { name: 'VS10.4.2: Connect dunning emails to real sender', type: 'Feature', priority: 'Medium', complexity: 'Low', notes: 'File: lib/billing/dunning.ts. Replace console.log with sendEmail()', tags: ['Backend', 'Core'] },
    { name: 'VS10.4.3: Connect outreach to email sender', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'File: app/api/os/outreach/route.ts. Wire AI-generated outreach to sendEmail()', tags: ['Backend', 'API', 'AI'] },
    { name: 'VS10.4.4: Implement email tracking webhook', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'File: app/api/email/webhook/route.ts. Log: delivered, opened, clicked events', tags: ['Backend', 'API'] },

    // VS10.5 - Live SIVA Wiring
    { name: 'VS10.5.1: Verify LLM API keys in environment', type: 'Infrastructure', priority: 'High', complexity: 'Low', notes: 'Ensure OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY are set in Cloud Run', tags: ['Backend', 'AI', 'Core'] },
    { name: 'VS10.5.2: Wire SIVA API route to OS', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'File: app/api/os/siva/route.ts. Ensure real AI calls, not fallback mode', tags: ['Backend', 'API', 'AI'] },
    { name: 'VS10.5.3: Pass persona/vertical/region to all SIVA calls', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'File: lib/os-client.ts. Validate SIVA produces QTLE explanation, persona-tuned reasoning, EB-specific insights', tags: ['Backend', 'AI', 'Core'] },

    // VS10.6 - Pageless AI Workspace
    { name: 'VS10.6.1: Ensure all AI calls go through OS client', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Audit all dashboard components to use osClient, not direct API calls', tags: ['Frontend', 'Backend', 'Core'] },
    { name: 'VS10.6.2: Add streaming mode for SIVA responses', type: 'Feature', priority: 'Medium', complexity: 'High', notes: 'Implement SSE/streaming for real-time AI responses in workspace', tags: ['Frontend', 'Backend', 'AI'] },
    { name: 'VS10.6.3: Add action buttons (discover, score, outreach)', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Wire workspace action buttons to real OS endpoints', tags: ['Frontend', 'UI'] },
    { name: 'VS10.6.4: Add reasoning view panel', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Show SIVA reasoning breakdown in expandable panel', tags: ['Frontend', 'UI', 'AI'] },
    { name: 'VS10.6.5: Add intelligence badges and AI summarization', type: 'Feature', priority: 'Low', complexity: 'Medium', notes: 'VS7 components (AIGeneratedBadge, etc.) integrated into workspace', tags: ['Frontend', 'UI', 'AI'] },

    // VS10 Certification
    { name: 'VS10.7: Produce VS10_PRODUCTION_CERT.md', type: 'Testing', priority: 'High', complexity: 'Medium', notes: 'Final certification: Live user journey test, SIVA reasoning test, Email delivery confirmation, Vertical context correctness, Full login/signup validation, Admin panel test, GO/NO-GO', tags: ['Testing', 'Core'] },
  ];

  console.log(`\nCreating ${features.length} features...`);
  let created = 0;
  for (const f of features) {
    await createFeature(f.name, nextNum, f.type, f.priority, f.complexity, f.notes, f.tags, 'SaaS Frontend');
    created++;
    const shortName = f.name.length > 50 ? f.name.substring(0, 47) + '...' : f.name;
    console.log(`  [${created}/${features.length}] ${shortName}`);
  }

  console.log('\n========================================');
  console.log('VS10 NOTION CREATION COMPLETE');
  console.log('========================================');
  console.log(`Sprint: S${nextNum}: VS10 - LIVE SYSTEM WIRING`);
  console.log(`Features: ${features.length} created`);
  console.log('Repo: SaaS Frontend');
  console.log('\nView in Notion:');
  console.log('Sprints: https://www.notion.so/5c32e26d641a4711a9fb619703943fb9');
  console.log('Features: https://www.notion.so/26ae5afe4b5f4d97b4025c459f188944');
}

main().catch(console.error);
