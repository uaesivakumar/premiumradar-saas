# UPR SaaS Context (Master Reference)

**Version:** 1.0.0
**Last Updated:** AUTO (by TC after every sprint)

---

# 🔥 Purpose

This file is the single source of truth for:
- Sprint execution
- Notion integration
- Cloud Run deployment
- Repo structure
- TC behavior rules
- Environment mapping
- Feature tracking
- Documentation

TC **must load this file** before executing any action.

---

## 1. Repositories

```
~/Projects/UPR/
├── upr-os/
├── upr-os-worker/
├── premiumradar-saas/
└── upr-infra/
```

---

## 2. Notion Database IDs (Production)

| DB | ID |
|----|----|
| Sprints | `5c32e26d-641a-4711-a9fb-619703943fb9` |
| Features | `26ae5afe-4b5f-4d97-b402-5c459f188944` |
| Knowledge | `f1552250-cafc-4f5f-90b0-edc8419e578b` |

**Token:** Stored in GCP Secret Manager as `NOTION_TOKEN_SAAS`

---

## 3. Cloud Environments

### Staging (Testing)

- **Domain:** https://upr.sivakumar.ai
- **Cloud Run Service:** `premiumradar-saas-staging`
- **Purpose:** Sprint development, demos, validation
- **Deployment:** Automatic on push to `main`

### Production (Live SaaS)

- **Domain:** https://premiumradar.com
- **Cloud Run Service:** `premiumradar-saas-production`
- **Purpose:** Customer-facing SaaS
- **Deployment:** Manual merge to `production` branch

### Shared Backend

- `upr-os-service` (Core Intelligence Layer)
- `upr-os-worker` (Async Processing)

---

## 4. Deployment Rules

### Staging Deployment (AUTOMATIC)

**Trigger:** Push to `main` branch

```bash
git push origin main
```

**CI/CD will:**
1. Build SaaS
2. Deploy to Cloud Run staging → `premiumradar-saas-staging`
3. Update domain → `upr.sivakumar.ai`
4. Post deployment log
5. TC runs `/start` to validate

✔ This environment is for Sprint development & testing
✔ Workers & OS auto-sync

### Production Deployment (MANUAL)

**Trigger:** Push to `production` branch

```bash
git checkout production
git merge main
git push origin production
```

**CI/CD will:**
1. Build SaaS
2. Deploy to Cloud Run production → `premiumradar-saas-production`
3. Update SLA domain → `premiumradar.com`
4. TC runs `/qa` to certify deployment
5. TC updates:
   - Release Notes
   - Knowledge page
   - Sprint DB (if applicable)

✔ Safe
✔ Zero-risk
✔ VC-ready governance

---

## 5. TC Operating Rules

### TC MUST:

- Load this file before executing anything
- Validate Notion schema before read/write
- Validate Cloud Run health before proceeding
- Update:
  - Sprint page
  - Features page
  - Knowledge page
- Create:
  - Sprint docs
  - QA docs
  - Batch docs

### TC MUST NOT:

- Auto-create sprints (without explicit founder request)
- Auto-create features (without explicit founder request)
- Modify OS v1
- Deploy to production without approval
- Assume any table/column name
- Assume any environment variables
- Run local commands
- Use local database

### Notion Sync Rules (MANDATORY)

**CRITICAL:** TC must populate ALL required fields when updating Notion databases, not just status fields.

#### For Every Sprint Record, TC Must Populate:

- Status (select)
- Sprint Name (title)
- Goal (rich_text)
- Outcomes (rich_text)
- Highlights (rich_text)
- Business Value (rich_text)
- Started At (date)
- Completed At (date)
- Commit (rich_text)
- Git Tag (rich_text)
- Branch (rich_text)
- Phases Updated (multi_select)
- Learnings (rich_text)
- Commits Count (number)
- Synced At (date)

#### For Every Feature Record, TC Must Populate:

- Feature Name (title)
- Sprint (number)
- Status (select)
- Priority (select)
- Complexity (select)
- Type (select)
- Notes (rich_text)
- Tags (multi_select)
- Started At (date)
- Completed At (date)
- Assignee (rich_text)
- Done? (checkbox)

#### 9-Step Notion Sync Workflow:

When TC performs any Notion update, TC must follow this workflow:

1. **Fetch schema** - Retrieve full database schema
2. **Validate schema** - Ensure all required properties exist
3. **Detect missing fields** - Identify which fields are empty
4. **Populate all required fields** - Update every field listed above
5. **Delete meaningless columns** - Remove unused/redundant columns
6. **Check Knowledge Page** - Determine if Knowledge Page needs update
7. **Apply updates** - Execute all database writes
8. **Write detailed commit message** - Document changes in Notion logs
9. **Confirm completion** - Verify all updates succeeded

