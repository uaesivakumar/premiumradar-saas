/**
 * PremiumRadar Final Master Roadmap Creator
 * S48-S77 (30 Sprints, ~175 Features)
 *
 * CORRECTED EXECUTION SEQUENCE:
 * - Security & Identity FIRST (gates signup)
 * - Billing BEFORE Autonomous (gates features)
 * - ML Platform AFTER Real-Time (needs data)
 *
 * Enterprise-Grade Sales Intelligence Platform
 */

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const SPRINTS_DB = '5c32e26d-641a-4711-a9fb-619703943fb9';
const FEATURES_DB = '26ae5afe-4b5f-4d97-b402-5c459f188944';

// =============================================================================
// SPRINT DEFINITIONS (CORRECTED SEQUENCE)
// =============================================================================

const SPRINTS = [
  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 0: SECURITY FOUNDATION (MUST BE FIRST)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    number: 48,
    name: 'Identity Intelligence & Vertical Lockdown',
    goal: 'Corporate email verification + auto industry detection + permanent vertical assignment',
    phase: 'Phase 0: Security Foundation',
    businessValue: 'Prevents cross-vertical data leakage, competitor probing, and ensures enterprise compliance from day 1.',
  },
  {
    number: 49,
    name: 'Enterprise Security & DLP Foundation',
    goal: 'RBAC, Row-Level Security, email domain blocklist, audit logging foundation',
    phase: 'Phase 0: Security Foundation',
    businessValue: 'Enterprise customers require robust data protection. Must be in place before any tenant data is created.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: CONFIG FOUNDATION
  // ═══════════════════════════════════════════════════════════════════════════
  {
    number: 50,
    name: 'Super-Admin API Provider Management',
    goal: 'Config-driven API providers with intelligent fallback chains',
    phase: 'Phase 1: Config Foundation',
    businessValue: 'Enables multi-provider enrichment without code changes. Apollo→Hunter→PDL fallback.',
  },
  {
    number: 51,
    name: 'Super-Admin LLM Engine Routing',
    goal: 'Multi-model task routing with selectModel(task) API',
    phase: 'Phase 1: Config Foundation',
    businessValue: 'Best model for each task: GPT for scoring, Claude for enrichment, Gemini for research.',
  },
  {
    number: 52,
    name: 'Super-Admin Vertical Pack System',
    goal: 'Complete vertical configuration management with personas, signals, scoring',
    phase: 'Phase 1: Config Foundation',
    businessValue: 'Banking ≠ Insurance ≠ Real Estate. Each vertical has unique persona, signals, scoring.',
  },
  {
    number: 53,
    name: 'Super-Admin Territory Management',
    goal: 'Country→Region→Subregion→Territory hierarchy with config inheritance',
    phase: 'Phase 1: Config Foundation',
    businessValue: 'UAE→Gulf→Dubai→DIFC. Territory-specific config inheritance.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: ADMIN & BILLING (Before Tenant Features)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    number: 54,
    name: 'Admin Panel Foundation',
    goal: 'Tenant-specific configurations for email templates, cadence, workspace',
    phase: 'Phase 2: Admin & Billing',
    businessValue: 'Each tenant customizes their outreach without affecting others.',
  },
  {
    number: 55,
    name: 'Config-Driven OS Kernel',
    goal: 'Zero hardcoding - all config from DB via unified loader',
    phase: 'Phase 2: Admin & Billing',
    businessValue: 'PremiumRadar becomes truly SaaS - add verticals/regions without code.',
  },
  {
    number: 56,
    name: 'Discovery Target Types',
    goal: 'Vertical-specific radar targets (Companies/Individuals/Families/Candidates)',
    phase: 'Phase 2: Admin & Billing',
    businessValue: 'Banking targets companies, Insurance targets individuals - dynamic object types.',
  },
  {
    number: 57,
    name: 'Billing, Plans & Feature Flags',
    goal: 'Free/Starter/Pro/Enterprise plans with usage metering and feature gates',
    phase: 'Phase 2: Admin & Billing',
    businessValue: 'MUST come before Autonomous Mode. Plan limits gate features. Usage metering tracks everything.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3: JOURNEY ENGINE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    number: 58,
    name: 'Journey Engine Core',
    goal: 'Deterministic step-based workflow orchestration with state machine',
    phase: 'Phase 3: Journey Engine',
    businessValue: 'Reliable, auditable sales workflows that never skip steps.',
  },
  {
    number: 59,
    name: 'Journey Steps Library',
    goal: 'Pre-built step types (Discovery, Enrichment, Scoring, Outreach, Validation)',
    phase: 'Phase 3: Journey Engine',
    businessValue: 'Reusable building blocks for any sales workflow.',
  },
  {
    number: 60,
    name: 'Journey Templates per Vertical',
    goal: 'Pre-configured journeys for Banking, Insurance, Real Estate, Recruitment',
    phase: 'Phase 3: Journey Engine',
    businessValue: 'New users start with best-practice workflows immediately.',
  },
  {
    number: 61,
    name: 'Journey Monitoring',
    goal: 'Execution timeline, debug mode, error recovery, A/B testing',
    phase: 'Phase 3: Journey Engine',
    businessValue: 'Full visibility into what SIVA is doing and why.',
  },
  {
    number: 62,
    name: 'Journey Builder UI',
    goal: 'Visual drag-and-drop journey creation with condition builder',
    phase: 'Phase 3: Journey Engine',
    businessValue: 'Non-technical users can create custom workflows.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4: WORKSPACE & OBJECT INTELLIGENCE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    number: 63,
    name: 'Smart Workspace',
    goal: 'Config-driven workspace with widget system and vertical-specific layouts',
    phase: 'Phase 4: Workspace & Objects',
    businessValue: 'Each vertical has optimal layout for their workflow.',
  },
  {
    number: 64,
    name: 'Object Intelligence v2',
    goal: 'Living objects with relationships, timeline, contextual actions, threads',
    phase: 'Phase 4: Workspace & Objects',
    businessValue: 'Objects become intelligent entities, not just data records.',
  },
  {
    number: 65,
    name: 'Evidence System v2',
    goal: 'Multi-source evidence aggregation with provider weights and freshness',
    phase: 'Phase 4: Workspace & Objects',
    businessValue: 'Evidence confidence based on source accuracy (Apollo vs Hunter).',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 5: AUTONOMOUS MODE (Needs billing limits from S57)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    number: 66,
    name: 'Autonomous Agent Foundation',
    goal: 'Self-executing SIVA with task queue, guardrails, and plan-based limits',
    phase: 'Phase 5: Autonomous Mode',
    businessValue: 'SIVA works 24/7 with human-in-the-loop checkpoints. Gated by plan limits.',
  },
  {
    number: 67,
    name: 'Autonomous Discovery',
    goal: 'Self-discovering prospects via scheduler and signal triggers',
    phase: 'Phase 5: Autonomous Mode',
    businessValue: 'Pipeline fills automatically while you sleep.',
  },
  {
    number: 68,
    name: 'Autonomous Outreach',
    goal: 'Self-executing campaigns with send time optimization and response classification',
    phase: 'Phase 5: Autonomous Mode',
    businessValue: 'Outreach runs on autopilot with smart follow-ups.',
  },
  {
    number: 69,
    name: 'Autonomous Learning',
    goal: 'Win/loss pattern detection, scoring auto-tuning, journey optimization',
    phase: 'Phase 5: Autonomous Mode',
    businessValue: 'System improves itself based on what works.',
  },
  {
    number: 70,
    name: 'Autonomous Dashboard',
    goal: 'Activity feed, intervention requests, performance metrics, cost tracking',
    phase: 'Phase 5: Autonomous Mode',
    businessValue: 'Full visibility into autonomous operations and ROI.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 6: INTELLIGENCE PLATFORM
  // ═══════════════════════════════════════════════════════════════════════════
  {
    number: 71,
    name: 'Real-Time Signal Intelligence',
    goal: 'WebSocket-based live signal streams with instant notifications (industry first)',
    phase: 'Phase 6: Intelligence Platform',
    businessValue: 'Know about hiring signals in seconds, not hours. Industry-first capability.',
  },
  {
    number: 72,
    name: 'Predictive Intelligence',
    goal: 'ML models that forecast hiring/expansion 30/60/90 days ahead',
    phase: 'Phase 6: Intelligence Platform',
    businessValue: 'Reach out BEFORE competitors know about the opportunity.',
  },
  {
    number: 73,
    name: 'ML & Data Platform (Vertex AI)',
    goal: 'BigQuery warehouse + Vertex AI pipelines + Feature Store + embeddings',
    phase: 'Phase 6: Intelligence Platform',
    businessValue: 'Salesforce Einstein-level ML capabilities. Needs real-time signal data to train.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 7: LAUNCH POLISH
  // ═══════════════════════════════════════════════════════════════════════════
  {
    number: 74,
    name: 'Performance & Security Hardening',
    goal: 'Query optimization, caching, encryption, comprehensive audit logging',
    phase: 'Phase 7: Launch Polish',
    businessValue: 'Enterprise-ready performance and security for production load.',
  },
  {
    number: 75,
    name: 'Integrations Hub',
    goal: 'Salesforce, HubSpot bi-directional sync, Slack, webhooks, Zapier',
    phase: 'Phase 7: Launch Polish',
    businessValue: 'PremiumRadar fits into existing tech stack seamlessly.',
  },
  {
    number: 76,
    name: 'Mobile & PWA',
    goal: 'Progressive Web App with push notifications and mobile-optimized views',
    phase: 'Phase 7: Launch Polish',
    businessValue: 'Access PremiumRadar anywhere, even on mobile.',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 8: MARKETPLACE (Post-Launch)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    number: 77,
    name: 'Marketplace Foundation',
    goal: 'Vertical pack marketplace, journey template marketplace, signal plugins',
    phase: 'Phase 8: Marketplace',
    businessValue: 'Community ecosystem extends platform value. Post-launch feature.',
  },
];

// =============================================================================
// FEATURE DEFINITIONS (CORRECTED SEQUENCE)
// =============================================================================

const FEATURES = [
  // ═══════════════════════════════════════════════════════════════════════════
  // S48: Identity Intelligence & Vertical Lockdown (FIRST - Gates Signup)
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 48, name: 'Email Domain → Company Extraction', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Parse corporate domain from signup email', tags: ['Core'] },
  { sprint: 48, name: 'Enrichment-based Industry Detection', type: 'Feature', priority: 'High', complexity: 'High', notes: 'Apollo/Clearbit/PDL lookup for company industry', tags: ['Core', 'API'] },
  { sprint: 48, name: 'Vertical Suggestion at Onboarding', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'AI-suggested vertical based on detected company', tags: ['UI', 'AI'] },
  { sprint: 48, name: 'Vertical Lock After Confirmation', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Permanent vertical assignment - cannot be changed by user', tags: ['Core', 'State'] },
  { sprint: 48, name: 'Super-Admin Vertical Override', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Manual override with full audit trail', tags: ['UI', 'Core'] },
  { sprint: 48, name: 'Consulting-Mode Vertical', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Special multi-vertical mode with restrictions for consultants', tags: ['Core'] },
  { sprint: 48, name: 'MFA for Vertical Overrides', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Extra security layer for vertical changes', tags: ['Core'] },
  { sprint: 48, name: 'Session Validation (Vertical-bound)', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Every login session tied to user vertical', tags: ['Core', 'State'] },
  { sprint: 48, name: 'Corporate Email MX Verification', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Validate email domain has valid MX records - prevents fake domains', tags: ['Core'] },
  { sprint: 48, name: 'Industry Confidence Score', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Show confidence level of industry detection', tags: ['Core', 'AI'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S49: Enterprise Security & DLP Foundation (SECOND - Before Any Data)
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 49, name: 'Role-Based Access Control (RBAC) Schema', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'Granular role permissions framework', tags: ['Core', 'State'] },
  { sprint: 49, name: 'Row-Level Security (RLS) Implementation', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'Tenant isolation at database level - Supabase RLS', tags: ['Core', 'State'] },
  { sprint: 49, name: 'Email Domain Blocklist', type: 'Feature', priority: 'High', complexity: 'Low', notes: 'Block Gmail/Yahoo/Outlook/Hotmail signups', tags: ['Core'] },
  { sprint: 49, name: 'Session Audit Log Foundation', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Track every read/write/download action', tags: ['Core', 'State'] },
  { sprint: 49, name: 'User-Level Permissions Schema', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'What individual users can see/export', tags: ['Core', 'State'] },
  { sprint: 49, name: 'Export Restrictions Framework', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Disable CSV/PDF bulk export based on plan/role', tags: ['Core', 'UI'] },
  { sprint: 49, name: 'Copy/Share Prevention (UI)', type: 'Feature', priority: 'High', complexity: 'Low', notes: 'Disable right-click, copy shortcuts in sensitive areas', tags: ['UI', 'Core'] },
  { sprint: 49, name: 'API Rate Limits per User Schema', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Anti-scraping protection foundation', tags: ['Core', 'API'] },
  { sprint: 49, name: 'IP Allowlisting Schema (Enterprise)', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Allow only corporate IPs - Enterprise feature', tags: ['Core'] },
  { sprint: 49, name: 'Encrypted At-Rest Logs Config', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Enterprise compliance for audit logs', tags: ['Core'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S50: Super-Admin API Provider Management
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 50, name: 'API Provider Registry Schema', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'Provider, status, apiKey (encrypted), rateLimit, priority, healthScore', tags: ['Core', 'API'] },
  { sprint: 50, name: 'Provider CRUD UI', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Apollo, Hunter, PDL, Clearbit, Lusha, EmailVerifier management', tags: ['UI', 'Core'] },
  { sprint: 50, name: 'Priority-based Fallback Engine', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'Apollo→Hunter→PDL→MinimalMode automatic fallback', tags: ['Core', 'API'] },
  { sprint: 50, name: 'Rate Limit Enforcer', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Per-provider limits with queue management', tags: ['Core', 'API'] },
  { sprint: 50, name: 'Provider Health Monitor Dashboard', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Uptime %, latency, error rate visualization', tags: ['UI', 'Core'] },
  { sprint: 50, name: 'Provider Accuracy Scoring Config', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Email accuracy weights per provider for evidence', tags: ['Core', 'AI'] },
  { sprint: 50, name: 'SalesNav MCP Scraper Integration', type: 'Feature', priority: 'Medium', complexity: 'High', notes: 'LinkedIn data via MCP tool integration', tags: ['API', 'Core'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S51: Super-Admin LLM Engine Routing
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 51, name: 'LLM Router Config Schema', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'modelRouterConfig stored in DB per task type', tags: ['Core', 'AI'] },
  { sprint: 51, name: 'LLM Provider Adapters', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'Unified interface for GPT, Claude, Gemini, Llama, Grok, Perplexity', tags: ['Core', 'AI'] },
  { sprint: 51, name: 'Task-to-Model Mapping UI', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'enrichment→Claude, scoring→GPT, research→Gemini UI', tags: ['UI', 'AI'] },
  { sprint: 51, name: 'selectModel(task) Runtime API', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'Dynamic model selection based on task type', tags: ['Core', 'AI'] },
  { sprint: 51, name: 'Model Fallback Chain', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Primary→Secondary→OpenRouter fallback', tags: ['Core', 'AI'] },
  { sprint: 51, name: 'Cost Tracking per Model', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Token usage and cost analytics dashboard', tags: ['UI', 'Core'] },
  { sprint: 51, name: 'Model Performance Benchmarks', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Latency and quality scores comparison', tags: ['UI', 'AI'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S52: Super-Admin Vertical Pack System
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 52, name: 'Enhanced VerticalConfig Schema', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: '+LLM routing, +evidence rules, +journey templates', tags: ['Core', 'State'] },
  { sprint: 52, name: 'Vertical Pack CRUD UI', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Full vertical pack management interface', tags: ['UI', 'Core'] },
  { sprint: 52, name: 'Radar Target Configuration', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Companies/Individuals/Families/Candidates per vertical', tags: ['Core', 'UI'] },
  { sprint: 52, name: 'Signal Types per Vertical', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Banking signals ≠ Insurance signals configuration', tags: ['Core', 'UI'] },
  { sprint: 52, name: 'Persona Templates per Vertical', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Tone, vocabulary, avoidWords per vertical', tags: ['Core', 'AI'] },
  { sprint: 52, name: 'Scoring Templates per Vertical', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'QTLE weights customization per vertical', tags: ['Core', 'AI'] },
  { sprint: 52, name: 'Evidence Rules per Vertical', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'What evidence types are relevant', tags: ['Core', 'AI'] },
  { sprint: 52, name: 'Journey Flow Templates', type: 'Feature', priority: 'High', complexity: 'High', notes: 'Default journey per vertical', tags: ['Core', 'AI'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S53: Super-Admin Territory Management
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 53, name: 'Territory Hierarchy Schema', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: '4-level: country→region→subregion→territory', tags: ['Core', 'State'] },
  { sprint: 53, name: 'Territory CRUD UI', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Hierarchical tree editor for territories', tags: ['UI', 'Core'] },
  { sprint: 53, name: 'UAE Territories Seed', type: 'Infrastructure', priority: 'High', complexity: 'Low', notes: 'UAE→Gulf→Dubai/AbuDhabi→DIFC/ADGM/SAIF', tags: ['Core'] },
  { sprint: 53, name: 'Territory-to-Vertical Assignment', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Which verticals available in which territories', tags: ['Core', 'UI'] },
  { sprint: 53, name: 'Territory Config Inheritance', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Child territories inherit parent config', tags: ['Core', 'State'] },
  { sprint: 53, name: 'Timezone & Currency per Territory', type: 'Feature', priority: 'Medium', complexity: 'Low', notes: 'Localization support for territories', tags: ['Core'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S54: Admin Panel Foundation
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 54, name: 'Tenant Settings Schema', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Extends vertical config for tenant-specific settings', tags: ['Core', 'State'] },
  { sprint: 54, name: 'Email Templates CRUD', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Tenant-level email template management', tags: ['UI', 'Core'] },
  { sprint: 54, name: 'Outreach Cadence Configuration', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Days between touchpoints configuration', tags: ['Core', 'UI'] },
  { sprint: 54, name: 'Tone Presets per Tenant', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Custom tone profiles for each tenant', tags: ['Core', 'AI'] },
  { sprint: 54, name: 'Email Signature Manager', type: 'Feature', priority: 'Medium', complexity: 'Low', notes: 'Per-user email signature configuration', tags: ['UI', 'Core'] },
  { sprint: 54, name: 'Workspace Customizations', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Layout, colors, widgets per tenant', tags: ['UI', 'Core'] },
  { sprint: 54, name: 'Team Management UI', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Invite users, assign roles, manage permissions', tags: ['UI', 'Core'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S55: Config-Driven OS Kernel
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 55, name: 'Unified Config Loader', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'getConfig(country, region, subregion, territory, vertical, subVertical)', tags: ['Core', 'State'] },
  { sprint: 55, name: 'Hardcode Removal Audit', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Find and remove all hardcoded defaults', tags: ['Core'] },
  { sprint: 55, name: 'Config API Endpoint', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: '/api/config with full hierarchy support', tags: ['Core', 'API'] },
  { sprint: 55, name: 'Config Cache Layer', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Redis + memory cache for config', tags: ['Core', 'State'] },
  { sprint: 55, name: 'Config Validation Service', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Schema validation on config load', tags: ['Core'] },
  { sprint: 55, name: 'useVerticalConfig Hook', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Frontend config access hook', tags: ['UI', 'State'] },
  { sprint: 55, name: 'Config Change Webhooks', type: 'Infrastructure', priority: 'Medium', complexity: 'Medium', notes: 'Notify systems on config updates', tags: ['Core', 'API'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S56: Discovery Target Types
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 56, name: 'CompanyObject Schema', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Banking/SaaS radar target object type', tags: ['Core', 'State'] },
  { sprint: 56, name: 'IndividualObject Schema', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Insurance radar target object type', tags: ['Core', 'State'] },
  { sprint: 56, name: 'FamilyObject Schema', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Real Estate radar target object type', tags: ['Core', 'State'] },
  { sprint: 56, name: 'CandidateObject Schema', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Recruitment radar target object type', tags: ['Core', 'State'] },
  { sprint: 56, name: 'Object Type Registry', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Dynamic object type from vertical config', tags: ['Core', 'State'] },
  { sprint: 56, name: 'Dynamic Object Fields', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Fields change per vertical/object type', tags: ['Core', 'UI'] },
  { sprint: 56, name: 'Object Detection Rules', type: 'Feature', priority: 'High', complexity: 'High', notes: 'What triggers object creation per vertical', tags: ['Core', 'AI'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S57: Billing, Plans & Feature Flags (BEFORE Autonomous Mode)
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 57, name: 'Plan Schema (Free/Starter/Pro/Enterprise)', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'Subscription plans with limits - journeys, enrichments, signals', tags: ['Core', 'State'] },
  { sprint: 57, name: 'Feature Flag System', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'Plan-based feature access gates', tags: ['Core', 'State'] },
  { sprint: 57, name: 'Usage Metering Service', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Track journeys, enrichments, signals, autonomous ops', tags: ['Core', 'State'] },
  { sprint: 57, name: 'Stripe Integration', type: 'Feature', priority: 'High', complexity: 'High', notes: 'Subscriptions, invoices, payment methods', tags: ['API', 'Core'] },
  { sprint: 57, name: 'Plan Upgrade/Downgrade Flow', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Self-service plan changes with proration', tags: ['UI', 'Core'] },
  { sprint: 57, name: 'Usage Dashboard', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Current usage vs plan limits visualization', tags: ['UI', 'Core'] },
  { sprint: 57, name: 'Overage Alerts', type: 'Feature', priority: 'Medium', complexity: 'Low', notes: 'Email/in-app alerts before hitting limits', tags: ['UI', 'Core'] },
  { sprint: 57, name: 'White-label Config (Enterprise)', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Custom branding, domain, colors', tags: ['UI', 'Core'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S58: Journey Engine Core
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 58, name: 'Journey Definition Schema', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'Steps, transitions, validations, preconditions', tags: ['Core', 'State'] },
  { sprint: 58, name: 'Journey State Machine', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'Deterministic state transitions', tags: ['Core', 'State'] },
  { sprint: 58, name: 'Step Executor with selectModel()', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'LLM routing per step type', tags: ['Core', 'AI'] },
  { sprint: 58, name: 'Precondition Validators', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Schema-based validation before step execution', tags: ['Core'] },
  { sprint: 58, name: 'State Lock Mechanism', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Prevent race conditions in state transitions', tags: ['Core', 'State'] },
  { sprint: 58, name: 'Journey Instance Tracker', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Execution history and status tracking', tags: ['Core', 'State'] },
  { sprint: 58, name: 'Rollback & Recovery', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'Error handling and state recovery', tags: ['Core'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S59: Journey Steps Library
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 59, name: 'DiscoveryStep', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Uses radar target from vertical config', tags: ['Core', 'AI'] },
  { sprint: 59, name: 'EnrichmentStep', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Uses API provider fallback chain', tags: ['Core', 'API'] },
  { sprint: 59, name: 'ScoringStep', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Uses LLM routing for scoring', tags: ['Core', 'AI'] },
  { sprint: 59, name: 'OutreachStep', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Uses tenant email templates', tags: ['Core', 'AI'] },
  { sprint: 59, name: 'ValidationStep', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Schema-based data validation', tags: ['Core'] },
  { sprint: 59, name: 'WaitStep', type: 'Feature', priority: 'Medium', complexity: 'Low', notes: 'Time-based delays between steps', tags: ['Core'] },
  { sprint: 59, name: 'ConditionalBranch', type: 'Feature', priority: 'High', complexity: 'High', notes: 'If/else logic in journey flow', tags: ['Core'] },
  { sprint: 59, name: 'ParallelStep', type: 'Feature', priority: 'Medium', complexity: 'High', notes: 'Execute multiple steps concurrently', tags: ['Core'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S60: Journey Templates per Vertical
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 60, name: 'Banking Employee Onboarding Journey', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Company→Enrich→Score→Outreach flow', tags: ['Core', 'AI'] },
  { sprint: 60, name: 'Insurance Lead Qualification Journey', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Individual→Qualify→Recommend flow', tags: ['Core', 'AI'] },
  { sprint: 60, name: 'Real Estate Family Matching Journey', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Family→Match→Tour→Follow flow', tags: ['Core', 'AI'] },
  { sprint: 60, name: 'Recruitment Pipeline Journey', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Candidate→Screen→Interview flow', tags: ['Core', 'AI'] },
  { sprint: 60, name: 'Journey Template Cloning', type: 'Feature', priority: 'Medium', complexity: 'Low', notes: 'Copy and customize existing templates', tags: ['UI', 'Core'] },
  { sprint: 60, name: 'Template Versioning', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Track changes to journey templates', tags: ['Core', 'State'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S61: Journey Monitoring
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 61, name: 'Execution Timeline UI', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Visual step-by-step execution view', tags: ['UI', 'Core'] },
  { sprint: 61, name: 'Debug Mode', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Pause, inspect state, resume execution', tags: ['UI', 'Core'] },
  { sprint: 61, name: 'Error Recovery UI', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Manual intervention and retry interface', tags: ['UI', 'Core'] },
  { sprint: 61, name: 'Journey Analytics Dashboard', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Success rates, bottlenecks, timing', tags: ['UI', 'Core'] },
  { sprint: 61, name: 'A/B Testing Framework', type: 'Feature', priority: 'Medium', complexity: 'High', notes: 'Compare journey variant performance', tags: ['Core', 'AI'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S62: Journey Builder UI
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 62, name: 'Drag-and-Drop Journey Canvas', type: 'Feature', priority: 'High', complexity: 'High', notes: 'Node-based visual journey editor', tags: ['UI', 'Core'] },
  { sprint: 62, name: 'Step Configuration Panels', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Configure each step in sidebar', tags: ['UI', 'Core'] },
  { sprint: 62, name: 'Transition Condition Builder', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Visual condition editor for transitions', tags: ['UI', 'Core'] },
  { sprint: 62, name: 'Journey Preview Mode', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Dry-run simulation before activation', tags: ['UI', 'Core'] },
  { sprint: 62, name: 'Import/Export Journey JSON', type: 'Feature', priority: 'Medium', complexity: 'Low', notes: 'Share journeys between tenants', tags: ['Core'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S63: Smart Workspace
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 63, name: 'Workspace Layout Engine', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Vertical-specific default layouts', tags: ['UI', 'Core'] },
  { sprint: 63, name: 'Widget System', type: 'Feature', priority: 'High', complexity: 'High', notes: 'Configurable dashboard panels/widgets', tags: ['UI', 'Core'] },
  { sprint: 63, name: 'Workspace Templates per Vertical', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Banking vs Insurance workspace defaults', tags: ['UI', 'Core'] },
  { sprint: 63, name: 'Real-time Collaboration Presence', type: 'Feature', priority: 'Medium', complexity: 'High', notes: 'See who else is viewing same object', tags: ['UI', 'Core'] },
  { sprint: 63, name: 'Workspace Keyboard Shortcuts', type: 'Feature', priority: 'Medium', complexity: 'Low', notes: 'Power user navigation', tags: ['UI'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S64: Object Intelligence v2
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 64, name: 'Object Relationship Graph', type: 'Feature', priority: 'High', complexity: 'High', notes: 'Visual connections between objects', tags: ['UI', 'Core'] },
  { sprint: 64, name: 'Object Timeline', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Activity history with evidence', tags: ['UI', 'Core'] },
  { sprint: 64, name: 'Object Actions Menu', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Vertical-specific actions (Enrich, Score, etc)', tags: ['UI', 'Core'] },
  { sprint: 64, name: 'Object Threads', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Contextual SIVA conversations per object', tags: ['UI', 'AI'] },
  { sprint: 64, name: 'Object Linking', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Manual relationship creation', tags: ['UI', 'Core'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S65: Evidence System v2
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 65, name: 'Evidence Rules Engine', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'Rules from vertical config', tags: ['Core', 'AI'] },
  { sprint: 65, name: 'Multi-Provider Evidence Aggregation', type: 'Feature', priority: 'High', complexity: 'High', notes: 'Merge Apollo + Hunter + PDL evidence', tags: ['Core', 'API'] },
  { sprint: 65, name: 'Provider Weight Scoring', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Confidence based on source accuracy', tags: ['Core', 'AI'] },
  { sprint: 65, name: 'Evidence Freshness Tracking', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Age-based confidence decay', tags: ['Core'] },
  { sprint: 65, name: 'Source Attribution UI', type: 'Feature', priority: 'Medium', complexity: 'Low', notes: 'Show where evidence came from', tags: ['UI', 'Core'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S66: Autonomous Agent Foundation
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 66, name: 'Autonomous Task Queue', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'Priority-based task execution queue', tags: ['Core', 'State'] },
  { sprint: 66, name: 'Human-in-the-Loop Checkpoints', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Approval gates for sensitive actions', tags: ['Core', 'UI'] },
  { sprint: 66, name: 'Execution Limits (Plan-based)', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Limits based on subscription plan from S57', tags: ['Core'] },
  { sprint: 66, name: 'Autonomous Activity Log', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Full audit trail of autonomous actions', tags: ['Core', 'State'] },
  { sprint: 66, name: 'Emergency Kill Switch', type: 'Feature', priority: 'High', complexity: 'Low', notes: 'Stop all autonomous operations', tags: ['UI', 'Core'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S67: Autonomous Discovery
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 67, name: 'Auto-Discovery Scheduler', type: 'Feature', priority: 'High', complexity: 'High', notes: 'Cron-based discovery runs', tags: ['Core', 'AI'] },
  { sprint: 67, name: 'Signal-Triggered Discovery', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Event-driven discovery activation', tags: ['Core', 'AI'] },
  { sprint: 67, name: 'Discovery Quality Filter', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Auto-discard low quality results', tags: ['Core', 'AI'] },
  { sprint: 67, name: 'Auto-Enrichment Pipeline', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Discover→Enrich→Score automatically', tags: ['Core', 'AI'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S68: Autonomous Outreach
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 68, name: 'Outreach Queue Manager', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Smart scheduling of outreach', tags: ['Core', 'AI'] },
  { sprint: 68, name: 'Send Time Optimization', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'ML-based optimal send timing', tags: ['Core', 'AI'] },
  { sprint: 68, name: 'Response Classification', type: 'Feature', priority: 'High', complexity: 'High', notes: 'Positive/Negative/Bounce detection', tags: ['Core', 'AI'] },
  { sprint: 68, name: 'Auto-Follow-up Sequences', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Cadence automation', tags: ['Core', 'AI'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S69: Autonomous Learning
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 69, name: 'Win/Loss Pattern Detection', type: 'Feature', priority: 'High', complexity: 'High', notes: 'Learn what works and what doesn\'t', tags: ['Core', 'AI'] },
  { sprint: 69, name: 'Scoring Model Auto-Tuning', type: 'Feature', priority: 'High', complexity: 'High', notes: 'Adjust weights based on outcomes', tags: ['Core', 'AI'] },
  { sprint: 69, name: 'Persona Effectiveness Analytics', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Which tone converts best', tags: ['Core', 'AI'] },
  { sprint: 69, name: 'Journey Optimization Suggestions', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'AI recommendations for journey improvement', tags: ['Core', 'AI'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S70: Autonomous Dashboard
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 70, name: 'Autonomous Activity Feed', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Real-time stream of autonomous actions', tags: ['UI', 'Core'] },
  { sprint: 70, name: 'Intervention Request UI', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Human approval workflow interface', tags: ['UI', 'Core'] },
  { sprint: 70, name: 'Autonomous Performance Metrics', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Success rates, conversion tracking', tags: ['UI', 'Core'] },
  { sprint: 70, name: 'Cost & Token Tracking', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Budget management for autonomous ops', tags: ['UI', 'Core'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S71: Real-Time Signal Intelligence
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 71, name: 'WebSocket Signal Hub', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'Real-time push infrastructure', tags: ['Core', 'API'] },
  { sprint: 71, name: 'Signal Stream Subscriptions', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Subscribe to specific signal types', tags: ['Core', 'UI'] },
  { sprint: 71, name: 'Instant Notification System', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Push to mobile/desktop', tags: ['Core', 'UI'] },
  { sprint: 71, name: 'Signal Correlation Engine', type: 'Feature', priority: 'High', complexity: 'High', notes: 'Connect related signals automatically', tags: ['Core', 'AI'] },
  { sprint: 71, name: 'Live Dashboard Widgets', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Real-time counters and charts', tags: ['UI', 'Core'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S72: Predictive Intelligence
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 72, name: 'Predictive Model Training Pipeline', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'Historical pattern learning', tags: ['Core', 'AI'] },
  { sprint: 72, name: 'Will Hire Predictor', type: 'Feature', priority: 'High', complexity: 'High', notes: '30/60/90 day hiring forecast', tags: ['Core', 'AI'] },
  { sprint: 72, name: 'Will Expand Predictor', type: 'Feature', priority: 'High', complexity: 'High', notes: 'Growth and expansion signals', tags: ['Core', 'AI'] },
  { sprint: 72, name: 'Prediction Confidence Scores', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'How sure are predictions', tags: ['Core', 'AI'] },
  { sprint: 72, name: 'Prediction Validation Loop', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Track prediction accuracy over time', tags: ['Core', 'AI'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S73: ML & Data Platform (Vertex AI)
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 73, name: 'BigQuery Data Warehouse', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'All historical data storage', tags: ['Core', 'AI'] },
  { sprint: 73, name: 'Vertex AI Feature Store', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'Signals → ML features', tags: ['Core', 'AI'] },
  { sprint: 73, name: 'Vertex AI Pipelines', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'Training + validation workflows', tags: ['Core', 'AI'] },
  { sprint: 73, name: 'Vertex ML Model Registry', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Version control for models', tags: ['Core', 'AI'] },
  { sprint: 73, name: 'Prediction Service API', type: 'Feature', priority: 'High', complexity: 'High', notes: 'Will hire/Will expand endpoints', tags: ['API', 'AI'] },
  { sprint: 73, name: 'Model Drift Monitoring', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Detect outdated models', tags: ['Core', 'AI'] },
  { sprint: 73, name: 'Vertex Vector Search (Embeddings)', type: 'Infrastructure', priority: 'High', complexity: 'High', notes: 'Similarity search for all entities', tags: ['Core', 'AI'] },
  { sprint: 73, name: 'Dataset Lineage Tracking', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Data provenance audit', tags: ['Core', 'AI'] },
  { sprint: 73, name: 'AutoML Tabular Training', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'No-code model training', tags: ['Core', 'AI'] },
  { sprint: 73, name: 'Batch Prediction Jobs', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: '30/60/90 day forecasts at scale', tags: ['Core', 'AI'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S74: Performance & Security Hardening
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 74, name: 'Query Optimization', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Database performance tuning', tags: ['Core'] },
  { sprint: 74, name: 'Multi-layer Caching', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Redis + CDN + memory cache', tags: ['Core'] },
  { sprint: 74, name: 'API Key Rotation System', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Automated key rotation', tags: ['Core'] },
  { sprint: 74, name: 'Comprehensive Audit Logging', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'All actions logged with context', tags: ['Core'] },
  { sprint: 74, name: 'DDoS Protection', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Rate limiting and protection', tags: ['Core', 'API'] },
  { sprint: 74, name: 'GDPR Compliance Tools', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Data export/delete workflows', tags: ['Core'] },
  { sprint: 74, name: 'SOC2 Compliance Dashboard', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Compliance status view', tags: ['UI', 'Core'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S75: Integrations Hub
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 75, name: 'Salesforce Bi-directional Sync', type: 'Feature', priority: 'High', complexity: 'High', notes: 'Two-way CRM sync', tags: ['API', 'Core'] },
  { sprint: 75, name: 'HubSpot Bi-directional Sync', type: 'Feature', priority: 'High', complexity: 'High', notes: 'Two-way CRM sync', tags: ['API', 'Core'] },
  { sprint: 75, name: 'Slack Notifications', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Channel alerts for signals', tags: ['API', 'Core'] },
  { sprint: 75, name: 'Microsoft Teams Integration', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Teams notifications', tags: ['API', 'Core'] },
  { sprint: 75, name: 'Webhook System', type: 'Infrastructure', priority: 'High', complexity: 'Medium', notes: 'Custom integration webhooks', tags: ['API', 'Core'] },
  { sprint: 75, name: 'Zapier Integration', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'No-code automation connects', tags: ['API', 'Core'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S76: Mobile & PWA
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 76, name: 'PWA Shell', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Installable progressive web app', tags: ['UI', 'Core'] },
  { sprint: 76, name: 'Mobile-Optimized Views', type: 'Feature', priority: 'High', complexity: 'Medium', notes: 'Responsive design for all screens', tags: ['UI'] },
  { sprint: 76, name: 'Push Notifications', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'Mobile push for signals', tags: ['UI', 'Core'] },
  { sprint: 76, name: 'Offline Mode (Limited)', type: 'Feature', priority: 'Low', complexity: 'High', notes: 'Basic offline functionality', tags: ['UI', 'Core'] },
  { sprint: 76, name: 'Mobile Object Inspector', type: 'Feature', priority: 'Medium', complexity: 'Medium', notes: 'View object details on mobile', tags: ['UI'] },

  // ═══════════════════════════════════════════════════════════════════════════
  // S77: Marketplace Foundation (Post-Launch)
  // ═══════════════════════════════════════════════════════════════════════════
  { sprint: 77, name: 'Vertical Pack Marketplace', type: 'Feature', priority: 'Medium', complexity: 'High', notes: 'Community-created verticals', tags: ['UI', 'Core'] },
  { sprint: 77, name: 'Journey Template Marketplace', type: 'Feature', priority: 'Medium', complexity: 'High', notes: 'Shareable journey templates', tags: ['UI', 'Core'] },
  { sprint: 77, name: 'Signal Plugin System', type: 'Feature', priority: 'Medium', complexity: 'High', notes: 'Custom signal sources', tags: ['Core', 'API'] },
  { sprint: 77, name: 'Marketplace Review System', type: 'Feature', priority: 'Low', complexity: 'Medium', notes: 'Ratings and comments', tags: ['UI', 'Core'] },
  { sprint: 77, name: 'Creator Dashboard', type: 'Feature', priority: 'Low', complexity: 'Medium', notes: 'Analytics for marketplace creators', tags: ['UI', 'Core'] },
];

// =============================================================================
// CREATION FUNCTIONS
// =============================================================================

async function createSprint(sprint) {
  try {
    const response = await notion.pages.create({
      parent: { database_id: SPRINTS_DB },
      properties: {
        'Sprint': { title: [{ text: { content: `S${sprint.number}: ${sprint.name}` } }] },
        'Status': { select: { name: 'Backlog' } },
        'Goal': { rich_text: [{ text: { content: sprint.goal } }] },
        'Sprint Notes': { rich_text: [{ text: { content: `${sprint.phase}. ${sprint.goal}` } }] },
        'Outcomes': { rich_text: [{ text: { content: 'To be filled upon completion' } }] },
        'Highlights': { rich_text: [{ text: { content: 'To be filled upon completion' } }] },
        'Business Value': { rich_text: [{ text: { content: sprint.businessValue } }] },
        'Branch': { rich_text: [{ text: { content: `feat/sprint-s${sprint.number}` } }] },
        'Phases Updated': { multi_select: [{ name: 'Backlog' }] },
      },
    });
    console.log(`✅ Created Sprint S${sprint.number}: ${sprint.name}`);
    return response;
  } catch (error) {
    console.error(`❌ Failed to create Sprint S${sprint.number}:`, error.message);
    throw error;
  }
}

async function createFeature(feature) {
  try {
    const response = await notion.pages.create({
      parent: { database_id: FEATURES_DB },
      properties: {
        'Features': { title: [{ text: { content: feature.name } }] },
        'Sprint': { number: feature.sprint },
        'Status': { select: { name: 'Backlog' } },
        'Priority': { select: { name: feature.priority } },
        'Complexity': { select: { name: feature.complexity } },
        'Type': { select: { name: feature.type } },
        'Notes': { rich_text: [{ text: { content: feature.notes } }] },
        'Tags': { multi_select: feature.tags.map(t => ({ name: t })) },
        'Assignee': { rich_text: [{ text: { content: 'Claude (TC)' } }] },
        'Done?': { checkbox: false },
      },
    });
    console.log(`  ✅ Feature: ${feature.name}`);
    return response;
  } catch (error) {
    console.error(`  ❌ Failed: ${feature.name}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 PremiumRadar Final Master Roadmap Creator (CORRECTED SEQUENCE)');
  console.log('━'.repeat(60));
  console.log(`📋 Sprints to create: ${SPRINTS.length}`);
  console.log(`📋 Features to create: ${FEATURES.length}`);
  console.log('━'.repeat(60));
  console.log('\n📌 CORRECTED EXECUTION ORDER:');
  console.log('   S48-S49: Security Foundation (FIRST - gates signup)');
  console.log('   S50-S53: Config Foundation');
  console.log('   S54-S57: Admin & Billing (BEFORE Autonomous)');
  console.log('   S58-S62: Journey Engine');
  console.log('   S63-S65: Workspace & Objects');
  console.log('   S66-S70: Autonomous Mode');
  console.log('   S71-S73: Intelligence Platform');
  console.log('   S74-S76: Launch Polish');
  console.log('   S77: Marketplace (Post-Launch)');
  console.log('━'.repeat(60));

  // Create all sprints
  console.log('\n📁 Creating Sprints...\n');
  for (const sprint of SPRINTS) {
    await createSprint(sprint);
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 300));
  }

  // Create all features
  console.log('\n📁 Creating Features...\n');
  let currentSprint = 0;
  for (const feature of FEATURES) {
    if (feature.sprint !== currentSprint) {
      currentSprint = feature.sprint;
      console.log(`\n--- S${currentSprint} Features ---`);
    }
    await createFeature(feature);
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 200));
  }

  // Summary
  console.log('\n' + '━'.repeat(60));
  console.log('✅ CREATION COMPLETE');
  console.log('━'.repeat(60));
  console.log(`📋 Sprints created: ${SPRINTS.length}`);
  console.log(`📋 Features created: ${FEATURES.length}`);
  console.log('\n📊 Phase Breakdown:');

  const phases = {};
  SPRINTS.forEach(s => {
    if (!phases[s.phase]) phases[s.phase] = [];
    phases[s.phase].push(s.number);
  });

  Object.entries(phases).forEach(([phase, sprints]) => {
    const featureCount = FEATURES.filter(f => sprints.includes(f.sprint)).length;
    console.log(`  ${phase}: S${sprints[0]}-S${sprints[sprints.length-1]} (${featureCount} features)`);
  });

  console.log('\n🔗 Review in Notion:');
  console.log('   Sprints: https://notion.so/5c32e26d641a47119fb619703943fb9');
  console.log('   Features: https://notion.so/26ae5afe4b5f4d97b4025c459f188944');
}

main().catch(console.error);
