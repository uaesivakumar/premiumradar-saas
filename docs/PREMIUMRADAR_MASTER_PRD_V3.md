# PremiumRadar Master PRD v3.0

**SIVA OS: The AI Operating System for Sales**

---

**Version**: 3.0 FOUNDATION
**Date**: December 8, 2025
**Architecture**: AI-Native, Multi-Agent, Self-Healing
**Status**: LOCKED FOR EXECUTION
**Classification**: Confidential

---

## Document Philosophy

This is NOT a traditional SaaS PRD.

This is the **blueprint for an AI Operating System** that happens to run in the sales domain.

```
Traditional SaaS PRD:
├── Features
├── User stories
├── Database schema
└── API endpoints

SIVA OS PRD:
├── AI Kernel (how SIVA thinks)
├── Intelligence Engines (how SIVA learns)
├── Multi-Agent Orchestration (how AI manages AI)
├── Self-Healing Systems (how the system improves itself)
├── Tenancy Architecture (how intelligence is personalized)
└── GTM Layer (how we capture the market)
```

---

## Document Structure

| Section | Layer | Purpose |
|---------|-------|---------|
| **A** | SIVA OS Kernel | The core AI reasoning engine |
| **B** | SalesContext Engine | The canonical context layer |
| **C** | Intelligence Pack Engine | Self-improving knowledge packs |
| **D** | Multi-Agent AI Orchestration | 11 AI departments working autonomously |
| **E** | API & Cost Governance | Intelligent cost optimization |
| **F** | Self-Healing Engine | Autonomous improvement loops |
| **G** | Tenancy Engine | Multi-tenant intelligence personalization |
| **H** | GTM Layer | Market capture strategy |
| **I** | Phase Execution | Phased rollout plan |
| **J** | Anti-Goals & Guardrails | What NOT to build + safety rails |
| **K** | Success Metrics | How we measure everything |
| **L** | Technical Implementation | Database, APIs, Infrastructure |

---

# SECTION A: SIVA OS KERNEL

**"SIVA is not a chatbot. SIVA is the operating system that runs sales."**

## A.1 SIVA Identity

```
SIVA = Sales Intelligence Virtual Assistant
     = The Siri of Sales
     = The Perplexity of Deals
     = The OS for every salesperson
```

| Aspect | Definition |
|--------|------------|
| **What SIVA Is** | An AI operating system that thinks, learns, and acts for salespeople |
| **What SIVA Is NOT** | A chatbot, a CRM plugin, a dashboard, a report generator |
| **Positioning** | "Hey SIVA" = the wake word for sales intelligence |
| **Relationship to PremiumRadar** | PremiumRadar is the product. SIVA is the brain. |

## A.2 SIVA Kernel Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SIVA OS KERNEL                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      REASONING ENGINE                             │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐             │   │
│  │  │ Perceive │──│ Analyze │──│ Decide  │──│ Execute │             │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘             │   │
│  │       ↑            ↑            ↑            ↑                   │   │
│  │       │            │            │            │                   │   │
│  │  ┌────┴────────────┴────────────┴────────────┴────┐             │   │
│  │  │              MCP 12-PHASE ORCHESTRATION         │             │   │
│  │  └─────────────────────────────────────────────────┘             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  EVIDENCE  │  │   TOOLS    │  │  PERSONA   │  │  CONTEXT   │        │
│  │   ENGINE   │  │   ENGINE   │  │   ENGINE   │  │   ENGINE   │        │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘        │
│         │               │               │               │               │
│         └───────────────┴───────┬───────┴───────────────┘               │
│                                 │                                        │
│                    ┌────────────┴────────────┐                          │
│                    │     SALESCONTEXT        │                          │
│                    │   (Canonical Input)      │                          │
│                    └─────────────────────────┘                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## A.3 Kernel Components

### A.3.1 Reasoning Engine

The Reasoning Engine is the "CPU" of SIVA. It processes every request through 4 stages:

| Stage | What Happens | Example |
|-------|--------------|---------|
| **Perceive** | Understand user intent, extract entities, identify context | "Who should I call today?" → Intent: prioritize, Entity: leads |
| **Analyze** | Gather evidence, evaluate signals, apply persona rules | Load 50 companies, score each, apply EB timing rules |
| **Decide** | Rank options, select recommendation, build reasoning chain | Top 5 companies with full evidence trail |
| **Execute** | Call tools, format output, include citations | Return prioritized list with "Based on..." |

### A.3.2 Evidence Engine

Every SIVA output is grounded in evidence. No black-box answers.

```typescript
interface Evidence {
  id: string;
  source: EvidenceSource;

  // Quality
  weight: number;       // 0-1 importance
  confidence: number;   // 0-1 reliability
  freshness: number;    // 0-1 recency (decays)

  // Provenance
  capturedAt: Date;
  sourceUrl?: string;
  rawData: any;
  extractedFacts: string[];

  // Linking
  entityId: string;     // Company, Contact, Signal
  relatedEvidence: string[];
}

type EvidenceSource =
  | "linkedin"
  | "news"
  | "hiring_platform"
  | "company_data"
  | "crm"
  | "user_history"
  | "market_data";
```

### A.3.3 Tools Engine

SIVA has a toolkit of capabilities. Tools are NOT just API calls — they are intelligent functions.

| Tool Category | Tools | Behavior |
|---------------|-------|----------|
| **Scoring** | score, rank, compare | Applies QTLE + persona rules |
| **Search** | search_companies, search_signals, search_contacts | Uses evidence + context |
| **Analysis** | pattern_detect, trend_analyze, predict | ML-enhanced insights |
| **Outreach** | draft_email, draft_linkedin, suggest_talking_points | Persona-aware messaging |
| **Briefing** | daily_briefing, meeting_prep, company_brief | Context-rich summaries |
| **Action** | book_meeting, update_crm, send_notification | Execute (with permission) |

### A.3.4 Persona Engine

Persona is NOT a prompt template. It's a behavioral ruleset.

```typescript
interface Persona {
  id: string;
  subVerticalId: string;

  // Identity
  identity: string;              // "You are an Employee Banking specialist..."
  mission: string;               // "Help users win payroll accounts..."

  // Behavioral Rules
  edgeCases: EdgeCase[];         // When to boost/block
  timingRules: TimingRule[];     // When to act
  contactPriority: ContactPriority[]; // Who to target
  outreachDoctrine: OutreachRule[];   // How to communicate
  antiPatterns: string[];        // What to never do

  // Decision Thresholds
  scoringWeights: QTLEWeights;
  actionThresholds: ActionThresholds;

  // Learning
  feedbackHistory: FeedbackEvent[];
  versionHistory: PersonaVersion[];
}
```

### A.3.5 Context Engine

Context Engine builds the SalesContext for every request.

```
Every SIVA request requires SalesContext.
Without SalesContext, SIVA cannot reason.
SalesContext is the "who, what, where" of every interaction.
```

## A.4 SIVA Omnipresence Rule

**"If there is a decision, SIVA sits on top of it."**

| Surface | SIVA Presence | Capability Level |
|---------|---------------|------------------|
| **User Dashboard** | Full SIVA | All tools, full reasoning |
| **Company Profile** | Contextual SIVA | "Ask about this company" |
| **Signal Detail** | Insight SIVA | "Explain this signal" |
| **Tenant Admin** | Admin SIVA | Team queries, performance |
| **Super Admin** | Orchestrator SIVA | Platform health, AI management |
| **Mobile** | Voice SIVA | Hands-free, brief responses |
| **Email/Slack** | Notification SIVA | Proactive alerts |

## A.5 SIVA Response Contract

Every SIVA response follows this structure:

```typescript
interface SIVAResponse {
  // Direct Answer
  answer: string;

  // Reasoning
  reasoning: {
    steps: ReasoningStep[];
    personaApplied: string;
    evidenceUsed: string[];
  };

  // Citations (MANDATORY)
  citations: {
    text: string;
    source: string;
    freshness: string;
    url?: string;
  }[];

  // Score (if applicable)
  score?: {
    total: number;
    breakdown: { Q: number; T: number; L: number; E: number };
  };

  // Actions (if applicable)
  suggestedActions?: Action[];

  // Confidence
  confidence: number;  // 0-1

  // Metadata
  tokensUsed: number;
  latencyMs: number;
  modelUsed: string;
}
```

## A.6 SIVA Maturity Levels

| Level | Name | Capability | Phase |
|-------|------|------------|-------|
| **L1** | Reactive | Responds to user queries | Phase 1 |
| **L2** | Proactive | Sends alerts, daily briefings | Phase 2 |
| **L3** | Predictive | Predicts outcomes, suggests timing | Phase 2-3 |
| **L4** | Autonomous | Takes actions with permission | Phase 3 |
| **L5** | Self-Improving | Learns from feedback, evolves persona | Phase 3-4 |