**Example Script:** `scripts/notion/fullSecuritySync.js`

#### Forbidden Practices:

- ❌ NEVER update only the Status field
- ❌ NEVER skip filling required fields
- ❌ NEVER assume a field is optional
- ❌ NEVER leave Notes, Learnings, or Business Value empty

### Sprint & Feature Creation Rules

**Default Behavior:**
- TC must **never** auto-create sprints or features without explicit founder request
- TC only **reads** from Notion and **executes** assigned work
- TC **updates status** of existing sprints/features

**When Explicitly Requested:**

When the founder explicitly asks TC to create sprints or features (e.g., "Generate Security Sprints S1-S6"), TC is allowed to:

1. **Design** the sprint structure
2. **Create** individual features
3. **Write** the full sequence and continuity
4. **Store** them in Notion

**Approval Process:**

1. After creation, the **founder must approve or modify** the sprints/features in Notion
2. Only after **founder approval** can TC begin executing the sprint
3. TC announces when sprints/features are created and awaits approval

**Example Flow:**
```
Founder: "Generate Security Sprints S1-S6"
TC: Creates sprints and features in Notion
TC: "S1-S6 created with 42 features. Please review in Notion."
Founder: Reviews and approves
Founder: "Begin Sprint S1"
TC: Executes Sprint S1
```

### Knowledge Page Update Rules (MANDATORY)

**NON-NEGOTIABLE:** TC must always update the Knowledge Page after every stretch (whenever TC executes one or more sprints together).

The Knowledge Page is for SKC's learning, not documentation. Minimal updates are strictly prohibited.

---

#### MULTI-PAGE STRUCTURE (CRITICAL)

**Each stream MUST create MULTIPLE sub-pages under the Knowledge Page** - one page per major concept/feature. A single page for an entire stream is FORBIDDEN.

**Rule:** For every 3-5 features, create 1 learning page. A stream with 29 features should have ~5-7 learning pages.

**Example - Stream 1 (Front-End Experience):**
```
📚 Knowledge (parent page)
├── 🚀 What is PremiumRadar?        ← Product Overview
├── 🔮 The AI Orb Interaction Model  ← Sprint 1 concept
├── 🎨 Vertical Morphing Engine      ← Sprint 1 concept
├── 🎯 Demo-Before-Signup Architecture ← Sprint 2 concept
└── 🏠 SaaS Shell & Dashboard        ← Sprint 3-4 concept
```

**How to identify pages:**
1. Group related features by concept
2. Ask: "What is the ONE thing SKC should learn from these features?"
3. That becomes the page title

---

#### EACH SUB-PAGE STRUCTURE (Following UPR Template)

Every sub-page MUST follow this exact structure (see `/Users/skc/Downloads/Sample KNowledge page.pdf`):

```
🎯 Simple Explanation (ELI5)    ← H2 with color: "orange"
💡 [Simple explanation...]      ← Callout with color: "yellow_background"

🌍 Real-World Analogy           ← H2 with color: "green"
[Relatable analogy...]          ← Quote block with color: "green_background"

⚙️ Technical Explanation        ← H2 with color: "purple"
[How it works technically...]   ← Plain paragraph

🛠️ Implementation Details      ← H2 with color: "blue"
• Component: [...]              ← Bullet list with files created
```

#### NOTION API BLOCK TEMPLATES (MANDATORY)

```javascript
// 1. COLORED HEADING (orange, green, purple, blue)
const coloredHeading = (text, color) => ({
  object: 'block',
  type: 'heading_2',
  heading_2: {
    rich_text: [{ type: 'text', text: { content: text } }],
    color: color  // "orange", "green", "purple", "blue"
  }
});

// 2. YELLOW CALLOUT (for ELI5)
const yellowCallout = (text, emoji = '💡') => ({
  object: 'block',
  type: 'callout',
  callout: {
    rich_text: [{ type: 'text', text: { content: text } }],
    icon: { type: 'emoji', emoji: emoji },
    color: 'yellow_background'  // MUST be yellow_background
  }
});

// 3. GREEN QUOTE (for Real-World Analogy)
const greenQuote = (text) => ({
  object: 'block',
  type: 'quote',
  quote: {
    rich_text: [{ type: 'text', text: { content: text } }],
    color: 'green_background'  // MUST be green_background
  }
});

// 4. BROWN CALLOUT (alternative for important notes)
const brownCallout = (text, emoji = '📌') => ({
  object: 'block',
  type: 'callout',
  callout: {
    rich_text: [{ type: 'text', text: { content: text } }],
    icon: { type: 'emoji', emoji: emoji },
    color: 'brown_background'
  }
});
```

