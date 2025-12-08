# PremiumRadar Master PRD

**Version**: 2.0 FINAL
**Date**: December 8, 2025
**Status**: LOCKED FOR EXECUTION
**Classification**: Confidential

---

## Document Structure

| Section | Content |
|---------|---------|
| A | Vision & Identity |
| B | Phase Requirements (1, 2, 3) |
| C | Functional PRD (Roles & Features) |
| D | Technical Architecture |
| E | AI Architecture (SIVA) |
| F | Data Model & Events |
| G | Anti-Goals & Constraints |
| H | Evidence System |
| I | Pack Storage Model |
| J | Tenant Architecture |

---

# SECTION A: VISION & IDENTITY

## A.1 Product Identity

**PremiumRadar** is a Sales Intelligence Platform that transforms how salespeople find, prioritize, and close deals.

**SIVA** (Sales Intelligence Virtual Assistant) is the AI-powered assistant at the heart of PremiumRadar — designed to become the **Siri of Sales**.

## A.2 Core Positioning

| Aspect | Definition |
|--------|------------|
| **What We Are** | Sales enablement platform for salespeople |
| **What We Are NOT** | Industry intelligence engine, market research tool |
| **Primary User** | Individual salespeople (B2C of B2B) |
| **Secondary User** | Sales managers, enterprise admins |
| **Radar Target** | Companies (Banking), Individuals (Insurance - future) |

## A.3 SIVA Identity

```
SIVA = Sales Intelligence Virtual Assistant
     = "Perplexity of Sales" (search + instant answers with citations)
     = Powered by SLM (Sales Language Model) — future
     = "Hey SIVA" voice-first interface — future
     = Platform (SDK + API + Standalone) — future
```

## A.4 Three-Tier User Model

| Tier | Role | Scope | Access |
|------|------|-------|--------|
| **Super Admin** | PremiumRadar internal team | Global | Full platform control |
| **Tenant Admin** | Enterprise customer admin | Tenant-scoped | Team management, config |
| **User** | Individual salesperson | Personal | SIVA, dashboard, signals |

## A.5 Vertical Hierarchy (Immutable)

```
Super Admin ONLY creates:
├── Vertical (Banking, Insurance, Real Estate, Recruitment, SaaS Sales)
├── Sub-Vertical (Employee Banking, Corporate Banking, SME Banking)
├── Region (UAE, India, US)
├── Signal Packs (per vertical)
├── Persona Packs (per sub-vertical)
└── Pricing Plans

Tenants can ONLY:
├── Select from available Vertical
├── Select from available Sub-Vertical
├── Select from available Region
├── Customize within allowed boundaries
└── NOT create new verticals/sub-verticals/regions
```

## A.6 Current State (December 2025)

| Aspect | Status |
|--------|--------|
| Active Vertical | Banking ONLY |
| Active Sub-Verticals | Employee Banking, Corporate Banking, SME Banking |
| Active Region | UAE |
| Completed Sprints | S1-S132 (754 features) |
| SIVA Status | Basic OS integration |
| Backend | UPR OS (Cloud Run) |
| Frontend | Next.js 15 (Vercel) |
| Database | Cloud SQL PostgreSQL |

## A.7 Jobs To Be Done (JTBD)

**Every feature must map to a user job. If it doesn't serve a job, don't build it.**

### Core Jobs

| Job ID | User Says | SIVA Delivers | Feature Mapping |
|--------|-----------|---------------|-----------------|
| **J1** | "Which leads should I focus on today?" | Prioritized list with reasoning | Dashboard, SIVA prioritize tool |
| **J2** | "Which companies are heating up?" | Signal-based company ranking | Signals, SIVA search tool |
| **J3** | "What do I say to this prospect?" | Context-aware talking points | SIVA outreach tool |
| **J4** | "I have a call in 10 mins, brief me" | Company + contact + history summary | SIVA briefing tool, Company profiles |
| **J5** | "How is my pipeline looking?" | QTLE analysis across portfolio | Scoring UI, Dashboard |
| **J6** | "Notify me when something happens" | Proactive alerts on triggers | Alerts (Phase 2) |
| **J7** | "Why is this company scored high?" | Evidence-backed reasoning | Evidence system, Citations |

### JTBD Integration Rule

```
Every feature MUST include:
├── job_id: Which JTBD does this serve?
├── user_story: "As a [role], I want [capability] so that [outcome]"
├── siva_action: What SIVA does to serve this job
└── evidence_required: What signals/data needed
```

---

# SECTION B: PHASE REQUIREMENTS

## B.1 Phase Summary

| Phase | Name | Sprints | Goal | Revenue Target |
|-------|------|---------|------|----------------|
| **1** | Launch Ready | S133-S152 (20) | Ship MVP, first paying customers | $100K ARR |
| **2** | Intelligence Engine | S153-S167 (15) | SIVA becomes indispensable | $500K ARR |
| **3** | Enterprise Ready | S168-S182 (15) | SOC2, SDK, mobile, enterprise | $3M ARR |

---

## B.2 PHASE 1: Launch Ready (S133-S152)

### B.2.1 Phase 1 Goal
**Ship MVP to first paying customers. Banking → Employee Banking → UAE only.**

### B.2.2 Phase 1 Scope (TRIMMED)

| Category | IN Phase 1 | MOVED TO Phase 2 |
|----------|------------|------------------|
| **Verticals** | Banking only | Insurance, RE, Recruitment, SaaS |
| **Sub-Verticals** | **EB only** (CB, SME UI placeholders) | CB, SME intelligence |
| **Regions** | **UAE only** | India, US, others |
| **Users** | Individual only | Multi-tenant enterprise |
| **SIVA** | Text chat, basic tools | Voice, proactive, SDK |
| **Billing** | Stripe, 3 tiers | Custom enterprise pricing |
| **Analytics** | Basic events only | ML predictions, team dashboards |
| **Super Admin** | Minimal CRUD | AI departments, signal performance |

**Phase 1 Focus: EB + UAE + Individual Users. Nothing else.**

### B.2.3 Phase 1 Features by Role

#### Super Admin (Phase 1) - TRIMMED
| Feature | Priority | Sprint | Status |
|---------|----------|--------|--------|
| Vertical config viewer | P0 | S147 | Keep |
| Sub-vertical config editor | P0 | S147 | Keep |
| Persona pack manager (CRUD) | P0 | S148 | Keep |
| Signal pack manager (view only) | P1 | S147 | Keep |
| Tenant list & status | P0 | S149 | Keep |
| ~~User activity dashboard~~ | ~~P1~~ | ~~S151~~ | **MOVED → Phase 2** |
| ~~API cost tracker~~ | ~~P1~~ | ~~S151~~ | **MOVED → Phase 2** |
| ~~Signal performance~~ | ~~P1~~ | ~~S147~~ | **MOVED → Phase 2** |
| Manual billing override | P2 | S152 | Keep |

#### Tenant Admin (Phase 1) - TRIMMED
| Feature | Priority | Sprint | Status |
|---------|----------|--------|--------|
| Tenant onboarding wizard | P0 | S149 | Keep |
| Select vertical/sub-vertical/region | P0 | S134 | Keep |
| User invite & management | P0 | S149 | Keep |
| ~~Team usage dashboard~~ | ~~P1~~ | ~~S149~~ | **MOVED → Phase 2** |
| Billing portal (Stripe) | P0 | S142 | Keep |
| Basic RBAC (admin, member) | P1 | S141 | Keep |