---

# SECTION B: SALESCONTEXT ENGINE

**"SalesContext is the DNA of every SIVA interaction."**

## B.1 What is SalesContext?

SalesContext is the **canonical input contract** for all SIVA reasoning. Every tool, every score, every recommendation requires SalesContext.

```
Without SalesContext → SIVA behaves generically
With SalesContext    → SIVA behaves as the right persona for the right user
```

## B.2 SalesContext Schema

```typescript
interface SalesContext {
  // ═══════════════════════════════════════════════════
  // SECTION 1: SALESPERSON IDENTITY
  // ═══════════════════════════════════════════════════
  vertical: string;           // "banking"
  subVertical: string;        // "employee_banking"
  region: string;             // "UAE"
  territory?: string;         // "Dubai South"

  // ═══════════════════════════════════════════════════
  // SECTION 2: DERIVED CONFIGURATION
  // (Loaded from Intelligence Pack)
  // ═══════════════════════════════════════════════════
  radarTarget: "companies" | "individuals" | "families";
  allowedSignalTypes: string[];
  scoringWeights: QTLEWeights;
  enrichmentSources: string[];
  outreachChannels: string[];

  // ═══════════════════════════════════════════════════
  // SECTION 3: PERSONA
  // (Loaded from Persona Pack)
  // ═══════════════════════════════════════════════════
  persona: Persona;

  // ═══════════════════════════════════════════════════
  // SECTION 4: USER CONTEXT
  // ═══════════════════════════════════════════════════
  userId: string;
  userName: string;
  userRole: "individual" | "tenant_member" | "tenant_admin";
  userPlan: "starter" | "pro" | "enterprise";
  userPreferences: UserPreferences;
  userHistory: UserHistory;

  // ═══════════════════════════════════════════════════
  // SECTION 5: TENANT CONTEXT (if applicable)
  // ═══════════════════════════════════════════════════
  tenantId?: string;
  tenantName?: string;
  tenantOverrides?: TenantOverrides;

  // ═══════════════════════════════════════════════════
  // SECTION 6: SESSION CONTEXT
  // ═══════════════════════════════════════════════════
  sessionId: string;
  requestId: string;
  conversationHistory: Message[];
  currentTimestamp: Date;

  // ═══════════════════════════════════════════════════
  // SECTION 7: ACTIVE FILTERS (user-applied)
  // ═══════════════════════════════════════════════════
  activeFilters?: {
    companySize?: string[];
    industry?: string[];
    signalTypes?: string[];
    dateRange?: DateRange;
  };
}
```

## B.3 SalesContext Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    REQUEST ARRIVES                                │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                 IDENTIFY USER & TENANT                            │
│  - Auth token → User ID                                          │
│  - User → Tenant (if applicable)                                 │
│  - User → Sub-Vertical assignments                               │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│               LOAD INTELLIGENCE PACK                              │
│  - Sub-Vertical → System Pack                                    │
│  - Tenant → Override Pack (if exists)                            │
│  - Merge: Overrides > System Defaults                            │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                  LOAD PERSONA PACK                                │
│  - Sub-Vertical → System Persona                                 │
│  - Tenant → Persona Overrides (if exists)                        │
│  - User → Personal Style (if Individual)                         │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                  BUILD SALESCONTEXT                               │
│  - Combine all loaded data                                       │
│  - Add session info                                              │
│  - Add conversation history                                      │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│               INJECT INTO SIVA KERNEL                             │
│  - SalesContext → MCP Phase 1                                    │
│  - MCP Phases 1-12 execute                                       │
│  - Response generated                                            │
└──────────────────────────────────────────────────────────────────┘
```

## B.4 Context Switching

Users can switch their active context (if assigned to multiple sub-verticals):

```typescript
// User switches from EB to CB
PUT /api/user/context
{
  "subVerticalId": "corporate_banking"
}

// System response:
// 1. Rebuild SalesContext with new sub-vertical
// 2. Load CB persona (replaces EB persona)
// 3. Load CB signals (replaces EB signals)
// 4. SIVA behavior changes immediately
```

---

# SECTION C: INTELLIGENCE PACK ENGINE

**"Intelligence Packs are living, breathing knowledge systems that improve themselves."**

## C.1 What is an Intelligence Pack?

An Intelligence Pack is a **self-contained bundle of knowledge and rules** for a specific sub-vertical. It includes everything SIVA needs to reason about that domain.

```
Intelligence Pack =
  Signals + Scoring + Personas + Journeys + Enrichment + Patterns
```

## C.2 Pack Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PACK HIERARCHY                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                     VERTICAL PACK                               │     │
│  │                      (Banking)                                  │     │
│  │  ┌──────────────────────────────────────────────────────────┐  │     │
│  │  │  Common: industry terms, regulatory context, market data  │  │     │
│  │  └──────────────────────────────────────────────────────────┘  │     │
│  │                           │                                     │     │
│  │     ┌─────────────────────┼─────────────────────┐              │     │
│  │     ▼                     ▼                     ▼              │     │
│  │  ┌──────────┐      ┌──────────┐      ┌──────────┐             │     │
│  │  │   EB     │      │   CB     │      │   SME    │             │     │
│  │  │  PACK    │      │  PACK    │      │  PACK    │             │     │
│  │  ├──────────┤      ├──────────┤      ├──────────┤             │     │
│  │  │ Signals  │      │ Signals  │      │ Signals  │             │     │
│  │  │ Scoring  │      │ Scoring  │      │ Scoring  │             │     │
│  │  │ Persona  │      │ Persona  │      │ Persona  │             │     │
│  │  │ Journeys │      │ Journeys │      │ Journeys │             │     │
│  │  │ Patterns │      │ Patterns │      │ Patterns │             │     │
│  │  └──────────┘      └──────────┘      └──────────┘             │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│                              ↓ Inherits                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                   TENANT OVERRIDE PACK                          │     │
│  │                   (Emirates NBD EB)                             │     │
│  │  ┌──────────────────────────────────────────────────────────┐  │     │
│  │  │  Overrides: custom tone, extra edge cases, unique rules   │  │     │
│  │  └──────────────────────────────────────────────────────────┘  │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
│                              ↓ Inherits                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                   INDIVIDUAL STYLE PACK                         │     │
│  │                   (User personal preferences)                   │     │
│  │  ┌──────────────────────────────────────────────────────────┐  │     │
│  │  │  Preferences: tone, timing, history, goals                 │  │     │
│  │  └──────────────────────────────────────────────────────────┘  │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## C.3 Pack Components

### C.3.1 Signal Pack

```typescript
interface SignalPack {
  id: string;
  subVerticalId: string;

  // Signal Definitions
  allowedSignalTypes: SignalType[];
  signalWeights: Record<SignalType, number>;  // 0-1 importance
  signalThresholds: Record<SignalType, SignalThreshold>;

  // Signal Freshness Rules
  freshnessRules: {
    signalType: SignalType;
    freshDays: number;
    staleDays: number;
    expiredDays: number;
  }[];

  // Signal Combinations
  boosterCombinations: SignalCombination[];  // When multiple signals boost score
  blockerSignals: SignalType[];              // Signals that block outreach
}

type SignalType =
  | "hiring_expansion"
  | "headcount_jump"
  | "office_opening"
  | "market_entry"
  | "funding_round"
  | "project_award"
  | "subsidiary_creation"
  | "leadership_change"
  | "m_and_a"
  | "expansion_signal";
```

### C.3.2 Scoring Pack

```typescript
interface ScoringPack {
  id: string;
  subVerticalId: string;

  // QTLE Weights
  weights: {
    quality: number;    // 0-1, sums to 1
    timing: number;
    likelihood: number;
    engagement: number;
  };

  // Thresholds
  thresholds: {
    hot: number;        // >= 80
    warm: number;       // >= 60
    cold: number;       // >= 0
    deadZone: number;   // Negative = never contact
  };

  // Score Modifiers
  modifiers: {
    signalType: SignalType;
    modifier: number;  // -1 to +1
    condition?: string;
  }[];

  // Decay Rules
  decayRules: {
    noContactDays: number;
    decayPerDay: number;
    minimumScore: number;
  };
}
```

### C.3.3 Persona Pack

```typescript
interface PersonaPack {
  id: string;
  subVerticalId: string;

  // Identity
  identity: string;
  mission: string;
  tone: "professional" | "friendly" | "aggressive" | "consultative";

  // Edge Cases
  edgeCases: {
    name: string;
    condition: string;
    action: "boost" | "block" | "modify";
    modifier?: number;
    reason: string;
  }[];

