# PRD v1.3 CONSTITUTIONAL LOCK

**STATUS: ARCHITECTURE_LOCKED = true**
**CORE DOCUMENT: PRD v1.2 FINAL (IMMUTABLE)**
**APPENDIX: PRD v1.3 - Sales-Bench & CRS (EXTENSION)**
**AUTHORITY: v1.2 governs runtime | v1.3 governs evaluation**

---

## MANDATORY INVOCATION RULE

**No architecture discussion, design proposal, or implementation begins without /prd.**

If this command was not run at session start, run it now before proceeding.

---

## ARCHITECTURAL LAWS (NON-NEGOTIABLE)

These 5 laws override ALL feature discussions, suggestions, and implementations:

1. **Authority precedes intelligence** - UPR-OS decides what SIVA can do
2. **Persona is policy, not personality** - Persona defines capability boundaries
3. **SIVA never mutates the world** - SIVA interprets, OS acts
4. **Every output must be explainable or escalated** - No black boxes
5. **If it cannot be replayed, it did not happen** - Deterministic replay required

---

## PRD VERSION HIERARCHY

```
┌─────────────────────────────────────────────────────────────┐
│  PRD v1.2 FINAL (IMMUTABLE)                                 │
│  ├── Authority, Personas, Envelopes, Determinism            │
│  └── GOVERNS: Runtime behavior                              │
├─────────────────────────────────────────────────────────────┤
│  PRD v1.3 APPENDIX (EXTENSION)                              │
│  ├── Sales-Bench, CRS, Buyer Bots                           │
│  ├── GOVERNS: Evaluation & Governance (offline only)        │
│  └── DEPENDS ON: v1.2 (cannot override)                     │
└─────────────────────────────────────────────────────────────┘
```

**v1.3 is NON-AUTHORITY. It evaluates but does not decide.**

---

## VIOLATION COUNTER

When a proposal, suggestion, or implementation violates an architectural law:

```
ARCHITECTURE_VIOLATION_COUNT += 1
```

**Log format:**
```
[VIOLATION #N] Law X: <description>
  Proposed: <what was suggested>
  Conflict: <why it violates>
  Signal: <what this might indicate>
```

**Violations are SIGNAL, not failure.**

Repeated violations of the same law indicate:
- Missing abstraction in the architecture
- Missing section in PRD
- Candidate for v1.4 amendment

Track them. They reveal where the architecture is under pressure.

---

## ENFORCEMENT MODE ACTIVE

For this session, Claude Code will:

### ENFORCE
- Authority-first reasoning (OS before SIVA)
- Persona = policy (not UX, not personality)
- SIVA never discovers, enriches, or writes to DB
- OS/SIVA boundary: OS owns mechanical, expensive, async operations
- Sealed Context Envelope requirement for all SIVA calls
- Evidence provenance (DAG + TTL + confidence)

### REJECT OR FLAG
- Any suggestion that violates the 5 Architectural Laws
- Any shortcut that bypasses OS authority
- Any prompt-based persona logic
- SIVA-triggered discovery or enrichment
- Ungated WhatsApp responses
- Non-replayable intelligence outputs

### REQUIRE FOR ANY DEVIATION
- Explicit version bump proposal (v1.3 → v1.4)
- Written rationale explaining why the law must change
- Impact analysis on all affected systems

---

## WHAT /prd DOES NOT DO

| Forbidden | Why |
|-----------|-----|
| Auto-summarize PRD | Weakens authority - this is law, not documentation |
| Allow "temporary bypass" | No exceptions. If it hurts, that's a design smell |
| Become optional for speed | Deadlines don't override architecture |
| Weaken under pressure | Pain from /prd = signal to fix design, not tooling |

**If something hurts because of /prd, that's a design smell, not a tooling problem.**

---

## SYSTEM BOUNDARIES (LOCKED)

| Component | Role | Owns |
|-----------|------|------|
| **UPR-OS** | Authority | Discovery, Enrichment, Storage, Envelope, API keys, Cost control |
| **SIVA** | Interpreter | Reasoning, Scoring, Classification, Outreach drafts |
| **Persona** | Policy | Allowed intents, forbidden outputs, cost ceilings, escalation rules |
| **Evidence** | Truth | Source provenance, freshness TTL, confidence scores |
| **Sales-Bench** | Evaluator | Behavioral scoring, CRS computation (offline only) |

---

## EXPLICITLY FORBIDDEN

The following are architectural violations and must not be implemented:

