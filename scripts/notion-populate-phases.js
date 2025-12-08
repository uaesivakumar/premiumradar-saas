#!/usr/bin/env node
/**
 * Notion Population Script - All 5 Phases (S133-S217)
 * Creates 85 sprints and their features in Notion
 */

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const SPRINTS_DB = '5c32e26d-641a-4711-a9fb-619703943fb9';
const FEATURES_DB = '26ae5afe-4b5f-4d97-b402-5c459f188944';

// ============================================================================
// PHASE DATA - All 85 Sprints
// ============================================================================

const ALL_PHASES = [
  // ============================================================================
  // PHASE 1: LAUNCH READY (S133-S152) - 20 sprints
  // ============================================================================
  {
    phase: 1,
    name: 'Launch Ready',
    goal: 'Ship MVP to first paying customers',
    targetARR: '$100K',
    sprints: [
      { id: 'S133', focus: 'Stealth Mode Polish', repo: 'SaaS Frontend', deliverables: 'Landing page, waitlist, private beta invite system', features: ['Landing page hero section', 'Waitlist signup form', 'Private beta invite codes', 'Early access email templates', 'Stealth mode toggle'] },
      { id: 'S134', focus: 'User Onboarding v1', repo: 'SaaS Frontend', deliverables: 'Sign up, company setup, vertical selection', features: ['User registration flow', 'Company profile setup', 'Vertical selection UI', 'Sub-vertical picker', 'Region configuration'] },
      { id: 'S135', focus: 'User Journey', repo: 'SaaS Frontend', deliverables: 'First-time experience, guided setup, tooltips', features: ['Onboarding wizard', 'Interactive tooltips', 'Progress indicators', 'Skip/resume onboarding', 'First SIVA conversation prompt'] },
      { id: 'S136', focus: 'Dashboard v2', repo: 'SaaS Frontend', deliverables: 'Core dashboard improvements, widgets, layout', features: ['Dashboard layout redesign', 'Customizable widgets', 'Quick actions panel', 'Recent activity feed', 'Performance metrics cards'] },
      { id: 'S137', focus: 'SIVA Chat Enhancement', repo: 'SaaS Frontend', deliverables: 'Chat interface, history, context persistence', features: ['Chat UI improvements', 'Conversation history', 'Context persistence', 'Message search', 'Chat export'] },
      { id: 'S138', focus: 'Signal Display', repo: 'SaaS Frontend', deliverables: 'Signal cards, filtering, signal details view', features: ['Signal card component', 'Signal filtering system', 'Signal detail modal', 'Signal timeline view', 'Signal strength indicators'] },
      { id: 'S139', focus: 'Company Profiles', repo: 'SaaS Frontend', deliverables: 'Company view, signal history, contact cards', features: ['Company profile page', 'Signal history timeline', 'Contact cards', 'Company scoring display', 'Related companies'] },
      { id: 'S140', focus: 'Scoring UI', repo: 'SaaS Frontend', deliverables: 'QTLE visualization, score breakdown charts', features: ['QTLE score visualization', 'Score breakdown charts', 'Scoring factors display', 'Historical score trends', 'Score comparison view'] },
      { id: 'S141', focus: 'Auth & Security', repo: 'SaaS Frontend', deliverables: 'Auth0 hardening, RBAC basics, session management', features: ['Auth0 integration hardening', 'Role-based access control', 'Session management', 'Password policies', 'MFA setup'] },
      { id: 'S142', focus: 'Billing Integration', repo: 'SaaS Frontend', deliverables: 'Stripe integration, subscription management, invoices', features: ['Stripe checkout integration', 'Subscription plans UI', 'Invoice history', 'Payment method management', 'Usage-based billing display'] },
      { id: 'S143', focus: 'SIVA Tools v1', repo: 'OS', deliverables: 'Score, search, prioritize tools implementation', features: ['score_company tool', 'search_companies tool', 'prioritize_leads tool', 'get_company_intel tool', 'Tool orchestration layer'] },
      { id: 'S144', focus: 'Banking Intelligence', repo: 'OS', deliverables: 'Banking-specific scoring, EB persona enhancement', features: ['Banking scoring weights', 'EB persona refinement', 'Banking signal boosters', 'Salary segment detection', 'Banking objection patterns'] },
      { id: 'S145', focus: 'Signal Pipeline v2', repo: 'OS', deliverables: 'Signal processing improvements, deduplication', features: ['Signal deduplication', 'Signal enrichment pipeline', 'Signal freshness scoring', 'Batch signal processing', 'Signal source validation'] },
      { id: 'S146', focus: 'API Hardening', repo: 'OS', deliverables: 'Rate limiting, error handling, API documentation', features: ['Rate limiting implementation', 'Error handling standardization', 'API documentation generation', 'Request validation', 'Response caching'] },
      { id: 'S147', focus: 'Super Admin Core', repo: 'Super Admin', deliverables: 'Vertical config editor, pack management', features: ['Vertical config editor', 'Intelligence pack manager', 'Signal type configuration', 'Scoring weight editor', 'Config version control'] },
      { id: 'S148', focus: 'Super Admin Personas', repo: 'Super Admin', deliverables: 'Persona management, persona editor UI', features: ['Persona list view', 'Persona editor UI', 'Persona preview', 'Persona versioning', 'Persona activation toggle'] },
      { id: 'S149', focus: 'Tenant Admin MVP', repo: 'SaaS Frontend', deliverables: 'Basic tenant management, user management', features: ['Tenant dashboard', 'User management', 'Team creation', 'Invite users', 'Usage statistics'] },
      { id: 'S150', focus: 'E2E Testing', repo: 'SaaS Frontend', deliverables: 'Comprehensive test coverage, Playwright tests', features: ['Playwright test setup', 'Auth flow tests', 'Dashboard tests', 'SIVA chat tests', 'Critical path coverage'] },
      { id: 'S151', focus: 'Performance', repo: 'OS', deliverables: 'Load testing, optimization, caching strategy', features: ['Load testing setup', 'Database query optimization', 'API response caching', 'Memory optimization', 'Latency monitoring'] },
      { id: 'S152', focus: 'Launch Prep', repo: 'SaaS Frontend', deliverables: 'Documentation, support setup, launch checklist', features: ['User documentation', 'Support ticket system', 'FAQ pages', 'Launch checklist', 'Monitoring dashboards'] },
    ]
  },
  // ============================================================================
  // PHASE 2: INTELLIGENCE ENGINE (S153-S167) - 15 sprints
  // ============================================================================
  {
    phase: 2,
    name: 'Intelligence Engine',
    goal: 'SIVA becomes indispensable',
    targetARR: '$500K',
    sprints: [
      { id: 'S153', focus: 'SIVA Proactive Alerts', repo: 'OS', deliverables: 'Daily briefings, signal alerts, notifications', features: ['Daily briefing generation', 'Signal alert system', 'Push notification service', 'Alert preferences', 'Briefing scheduling'] },
      { id: 'S154', focus: 'Knowledge Graph v1', repo: 'OS', deliverables: 'Company-people-signal relationships, Neo4j queries', features: ['Neo4j schema design', 'Company-person relationships', 'Signal-entity linking', 'Graph traversal APIs', 'Relationship strength scoring'] },
      { id: 'S155', focus: 'Citation System', repo: 'OS', deliverables: '"Based on..." with sources, evidence linking', features: ['Citation extraction', 'Source attribution', 'Evidence linking', 'Citation display API', 'Source credibility scoring'] },
      { id: 'S156', focus: 'SIVA Memory', repo: 'OS', deliverables: 'Conversation history, user preferences, context recall', features: ['Conversation storage', 'Preference learning', 'Context window management', 'Memory retrieval', 'Privacy-safe memory'] },
      { id: 'S157', focus: 'Multi-Source Intel', repo: 'OS', deliverables: 'LinkedIn, news, company data fusion', features: ['LinkedIn data integration', 'News aggregation', 'Data fusion engine', 'Source reconciliation', 'Confidence scoring'] },
      { id: 'S158', focus: 'Pattern Detection', repo: 'OS', deliverables: 'Trend analysis, opportunity patterns, anomaly detection', features: ['Trend detection algorithms', 'Opportunity pattern matching', 'Anomaly detection', 'Pattern visualization API', 'Historical pattern analysis'] },
      { id: 'S159', focus: 'SIVA Tools v2', repo: 'OS', deliverables: 'Outreach intel, objection handling tools', features: ['get_outreach_intel tool', 'objection_handler tool', 'meeting_prep tool', 'competitor_analysis tool', 'Tool chaining'] },
      { id: 'S160', focus: 'Scoring v2', repo: 'OS', deliverables: 'ML-enhanced scoring, feature engineering', features: ['ML scoring model', 'Feature engineering', 'Model training pipeline', 'A/B scoring tests', 'Score explanation'] },
      { id: 'S161', focus: 'Contact Intelligence', repo: 'OS', deliverables: 'Decision maker mapping, org chart inference', features: ['Decision maker identification', 'Org chart inference', 'Contact prioritization', 'Relationship mapping', 'Contact enrichment'] },
      { id: 'S162', focus: 'SIVA Voice Input', repo: 'SaaS Frontend', deliverables: 'Web speech recognition, voice commands', features: ['Speech recognition integration', 'Voice command parsing', 'Voice feedback', 'Noise cancellation', 'Voice history'] },
      { id: 'S163', focus: 'Dashboard Intelligence', repo: 'SaaS Frontend', deliverables: 'Smart widgets, AI recommendations on dashboard', features: ['AI-powered widgets', 'Recommendation cards', 'Smart notifications', 'Predictive insights', 'Action suggestions'] },
      { id: 'S164', focus: 'Pipeline Predictions', repo: 'OS', deliverables: 'Deal probability, timing predictions', features: ['Deal probability model', 'Close timing prediction', 'Pipeline health scoring', 'Risk factor analysis', 'Forecast generation'] },
      { id: 'S165', focus: 'Learning System', repo: 'OS', deliverables: 'User feedback integration, outcome tracking', features: ['Feedback collection', 'Outcome tracking', 'Model retraining triggers', 'Feedback-to-improvement pipeline', 'Success metric tracking'] },
      { id: 'S166', focus: 'Sub-Vertical Depth', repo: 'OS', deliverables: 'Corporate banking, SME banking personas', features: ['Corporate banking persona', 'SME banking persona', 'Sub-vertical signal tuning', 'Persona switching logic', 'Sub-vertical analytics'] },
      { id: 'S167', focus: 'Intelligence Metrics', repo: 'SaaS Frontend', deliverables: 'Usage analytics, AI performance dashboards', features: ['AI performance dashboard', 'Usage analytics', 'Query success metrics', 'Recommendation accuracy', 'Intelligence ROI tracking'] },
    ]
  },
  // ============================================================================
  // PHASE 3: ENTERPRISE READY (S168-S182) - 15 sprints
  // ============================================================================
  {
    phase: 3,
    name: 'Enterprise Ready',
    goal: 'SOC2, SIVA SDK, mobile',
    targetARR: '$3M',
    sprints: [
      { id: 'S168', focus: 'SOC2 Foundation', repo: 'OS', deliverables: 'Audit logging, access controls, compliance prep', features: ['Comprehensive audit logging', 'Access control framework', 'Data retention policies', 'Encryption at rest', 'Security event monitoring'] },
      { id: 'S169', focus: 'SOC2 Controls', repo: 'OS', deliverables: 'Security policies, monitoring, incident response', features: ['Security policy engine', 'Real-time monitoring', 'Incident response automation', 'Vulnerability scanning', 'Penetration test prep'] },
      { id: 'S170', focus: 'GDPR Compliance', repo: 'OS', deliverables: 'Data subject rights, consent management', features: ['Data export API', 'Right to deletion', 'Consent management', 'Data processing records', 'Privacy dashboard'] },
      { id: 'S171', focus: 'Enterprise SSO', repo: 'SaaS Frontend', deliverables: 'SAML, OIDC, custom IdP support', features: ['SAML integration', 'OIDC support', 'Custom IdP configuration', 'SSO testing tools', 'Multi-tenant SSO'] },
      { id: 'S172', focus: 'Advanced RBAC', repo: 'SaaS Frontend', deliverables: 'Custom roles, fine-grained permissions', features: ['Custom role creation', 'Permission matrices', 'Role inheritance', 'Permission audit log', 'Role templates'] },
      { id: 'S173', focus: 'Tenant Admin v2', repo: 'SaaS Frontend', deliverables: 'Full admin capabilities, analytics, settings', features: ['Advanced user management', 'Tenant analytics', 'Billing management', 'Integration settings', 'Tenant customization'] },
      { id: 'S174', focus: 'SIVA SDK v1', repo: 'OS', deliverables: 'Public API, SDK scaffolding, developer portal', features: ['SDK core architecture', 'Authentication SDK', 'Query SDK', 'Webhook SDK', 'Developer portal'] },
      { id: 'S175', focus: 'SDK Documentation', repo: 'OS', deliverables: 'Developer docs, examples, tutorials', features: ['API documentation', 'SDK examples', 'Integration tutorials', 'Postman collection', 'SDK changelog'] },
      { id: 'S176', focus: 'Salesforce Integration', repo: 'OS', deliverables: 'Native SF connector, bi-directional sync', features: ['Salesforce OAuth', 'Contact sync', 'Opportunity sync', 'Activity logging', 'Custom field mapping'] },
      { id: 'S177', focus: 'Mobile App v1', repo: 'SaaS Frontend', deliverables: 'iOS/Android MVP, core features', features: ['React Native setup', 'Mobile authentication', 'Mobile dashboard', 'Mobile SIVA chat', 'Offline support'] },
      { id: 'S178', focus: 'Mobile SIVA', repo: 'SaaS Frontend', deliverables: 'Voice on mobile, mobile-optimized UI', features: ['Mobile voice input', 'Mobile-optimized responses', 'Quick actions', 'Mobile notifications', 'Background sync'] },
      { id: 'S179', focus: 'Push Notifications', repo: 'SaaS Frontend', deliverables: 'Real-time mobile alerts, notification preferences', features: ['Push notification service', 'Notification preferences', 'Alert categories', 'Quiet hours', 'Notification history'] },
      { id: 'S180', focus: 'Audit & Compliance UI', repo: 'Super Admin', deliverables: 'Compliance dashboards, audit reports', features: ['Compliance dashboard', 'Audit log viewer', 'Report generation', 'Compliance status tracking', 'Evidence collection'] },
      { id: 'S181', focus: 'Enterprise Onboarding', repo: 'SaaS Frontend', deliverables: 'Bulk user import, SSO setup wizard', features: ['Bulk user import', 'SSO setup wizard', 'Data migration tools', 'Enterprise welcome flow', 'Admin training mode'] },
      { id: 'S182', focus: 'Enterprise Launch', repo: 'SaaS Frontend', deliverables: 'Enterprise tier ready, enterprise features complete', features: ['Enterprise tier activation', 'SLA monitoring', 'Dedicated support channel', 'Enterprise documentation', 'Launch readiness checklist'] },
    ]
  },
  // ============================================================================
  // PHASE 4: SCALE & EXPAND (S183-S202) - 20 sprints
  // ============================================================================
  {
    phase: 4,
    name: 'Scale & Expand',
    goal: 'Multi-vertical, SLM development',
    targetARR: '$20M',
    sprints: [
      { id: 'S183', focus: 'Insurance Vertical', repo: 'Super Admin', deliverables: 'Insurance config, personas, signals', features: ['Insurance vertical config', 'Life insurance persona', 'Health insurance persona', 'Insurance signal types', 'Insurance scoring weights'] },
      { id: 'S184', focus: 'Insurance Signals', repo: 'OS', deliverables: 'Insurance-specific signal detection', features: ['Life event signals', 'Policy expiry detection', 'Family change signals', 'Income change signals', 'Insurance lead scoring'] },
      { id: 'S185', focus: 'Insurance Intelligence', repo: 'OS', deliverables: 'Insurance scoring, pattern detection', features: ['Insurance scoring model', 'Insurance patterns', 'Insurance objection handling', 'Insurance timing rules', 'Insurance success metrics'] },
      { id: 'S186', focus: 'Real Estate Vertical', repo: 'Super Admin', deliverables: 'RE config, personas, market focus', features: ['Real estate vertical config', 'Residential RE persona', 'Commercial RE persona', 'RE signal types', 'RE scoring weights'] },
      { id: 'S187', focus: 'Real Estate Signals', repo: 'OS', deliverables: 'RE-specific signal detection', features: ['Property listing signals', 'Market movement signals', 'Buyer intent signals', 'Investment signals', 'RE lead scoring'] },
      { id: 'S188', focus: 'Real Estate Intelligence', repo: 'OS', deliverables: 'RE scoring, market patterns', features: ['RE scoring model', 'Market trend analysis', 'RE objection handling', 'RE timing optimization', 'RE success metrics'] },
      { id: 'S189', focus: 'SLM Data Collection', repo: 'OS', deliverables: 'Sales conversation corpus, data pipeline', features: ['Conversation collection pipeline', 'Data anonymization', 'Corpus quality scoring', 'Data labeling system', 'Consent management'] },
      { id: 'S190', focus: 'SLM Pipeline', repo: 'OS', deliverables: 'Fine-tuning infrastructure, training setup', features: ['Training infrastructure', 'Model versioning', 'Experiment tracking', 'Evaluation pipeline', 'Model registry'] },
      { id: 'S191', focus: 'SLM v1 Training', repo: 'OS', deliverables: 'First fine-tuned model, benchmarking', features: ['Base model selection', 'Fine-tuning execution', 'Benchmark suite', 'Quality evaluation', 'Model comparison'] },
      { id: 'S192', focus: 'SLM Integration', repo: 'OS', deliverables: 'Replace base model calls, A/B testing', features: ['SLM routing logic', 'A/B test framework', 'Fallback handling', 'Performance monitoring', 'Cost tracking'] },
      { id: 'S193', focus: 'SLM Evaluation', repo: 'OS', deliverables: 'Benchmarks, quality metrics, continuous eval', features: ['Automated benchmarks', 'Quality metrics dashboard', 'Regression detection', 'Human evaluation pipeline', 'Continuous monitoring'] },
      { id: 'S194', focus: 'SIVA SDK v2', repo: 'OS', deliverables: 'Enhanced APIs, webhooks, streaming', features: ['Streaming API', 'Webhook system', 'SDK analytics', 'Rate limit management', 'SDK versioning'] },
      { id: 'S195', focus: 'HubSpot Integration', repo: 'OS', deliverables: 'Native HubSpot connector', features: ['HubSpot OAuth', 'Contact sync', 'Deal sync', 'Activity sync', 'Custom property mapping'] },
      { id: 'S196', focus: 'Pipedrive Integration', repo: 'OS', deliverables: 'Native Pipedrive connector', features: ['Pipedrive OAuth', 'Person sync', 'Deal pipeline sync', 'Activity logging', 'Field mapping'] },
      { id: 'S197', focus: 'White-Label v1', repo: 'SaaS Frontend', deliverables: 'Rebrandable SIVA, custom theming', features: ['Theme customization', 'Logo/branding upload', 'Custom domain support', 'White-label email templates', 'Partner portal'] },
      { id: 'S198', focus: 'Marketplace', repo: 'SaaS Frontend', deliverables: 'Integration marketplace, app directory', features: ['Marketplace UI', 'Integration catalog', 'One-click install', 'Integration reviews', 'Developer submissions'] },
      { id: 'S199', focus: 'International v1', repo: 'OS', deliverables: 'Multi-currency, localization foundation', features: ['Multi-currency support', 'Localization framework', 'Timezone handling', 'Regional formatting', 'Translation system'] },
      { id: 'S200', focus: 'UAE Expansion', repo: 'OS', deliverables: 'UAE-specific features, local compliance', features: ['UAE regulatory compliance', 'Arabic language support', 'UAE calendar integration', 'Local data residency', 'UAE market signals'] },
      { id: 'S201', focus: 'India Market', repo: 'OS', deliverables: 'India-specific features, local signals', features: ['India regulatory compliance', 'INR currency support', 'India market signals', 'Regional personas', 'India data residency'] },
      { id: 'S202', focus: 'Scale Metrics', repo: 'Super Admin', deliverables: 'Growth analytics, scale monitoring', features: ['Growth dashboard', 'Scale metrics', 'Cost per query tracking', 'Regional performance', 'Vertical performance'] },
    ]
  },
  // ============================================================================
  // PHASE 5: DOMINANCE (S203-S217) - 15 sprints
  // ============================================================================
  {
    phase: 5,
    name: 'Dominance',
    goal: 'Platform play, $100M+ ARR',
    targetARR: '$100M+',
    sprints: [
      { id: 'S203', focus: 'Recruitment Vertical', repo: 'Super Admin', deliverables: 'Recruitment config, personas', features: ['Recruitment vertical config', 'Tech recruiter persona', 'Executive search persona', 'Candidate signals', 'Recruitment scoring'] },
      { id: 'S204', focus: 'SaaS Sales Vertical', repo: 'Super Admin', deliverables: 'B2B SaaS sales config', features: ['SaaS sales vertical config', 'SDR persona', 'AE persona', 'SaaS signals', 'SaaS scoring weights'] },
      { id: 'S205', focus: 'SIVA Voice Device', repo: 'OS', deliverables: 'Dedicated hardware design, firmware', features: ['Hardware specification', 'Firmware architecture', 'Device authentication', 'OTA updates', 'Device management portal'] },
      { id: 'S206', focus: 'Wake Word System', repo: 'OS', deliverables: '"Hey SIVA" detection, always-on listening', features: ['Wake word model', 'Low-power listening', 'False positive filtering', 'Multi-language wake words', 'Privacy mode'] },
      { id: 'S207', focus: 'SLM v2', repo: 'OS', deliverables: 'Advanced fine-tuning, multi-vertical support', features: ['Multi-vertical SLM', 'Advanced fine-tuning', 'Distillation pipeline', 'On-device variants', 'Model optimization'] },
      { id: 'S208', focus: 'Open Source SLM', repo: 'OS', deliverables: 'Community release, model hub', features: ['Open source packaging', 'Model hub integration', 'Community documentation', 'Contribution guidelines', 'License management'] },
      { id: 'S209', focus: 'Developer Ecosystem', repo: 'SaaS Frontend', deliverables: 'Partner program, developer community', features: ['Partner program portal', 'Developer community', 'API playground', 'Integration templates', 'Developer certification'] },
      { id: 'S210', focus: 'SIVA Marketplace', repo: 'SaaS Frontend', deliverables: 'Skills, plugins, integration marketplace', features: ['Plugin system', 'Skill marketplace', 'Revenue sharing', 'Plugin analytics', 'Quality certification'] },
      { id: 'S211', focus: 'Multi-Language', repo: 'OS', deliverables: '10+ language support, translation', features: ['Language detection', 'Real-time translation', 'Language-specific personas', 'Cultural adaptation', 'Language analytics'] },
      { id: 'S212', focus: 'Global Regions', repo: 'OS', deliverables: 'EU, APAC data centers, global infrastructure', features: ['EU data center', 'APAC data center', 'Regional routing', 'Data sovereignty', 'Global CDN'] },
      { id: 'S213', focus: 'Enterprise Scale', repo: 'OS', deliverables: '10K+ seat deployments, scale testing', features: ['Large tenant optimization', 'Bulk operations', 'Enterprise SLA', 'Dedicated infrastructure', 'Priority support'] },
      { id: 'S214', focus: 'Platform Analytics', repo: 'Super Admin', deliverables: 'Ecosystem metrics, platform health', features: ['Ecosystem dashboard', 'Partner analytics', 'Platform health metrics', 'Revenue analytics', 'Growth projections'] },
      { id: 'S215', focus: 'Strategic Partnerships', repo: 'Super Admin', deliverables: 'Major CRM partnerships, integrations', features: ['Partnership portal', 'Co-marketing tools', 'Joint customer success', 'Partner API access', 'Revenue tracking'] },
      { id: 'S216', focus: 'IPO Readiness', repo: 'Super Admin', deliverables: 'Financial systems, audit readiness', features: ['Financial reporting', 'Audit trail system', 'Compliance documentation', 'Board reporting', 'Investor portal'] },
      { id: 'S217', focus: 'Market Leadership', repo: 'Super Admin', deliverables: 'Category definition, thought leadership', features: ['Category analytics', 'Market share tracking', 'Competitive intelligence', 'Thought leadership tools', 'Industry benchmarks'] },
    ]
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function createSprint(sprintData, phaseInfo) {
  const sprintNum = parseInt(sprintData.id.replace('S', ''));

  return await notion.pages.create({
    parent: { database_id: SPRINTS_DB },
    properties: {
      'Sprint': { title: [{ text: { content: `${sprintData.id}: ${sprintData.focus}` } }] },
      'Status': { select: { name: 'Backlog' } },
      'Repo': { select: { name: sprintData.repo } },
      'Goal': { rich_text: [{ text: { content: sprintData.deliverables } }] },
      'Sprint Notes': { rich_text: [{ text: { content: `Phase ${phaseInfo.phase}: ${phaseInfo.name} | Target: ${phaseInfo.targetARR}` } }] },
      'Outcomes': { rich_text: [{ text: { content: sprintData.deliverables } }] },
      'Highlights': { rich_text: [{ text: { content: sprintData.features.join(', ') } }] },
      'Business Value': { rich_text: [{ text: { content: `${phaseInfo.goal} - ${sprintData.focus}` } }] },
      'Branch': { rich_text: [{ text: { content: `feat/sprint-s${sprintNum}` } }] },
      'Phases Updated': { multi_select: [{ name: 'Backlog' }] },
    },
  });
}

async function createFeature(featureName, sprintNum, repo, phaseInfo) {
  // Determine feature type and tags based on name
  let type = 'Feature';
  let priority = 'Medium';
  let complexity = 'Medium';
  let tags = [];

  if (featureName.toLowerCase().includes('test') || featureName.toLowerCase().includes('e2e')) {
    type = 'Testing';
    tags.push('Testing');
  } else if (featureName.toLowerCase().includes('api') || featureName.toLowerCase().includes('endpoint')) {
    type = 'Infrastructure';
    tags.push('API');
  } else if (featureName.toLowerCase().includes('ui') || featureName.toLowerCase().includes('dashboard') || featureName.toLowerCase().includes('page') || featureName.toLowerCase().includes('component')) {
    tags.push('UI', 'Frontend');
  } else if (featureName.toLowerCase().includes('model') || featureName.toLowerCase().includes('scoring') || featureName.toLowerCase().includes('ml')) {
    tags.push('AI');
  } else if (featureName.toLowerCase().includes('database') || featureName.toLowerCase().includes('schema')) {
    tags.push('Database');
  }

  if (featureName.toLowerCase().includes('security') || featureName.toLowerCase().includes('auth') || featureName.toLowerCase().includes('soc2')) {
    tags.push('Security');
  }

  if (repo === 'OS') {
    tags.push('Backend');
  } else if (repo === 'SaaS Frontend') {
    tags.push('Frontend');
  } else if (repo === 'Super Admin') {
    tags.push('Admin');
  }

  // Core features are high priority
  if (featureName.toLowerCase().includes('core') || featureName.toLowerCase().includes('main') || phaseInfo.phase === 1) {
    priority = 'High';
  }

  // Ensure at least one tag
  if (tags.length === 0) {
    tags.push('Core');
  }

  // Limit to valid tags
  const validTags = ['UI', 'AI', 'API', 'Database', 'Security', 'Frontend', 'Backend', 'Core'];
  tags = tags.filter(t => validTags.includes(t));
  if (tags.length === 0) tags.push('Core');

  return await notion.pages.create({
    parent: { database_id: FEATURES_DB },
    properties: {
      'Features': { title: [{ text: { content: featureName } }] },
      'Sprint': { number: sprintNum },
      'Status': { select: { name: 'Backlog' } },
      'Repo': { select: { name: repo } },
      'Priority': { select: { name: priority } },
      'Complexity': { select: { name: complexity } },
      'Type': { select: { name: type } },
      'Notes': { rich_text: [{ text: { content: `Phase ${phaseInfo.phase}: ${phaseInfo.name}` } }] },
      'Tags': { multi_select: tags.slice(0, 3).map(t => ({ name: t })) },
      'Assignee': { rich_text: [{ text: { content: 'Claude (TC)' } }] },
      'Done?': { checkbox: false },
    },
  });
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🚀 Starting Notion Population - All 5 Phases (S133-S217)\n');

  let totalSprints = 0;
  let totalFeatures = 0;
  const results = [];

  for (const phase of ALL_PHASES) {
    console.log(`\n📦 PHASE ${phase.phase}: ${phase.name.toUpperCase()}`);
    console.log(`   Goal: ${phase.goal}`);
    console.log(`   Target ARR: ${phase.targetARR}`);
    console.log(`   Sprints: ${phase.sprints.length}\n`);

    for (const sprint of phase.sprints) {
      try {
        // Create sprint
        const sprintResult = await createSprint(sprint, phase);
        totalSprints++;
        console.log(`   ✅ ${sprint.id}: ${sprint.focus} (${sprint.repo})`);

        // Create features for this sprint
        const sprintNum = parseInt(sprint.id.replace('S', ''));
        let sprintFeatures = 0;

        for (const featureName of sprint.features) {
          try {
            await createFeature(featureName, sprintNum, sprint.repo, phase);
            sprintFeatures++;
            totalFeatures++;
          } catch (err) {
            console.error(`      ❌ Feature failed: ${featureName} - ${err.message}`);
          }
        }

        console.log(`      └─ ${sprintFeatures} features created`);

        results.push({
          phase: phase.phase,
          sprint: sprint.id,
          focus: sprint.focus,
          repo: sprint.repo,
          features: sprintFeatures
        });

        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200));

      } catch (err) {
        console.error(`   ❌ Sprint failed: ${sprint.id} - ${err.message}`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 POPULATION COMPLETE');
  console.log('='.repeat(60));
  console.log(`\n   Total Sprints Created: ${totalSprints}`);
  console.log(`   Total Features Created: ${totalFeatures}`);

  console.log('\n   Phase Breakdown:');
  for (const phase of ALL_PHASES) {
    const phaseResults = results.filter(r => r.phase === phase.phase);
    const phaseFeatures = phaseResults.reduce((sum, r) => sum + r.features, 0);
    console.log(`   P${phase.phase} ${phase.name}: ${phaseResults.length} sprints, ${phaseFeatures} features`);
  }

  console.log('\n   Repo Distribution:');
  const repoGroups = {};
  for (const r of results) {
    repoGroups[r.repo] = (repoGroups[r.repo] || 0) + 1;
  }
  for (const [repo, count] of Object.entries(repoGroups)) {
    console.log(`   ${repo}: ${count} sprints`);
  }

  console.log('\n📋 View in Notion:');
  console.log('   Sprints: https://www.notion.so/5c32e26d641a4711a9fb619703943fb9');
  console.log('   Features: https://www.notion.so/26ae5afe4b5f4d97b4025c459f188944');
}

main().catch(console.error);