  // Timing Rules
  timingRules: {
    name: string;
    condition: string;
    bestTime: string;
    worstTime: string;
  }[];

  // Contact Priority
  contactPriority: {
    role: string;
    priority: number;
    reason: string;
  }[];

  // Outreach Doctrine
  outreachDoctrine: {
    channel: string;
    doAlways: string[];
    neverDo: string[];
  }[];

  // Anti-Patterns
  antiPatterns: string[];
}
```

### C.3.4 Journey Pack

```typescript
interface JourneyPack {
  id: string;
  subVerticalId: string;

  // Deal Stages
  stages: {
    name: string;
    order: number;
    criteria: string[];
    suggestedActions: string[];
    typicalDuration: string;
  }[];

  // Transition Rules
  transitions: {
    fromStage: string;
    toStage: string;
    triggers: string[];
    blockers: string[];
  }[];

  // Journey Patterns
  winPatterns: string[];
  lossPatterns: string[];
  stallPatterns: string[];
}
```

## C.4 Deep Intelligence Pack Auto-Generation

When Super Admin creates a new sub-vertical, the system **auto-derives** most configuration:

```
┌──────────────────────────────────────────────────────────────────┐
│              DEEP INTELLIGENCE PACK GENERATION                    │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  INPUT: Super Admin provides minimal seed                         │
│  - Vertical: Banking                                              │
│  - Sub-Vertical: Employee Banking                                 │
│  - Region: UAE                                                    │
│  - Description: "Salespeople selling payroll accounts"            │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 1: AI ANALYZES DOMAIN                                       │
│  - Industry patterns                                              │
│  - Typical sales signals for this sector                          │
│  - Common ICP profiles                                            │
│  - Best practices from similar verticals                          │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 2: AI GENERATES RECOMMENDED PACK                            │
│  - Suggested signal types (10-15)                                 │
│  - Suggested scoring weights                                      │
│  - Draft persona rules                                            │
│  - Draft journey stages                                           │
│  - Suggested enrichment sources                                   │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 3: SUPER ADMIN REVIEWS                                      │
│  - Accepts/rejects each suggestion                                │
│  - Modifies as needed                                             │
│  - Adds custom rules                                              │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 4: PACK ACTIVATED                                           │
│  - Version 1.0 created                                            │
│  - Starts collecting usage data                                   │
│  - Enters self-improvement loop                                   │
└──────────────────────────────────────────────────────────────────┘
```

## C.5 Pack Self-Improvement Loop

Intelligence Packs are **living systems** that improve themselves:

```
┌──────────────────────────────────────────────────────────────────┐
│                  SELF-IMPROVEMENT LOOP                            │
└──────────────────────────────────────────────────────────────────┘

     ┌─────────────────────────────────────────────────────┐
     │                    USAGE DATA                        │
     │  - User actions (clicked, dismissed, actioned)       │
     │  - SIVA feedback (helpful, not helpful)             │
     │  - Conversion outcomes (won, lost, stalled)          │
     │  - Time-to-action patterns                           │
     └─────────────────────────────────────────────────────┘
                               │
                               ▼
     ┌─────────────────────────────────────────────────────┐
     │                  AI ANALYSIS                         │
     │  - Pattern detection                                 │
     │  - Anomaly detection                                 │
     │  - Performance correlation                           │
     │  - A/B test results                                  │
     └─────────────────────────────────────────────────────┘
                               │
                               ▼
     ┌─────────────────────────────────────────────────────┐
     │               IMPROVEMENT SUGGESTIONS                │
     │  - "Signal X has 40% false positive rate"           │
     │  - "Edge case Y is outdated"                         │
     │  - "Weight for Q should increase by 0.05"           │
     │  - "New pattern detected: combine A+B signals"       │
     └─────────────────────────────────────────────────────┘
                               │
                               ▼
     ┌─────────────────────────────────────────────────────┐
     │              SUPER ADMIN REVIEW                      │
     │  - Approves/rejects suggestions                      │
     │  - New pack version created                          │
     │  - Changelog recorded                                │
     └─────────────────────────────────────────────────────┘
                               │
                               ▼
     ┌─────────────────────────────────────────────────────┐
     │              PACK VERSION UPDATE                     │
     │  - v1.0 → v1.1                                       │
     │  - Gradual rollout (10% → 50% → 100%)               │
     │  - Impact monitoring                                 │
     └─────────────────────────────────────────────────────┘
                               │
                               └──────────────────┐
                                                  │
                                                  ▼
                                        (Back to USAGE DATA)
```

---

# SECTION D: MULTI-AGENT AI ORCHESTRATION

**"11 AI Departments running the platform like a virtual company."**

## D.1 The AI Company Model

Super Admin is NOT a dashboard. It's a **virtual company** where AI agents manage the platform.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PREMIUMRADAR AI COMPANY                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                      AI FOUNDER BRAIN                            │    │
│  │         (What should we prioritize? What's our north star?)      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                    │                                     │
│         ┌──────────────────────────┼──────────────────────────┐         │
│         │                          │                          │         │
│         ▼                          ▼                          ▼         │
│  ┌──────────────┐          ┌──────────────┐          ┌──────────────┐  │
│  │   AI CTO     │          │   AI CRO     │          │   AI CISO    │  │
│  │  (Tech health)│          │  (Revenue)   │          │  (Security)  │  │
│  └──────────────┘          └──────────────┘          └──────────────┘  │
│         │                          │                          │         │
│         ▼                          ▼                          ▼         │
│  ┌──────────────┐          ┌──────────────┐          ┌──────────────┐  │
│  │   AI QA      │          │ AI Sales Coach│         │ AI Data Sci  │  │
│  │  (Quality)   │          │ (Performance) │          │  (Patterns)  │  │
│  └──────────────┘          └──────────────┘          └──────────────┘  │
│         │                          │                          │         │
│         ▼                          ▼                          ▼         │
│  ┌──────────────┐          ┌──────────────┐          ┌──────────────┐  │
│  │   AI PM      │          │ AI Marketing │          │   AI CS      │  │
│  │  (Roadmap)   │          │   (Growth)   │          │   (Churn)    │  │
│  └──────────────┘          └──────────────┘          └──────────────┘  │
│         │                          │                          │         │
│         ▼                          ▼                          ▼         │
│  ┌──────────────┐                                                       │
│  │   AI CFO     │                                                       │
│  │ (Unit econ)  │                                                       │
│  └──────────────┘                                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## D.2 AI Department Specifications

### D.2.1 AI Founder Brain

| Aspect | Specification |
|--------|---------------|
| **Mission** | "What should PremiumRadar focus on right now?" |
| **Interface** | Strategic Dashboard with SIVA Orchestrator |
| **Data Sources** | All department reports, market data, user feedback |
| **Capabilities** | Prioritize initiatives, detect strategic risks, suggest pivots |
| **Triggers** | Weekly synthesis, major metric changes, market events |
| **Authority** | Recommend only (humans decide) |
| **Phase** | Phase 3 |

**Example Outputs:**
```
AI Founder Brain: "Based on current data:
1. Churn risk in Enterprise tier is 15% higher than last month
2. EB UAE is saturating — consider CB expansion
3. SIVA usage dropped 8% after last update
4. Competitor X launched similar feature

RECOMMENDED PRIORITY:
1. Fix SIVA regression (AI CTO investigating)
2. Prepare CB launch (AI PM has draft)
3. Enterprise retention campaign (AI CS ready)"
```

### D.2.2 AI CTO

| Aspect | Specification |
|--------|---------------|
| **Mission** | "Is our technology healthy and performing?" |
| **Interface** | System Health Dashboard |
| **Data Sources** | Error logs, latency metrics, API costs, deployment status |
| **Capabilities** | Detect anomalies, predict outages, suggest optimizations |
| **Triggers** | Error spike, latency > threshold, cost anomaly, deployment |
| **Authority** | Alert + recommend (no auto-remediation in Phase 2) |
| **Phase** | Phase 2 (lite), Phase 3 (full) |

**Example Outputs:**
```
AI CTO Alert: "SIVA response latency increased 40% in past hour.
Root cause: Claude API throttling (429 errors).

ANALYSIS:
- Peak usage: 2-4pm UAE time
- Token usage: 3x normal
- Fallback: Gemini available

