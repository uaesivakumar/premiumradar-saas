# PREMIUMRADAR SUPER ADMIN: AI COMMAND CENTER
## Master Product Requirements Document (PRD)
### Version 1.0 | December 2025 | $1B Vision

---

## Executive Summary

**What we're building:** Not a dashboard. An **Autonomous AI Operating System** where:
- **You** = CEO with 300 AI specialists
- **Super Admin** = Your Command Center (like AWS Console + HubSpot + OpenAI Playground + Stripe)
- **SIVA** = The AI brain that orchestrates everything

**The Vision:**
> "In the future, every salesperson in the world will say: 'Hi SIVA, tell me what to do today.'"

**Architecture Philosophy:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PREMIUMRADAR AI OS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   SUPER ADMIN (You - Root Access)                                          │
│   └── Controls: Verticals, APIs, Tenants, Pricing, AI Behavior             │
│                                                                             │
│   TENANT ADMIN (Emirates NBD, ADCB, HSBC)                                  │
│   └── Controls: Their workspace, campaigns, teams, users                   │
│                                                                             │
│   USERS (Salespeople, RMs)                                                 │
│   └── Controls: Their daily AI-assisted work                               │
│                                                                             │
│   SIVA (Three Contexts)                                                    │
│   └── Super Admin SIVA: Predicts, optimizes, alerts YOU                   │
│   └── Tenant Admin SIVA: Helps enterprise admins                          │
│   └── User SIVA: Helps salespeople sell                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Table of Contents

