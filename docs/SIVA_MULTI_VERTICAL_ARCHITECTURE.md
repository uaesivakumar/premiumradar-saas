# SIVA Multi-Vertical Architecture

**Status**: APPROVED - Final Architecture Decision
**Date**: December 4, 2025
**Decision Maker**: Sivakumar (Product Owner)

---

## Core Principle

```
Vertical     = WHAT industry the salesperson works in
Sub-Vertical = WHO the salesperson is (their role)
Persona      = HOW the salesperson thinks (their brain)

Therefore: Persona MUST be stored per Sub-Vertical.
```

---

## Why Persona Per Sub-Vertical (Not Vertical)

### Vertical Is Too Broad

| Vertical | Sub-Verticals (Different Personas!) |
|----------|-------------------------------------|
| Banking | Employee Banking, Corporate Banking, SME Banking, Mortgage, Credit Cards |
| Insurance | Individual, Corporate, Health, Life, Property |
| Recruitment | Tech Talent, Executive Search, Volume Hiring |
| Real Estate | Residential, Commercial, Off-Plan |
| SaaS | SDR, AE, CSM |

**A single "Banking persona" would be WRONG.**

Employee Banking persona ⊥ Corporate Banking persona — they are NOT interchangeable.

### Persona Controls Everything SIVA Does

| Component | Varies by Sub-Vertical |
|-----------|------------------------|
| Edge Cases | EB blocks enterprise brands; CB targets them |
| Timing Rules | EB: Q1 budgets; Insurance: policy expiry |
| Contact Priority | EB: HR Director; CB: CFO/Treasury |
| Outreach Doctrine | EB: "Point of Contact"; CB: "Strategic Partner" |
| Target Entity | EB: Companies; Insurance Individual: People |
| Industry Signals | EB: Hiring; CB: Revenue/Funding |
| Decision Chains | Different thresholds, different logic |

### Without Per-Sub-Vertical Persona

- ❌ Vertical composability destroyed
- ❌ SIVA becomes rigid
- ❌ Wrong outputs across roles
- ❌ "Role-based personalization" (core USP) lost

---

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         SUPER ADMIN                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Creates & Configures:                                           │
│  ├── Vertical (Banking, Insurance, Recruitment...)              │
│  ├── Sub-Vertical (Employee Banking, Individual Insurance...)   │
│  ├── Region (UAE, India, US...)                                  │
│  ├── Config                                                      │
│  │   ├── Signal Types                                            │
│  │   ├── Scoring Weights                                         │
│  │   ├── Thresholds                                              │
│  │   └── Enrichment Sources                                      │
│  │                                                               │
│  └── 🧠 PERSONA (per Sub-Vertical) ◄── THE KEY                  │
│      ├── Identity & Mission                                      │
│      ├── Edge Cases (blockers, boosters)                        │
│      ├── Timing Rules (calendar, signal freshness)              │
│      ├── Contact Priority Rules                                  │
│      ├── Outreach Doctrine (always/never)                       │
│      ├── Quality Standards                                       │
│      ├── Anti-Patterns                                           │
│      ├── Success/Failure Patterns                                │
│      └── Confidence Gates                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          UPR OS                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SIVA (Dynamic Brain):                                           │
│  ├── Receives: { vertical, sub_vertical, region }               │
│  ├── Loads: persona = PersonaService.get(sub_vertical_id)       │
│  └── Executes tools with persona-driven logic                   │
│                                                                  │
│  Tools (Persona-Aware):                                          │
│  ├── EdgeCasesTool ──────► persona.edge_cases                   │
│  ├── TimingScoreTool ────► persona.timing_rules                 │
│  ├── ContactTierTool ────► persona.contact_priority_rules       │
│  ├── OpeningContextTool ─► persona.outreach_doctrine            │
│  └── OutreachMessageGen ─► persona.tone, persona.always/never   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Multi-Vertical Examples

| Vertical | Sub-Vertical | Persona | Target Entity | Key Signals | Contact Priority |
|----------|--------------|---------|---------------|-------------|------------------|
| Banking | Employee Banking | EB Sales Officer | Companies | Hiring, Expansion | HR Director, Payroll Manager |
| Banking | Corporate Banking | Relationship Manager | Companies | Revenue, Funding, M&A | CFO, Treasury Head |
| Insurance | Individual | Insurance Advisor | Individuals | Life events, Policy expiry | Direct individual |
| Real Estate | Residential | Property Consultant | Families | Relocation, Off-plan | Direct individual |
| Recruitment | Tech Talent | Tech Recruiter | Candidates | Job openings, Skills | Candidate direct |
| SaaS | SDR | SDR Persona | Companies | Funding, Tech adoption | VP Engineering, CTO |