RECOMMENDATION:
1. Activate Gemini fallback for non-critical queries
2. Cache common query patterns
3. Review prompt optimization"
```

### D.2.3 AI QA

| Aspect | Specification |
|--------|---------------|
| **Mission** | "What's broken and how do we fix it?" |
| **Interface** | Quality Dashboard |
| **Data Sources** | Bug reports, test results, user complaints, regression data |
| **Capabilities** | Prioritize bugs, detect regressions, suggest test coverage |
| **Triggers** | Test failure, bug pattern, user complaint spike |
| **Authority** | Alert + prioritize |
| **Phase** | Phase 2 (lite), Phase 3 (full) |

### D.2.4 AI CRO (Chief Revenue Officer)

| Aspect | Specification |
|--------|---------------|
| **Mission** | "Are we making money efficiently?" |
| **Interface** | Revenue Dashboard |
| **Data Sources** | Billing data, conversion funnels, pricing experiments |
| **Capabilities** | Predict revenue, optimize pricing, detect revenue leaks |
| **Triggers** | Conversion drop, pricing anomaly, MRR change |
| **Authority** | Recommend pricing changes, flag revenue risks |
| **Phase** | Phase 3 |

### D.2.5 AI Sales Coach

| Aspect | Specification |
|--------|---------------|
| **Mission** | "How do we improve user sales performance?" |
| **Interface** | Performance Dashboard (Tenant Admin visible) |
| **Data Sources** | User activity, conversion rates, SIVA usage, signal actions |
| **Capabilities** | Identify underperformers, suggest coaching, share best practices |
| **Triggers** | Performance drop, stalled pipeline, low SIVA usage |
| **Authority** | Suggest interventions to Tenant Admin |
| **Phase** | Phase 3 |

**Example Outputs:**
```
AI Sales Coach (to Tenant Admin):
"Team Performance Alert:

TOP PERFORMER: Sarah (85% SIVA adoption, 12 deals closed)
- Pattern: Uses daily briefing, acts within 2 hours

AT RISK: John (23% SIVA adoption, 2 deals in 30 days)
- Pattern: Ignores high-score signals, no SIVA usage

RECOMMENDED INTERVENTION:
1. Share Sarah's workflow with team
2. One-on-one with John on SIVA adoption
3. Consider gamification for signal action speed"
```

### D.2.6 AI Data Scientist

| Aspect | Specification |
|--------|---------------|
| **Mission** | "What patterns exist that we can exploit?" |
| **Interface** | Insights Dashboard |
| **Data Sources** | All platform data, market data, conversion data |
| **Capabilities** | Pattern detection, correlation analysis, prediction models |
| **Triggers** | Weekly analysis, anomaly detection |
| **Authority** | Generate insights, suggest experiments |
| **Phase** | Phase 3 |

### D.2.7 AI CISO (Chief Information Security Officer)

| Aspect | Specification |
|--------|---------------|
| **Mission** | "Is our platform secure?" |
| **Interface** | Security Dashboard |
| **Data Sources** | Access logs, auth events, API usage patterns |
| **Capabilities** | Detect threats, compliance monitoring, vulnerability scanning |
| **Triggers** | Suspicious activity, compliance check, new deployment |
| **Authority** | Alert + recommend + block (critical threats) |
| **Phase** | Phase 3 |

### D.2.8 AI Marketing

| Aspect | Specification |
|--------|---------------|
| **Mission** | "How do we grow user acquisition?" |
| **Interface** | Growth Dashboard |
| **Data Sources** | Acquisition channels, conversion funnels, user journey |
| **Capabilities** | Optimize campaigns, suggest content, predict CAC |
| **Triggers** | Campaign performance, funnel drop-off |
| **Authority** | Recommend campaigns, content ideas |
| **Phase** | Phase 3 |

### D.2.9 AI Customer Success

| Aspect | Specification |
|--------|---------------|
| **Mission** | "Who's at risk of churning and how do we save them?" |
| **Interface** | Churn Dashboard |
| **Data Sources** | User activity, billing events, support tickets |
| **Capabilities** | Predict churn, suggest interventions, automate outreach |
| **Triggers** | Activity drop, payment failure, low engagement |
| **Authority** | Alert + suggest intervention + trigger automated outreach |
| **Phase** | Phase 3 |

**Example Outputs:**
```
AI Customer Success Alert:
"HIGH CHURN RISK: Acme Corp (Enterprise tier)

SIGNALS:
- SIVA usage dropped 60% in 14 days
- 3 users haven't logged in this week
- Support ticket: "Not seeing value"

INTERVENTION PLAN:
1. ✅ Auto-sent: Re-engagement email (sent 2 days ago)
2. 🔄 Pending: Account manager call (scheduled)
3. 💡 Suggestion: Offer custom training session

ESTIMATED SAVE PROBABILITY: 65%"
```

### D.2.10 AI PM (Product Manager)

| Aspect | Specification |
|--------|---------------|
| **Mission** | "Are we shipping on time and building the right things?" |
| **Interface** | Roadmap Dashboard |
| **Data Sources** | Sprint data, feature requests, usage data |
| **Capabilities** | Track progress, prioritize features, predict delays |
| **Triggers** | Sprint end, feature launch, delay detected |
| **Authority** | Recommend prioritization |
| **Phase** | Phase 3 |

### D.2.11 AI CFO

| Aspect | Specification |
|--------|---------------|
| **Mission** | "What's our unit economics and burn rate?" |
| **Interface** | Finance Dashboard |
| **Data Sources** | Billing, API costs, infrastructure costs, LTV/CAC |
| **Capabilities** | Cost tracking, margin analysis, burn prediction |
| **Triggers** | Cost spike, margin change, budget threshold |
| **Authority** | Alert + recommend cost optimization |
| **Phase** | Phase 3 |

## D.3 AI Orchestration Protocol

All AI Departments communicate through the **AI Orchestrator**:

```typescript
interface AIDepartmentReport {
  departmentId: string;
  timestamp: Date;

  // Status
  healthScore: number;  // 0-100
  status: "healthy" | "warning" | "critical";

  // Alerts
  alerts: Alert[];

  // Recommendations
  recommendations: Recommendation[];

  // Dependencies
  dependsOn: string[];  // Other departments
  blockedBy: string[];
}

interface Alert {
  severity: "info" | "warning" | "critical";
  message: string;
  dataPoints: any[];
  suggestedAction: string;
  autoActionTaken?: string;
}

interface Recommendation {
  priority: "P0" | "P1" | "P2";
  description: string;
  expectedImpact: string;
  effort: "low" | "medium" | "high";
  owningDepartment: string;
}
```

---

# SECTION E: API & COST GOVERNANCE ENGINE

**"Intelligent cost optimization across all external APIs."**

## E.1 API Landscape

PremiumRadar uses multiple external APIs that need governance:

| Category | APIs | Cost Model |
|----------|------|------------|
| **LLM** | Claude, Gemini, OpenAI | Per token |
| **Search** | SERP API, Google Search | Per query |
| **Enrichment** | Apollo, LinkedIn, ZoomInfo | Per lookup |
| **Email** | ZeroBounce, NeverBounce | Per validation |
| **Data** | Company databases, news APIs | Per query |

## E.2 Cost Governance Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    API COST GOVERNANCE ENGINE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                     API ROUTER                                  │     │
│  │  - Selects optimal API based on cost/quality                   │     │
│  │  - Applies fallback rules                                       │     │
│  │  - Enforces rate limits                                         │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                               │                                          │
│         ┌─────────────────────┼─────────────────────┐                   │
│         ▼                     ▼                     ▼                   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐          │
│  │ Cost Tracker │      │  Threshold   │      │   Fallback   │          │
│  │              │      │   Monitor    │      │    System    │          │
│  │ Per-tenant   │      │              │      │              │          │
│  │ Per-API      │      │ Alerts when  │      │ Switch when  │          │
│  │ Per-user     │      │ approaching  │      │ primary fails│          │
│  └──────────────┘      └──────────────┘      └──────────────┘          │
│                               │                                          │
│                               ▼                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                    AI COST OPTIMIZER                            │     │
│  │  - Predicts cost trends                                        │     │
│  │  - Suggests optimizations                                       │     │
│  │  - Detects anomalies                                            │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## E.3 Cost Tracking Schema

```typescript
interface APIUsage {
  id: string;
  timestamp: Date;

  // Identity
  tenantId: string;
  userId: string;
  requestId: string;

  // API Details
  apiProvider: string;       // "claude", "serp", "apollo"
  apiEndpoint: string;

  // Cost
  unitsUsed: number;         // Tokens, queries, lookups
  costUSD: number;

  // Context
  vertical: string;
  subVertical: string;
  feature: string;           // "siva_chat", "enrichment", "scoring"

  // Performance
  latencyMs: number;
  success: boolean;
  errorCode?: string;
}

interface CostBudget {
  tenantId: string;

  // Limits
  dailyLimitUSD: number;
  monthlyLimitUSD: number;

  // Alerts
  alertAt: number[];         // [0.5, 0.8, 0.95] = 50%, 80%, 95%

  // Actions
  onLimitReached: "alert" | "throttle" | "block";
}
```

## E.4 Intelligent API Routing

```typescript
interface APIRoutingRule {
  useCase: string;