1. [Product Vision & Positioning](#1-product-vision--positioning)
2. [User Types & Permissions](#2-user-types--permissions)
3. [The 10 AI Departments](#3-the-10-ai-departments)
4. [Department Details](#4-department-details)
5. [SIVA Super Admin Brain](#5-siva-super-admin-brain)
6. [The $1B Path](#6-the-1b-path)
7. [Implementation Phases](#7-implementation-phases)
8. [Technology Stack](#8-technology-stack)
9. [Phase Roadmap](#9-phase-roadmap)

---

## 1. Product Vision & Positioning

PremiumRadar is NOT a sales tool. It is NOT a CRM add-on. It is NOT a lead finder.

**It is a Sales Operating System powered by SIVA (Sales Intelligence Virtual Assistant).**

### What Super Admin Controls

This panel must allow you to:
- Onboard 1 tenant
- Onboard Emirates NBD (5,000 users)
- Onboard 1000 banks, insurers, real estate groups
- Manage thousands of verticals/sub-verticals
- Swap APIs dynamically
- Track cost per API
- Track AI usage per tenant
- Generate AI personas per tenant
- Allow tenant admins to customize their experience
- Allow enterprise users to use only their namespace

**And do it without you coding anything.**

---

## 2. User Types & Permissions

### Authority Hierarchy

```
Super Admin (You)
├── Controls the OS itself
├── FULL authority over everything
│
├── Tenant Admin (Emirates NBD admin, ADCB admin)
│   ├── Controls their workspace ONLY
│   ├── Cannot touch global settings
│   │
│   └── Tenant Users (RMs, Salespeople)
│       └── Controls their daily work only
```

### Super Admin Controls (Non-Negotiable)

| Control | Description |
|---------|-------------|
| Verticals | Add/remove verticals |
| Sub-verticals | Add/remove sub-verticals |
| Entity Types | Define per vertical (Company/Individual/Candidate) |
| Signal Libraries | Create global signal libraries |
| AI Behavior | Define rules for each vertical/sub-vertical |
| API Providers | Manage SERP, Apollo, Hunter, NeverBounce, etc. |
| Tenant Assignment | Assign tenants to verticals |
| Force Updates | Security patches, model upgrades |
| Personas | Control allowed personas, templates |
| Pricing | Control plans, usage limits, quotas |
| Approvals | Approve risky changes |
| Knowledge | Multi-tenant RAG knowledge sources |

### Enterprise Admin Controls (Tenant Scope Only)

**Allowed:**
- Upload their own campaigns
- Define their AI persona tone
- Add their own internal keywords
- Create sub-vertical style teams (within their tenant)
- Invite users / assign roles
- Set outreach templates
- Add internal enrichment rules
- Upload territory rules

**Restricted by Design:**
- ❌ Cannot create new global verticals
- ❌ Cannot touch signals
- ❌ Cannot modify scoring engines
- ❌ Cannot interact with system-wide APIs
- ❌ Cannot change SIVA global behavior

---

## 3. The 10 AI Departments

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN: AI COMMAND CENTER                           │
│                    "300 Autonomous AI Specialists"                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │ 1. TENANT OPS        │  │ 2. VERTICAL ENGINE   │  │ 3. API GOVERNOR  │  │
│  │    (40 AI)           │  │    (35 AI)           │  │    (30 AI)       │  │
│  │                      │  │                      │  │                  │  │
│  │ • Onboard 1 user     │  │ • Create verticals   │  │ • Route APIs     │  │
│  │ • Onboard 5000 users │  │ • Generate signals   │  │ • Track costs    │  │
│  │ • Multi-tenant mgmt  │  │ • Build personas     │  │ • Auto-failover  │  │
│  │ • Namespace isolation│  │ • Score calibration  │  │ • Per-tenant $   │  │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────┘  │
│                                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │ 4. AI/ML ENGINE      │  │ 5. REVENUE OPS       │  │ 6. SECURITY OPS  │  │
│  │    (50 AI)           │  │    (35 AI)           │  │    (30 AI)       │  │
│  │                      │  │                      │  │                  │  │
│  │ • SIVA orchestration │  │ • Billing engine     │  │ • Tenant isolate │  │
│  │ • Vertex AI models   │  │ • Usage metering     │  │ • API key vault  │  │
│  │ • Conversion predict │  │ • Churn prediction   │  │ • Audit logs     │  │
│  │ • Signal tuning      │  │ • Upsell detection   │  │ • Compliance     │  │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────┘  │
│                                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │ 7. ANALYTICS HQ      │  │ 8. DEVOPS CENTER     │  │ 9. CAMPAIGN LAB  │  │
│  │    (40 AI)           │  │    (25 AI)           │  │    (10 AI)       │  │
│  │                      │  │                      │  │                  │  │
│  │ • BigQuery pipeline  │  │ • Deploy manager     │  │ • A/B testing    │  │
│  │ • Drop-off heatmaps  │  │ • Health monitors    │  │ • Template lib   │  │
│  │ • Conversion funnels │  │ • Auto-scaling       │  │ • Version ctrl   │  │
│  │ • Tenant benchmarks  │  │ • Incident response  │  │ • Compliance     │  │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────┘  │
│                                                                             │
│  ┌──────────────────────┐                                                   │
│  │ 10. GROWTH INTEL     │     TOTAL: 300 AI SPECIALISTS                    │
│  │     (5 AI)           │     COVERAGE: 24/7/365 AUTONOMOUS                │
│  │                      │     ORCHESTRATION: SIVA SUPER ADMIN              │
│  │ • Market expansion   │                                                   │
│  │ • Competitor watch   │                                                   │
│  │ • $1B path tracker   │                                                   │
│  └──────────────────────┘                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Department Details

### Department 1: TENANT OPS (Multi-Tenant Brain)

**Tenant Hierarchy:**
```
Super Admin (You)
├── Tenant: Emirates NBD (5,000 users)
│   ├── Admin: enbd-admin@emiratesnbd.com
│   ├── Teams: Employee Banking, Corporate, Priority
│   └── Users: 5,000 RMs
├── Tenant: ADCB (2,000 users)
│   ├── Admin: admin@adcb.com
│   └── Users: 2,000 RMs
├── Tenant: Individual Users (10,000)
│   └── Self-serve, no admin
└── Tenant: Demo Accounts (unlimited)
    └── Sales demos, trials
```

**AI Capabilities:**

| Action | AI Does | You See |
|--------|---------|---------|
| Onboard 1 user | Auto-provision namespace | "User ready" |
| Onboard Emirates NBD | Create tenant, teams, import 5000 users | "Tenant ready in 2 min" |
| Onboard 1000 banks | Batch import, AI-validates data | Progress dashboard |
| Tenant isolation | Namespace separation, data walls | Security status green |

---

### Department 2: VERTICAL ENGINE (No Hard-Code Zone)

**The Golden Rule:**
```
EVERYTHING IS CONFIGURABLE. NOTHING IS HARD-CODED.

✅ Editable in Super Admin:
├── Vertical definitions
├── Sub-vertical definitions
├── Entity types (Company/Individual/Candidate)
├── Signals per vertical
├── Evidence types
├── Discovery prompts
├── Persona prompts
├── Outreach templates
├── Scoring rules
├── Freshness logic
└── Regional variations
```

**AI Vertical Generator:**
```
You: "Create vertical for Recruitment - Tech Talent in UAE"

SIVA: "Creating Recruitment - Tech Talent...
  ✓ Researched tech hiring market UAE
  ✓ Generated 8 signal types (hiring velocity, skill demand...)
  ✓ Created persona: Tech Recruiter
  ✓ Set entity type: Candidate
  ✓ Generated scoring model

  [Preview] [Edit] [Deploy to Staging] [Go Live]"
```

---

### Department 3: API GOVERNANCE ENGINE (Cost Control Brain)

**The Unified API Manager:**

| Category | Primary | Backup | Fallback |
|----------|---------|--------|----------|
| Enrichment | Apollo.io | Clearbit | EnrichmentHunter |
| Search | SERP API | Bing Search | - |
| Email Verify | NeverBounce | ZeroBounce | - |
| AI/LLM | Anthropic Claude | OpenAI GPT-4 | Vertex AI |

**Auto-Optimization Features:**
- Switches to backup provider when primary exceeds quota
- Routes to cheapest provider maintaining quality threshold
- Alerts on cost spikes before budget exceeded
- Per-tenant cost tracking and billing

**Tenant Admin View (What They See):**
- "Email verification enabled: yes/no"
- "Enrichment type: standard/premium"
- "Data source priority: global default"

**Cost Protection:** Tenant NEVER sees actual API keys.

---

### Department 4: AI/ML ENGINE (Vertex AI Powered)

**Models in Production:**

| Model | Type | Purpose |
|-------|------|---------|
| conversion-predictor-v2 | Vertex AI | Predict lead conversion |
| churn-detector-v1 | Vertex AI | Predict tenant churn |
| signal-quality-scorer | BigQuery ML | Score signal effectiveness |
| lead-ranker-v3 | Custom | Rank leads by potential |
| outreach-optimizer | Vertex AI | Optimize outreach timing |

**SIVA Context Stack:**

| SIVA Context | Model Stack | Avg Response | Cost/Call |
|--------------|-------------|--------------|-----------|
| Super Admin SIVA | Claude Opus + Vertex | 2.1s | $0.08 |
| Tenant Admin SIVA | Claude Sonnet + BigQuery | 1.4s | $0.03 |
| User SIVA | Claude Haiku + Cache | 0.8s | $0.01 |

---

### Department 5: REVENUE OPS (Monetization Brain)

**Pricing Tiers:**

| Tier | Price | Leads | Features |
|------|-------|-------|----------|
| **Individual** | | | |
| Starter | $49/mo | 500 | Basic SIVA |
| Pro | $149/mo | 2000 | Full SIVA + Analytics |
| Expert | $349/mo | Unlimited | Priority + Custom Persona |
| **Enterprise** | | | |
| Team | $29/user | Min 10 | Admin Panel |
| Business | $49/user | Min 50 | Full Analytics + Campaigns |
| Enterprise | Custom | Min 500 | Dedicated SIVA + SLA |

**Usage-Based Add-Ons:**

| Add-On | Price | Description |
|--------|-------|-------------|
| Premium Enrichment | $0.10/lead | Apollo-quality data |
| Deep Research | $0.25/lead | Full company intelligence |
| Custom AI Training | $500/mo | Tenant-specific SIVA |
| API Access | $0.01/call | Programmatic access |

---

### Department 6: SECURITY OPS (Tenant Isolation)

**Multi-Tenant Security Model:**

| Layer | Implementation |
|-------|----------------|
| Data Isolation | Separate BigQuery dataset per tenant |
| Storage | Separate Cloud Storage bucket per tenant |
| Database | Row-level security in PostgreSQL |
| Cross-tenant | Queries BLOCKED |
| API Keys | GCP Secret Manager (tenant never sees) |

**Permission Matrix:**

| Role | Access |
|------|--------|
| Super Admin | Full access (root) |
| Tenant Admin | Tenant scope only |
| User | Own data only |

**Compliance:** SOC2, GDPR, UAE Data Protection

---

### Department 7: ANALYTICS HQ (BigQuery Intelligence)

**User Journey Heatmap:**
```
Login → Radar → Lead Detail → Outreach → Send
100%    78%      52%           31%         18%

🔴 BIGGEST DROP: Radar → Lead Detail (26% lost)

🤖 SIVA Analysis: "Users don't understand signal scores.
   Recommendation: Add tooltip explaining QTLE score"
```

**AI Insights Generated:**
- "Users who see 5+ signals in first session: 80% retention"
- "Outreach sent within 2 hours of signal: 3x response rate"
- "Corporate Banking users need more guided onboarding"
- "Tuesday 10am: Peak usage. Scale infra proactively."

---

### Department 8: DEVOPS CENTER

**One-Click Actions:**
- Deploy to Production
- Rollback
- Scale Up
- View Logs

**Sprint Sync (Notion Integration):**
- Real-time sync with Notion databases
- 132 sprints tracked
- 754 features managed
- Automated progress updates

---

### Department 9: CAMPAIGN LAB

**Enterprise Campaign Management:**
- A/B testing
- Template library
- Version control
- Compliance notes
- Expiry management
- Automatic adaptation to vertical

**Example: Emirates NBD Campaigns:**
- 2.59% personal loan campaign
- Home loan 4.39%
- Corporate payroll offer
- Digital banking onboarding flow

---

### Department 10: GROWTH INTEL

**Market Expansion Tracking:**
- Competitor monitoring
- Waitlist management
- TAM analysis
- $1B path progress

---

## 5. SIVA Super Admin Brain

### What SIVA Does Automatically (No Human Needed)

**API OPTIMIZATION:**
- Switches to backup provider when primary exceeds quota
- Routes to cheapest provider maintaining quality threshold
- Alerts on cost spikes before budget exceeded
- Negotiates usage patterns for cost efficiency

**SIGNAL TUNING:**
- Adjusts weights based on conversion data
- Detects noisy signals, reduces weight
- Suggests new signals based on patterns
- A/B tests signal combinations

**TENANT HEALTH:**
- Predicts churn 2 weeks in advance
- Identifies upsell opportunities
- Sends re-engagement triggers
- Generates health reports

**SYSTEM HEALTH:**
- Scales infrastructure proactively
- Triggers failover before outage
- Optimizes query performance
- Cleans stale data

### What SIVA Asks You First

- Deploy to production? (always asks)
- Major pricing changes
- New vertical launch
- Tenant termination
- Security-sensitive changes

### Proactive Insights (Example Day)

**🔴 URGENT:**
"Apollo API cost exceeded budget. Auto-switched to Clearbit.
Impact: 8% lower data quality. Recommend: Upgrade Apollo plan."
[Upgrade Now] [Keep Current] [Analyze Cost]

**🟡 ATTENTION:**
"FAB tenant usage dropped 15% this week. 3 users haven't logged in."
[View Users] [Send Re-engagement] [Schedule Call]

**🟢 OPPORTUNITY:**
"Emirates NBD hit 8x usage limit. Ready for Enterprise tier."
[Generate Proposal] [Auto-Upgrade] [Notify Sales]

**📈 GROWTH:**
"Insurance vertical has 47 waitlist signups. Consider prioritizing."
[View Waitlist] [Start Building] [Survey Users]

### Daily Briefing

```
"Good morning. Here's your PremiumRadar status:

 📊 Yesterday: 1,247 active users (+12%), $4,230 revenue
 ✅ All systems healthy, 99.9% uptime
 🎯 Focus today: Conversion model deployment (S132 milestone)
 ⚠️  Watch: FAB engagement declining
 💡 Tip: Corporate Banking persona needs tone adjustment"
```

---

## 6. The $1B Path

### Milestone Tracker

| Phase | Valuation | Key Milestones |
|-------|-----------|----------------|
| **Phase 1: MVP** | ~$5M | ✅ Banking vertical live, ✅ EB UAE complete, ✅ SIVA v1 |
| **Phase 2: PMF** | $10M | ○ 100 paying users, ○ $100K ARR, ○ Multi-tenant |
| **Phase 3: Scale** | $50M | ○ 5 enterprise tenants, ○ $1M ARR, ○ Series A |
| **Phase 4: Expansion** | $200M | ○ 20 tenants, ○ $10M ARR, ○ 5 verticals |
| **Phase 5: Dominance** | $1B | ○ 100+ tenants, ○ $100M ARR, ○ Global |

### SIVA Coach Advice

> "Focus on reaching 100 users. Each proves PMF. After 100, you're fundable. After $1M ARR, you're inevitable.
>
> The math: 100 users × $149/mo = $179K ARR. Then upsell 10 enterprises = $500K ARR. You're at seed."

---

## 7. Implementation Phases

### Phase 1 (Weeks 1-4): Foundation

| Sprint | Focus | Deliverables |
|--------|-------|--------------|
| S133 | Tenant Infrastructure | Multi-tenant schema, isolation, CRUD |
| S134 | API Governance | Unified manager, switching, cost tracking |
| S135 | Vertical Engine v1 | Configurable system, signal UI, persona editor |
| S136 | Super Admin Dashboard v1 | Tenant dashboard, API costs, health |

### Phase 2 (Weeks 5-8): Intelligence

| Sprint | Focus | Deliverables |
|--------|-------|--------------|
| S137 | BigQuery Analytics | Journey tracking, drop-off, funnels |
| S138 | ML Models | Conversion predictor, churn detector |
| S139 | SIVA Super Admin | Proactive insights, daily briefing |
| S140 | Auto-Optimization | API cost, signal tuning, autonomous |

### Phase 3 (Weeks 9-12): Enterprise Ready

| Sprint | Focus | Deliverables |
|--------|-------|--------------|
| S141 | Tenant Admin Panel | Campaigns, teams, analytics |
| S142 | Revenue Ops | Billing, metering, subscriptions |
| S143 | Security & Compliance | Audit, permissions, SOC2/GDPR |
| S144 | Enterprise Onboarding | Bulk import, SSO, branding |

---

## 8. Technology Stack

### GCP-Native Architecture

| Layer | Services |
|-------|----------|
| **Compute** | Cloud Run, Cloud Functions, GKE |
| **Data** | Cloud SQL (PostgreSQL), BigQuery, Firestore, Cloud Storage |
| **AI/ML** | Vertex AI, BigQuery ML, Anthropic Claude, Vertex Embeddings |
| **Security** | Secret Manager, IAM, Cloud Armor, VPC |
| **Operations** | Cloud Monitoring, Logging, Trace, Error Reporting |

### Why GCP

- Native Vertex AI integration
- BigQuery for analytics at scale
- Cloud Run for serverless APIs
- Secret Manager for API key security
- Already deployed and familiar

---

## 9. Phase Roadmap (Full)

### PHASE 1 — LAUNCH (EB UAE + Individual Users + Demo Tenants)

**Primary Goal:** Launch a fully functional version with SIVA for EB UAE, individual users, and demo tenants.

**Modules:**
1. Front-End User Experience (Login, Choose vertical, Journey)
2. SIVA v1 (Suggest leads, Write outreach, Analyze conversations)
3. Individual User Mode (Independent, EB presets, Stripe subscription)
4. Tenant Admin Panel Demo (Upload campaigns, Configure persona, View analytics)
5. Super Admin Panel v1 (User analytics, Tenant management, API management)

---

### PHASE 2 — INTELLIGENT SALES ENGINE (AI + ML)

**Primary Goal:** Transform into a data-driven conversion engine with ML predictions.

**Modules:**
1. Multi-Vertical Support (Corporate Banking, SME, Priority, Mortgage)
2. ML Models (Conversion prediction, Churn prediction, Campaign effectiveness)
3. Automated Signal Intelligence (Reweighting, noise detection)
4. Automated API Optimization (Provider switching, cost control)
5. SIVA Advanced (Action recommender, Revenue coach)
6. Enterprise Admin Enhancement (Benchmarks, Team analytics, Scorecards)

---

### PHASE 3 — GLOBAL EXPANSION + FULLY AUTONOMOUS

**Primary Goal:** World's first fully autonomous sales intelligence system.

**Modules:**
1. Full Multi-Vertical (Insurance, Real Estate, Recruitment, SaaS, Healthcare)
2. Fully Autonomous Scoring Engine (AI builds, evaluates, tunes models)
3. Global Region Packs (UAE, India, GCC, US, Singapore, UK)
4. SIVA as OS of Sales (Speech, Autonomous, Multi-modal, Cross-platform)
5. Marketplace (Vertical Packs, Signal Packs, Campaign Packs, Language Packs)
6. Enterprise Custom AI OS (Private SIVA, CRM integration, Internal signals)

---

## Summary: What Makes This $1B Worthy

| Aspect | Traditional SaaS | PremiumRadar Super Admin |
|--------|-----------------|-------------------------|
| Configuration | Hard-coded | 100% configurable |
| Multi-tenant | Basic | Enterprise-grade isolation |
| API Management | Fixed providers | Dynamic routing + failover |
| AI | Feature | Core brain (SIVA) |
| Analytics | Dashboard | Predictive + Prescriptive |
| Scaling | Manual | Autonomous |
| Cost Optimization | None | AI-driven |
| New Verticals | Months of dev | Days (AI-generated) |

---

## Conclusion

**This is not a dashboard. This is an AI Operating System.**

PremiumRadar Super Admin transforms a solo founder into a CEO with 300 AI specialists working 24/7/365 to:
- Manage thousands of tenants
- Optimize costs automatically
- Predict problems before they happen
- Generate new verticals with AI
- Scale to $1B valuation

---

**Document Version:** 1.0
**Created:** December 7, 2025
**Author:** PremiumRadar Team + Claude (TC)
**Status:** Approved for Implementation

---

*"AWS Console + HubSpot Admin + OpenAI Playground + Stripe Dashboard + Multi-Tenant AI Brain"*

*This is PremiumRadar Super Admin.*