**Each row = Different brain. Same SIVA platform.**

---

## Competitive Moat

This architecture beats:
- **Clay.com**: No vertical intelligence
- **Apollo.io**: Generic enrichment, no persona
- **Salesforce Einstein**: Not configurable by role

**UPR OS differentiator**:
> Configurable vertical intelligence packs (personas) per sub-vertical
> → Editable by Super Admin
> → Loaded dynamically by SIVA
> → No code changes required

---

## Implementation Requirements

### Step 1: Persona Schema (Per Sub-Vertical)

```sql
CREATE TABLE sub_vertical_personas (
  id UUID PRIMARY KEY,
  sub_vertical_id UUID REFERENCES vertical_packs(id),

  -- Identity
  persona_name VARCHAR(100),
  persona_role VARCHAR(200),
  persona_organization VARCHAR(200),

  -- Mission
  primary_mission TEXT,
  core_goal TEXT,
  north_star_metric TEXT,
  core_belief TEXT,

  -- Entity Type
  entity_type VARCHAR(50), -- 'company' | 'individual' | 'family'

  -- Rules (JSONB)
  contact_priority_rules JSONB,
  edge_cases JSONB,
  timing_rules JSONB,
  outreach_doctrine JSONB,
  quality_standards JSONB,
  anti_patterns JSONB,
  success_patterns JSONB,
  failure_patterns JSONB,
  confidence_gates JSONB,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 2: Move Hardcoded Logic to Persona Config

| Current Location | Move To |
|------------------|---------|
| `siva-brain-spec-v1.md` | `sub_vertical_personas.{field}` |
| EdgeCasesTool hardcoded blockers | `persona.edge_cases.blockers` |
| TimingScoreTool Q1/Ramadan | `persona.timing_rules.calendar` |
| ContactTierTool size→titles | `persona.contact_priority_rules.tiers` |
| OutreachMessageGen tone | `persona.outreach_doctrine.tone` |

### Step 3: Modify Tools to Load Persona Dynamically

```javascript
// Before (hardcoded)
const ENTERPRISE_BRANDS = ['Etihad', 'Emirates', 'ADNOC'];

// After (persona-driven)
async execute(input) {
  const persona = await PersonaService.get(input.sub_vertical_id);
  const blockers = persona.edge_cases.blockers;
  // Apply blockers dynamically
}
```

### Step 4: Super Admin UI - Persona Tab

```
Sub-Vertical Page
├── Config Tab (existing)
└── Persona Tab (NEW)
    ├── Identity Section
    ├── Mission Section
    ├── Contact Rules Section
    ├── Edge Cases Section
    ├── Timing Rules Section
    ├── Outreach Doctrine Section
    └── Anti-Patterns Section
