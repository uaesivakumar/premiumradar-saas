# WORKSPACE HEAVY-LIFT SPRINT PLAN — READY FOR EXECUTION

**Status:** AWAITING FOUNDER APPROVAL
**Created:** 2026-01-07
**Total Sprints:** 10 (S0-S9)
**Total Features:** 68
**Estimated Scope:** Major rebuild (replace-and-wire)

---

## SOURCE OF TRUTH

| Document | Purpose |
|----------|---------|
| `WORKSPACE_UX_DECISION.md` | Constitutional UX law |
| `WORKSPACE_EXPERIENCE_FLOW.md` | User journey specification |
| `WORKSPACE_UX_FLOW_AUDIT.md` | AS-IS gap analysis |

---

## EXECUTION PHILOSOPHY

- **Clean rebuild approved** — No incremental migration
- **Deletion expected** — More code deleted than preserved
- **Replace-and-wire** — Not patch-and-hope
- **Zero-approval execution** — No founder checkpoints mid-sprint

---

# SPRINT 0: KILL & ISOLATE (BLOCKING)

## 1️⃣ Goal
Destroy all chat-centric code and multi-page routing to create a clean foundation for the pageless workspace.

## 2️⃣ In-Scope (Explicit)

### Files to Delete
```
components/chat/ChatInterface.tsx
components/chat/MessageBubble.tsx
components/chat/TypingIndicator.tsx
components/chat/index.ts (if exists)
```

### Stores to Modify
```
lib/stores/siva-store.ts
  - DELETE: messages: SIVAMessage[]
  - DELETE: addMessage()
  - DELETE: clearConversation()
  - DELETE: SIVAMessage interface
```

### Routes to Remove
```
app/dashboard/discovery/*
app/dashboard/intelligence/*
app/dashboard/ranking/*
app/dashboard/outreach/*
app/dashboard/analytics/*
```

### Components to Isolate
```
components/siva/SIVASurface.tsx
  - Remove message rendering (lines 248-288)
  - Remove chat bubble styling
  - Preserve container shell for Phase 2
```

## 3️⃣ Out-of-Scope (Explicit)
- Building new components (Sprint 2)
- Card state model (Sprint 1)
- Left rail changes (Sprint 3)
- NBA wiring (Sprint 5)

## 4️⃣ Deletions

| File | Reason |
|------|--------|
| `components/chat/*` | Chat bubbles forbidden |
| `SIVAMessage[]` in siva-store | Conversation history forbidden |
| `app/dashboard/discovery/*` | Multi-page forbidden |
| `app/dashboard/intelligence/*` | Multi-page forbidden |
| `app/dashboard/ranking/*` | Multi-page forbidden |
| `app/dashboard/outreach/*` | Multi-page forbidden |
| `app/dashboard/analytics/*` | Multi-page forbidden |

## 5️⃣ New Artifacts

| Artifact | Purpose |
|----------|---------|
| `lib/stores/workspace-state.ts` | Placeholder for Sprint 1 |
| Redirect route `/workspace` | Single entry point |

## 6️⃣ Wiring Map

```
BEFORE:
  /dashboard/* routes → SIVASurface → messages[] → MessageBubble

AFTER:
  /workspace (single route) → Empty shell → Placeholder
```

## 7️⃣ Validation Checklist

- [ ] `components/chat/` directory deleted
- [ ] `SIVAMessage` interface no longer exists
- [ ] `messages` array removed from siva-store
- [ ] All `/dashboard/*` sub-routes return 404 or redirect
- [ ] Single `/workspace` route exists
- [ ] App compiles without errors
- [ ] No chat bubbles render anywhere

## 8️⃣ Failure Conditions

- Chat UI still renders → FAIL
- `messages` array persists in any store → FAIL
- Multi-page routing still works → FAIL
- Build errors → FAIL

---

# SPRINT 1: CARD STATE FOUNDATION

## 1️⃣ Goal
Implement the Card state model with lifecycle, TTL, and priority ordering as the single source of truth for UI rendering.

## 2️⃣ In-Scope (Explicit)