  // Options (in priority order)
  options: {
    provider: string;
    costPerUnit: number;
    qualityScore: number;  // 0-1
    latencyMs: number;
  }[];

  // Selection Logic
  selectionCriteria: "lowest_cost" | "highest_quality" | "balanced";

  // Fallback
  fallbackProvider: string;
  fallbackTriggers: string[];  // ["rate_limit", "error", "timeout"]
}
```

**Example Routing:**
```
LLM Query Routing:
├── Complex reasoning → Claude Opus (high cost, high quality)
├── Standard chat → Claude Sonnet (medium cost, medium quality)
├── Simple queries → Claude Haiku (low cost, fast)
├── Image analysis → Gemini 2.0 (multimodal)
└── Fallback → Gemini 1.5 Flash (if Claude rate limited)
```

## E.5 Cost Optimization AI

The AI Cost Optimizer actively monitors and suggests:

```
AI Cost Optimizer Alert:
"SERP API cost increased 42% this week.

ANALYSIS:
- Cause: 3 users running bulk company searches
- Pattern: Same companies searched repeatedly
- Waste: 67% of queries are duplicates

RECOMMENDATIONS:
1. Implement 24-hour search cache (saves $450/month)
2. Limit bulk searches to 50/day per user
3. Pre-fetch top 100 companies in each territory

ESTIMATED SAVINGS: $1,200/month"
```

---

# SECTION F: SELF-HEALING ENGINE

**"Systems that detect, diagnose, and fix themselves."**

## F.1 Self-Healing Philosophy

Traditional systems: Human detects problem → Human diagnoses → Human fixes
Self-healing systems: AI detects → AI diagnoses → AI fixes or escalates

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SELF-HEALING ENGINE                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                      TELEMETRY LAYER                            │     │
│  │  - Collects all system events                                   │     │
│  │  - User actions, API calls, errors, latency, costs              │     │
│  │  - Stores in BigQuery for analysis                              │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                               │                                          │
│                               ▼                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                    ANOMALY DETECTION                            │     │
│  │  - Baseline normal behavior                                     │     │
│  │  - Detect deviations                                            │     │
│  │  - Classify severity                                            │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                               │                                          │
│                               ▼                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                    ROOT CAUSE ANALYSIS                          │     │
│  │  - Correlate anomalies with changes                            │     │
│  │  - Identify likely causes                                       │     │
│  │  - Suggest fixes                                                │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                               │                                          │
│                               ▼                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                    AUTO-CORRECTION                              │     │
│  │  - Apply safe fixes automatically                              │     │
│  │  - Escalate risky fixes to humans                              │     │
│  │  - Monitor fix effectiveness                                    │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## F.2 Self-Healing Domains

### F.2.1 Pack Self-Healing

```
DETECTION: Signal "hiring_expansion" has 35% false positive rate
DIAGNOSIS: Threshold too low (5 hires triggers, should be 10)
FIX: Suggest threshold adjustment to Super Admin
MONITORING: Track false positive rate after change
```

### F.2.2 Persona Self-Healing

```
DETECTION: Edge case "payroll season" no longer triggering
DIAGNOSIS: Date range in rule is outdated (2024 dates)
FIX: Update date range automatically, notify Super Admin
MONITORING: Confirm edge case now triggers correctly
```

### F.2.3 Scoring Self-Healing

```
DETECTION: High-score companies have 20% lower conversion than medium-score
DIAGNOSIS: Timing weight too high, quality weight too low
FIX: Suggest weight adjustment, run A/B test
MONITORING: Track conversion rate changes
```

### F.2.4 API Self-Healing

```
DETECTION: Claude API returning 429 errors
DIAGNOSIS: Rate limit hit during peak hours
FIX: Automatically switch to Gemini fallback
MONITORING: Track quality of fallback responses
```

## F.3 Feedback Loop Integration

User feedback drives self-healing:

```typescript
interface FeedbackEvent {
  userId: string;
  timestamp: Date;

  // What was rated
  entityType: "siva_response" | "signal" | "score" | "outreach";
  entityId: string;

  // Rating
  rating: "helpful" | "not_helpful" | "wrong" | "excellent";
  comment?: string;

  // Context
  salesContext: SalesContext;

  // Outcome (if known later)
  outcome?: "converted" | "lost" | "stalled";
}
```

**Feedback → Improvement Flow:**
```
User marks SIVA response as "not helpful"
        ↓
System logs feedback with full context
        ↓
Weekly AI analysis of negative feedback
        ↓
Pattern detected: "Outreach suggestions too aggressive for EB"
        ↓
Suggestion generated: "Adjust EB persona tone to 'consultative'"
        ↓
Super Admin reviews and approves
        ↓
Persona pack updated, new version deployed
        ↓
Track if negative feedback decreases
```

---

# SECTION G: TENANCY ENGINE

**"Multi-tenant intelligence with enterprise-grade personalization."**

## G.1 Tenancy Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TENANCY HIERARCHY                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │                      PLATFORM LEVEL                             │     │
│  │  (PremiumRadar Global)                                          │     │
│  │  - System Packs                                                 │     │
│  │  - Global configurations                                        │     │
│  │  - Super Admin access                                           │     │
│  └────────────────────────────────────────────────────────────────┘     │
│                               │                                          │
│         ┌─────────────────────┼─────────────────────┐                   │
│         ▼                     ▼                     ▼                   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐          │
│  │   TENANT A   │      │   TENANT B   │      │ INDIVIDUAL   │          │
│  │ (Enterprise) │      │    (Pro)     │      │   USERS      │          │
│  │              │      │              │      │              │          │
│  │ Override packs│     │ Default packs│      │ Mini-persona │          │
│  │ Custom rules │      │              │      │ Personal style│          │
│  │ SSO          │      │              │      │              │          │
│  └──────────────┘      └──────────────┘      └──────────────┘          │
│         │                     │                     │                   │
│         ▼                     ▼                     ▼                   │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐          │
│  │    USERS     │      │    USERS     │      │    USER      │          │
│  │ (with roles) │      │ (with roles) │      │  (self)      │          │
│  └──────────────┘      └──────────────┘      └──────────────┘          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## G.2 Tenant Types

### G.2.1 Enterprise Tenant

```typescript
interface EnterpriseTenant {
  id: string;
  name: string;
  plan: "enterprise";

  // Multi Sub-Vertical
  subVerticals: TenantSubVertical[];  // Can have multiple

  // Customization
  overridePacks: {
    personaOverride?: PersonaPack;
    scoringOverride?: ScoringPack;
    outreachOverride?: OutreachPack;
  };

  // Enterprise Features
  sso: {
    enabled: boolean;
    provider: "saml" | "oidc";
    config: SSOConfig;
  };

  customRoles: Role[];
  auditLogs: boolean;
  dataResidency: string;

  // AI Customization
  enterpriseSIVA: {
    customTone?: string;
    customAntiPatterns?: string[];
    customOutreachRules?: OutreachRule[];
  };

  // Team Structure
  teams: Team[];
  managers: string[];
}
```

### G.2.2 Pro/Starter Tenant

```typescript
interface StandardTenant {
  id: string;
  name: string;
  plan: "pro" | "starter";

  // Single Sub-Vertical (Starter) or up to 3 (Pro)
  subVerticals: TenantSubVertical[];

  // Limited Customization
  limitedOverrides: {
    tonePreference?: "professional" | "friendly" | "aggressive";
  };

  // Basic Team
  maxUsers: number;  // 5 for Starter, 25 for Pro
}
```

### G.2.3 Individual User

```typescript
interface IndividualUser {
  id: string;
  email: string;
  plan: "starter" | "pro";

  // Context
  vertical: string;
  subVertical: string;
  region: string;

  // Mini-Persona (personal style)
  miniPersona: {
    name: string;
    preferredTone: "professional" | "friendly" | "casual";
    communicationStyle: string;
    goals: string[];
    preferredChannels: string[];
    workingHours: TimeRange;
  };

  // History
  conversationHistory: Message[];
  signalActions: SignalAction[];
  conversionHistory: Conversion[];

