# USER & ENTERPRISE MANAGEMENT — FINAL SPEC v1.1

**Status:** LOCKED (Constitutional Document)
**Owner:** Super Admin (Founder)
**Scope:** User management, enterprise management, demo systems, AI narration, BTE integration
**Compatibility:** 2030-ready, AI-native, solo-founder scalable

---

## 1. SYSTEM INTENT (WHY THIS EXISTS)

This system is designed to:
1. Support both PLG (individual) and enterprise-led adoption
2. Prove value via behavioral evidence, not claims
3. Scale to 10,000+ enterprises with one founder
4. Make AI explain reality, not invent it
5. Allow continuous vertical experimentation without polluting real data

---

## 2. ACTORS & ROLES (FINAL)

### 2.1 Role Hierarchy

| Role | Scope | Authority |
|------|-------|-----------|
| SUPER_ADMIN | Global | Absolute |
| ENTERPRISE_ADMIN | One enterprise | Managerial |
| ENTERPRISE_USER | One workspace | Execution |
| INDIVIDUAL_USER (REAL) | Personal | Execution |
| INDIVIDUAL_USER (DEMO_SYSTEM) | Personal | Testing |

---

## 3. USER TYPES & CREATION PATHS

### 3.1 Individual User — REAL (Self-Serve)

**Created by:** User via frontend
**Purpose:** PLG funnel, bottom-up adoption

- Gets personal workspace
- NBA guidance enabled
- BTE tracked (real signals)
- Demo by policy (config-driven)

### 3.2 Individual Demo User — SYSTEM (Super Admin)

**Created by:** Super Admin
**Purpose:**
- Vertical testing
- Sub-vertical validation
- Persona/policy QA
- Sales demos
- Internal simulations

**Key Properties:**
- Not tied to any enterprise
- Excluded from revenue & conversion analytics
- Included in QA telemetry
- Cannot convert automatically

### 3.3 Enterprise Admin

**Created by:** Super Admin
**Purpose:** Manage enterprise execution, not AI

**Capabilities:**
- Invite / disable enterprise users
- Upload campaigns & templates
- View AI briefs & evidence
- Monitor team execution

**Restrictions:**
- Cannot modify personas
- Cannot modify policies
- Cannot view raw telemetry

### 3.4 Enterprise User

**Created by:** Enterprise Admin or Super Admin
**Purpose:** Execute sales workflows

**Capabilities:**
- Discovery / Enrichment / Outreach / Follow-up / Decision (as per vertical)
- NBA consumption
- Task execution

**Restrictions:**
- No user management
- No exports (unless policy allows)

---

## 4. ENTERPRISE MODEL (FINAL)

```
Enterprise
├── Workspaces
│   └── Users
├── Enterprise Admin(s)
├── Campaigns / Templates
├── Behavioral Telemetry (BTE)
├── AI Briefs
└── Evidence Packs
```

**Enterprise is:**
- Tenant boundary
- Billing boundary
- Evidence boundary
- AI narration boundary

---

## 5. DATABASE SCHEMA (RENAMED & FINAL)

### 5.1 Enterprises

```sql
CREATE TABLE enterprises (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  domain VARCHAR(255),
  industry VARCHAR(100),
  type VARCHAR(20) CHECK (type IN ('REAL','DEMO')),
  status VARCHAR(20),
  plan VARCHAR(50),
  demo_expires_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5.2 Workspaces

```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY,
  enterprise_id UUID REFERENCES enterprises(id),
  name VARCHAR(255),
  is_default BOOLEAN,
  settings JSONB
);
```

### 5.3 Users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  enterprise_id UUID,
  workspace_id UUID,
  role VARCHAR(50) CHECK (
    role IN (
      'SUPER_ADMIN',
      'ENTERPRISE_ADMIN',
      'ENTERPRISE_USER',
      'INDIVIDUAL_USER'
    )
  ),
  is_demo BOOLEAN DEFAULT false,
  demo_type VARCHAR(20), -- SYSTEM | ENTERPRISE
  demo_expires_at TIMESTAMP,
  status VARCHAR(20),
  metadata JSONB
);
```

---

## 6. DEMO POLICY SYSTEM (NO HARD-CODING)

### 6.1 Demo Policy Table