### New State Model
```typescript
// lib/workspace/card-state.ts
interface Card {
  id: string;
  type: CardType;
  priority: number;            // Higher = more important
  createdAt: Date;
  expiresAt: Date | null;      // TTL
  status: 'active' | 'acted' | 'dismissed' | 'expired';

  // Content
  title: string;
  summary: string;             // Max 2 lines
  expandedContent?: unknown;

  // Actions
  actions: CardAction[];

  // Source
  sourceType: 'nba' | 'signal' | 'decision' | 'report' | 'system';
  sourceId?: string;

  // Metadata
  entityId?: string;
  entityType?: 'company' | 'contact' | 'lead';
}

type CardType =
  | 'nba'           // Next Best Action (max 1)
  | 'decision'      // Decision card
  | 'signal'        // Signal/discovery card
  | 'report'        // Report card
  | 'recall'        // Recall card
  | 'system';       // System message

interface CardAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'dismiss';
  handler: string;  // Action handler ID
}
```

### Card Store
```typescript
// lib/stores/card-store.ts
interface CardStore {
  cards: Card[];

  // Getters
  getActiveCards(): Card[];      // Filtered, sorted by priority
  getNBA(): Card | null;         // Single NBA or null
  getByEntity(entityId: string): Card[];

  // Mutations
  addCard(card: Omit<Card, 'id' | 'createdAt'>): void;
  updateCard(id: string, updates: Partial<Card>): void;
  dismissCard(id: string): void;
  actOnCard(id: string, actionId: string): void;

  // Lifecycle
  expireCards(): void;           // Called on interval
  rehydrate(cards: Card[]): void;
}
```

### TTL Engine
```typescript
// lib/workspace/ttl-engine.ts
const TTL_CONFIG = {
  nba: 4 * 60 * 60 * 1000,      // 4 hours
  signal: 24 * 60 * 60 * 1000,  // 24 hours
  decision: null,                // Never expires
  report: 7 * 24 * 60 * 60 * 1000, // 7 days
  system: 1 * 60 * 60 * 1000,   // 1 hour
};

function shouldExpire(card: Card): boolean;
function getExpiryTime(type: CardType): Date | null;
```

## 3️⃣ Out-of-Scope (Explicit)
- UI rendering of cards (Sprint 2)
- NBA generation logic (Sprint 5)
- Decision persistence (Sprint 6)
- Preference cards (Sprint 7)

## 4️⃣ Deletions

| File | Reason |
|------|--------|
| `OutputObject` interface in siva-store | Replaced by Card |
| `outputObjects[]` in siva-store | Replaced by cards[] |

## 5️⃣ New Artifacts

| Artifact | Purpose |
|----------|---------|
| `lib/workspace/card-state.ts` | Card type definitions |
| `lib/stores/card-store.ts` | Card state management |
| `lib/workspace/ttl-engine.ts` | Card expiry logic |
| `lib/workspace/card-priority.ts` | Priority sorting |

## 6️⃣ Wiring Map

```
CardStore (Zustand)
    ↓
getActiveCards() → priority sort → TTL filter
    ↓
cards[] ready for UI (Sprint 2)
```

## 7️⃣ Validation Checklist

- [ ] Card interface defined with all required fields
- [ ] CardStore implements all methods
- [ ] TTL engine correctly expires cards
- [ ] Priority sorting works (higher priority first)
- [ ] Only ONE card with type='nba' can exist
- [ ] Unit tests pass for card lifecycle
- [ ] rehydrate() correctly restores state

## 8️⃣ Failure Conditions

- Multiple NBA cards allowed → FAIL
- Cards don't expire → FAIL
- Priority sorting broken → FAIL
- OutputObject still exists → FAIL

---

# SPRINT 2: PAGELESS CORE SURFACE

## 1️⃣ Goal
Build the single-canvas workspace surface that renders cards in priority order with max 2-line summaries and expand-on-demand behavior.

## 2️⃣ In-Scope (Explicit)

### New Components
```
components/workspace/WorkspaceSurface.tsx    // Main canvas
components/workspace/CardContainer.tsx       // Card list
components/workspace/Card.tsx                // Single card
components/workspace/CardActions.tsx         // Action buttons
components/workspace/ContextBar.tsx          // Top bar
components/workspace/SystemState.tsx         // Live/Waiting/No signals
```