#### User (Phase 1)
| Feature | Priority | Sprint |
|---------|----------|--------|
| Sign up / onboarding | P0 | S134 |
| Dashboard v2 | P0 | S136 |
| Signal list with filtering | P0 | S138 |
| Company profiles | P0 | S139 |
| SIVA chat interface | P0 | S137 |
| SIVA basic tools (score, search, prioritize) | P0 | S143 |
| SIVA outreach drafting assistance | P0 | S143 |
| QTLE score visualization | P0 | S140 |
| Profile settings | P1 | S134 |

### B.2.4 Phase 1 Technical Requirements

| Requirement | Details |
|-------------|---------|
| Auth | Auth0 with email + Google OAuth |
| Multi-tenancy | Tenant ID in all tables, RLS |
| API Gateway | Cloud Run with rate limiting |
| Events | BigQuery streaming (user actions) |
| SIVA Context | Session-based, no long-term memory |
| RAG | None (Phase 1 uses direct API calls) |
| Embedding Store | None |
| Cost Tracking | Per-tenant API call logging |

### B.2.5 Phase 1 Exit Criteria
- [ ] 10 paying customers onboarded
- [ ] Full user journey working (sign up → dashboard → signals → SIVA)
- [ ] Stripe billing functional (3 tiers)
- [ ] Demo tenant with sample data
- [ ] Support channel ready (email)
- [ ] 95%+ uptime for 2 weeks

---

## B.3 PHASE 2: Intelligence Engine (S153-S167)

### B.3.1 Phase 2 Goal
**SIVA becomes indispensable. Users say "I can't work without SIVA."**

### B.3.2 Phase 2 Scope

| Category | Added in Phase 2 |
|----------|------------------|
| **SIVA** | Proactive alerts, memory, citations, voice input |
| **Intelligence** | Knowledge graph, pattern detection, ML scoring |
| **Analytics** | User behavior ML, drop-off prediction |
| **Super Admin** | AI CTO, AI QA (lite), advanced dashboards |
| **Multi-source** | LinkedIn, news, company data fusion |

### B.3.3 Phase 2 Features by Role

#### Super Admin (Phase 2)
| Feature | Priority |
|---------|----------|
| AI CTO Dashboard (deployment health, errors) | P0 |
| AI QA Dashboard (test coverage, bugs) | P1 |
| Signal performance analytics | P0 |
| Persona effectiveness tracking | P0 |
| Vertical expansion tools | P1 |
| A/B test management | P2 |

#### Tenant Admin (Phase 2)
| Feature | Priority |
|---------|----------|
| Team performance dashboard | P0 |
| SIVA usage analytics per user | P0 |
| Custom signal preferences | P1 |
| Onboarding progress tracker | P1 |

#### User (Phase 2)
| Feature | Priority |
|---------|----------|
| SIVA proactive daily briefings | P0 |
| SIVA citation system ("based on...") | P0 |
| SIVA conversation memory | P0 |
| SIVA voice input (web) | P1 |
| Pipeline predictions | P1 |
| Contact intelligence | P1 |
| Learning from feedback | P0 |

### B.3.4 Phase 2 Technical Requirements

| Requirement | Details |
|-------------|---------|
| RAG | Vertex AI Vector Search + embeddings |
| Knowledge Graph | Company → People → Signals relationships |
| Memory | Per-user conversation history (PostgreSQL) |
| ML Scoring | Vertex AI custom model |
| Voice | Web Speech API (Chrome) |
| Events | Enhanced BigQuery schema with ML features |

### B.3.5 Phase 2 Exit Criteria
- [ ] Daily proactive briefings functional
- [ ] Citation system showing sources
- [ ] User feedback loop working
- [ ] 50% of users use SIVA daily
- [ ] NPS > 40

---

## B.4 PHASE 3: Enterprise Ready (S168-S182)

### B.4.1 Phase 3 Goal
**Enterprise customers, SOC2, SDK, mobile app.**

### B.4.2 Phase 3 Scope

| Category | Added in Phase 3 |
|----------|------------------|
| **Compliance** | SOC2 Type II, GDPR, audit logs |
| **Enterprise** | SSO (SAML/OIDC), advanced RBAC, bulk import |
| **Platform** | SIVA SDK v1, public API |
| **Mobile** | iOS/Android app |
| **Integrations** | Salesforce, HubSpot native |

### B.4.3 Phase 3 Features by Role

#### Super Admin (Phase 3)
| Feature | Priority |
|---------|----------|
| Full AI Departments (11) | P0 |
| SOC2 audit dashboard | P0 |
| Enterprise contract management | P0 |
| SDK/API key management | P0 |
| White-label configuration | P1 |
| Global analytics | P0 |

#### Tenant Admin (Phase 3)
| Feature | Priority |
|---------|----------|
| SSO configuration (SAML/OIDC) | P0 |
| Custom roles & permissions | P0 |
| Bulk user import | P0 |
| Audit logs viewer | P0 |
| Data export/retention settings | P1 |

#### User (Phase 3)
| Feature | Priority |
|---------|----------|
| Mobile app (iOS/Android) | P0 |
| SIVA on mobile (voice) | P0 |
| Push notifications | P0 |
| Salesforce integration | P0 |
| HubSpot integration | P1 |
| Offline mode (basic) | P2 |

### B.4.4 Phase 3 Technical Requirements

| Requirement | Details |
|-------------|---------|
| SOC2 | Audit logging, access controls, encryption |
| SSO | Auth0 Enterprise connections |
| SDK | TypeScript/JavaScript SDK published to npm |
| Mobile | React Native or Flutter |
| Integrations | OAuth 2.0 flows, webhooks |

### B.4.5 Phase 3 Exit Criteria
- [ ] SOC2 Type II audit passed
- [ ] SIVA SDK v1.0 on npm
- [ ] Mobile app in App Store/Play Store
- [ ] 5 enterprise customers ($50K+ ACV)
- [ ] 2+ CRM integrations live

---

# SECTION C: FUNCTIONAL PRD

## C.1 Super Admin Functional Requirements

### C.1.1 Super Admin Definition
Internal PremiumRadar team members who manage the entire platform.

### C.1.2 Super Admin Capabilities by Phase

| Capability | Phase 1 | Phase 2 | Phase 3 |
|------------|---------|---------|---------|
| View all tenants | Yes | Yes | Yes |
| Create vertical | Yes | Yes | Yes |
| Create sub-vertical | Yes | Yes | Yes |
| Create region | Yes | Yes | Yes |
| Manage persona packs | Yes | Yes | Yes |
| Manage signal packs | View only | Edit | Full |
| View API costs | Basic | Advanced | Full |
| AI Founder Brain | No | No | Yes |
| AI CTO Dashboard | No | Lite | Full |
| AI QA Dashboard | No | Lite | Full |
| AI CRO Dashboard | No | No | Yes |
| AI CISO Dashboard | No | No | Yes |
| SDK management | No | No | Yes |
| White-label config | No | No | Yes |

### C.1.3 Super Admin Screens (Phase 1)

```
Super Admin Dashboard
├── Overview (tenant count, user count, API usage)
├── Tenants
│   ├── List all tenants
│   ├── Tenant detail (users, usage, billing)
│   └── Create demo tenant
├── Verticals
│   ├── Vertical list (view)
│   ├── Sub-vertical editor
│   └── Region editor
├── Personas
│   ├── Persona pack list
│   ├── Persona editor (per sub-vertical)
│   └── Preview persona
├── Signals
│   ├── Signal pack list (view)
│   └── Signal performance
├── API
│   ├── Cost tracker (basic)
│   └── Rate limit status
└── Settings
    ├── Admin users
    └── System config
```

## C.2 Tenant Admin Functional Requirements

### C.2.1 Tenant Admin Definition
Customer-designated administrator for their organization's PremiumRadar instance.