**MANDATORY COLOR SCHEME:**
| Section | Block Type | Color |
|---------|------------|-------|
| ELI5 Heading | heading_2 | `orange` |
| ELI5 Content | callout | `yellow_background` |
| Analogy Heading | heading_2 | `green` |
| Analogy Content | quote | `green_background` |
| Technical Heading | heading_2 | `purple` |
| Implementation Heading | heading_2 | `blue` |

**Optional sections (add if relevant):**
- ❓ Why It Was Created (Problem/Solution/Impact)
- 🚫 What If It Didn't Exist
- 💻 Technologies Behind It
- 🎭 Explain to Different Audiences (toggle blocks)

---

#### KEY FORMATTING RULES

1. **ELI5 = Yellow Callout** - Always visible, uses `callout` with `yellow_background`
2. **Analogy = Green Quote** - Always visible, uses `quote` with `green_background`
3. **Color-coded Headings** - Each section has its own color for easy scanning
4. **Bullet Lists** - Clean, simple bullets for lists (not nested)
5. **Sub-pages** - Click Knowledge → See list of learning topics → Click one → Learn
6. **Last Updated in Title** - Every page title MUST include `(Updated: YYYY-MM-DD)` suffix

**Page Title Format:**
```
📚 Topic Name (Updated: 2025-11-25)
```
Example titles:
- `🎯 Q/T/L/E Scoring Engine (Updated: 2025-11-25)`
- `🏦 Banking Signal Library (Updated: 2025-11-25)`

This makes it easy to see at a glance which pages have recent content vs outdated content.

**FORBIDDEN:**
- ❌ ONE page for entire stream (must be multiple pages)
- ❌ Creating 100+ flat blocks in one page
- ❌ Long paragraphs without structure
- ❌ Making ELI5/Analogy collapsible (they should always be visible)
- ❌ Skipping the visual hierarchy (colors, callouts, toggles)
- ❌ Using plain text where callouts/quotes should be used

---

#### AUTOMATION

**Reference Script:** `scripts/notion/createKnowledgePages.js`
**Template Reference:** `/Users/skc/Downloads/Sample KNowledge page.pdf`

TC must create a stream-specific knowledge script following the pattern:
```javascript
// scripts/notion/createKnowledgePagesStream<N>.js
// Creates sub-pages under Knowledge page for Stream N
```

**Enforcement:**
- TC must never skip this Knowledge Page update step
- TC must never perform minimal updates (one page = failure)
- TC must create 1 page per major concept (5-7 pages per stream)
- TC must ensure all pages follow the ELI5 + Analogy + Technical structure
- TC must verify pages are created before closing the stretch

### MANDATORY GOVERNANCE ENFORCEMENT (CRITICAL - NEVER SKIP)

**AFTER EVERY STRETCH, TC MUST RUN THE MASTER GOVERNANCE SCRIPT:**

```bash
# MANDATORY - Run this after EVERY stretch
export NOTION_TOKEN=$(gcloud secrets versions access latest --secret=NOTION_TOKEN_SAAS)
npx tsx scripts/notion/governanceComplete.js <sprint_start> <sprint_end>

# Then run stream-specific knowledge pages
npx tsx scripts/notion/createColorfulKnowledgePages.js
```

**Master Script Location:** `scripts/notion/governanceComplete.js`

**What the script does automatically:**
1. ✅ Updates ALL sprints in range → Status = Done
2. ✅ Updates ALL features in range → Status = Done
3. ✅ Runs `npm run build` → Verifies no errors
4. ✅ Runs `npx tsc --noEmit` → Verifies no type errors
5. ✅ Prints governance summary with pass/fail

**Knowledge Pages (separate script):**
- Run `scripts/notion/createColorfulKnowledgePages.js` for colorful pages
- MUST use colored headings (orange, green, purple, blue)
- MUST use yellow callouts for ELI5
- MUST use green quotes for analogies
- See "NOTION API BLOCK TEMPLATES" section above

**CRITICAL RULES:**
- TC MUST run `governanceComplete.js` BEFORE marking stretch complete
- TC MUST NOT deliver code without passing governance
- TC MUST NOT manually update Notion (use scripts only)
- Governance failure = Sprint failure

**If script fails:**
1. Fix the error (build/type/etc)
2. Re-run the script
3. Only proceed when script shows "✅ GOVERNANCE COMPLETE"

---

## 6. Slash Commands

### /start

Execute at session start:
- Load context
- Load sprint from Notion
- Sync features
- Validate environment
- Validate Cloud Run
- Prepare sprint session