### WorkspaceSurface Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  CONTEXT BAR (Top)                                               │
│  [Workspace Name] | [Sub-Vertical] | [Region] | [System State]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  CARD CONTAINER (Main)                                          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  NBA CARD (if exists, always first)                      │   │
│  │  [2-line summary] [Do Now] [Defer]                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  CARD (priority ordered)                                 │   │
│  │  [2-line summary] [Actions]                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  [More cards...]                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Card Component Behavior
```typescript
// components/workspace/Card.tsx
interface CardProps {
  card: Card;
  onAction: (actionId: string) => void;
  onExpand: () => void;
}

// Rules:
// - Max 2 lines visible by default
// - Click to expand
// - Actions live ON the card
// - Expired cards don't render
```

## 3️⃣ Out-of-Scope (Explicit)
- Left rail (Sprint 3)
- Command palette (Sprint 4)
- NBA wiring (Sprint 5)
- Decision persistence (Sprint 6)

## 4️⃣ Deletions

| File | Reason |
|------|--------|
| `components/siva/SIVASurface.tsx` | Replaced by WorkspaceSurface |
| `components/siva/OutputObjectRenderer.tsx` | Replaced by Card |

## 5️⃣ New Artifacts

| Artifact | Purpose |
|----------|---------|
| `components/workspace/WorkspaceSurface.tsx` | Main canvas |
| `components/workspace/CardContainer.tsx` | Card list container |
| `components/workspace/Card.tsx` | Single card component |
| `components/workspace/CardActions.tsx` | Action buttons |
| `components/workspace/ContextBar.tsx` | Top orientation bar |
| `components/workspace/SystemState.tsx` | System state indicator |

## 6️⃣ Wiring Map

```
CardStore.getActiveCards()
    ↓
WorkspaceSurface
    ↓
CardContainer (priority sorted)
    ↓
Card[] → CardActions → CardStore.actOnCard()
```

## 7️⃣ Validation Checklist

- [ ] WorkspaceSurface renders without errors
- [ ] Cards display in priority order
- [ ] NBA card always appears first (if exists)
- [ ] Cards show max 2 lines by default
- [ ] Expand on click works
- [ ] Actions trigger CardStore mutations
- [ ] Context bar shows workspace info
- [ ] System state updates correctly

## 8️⃣ Failure Conditions

- Cards render chronologically → FAIL
- More than 2 lines visible by default → FAIL
- Actions outside cards → FAIL
- NBA not first → FAIL
- Chat bubbles appear → FAIL

---

# SPRINT 3: DYNAMIC LEFT RAIL

## 1️⃣ Goal
Build the intelligent left rail that starts empty and grows only when user actions justify sections.

## 2️⃣ In-Scope (Explicit)

### New Components
```
components/workspace/LeftRail.tsx            // Container
components/workspace/LeftRailSection.tsx     // Dynamic section
components/workspace/LeftRailItem.tsx        // Section item
```

### Left Rail Sections (Dynamic)
```typescript
interface LeftRailState {
  today: boolean;              // Always true
  savedLeads: number;          // Show if > 0
  followUps: number;           // Show if > 0
  reports: number;             // Show if > 0
  preferences: boolean;        // Always true (at bottom)
}

// Rules:
// - Sections appear/disappear based on state
// - Clicking FILTERS the main surface (no navigation)
// - No empty sections ever visible
// - No disabled items
```

### Section Behavior
```
TODAY          → Always visible, shows today's cards
SAVED LEADS    → Appears after first save, count badge
FOLLOW-UPS     → Appears when follow-ups exist, count badge
REPORTS        → Appears when reports ready, count badge
─────────────
PREFERENCES    → Always at bottom
```

### Filter Logic
```typescript
// Clicking "Saved Leads" doesn't navigate
// It filters CardStore to show only saved leads
function filterCards(section: LeftRailSection): void {
  cardStore.setFilter({ section });
}
```

## 3️⃣ Out-of-Scope (Explicit)
- Command palette (Sprint 4)
- Actual save/follow-up logic (Sprint 5-6)
- Preferences surface (Sprint 7)

## 4️⃣ Deletions

| File | Reason |
|------|--------|
| `components/shell/Sidebar.tsx` | Static navigation forbidden |
| All static nav items | Dynamic only |

## 5️⃣ New Artifacts

| Artifact | Purpose |
|----------|---------|
| `components/workspace/LeftRail.tsx` | Dynamic sidebar |
| `components/workspace/LeftRailSection.tsx` | Section component |
| `components/workspace/LeftRailItem.tsx` | Item component |
| `lib/stores/left-rail-store.ts` | Section visibility state |

## 6️⃣ Wiring Map