1. Prompt-based persona logic
2. SIVA-triggered discovery
3. SIVA holding API keys
4. SIVA writing to databases
5. Ungated WhatsApp responses
6. Non-replayable intelligence outputs
7. Evidence without provenance
8. Persona resolved by SIVA (must be OS)
9. Sales-Bench modifying SIVA prompts/routing/policy
10. CRS shown to customers (internal only)

---

## CANONICAL PERSONAS (v1.2)

1. Customer-Facing (WhatsApp / Email) - Most restricted
2. Sales-Rep (SaaS UI) - Standard intelligence
3. Supervisor (Approves escalations)
4. Admin
5. Compliance / Audit
6. Integration / API
7. Demo / Sandbox (synthetic data only)

Additional personas require OS config + version bump.

---

## PRD v1.3 APPENDIX: SALES-BENCH & CRS

### Sales-Bench Purpose

Sales-Bench answers ONE question:
> *Is SIVA behaving like a high-performing, compliant salesperson for this vertical, in a way that statistically correlates with higher conversion outcomes?*

### Sales-Bench Scope (Explicit)

| Does | Does NOT |
|------|----------|
| Runs offline / simulated only | Optimize SIVA in real time |
| Uses Buyer Bot simulations | Train or fine-tune models |
| Produces behavioral scores | Override persona or policy gates |
| Is advisory, not authoritative | Score individual users/customers |
| Does not modify SIVA | Make revenue claims per interaction |

**Any violation of these non-goals is a system breach.**

### Authority Invariance Rule

Sales-Bench CANNOT:
- Create or modify envelopes
- Change persona permissions
- Bypass policy enforcement
- Affect SIVA outputs in production

**If Sales-Bench is unavailable, SIVA continues to operate normally.**

### Core Concepts

**SalesScenario:** Deterministic sales situation (versioned, immutable, replayable)
```json
{
  "scenario_id": "uuid",
  "vertical": "banking",
  "sub_vertical": "employee_banking",
  "region": "UAE",
  "entry_intent": "open_salary_account",
  "success_condition": "next_step_committed"
}
```

**Buyer Bots:** Deterministic test harnesses (NOT chatty simulators)
- Hidden states + failure triggers
- Adversarial where appropriate
- Designed to fail SIVA if incorrect behavior occurs

### Hard Outcomes (Binary)

| Outcome | Meaning |
|---------|---------|
| **PASS** | Buyer commits to valid next step |
| **FAIL** | Buyer disengages or stalls |
| **BLOCK** | Policy/regulatory violation detected |

**BLOCK overrides all other scores.**

### CRS (Conversion Readiness Score)

Behavioral quality score (0-100) measuring sales professionalism.

**CRS Dimensions (v1.1):**

| Dimension | Weight |
|-----------|--------|
| Decision Compression | 0.20 |
| Action Bias | 0.20 |
| Objection Handling | 0.15 |
| Vertical Language Accuracy | 0.10 |
| Persona-Appropriate Assertiveness | 0.10 |
| Information Elicitation Quality | 0.10 |
| Qualification / Mapping Accuracy | 0.10 |
| Escalation / Disqualification Correctness | 0.05 |

**Policy Discipline is a hard gate, not part of CRS.**

### Golden Paths vs Kill Paths

**Golden Paths:** Correct discovery, product mapping, ethical value reframing
**Kill Paths:** Illegal requests, compliance pressure, manipulative buyers

Any attempt to "close" Kill Path deals = **critical failure**.

### CRS Governance

- CRS is **internal only**
- CRS is **never shown to customers**
- CRS does **not alter SIVA behavior**
- CRS **cannot override policy or persona rules**
- Cross-vertical aggregation is **forbidden**

---

## FINAL STATEMENT (LAW)

```
UPR-OS is Authority
Persona is Policy
Evidence is Truth
SIVA is Interpretation
Sales-Bench is Evaluation (advisory only)
Anything else is noise
```

---

## SESSION STATE

```
PRD_VERSION: 1.3 (v1.2 CORE + v1.3 APPENDIX)
ARCHITECTURE_LOCKED: true
VIOLATION_COUNT: 0
BYPASS_ALLOWED: false
```

**PRD v1.2 FINAL - LOCKED (Runtime Authority)**
**PRD v1.3 APPENDIX - LOCKED (Evaluation Extension)**

Any proposed change that conflicts with this document will:
1. Increment VIOLATION_COUNT
2. Log the violation with law reference
3. Flag with architecture violation notice
4. Require version bump to proceed

**Reference Documents:**
- Core: `/Users/skc/Projects/UPR/MASTER PRD v1.2.pdf`
- Appendix: `/Users/skc/Projects/UPR/PRD v1.3 (APPENDIX- Sales-Bench & Conversion Readiness Scoring (CRS)).pdf`