```

### Step 5: Persona Cloning

- EB persona → Clone → Corporate Banking persona
- Edit differences only
- Version history

### Step 6: Enforce Persona Loading

Every SIVA call requires:
```javascript
{
  vertical: "banking",
  sub_vertical: "employee_banking",
  region: "UAE"
}
```

SIVA loads:
```javascript
const persona = await PersonaService.get(sub_vertical_id);
```

---

## Migration Plan

### Phase 1: Foundation (Week 1)
- [ ] Create `sub_vertical_personas` table
- [ ] Create PersonaService with CRUD
- [ ] Migrate EB brain spec to first persona record

### Phase 2: Tool Refactor (Week 2)
- [ ] Add `loadPersona(subVerticalId)` helper
- [ ] Refactor EdgeCasesTool
- [ ] Refactor TimingScoreTool
- [ ] Refactor ContactTierTool
- [ ] Refactor OpeningContextTool
- [ ] Refactor OutreachMessageGeneratorTool

### Phase 3: Super Admin UI (Week 3)
- [ ] Add Persona tab to Sub-Vertical page
- [ ] Build persona form (all sections)
- [ ] Add persona cloning
- [ ] Add version history

### Phase 4: API & Integration (Week 4)
- [ ] Update SIVA client to pass sub_vertical_id
- [ ] Update all SIVA calls to load persona
- [ ] Add persona caching for performance

### Phase 5: Validation (Week 5)
- [ ] Test EB persona from DB (regression)
- [ ] Create Insurance persona, test full flow
- [ ] Create Recruitment persona, test full flow
- [ ] Document persona creation guide

---

## Summary

| Principle | Implementation |
|-----------|----------------|
| Persona per Sub-Vertical | `sub_vertical_personas` table |
| Configurable in Super Admin | Persona tab in Sub-Vertical page |
| Dynamic loading by SIVA | `PersonaService.get(sub_vertical_id)` |
| No code changes for new verticals | All logic in persona JSON config |

**This is the architecture that makes UPR OS a true multi-role, multi-vertical AI Sales OS.**

---

## Appendix: EB Persona (Reference)

The first persona to migrate (currently in `siva-brain-spec-v1.md`):

```json
{
  "sub_vertical": "employee_banking",
  "persona_name": "EB Sales Officer",
  "persona_role": "Senior Retail Banking Officer",
  "persona_organization": "Emirates NBD",
  "entity_type": "company",

  "primary_mission": "Become the designated point of contact for companies to manage employee banking during onboarding",
  "core_goal": "Build long-term payroll relationships that enable cross-sell of Credit Cards, Personal Loans, and Home Loans",
  "north_star_metric": "≥200 qualified companies per month with ≥70% mid/high-tier salary segments",
  "core_belief": "Quality companies create quality customers → bigger population → higher conversions across all products",

  "contact_priority_rules": {
    "tiers": [
      { "size_max": 50, "titles": ["Founder", "COO"], "reason": "Small company = direct decision maker" },
      { "size_min": 50, "size_max": 500, "titles": ["HR Director", "HR Manager"], "reason": "Sweet spot" },
      { "size_min": 500, "titles": ["Payroll Manager", "Benefits Coordinator"], "reason": "Operational contact" }
    ],
    "boost_conditions": [
      { "condition": "hiring_velocity > 10", "add_titles": ["Head of Talent Acquisition", "HR Ops Manager"] }
    ]
  },

  "edge_cases": {
    "blockers": [
      { "type": "company_name", "values": ["Etihad", "Emirates", "ADNOC", "Emaar", "DP World"], "multiplier": 0.1, "reason": "Enterprise brand" },
      { "type": "sector", "values": ["government"], "multiplier": 0.05, "reason": "Government entity" }
    ],
    "boosters": [
      { "type": "license_type", "values": ["Free Zone"], "multiplier": 1.3, "reason": "Free Zone bonus" },
      { "type": "signal_recency", "days_max": 30, "multiplier": 1.5, "reason": "Recent expansion" }
    ]
  },

  "timing_rules": {
    "calendar": [
      { "period": "Q1", "months": [1, 2], "multiplier": 1.3, "reason": "New budgets + expansions" },
      { "period": "Ramadan", "dynamic": true, "multiplier": 0.3, "reason": "Pause cold outreach" },
      { "period": "Summer", "months": [7, 8], "multiplier": 0.7, "reason": "Low response window" },
      { "period": "Q4", "months": [12], "multiplier": 0.6, "reason": "Budget freeze" }
    ],
    "signal_freshness": [
      { "days_max": 7, "multiplier": 1.5, "label": "HOT" },
      { "days_max": 14, "multiplier": 1.2, "label": "WARM" },
      { "days_max": 30, "multiplier": 1.0, "label": "RECENT" }
    ]
  },

  "outreach_doctrine": {
    "always": [
      "Reference specific company signal",
      "Position as 'Point of Contact', not sales",
      "Frame benefit as time saved and convenience",
      "Use low-friction CTA ('15-minute call')"
    ],
    "never": [
      "Mention pricing or rates",
      "Use pressure language ('limited time')",
      "Send identical template to two companies",
      "Contact govt or enterprise without approval"
    ],
    "tone": "professional",
    "formality": "formal",
    "channels": ["email", "linkedin"]
  },

  "quality_standards": {
    "always": [
      "Verify UAE presence",
      "Validate email before send",
      "Check last contact > 90 days",
      "Dedupe by domain"
    ],
    "never": [
      "Proceed if confidence < 70",
      "Bypass human review after edge-case trigger"
    ],
    "min_confidence": 70,
    "contact_cooldown_days": 90
  },

  "anti_patterns": [
    { "mistake": "Generic Opening", "wrong": "I hope this email finds you well...", "correct": "I noticed {{company}} opened a new Dubai office with 15 engineering roles..." },
    { "mistake": "Wrong Contact", "wrong": "CEO of 800-person firm", "correct": "Payroll Manager / HR Ops Manager" },
    { "mistake": "Bad Timing", "wrong": "July / Dec cold emails", "correct": "Q1 or within 7 days of expansion" },
    { "mistake": "Score Without Context", "wrong": "200 employees → 85", "correct": "200 UAE employees + funding + 20 hires → 92" }
  ],

  "confidence_gates": [
    { "condition": "top_2_confidence_delta < 0.15", "action": "flag_for_manual_choice" },
    { "condition": "edge_case_triggered AND score > 70", "action": "ask_confirmation" },
    { "condition": "sector = Construction AND salary_signals = high", "action": "ask_verification" }
  ]
}
```