```
CardStore (counts)
    ↓
LeftRailStore (visibility)
    ↓
LeftRail → LeftRailSection[] → onClick → CardStore.setFilter()
    ↓
WorkspaceSurface (filtered cards)
```

## 7️⃣ Validation Checklist

- [ ] Left rail renders without static items
- [ ] "Today" always visible
- [ ] "Saved Leads" hidden when count = 0
- [ ] "Saved Leads" appears after first save
- [ ] "Follow-ups" hidden when count = 0
- [ ] "Reports" hidden when count = 0
- [ ] "Preferences" always at bottom
- [ ] Clicking filters, doesn't navigate
- [ ] No empty sections visible
- [ ] No disabled items visible

## 8️⃣ Failure Conditions

- Static items visible → FAIL
- Empty sections shown → FAIL
- Click causes navigation → FAIL
- Sidebar has page links → FAIL

---

# SPRINT 4: COMMAND PALETTE (NON-CHAT)

## 1️⃣ Goal
Build the bottom command palette that accepts natural language input and resolves to cards, not chat messages.

## 2️⃣ In-Scope (Explicit)

### New Components
```
components/workspace/CommandPalette.tsx      // Input container
components/workspace/CommandInput.tsx        // Text input
components/workspace/CommandHints.tsx        // Smart suggestions
```

### Command Palette Behavior
```
INPUT: "Check ABC Infra Pvt Ltd"
    ↓
RESOLUTION: Query OS, generate decision
    ↓
OUTPUT: Decision Card appears on surface

NOT:
    ↓
CHAT BUBBLE with user message
    ↓
CHAT BUBBLE with SIVA response
```

### Input → Card Resolution
```typescript
// lib/workspace/command-resolver.ts
interface CommandResolution {
  intent: 'check_company' | 'find_leads' | 'recall' | 'preference' | 'unknown';
  entityId?: string;
  query: string;
}

async function resolveCommand(input: string): Promise<Card[]> {
  const resolution = classifyIntent(input);

  switch (resolution.intent) {
    case 'check_company':
      return await generateDecisionCard(resolution.entityId);
    case 'find_leads':
      return await generateDiscoveryCards(resolution.query);
    case 'recall':
      return await generateRecallCard(resolution.entityId);
    // ...
  }
}
```

### Smart Hints
```typescript
// Based on context, not static
const hints = [
  "Ask about a company or type 'what should I do next?'"
];
```

## 3️⃣ Out-of-Scope (Explicit)
- NBA generation (Sprint 5)
- Decision persistence (Sprint 6)
- Preference parsing (Sprint 7)
- Recall logic (Sprint 6)

## 4️⃣ Deletions

| File | Reason |
|------|--------|
| `components/siva/SIVAInputBar.tsx` | Chat-centric behavior |
| `submitQuery()` in siva-store | Chat-centric |

## 5️⃣ New Artifacts

| Artifact | Purpose |
|----------|---------|
| `components/workspace/CommandPalette.tsx` | Input container |
| `components/workspace/CommandInput.tsx` | Text input |
| `components/workspace/CommandHints.tsx` | Smart suggestions |
| `lib/workspace/command-resolver.ts` | Intent → Card resolution |

## 6️⃣ Wiring Map

```
CommandInput.onSubmit(text)
    ↓
CommandResolver.resolveCommand(text)
    ↓
OS API calls (if needed)
    ↓
CardStore.addCard(card)
    ↓
WorkspaceSurface renders new card
```

## 7️⃣ Validation Checklist

- [ ] Input field renders at bottom
- [ ] Typing text does NOT create chat bubble
- [ ] Submit resolves to card(s)
- [ ] Card appears on surface, not as message
- [ ] Smart hints update based on context
- [ ] Placeholder text matches spec
- [ ] No scrolling transcript
- [ ] No conversation history

## 8️⃣ Failure Conditions

- Chat bubble appears → FAIL
- User input persisted as message → FAIL
- Scrolling transcript exists → FAIL
- "SIVA says..." appears → FAIL

---

# SPRINT 5: NBA → CARD WIRING

## 1️⃣ Goal
Wire the existing NBA Engine to the Card surface ensuring only ONE NBA card exists at any time with proper lifecycle.

## 2️⃣ In-Scope (Explicit)

