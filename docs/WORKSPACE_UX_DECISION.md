# Workspace UX Decision (LOCKED)

**Status:** LOCKED
**Decision Date:** 2026-01-07
**Version:** 1.0.0

---

## Final Lock Statement

> **PremiumRadar's workspace is not a chat interface.**
> **It is a pageless, state-driven decision cockpit.**
> **Conversation is ephemeral. Decisions are permanent.**
> **The system speaks only when it has a reason.**

---

## 1. Core UX Philosophy (LOCKED)

**Workspace = Decision Cockpit**

- Not a chat app
- Not a CRM
- Not a dashboard

We borrow familiarity from ChatGPT/Gemini.
We do NOT copy their behavior.

| Aspect | Value |
|--------|-------|
| User expectation met | AI-native |
| User outcome delivered | Better decisions, lower cognitive load |

---

## 2. One-Screen, Pageless Workspace (LOCKED)

**Single persistent canvas**

No page navigation for:
- Discovery
- Saved leads
- Follow-ups
- Reports
- Recall

All changes happen via **state + cards**, not routing.

**Rule:** If someone suggests "another page" → REJECT.

---

## 3. Top Context Bar (LOCKED)

**Purpose:** Orientation, not interaction

Contains only:
- Workspace name
- Sub-vertical
- Region
- System state (Live / Waiting / No signals)

**Forbidden:**
- No menus
- No actions
- No distractions

---

## 4. Left Rail — Intelligent, Dynamic (LOCKED)

This is **not** a static sidebar menu.

### Behavior

- Starts almost empty
- Grows only when user actions justify it
- Sections appear/disappear dynamically

### Examples

| Section | Appears When |
|---------|--------------|
| Today | Always |
| Saved Leads | After first save |
| Follow-ups | If any exist |
| Reports | If ready |

### Interaction

- Clicking **filters** the main surface
- No navigation
- No empty states
- No disabled items

This preserves pageless integrity.

---

## 5. Bottom Command Palette (LOCKED)

**This is the only conversational entry point.**

Visually familiar to ChatGPT users.
Logically different.

### Rules

- Input → resolution → new card
- No chat bubbles
- No scrolling transcript
- Conversation is **ephemeral**
- Only **artifacts persist**

This is critical and correct.

---

## 6. Main Intelligence Surface (LOCKED)

**Card-based, priority-ordered (not chronological), calm, sparse, authoritative.**

### Card Rules

| Rule | Enforcement |
|------|-------------|
| Max 2 lines visible | Always |
| Actions live on cards | Never external |
| Expand only on demand | Default collapsed |
| Cards expire naturally | TTL-based |
| Only ONE NBA card at any time | Non-negotiable |

---

## 7. Recall Model (LOCKED)

### What We Don't Do

- No threads
- No conversation history replay

### What We Do Instead

- Decision recall
- Event recall
- Similar-case recall

**Example:**
> "You evaluated a similar company last month. Decision: Reject."

This is strictly superior to chat threads for serious users.

---

## 8. Failure & Silence States (LOCKED)

- Silence is allowed
- "No new signals today" is a feature
- No hallucination
- No forced engagement

**This builds trust fast.**

---

## 9. User Preferences (LOCKED)

### What We Will NOT Do

- Separate "Settings" vs "Preferences"
- Forms with dozens of toggles
- Hardcoded preference options only

### What We WILL Do

**ONE SECTION: Preferences**

- Lives in the bottom of the left rail
- Accessible, but not noisy
- Opens a preference surface, not a page

### Preference Input Style

**Free-form text input with natural language allowed.**

Examples users can type:
- "Give me a report every month from 5th to 5th"
- "Send me a daily performance email"
- "I don't want borderline leads"

### System Behavior

- Preferences are validated
- If acceptable → acknowledged + applied
- If not acceptable → explicit rejection with reason

**Example rejection:**
> "This preference can't be applied because it conflicts with enterprise policy."

This directly plugs into:
- User Preference Layer (already designed)
- Sales cycle alignment
- NBA timing
- Reporting cadence

---

## 10. Backend-Frontend Alignment (CONFIRMED)

The UX is a direct surface for the backend architecture:

| Backend Layer | UX Surface |
|---------------|------------|
| Workspace state | Context bar + left rail |
| Business events | Card generation |
| NBA | Single priority card |
| BTE | Decision recall |
| Preference layer | Natural language preferences |

**Result:**
- Demo-ready
- Scales cleanly
- No rewrite later

---

## 11. Visual Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│  TOP CONTEXT BAR                                                 │
│  [Workspace Name] | [Sub-Vertical] | [Region] | [System State]  │
├─────────────┬───────────────────────────────────────────────────┤
│             │                                                    │
│  LEFT RAIL  │           MAIN INTELLIGENCE SURFACE               │
│  (Dynamic)  │                                                    │
│             │  ┌─────────────────────────────────────────────┐  │
│  Today      │  │  NBA CARD (only one)                        │  │
│  Saved      │  │  Priority: Highest                          │  │
│  Follow-ups │  └─────────────────────────────────────────────┘  │
│  Reports    │                                                    │
│             │  ┌─────────────────────────────────────────────┐  │
│  ─────────  │  │  SIGNAL CARD                                │  │
│  Preferences│  │  2-line summary, expand on demand           │  │
│             │  └─────────────────────────────────────────────┘  │
│             │                                                    │
│             │  [more cards, priority-ordered]                   │
│             │                                                    │
├─────────────┴───────────────────────────────────────────────────┤
│  BOTTOM COMMAND PALETTE                                          │
│  [Natural language input → card resolution]                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 12. Change Process

Any changes to this locked UX model require:

1. Explicit proposal document
2. Business justification
3. Impact analysis on existing surfaces
4. Founder approval
5. Version increment (2.0.0+)

**No incremental "small tweaks" allowed.**

---

## 13. Reference Documents

| Document | Purpose |
|----------|---------|
| `docs/WORKSPACE_INTELLIGENCE_FRAMEWORK.md` | Backend architecture |
| `docs/UPR_SAAS_CONTEXT.md` | Project context |
| `CLAUDE.md` | TC operating rules |

---

**End of WORKSPACE_UX_DECISION.md**