### C.2.2 Tenant Admin Capabilities by Phase

| Capability | Phase 1 | Phase 2 | Phase 3 |
|------------|---------|---------|---------|
| Invite users | Yes | Yes | Yes |
| Remove users | Yes | Yes | Yes |
| View team usage | Basic | Advanced | Full |
| Configure vertical | Select only | Select only | Select only |
| Configure sub-vertical | Select only | Select only | Select only |
| Configure region | Select only | Select only | Select only |
| Billing management | Stripe portal | Stripe portal | Custom + Stripe |
| Basic RBAC | Admin/Member | Admin/Member | Custom roles |
| SSO configuration | No | No | Yes |
| Audit logs | No | No | Yes |
| Bulk import | No | No | Yes |
| Data export | No | No | Yes |

### C.2.3 Tenant Admin Screens (Phase 1)

```
Tenant Admin Dashboard
├── Overview (user count, usage stats)
├── Team
│   ├── User list
│   ├── Invite user
│   ├── User roles (admin/member)
│   └── Remove user
├── Configuration
│   ├── Vertical selector
│   ├── Sub-vertical selector
│   └── Region selector
├── Billing
│   ├── Current plan
│   ├── Usage meter
│   └── Manage subscription (Stripe)
└── Settings
    └── Company info
```

## C.3 User Functional Requirements

### C.3.1 User Definition
Individual salesperson using PremiumRadar to find and close deals.

### C.3.2 User Capabilities by Phase

| Capability | Phase 1 | Phase 2 | Phase 3 |
|------------|---------|---------|---------|
| SIVA chat | Text only | Text + voice | Text + voice + mobile |
| SIVA proactive | No | Daily briefings | Real-time alerts |
| SIVA memory | Session only | Long-term | Long-term + cross-device |
| Signal list | Yes | Enhanced | Enhanced |
| Company profiles | Basic | With intelligence | With CRM sync |
| Scoring | QTLE display | ML-enhanced | Predictive |
| Integrations | None | None | Salesforce, HubSpot |
| Mobile | No | No | Yes |
| Notifications | Email | Email + in-app | Email + in-app + push |

### C.3.3 User Screens (Phase 1)

```
User Dashboard
├── Home
│   ├── Today's signals (top 5)
│   ├── SIVA quick input
│   └── Recent activity
├── SIVA
│   ├── Chat interface
│   ├── Conversation history (session)
│   └── Quick actions
├── Signals
│   ├── Signal list (filterable)
│   ├── Signal detail
│   └── Company link
├── Companies
│   ├── Company list
│   ├── Company profile
│   ├── Signal history
│   └── Contact suggestions
├── Scoring
│   ├── QTLE breakdown
│   └── Score history
└── Settings
    ├── Profile
    ├── Preferences
    └── Notifications
```

## C.4 User Type Definitions

### C.4.1 Three User Types

| Type | Definition | Context | Example |
|------|------------|---------|---------|
| **Individual User** | Solo salesperson, no tenant | Self-managed, personal account | Freelance sales rep |
| **Tenant User** | Salesperson within a company | Part of tenant organization | Sales rep at Acme Bank |
| **Tenant Admin** | Company admin managing team | Manages tenant users | Sales Manager at Acme Bank |

### C.4.2 Capability Matrix by User Type

| Capability | Individual | Tenant User | Tenant Admin |
|------------|------------|-------------|--------------|
| **SIVA Chat** | ✓ | ✓ | ✓ |
| **View Signals** | ✓ | ✓ | ✓ |
| **View Companies** | ✓ | ✓ | ✓ |
| **SIVA Outreach Drafting** | ✓ (drafts, user executes) | ✓ (drafts, user executes) | ✓ |
| **Configure Persona** | ✗ | ✗ | ✗ (Super Admin only) |
| **Create Campaigns** | ✗ | ✗ (Phase 3+) | ✓ (Phase 3+) |
| **Define Tone/Templates** | ✗ | ✗ | ✓ (with limits) |
| **Invite Users** | ✗ | ✗ | ✓ |
| **View Team Usage** | ✗ | ✗ | ✓ |
| **Manage Billing** | ✓ (own) | ✗ | ✓ |

### C.4.3 Outreach Clarification

> **Individual users DO need outreach assistance.** SIVA drafts emails/messages, user reviews and executes manually. This is NOT campaign automation (which is Phase 3+).

```
Individual User Outreach Flow:
1. User: "Help me reach out to Acme Corp"
2. SIVA: Drafts personalized email based on signals + context
3. User: Reviews, edits, copies to email client
4. User: Sends manually

NOT:
✗ Automated sending
✗ Campaign sequences
✗ Template libraries (for individuals)
✗ CRM sync (Phase 3)
```

## C.5 11 AI Departments (Super Admin)

**Super Admin is not just CRUD. It's an AI-powered control center.**

### C.5.1 AI Department Overview

| # | Department | Problem Solved | Phase |
|---|------------|----------------|-------|
| 1 | **AI Founder Brain** | "What should I prioritize?" | 3 |
| 2 | **AI CTO** | "Is our system healthy?" | 2 (lite), 3 (full) |
| 3 | **AI QA** | "What's broken?" | 2 (lite), 3 (full) |
| 4 | **AI PM** | "Are we shipping on time?" | 3 |
| 5 | **AI CRO** | "Are we making money?" | 3 |
| 6 | **AI Sales Coach** | "How do I improve user performance?" | 3 |
| 7 | **AI Data Scientist** | "What patterns exist?" | 3 |
| 8 | **AI CISO** | "Are we secure?" | 3 |
| 9 | **AI Marketing** | "How do we grow?" | 3 |
| 10 | **AI Customer Success** | "Who's at risk of churn?" | 3 |
| 11 | **AI CFO** | "What's our unit economics?" | 3 |

### C.5.2 AI Department Specifications

```
Each AI Department has:
├── Interface: Dashboard panel in Super Admin
├── Data: What it reads (events, logs, usage, etc.)
├── Triggers: What causes it to act
├── Authority: What decisions it can make
├── Output: What it produces
└── Phase: When it's available
```

#### AI CTO (Phase 2 Lite, Phase 3 Full)
| Aspect | Specification |
|--------|---------------|
| Interface | System Health Dashboard |
| Data | Error logs, latency metrics, API costs, deployment status |
| Triggers | Error spike, latency > threshold, cost anomaly |
| Authority | Alert only (no auto-remediation in Phase 2) |
| Output | Health report, alert notifications, root cause suggestions |

#### AI QA (Phase 2 Lite, Phase 3 Full)
| Aspect | Specification |
|--------|---------------|
| Interface | Quality Dashboard |
| Data | Bug reports, test coverage, user complaints |
| Triggers | Test failure, bug pattern, regression detected |
| Authority | Alert only |
| Output | Test recommendations, bug priority ranking |

#### AI Customer Success (Phase 3)
| Aspect | Specification |
|--------|---------------|
| Interface | Churn Prediction Dashboard |
| Data | User activity, SIVA usage, signal engagement |
| Triggers | Activity drop, low engagement, billing issues |
| Authority | Alert + suggest intervention |
| Output | Churn risk scores, intervention recommendations |

## C.6 Super Admin AI Orchestrator

**Beyond CRUD: Predictive + Prescriptive System**

### C.6.1 What AI Orchestrator Does

| Category | Capability |
|----------|------------|
| **Predict** | Churn risk, usage anomalies, cost spikes |
| **Prescribe** | "Adjust EB persona weight for X", "Signal Y is underperforming" |
| **Detect** | Broken signals, stale personas, configuration drift |
| **Alert** | Proactive notifications to Super Admin team |