### NBA Card Integration
```typescript
// lib/workspace/nba-card-adapter.ts
async function fetchAndCreateNBACard(context: NBAContext): Promise<Card | null> {
  const result = await nbaEngine.getNBA(context);

  if (!result.nba) return null;

  return {
    id: `nba-${result.nba.id}`,
    type: 'nba',
    priority: 1000,  // Always highest
    expiresAt: result.nba.expiresAt,
    status: 'active',
    title: result.nba.actionText,
    summary: result.nba.reason,
    actions: [
      { id: 'do-now', label: 'Do Now', type: 'primary', handler: 'nba.execute' },
      { id: 'defer', label: 'Defer', type: 'secondary', handler: 'nba.defer' },
    ],
    sourceType: 'nba',
    sourceId: result.nba.id,
    entityId: result.nba.leadId,
    entityType: 'lead',
  };
}
```

### NBA Card Lifecycle
```
1. Login → fetchNBA() → Card created (if NBA exists)
2. Card displayed at top (priority=1000)
3. User clicks "Do Now" → Card status='acted' → Card removed
4. User clicks "Defer" → Card rescheduled → Card removed
5. TTL expires → Card status='expired' → Card removed
6. Next NBA fetch → New card (if different NBA)
```

### Singleton Enforcement
```typescript
// In card-store.ts
function addCard(card: Card): void {
  if (card.type === 'nba') {
    // Remove any existing NBA card first
    this.cards = this.cards.filter(c => c.type !== 'nba');
  }
  this.cards.push(card);
}
```

## 3️⃣ Out-of-Scope (Explicit)
- NBA Engine modifications (already compliant)
- Decision persistence (Sprint 6)
- New NBA types

## 4️⃣ Deletions

| File | Reason |
|------|--------|
| None | Wiring only |

## 5️⃣ New Artifacts

| Artifact | Purpose |
|----------|---------|
| `lib/workspace/nba-card-adapter.ts` | NBA → Card conversion |
| `lib/workspace/action-handlers/nba.ts` | NBA action handlers |

## 6️⃣ Wiring Map

```
Login
    ↓
NBAEngine.getNBA(context)
    ↓
nbaCardAdapter.fetchAndCreateNBACard()
    ↓
CardStore.addCard(nbaCard)
    ↓
WorkspaceSurface (NBA card at top)
    ↓
User action → actionHandlers.nba.execute/defer
    ↓
CardStore.actOnCard() → NBAEngine.markCompleted()
    ↓
Card removed, decision persisted
```

## 7️⃣ Validation Checklist

- [ ] NBA card appears at top when NBA exists
- [ ] Only ONE NBA card visible at any time
- [ ] "Do Now" triggers action and removes card
- [ ] "Defer" reschedules and removes card
- [ ] TTL expiry removes card
- [ ] NBA Engine's markCompleted() called
- [ ] New NBA replaces old NBA card

## 8️⃣ Failure Conditions

- Multiple NBA cards visible → FAIL
- NBA not at top → FAIL
- Actions don't remove card → FAIL
- NBA Engine not called → FAIL

---

# SPRINT 6: DECISION PERSISTENCE & RECALL

## 1️⃣ Goal
Implement decision storage and recall so users can query past decisions by entity without chat history replay.

## 2️⃣ In-Scope (Explicit)

### Decision Store
```typescript
// lib/workspace/decision-store.ts
interface Decision {
  id: string;
  entityId: string;
  entityType: 'company' | 'contact' | 'lead';
  entityName: string;
  decision: 'pursue' | 'reject' | 'defer' | 'save';
  reason: string;
  confidence: number;
  createdAt: Date;
  userId: string;
  workspaceId: string;
}

// Database table: workspace_decisions
```

### Recall System
```typescript
// lib/workspace/recall-engine.ts
interface RecallQuery {
  entityId?: string;
  entityName?: string;    // Fuzzy match
  decisionType?: string;
  timeRange?: { from: Date; to: Date };
}

interface RecallResult {
  decision: Decision;
  similarity?: number;    // For fuzzy matches
}

async function recall(query: RecallQuery): Promise<RecallResult[]>;
```