  // Learning
  feedbackHistory: FeedbackEvent[];
  learnedPreferences: Record<string, any>;
}
```

## G.3 Tenant Admin AI

Enterprise tenants get their own AI assistant:

```
Tenant Admin SIVA Capabilities:
├── "Who on my team needs coaching?"
├── "What's our team conversion rate this month?"
├── "Which signals are my team ignoring?"
├── "Show me our best performer's workflow"
├── "Generate a team performance report"
├── "Which campaigns are working?"
├── "Suggest team training topics"
└── "Optimize our territory assignments"
```

## G.4 Tenant Provisioning Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                   TENANT PROVISIONING                             │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 1: SIGNUP                                                   │
│  - Company signs up                                               │
│  - Selects plan (Starter/Pro/Enterprise)                          │
│  - Admin user created                                             │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 2: CONTEXT SELECTION                                        │
│  - Select vertical (Banking)                                      │
│  - Select sub-vertical (Employee Banking)                         │
│  - Select region (UAE)                                            │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 3: PACK ASSIGNMENT                                          │
│  - Load system packs for selected sub-vertical                   │
│  - Create tenant workspace                                        │
│  - Initialize with demo data (optional)                           │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 4: ONBOARDING                                               │
│  - Guided tour                                                    │
│  - First SIVA interaction                                         │
│  - Connect data sources (CRM - Phase 3)                          │
│  - Invite team members                                            │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 5: CUSTOMIZATION (Enterprise)                               │
│  - Configure SSO                                                  │
│  - Create custom roles                                            │
│  - Apply persona overrides                                        │
│  - Define outreach rules                                          │
└──────────────────────────────────────────────────────────────────┘
```

---

# SECTION H: GTM LAYER

**"How we capture the market."**

## H.1 Market Positioning

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MARKET POSITIONING                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  CATEGORY: AI-Native Sales Intelligence Platform                        │
│                                                                          │
│  POSITIONING STATEMENT:                                                  │
│  "PremiumRadar is the Perplexity of Sales — an AI operating system     │
│   that tells salespeople who to call, what to say, and when to act."   │
│                                                                          │
│  DIFFERENTIATION:                                                        │
│  ┌──────────────────┬────────────────────┬────────────────────┐         │
│  │    Competitors   │     What They Do    │   What We Do       │         │
│  ├──────────────────┼────────────────────┼────────────────────┤         │
│  │ ZoomInfo         │ Data provider       │ AI advisor         │         │
│  │ Apollo           │ Prospecting tool    │ Full OS            │         │
│  │ Gong             │ Call intelligence   │ Proactive AI       │         │
│  │ Salesforce       │ CRM + Einstein      │ CRM-agnostic       │         │
│  │ LinkedIn Sales   │ Network insights    │ Multi-source       │         │
│  └──────────────────┴────────────────────┴────────────────────┘         │
│                                                                          │
│  WAKE WORD: "Hey SIVA"                                                  │
│  TAGLINE: "The AI that knows who to call next"                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## H.2 Target Segments

### Phase 1 Target: Banking Sales Teams in UAE

| Segment | Size | ICP | Pain Point |
|---------|------|-----|------------|
| **Employee Banking Reps** | ~5,000 in UAE | 25-45 years, B2B sales, corporate accounts | "I don't know which companies to call" |
| **Corporate Banking RMs** | ~2,000 in UAE | Senior, relationship-focused | "I need intelligence, not data" |
| **SME Banking Officers** | ~3,000 in UAE | Volume-focused, multi-tasking | "Too many leads, no prioritization" |

### Phase 2-3 Expansion

| Vertical | Region | Timing |
|----------|--------|--------|
| Banking CB + SME | UAE | Phase 2 |
| Banking EB | India | Phase 2 |
| Insurance | UAE | Phase 3 |
| Real Estate | UAE | Phase 3 |

## H.3 Pricing Strategy

### Pricing Tiers

| Tier | Price | Users | SIVA Access | Signals | Support |
|------|-------|-------|-------------|---------|---------|
| **Starter** | $49/user/mo | 1-5 | Basic (50 msg/day) | 100/mo | Email |
| **Pro** | $99/user/mo | 1-25 | Pro (200 msg/day) | 500/mo | Email + Chat |
| **Enterprise** | Custom | Unlimited | Full + API | Unlimited | Dedicated |

### Pricing Philosophy

```
NOT: Pay for data
IS: Pay for intelligence

NOT: Per-seat licensing
IS: Per-value delivered

Future: Usage-based component (per conversion assisted)
```

## H.4 Launch Strategy

### Pre-Launch (Phase 1)

```
┌──────────────────────────────────────────────────────────────────┐
│                   PRE-LAUNCH CHECKLIST                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ✅ LANDING PAGE                                                  │
│     - Stealth mode active                                        │
│     - Waitlist capture                                           │
│     - Demo request form                                          │
│     - "Request Early Access" CTA                                 │
│                                                                   │
│  ✅ DEMO ENVIRONMENT                                              │
│     - Demo tenant with sample data                               │
│     - Scripted demo flow                                         │
│     - Video walkthroughs                                         │
│                                                                   │
│  ✅ CONTENT                                                       │
│     - Product explainer video (2 min)                            │
│     - SIVA demo video (5 min)                                    │
│     - Use case videos (per sub-vertical)                         │
│     - Blog posts for SEO                                         │
│                                                                   │
│  ✅ SALES ASSETS                                                  │
│     - Pitch deck                                                 │
│     - One-pager per vertical                                     │
│     - ROI calculator                                             │
│     - Case study template                                        │
│                                                                   │
│  ✅ ONBOARDING                                                    │
│     - Welcome email sequence                                     │
│     - In-app guided tour                                         │
│     - First SIVA interaction script                              │
│     - "Time to first value" optimization                         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Launch Channels

| Channel | Strategy | Phase |
|---------|----------|-------|
| **LinkedIn** | Founder content, SIVA demos | 1 |
| **Direct Sales** | Banking RM relationships | 1 |
| **Partnerships** | Banking associations, training firms | 1 |
| **Content** | SEO, YouTube, podcasts | 1-2 |
| **Events** | UAE fintech events, sales conferences | 2 |
| **Paid** | LinkedIn Ads, Google Ads | 2 |
| **Affiliates** | Sales trainers, consultants | 2-3 |

### Launch Metrics

| Metric | Phase 1 Target | Phase 2 Target |
|--------|----------------|----------------|
| Waitlist signups | 1,000 | N/A |
| Beta users | 100 | 500 |
| Paying customers | 10 | 100 |
| MRR | $10K | $100K |
| NPS | 40+ | 50+ |
| Time to first value | < 5 min | < 3 min |

## H.5 Customer Success Model

```
┌──────────────────────────────────────────────────────────────────┐
│                   CUSTOMER SUCCESS MODEL                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ONBOARDING (Day 0-7):                                           │
│  - Welcome email + video                                         │
│  - Guided setup wizard                                           │
│  - First SIVA conversation                                       │
│  - First signal viewed                                           │
│  - Goal: "Time to first value" < 5 minutes                       │
│                                                                   │
│  ACTIVATION (Day 7-30):                                          │
│  - Daily SIVA usage                                              │
│  - First outreach drafted                                        │
│  - First deal influenced                                         │
│  - Goal: "Habit formation"                                       │
│                                                                   │
│  RETENTION (Day 30+):                                            │
│  - Regular SIVA usage (>3x/week)                                 │
│  - Multiple deals influenced                                     │
│  - Positive feedback                                             │
│  - Goal: "Indispensable"                                         │
│                                                                   │
│  EXPANSION (Enterprise):                                          │
│  - Add users                                                     │
│  - Add sub-verticals                                             │
│  - Custom integrations                                           │
│  - Goal: "Platform"                                              │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

# SECTION I: PHASE EXECUTION

**"Phased rollout from MVP to AI dominance."**

## I.1 Phase Overview

| Phase | Name | Sprints | Goal | ARR Target |
|-------|------|---------|------|------------|
| **1** | Launch Ready | S133-S152 (20) | First paying customers | $100K |
| **2** | Intelligence Engine | S153-S167 (15) | SIVA indispensable | $500K |
| **3** | Enterprise Ready | S168-S182 (15) | SOC2, SDK, mobile, enterprise | $3M |
| **4** | Scale & Expand | S183-S202 (20) | Multi-vertical, SLM | $20M |
| **5** | Dominance | S203-S217 (15) | Platform play, $100M+ | $100M |

## I.2 Phase 1: Launch Ready

**Focus: EB + UAE + Individual Users. Nothing else.**

### I.2.1 Phase 1 Scope

| IN Phase 1 | NOT IN Phase 1 |
|------------|----------------|
| Banking vertical | Insurance, RE, Recruitment, SaaS |
| EB sub-vertical only | CB, SME intelligence |
| UAE region | India, US, others |
| Individual users | Multi-tenant enterprise |
| Text SIVA | Voice, proactive, SDK |
| Basic tools (score, search, prioritize, outreach draft) | ML scoring, predictions |
| Stripe billing | Custom enterprise pricing |
| Email support | Dedicated support |

### I.2.2 Phase 1 Deliverables

**SIVA Kernel:**
- [ ] MCP 12-phase orchestration working
- [ ] Evidence engine with citations
- [ ] 5 core tools (score, search, prioritize, company_info, outreach_draft)
- [ ] EB persona loaded dynamically
- [ ] Session memory (no long-term)

