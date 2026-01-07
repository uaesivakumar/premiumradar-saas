# Complete Workspace Experience Flow (LOCKED)

**Status:** LOCKED
**Decision Date:** 2026-01-07
**Version:** 1.0.0

---

## Final Lock Statement

> **PremiumRadar's workspace is a pageless, state-driven decision cockpit.**
> **It remembers decisions, not conversations.**
> **It speaks only when it has a reason.**
> **Silence is a feature.**

---

## System Truth (Read First)

- **One workspace**
- **Pageless**
- **State-driven**
- **Cards are the only visible artifacts**
- **Conversation is ephemeral**
- **Decisions persist**

---

## 0. Entry Conditions (Always True)

On every login the system:

1. Resolves **Vertical → Sub-Vertical → Region → Persona → Active Policy**
2. Loads **Workspace State + Business Events**
3. Computes **ONE NBA (or none)**
4. Renders the canvas

No chat replay. No history dump.

---

## 1. Day 0 / First Login (Trust Without Overwhelm)

### What the User Sees

| Component | Content |
|-----------|---------|
| Top Context Bar | Workspace · Sub-Vertical · Region · Status |
| Left Rail | `Today` only |
| Main Surface | 3–5 calm cards |
| Bottom Command Strip | Placeholder: "Ask about a company or type 'what should I do next?'" |

### Initial Cards

- "How this workspace works (30 sec)"
- "Where NOT to spend time this week"
- "Eligible to pursue (small list)"

### What the System Does

- Observes (no coaching)
- Builds baseline behavior
- **No NBA yet**

**Success signal:** User feels oriented, not pressured.

---

## 2. First Interaction (Input → Resolution → Card)

### User Action

Types: *"Check ABC Infra Pvt Ltd"*

### What Happens (Strict)

- Text **does not** become a chat bubble
- Resolution runs
- **A Decision Card appears**, priority-placed

### Card Example

```
┌─────────────────────────────────────────────────────┐
│  ABC Infra Pvt Ltd                                  │
│  Decision: DO NOT PURSUE                            │
│  Reason: Stale filings + heavy charge saturation    │
│  Confidence: High                                   │
│  [Why?] [Override]                                  │
└─────────────────────────────────────────────────────┘
```

**Rule:** Order by relevance, not time.

---

## 3. Early Use (Login #3–#10) — Relevance Emerges

### What Changes Visually

- Fewer cards
- Better reasons
- **Soft NBA appears** (ignorable)

### NBA Card (Soft)

```
┌─────────────────────────────────────────────────────┐
│  Next Best Action                                   │
│  Review 2 borderline cases before outreach          │
│  Why: Similar wins improved conversion              │
│  [Do Now] [Defer]                                   │
└─────────────────────────────────────────────────────┘
```

### Left Rail Evolution

- Still minimal
- New sections appear **only if earned**
- `Saved Leads (1)` appears after first save

**Rule:** No vanity counts. No empty sections.

---

## 4. Save / Enrich / Ignore (Object-Bound Actions)

### Save

| Rule | Enforcement |
|------|-------------|
| Location | Only on Lead Cards |
| Effect | First save → Left Rail shows `Saved Leads` |
| Structure | No folders. Ever. |

### Enrich

- Produces a new **Evidence Card**
- Original card remains compact

### Ignore

- Card dismisses
- Event logged
- Improves future filtering

---

## 5. Returning Login (Rehydration, Not Replay)

### What the User Sees

- Only **still-relevant cards**
- Expired cards are gone
- Subtle indicator: *"2 changes since last visit"*

### What the System Never Does

- No transcript replay
- No "yesterday you said…"

**This is superior to chat history.**

---

## 6. Power User (Day 30+) — Execution Dominance

### Visual State

- **NOW / WAITING / CLOSED** grouping
- **ONE strong NBA** (time-bound)
- Evidence collapsed by default

### NBA Card (Hard)

```
┌─────────────────────────────────────────────────────┐
│  Next Best Action (Today)                           │
│  Follow up with XYZ Corp                            │
│  Why: Response probability decays after day 7       │
│  [Do Now] [Defer]                                   │
└─────────────────────────────────────────────────────┘
```

### Left Rail (Alive, Still Quiet)

- Today
- Saved Leads (n)
- Follow-ups (n)
- Reports (n)

Clicking filters the **Main Surface** only.

---

## 7. Recall (Instead of Threads)

### User Types

*"What about ABC Infra?"*

### System Response (Card)

```
┌─────────────────────────────────────────────────────┐
│  ABC Infra Pvt Ltd                                  │
│  Previously evaluated: 18 Dec                       │
│  Decision: Rejected                                 │
│  Reason: Stale filings                              │
│  [Re-evaluate] [View reasoning]                     │
└─────────────────────────────────────────────────────┘
```

**Recall = decisions + evidence, not text.**

---