### Recall Card Generation
```typescript
// User types: "What about ABC Infra?"
// System generates Recall Card:

{
  type: 'recall',
  title: 'ABC Infra Pvt Ltd',
  summary: 'Previously evaluated: 18 Dec. Decision: Rejected.',
  expandedContent: {
    decision: 'reject',
    reason: 'Stale filings + heavy charge saturation',
    confidence: 85,
    date: '2024-12-18',
  },
  actions: [
    { id: 're-evaluate', label: 'Re-evaluate', type: 'primary' },
    { id: 'view-reasoning', label: 'View Reasoning', type: 'secondary' },
  ],
}
```

## 3️⃣ Out-of-Scope (Explicit)
- Chat history (forbidden)
- Conversation replay (forbidden)
- Event sourcing (use business events)

## 4️⃣ Deletions

| File | Reason |
|------|--------|
| Any chat history tables | Forbidden |
| Any message persistence | Forbidden |

## 5️⃣ New Artifacts

| Artifact | Purpose |
|----------|---------|
| `lib/workspace/decision-store.ts` | Decision persistence |
| `lib/workspace/recall-engine.ts` | Recall queries |
| `prisma/migrations/workspace_decisions.sql` | DB table |
| `lib/workspace/action-handlers/recall.ts` | Recall action handlers |

## 6️⃣ Wiring Map

```
User action (Save/Reject/etc.)
    ↓
DecisionStore.persistDecision()
    ↓
DB: workspace_decisions
    ↓
(Later) User types "What about X?"
    ↓
CommandResolver → RecallEngine.recall()
    ↓
CardStore.addCard(recallCard)
    ↓
WorkspaceSurface shows recall card
```

## 7️⃣ Validation Checklist

- [ ] Decisions persist to database
- [ ] Recall query finds past decisions
- [ ] Recall card shows decision, not conversation
- [ ] "Re-evaluate" creates new decision flow
- [ ] No chat history stored
- [ ] No message replay
- [ ] Fuzzy name matching works

## 8️⃣ Failure Conditions

- Chat history stored → FAIL
- Conversation replay possible → FAIL
- Recall shows messages → FAIL
- Decisions not persisted → FAIL

---

# SPRINT 7: PREFERENCES (NL-DRIVEN)

## 1️⃣ Goal
Build the natural language preference system accessible from the left rail with validation and explicit accept/reject responses.

## 2️⃣ In-Scope (Explicit)

### Preference Surface
```
components/workspace/PreferenceSurface.tsx   // Full preference UI
components/workspace/PreferenceInput.tsx     // NL input field
components/workspace/PreferenceCard.tsx      // Current preferences
```

### NL Preference Parser
```typescript
// lib/workspace/preference-parser.ts
interface ParsedPreference {
  category: 'reporting' | 'notification' | 'lead_filter' | 'timing';
  key: string;
  value: unknown;
  originalText: string;
}

function parsePreference(text: string): ParsedPreference | null;

// Examples:
// "Send me a daily performance email" → { category: 'notification', key: 'email_daily', value: true }
// "My sales cycle is 5th to 5th" → { category: 'reporting', key: 'cycle_start', value: 5 }
// "Avoid borderline leads" → { category: 'lead_filter', key: 'min_confidence', value: 70 }
```

### Preference Validation
```typescript
// lib/workspace/preference-validator.ts
interface ValidationResult {
  valid: boolean;
  reason?: string;          // If rejected
  conflictsWith?: string;   // Policy/compliance conflict
}

function validatePreference(
  pref: ParsedPreference,
  policy: PersonaPolicy
): ValidationResult;
```

### Accept/Reject Flow
```
User: "Give me a report every month from 5th to 5th"
    ↓
Parse: { category: 'reporting', key: 'cycle', value: { start: 5, end: 5 } }
    ↓
Validate: { valid: true }
    ↓
Response Card: "Preference applied: Monthly report cycle set to 5th-5th"

User: "Never show me any leads"
    ↓
Parse: { category: 'lead_filter', key: 'disable_all', value: true }
    ↓
Validate: { valid: false, reason: "Conflicts with workspace purpose" }
    ↓
Response Card: "This preference can't be applied because it conflicts with workspace policy."
```

## 3️⃣ Out-of-Scope (Explicit)
- Settings page (forbidden - no split)
- Toggle-based preferences (forbidden)
- Hardcoded preference options only (forbidden)

## 4️⃣ Deletions

| File | Reason |
|------|--------|
| `components/enterprise/ProfileSettings.tsx` | Settings/Preferences split forbidden |
| `app/settings/*` routes | Settings page forbidden |

## 5️⃣ New Artifacts