**SalesContext Engine:**
- [ ] Context building from user profile
- [ ] Persona injection working
- [ ] Pack loading functional

**Intelligence Pack:**
- [ ] EB UAE pack complete (signals, scoring, persona, journeys)
- [ ] Pack CRUD in Super Admin

**User Experience:**
- [ ] Onboarding wizard
- [ ] Dashboard with SIVA quick input
- [ ] Signal list with filtering
- [ ] Company profiles
- [ ] SIVA chat interface

**Admin:**
- [ ] Super Admin: Pack viewer, tenant list
- [ ] Tenant Admin: User management, billing

**Billing:**
- [ ] Stripe integration
- [ ] 3 tiers working

### I.2.3 Phase 1 Exit Criteria

- [ ] 10 paying customers
- [ ] Full user journey working
- [ ] SIVA answering correctly 90%+ of queries
- [ ] Billing functional
- [ ] 95%+ uptime for 2 weeks
- [ ] Demo tenant ready

## I.3 Phase 2: Intelligence Engine

**Focus: SIVA becomes indispensable. Users say "I can't work without SIVA."**

### I.3.1 Phase 2 Additions

| Category | Additions |
|----------|-----------|
| **SIVA** | Proactive daily briefings, citations, long-term memory, voice input |
| **Intelligence** | Knowledge graph, pattern detection, ML-enhanced scoring |
| **Packs** | Self-improvement loop activated |
| **AI Departments** | AI CTO (lite), AI QA (lite) |
| **Analytics** | User behavior ML, engagement tracking |
| **Tenancy** | CB + SME sub-verticals, India region |

### I.3.2 Phase 2 Exit Criteria

- [ ] Daily proactive briefings working
- [ ] Citation system complete
- [ ] 50% of users use SIVA daily
- [ ] Pack self-improvement suggestions working
- [ ] NPS > 40

## I.4 Phase 3: Enterprise Ready

**Focus: SOC2, SDK, mobile, enterprise customers.**

### I.4.1 Phase 3 Additions

| Category | Additions |
|----------|-----------|
| **Compliance** | SOC2 Type II, GDPR, audit logs |
| **Enterprise** | SSO (SAML/OIDC), custom RBAC, bulk import |
| **Platform** | SIVA SDK v1, public API |
| **Mobile** | iOS/Android app with voice |
| **Integrations** | Salesforce, HubSpot |
| **AI Departments** | Full 11 departments active |

### I.4.2 Phase 3 Exit Criteria

- [ ] SOC2 Type II audit passed
- [ ] SIVA SDK on npm
- [ ] Mobile app in stores
- [ ] 5 enterprise customers ($50K+ ACV)
- [ ] 2+ CRM integrations live

---

# SECTION J: ANTI-GOALS & GUARDRAILS

**"What NOT to build and how to stay safe."**

## J.1 Phase-Gated Anti-Goals

### Phase 1 Anti-Goals (DO NOT BUILD)

| Category | Anti-Goal | Reason |
|----------|-----------|--------|
| **Verticals** | Insurance, RE, Recruitment, SaaS | Banking first |
| **Sub-Verticals** | CB, SME intelligence | EB first |
| **Regions** | India, US | UAE first |
| **SIVA** | Voice input | Phase 2 |
| **SIVA** | Proactive alerts | Phase 2 |
| **SIVA** | Long-term memory | Phase 2 |
| **SIVA** | SDK/API | Phase 3 |
| **Intelligence** | ML-based scoring | Phase 2 |
| **Intelligence** | Knowledge graph | Phase 2 |
| **Intelligence** | Pattern detection | Phase 2 |
| **Mobile** | Native app | Phase 3 |
| **Enterprise** | SSO, custom RBAC, audit logs | Phase 3 |
| **Compliance** | SOC2 | Phase 3 |
| **Integrations** | Salesforce, HubSpot | Phase 3 |
| **AI Departments** | Full 11 | Phase 3 |

## J.2 AI Guardrails

### J.2.1 Hallucination Prevention

```typescript
interface HallucinationGuard {
  // Never make up data
  rules: [
    "All company data must come from verified sources",
    "If data is unavailable, say 'I don't have that information'",
    "Never invent contact names, phone numbers, or emails",
    "Always cite sources for factual claims"
  ];

  // Confidence thresholds
  confidenceThresholds: {
    high: 0.8,    // Confident statement
    medium: 0.5,  // "I think" / "It appears"
    low: 0.3,     // "I'm not sure, but..."
    refuse: 0.0   // "I don't have enough information"
  };
}
```

### J.2.2 Persona Governance

```typescript
interface PersonaGovernance {
  // Persona cannot
  forbidden: [
    "Recommend illegal activities",
    "Provide personal advice (legal, medical, financial)",
    "Make promises on behalf of companies",
    "Share confidential information",
    "Discriminate based on protected characteristics"
  ];

  // Persona audit
  auditRequirements: {
    changeApproval: "Super Admin",
    changeLog: true,
    rollbackCapability: true,
    testingRequired: true
  };
}
```

### J.2.3 Cost Guardrails

```typescript
interface CostGuardrails {
  // Per-tenant limits
  tenantLimits: {
    starter: { dailyUSD: 5, monthlyUSD: 50 },
    pro: { dailyUSD: 25, monthlyUSD: 250 },
    enterprise: { dailyUSD: 100, monthlyUSD: 1000 }
  };

  // Actions when limit approached
  onLimitApproach: {
    at80Percent: "alert_admin",
    at95Percent: "throttle_non_critical",
    at100Percent: "block_new_queries"
  };

  // Never exceed
  absoluteMaxPerQuery: 1.00;  // USD
}
```

### J.2.4 Security Guardrails

```typescript
interface SecurityGuardrails {
  // Data isolation
  dataIsolation: {
    tenantDataNeverMixed: true,
    crossTenantQueryBlocked: true,
    RLSEnforced: true
  };

  // Auth requirements
  auth: {
    sessionTimeout: "24h",
    mfaForAdmin: true,
    apiKeyRotation: "90d"
  };

  // Sensitive data
  sensitiveData: {
    piiMaskedInLogs: true,
    noCreditCardStorage: true,
    gdprCompliant: true
  };
}
```

## J.3 Failure Mode Design

| Failure | Detection | Response | Recovery |
|---------|-----------|----------|----------|
| LLM API down | Health check | Fallback to secondary | Auto-switch back |
| High latency | P95 > 3s | Cache + queue | Alert + scale |
| Bad persona | Negative feedback spike | Rollback | Manual review |
| Cost spike | 150% of normal | Throttle + alert | Investigate |
| Data breach | Anomaly detection | Lockdown | Incident response |

---

# SECTION K: SUCCESS METRICS

**"How we measure everything."**

## K.1 North Star Metrics

| Metric | Definition | Target (Phase 1) | Target (Phase 3) |
|--------|------------|------------------|------------------|
| **DAU** | Daily Active Users | 100 | 10,000 |
| **SIVA Usage** | Queries per user per day | 5 | 15 |
| **Conversion Influence** | % of deals SIVA touched | 30% | 70% |
| **NPS** | Net Promoter Score | 40 | 60 |
| **MRR** | Monthly Recurring Revenue | $10K | $250K |

## K.2 SIVA Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Response accuracy | % of helpful responses | 90%+ |
| Citation coverage | % of responses with citations | 95%+ |
| Tool usage | % of queries using tools | 60%+ |
| Latency (p50) | Median response time | < 2s |
| Latency (p95) | 95th percentile | < 5s |

## K.3 Pack Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Signal accuracy | % of signals that lead to action | 40%+ |
| Score correlation | Score vs conversion correlation | 0.7+ |
| Persona fit | % of users satisfied with tone | 85%+ |
| Self-improvement rate | Suggestions per week | 3+ |

## K.4 Business Metrics

| Metric | Definition | Phase 1 | Phase 3 |
|--------|------------|---------|---------|
| MRR | Monthly recurring | $10K | $250K |
| ARR | Annual recurring | $100K | $3M |
| Customers | Paying customers | 10 | 500 |
| ARPU | Average revenue per user | $75 | $100 |
| Churn | Monthly churn rate | <5% | <3% |
| CAC | Customer acquisition cost | $500 | $300 |
| LTV | Lifetime value | $2,000 | $5,000 |
| LTV:CAC | Ratio | 4:1 | 15:1 |

## K.5 AI Department Metrics

| Department | Primary Metric | Target |
|------------|----------------|--------|
| AI CTO | System uptime | 99.9% |
| AI QA | Bug escape rate | <1% |
| AI CRO | Revenue growth | 15%/mo |
| AI CS | Churn rate | <3%/mo |
| AI Sales Coach | User performance uplift | 20% |
| AI CFO | Gross margin | 80%+ |

