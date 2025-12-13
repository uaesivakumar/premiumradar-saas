import { Client } from '@notionhq/client';

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const SPRINTS_DB = '5c32e26d-641a-4711-a9fb-619703943fb9';
const FEATURES_DB = '26ae5afe-4b5f-4d97-b402-5c459f188944';

const notion = new Client({ auth: NOTION_TOKEN });

// VS Sprint definitions based on Gemini's approved plan
const VS_SPRINTS = [
  {
    id: 'VS1',
    name: 'OS Security Wall',
    goal: 'Lock OS API behind authentication. All /api/os/* routes require x-pr-os-token. SaaS never trusts client-sent tenant_id. Direct curl to OS without token returns 401.',
    repo: 'OS',
    week: 1,
    days: '1-3',
    businessValue: 'Zero IDOR vulnerabilities. Foundation for multi-tenant security.',
    features: [
      { name: 'OS Authentication Middleware', type: 'Infrastructure', priority: 'High', complexity: 'High', tags: ['Security', 'Backend', 'API'], notes: 'Create /middleware/auth.js - validate x-pr-os-token on all /api/os/* routes' },
      { name: 'SaaS→OS Proxy Hardening', type: 'Infrastructure', priority: 'High', complexity: 'Medium', tags: ['Security', 'Backend', 'API'], notes: 'SaaS injects tenant_id from session, never trusts client-sent values' },
      { name: 'Audit Logging for OS Calls', type: 'Infrastructure', priority: 'High', complexity: 'Medium', tags: ['Security', 'Backend'], notes: 'Log all OS API calls with tenant_id, user_id, timestamp, action' },
      { name: 'Security Test Suite for OS', type: 'Testing', priority: 'High', complexity: 'Medium', tags: ['Security', 'Testing'], notes: 'curl tests: 401 without token, 403 with wrong token, 200 with valid token' },
    ]
  },
  {
    id: 'VS2',
    name: 'SIVA AI Upgrade',
    goal: 'SIVA uses LLM for reasoning. QTLE explanations are AI-powered (not templates). Outreach messages are persona-specific (EB-UAE).',
    repo: 'OS',
    week: 2,
    days: '6-8',
    businessValue: 'True AI capability - not templates. Foundation for intelligent sales assistance.',
    features: [
      { name: 'LLM Integration for SIVA Reasoning', type: 'Feature', priority: 'High', complexity: 'High', tags: ['AI', 'Backend', 'Core'], notes: 'Integrate Gemini/Claude for SIVA reasoning, replace hardcoded templates' },
      { name: 'AI-Powered QTLE Explanations', type: 'Feature', priority: 'High', complexity: 'High', tags: ['AI', 'Backend'], notes: 'Generate contextual QTLE explanations using LLM, not static templates' },
      { name: 'Persona-Specific Outreach Generation', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['AI', 'Backend'], notes: 'Load persona from sub_vertical, generate EB-UAE specific outreach' },
      { name: 'SIVA Response Quality Validation', type: 'Testing', priority: 'Medium', complexity: 'Medium', tags: ['AI', 'Testing'], notes: 'Validate SIVA responses contain LLM-generated reasoning, not templates' },
    ]
  },
  {
    id: 'VS3',
    name: 'Prompt Injection Defense',
    goal: 'Prompt injection attempts fail gracefully. Input sanitization on all user-provided text to LLM.',
    repo: 'OS',
    week: 2,
    days: '9-10',
    businessValue: 'AI Safety - protect against prompt injection attacks.',
    features: [
      { name: 'Input Sanitization Layer', type: 'Infrastructure', priority: 'High', complexity: 'High', tags: ['Security', 'AI', 'Backend'], notes: 'Sanitize all user input before sending to LLM, detect injection patterns' },
      { name: 'Prompt Injection Test Suite', type: 'Testing', priority: 'High', complexity: 'Medium', tags: ['Security', 'AI', 'Testing'], notes: 'Test common injection patterns: ignore instructions, jailbreaks, etc.' },
      { name: 'Graceful Failure Handling', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['Security', 'AI'], notes: 'Return safe fallback responses when injection detected' },
    ]
  },
  {
    id: 'VS4',
    name: 'SalesContext Enforcement',
    goal: 'All SIVA calls enforce vertical/sub_vertical/region. Banking/EB/UAE filtering verified.',
    repo: 'OS',
    week: 2,
    days: '11-12',
    businessValue: 'Data integrity - salespeople only see their territory data.',
    features: [
      { name: 'SalesContext Validation Middleware', type: 'Infrastructure', priority: 'High', complexity: 'Medium', tags: ['Backend', 'API', 'Core'], notes: 'Validate vertical/sub_vertical/region on every SIVA call' },
      { name: 'Persona Loading from Sub-Vertical', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Backend', 'Core'], notes: 'PersonaService.get(sub_vertical_id) loads correct persona dynamically' },
      { name: 'Context Enforcement Tests', type: 'Testing', priority: 'High', complexity: 'Medium', tags: ['Testing', 'Backend'], notes: 'Verify Banking/EB/UAE filtering, reject invalid contexts' },
    ]
  },
  {
    id: 'VS5',
    name: 'PostgreSQL RLS',
    goal: 'Database-level tenant isolation. SET app.tenant_id RLS tests pass. Cross-tenant data access returns empty.',
    repo: 'OS',
    week: 1,
    days: '4-5',
    businessValue: 'Multi-tenancy at database level - impossible to leak data between tenants.',
    features: [
      { name: 'RLS Policy Implementation', type: 'Infrastructure', priority: 'High', complexity: 'High', tags: ['Database', 'Security'], notes: 'CREATE POLICY for all tenant-scoped tables using app.tenant_id' },
      { name: 'Tenant Context Injection', type: 'Infrastructure', priority: 'High', complexity: 'Medium', tags: ['Database', 'Backend'], notes: 'SET app.tenant_id on every DB connection from authenticated session' },
      { name: 'RLS Migration Script', type: 'Infrastructure', priority: 'High', complexity: 'Medium', tags: ['Database'], notes: 'Migration to add RLS to existing tables, backup first!' },
      { name: 'Cross-Tenant Isolation Tests', type: 'Testing', priority: 'High', complexity: 'Medium', tags: ['Testing', 'Database', 'Security'], notes: 'SET tenant_id = A, query, SET tenant_id = B, verify isolation' },
    ]
  },
  {
    id: 'VS6',
    name: 'Circuit Breakers & Fallbacks',
    goal: 'Circuit breaker operational. Simulate OS failure, verify fallback. Graceful degradation.',
    repo: 'SaaS Frontend',
    week: 3,
    days: '15-17',
    businessValue: 'Resilience - system continues working even when components fail.',
    features: [
      { name: 'Circuit Breaker Implementation', type: 'Infrastructure', priority: 'High', complexity: 'High', tags: ['Backend', 'Core'], notes: 'Implement circuit breaker pattern for OS calls (open/half-open/closed)' },
      { name: 'Fallback Response System', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Backend', 'Core'], notes: 'Return cached/fallback data when circuit is open' },
      { name: 'Health Check Endpoints', type: 'Infrastructure', priority: 'Medium', complexity: 'Low', tags: ['Backend', 'API'], notes: '/health endpoint for circuit breaker monitoring' },
      { name: 'Chaos Testing for Resilience', type: 'Testing', priority: 'Medium', complexity: 'Medium', tags: ['Testing'], notes: 'Simulate OS failure, verify circuit opens and fallback activates' },
    ]
  },
  {
    id: 'VS7',
    name: 'AI-UX Polishing',
    goal: 'Loading states, error messages, AI response formatting. Optional polish sprint.',
    repo: 'SaaS Frontend',
    week: 4,
    days: '22-23',
    businessValue: 'User experience - professional AI interactions.',
    features: [
      { name: 'AI Loading State Indicators', type: 'Feature', priority: 'Medium', complexity: 'Low', tags: ['UI', 'Frontend'], notes: 'Skeleton loaders, typing indicators for AI responses' },
      { name: 'Error Message Improvements', type: 'Feature', priority: 'Medium', complexity: 'Low', tags: ['UI', 'Frontend'], notes: 'User-friendly error messages, retry buttons, fallback UI' },
      { name: 'AI Response Formatting', type: 'Feature', priority: 'Medium', complexity: 'Medium', tags: ['UI', 'Frontend', 'AI'], notes: 'Format AI responses with proper markdown, sections, highlights' },
    ]
  },
  {
    id: 'VS8',
    name: 'E2E Test Suite',
    goal: '80%+ E2E coverage. All 4 core journeys pass: Super Admin, Tenant Admin, EB RM, Individual User.',
    repo: 'SaaS Frontend',
    week: 4,
    days: '18-21',
    businessValue: 'Quality assurance - prevent regressions, enable confident deploys.',
    features: [
      { name: 'Playwright Test Setup', type: 'Infrastructure', priority: 'High', complexity: 'Medium', tags: ['Testing', 'Frontend'], notes: 'Install and configure Playwright, create test utilities' },
      { name: 'Super Admin Journey Tests', type: 'Testing', priority: 'High', complexity: 'Medium', tags: ['Testing', 'Frontend'], notes: 'Test vertical config, tenant management, persona editor' },
      { name: 'Tenant Admin Journey Tests', type: 'Testing', priority: 'High', complexity: 'Medium', tags: ['Testing', 'Frontend'], notes: 'Test user management, settings, subscription' },
      { name: 'EB RM Core Journey Tests', type: 'Testing', priority: 'High', complexity: 'High', tags: ['Testing', 'Frontend'], notes: 'Login → Discovery → Score → SIVA → Outreach complete flow' },
      { name: 'Individual User Journey Tests', type: 'Testing', priority: 'High', complexity: 'Medium', tags: ['Testing', 'Frontend'], notes: 'Test personal dashboard, lead management, settings' },
      { name: 'Coverage Report Integration', type: 'Infrastructure', priority: 'Medium', complexity: 'Low', tags: ['Testing'], notes: 'Generate and report test coverage, target 80%+' },
    ]
  },
  {
    id: 'VS9',
    name: 'API Contract Cleanup',
    goal: 'No legacy fields. Schema validation active with AJV. Clean SaaS↔OS contract.',
    repo: 'OS',
    week: 3,
    days: '13-14',
    businessValue: 'API reliability - catch contract violations before production.',
    features: [
      { name: 'AJV Schema Validation Setup', type: 'Infrastructure', priority: 'High', complexity: 'Medium', tags: ['Backend', 'API'], notes: 'Install AJV, create JSON schemas for all API contracts' },
      { name: 'Request/Response Validation Middleware', type: 'Infrastructure', priority: 'High', complexity: 'Medium', tags: ['Backend', 'API'], notes: 'Validate all incoming requests and outgoing responses against schemas' },
      { name: 'Legacy Field Removal', type: 'Feature', priority: 'High', complexity: 'Medium', tags: ['Backend', 'API'], notes: 'Remove deprecated fields, update all consumers' },
      { name: 'Contract Violation Logging', type: 'Feature', priority: 'Medium', complexity: 'Low', tags: ['Backend', 'API'], notes: 'Log any contract violations for monitoring' },
    ]
  },
];

async function createSprint(vsId: string, name: string, goal: string, repo: string, businessValue: string) {
  const sprintTitle = `${vsId}: ${name}`;
  
  const page = await notion.pages.create({
    parent: { database_id: SPRINTS_DB },
    properties: {
      'Sprint': { title: [{ text: { content: sprintTitle } }] },
      'Status': { select: { name: 'Backlog' } },
      'Repo': { select: { name: repo } },
      'Goal': { rich_text: [{ text: { content: goal } }] },
      'Sprint Notes': { rich_text: [{ text: { content: `Gemini Authorization: VS1-VS9-APPROVED-20251213\n\n${goal}` } }] },
      'Outcomes': { rich_text: [{ text: { content: 'Pending implementation' } }] },
      'Highlights': { rich_text: [{ text: { content: 'Validation Sprint - Production Certification' } }] },
      'Business Value': { rich_text: [{ text: { content: businessValue } }] },
      'Branch': { rich_text: [{ text: { content: `feat/${vsId.toLowerCase()}-${name.toLowerCase().replace(/\s+/g, '-')}` } }] },
      'Phases Updated': { multi_select: [{ name: 'Backlog' }] },
    },
  } as any);
  
  console.log(`Created sprint: ${sprintTitle}`);
  return page;
}

async function createFeature(feature: any, vsId: string, repo: string) {
  const featureName = `[${vsId}] ${feature.name}`;
  
  const page = await notion.pages.create({
    parent: { database_id: FEATURES_DB },
    properties: {
      'Features': { title: [{ text: { content: featureName } }] },
      'Status': { select: { name: 'Backlog' } },
      'Repo': { select: { name: repo } },
      'Priority': { select: { name: feature.priority } },
      'Complexity': { select: { name: feature.complexity } },
      'Type': { select: { name: feature.type } },
      'Notes': { rich_text: [{ text: { content: feature.notes } }] },
      'Tags': { multi_select: feature.tags.map((t: string) => ({ name: t })) },
      'Assignee': { rich_text: [{ text: { content: 'Claude (TC)' } }] },
      'Done?': { checkbox: false },
    },
  } as any);
  
  console.log(`  Created feature: ${featureName}`);
  return page;
}

async function main() {
  console.log('=== Creating Validation Sprints (VS1-VS9) ===\n');
  console.log('Authorization: VS1-VS9-APPROVED-20251213\n');
  
  const results = {
    sprints: [] as any[],
    features: [] as any[],
  };
  
  for (const vs of VS_SPRINTS) {
    console.log(`\n--- ${vs.id}: ${vs.name} (${vs.repo}) ---`);
    
    const sprint = await createSprint(vs.id, vs.name, vs.goal, vs.repo, vs.businessValue);
    results.sprints.push({ id: vs.id, name: vs.name, repo: vs.repo, pageId: sprint.id });
    
    for (const feature of vs.features) {
      const feat = await createFeature(feature, vs.id, vs.repo);
      results.features.push({ name: feature.name, vsId: vs.id, pageId: feat.id });
    }
  }
  
  console.log('\n\n=== SUMMARY ===');
  console.log(`Sprints created: ${results.sprints.length}`);
  console.log(`Features created: ${results.features.length}`);
  
  console.log('\n--- Sprint Breakdown ---');
  for (const s of results.sprints) {
    const featureCount = results.features.filter(f => f.vsId === s.id).length;
    console.log(`${s.id}: ${s.name} (${s.repo}) - ${featureCount} features`);
  }
  
  console.log('\n--- By Repo ---');
  const byRepo: Record<string, number> = {};
  for (const s of results.sprints) {
    byRepo[s.repo] = (byRepo[s.repo] || 0) + 1;
  }
  for (const [repo, count] of Object.entries(byRepo)) {
    console.log(`${repo}: ${count} sprints`);
  }
  
  console.log('\n--- Execution Order (Per Gemini Approval) ---');
  console.log('Week 1: VS1 (Security) → VS5 (RLS)');
  console.log('Week 2: VS2 (AI) → VS3 (Injection) → VS4 (Context)');
  console.log('Week 3: VS9 (Contracts) → VS6 (Circuit Breakers)');
  console.log('Week 4: VS8 (E2E Tests) → VS7 (Polish)');
}

main().catch(console.error);