| Artifact | Purpose |
|----------|---------|
| `components/workspace/PreferenceSurface.tsx` | Preference UI |
| `components/workspace/PreferenceInput.tsx` | NL input |
| `components/workspace/PreferenceCard.tsx` | Current prefs display |
| `lib/workspace/preference-parser.ts` | NL → structured |
| `lib/workspace/preference-validator.ts` | Policy validation |

## 6️⃣ Wiring Map

```
Left Rail "Preferences" click
    ↓
PreferenceSurface opens (not modal, not page)
    ↓
User types NL preference
    ↓
PreferenceParser.parsePreference()
    ↓
PreferenceValidator.validatePreference()
    ↓
If valid → UserPreferences.upsert() → Confirmation card
If invalid → Rejection card with reason
```

## 7️⃣ Validation Checklist

- [ ] Preferences accessible from left rail
- [ ] NL input field accepts free text
- [ ] Parser extracts structured preference
- [ ] Validator checks against policy
- [ ] Valid preferences applied and confirmed
- [ ] Invalid preferences rejected with reason
- [ ] No Settings page exists
- [ ] No toggle-based UI

## 8️⃣ Failure Conditions

- Settings page exists → FAIL
- Toggle-based preferences → FAIL
- No validation → FAIL
- Conflicts not explained → FAIL

---

# SPRINT 8: SILENCE, TTL, REHYDRATION

## 1️⃣ Goal
Implement silence states, card TTL enforcement, and login rehydration to complete the workspace lifecycle.

## 2️⃣ In-Scope (Explicit)

### Silence States
```typescript
// components/workspace/SilenceState.tsx
interface SilenceStateProps {
  type: 'no_signals' | 'all_clear' | 'quiet_day';
}

// "No new signals today"
// "Nothing urgent requires your attention"
// Trust-building, not apologetic
```

### TTL Enforcement
```typescript
// lib/workspace/ttl-engine.ts
function startTTLWatcher(): void {
  setInterval(() => {
    const expired = cardStore.cards.filter(shouldExpire);
    expired.forEach(card => {
      cardStore.updateCard(card.id, { status: 'expired' });
      // Card disappears silently
    });
  }, 60000); // Every minute
}
```

### Rehydration
```typescript
// lib/workspace/rehydration.ts
interface RehydrationResult {
  cards: Card[];
  changesCount: number;      // "2 changes since last visit"
  lastVisit: Date;
}

async function rehydrateWorkspace(
  userId: string,
  workspaceId: string
): Promise<RehydrationResult> {
  // 1. Load active cards (not expired)
  // 2. Count changes since last visit
  // 3. DO NOT load conversation history
  // 4. DO NOT replay messages
}
```

### Changes Indicator
```
┌─────────────────────────────────────────────────────────────────┐
│  2 changes since last visit                                      │
└─────────────────────────────────────────────────────────────────┘
```

## 3️⃣ Out-of-Scope (Explicit)
- Chat history replay (forbidden)
- "Yesterday you said..." (forbidden)
- Conversation restoration (forbidden)

## 4️⃣ Deletions

| File | Reason |
|------|--------|
| Any message replay logic | Forbidden |
| Any "conversation restore" code | Forbidden |

## 5️⃣ New Artifacts

| Artifact | Purpose |
|----------|---------|
| `components/workspace/SilenceState.tsx` | No-signal display |
| `lib/workspace/ttl-engine.ts` | Card expiry watcher |
| `lib/workspace/rehydration.ts` | Login state restore |
| `components/workspace/ChangesIndicator.tsx` | Changes count |

## 6️⃣ Wiring Map

```
Login
    ↓
rehydrateWorkspace()
    ↓
CardStore.rehydrate(cards)
    ↓
WorkspaceSurface renders
    ↓
If no cards → SilenceState renders
    ↓
TTL watcher runs → Expired cards removed
```

## 7️⃣ Validation Checklist

- [ ] No-signal state renders calmly
- [ ] No apologetic language
- [ ] Cards expire silently (no animation)
- [ ] Rehydration loads only active cards
- [ ] "X changes since last visit" shows
- [ ] No chat history loaded
- [ ] No message replay
- [ ] Expired cards not visible

## 8️⃣ Failure Conditions

- Silence state is noisy → FAIL
- Cards don't expire → FAIL
- Chat history loaded → FAIL
- Messages replayed → FAIL
- Apologetic language used → FAIL