---

# SECTION L: TECHNICAL IMPLEMENTATION

**"Database, APIs, and infrastructure."**

## L.1 Technology Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | Next.js 15, React, TypeScript | Cloud Run hosting |
| **Backend** | Node.js, Express | Cloud Run |
| **Database** | PostgreSQL (Cloud SQL) | Multi-tenant |
| **Analytics** | BigQuery | Event streaming |
| **Auth** | Auth0 | + SSO (Phase 3) |
| **LLM** | Claude, Gemini | Router for selection |
| **Vector DB** | Vertex AI Vector Search | Phase 2 |
| **Payments** | Stripe | Subscription billing |
| **Mobile** | React Native | Phase 3 |

## L.2 Core Database Schema

```sql
-- Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) DEFAULT 'starter',
  stripe_customer_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tenant Sub-Verticals
CREATE TABLE tenant_sub_verticals (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  sub_vertical_id UUID REFERENCES sub_verticals(id),
  is_primary BOOLEAN DEFAULT false,
  persona_override_pack_id UUID,
  scoring_override_pack_id UUID,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),  -- NULL for individuals
  auth0_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'member',
  user_type VARCHAR(50) NOT NULL,  -- 'individual', 'tenant_member', 'tenant_admin'
  status VARCHAR(20) DEFAULT 'active',
  mini_persona JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Sub-Vertical Assignments
CREATE TABLE user_sub_vertical_assignments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  tenant_sub_vertical_id UUID REFERENCES tenant_sub_verticals(id),
  is_primary BOOLEAN DEFAULT false,
  assigned_at TIMESTAMP DEFAULT NOW()
);

-- Verticals
CREATE TABLE verticals (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sub-Verticals
CREATE TABLE sub_verticals (
  id UUID PRIMARY KEY,
  vertical_id UUID REFERENCES verticals(id),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  radar_target VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(vertical_id, name)
);

-- Packs
CREATE TABLE packs (
  id UUID PRIMARY KEY,
  type VARCHAR(50) NOT NULL,  -- 'persona', 'signal', 'scoring', 'journey', 'outreach'
  scope VARCHAR(50) NOT NULL,  -- 'system', 'tenant'
  sub_vertical_id UUID REFERENCES sub_verticals(id),
  tenant_id UUID REFERENCES tenants(id),
  parent_pack_id UUID REFERENCES packs(id),
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  config JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- SIVA Sessions
CREATE TABLE siva_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id),
  sales_context JSONB NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  message_count INT DEFAULT 0
);

-- SIVA Messages
CREATE TABLE siva_messages (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES siva_sessions(id),
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  tool_calls JSONB,
  citations JSONB,
  reasoning JSONB,
  tokens_used INT,
  latency_ms INT,
  model_used VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Evidence
CREATE TABLE evidence (
  id UUID PRIMARY KEY,
  source_type VARCHAR(50) NOT NULL,
  source_id VARCHAR(255),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  weight DECIMAL(3,2) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  freshness_score DECIMAL(3,2) NOT NULL,
  captured_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  source_url TEXT,
  raw_payload JSONB,
  extracted_facts TEXT[],
  related_evidence_ids UUID[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Signals
CREATE TABLE signals (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  signal_type VARCHAR(100) NOT NULL,
  signal_data JSONB NOT NULL,
  evidence_ids UUID[],
  score DECIMAL(5,2),
  freshness_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tenant Signals (view per tenant)
CREATE TABLE tenant_signals (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  signal_id UUID REFERENCES signals(id),
  status VARCHAR(50) DEFAULT 'new',
  viewed_at TIMESTAMP,
  actioned_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- API Usage
CREATE TABLE api_usage (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  request_id VARCHAR(255),
  api_provider VARCHAR(100) NOT NULL,
  api_endpoint VARCHAR(255),
  units_used INT NOT NULL,
  cost_usd DECIMAL(10,6) NOT NULL,
  feature VARCHAR(100),
  latency_ms INT,
  success BOOLEAN,
  error_code VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Feedback
CREATE TABLE feedback (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  rating VARCHAR(50) NOT NULL,
  comment TEXT,
  sales_context JSONB,
  outcome VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## L.3 Key API Endpoints

### SIVA APIs
```
POST   /api/siva/chat              # Send message to SIVA
GET    /api/siva/sessions          # Get user's sessions
GET    /api/siva/sessions/:id      # Get session messages
POST   /api/siva/tools/:name       # Execute specific tool
POST   /api/siva/feedback          # Submit feedback
```

### Context APIs
```
GET    /api/context                # Get current SalesContext
PUT    /api/context                # Switch sub-vertical
```

### Signal APIs
```
GET    /api/signals                # Get user's signals
GET    /api/signals/:id            # Get signal detail
PUT    /api/signals/:id/action     # Mark as actioned/dismissed
```

### Pack APIs (Super Admin)
```
GET    /api/admin/packs            # List all packs
GET    /api/admin/packs/:id        # Get pack detail
POST   /api/admin/packs            # Create pack
PUT    /api/admin/packs/:id        # Update pack
POST   /api/admin/packs/:id/version # Create new version
```

### AI Department APIs (Super Admin)
```
GET    /api/admin/ai/health        # Get AI CTO health report
GET    /api/admin/ai/quality       # Get AI QA report
GET    /api/admin/ai/revenue       # Get AI CRO report
GET    /api/admin/ai/churn         # Get AI CS report
GET    /api/admin/ai/orchestrator  # Get full AI Orchestrator report
```

---

# DOCUMENT CONTROL

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-07 | TC | Initial unified PRD |
| 2.0 | 2025-12-08 | TC | 12-point founder review integration |
| 3.0 | 2025-12-08 | TC | Complete re-foundation as SIVA OS |

### Version 3.0 Changes

This version is a **complete re-foundation**, not an incremental update.

**Structural Changes:**
- Rebuilt around SIVA OS Kernel concept
- SalesContext as canonical layer
- Intelligence Packs as self-improving systems
- Multi-Agent AI Orchestration (11 departments)
- API & Cost Governance Engine
- Self-Healing Engine
- GTM Layer integrated

**Philosophy Changes:**
- From "SaaS with AI features" to "AI OS for sales"
- From "dashboards" to "intelligent agents"
- From "static configuration" to "self-improving packs"
- From "enterprise SaaS" to "platform for 2030"

---

**END OF MASTER PRD v3.0**

**This is the blueprint for SIVA OS — the AI Operating System for Sales.**

---

## APPENDIX: JOBS TO BE DONE (JTBD)

Every feature must map to a user job. If it doesn't serve a job, don't build it.

| Job ID | User Says | SIVA Delivers | Phase |
|--------|-----------|---------------|-------|
| **J1** | "Which leads should I focus on today?" | Prioritized list with reasoning | 1 |
| **J2** | "Which companies are heating up?" | Signal-based company ranking | 1 |
| **J3** | "What do I say to this prospect?" | Context-aware talking points | 1 |
| **J4** | "I have a call in 10 mins, brief me" | Company + contact + history summary | 1 |
| **J5** | "How is my pipeline looking?" | QTLE analysis across portfolio | 1 |
| **J6** | "Notify me when something happens" | Proactive alerts on triggers | 2 |
| **J7** | "Why is this company scored high?" | Evidence-backed reasoning | 1 |
| **J8** | "Draft an email for this prospect" | Persona-aware outreach | 1 |
| **J9** | "Who on my team needs coaching?" | Performance analysis (Tenant Admin) | 3 |
| **J10** | "What needs my attention today?" | Platform health (Super Admin) | 3 |

---

## APPENDIX: GLOSSARY

| Term | Definition |
|------|------------|
| **SIVA** | Sales Intelligence Virtual Assistant |
| **SIVA OS** | The operating system model for SIVA |
| **SLM** | Sales Language Model (fine-tuned AI) — future |
| **QTLE** | Quality, Timing, Likelihood, Engagement (scoring) |
| **MCP** | Multi-phase Conversation Protocol (12 phases) |
| **SalesContext** | The canonical input contract for all SIVA reasoning |
| **Intelligence Pack** | Self-contained bundle of knowledge for a sub-vertical |
| **Persona** | Behavioral ruleset for SIVA per sub-vertical |
| **Evidence** | Weighted, sourced data points that ground SIVA responses |
| **Self-Healing** | Systems that detect, diagnose, and fix themselves |
| **AI Department** | Autonomous AI agent managing a platform function |
| **Vertical** | Industry sector (Banking, Insurance, etc.) |
| **Sub-Vertical** | Role within vertical (EB, CB, SME) |
| **Tenant** | Customer organization using PremiumRadar |