### /qa

Execute for sprint certification:
- Execute full QA suite
- Generate QA report
- Update Notion
- Certify sprint
- Prepare release hooks

---

## 7. Environment Variables

### From GCP Secret Manager:

- `NOTION_TOKEN_SAAS`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_KEY`
- `OS_BASE_URL`
- `SAAS_SERVICE_URL`
- `WORKER_SERVICE_URL`

### Access via:

```bash
gcloud secrets versions access latest --secret=NOTION_TOKEN_SAAS
```

---

## 8. Documentation Rules

TC updates these automatically:

```
/docs/sprints/Sprint_X_Plan.md
/docs/qa/Sprint_X_QA_Report.md
/docs/batches/Batch_Summary_SX-SY.md
/docs/knowledge/*
/docs/changelog/UPR_CHANGELOG.md
```

---

## 9. Security Rules

### Zero-Trust Security Model

```
                     [Internet]
                          │
                    Cloud Armor WAF
                    (SQLi, XSS, Rate)
                          │
                    ┌─────▼─────┐
                    │  SaaS     │ ← Public (allUsers)
                    │  Service  │
                    └─────┬─────┘
                          │ OIDC Token
                    ┌─────▼─────┐
                    │  OS       │ ← Private (SaaS SA only)
                    │  Service  │
                    └─────┬─────┘
                          │ OIDC Token
                    ┌─────▼─────┐
                    │  Worker   │ ← Private (OS SA + Pub/Sub)
                    │  Service  │
                    └───────────┘
```

### IAM Bindings

- `premiumradar-saas-service`: `allUsers` can invoke
- `upr-os-service`: Only `premiumradar-saas-sa` can invoke
- `upr-os-worker`: Only `upr-os-sa` and Pub/Sub SA can invoke

### Security Gate (QA Mandatory)

**MANDATORY before QA certification:**

1. **TC must run Prompt Injection Red-Team Suite** before QA certification
2. **TC must verify no internal config fields leak to clients**
3. **TC must run OWASP top-10 smoke tests** each sprint
4. **TC must update `SECURITY_CHANGELOG.md`** after any security-affecting change
5. **Any sprint failing security gate stays QA Pending**

**Files:**
- `SECURITY_CHANGELOG.md` - Track all security-affecting changes
- `tests/security/` - Security test suites

---

## 10. Security Sprints (MANDATORY BEFORE SPRINT 1)

**CRITICAL:** All security sprints (S1-S6) must be completed before starting product Sprint 1.

See: `docs/SECURITY_SPRINTS.md` for full details.

### Security Sprint Overview

| Sprint | Name | Priority | Status |
|--------|------|----------|--------|
| **S1** | Prompt Injection Firewall v1.0 | Critical | ✅ Completed |
| **S2** | OS Identity & Token Hardening | Critical | ✅ Completed |
| **S3** | Anti-Reverse-Engineering | Critical | ✅ Completed |
| **S4** | Red-Team Suite v1.0 | Critical | ✅ Completed |
| **S5** | WAF + Abuse Prevention | Critical | ✅ Completed |
| **S6** | Immutable Security Change Log | Critical | ✅ Completed |

**Completion Date:** 2025-11-24
**Total Features Delivered:** 32 features
**Total Code:** ~3,500 lines of production security code
**Git Commits:** ff7705e (S1), bfa6d9c (S2-S6)
**Git Tags:** sprint-s1-certified through sprint-s6-certified

### Security Gate Before Product Sprints

- ✅ All S1-S6 sprints completed
- ✅ 150+ red-team prompts passing
- ✅ OWASP Top 10 coverage verified
- ✅ Third-party security audit (optional but recommended)
- ✅ SECURITY_CHANGELOG.md established

**No product development starts until security foundation is complete.**

---

## 11. Success Criteria

PremiumRadar SaaS Sprint = **COMPLETE** only if:

- ✅ All sprint tasks done
- ✅ `/qa` passed
- ✅ Security sprints completed (if applicable)
- ✅ TC has updated:
  - Sprint DB
  - Features DB
  - Knowledge Page
- ✅ Deployment validated on staging
- ✅ **Homepage DOM verified** (no template content, SIVA/Q/T/L/E present)

### Homepage DOM Verification Rule (MANDATORY)

**TC MUST NOT certify or deploy UI changes unless the LIVE HOMEPAGE DOM is validated.**

**Forbidden strings:** "AI-Powered Intelligence Platform", "Transform your business", "15 integrations", generic "Starter/Professional" pricing

**Required strings:** "SIVA", "Q/T/L/E", "Discovery Engine", "Cognitive Sales OS", "UAE"

```bash
# Verification command
curl -sL https://premiumradar-saas-staging-191599223867.us-central1.run.app | grep "Initializing SIVA"
```

**This is a permanent rule effective 2025-11-25.**

---

## 12. Domain → Environment Mapping

| Domain | Environment | Cloud Run Service | Purpose |
|--------|-------------|-------------------|---------|
| upr.sivakumar.ai | Staging | premiumradar-saas-staging | Sprint testing, demo |
| premiumradar.com | Production | premiumradar-saas-production | Actual SaaS |

**Note:** OS & Worker remain the same for both environments.

---

## 13. CI/CD Workflows

### Repository: premiumradar-saas

**Branch Strategy:**
- `main` → deploy to staging (upr.sivakumar.ai)
- `production` → deploy to production (premiumradar.com)

**Workflow:** `.github/workflows/deploy.yml`

### Repository: upr-os

**Branch Strategy:**
- `main` → autodeploy (OS is backend/core)

**Workflow:** `.github/workflows/deploy.yml`

### Repository: upr-os-worker

**Branch Strategy:**
- `main` → deploy worker

**Workflow:** `.github/workflows/deploy.yml`

---

## Appendix: Quick Reference

### Sprint Commands

```bash
# Get current sprint features
NOTION_TOKEN=$(gcloud secrets versions access latest --secret=NOTION_TOKEN_SAAS)
node scripts/notion/getCurrentSprint.js

# Update feature status
node scripts/notion/updateSprint<N>Feature.js "<feature_name>" "<status>"

# Complete sprint
node scripts/notion/updateNotionComplete.js <current_sprint> <previous_sprint>
```

### Deployment Commands

```bash
# Deploy to staging
git push origin main

# Deploy to production
git checkout production
git merge main
git push origin production
```

### Health Check

```bash
# SaaS Staging
curl -s https://upr.sivakumar.ai/api/health | jq .

# SaaS Production
curl -s https://premiumradar.com/api/health | jq .

# OS Service
gcloud run services describe upr-os-service --region=us-central1 --format="value(status.url)"

# Worker Service
gcloud run services describe upr-os-worker --region=us-central1 --format="value(status.url)"
```

---

## 14. Onboarding Rules (S37-S42 - User Journey Spine)

**CRITICAL:** TC must ensure onboarding is fully completed before allowing user access to SIVA surface. No exceptions.

### Onboarding Flow (5 Steps)
1. **Welcome** (`/onboarding/welcome`) - SIVA greeting, animated introduction
2. **Identity** (`/onboarding/welcome?step=identity`) - Name, role, region capture
3. **Workspace** (`/onboarding/workspace`) - Personal vs Organization workspace creation
4. **Vertical** (`/onboarding/vertical`) - Industry selection (Banking, FinTech, Insurance, Real Estate, Consulting)
5. **Transition** (`/onboarding/transition`) - Cinematic loading sequence → dashboard

### Route Protection
- Middleware enforces onboarding completion before dashboard access
- Incomplete onboarding → redirect to correct step
- Complete onboarding → full dashboard access

### Onboarding Store
Location: `lib/stores/onboarding-store.ts`
Persists: `currentStep`, `completedSteps`, `profile`, `workspace`, `selectedVertical`, `isComplete`

### 2030 AI-First Rules
- NO generic SaaS templates
- All pages match SIVA surface aesthetic (slate-950, neural mesh, gradient orbs)
- Onboarding feels like interacting with SIVA, not filling forms
- Zero placeholders, zero Lorem Ipsum

---

## 15. Control Plane v2.0 (FROZEN)

**Status:** 🔒 FROZEN
**Applies to:** Super Admin, OS Runtime, Workspace Resolution
**Out of scope:** CRM lifecycle, system-of-record data models

### 15.1 Purpose

The Control Plane defines how sales contexts are created, governed, activated, and resolved inside PremiumRadar.

This is **not** UI logic and **not** runtime intelligence.
It is the **authoritative configuration layer**.

### 15.2 Core Design Principles (Non-Negotiable)

1. Authority precedes intelligence
2. Super Admin is the only write authority
3. Incomplete configurations must never reach runtime
4. Determinism > convenience
5. Primary sales target drives discovery; relationships provide context
6. Inheritance over duplication
7. Immutability for identity, mutability for behavior

### 15.3 Canonical Hierarchy (Locked)

```
Vertical (Sales Domain)
  └── Sub-Vertical (Sales Motion)
        ├── primary_entity_type (MANDATORY)
        ├── related_entity_types (OPTIONAL)
        └── Region Context (hierarchical)
              └── Persona (scoped)
                    └── Persona Policy (versioned lifecycle)
```

**All five layers are mandatory for runtime eligibility.**

### 15.4 Definitions

#### 15.4.1 Vertical (Sales Domain)

**Represents:** The salesperson's domain of work.

**Examples:**
- Banking
- Insurance
- Real Estate
- Recruitment
- SaaS Sales

**Rules:**
- No entity type at vertical level
- Immutable key
- Mutable display name
- Cannot be activated alone

#### 15.4.2 Sub-Vertical (Sales Motion)

**Represents:** A concrete sales motion inside a Vertical.

**Examples (Banking):**
- Employee Banking
- Corporate Banking
- Personal Loan
- Home Loan

**Fields:**
- `primary_entity_type` (MANDATORY, immutable)
- `related_entity_types` (OPTIONAL)

**Rules:**
- Exactly one primary entity type
- Related entities are contextual only
- Discovery, ranking, and outreach are driven **only** by primary entity

**Example:**
```
Sub-Vertical: Corporate Insurance
primary_entity_type: company
related_entity_types: [individual]
```

#### 15.4.3 Entity Type Semantics

**Primary Entity Type:**
- The object being discovered, ranked, and sold to
- Drives signals, enrichment, personas, outreach

**Related Entity Types:**
- Supporting entities required for compliance or workflow
- **Never** drive discovery or ranking

This avoids:
- Multi-entity chaos
- CRM-like overreach
- Signal contamination

### 15.5 Region Context (Mandatory)

#### 15.5.1 Region Is Context, Not Identity

- Region is **not** a new vertical
- Region is **not** free text
- Region affects behavior, compliance, language, personas

#### 15.5.2 Region Hierarchy

Regions are hierarchical.

**Example:**
```
GLOBAL
└── US
    └── US-CA
```

**Resolution Rule:** Longest match wins

### 15.6 Persona Model (With Inheritance)

#### 15.6.1 Persona Scope

Each Persona has a scope:
- GLOBAL
- REGIONAL
- LOCAL (rare)

#### 15.6.2 Persona Resolution Order

```
LOCAL → REGIONAL → GLOBAL
```

If no match is found → configuration is **INVALID**.

#### 15.6.3 Persona Constraints

- `Persona.entity_type` must match `Sub-Vertical.primary_entity_type`
- Personas cannot exist without a Sub-Vertical + Region context

### 15.7 Persona Policy (Lifecycle-Safe)

#### 15.7.1 Policy States

```
DRAFT → STAGED → ACTIVE → DEPRECATED
```

#### 15.7.2 Policy Binding

Each Persona maintains:
- `active_policy_id`
- `next_policy_id` (optional)

#### 15.7.3 Guarantees

- Zero downtime rollout
- Blue/green policy deployment
- Audit-safe transitions
- No hot swaps without staging

### 15.8 Runtime Eligibility Rules (Hard Gate)

A configuration becomes runtime-eligible **ONLY IF**:

- ✅ Vertical exists and is active
- ✅ Sub-Vertical exists and is active
- ✅ Region resolves
- ✅ Persona resolves via inheritance
- ✅ An ACTIVE policy exists

**Otherwise:**
```
status = DRAFT
runtime_eligible = false
```

**No partial resolution. No fallback. No guessing.**

### 15.9 Explicit Non-Goals (Important)

The Control Plane does **NOT**:

- ❌ Model full CRM entity lifecycles
- ❌ Track candidate → employee transitions
- ❌ Replace core banking systems
- ❌ Perform runtime inference
- ❌ Allow UI-level shortcuts

Those belong elsewhere.

### 15.10 Governance Rules

- Keys are **immutable forever**
- Display names are mutable
- Deletions are destructive and audited
- **No seed scripts**
- **No non–Super Admin write paths**
- All writes are audited

### 15.11 Version Freeze Declaration

**Control Plane v2.0 is frozen.**

Changes require:
- Explicit v3 proposal
- Written migration plan
- Backward compatibility strategy

**No incremental "small tweaks".**

### 15.12 Migration Status (Completed 2025-12-22)

**Control Plane v2.0 Migration: COMPLETE**

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 0 | Safety Locks (freeze vertical expansion) | ✅ Complete |
| Phase 1.1 | Deprecate entity_type/region_scope on os_verticals | ✅ Complete |
| Phase 1.2 | Add primary_entity_type to os_sub_verticals | ✅ Complete |
| Phase 1.3 | Add scope/region_code to os_personas | ✅ Complete |
| Phase 1.4 | Add policy lifecycle status to os_persona_policies | ✅ Complete |
| Phase 2 | API enforcement layer updates | ✅ Complete |
| Phase 3 | Runtime hardening (kill silent failures) | ✅ Complete |
| Phase 4 | SIVA routing de-hardcoding (deprecation notices) | ✅ Complete |
| Phase 5 | Workspace binding validation | ✅ Complete |

**Key Implementation Details:**

1. **Database Schema:**
   - `os_sub_verticals.primary_entity_type` - REQUIRED, immutable, CHECK constraint
   - `os_sub_verticals.related_entity_types` - JSONB array
   - `os_personas.scope` - LOCAL/REGIONAL/GLOBAL (default: GLOBAL)
   - `os_personas.region_code` - required for LOCAL/REGIONAL scope
   - `os_persona_policies.status` - DRAFT/STAGED/ACTIVE/DEPRECATED
   - `os_persona_policies.activated_at` - timestamp when activated

2. **API Enforcement:**
   - POST sub-verticals requires `primary_entity_type`
   - PATCH sub-verticals blocks changes to `primary_entity_type` (immutable)
   - POST personas validates scope/region_code combinations
   - PUT workspace bindings validates all 5 layers are active

3. **Runtime Resolution:**
   - Persona resolution follows LOCAL → REGIONAL → GLOBAL inheritance
   - Policy MUST be ACTIVE status (hard fail, no silent degradation)
   - All errors return explicit error codes (VERTICAL_NOT_CONFIGURED, etc.)

4. **Migration File:** `prisma/migrations/controlplane_v2_phase1.sql`

**Git Commits:**
- `feat(controlplane): Implement Control Plane v2.0 migration (Phases 0-3)`
- `feat(controlplane): Complete Control Plane v2.0 migration (Phases 4-5)`

### 15.13 Database Tables (Reference)

| Table | Purpose |
|-------|---------|
| `os_verticals` | Sales domains (Banking, Insurance, etc.) |
| `os_sub_verticals` | Sales motions (Employee Banking, Corporate Banking, etc.) |
| `os_personas` | Persona definitions per sub-vertical + region |
| `os_persona_policies` | Policy configurations with lifecycle states |
| `os_workspace_bindings` | Tenant → vertical/sub-vertical/persona bindings |
| `os_controlplane_audit` | Immutable audit log of all changes |

### 15.14 API Endpoints (Super Admin Only)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/superadmin/controlplane/verticals` | List verticals |
| POST | `/api/superadmin/controlplane/verticals` | Create vertical |
| PATCH | `/api/superadmin/controlplane/verticals/:id` | Update vertical |
| GET | `/api/superadmin/controlplane/sub-verticals` | List sub-verticals |
| POST | `/api/superadmin/controlplane/sub-verticals` | Create sub-vertical |
| GET | `/api/superadmin/controlplane/personas` | List personas |
| POST | `/api/superadmin/controlplane/personas` | Create persona |
| PATCH | `/api/superadmin/controlplane/personas/:id/policy` | Update policy |

**All endpoints require Super Admin session authentication.**

### 15.15 SIVA Routing Transitional Rules (v2.0)

**Status:** TRANSITIONAL (until all verticals are bound)

#### Resolution Order

SIVA agent selection follows this priority:

1. **DB Agent First (v2.0 Path)**
   - Check `os_workspace_bindings` for tenant+workspace
   - If bound: Use `sub_vertical.default_agent` from binding
   - This is the canonical path

2. **Hardcoded Routing (Legacy Only)**
   - If no binding exists: Fall back to `mapToProfile()` / `getOSProfile()`
   - These functions emit DEPRECATED warnings in development
   - Legacy path maintained for backward compatibility only

#### Code Locations

| File | Function | Status |
|------|----------|--------|
| `lib/os-client.ts` | `mapToProfile()` | DEPRECATED |
| `lib/stores/siva-store.ts` | `getOSProfile()` | DEPRECATED |
| `app/api/os/resolve-binding/route.ts` | (new) | v2.0 CANONICAL |

#### Transitional Contract

```
IF workspace_binding EXISTS:
  agent = sub_vertical.default_agent (from DB)
  persona = binding.persona_id (from DB)
  RESOLUTION_METHOD = "BINDING"

ELSE:
  agent = hardcoded_profile_map[sub_vertical]  // DEPRECATED
  persona = null
  RESOLUTION_METHOD = "LEGACY_HARDCODED"
  console.warn("[DEPRECATED] Using hardcoded routing...")
```

#### NOT READY Markers

Unbound vertical stacks return explicit errors:

| Endpoint | Error Code | Meaning |
|----------|------------|---------|
| `/api/os/resolve-binding` | `BINDING_NOT_FOUND` | No workspace binding exists |
| `/api/os/resolve-binding` | `BINDING_INACTIVE` | Binding exists but is_active=false |
| `/api/os/resolve-vertical` | `VERTICAL_NOT_CONFIGURED` | Vertical not found |
| `/api/os/resolve-vertical` | `SUB_VERTICAL_NOT_CONFIGURED` | Sub-vertical not found |
| `/api/os/resolve-vertical` | `PERSONA_NOT_CONFIGURED` | Persona not found |
| `/api/os/resolve-vertical` | `POLICY_NOT_ACTIVE` | No ACTIVE policy |

**Rule:** If any of these errors occur, the stack is NOT READY for production use.

### 15.16 Control Plane v2.0 Schema Freeze

**Status:** FROZEN as of 2025-12-22
**Version:** 2.0.0

#### Frozen Schema

The following tables are now frozen:

| Table | Frozen Columns |
|-------|----------------|
| `os_verticals` | `entity_type` (deprecated), `region_scope` (deprecated) |
| `os_sub_verticals` | `primary_entity_type` (immutable), `related_entity_types` |
| `os_personas` | `scope`, `region_code` |
| `os_persona_policies` | `status`, `activated_at` |
| `os_workspace_bindings` | All columns |

#### Frozen Constraints

- `valid_primary_entity_type`: CHECK (primary_entity_type IN ('deal', 'company', 'individual'))
- `valid_persona_scope`: CHECK (scope IN ('LOCAL', 'REGIONAL', 'GLOBAL'))
- `valid_policy_status`: CHECK (status IN ('DRAFT', 'STAGED', 'ACTIVE', 'DEPRECATED'))

#### Change Process (v3.0+)

Any schema changes require:

1. Explicit v3.0 proposal document
2. Written migration plan with rollback strategy
3. Backward compatibility analysis
4. Founder approval
5. Staged rollout (DRAFT → STAGED → ACTIVE)

**No incremental "small tweaks" allowed.**

---

## 16. Workspace Intelligence Framework (LOCKED)

**Status:** 🔒 LOCKED
**Reference:** `docs/WORKSPACE_INTELLIGENCE_FRAMEWORK.md`

### 16.1 Core Truth

**All product value is realized only inside the Workspace.**

Everything else (Admin, Control Plane, Engines, SIVA, OS) exists only to serve the Workspace.

### 16.2 Design Principles (Non-Negotiable)

| Principle | Rule |
|-----------|------|
| Quality > Cost | Never sacrifice accuracy to save API cost |
| Memory > Cache | Cache is temporary. Memory is advisory and long-lived |
| Single NBA Rule | At any moment, only ONE next best action exists |
| Self-Learning by Events | Every action updates confidence. No black boxes |
| No Hard-Coding | All logic must be UI-manageable |
| Patterns are Global | Content is Private |

### 16.3 What Intelligence Means

**Intelligence IS:**
- correct timing
- correct prioritization
- correct restraint
- correct recall of past actions

**Intelligence IS NOT:**
- dashboards
- scores
- rankings
- multiple suggestions

### 16.4 Three-Layer Resolution Hierarchy (MANDATORY)

| Layer | Name | Cost | When |
|-------|------|------|------|
| 1 | Internal Memory | 0 cost | Always check first |
| 2 | Inference | Low cost | Generate from known patterns |
| 3 | External APIs | Last resort | Only when 1 & 2 fail |

### 16.5 Entity Model (Critical Distinction)

| Type | Sub-Verticals | Discovery | Flow |
|------|---------------|-----------|------|
| **Company-Based** | Employee Banking, Working Capital | YES | Discovery → Enrichment → Action |
| **Individual-Based** | Personal Loan, Home Loan | NO | Reveal → Act → Convert |

**Rule:** PremiumRadar optimizes conversion, not acquisition for individual-based sub-verticals.

### 16.6 Self-Learning Definition

Self-learning means:
- Every event updates confidence
- Every outcome reshapes future behavior
- No manual tuning required

**This is event-reinforced intelligence, NOT continuous model retraining.**

### 16.7 Email Patterns (Global Asset)

- Email patterns are **GLOBAL** (not enterprise-isolated)
- Patterns are structural, not competitive IP
- Never store: full emails, content, campaign text
- Always store: domain, pattern, confidence, success/failure counts

### 16.8 Final Lock Statement

> **PremiumRadar is a memory-driven, self-correcting sales intelligence system.**
> Patterns are global, content is private, intelligence is earned over time, and the Workspace is the only place where value exists.

---

**End of UPR_SAAS_CONTEXT.md**