---

# SPRINT 9: DEMO HARDENING & ANTI-PATTERN SWEEP

## 1️⃣ Goal
Harden the workspace for demo, verify all anti-patterns are eliminated, and ensure 30-second demo script works flawlessly.

## 2️⃣ In-Scope (Explicit)

### Demo Script Validation
```
1. Login → Calm cards appear ✓
2. Ask about a company → Decision card appears ✓
3. Save a lead → Left Rail adapts ✓
4. NBA appears → One action ✓
5. Set preference → NL accepted ✓
6. Logout → Login → Rehydrated state ✓
```

### Anti-Pattern Sweep
```bash
# Automated checks
npm run anti-pattern-sweep

# Must verify absence of:
- [ ] Chat bubbles
- [ ] Conversation transcripts
- [ ] Modal interruptions
- [ ] Static sidebar items
- [ ] Chronological feeds
- [ ] Settings/Preferences split
- [ ] Multiple NBAs
- [ ] Empty sections
- [ ] Folder hierarchies
```

### Demo Hardening
```typescript
// lib/workspace/demo-mode.ts
interface DemoConfig {
  seedCards: Card[];          // Pre-populated cards
  nba: Card;                  // Demo NBA
  silenceAfter: number;       // Seconds until silence state
}

function enableDemoMode(config: DemoConfig): void;
```

## 3️⃣ Out-of-Scope (Explicit)
- New features
- Additional card types
- Performance optimization

## 4️⃣ Deletions

| File | Reason |
|------|--------|
| Any remaining anti-patterns | Final sweep |

## 5️⃣ New Artifacts

| Artifact | Purpose |
|----------|---------|
| `scripts/anti-pattern-sweep.ts` | Automated checker |
| `lib/workspace/demo-mode.ts` | Demo configuration |
| `docs/WORKSPACE_DEMO_SCRIPT.md` | Demo walkthrough |

## 6️⃣ Wiring Map

```
Demo Mode
    ↓
demoMode.enable(config)
    ↓
CardStore seeded
    ↓
Demo script runs
    ↓
Anti-pattern sweep validates
    ↓
DEMO READY
```

## 7️⃣ Validation Checklist

- [ ] 30-second demo script works
- [ ] Login → calm cards
- [ ] Company query → decision card
- [ ] Save → left rail updates
- [ ] NBA → single action
- [ ] Preference → NL accepted
- [ ] Logout/Login → rehydrated
- [ ] All anti-patterns absent
- [ ] No chat bubbles anywhere
- [ ] No static sidebar items
- [ ] No modal interruptions

## 8️⃣ Failure Conditions

- Demo script fails any step → FAIL
- Anti-pattern detected → FAIL
- Chat UI anywhere → FAIL
- Multiple NBAs → FAIL

---

# FEATURE SUMMARY

| Sprint | Features |
|--------|----------|
| S0: Kill & Isolate | 6 features |
| S1: Card State Foundation | 8 features |
| S2: Pageless Core Surface | 8 features |
| S3: Dynamic Left Rail | 6 features |
| S4: Command Palette | 6 features |
| S5: NBA → Card Wiring | 6 features |
| S6: Decision Persistence | 8 features |
| S7: Preferences | 8 features |
| S8: Silence, TTL, Rehydration | 6 features |
| S9: Demo Hardening | 6 features |
| **TOTAL** | **68 features** |

---

# EXECUTION RULES

1. **Sprint 0 MUST complete before any other sprint**
2. **No sprint can start until previous sprint passes validation**
3. **All 8 sections required per sprint**
4. **No TBD, no open questions**
5. **Anti-pattern check after every sprint**

---

# DELETION SUMMARY

| Category | Files Deleted |
|----------|---------------|
| Chat components | 4 files |
| Chat stores | 1 file (partial) |
| Dashboard routes | 5+ directories |
| Settings pages | 2+ files |
| Static sidebar | 1 file |
| **TOTAL** | 13+ files/directories |

---

# FINAL STATEMENT

This sprint plan enables A→Z execution without:
- Founder intervention
- Clarification requests
- UX reinterpretation
- Architectural debates

All decisions derived from locked UX documents.
No incremental migration.
Replace-and-wire only.

**AWAITING FOUNDER APPROVAL**

---

**End of Sprint Plan**