### C.6.2 AI Orchestrator Examples

```
Example 1: Churn Prediction
├── AI detects: User X hasn't used SIVA in 14 days
├── AI checks: User's company still has active signals
├── AI prescribes: "Send re-engagement email, highlight new features"
└── Super Admin: Reviews and executes

Example 2: Signal Quality
├── AI detects: "hiring-expansion" signal has 20% false positive rate
├── AI checks: Source data vs user feedback
├── AI prescribes: "Adjust threshold or add validation rule"
└── Super Admin: Reviews and adjusts config

Example 3: Persona Drift
├── AI detects: EB persona edge cases haven't changed in 60 days
├── AI checks: New market conditions, user feedback
├── AI prescribes: "Review edge case X, may need update"
└── Super Admin: Reviews and updates persona
```

### C.6.3 AI Orchestrator Dashboard (Phase 3)

```
AI Orchestrator Dashboard
├── Health Score (overall platform)
├── Active Alerts
│   ├── Churn risk alerts
│   ├── Signal quality alerts
│   ├── Cost anomaly alerts
│   └── Security alerts
├── Recommendations
│   ├── Persona updates
│   ├── Config changes
│   └── User interventions
└── Trends
    ├── Usage patterns
    ├── Revenue trajectory
    └── Engagement metrics
```

## C.7 SIVA Omnipresence Rule

**"If there is a decision, SIVA sits on top of it."**

### C.7.1 SIVA on Every Surface

| Surface | SIVA Presence | What SIVA Does |
|---------|---------------|----------------|
| **User Dashboard** | Chat + Quick Input | Answers questions, prioritizes leads |
| **Company Profile** | Context Panel | "Ask SIVA about this company" |
| **Signal Detail** | Insight Widget | "SIVA, explain this signal" |
| **Tenant Admin** | Admin Assistant | "SIVA, who's underperforming?" |
| **Super Admin** | AI Orchestrator | "SIVA, what needs attention today?" |

### C.7.2 SIVA Per Role

```
User SIVA:
├── "Which leads should I focus on?"
├── "Brief me on Acme Corp"
├── "Draft an email to John at Acme"
└── "Why is this company scored high?"

Tenant Admin SIVA:
├── "Who on my team needs coaching?"
├── "What's our team's pipeline health?"
├── "Which signals are my team ignoring?"
└── "Generate team performance report"

Super Admin SIVA:
├── "What needs my attention today?"
├── "Which tenants are at churn risk?"
├── "Are there any broken signals?"
├── "What config changes should I make?"
└── "Show me platform health"
```

### C.7.3 SIVA Access Control

| SIVA Feature | User | Tenant Admin | Super Admin |
|--------------|------|--------------|-------------|
| Personal sales queries | ✓ | ✓ | ✓ |
| Team-level queries | ✗ | ✓ | ✓ |
| Tenant-level queries | ✗ | ✓ | ✓ |
| Platform-level queries | ✗ | ✗ | ✓ |
| Config recommendations | ✗ | ✗ | ✓ |

---

# SECTION D: TECHNICAL ARCHITECTURE

## D.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
├─────────────────────────────────────────────────────────────────┤
│  SaaS Frontend    │  Super Admin    │  Mobile App   │  SDK     │
│  (Vercel/Next.js) │  (Vercel)       │  (Phase 3)    │ (Phase 3)│
└────────┬──────────┴────────┬────────┴───────┬───────┴────┬─────┘
         │                   │                │            │
         └───────────────────┴────────────────┴────────────┘
                                    │
                            ┌───────┴───────┐
                            │   API Gateway  │
                            │  (Cloud Run)   │
                            └───────┬───────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
┌────────┴────────┐      ┌─────────┴─────────┐      ┌─────────┴─────────┐
│   UPR OS        │      │   SaaS API        │      │   Auth Service    │
│   (Cloud Run)   │      │   (Cloud Run)     │      │   (Auth0)         │
│                 │      │                   │      │                   │
│  - SIVA Engine  │      │  - User routes    │      │  - Authentication │
│  - Scoring      │      │  - Tenant routes  │      │  - Authorization  │
│  - Signals      │      │  - Admin routes   │      │  - SSO (Phase 3)  │
│  - Intelligence │      │  - Billing        │      │                   │
└────────┬────────┘      └─────────┬─────────┘      └───────────────────┘
         │                         │
         └────────────┬────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
┌────────┴────────┐      ┌────────┴────────┐
│   PostgreSQL    │      │    BigQuery     │
│   (Cloud SQL)   │      │   (Analytics)   │
│                 │      │                 │
│  - Users        │      │  - Events       │
│  - Tenants      │      │  - Usage        │
│  - Signals      │      │  - ML Features  │
│  - Companies    │      │  - Audit Logs   │
└─────────────────┘      └─────────────────┘
```

## D.2 Service Boundaries

| Service | Responsibility | Tech | Phase |
|---------|---------------|------|-------|
| **SaaS Frontend** | User-facing web app | Next.js 15, Vercel | 1 |
| **Super Admin** | Internal admin panel | Next.js 15, Vercel | 1 |
| **UPR OS** | Intelligence engine | Node.js, Cloud Run | 1 |
| **SaaS API** | User/tenant management | Next.js API, Vercel | 1 |
| **Auth Service** | Authentication | Auth0 | 1 |
| **Analytics** | Event processing | BigQuery | 1 |
| **Mobile API** | Mobile-specific routes | Cloud Run | 3 |
| **SDK Service** | External API | Cloud Run | 3 |

## D.3 Database Schema (Phase 1 Core Tables)

```sql
-- Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  vertical VARCHAR(50) NOT NULL,
  sub_vertical VARCHAR(50) NOT NULL,
  region VARCHAR(50) NOT NULL,
  plan VARCHAR(50) DEFAULT 'starter',
  stripe_customer_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  auth0_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'member', -- admin, member
  status VARCHAR(20) DEFAULT 'active',
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- SIVA Sessions
CREATE TABLE siva_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  message_count INT DEFAULT 0
);