```sql
CREATE TABLE demo_policies (
  id UUID PRIMARY KEY,
  scope VARCHAR(30) CHECK (
    scope IN (
      'INDIVIDUAL_REAL',
      'INDIVIDUAL_SYSTEM',
      'ENTERPRISE'
    )
  ),
  max_duration_days INTEGER,
  idle_expiry_hours INTEGER,
  max_users INTEGER,
  max_actions_per_day INTEGER,
  allow_exports BOOLEAN,
  allow_automation BOOLEAN,
  created_by UUID,
  updated_at TIMESTAMP
);
```

### 6.2 Demo Evaluation Logic

- Read from `demo_policies`
- Evaluated hourly or on event
- Expiry reasons logged
- No constants anywhere in code

---

## 7. STAGE GRAPH SYSTEM (FLEXIBLE, VERTICAL-AWARE)

### 7.1 Canonical Stage Vocabulary

```
DISCOVERY
ENRICHMENT
OUTREACH
FOLLOW_UP
DECISION
EXECUTION
```

### 7.2 Stage Graph Definition

```sql
CREATE TABLE os_stage_graphs (
  id UUID PRIMARY KEY,
  vertical_id UUID,
  stages JSONB,
  transitions JSONB
);
```

- Each vertical defines its own graph
- Some flows may skip stages
- DECISION is a stage, not an engine

---

## 8. ENGINE RESPONSIBILITIES (FINAL)

| Component | Role |
|-----------|------|
| Discovery Engine | Unknown identification |
| Enrichment Engine | Context expansion |
| Outreach Engine | Execution |
| Follow-up Engine | Sequencing |
| BTE | Observation + signal derivation |
| NBA | Deterministic action selection |
| SIVA Intelligence | Reasoning + narration |

**No Decision Engine exists**
Decision is handled via policy + NBA + SIVA reasoning

---

## 9. BEHAVIORAL TELEMETRY ENGINE (BTE)

**What BTE Does:**
- Tracks execution behavior
- Computes derived signals
- Produces evidence

**What BTE NEVER Does:**
- Never decides
- Never acts
- Never learns autonomously
- Never writes to core entities

**Example Signals:**
- Hesitation index
- Execution velocity
- Follow-through rate
- Idle decay
- Missed opportunity count

**All signals are tagged:**
```
REAL | DEMO_SYSTEM | DEMO_ENTERPRISE
```

---

## 10. AI NARRATION (MANDATORY)

### Super Admin AI Brief
- Portfolio health
- At-risk enterprises
- Demo misuse
- Product friction signals

### Enterprise Admin AI Brief
- Team execution summary
- Where users stall
- What to coach next
- Evidence-backed explanations

### Enterprise / Individual User
- Inline NBA reasoning
- Execution tips
- No hallucinations

**AI never hides evidence.**

---

## 11. FRONT-END NAVIGATION

### Super Admin
```
Users
├── Individual (Real)
├── Individual (Demo)
├── Enterprise Users
└── Admins

Enterprises
├── All
├── Demo
├── At-Risk
└── Evidence Packs

Control Plane
├── Verticals
├── Sub-Verticals
├── Personas
├── Policies
└── Regions

System Intelligence
├── BTE
├── Thresholds
└── Drift Signals

Settings
├── Demo Policies
├── Feature Flags
└── Security
```

### Enterprise Admin
```
Overview (AI Brief)
Teams
Users
Campaigns
Evidence
```

### Individual / Enterprise User
```
Dashboard
Tasks / NBA
Execution History
Insights
```

---

## 12. SECURITY & GOVERNANCE

- Enterprise-level RLS enforced everywhere
- Demo users isolated
- All actions audited
- Demo expiry irreversible without Super Admin
- No cross-enterprise data leaks possible

---

## 13. SUCCESS GUARANTEES

| Dimension | Guarantee |
|-----------|-----------|
| Scale | 10k enterprises, 100k users |
| Ops | Solo founder manageable |
| Trust | Deterministic replay |
| AI | Evidence-first |
| UX | No clutter, no confusion |
| Future | Vertical-agnostic |

---

## FINAL LOCK STATEMENT

- Enterprise replaces tenant everywhere
- Demo behavior is config-driven
- Individual Demo Users are first-class
- Stages are graph-defined
- BTE observes, NBA decides, AI explains
- No hard-coding, no silent magic

---

*This document is CONSTITUTIONAL. All implementation must comply.*