## 8. Reports & Reflections (Pull, Never Push)

### When a Report is Ready

- Left Rail shows `Reports (1)`
- Main Surface shows a **Report Card**
- No modal. No interruption.

### Report Card

```
┌─────────────────────────────────────────────────────┐
│  Monthly Performance Summary                        │
│  Cycle: 5th → 5th                                   │
│  [View] [Export PDF]                                │
└─────────────────────────────────────────────────────┘
```

---

## 9. Preferences (One Place, NL-Driven)

### Access

Bottom of Left Rail: **Preferences**

### Input Style

Free-form text (natural language):

- "Send me a daily performance email"
- "My sales cycle is 5th to 5th"
- "Avoid borderline leads"

### System Behavior

| Input | Response |
|-------|----------|
| Valid preference | Accept → apply + confirm |
| Invalid preference | Reject → explicit reason (policy/compliance) |

**No separate Settings. No toggle hell.**

---

## 10. Failure & Silence States (Trust Builders)

### No Signals Today

```
┌─────────────────────────────────────────────────────┐
│  No new signals today.                              │
│  Nothing urgent requires your attention.            │
└─────────────────────────────────────────────────────┘
```

### Unsupported Request

```
┌─────────────────────────────────────────────────────┐
│  Request not supported                              │
│  Reason: Not compliant / not available              │
│  You can instead: [Alternative]                     │
└─────────────────────────────────────────────────────┘
```

No hallucination. No apology theater.

---

## 11. What Persists vs What Doesn't

### Persists (Permanent)

| Type | Storage |
|------|---------|
| Decisions | Database |
| Saved leads | Database |
| Reports | Database |
| Business events | Event store |
| Preferences | User profile |

### Does NOT Persist (Ephemeral)

| Type | Reason |
|------|--------|
| Conversation text | Not a chat app |
| Exploratory prompts | Temporary by design |
| Temporary clarifications | Resolution artifacts only |

---

## 12. Demo Script (30 Seconds)

| Step | Action | Outcome |
|------|--------|---------|
| 1 | Login | Calm cards appear |
| 2 | Ask about a company | Decision card appears |
| 3 | Save a lead | Left Rail adapts |
| 4 | Wait for NBA | One action appears |
| 5 | Set preference | Natural language accepted |
| 6 | Logout → Login | Rehydrated state |

**Outcome:** "This feels like a senior decision system, not a chatbot."

---

## 13. User Journey Timeline

```
DAY 0          DAY 3-10        DAY 30+
│              │               │
▼              ▼               ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│ ORIENT   │   │ LEARN    │   │ EXECUTE  │
│          │   │          │   │          │
│ 3-5 calm │   │ Fewer    │   │ ONE NBA  │
│ cards    │   │ cards    │   │          │
│          │   │          │   │ NOW/WAIT │
│ No NBA   │   │ Soft NBA │   │ /CLOSED  │
│          │   │          │   │          │
│ Observe  │   │ Adapt    │   │ Dominate │
└──────────┘   └──────────┘   └──────────┘
```

---

## 14. Card Lifecycle

```
SIGNAL DETECTED
      │
      ▼
┌─────────────┐
│ CARD BORN   │ (priority-placed on surface)
└─────┬───────┘
      │
      ├──► USER ACTION (Save/Enrich/Ignore)
      │         │
      │         ▼
      │    ┌─────────────┐
      │    │ STATE CHANGE│
      │    └─────────────┘
      │
      ├──► NO ACTION + TTL EXPIRED
      │         │
      │         ▼
      │    ┌─────────────┐
      │    │ CARD DIES   │ (removed silently)
      │    └─────────────┘
      │
      └──► DECISION MADE
                │
                ▼
           ┌─────────────┐
           │ PERSISTED   │ (available for recall)
           └─────────────┘
```

---

## 15. Anti-Patterns (Forbidden)

| Anti-Pattern | Why Forbidden |
|--------------|---------------|
| Chat bubbles | Not a chat app |
| Conversation history | Decisions > dialogue |
| Multiple NBAs | Cognitive overload |
| Empty left rail sections | No vanity |
| Modal interruptions | Flow disruption |
| Folder hierarchies | Complexity creep |
| Settings + Preferences separation | Confusion |
| Forced engagement | Erodes trust |

---

## 16. Reference Documents

| Document | Purpose |
|----------|---------|
| `docs/WORKSPACE_UX_DECISION.md` | UX principles (locked) |
| `docs/WORKSPACE_INTELLIGENCE_FRAMEWORK.md` | Backend architecture |
| `docs/UPR_SAAS_CONTEXT.md` | Project context |

---

## 17. Change Process

Any changes to this flow require:

1. Explicit proposal document
2. Business justification
3. Founder approval
4. Version increment (2.0.0+)

**This is build-ready. No further UX debates are required.**

---

**End of WORKSPACE_EXPERIENCE_FLOW.md**