-- SIVA Messages
CREATE TABLE siva_messages (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES siva_sessions(id),
  role VARCHAR(20) NOT NULL, -- user, assistant
  content TEXT NOT NULL,
  tool_calls JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- API Usage
CREATE TABLE api_usage (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  endpoint VARCHAR(255) NOT NULL,
  tokens_used INT DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Signals (per tenant view)
CREATE TABLE tenant_signals (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  company_id UUID NOT NULL,
  signal_type VARCHAR(100) NOT NULL,
  signal_data JSONB NOT NULL,
  score DECIMAL(5,2),
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## D.4 API Endpoints (Phase 1)

### User APIs
```
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/user/profile
PUT    /api/user/profile
GET    /api/user/settings
PUT    /api/user/settings
```

### SIVA APIs
```
POST   /api/siva/chat
GET    /api/siva/sessions
GET    /api/siva/sessions/:id/messages
POST   /api/siva/tools/:toolName
```

### Signal APIs
```
GET    /api/signals
GET    /api/signals/:id
PUT    /api/signals/:id/status
GET    /api/signals/stats
```

### Company APIs
```
GET    /api/companies
GET    /api/companies/:id
GET    /api/companies/:id/signals
GET    /api/companies/:id/contacts
```

### Tenant Admin APIs
```
GET    /api/admin/team
POST   /api/admin/team/invite
DELETE /api/admin/team/:userId
PUT    /api/admin/team/:userId/role
GET    /api/admin/usage
GET    /api/admin/billing
```

### Super Admin APIs
```
GET    /api/super/tenants
GET    /api/super/tenants/:id
POST   /api/super/tenants (demo only)
GET    /api/super/verticals
PUT    /api/super/verticals/:id
GET    /api/super/personas
PUT    /api/super/personas/:id
GET    /api/super/signals
GET    /api/super/costs
```

## D.5 Rate Limiting (Phase 1)

| Plan | SIVA Messages/day | API Calls/day | Cost Limit |
|------|-------------------|---------------|------------|
| Starter | 50 | 500 | $5 |
| Pro | 200 | 2000 | $25 |
| Enterprise | Unlimited | 10000 | $100 |

## D.6 SalesContext Layer

**The canonical layer that governs every reasoning pipeline in UPR OS.**

### D.6.1 What is SalesContext?

SalesContext is the **input contract** for all SIVA reasoning. Every tool, every score, every recommendation must receive SalesContext. Without it, SIVA cannot reason correctly.

```
MCP (12 phases) = Orchestration (HOW to reason)
SalesContext    = Input Contract (WHAT to reason about)

MCP reads SalesContext → Applies persona → Executes tools → Returns result
```

### D.6.2 SalesContext Schema

```typescript
interface SalesContext {
  // === CORE IDENTITY ===
  vertical: string;           // "banking"
  subVertical: string;        // "employee_banking"
  region: string;             // "UAE"

  // === DERIVED FROM SUB-VERTICAL ===
  radarTarget: "companies" | "individuals" | "families";
  allowedSignalTypes: string[];
  scoringWeights: {
    quality: number;    // 0-1
    timing: number;     // 0-1
    likelihood: number; // 0-1
    engagement: number; // 0-1
  };
  enrichmentSources: string[];
  outreachChannels: string[];

  // === PERSONA (loaded per sub-vertical) ===
  persona: {
    id: string;
    identity: string;
    edgeCases: EdgeCase[];
    timingRules: TimingRule[];
    contactPriority: ContactPriority[];
    outreachDoctrine: OutreachRule[];
    antiPatterns: string[];
  };

  // === TENANT/USER CONTEXT ===
  tenantId: string | null;    // null for individual users
  userId: string;
  userRole: "admin" | "member" | "individual";
  plan: "starter" | "pro" | "enterprise";

  // === SESSION CONTEXT ===
  sessionId: string;
  requestId: string;
  timestamp: Date;
}
```

### D.6.3 SalesContext Flow

```
User Request → API Gateway
                  ↓
            Build SalesContext
            (from user profile, tenant config, sub-vertical)
                  ↓
            Inject into MCP
                  ↓
            MCP Phase 1-12 execute with SalesContext
                  ↓
            Response with proper persona behavior
```

### D.6.4 Why SalesContext Matters

| Without SalesContext | With SalesContext |
|---------------------|-------------------|
| SIVA uses generic prompts | SIVA uses persona-specific prompts |
| Scoring is inconsistent | Scoring uses correct weights |
| Signals are unfiltered | Only allowed signals shown |
| Outreach is generic | Outreach follows doctrine |
| Edge cases ignored | Edge cases applied |

## D.7 Deep Intelligence Pack

**Auto-derivation of intelligence configuration per sub-vertical.**

### D.7.1 What is a Deep Intelligence Pack?

When Super Admin defines a sub-vertical, the system should **auto-derive** most of the configuration:

```
Super Admin inputs:
├── Vertical: Banking
├── Sub-Vertical: Employee Banking
├── Region: UAE
└── Minimal seed data

System auto-derives:
├── Relevant signal types
├── ICP (Ideal Customer Profile) types
├── Reasoning frameworks
├── Scoring rules
├── Enrichment sources
├── Outreach channels
└── Edge cases (suggestions)
```

### D.7.2 Deep Intelligence Pack Schema

```typescript
interface DeepIntelligencePack {
  id: string;
  subVerticalId: string;

  // === AUTO-DERIVED ===
  signals: {
    recommended: SignalType[];     // AI-suggested signals
    enabled: SignalType[];         // Admin-approved signals
    weights: Record<string, number>; // Signal importance
  };

  icpTypes: {
    recommended: ICPType[];        // AI-suggested ICP types
    enabled: ICPType[];            // Admin-approved ICP types
  };

  reasoningFrameworks: {
    scoringLogic: string;          // How to calculate QTLE
    prioritizationLogic: string;   // How to rank opportunities
    outreachLogic: string;         // How to craft messages
  };

  enrichment: {
    sources: EnrichmentSource[];   // Where to get data
    priority: string[];            // Order of preference
  };

  // === METADATA ===
  version: number;
  lastGenerated: Date;
  lastModified: Date;
  modifiedBy: string;
}
```

### D.7.3 Deep Intelligence Pack Generation

```
Step 1: Super Admin creates sub-vertical
           ↓
Step 2: System analyzes:
        - Industry patterns
        - Common signals for this sector
        - Typical ICP profiles
        - Best practices for outreach
           ↓
Step 3: AI generates recommended pack
           ↓
Step 4: Super Admin reviews & approves
           ↓
Step 5: Pack stored and versioned
           ↓
Step 6: Pack loaded into SalesContext at runtime
```

### D.7.4 Pack Refinement Loop

```
Usage Data → AI Analysis → Pack Suggestions → Super Admin Review → Update
     ↑                                                                |
     └────────────────────────────────────────────────────────────────┘
```

---

# SECTION E: AI ARCHITECTURE (SIVA)

## E.1 SIVA System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                      SIVA INTERFACE                              │
│  (Chat UI, Voice Input - Phase 2, Mobile - Phase 3)             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │  SIVA Gateway   │
                    │  (Message Router)│
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────┴────────┐ ┌────────┴────────┐ ┌────────┴────────┐
│  Context Layer  │ │   Tool Layer    │ │  Persona Layer  │
│                 │ │                 │ │                 │
│  - User context │ │  - Score tool   │ │  - Sub-vertical │
│  - Session      │ │  - Search tool  │ │  - Edge cases   │
│  - Tenant       │ │  - Prioritize   │ │  - Timing rules │
│  - Conversation │ │  - Outreach     │ │  - Contact prio │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                    ┌────────┴────────┐
                    │   LLM Router    │
                    │                 │
                    │  Claude Opus    │
                    │  Claude Sonnet  │
                    │  Claude Haiku   │
                    │  Gemini 2.0     │
                    └─────────────────┘
```

## E.2 SIVA Tools by Phase

### Phase 1 Tools
| Tool | Description | Input | Output |
|------|-------------|-------|--------|
| `score` | Calculate QTLE score | company_id | { score, breakdown } |
| `search` | Search companies/signals | query, filters | { results[] } |
| `prioritize` | Rank opportunities | criteria | { ranked[] } |
| `company_info` | Get company details | company_id | { company } |
| `signal_list` | Get user's signals | filters | { signals[] } |

### Phase 2 Tools (Added)
| Tool | Description |
|------|-------------|
| `daily_briefing` | Generate personalized briefing |
| `pattern_detect` | Find opportunity patterns |
| `contact_intel` | Decision maker intelligence |
| `outreach_draft` | Draft outreach messages |
| `objection_handle` | Objection handling suggestions |

### Phase 3 Tools (Added)
| Tool | Description |
|------|-------------|
| `crm_sync` | Sync with Salesforce/HubSpot |
| `calendar_check` | Check optimal meeting times |
| `meeting_book` | Book meetings directly |
| `pipeline_update` | Update deal stage |

## E.3 SIVA Context Schema

```typescript
interface SIVAContext {
  // User Context
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'member';
  };

  // Tenant Context
  tenant: {
    id: string;
    name: string;
    vertical: string;
    subVertical: string;
    region: string;
    plan: string;
  };

  // Persona Context (loaded per sub-vertical)
  persona: {
    identity: string;
    edgeCases: EdgeCase[];
    timingRules: TimingRule[];
    contactPriority: ContactPriority[];
    outreachDoctrine: OutreachRule[];
    antiPatterns: string[];
  };

  // Session Context
  session: {
    id: string;
    messageCount: number;
    lastMessage: string;
    startedAt: Date;
  };

  // Phase 2+: Conversation Memory
  memory?: {
    recentCompanies: string[];
    recentSignals: string[];
    userPreferences: Record<string, any>;
  };
}
```

## E.4 SIVA Prompt Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     SYSTEM PROMPT                                │
├─────────────────────────────────────────────────────────────────┤
│  1. Identity: "You are SIVA, Sales Intelligence Virtual         │
│     Assistant for {user.name} at {tenant.name}"                 │
│                                                                  │
│  2. Context: Vertical={vertical}, Sub-vertical={subVertical},   │
│     Region={region}                                              │
│                                                                  │
│  3. Persona: {persona.identity}                                  │
│     - Edge Cases: {persona.edgeCases}                           │
│     - Timing Rules: {persona.timingRules}                       │
│     - Anti-Patterns: {persona.antiPatterns}                     │
│                                                                  │
│  4. Available Tools: {toolList}                                 │
│                                                                  │
│  5. Constraints:                                                 │
│     - Only discuss sales-related topics                         │
│     - Never make up company data                                │
│     - Always cite sources when available (Phase 2+)             │
│     - Respect rate limits                                       │
└─────────────────────────────────────────────────────────────────┘
```

## E.5 LLM Model Selection

| Task | Model | Reason |
|------|-------|--------|
| Complex reasoning | Claude Opus | Best quality |
| Standard chat | Claude Sonnet | Balance |
| Quick queries | Claude Haiku | Speed + cost |
| Multimodal | Gemini 2.0 | Image/doc analysis |

## E.6 SIVA Evolution Path

| Phase | SIVA Capability |
|-------|-----------------|
| **Phase 1** | Text chat, basic tools, session memory |
| **Phase 2** | Proactive alerts, citations, long-term memory, voice input |
| **Phase 3** | Mobile, CRM integrations, SDK |
| **Phase 4** | SLM (fine-tuned model), voice device |
| **Phase 5** | "Hey SIVA" wake word, open-source SLM |

---

# SECTION F: DATA MODEL & EVENTS

## F.1 BigQuery Event Schema

```sql
-- Core events table
CREATE TABLE events.user_events (
  event_id STRING NOT NULL,
  event_name STRING NOT NULL,
  event_timestamp TIMESTAMP NOT NULL,

  -- User dimensions
  user_id STRING,
  tenant_id STRING,
  session_id STRING,

  -- Event properties
  properties JSON,

  -- Context
  vertical STRING,
  sub_vertical STRING,
  region STRING,
  plan STRING,

  -- Technical
  client_type STRING, -- web, mobile, sdk
  client_version STRING,
  ip_address STRING,
  user_agent STRING
);
```

## F.2 Event Taxonomy (Phase 1)

### User Journey Events
| Event | Properties | Trigger |
|-------|------------|---------|
| `user.signed_up` | { method, source } | Registration complete |
| `user.logged_in` | { method } | Login success |
| `user.onboarding_started` | {} | Started onboarding |
| `user.onboarding_completed` | { duration_seconds } | Finished onboarding |
| `user.churned` | { last_active_at } | 30 days inactive |

### SIVA Events
| Event | Properties | Trigger |
|-------|------------|---------|
| `siva.session_started` | {} | Chat opened |
| `siva.message_sent` | { message_length } | User sent message |
| `siva.response_received` | { response_length, tokens, latency_ms } | SIVA responded |
| `siva.tool_used` | { tool_name, success } | Tool executed |
| `siva.session_ended` | { message_count, duration_seconds } | Chat closed |

### Signal Events
| Event | Properties | Trigger |
|-------|------------|---------|
| `signal.viewed` | { signal_id, signal_type } | Signal detail opened |
| `signal.dismissed` | { signal_id, reason } | User dismissed |
| `signal.actioned` | { signal_id, action_type } | User took action |

### Billing Events
| Event | Properties | Trigger |
|-------|------------|---------|
| `billing.subscription_created` | { plan, price } | Subscription started |
| `billing.subscription_upgraded` | { from_plan, to_plan } | Plan upgraded |
| `billing.subscription_cancelled` | { reason } | Cancelled |
| `billing.payment_failed` | { error } | Payment failed |

## F.3 Analytics Dashboards (Phase 1)

### User Metrics
- Daily/Weekly/Monthly Active Users
- User retention (D1, D7, D30)
- Onboarding completion rate
- Time to first value

### SIVA Metrics
- Messages per user per day
- Tool usage distribution
- Response latency (p50, p95, p99)
- Session duration

### Business Metrics
- MRR / ARR
- Customer count by plan
- Churn rate
- LTV / CAC

---

# SECTION G: ANTI-GOALS & CONSTRAINTS

## G.1 Phase 1 Anti-Goals (DO NOT BUILD)

| Category | Anti-Goal | Reason |
|----------|-----------|--------|
| **Verticals** | Insurance, Real Estate, Recruitment, SaaS | Banking first |
| **SIVA** | Voice input | Phase 2 |
| **SIVA** | Proactive alerts | Phase 2 |
| **SIVA** | Long-term memory | Phase 2 |
| **SIVA** | SDK/API for external use | Phase 3 |
| **Intelligence** | ML-based scoring | Phase 2 |
| **Intelligence** | Knowledge graph | Phase 2 |
| **Intelligence** | Pattern detection | Phase 2 |
| **Mobile** | Native app | Phase 3 |
| **Enterprise** | SSO (SAML/OIDC) | Phase 3 |
| **Enterprise** | Custom RBAC | Phase 3 |
| **Enterprise** | Audit logs | Phase 3 |
| **Compliance** | SOC2 | Phase 3 |
| **Integrations** | Salesforce, HubSpot | Phase 3 |
| **Super Admin** | Full AI departments | Phase 3 |
| **Super Admin** | White-label | Phase 3 |

## G.2 Phase 2 Anti-Goals (DO NOT BUILD)

| Category | Anti-Goal | Reason |
|----------|-----------|--------|
| **Verticals** | More than Banking expansion | Phase 4 |
| **SIVA** | SDK | Phase 3 |
| **SIVA** | Mobile voice | Phase 3 |
| **Mobile** | Native app | Phase 3 |
| **Enterprise** | Bulk import | Phase 3 |
| **Compliance** | SOC2 certification | Phase 3 |
| **SLM** | Fine-tuned model | Phase 4 |

## G.3 Global Constraints

### Technical Constraints
| Constraint | Rule |
|------------|------|
| Multi-tenancy | All data tenant-scoped, RLS enforced |
| Rate limits | Enforced per plan tier |
| Data retention | 90 days for free, 1 year for paid |
| API versioning | Required from Phase 3 |

### Business Constraints
| Constraint | Rule |
|------------|------|
| Vertical creation | Super Admin ONLY |
| Sub-vertical creation | Super Admin ONLY |
| Region creation | Super Admin ONLY |
| Pricing changes | Super Admin ONLY |
| Custom contracts | Phase 3+ |

### SIVA Constraints
| Constraint | Rule |
|------------|------|
| Topics | Sales-related only |
| Data fabrication | Never make up data |
| Rate limits | Per plan tier |
| Tool access | Based on plan |
| Memory | Session only (Phase 1), Long-term (Phase 2+) |

## G.4 Permission Matrix

```
                          Super Admin | Tenant Admin | User
─────────────────────────────────────────────────────────────
Create vertical                 ✓     |      ✗      |  ✗
Create sub-vertical             ✓     |      ✗      |  ✗
Create region                   ✓     |      ✗      |  ✗
Create persona pack             ✓     |      ✗      |  ✗
Create signal pack              ✓     |      ✗      |  ✗
View all tenants                ✓     |      ✗      |  ✗
Create demo tenant              ✓     |      ✗      |  ✗
─────────────────────────────────────────────────────────────
Select vertical                 ✓     |      ✓      |  ✗
Select sub-vertical             ✓     |      ✓      |  ✗
Select region                   ✓     |      ✓      |  ✗
Invite users                    ✓     |      ✓      |  ✗
Remove users                    ✓     |      ✓      |  ✗
View team usage                 ✓     |      ✓      |  ✗
Manage billing                  ✓     |      ✓      |  ✗
─────────────────────────────────────────────────────────────
Use SIVA                        ✓     |      ✓      |  ✓
View signals                    ✓     |      ✓      |  ✓
View companies                  ✓     |      ✓      |  ✓
Update profile                  ✓     |      ✓      |  ✓
```

---

# SECTION H: EVIDENCE SYSTEM

**"Every SIVA output MUST include citations. No black box answers."**

## H.1 Evidence Flow

```
Signal → Evidence → Reasoning → Output
  ↓         ↓          ↓          ↓
Raw event  Weighted   AI logic   User sees
from source + scored   + persona  + citations
```

## H.2 Evidence Schema

```typescript
interface Evidence {
  id: string;
  sourceSignalId: string;
  sourceType: "linkedin" | "news" | "company_data" | "crm" | "hiring_platform";

  // === WEIGHTING ===
  weight: number;       // 0-1, how important this evidence is
  confidence: number;   // 0-1, how reliable the source is

  // === FRESHNESS ===
  capturedAt: Date;
  freshnessScore: number;  // Decays over time (1.0 → 0.0)
  expiresAt: Date;         // When evidence becomes stale

  // === PROVENANCE ===
  url?: string;            // Source URL if available
  rawPayload: Record<string, any>;  // Original data
  extractedFacts: string[];         // Key facts extracted

  // === LINKING ===
  companyId: string;
  contactId?: string;
  relatedEvidenceIds: string[];  // Connected evidence pieces
}
```

## H.3 Reasoning Chain

```typescript
interface Reasoning {
  id: string;
  evidenceIds: string[];  // What evidence was used
  personaId: string;      // Which persona rules applied

  // === CHAIN OF THOUGHT ===
  steps: {
    step: number;
    description: string;
    evidenceUsed: string[];
    conclusion: string;
  }[];

  // === OUTPUT ===
  finalScore: number;
  recommendation: string;
  citations: Citation[];
}

interface Citation {
  text: string;          // "Based on LinkedIn hiring data..."
  evidenceId: string;
  sourceUrl?: string;
  freshnessLabel: string; // "2 days ago", "1 hour ago"
}
```

## H.4 SIVA Citation Output Format

```
SIVA: "You should call Acme Corp today."

📊 Based on:
• LinkedIn: 12 new hires in past 30 days (2 days ago) [source]
• News: Series B announced yesterday (1 day ago) [source]
• Your history: Last contact 45 days ago (CRM)

Score: 87/100 (Q:25 T:22 L:20 E:20)
```

## H.5 Evidence Freshness Rules

| Source Type | Fresh (1.0) | Stale (0.5) | Expired (0.0) |
|-------------|-------------|-------------|---------------|
| Hiring data | < 7 days | 7-30 days | > 30 days |
| News | < 3 days | 3-14 days | > 14 days |
| LinkedIn | < 30 days | 30-90 days | > 90 days |
| Company data | < 90 days | 90-180 days | > 180 days |
| CRM data | < 7 days | 7-30 days | > 30 days |

## H.6 Evidence Quality Score

```typescript
function calculateEvidenceQuality(evidence: Evidence): number {
  const freshnessWeight = 0.3;
  const confidenceWeight = 0.4;
  const sourceWeight = 0.3;

  const sourceScore = SOURCE_RELIABILITY[evidence.sourceType]; // 0-1

  return (
    evidence.freshnessScore * freshnessWeight +
    evidence.confidence * confidenceWeight +
    sourceScore * sourceWeight
  );
}
```

---

# SECTION I: PACK STORAGE MODEL

**Hierarchical pack system with inheritance and override capabilities.**

## I.1 Pack Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                    SYSTEM PACKS                         │
│  (Super Admin controlled, read-only for tenants)        │
├─────────────────────────────────────────────────────────┤
│  VerticalPack: banking                                  │
│  ├── SubVerticalPack: employee_banking                  │
│  │   ├── PersonaPack (default EB persona)               │
│  │   ├── SignalPack (allowed signals)                   │
│  │   ├── ScoringPack (QTLE weights)                     │
│  │   └── OutreachPack (channels, templates)             │
│  ├── SubVerticalPack: corporate_banking                 │
│  │   └── ... (same structure)                           │
│  └── SubVerticalPack: sme_banking                       │
│      └── ... (same structure)                           │
└─────────────────────────────────────────────────────────┘
                          ↓ inherits
┌─────────────────────────────────────────────────────────┐
│                  TENANT OVERRIDE PACKS                  │
│  (Tenant Admin controlled, extends system packs)        │
├─────────────────────────────────────────────────────────┤
│  TenantPersonaOverride                                  │
│  ├── base: system.employee_banking.persona              │
│  ├── overrides: { tone: "more aggressive" }             │
│  └── additions: { customEdgeCases: [...] }              │
└─────────────────────────────────────────────────────────┘
```

## I.2 Pack Schema

```typescript
interface Pack {
  id: string;
  type: "vertical" | "sub_vertical" | "persona" | "signal" | "scoring" | "outreach";
  scope: "system" | "tenant";

  // Inheritance
  parentPackId?: string;     // null for root packs

  // Versioning
  version: number;
  isActive: boolean;

  // Content
  config: Record<string, any>;

  // Metadata
  createdAt: Date;
  createdBy: string;
  modifiedAt: Date;
  modifiedBy: string;

  // Scoping
  tenantId?: string;         // null for system packs
}

interface PersonaPack extends Pack {
  type: "persona";
  config: {
    identity: string;
    edgeCases: EdgeCase[];
    timingRules: TimingRule[];
    contactPriority: ContactPriority[];
    outreachDoctrine: OutreachRule[];
    antiPatterns: string[];
  };
}

interface SignalPack extends Pack {
  type: "signal";
  config: {
    allowedSignalTypes: string[];
    signalWeights: Record<string, number>;
    signalThresholds: Record<string, number>;
  };
}

interface ScoringPack extends Pack {
  type: "scoring";
  config: {
    qtleWeights: {
      quality: number;
      timing: number;
      likelihood: number;
      engagement: number;
    };
    thresholds: {
      hot: number;      // >= 80
      warm: number;     // >= 60
      cold: number;     // >= 0
    };
  };
}
```

## I.3 Pack Resolution

```
When loading context for a user:

1. Identify user's sub-vertical
2. Load system sub-vertical pack
3. Check for tenant override pack
4. Merge: tenant overrides > system defaults
5. Return resolved pack
```

```typescript
function resolvePack(tenantId: string, subVerticalId: string): ResolvedPack {
  const systemPack = loadSystemPack(subVerticalId);
  const tenantOverride = loadTenantOverride(tenantId, subVerticalId);

  if (!tenantOverride) {
    return systemPack;
  }

  return deepMerge(systemPack, tenantOverride);
}
```

## I.4 Pack Management Rules

| Action | Super Admin | Tenant Admin | User |
|--------|-------------|--------------|------|
| Create system pack | ✓ | ✗ | ✗ |
| Edit system pack | ✓ | ✗ | ✗ |
| Delete system pack | ✓ | ✗ | ✗ |
| Create tenant override | ✗ | ✓ (limited) | ✗ |
| Edit tenant override | ✗ | ✓ (limited) | ✗ |
| View packs | ✓ | ✓ (own) | ✗ |

---

# SECTION J: TENANT ARCHITECTURE

**Multi-tenant provisioning with sub-vertical flexibility.**

## J.1 Tenant Model

```typescript
interface Tenant {
  id: string;
  name: string;
  slug: string;

  // Subscription
  plan: "starter" | "pro" | "enterprise";
  stripeCustomerId: string;
  status: "active" | "suspended" | "cancelled";

  // Configuration
  primaryVertical: string;           // e.g., "banking"
  primaryRegion: string;             // e.g., "UAE"

  // Multi sub-vertical support
  subVerticals: TenantSubVertical[]; // Can have multiple!

  // Metadata
  createdAt: Date;
  createdBy: string;
}

interface TenantSubVertical {
  id: string;
  tenantId: string;
  subVerticalId: string;             // e.g., "employee_banking"

  // Override packs
  personaOverridePackId?: string;
  scoringOverridePackId?: string;

  // Status
  enabled: boolean;
  isPrimary: boolean;                // One must be primary

  // Users assigned to this sub-vertical
  userAssignments: string[];         // User IDs
}
```

## J.2 Multi Sub-Vertical Support

**Yes, tenants CAN have multiple sub-verticals!**

| Scenario | Supported? | Example |
|----------|------------|---------|
| Single sub-vertical | ✓ | Tenant uses only EB |
| Multiple sub-verticals | ✓ | Tenant uses EB + CB |
| Users across sub-verticals | ✓ | User A = EB, User B = CB |
| User in multiple sub-verticals | ✓ | User A = EB + CB |
| Switch primary sub-vertical | ✓ | EB → CB as primary |

## J.3 User Sub-Vertical Assignment

```typescript
interface TenantUser {
  id: string;
  tenantId: string;
  email: string;
  role: "admin" | "member";

  // Sub-vertical assignments
  subVerticalAssignments: {
    subVerticalId: string;
    isPrimary: boolean;    // User's default context
    assignedAt: Date;
  }[];
}
```

## J.4 Sub-Vertical Switching

When a user is assigned to multiple sub-verticals:

```
User Interface:
┌─────────────────────────────────────┐
│ Current Context: Employee Banking ▼ │
├─────────────────────────────────────┤
│ ○ Employee Banking (primary)        │
│ ○ Corporate Banking                 │
│ ○ SME Banking                       │
└─────────────────────────────────────┘
```

```typescript
// API endpoint
PUT /api/user/context
{
  "subVerticalId": "corporate_banking"
}

// Effect:
// - SalesContext rebuilds with new sub-vertical
// - Persona changes
// - Allowed signals change
// - SIVA behavior changes
```

## J.5 Tenant Provisioning Flow

```
Step 1: Tenant signup
           ↓
Step 2: Select primary vertical (e.g., Banking)
           ↓
Step 3: Select primary sub-vertical (e.g., EB)
           ↓
Step 4: Select region (e.g., UAE)
           ↓
Step 5: System creates:
        - Tenant record
        - TenantSubVertical (EB + UAE)
        - Admin user with EB assignment
           ↓
Step 6: Later, admin can ADD more sub-verticals
        (if plan allows)
```

## J.6 Sub-Vertical Removal

When a sub-vertical is removed from tenant:

```
1. Check for assigned users
2. Reassign users to another sub-vertical OR
3. Prompt admin to handle users first
4. Archive (not delete) sub-vertical data
5. Historical data remains accessible
```

## J.7 Plan Limits

| Plan | Max Sub-Verticals | Max Users per Sub-Vertical |
|------|-------------------|----------------------------|
| Starter | 1 | 5 |
| Pro | 3 | 25 |
| Enterprise | Unlimited | Unlimited |

---

# APPENDIX A: PRICING TIERS (Phase 1)

| Tier | Price | Users | SIVA | Signals | Support |
|------|-------|-------|------|---------|---------|
| **Starter** | $49/user/mo | 1-5 | Basic | 100/mo | Email |
| **Pro** | $99/user/mo | 1-25 | Pro | 500/mo | Email + Chat |
| **Enterprise** | Custom | Unlimited | Full | Unlimited | Dedicated |

---

# APPENDIX B: SPRINT ALLOCATION

## Phase 1: S133-S152 (20 sprints)

| Sprint | Focus | Repo |
|--------|-------|------|
| S133 | Stealth mode polish | SaaS |
| S134 | User onboarding | SaaS |
| S135 | User journey | SaaS |
| S136 | Dashboard v2 | SaaS |
| S137 | SIVA chat UI | SaaS |
| S138 | Signal display | SaaS |
| S139 | Company profiles | SaaS |
| S140 | Scoring UI | SaaS |
| S141 | Auth & RBAC | SaaS |
| S142 | Billing (Stripe) | SaaS |
| S143 | SIVA tools v1 | OS |
| S144 | Banking intelligence | OS |
| S145 | Signal pipeline v2 | OS |
| S146 | API hardening | OS |
| S147 | Super Admin core | SA |
| S148 | Persona management | SA |
| S149 | Tenant Admin MVP | SaaS |
| S150 | E2E testing | All |
| S151 | Performance | All |
| S152 | Launch prep | All |

---

# APPENDIX C: GLOSSARY

| Term | Definition |
|------|------------|
| **SIVA** | Sales Intelligence Virtual Assistant |
| **SLM** | Sales Language Model (fine-tuned AI) |
| **QTLE** | Quality, Timing, Likelihood, Engagement (scoring) |
| **Vertical** | Industry sector (Banking, Insurance, etc.) |
| **Sub-Vertical** | Role within vertical (EB, CB, SME) |
| **Persona** | AI behavior configuration per sub-vertical |
| **Signal** | Sales opportunity trigger event |
| **UPR OS** | Unified PremiumRadar Operating System (backend) |
| **Tenant** | Customer organization using PremiumRadar |

---

# DOCUMENT CONTROL

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-07 | TC | Initial unified PRD |
| 2.0 | 2025-12-08 | TC | 12-point founder review integration |

### Version 2.0 Changes (12-Point Review)

| Point | Gap | Resolution |
|-------|-----|------------|
| 1 | Vertical definition | CONFIRMED - vertical = salesperson's context |
| 2 | SalesContext Layer missing | ADDED - Section D.6 |
| 3 | Deep Intelligence Pack missing | ADDED - Section D.7 |
| 4 | Phase 1 overloaded | TRIMMED - EB + UAE focus only |
| 5 | User types unclear | ADDED - Section C.4 |
| 6 | AI Departments undefined | ADDED - Section C.5 |
| 7 | AI Orchestrator missing | ADDED - Section C.6 |
| 8 | SIVA Omnipresence missing | ADDED - Section C.7 |
| 9 | Tenant provisioning unclear | ADDED - Section J |
| 10 | Pack storage undefined | ADDED - Section I |
| 11 | JTBD missing | ADDED - Section A.7 |
| 12 | Evidence system missing | ADDED - Section H |

---

**END OF MASTER PRD v2.0**

**This document is the single source of truth for PremiumRadar development.**
