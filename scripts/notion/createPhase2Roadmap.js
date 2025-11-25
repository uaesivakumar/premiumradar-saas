/**
 * Phase-2 Master Sprint System - 20 Sprints
 * Creates complete roadmap with all sprints and features in Notion
 */

import { Client } from '@notionhq/client';
import { readFileSync } from 'fs';

const dbIds = JSON.parse(readFileSync('./.notion-db-ids.json', 'utf-8'));
const notion = new Client({ auth: process.env.NOTION_TOKEN });

// ============================================================================
// PHASE-2 SPRINT DEFINITIONS (20 Sprints)
// ============================================================================

const PHASE2_SPRINTS = [
  // ═══════════════════════════════════════════════════════════════════════════
  // STREAM 1: FRONT-END EXPERIENCE (Sprints 1-4)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    number: 1,
    name: 'Sprint 1: AI-First Landing Experience',
    stream: 'Stream 1: Front-End Experience',
    goal: 'Create AI Orb interaction with industry detection and vertical morphing',
    businessValue: 'First impression that converts visitors - AI-first differentiation from competitors',
    priority: 'Critical',
    dependencies: 'Security Sprints S1-S6 (completed)',
    features: [
      { name: 'AI Orb Interaction Model', complexity: 'High', type: 'Feature', notes: 'Central AI interface with ambient animations and interaction states' },
      { name: 'Industry Classifier', complexity: 'High', type: 'Feature', notes: 'LLM + heuristics to detect visitor industry from behavior/input' },
      { name: 'Vertical Morphing Engine', complexity: 'Very High', type: 'Feature', notes: 'Dynamic UI transformation based on detected industry' },
      { name: 'No-Login Flow', complexity: 'Medium', type: 'Feature', notes: 'Allow AI interaction without authentication for conversion' },
      { name: 'Micro-Background Intelligence Loader', complexity: 'Medium', type: 'Infrastructure', notes: 'Preload AI models and data while user interacts' },
      { name: 'Accessibility Base Layer', complexity: 'Medium', type: 'Feature', notes: 'WCAG 2.1 AA compliance foundation' },
      { name: 'English/Arabic Toggle', complexity: 'Medium', type: 'Feature', notes: 'RTL support with language switching' },
      { name: 'Mobile/Tablet Responsive Layouts', complexity: 'High', type: 'Feature', notes: 'Responsive design for all breakpoints' },
    ],
  },
  {
    number: 2,
    name: 'Sprint 2: Micro-Demo + Instant AI Interaction',
    stream: 'Stream 1: Front-End Experience',
    goal: 'Create 30-second micro-demo with guided user journey S0→S1→S2',
    businessValue: 'Immediate value demonstration - reduces time-to-aha moment',
    priority: 'Critical',
    dependencies: 'Sprint 1',
    features: [
      { name: '30-Second Micro-Demo', complexity: 'High', type: 'Feature', notes: 'Guided product demonstration with real AI capabilities' },
      { name: 'Multi-Step User Guidance (S0→S1→S2)', complexity: 'High', type: 'Feature', notes: 'Progressive disclosure from visitor to engaged user' },
      { name: 'Demo → Workspace Drawer Transition', complexity: 'Medium', type: 'Feature', notes: 'Smooth animation from demo to workspace' },
      { name: 'AI Chat Surface (Limited Mode)', complexity: 'High', type: 'Feature', notes: 'Restricted AI chat for unauthenticated users' },
      { name: 'Lead Generation Funnel Triggers', complexity: 'Medium', type: 'Feature', notes: 'Capture intent signals for conversion' },
      { name: 'Pre-Pipeline → Pipeline Preview Animation', complexity: 'Medium', type: 'Feature', notes: 'Visual progression to full pipeline view' },
    ],
  },
  {
    number: 3,
    name: 'Sprint 3: SaaS Shell + Authentication UI',
    stream: 'Stream 1: Front-End Experience',
    goal: 'Implement complete authentication flow with multi-tenant awareness',
    businessValue: 'Secure user onboarding with frictionless authentication options',
    priority: 'Critical',
    dependencies: 'Sprint 2',
    features: [
      { name: 'Login Page', complexity: 'Medium', type: 'Feature', notes: 'Email/password login with social options' },
      { name: 'Signup Page', complexity: 'Medium', type: 'Feature', notes: 'Registration flow with validation' },
      { name: 'Magic Links / Passwordless Auth', complexity: 'High', type: 'Feature', notes: 'Email-based passwordless authentication' },
      { name: 'Multi-Tenant Aware Login', complexity: 'High', type: 'Feature', notes: 'Route users to correct tenant workspace' },
      { name: 'Setup Wizard Container', complexity: 'Medium', type: 'Feature', notes: 'First-time user configuration wizard' },
      { name: 'Theme + Brand System', complexity: 'Medium', type: 'Infrastructure', notes: 'Customizable theming for white-label support' },
      { name: 'Verified Email Flow', complexity: 'Medium', type: 'Feature', notes: 'Email verification with resend capability' },
      { name: 'First Session Onboarding', complexity: 'High', type: 'Feature', notes: 'Guided first-run experience' },
    ],
  },
  {
    number: 4,
    name: 'Sprint 4: Dashboard Home + Workspace Drawer',
    stream: 'Stream 1: Front-End Experience',
    goal: 'Build main dashboard shell with navigation and quick actions',
    businessValue: 'Central command center for user productivity',
    priority: 'High',
    dependencies: 'Sprint 3',
    features: [
      { name: 'Dashboard Shell', complexity: 'High', type: 'Feature', notes: 'Main application container with layout system' },
      { name: 'Sidebar Navigation', complexity: 'Medium', type: 'Feature', notes: 'Collapsible sidebar with module navigation' },
      { name: 'Workspace Drawer', complexity: 'High', type: 'Feature', notes: 'Slide-out panel for workspace management' },
      { name: 'Global Header', complexity: 'Medium', type: 'Feature', notes: 'Top bar with user menu and notifications' },
      { name: 'Search Bar', complexity: 'High', type: 'Feature', notes: 'Global search with AI-powered suggestions' },
      { name: 'Recent Activity Widget', complexity: 'Medium', type: 'Feature', notes: 'Timeline of recent user actions' },
      { name: 'Quick Actions (Discover/Enrich/Rank/Outreach)', complexity: 'Medium', type: 'Feature', notes: 'One-click access to core modules' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STREAM 2: BANKING VERTICAL LAUNCH (Sprints 5-7)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    number: 5,
    name: 'Sprint 5: Banking Vertical Base Framework',
    stream: 'Stream 2: Banking Vertical',
    goal: 'Implement Q/T/L/E scoring with banking-specific signals',
    businessValue: 'First vertical launch - proves vertical strategy works',
    priority: 'Critical',
    dependencies: 'Sprint 4',
    features: [
      { name: 'Q/T/L/E Scoring Loaders', complexity: 'Very High', type: 'Feature', notes: 'Quality/Timing/Likelihood/Engagement scoring engine' },
      { name: 'Banking-Specific Signals', complexity: 'High', type: 'Feature', notes: 'Industry-specific data points and indicators' },
      { name: 'UAE Boost Layer', complexity: 'Medium', type: 'Feature', notes: 'Regional weighting for UAE market' },
      { name: 'Corporate Banking Micro-Tweaks', complexity: 'Medium', type: 'Feature', notes: 'B2B banking adjustments' },
      { name: 'Banking KPI Models', complexity: 'High', type: 'Feature', notes: 'Key performance indicators for banking sector' },
      { name: 'Signal → Score Mapping', complexity: 'High', type: 'Feature', notes: 'Algorithm to convert signals to actionable scores' },
    ],
  },
  {
    number: 6,
    name: 'Sprint 6: Discovery + Scoring Viewer for Banking',
    stream: 'Stream 2: Banking Vertical',
    goal: 'Build discovery interface with banking-optimized views',
    businessValue: 'Visual proof of AI intelligence for banking users',
    priority: 'High',
    dependencies: 'Sprint 5',
    features: [
      { name: 'Discovery Viewer', complexity: 'High', type: 'Feature', notes: 'Main discovery interface with list/grid views' },
      { name: 'Company Cards', complexity: 'Medium', type: 'Feature', notes: 'Rich company preview cards with key metrics' },
      { name: 'Signal Insight View', complexity: 'High', type: 'Feature', notes: 'Detailed signal breakdown with explanations' },
      { name: 'Score Visualization', complexity: 'High', type: 'Feature', notes: 'Visual representation of Q/T/L/E scores' },
      { name: 'Ranking Integration', complexity: 'Medium', type: 'Feature', notes: 'Connect discovery to ranking module' },
      { name: 'Banking-Specific Filters', complexity: 'Medium', type: 'Feature', notes: 'Industry-specific filtering options' },
    ],
  },
  {
    number: 7,
    name: 'Sprint 7: Outreach Composer + Banking Tone Engine',
    stream: 'Stream 2: Banking Vertical',
    goal: 'Create AI-powered outreach with banking persona',
    businessValue: 'Direct revenue driver - enables sales action',
    priority: 'High',
    dependencies: 'Sprint 6',
    features: [
      { name: 'Multistep Outreach Composer', complexity: 'Very High', type: 'Feature', notes: 'Wizard-style outreach message builder' },
      { name: 'Final Email Templates', complexity: 'Medium', type: 'Feature', notes: 'Pre-built templates for banking outreach' },
      { name: 'Tone Engine (Banking Persona)', complexity: 'High', type: 'Feature', notes: 'AI tone adjustment for banking communication' },
      { name: 'Outreach Reasons', complexity: 'Medium', type: 'Feature', notes: 'AI-generated reasons for outreach timing' },
      { name: 'Multi-Channel Outreach Options', complexity: 'High', type: 'Feature', notes: 'Email, LinkedIn, phone outreach paths' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STREAM 3: MULTI-TENANT ARCHITECTURE (Sprints 8-9)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    number: 8,
    name: 'Sprint 8: Workspaces + Role System',
    stream: 'Stream 3: Multi-Tenant Architecture',
    goal: 'Implement workspace management with Owner/Admin/Analyst roles',
    businessValue: 'Enables team collaboration and enterprise sales',
    priority: 'Critical',
    dependencies: 'Sprint 4',
    features: [
      { name: 'Workspaces', complexity: 'High', type: 'Feature', notes: 'Isolated workspace containers per organization' },
      { name: 'Team Management', complexity: 'High', type: 'Feature', notes: 'Add/remove team members interface' },
      { name: 'Invitation Flow', complexity: 'Medium', type: 'Feature', notes: 'Email invites with role assignment' },
      { name: 'Role-Based Access Control', complexity: 'Very High', type: 'Feature', notes: 'Owner/Admin/Analyst permission matrix' },
      { name: 'Team Permissions UI', complexity: 'Medium', type: 'Feature', notes: 'Visual permission management interface' },
    ],
  },
  {
    number: 9,
    name: 'Sprint 9: Tenant Isolation + Rate Limiting + API Keys',
    stream: 'Stream 3: Multi-Tenant Architecture',
    goal: 'Implement secure tenant isolation with API access',
    businessValue: 'Enterprise security requirement - enables API monetization',
    priority: 'Critical',
    dependencies: 'Sprint 8',
    features: [
      { name: 'Tenant-Aware DB Queries', complexity: 'Very High', type: 'Infrastructure', notes: 'Row-level security for all queries' },
      { name: 'Isolation Policies', complexity: 'High', type: 'Infrastructure', notes: 'Data isolation enforcement at all layers' },
      { name: 'API Keys', complexity: 'High', type: 'Feature', notes: 'Generate/revoke API keys per workspace' },
      { name: 'Tenant-Level Rate Limiting', complexity: 'High', type: 'Infrastructure', notes: 'Per-tenant rate limits based on plan' },
      { name: 'Activity Boundaries', complexity: 'Medium', type: 'Infrastructure', notes: 'Audit trail isolation per tenant' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STREAM 4: STRIPE BILLING (Sprints 10-11)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    number: 10,
    name: 'Sprint 10: Subscription Tiers + Stripe Checkout',
    stream: 'Stream 4: Stripe Billing',
    goal: 'Implement Stripe subscription with tier management',
    businessValue: 'Revenue enablement - direct path to monetization',
    priority: 'Critical',
    dependencies: 'Sprint 9',
    features: [
      { name: 'Stripe Product Creation', complexity: 'Medium', type: 'Infrastructure', notes: 'Products and prices in Stripe' },
      { name: 'Tier Mapping', complexity: 'Medium', type: 'Feature', notes: 'Map Stripe products to app features' },
      { name: 'Checkout Flow', complexity: 'High', type: 'Feature', notes: 'Stripe Checkout integration' },
      { name: 'Billing Portal', complexity: 'Medium', type: 'Feature', notes: 'Self-service billing management' },
      { name: 'Subscription Status Sync', complexity: 'High', type: 'Infrastructure', notes: 'Real-time subscription state sync' },
    ],
  },
  {
    number: 11,
    name: 'Sprint 11: Metered Billing + Usage Limits + Dunning',
    stream: 'Stream 4: Stripe Billing',
    goal: 'Implement usage-based billing with dunning automation',
    businessValue: 'Maximizes revenue per user with fair usage pricing',
    priority: 'High',
    dependencies: 'Sprint 10',
    features: [
      { name: 'Seat-Based Billing', complexity: 'Medium', type: 'Feature', notes: 'Per-user pricing model' },
      { name: 'Metered Usage (Credits/Requests)', complexity: 'High', type: 'Feature', notes: 'Track and bill for API/AI usage' },
      { name: 'Webhooks (Invoice/Failed/Renewal)', complexity: 'High', type: 'Infrastructure', notes: 'Handle all Stripe webhook events' },
      { name: 'Dunning Emails', complexity: 'Medium', type: 'Feature', notes: 'Automated payment failure recovery' },
      { name: 'Billing History Viewer', complexity: 'Medium', type: 'Feature', notes: 'Invoice history and download' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STREAM 5: SUPER ADMIN CONSOLE (Sprints 12-13)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    number: 12,
    name: 'Sprint 12: Tenant Directory + User Management',
    stream: 'Stream 5: Super Admin Console',
    goal: 'Build super admin console for tenant management',
    businessValue: 'Operational efficiency - manage all customers from one place',
    priority: 'High',
    dependencies: 'Sprint 9',
    features: [
      { name: 'Tenant Table', complexity: 'Medium', type: 'Feature', notes: 'List all tenants with key metrics' },
      { name: 'All Tenants Viewer', complexity: 'High', type: 'Feature', notes: 'Searchable, filterable tenant directory' },
      { name: 'User Management (Ban/Delete/Disable)', complexity: 'High', type: 'Feature', notes: 'Admin actions on user accounts' },
      { name: 'Tenant Impersonation Mode', complexity: 'Very High', type: 'Feature', notes: 'View platform as any tenant (audit logged)' },
    ],
  },
  {
    number: 13,
    name: 'Sprint 13: Vertical Registry + Global Settings',
    stream: 'Stream 5: Super Admin Console',
    goal: 'Create vertical management and global configuration',
    businessValue: 'Enables rapid vertical expansion without code changes',
    priority: 'High',
    dependencies: 'Sprint 12',
    features: [
      { name: 'Vertical Registry', complexity: 'High', type: 'Feature', notes: 'Manage available verticals dynamically' },
      { name: 'Global Scoring Parameters', complexity: 'High', type: 'Feature', notes: 'Tune scoring algorithms globally' },
      { name: 'Global OS Settings', complexity: 'Medium', type: 'Feature', notes: 'System-wide configuration' },
      { name: 'Feature Flag Toggles', complexity: 'Medium', type: 'Feature', notes: 'Enable/disable features per tenant or globally' },
      { name: 'Version Control', complexity: 'Medium', type: 'Feature', notes: 'Track configuration changes' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STREAM 6: CORE SAAS MODULES (Sprints 14-15)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    number: 14,
    name: 'Sprint 14: Discovery + Enrichment Modules',
    stream: 'Stream 6: Core SaaS Modules',
    goal: 'Build reusable discovery and enrichment modules',
    businessValue: 'Core product value - what users pay for',
    priority: 'Critical',
    dependencies: 'Sprint 7',
    features: [
      { name: 'Discovery Module (User-Facing)', complexity: 'Very High', type: 'Feature', notes: 'Full-featured discovery interface' },
      { name: 'Enrichment Module', complexity: 'Very High', type: 'Feature', notes: 'Data enrichment with multiple sources' },
      { name: 'Company Profiles', complexity: 'High', type: 'Feature', notes: 'Detailed company information pages' },
      { name: 'Signal Viewer', complexity: 'High', type: 'Feature', notes: 'Visual signal analysis interface' },
    ],
  },
  {
    number: 15,
    name: 'Sprint 15: Ranking + Outreach Modules',
    stream: 'Stream 6: Core SaaS Modules',
    goal: 'Build reusable ranking and outreach modules',
    businessValue: 'Completes core value chain - discovery to action',
    priority: 'Critical',
    dependencies: 'Sprint 14',
    features: [
      { name: 'Ranking Module UI', complexity: 'High', type: 'Feature', notes: 'Sortable, filterable ranking interface' },
      { name: 'Ranking Explanations', complexity: 'High', type: 'Feature', notes: 'AI explanations for ranking decisions' },
      { name: 'Outreach Module UI', complexity: 'High', type: 'Feature', notes: 'Universal outreach composer' },
      { name: 'Preview + Send Workflow', complexity: 'Medium', type: 'Feature', notes: 'Review and send with tracking' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STREAM 7: TELEMETRY + ANALYTICS (Sprint 16)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    number: 16,
    name: 'Sprint 16: Telemetry + Activation Funnel',
    stream: 'Stream 7: Telemetry + Analytics',
    goal: 'Implement full telemetry with activation funnel tracking S0→S6',
    businessValue: 'Data-driven optimization - improve conversion at every step',
    priority: 'High',
    dependencies: 'Sprint 15',
    features: [
      { name: 'Funnel Analytics', complexity: 'High', type: 'Feature', notes: 'S0→S6 activation funnel tracking' },
      { name: 'Heatmaps', complexity: 'Medium', type: 'Feature', notes: 'User interaction heatmaps' },
      { name: 'AI Usage Tracking', complexity: 'High', type: 'Feature', notes: 'Track AI feature usage patterns' },
      { name: 'Token Inference Tracking', complexity: 'Medium', type: 'Infrastructure', notes: 'Monitor AI token consumption' },
      { name: 'Error Events', complexity: 'Medium', type: 'Infrastructure', notes: 'Track and alert on errors' },
      { name: 'Vertical Popularity', complexity: 'Medium', type: 'Feature', notes: 'Which verticals get most usage' },
      { name: 'Retention Metrics', complexity: 'High', type: 'Feature', notes: 'Cohort retention analysis' },
      { name: 'Mixpanel/Posthog-Style Charts', complexity: 'High', type: 'Feature', notes: 'Visual analytics dashboard' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STREAM 8: ENTERPRISE DEMO ENVIRONMENT (Sprint 17)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    number: 17,
    name: 'Sprint 17: Read-Only Demo Mode',
    stream: 'Stream 8: Enterprise Demo',
    goal: 'Create safe demo environment for enterprise sales',
    businessValue: 'Enables enterprise sales without exposing real data',
    priority: 'High',
    dependencies: 'Sprint 15',
    features: [
      { name: 'Fake Data', complexity: 'Medium', type: 'Infrastructure', notes: 'Realistic synthetic data generation' },
      { name: 'Fake Pipeline', complexity: 'Medium', type: 'Feature', notes: 'Demo pipeline with fake companies' },
      { name: 'Safe Demo Scoring', complexity: 'Medium', type: 'Feature', notes: 'Pre-computed scores for demo' },
      { name: 'Demo Discovery List', complexity: 'Medium', type: 'Feature', notes: 'Curated demo discovery results' },
      { name: 'Locked Actions', complexity: 'Medium', type: 'Feature', notes: 'Prevent data modification in demo' },
      { name: 'Book-a-Meeting CTA', complexity: 'Low', type: 'Feature', notes: 'Calendar integration for sales calls' },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STREAM 9: LAUNCH PREPARATION (Sprints 18-20)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    number: 18,
    name: 'Sprint 18: SEO, Docs, Pricing, Legal',
    stream: 'Stream 9: Launch Preparation',
    goal: 'Create all marketing and legal pages for launch',
    businessValue: 'Required for public launch - SEO and compliance',
    priority: 'High',
    dependencies: 'Sprint 16',
    features: [
      { name: 'SEO Pages', complexity: 'Medium', type: 'Feature', notes: 'Landing pages optimized for search' },
      { name: 'Documentation Pages', complexity: 'High', type: 'Documentation', notes: 'User guides and API docs' },
      { name: 'Pricing Page', complexity: 'Medium', type: 'Feature', notes: 'Clear pricing with tier comparison' },
      { name: 'Legal Pages (T&C, Privacy, Cookies)', complexity: 'Medium', type: 'Documentation', notes: 'Legal compliance pages' },
      { name: 'Schema Markup', complexity: 'Low', type: 'Infrastructure', notes: 'Structured data for SEO' },
    ],
  },
  {
    number: 19,
    name: 'Sprint 19: Marketing Pages + Tracking + Emails',
    stream: 'Stream 9: Launch Preparation',
    goal: 'Implement marketing infrastructure and email flows',
    businessValue: 'Growth engine - acquisition and retention automation',
    priority: 'High',
    dependencies: 'Sprint 18',
    features: [
      { name: 'Marketing Website Pages', complexity: 'High', type: 'Feature', notes: 'Feature pages, use cases, testimonials' },
      { name: 'Pixel Tracking', complexity: 'Medium', type: 'Infrastructure', notes: 'Google, Facebook, LinkedIn pixels' },
      { name: 'Onboarding Emails', complexity: 'Medium', type: 'Feature', notes: 'Welcome sequence automation' },
      { name: 'Product Update Emails', complexity: 'Medium', type: 'Feature', notes: 'Changelog and feature announcements' },
      { name: 'Referral Triggers', complexity: 'Medium', type: 'Feature', notes: 'Viral loop triggers' },
    ],
  },
  {
    number: 20,
    name: 'Sprint 20: Launch + Production Readiness QA',
    stream: 'Stream 9: Launch Preparation',
    goal: 'Final QA, load testing, and production deployment',
    businessValue: 'Go-live - revenue starts flowing',
    priority: 'Critical',
    dependencies: 'Sprint 19',
    features: [
      { name: 'Full UAT', complexity: 'Very High', type: 'Testing', notes: 'End-to-end user acceptance testing' },
      { name: 'Load Tests', complexity: 'High', type: 'Testing', notes: 'Performance and stress testing' },
      { name: 'Final Security Sweep', complexity: 'High', type: 'Testing', notes: 'Penetration testing and vulnerability scan' },
      { name: 'Stripe Go-Live Checklist', complexity: 'Medium', type: 'Infrastructure', notes: 'Production Stripe activation' },
      { name: 'Production Deployment', complexity: 'High', type: 'Infrastructure', notes: 'Deploy to premiumradar.com' },
      { name: 'Launch Announcement System', complexity: 'Medium', type: 'Feature', notes: 'Coordinated launch communications' },
    ],
  },
];

// ============================================================================
// CREATE SPRINTS AND FEATURES IN NOTION
// ============================================================================

async function createPhase2Roadmap() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  PHASE-2 MASTER SPRINT SYSTEM - 20 Sprints');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const today = new Date().toISOString().split('T')[0];
  let totalFeatures = 0;

  // Count total features
  for (const sprint of PHASE2_SPRINTS) {
    totalFeatures += sprint.features.length;
  }

  console.log(`Creating ${PHASE2_SPRINTS.length} sprints with ${totalFeatures} features\n`);

  // Create each sprint
  for (const sprint of PHASE2_SPRINTS) {
    console.log(`\n▶ ${sprint.name}`);
    console.log(`  Stream: ${sprint.stream}`);
    console.log(`  Features: ${sprint.features.length}`);

    try {
      // Create sprint in Notion
      const sprintResponse = await notion.pages.create({
        parent: { database_id: dbIds.sprints_db_id },
        properties: {
          'Sprint': { title: [{ text: { content: sprint.name } }] },
          'Status': { select: { name: 'Backlog' } },
          'Goal': { rich_text: [{ text: { content: sprint.goal } }] },
          'Business Value': { rich_text: [{ text: { content: sprint.businessValue } }] },
          'Highlights': { rich_text: [{ text: { content: `${sprint.features.length} features | ${sprint.stream}` } }] },
          'Outcomes': { rich_text: [{ text: { content: 'Pending - Sprint not started' } }] },
          'Learnings': { rich_text: [{ text: { content: `Dependencies: ${sprint.dependencies}` } }] },
          'Branch': { rich_text: [{ text: { content: 'main' } }] },
          'Phases Updated': { multi_select: [{ name: 'Phase 2' }] },
          'Commits Count': { number: 0 },
        },
      });

      console.log(`  ✓ Sprint created`);

      // Create features for this sprint
      for (const feature of sprint.features) {
        await notion.pages.create({
          parent: { database_id: dbIds.module_features_db_id },
          properties: {
            'Features': { title: [{ text: { content: feature.name } }] },
            'Sprint': { number: sprint.number },
            'Status': { select: { name: 'Not Started' } },
            'Priority': { select: { name: sprint.priority } },
            'Complexity': { select: { name: feature.complexity } },
            'Type': { select: { name: feature.type } },
            'Notes': { rich_text: [{ text: { content: feature.notes } }] },
            'Tags': { multi_select: [{ name: 'phase-2' }, { name: sprint.stream.split(':')[0].trim().toLowerCase().replace('stream ', 'stream-') }] },
            'Assignee': { rich_text: [{ text: { content: 'Unassigned' } }] },
            'Done?': { checkbox: false },
          },
        });
      }

      console.log(`  ✓ ${sprint.features.length} features created`);

    } catch (error) {
      console.error(`  ✗ Error: ${error.message}`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  PHASE-2 ROADMAP CREATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`\n✓ Sprints created: ${PHASE2_SPRINTS.length}`);
  console.log(`✓ Features created: ${totalFeatures}`);
  console.log(`✓ Streams covered: 9`);
  console.log('\nNext steps:');
  console.log('1. Review sprints in Notion');
  console.log('2. Approve sprint order and priorities');
  console.log('3. Begin Sprint 1 execution');
}

createPhase2Roadmap().catch(console.error);
