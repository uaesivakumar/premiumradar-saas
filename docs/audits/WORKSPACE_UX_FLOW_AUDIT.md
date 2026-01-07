# WORKSPACE UX & FLOW AUDIT — AS-IS vs LOCKED

**Audit Date:** 2026-01-07
**Reference Documents:**
- `docs/WORKSPACE_UX_DECISION.md` (LOCKED)
- `docs/WORKSPACE_EXPERIENCE_FLOW.md` (LOCKED)

---

## 1. Executive Verdict

### READY STATUS: **NOT READY**

The current implementation is **fundamentally incompatible** with the locked Workspace UX model. A significant rebuild is required.

### Top 5 Blocking Issues

| # | Blocker | Severity | Impact |
|---|---------|----------|--------|
| 1 | **Chat-centric model** - Messages stored as conversation history | CRITICAL | Violates "conversation is ephemeral" |
| 2 | **Multi-page routing** - 15+ dashboard routes exist | CRITICAL | Violates "pageless" |
| 3 | **Static sidebar** - Fixed navigation items always shown | HIGH | Violates "dynamic left rail" |
| 4 | **No card-first architecture** - Output objects, not cards | HIGH | Violates "cards are the only visible artifacts" |
| 5 | **Settings/Preferences split** - Two separate systems | MEDIUM | Violates "one place, NL-driven" |

---

## 2. Frontend Audit

### 2.1 EXISTS (Can Be Reused With Modifications)

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| PagelessShell | `components/shell/PagelessShell.tsx` | PARTIAL | Has context bar + sidebar, but sidebar is static |
| SIVASurface | `components/siva/SIVASurface.tsx` | PARTIAL | Good structure, but chat-centric |
| SIVAInputBar | `components/siva/SIVAInputBar.tsx` | REUSABLE | Can become command palette |
| OutputObjectRenderer | `components/siva/OutputObjectRenderer.tsx` | PARTIAL | Needs card refactor |
| NextBestAction | `components/workspace/NextBestAction.tsx` | REUSABLE | Single NBA component (compliant) |
| DiscoveryObject | `components/siva/objects/DiscoveryObject.tsx` | PARTIAL | Can become card |
| ScoringObject | `components/siva/objects/ScoringObject.tsx` | PARTIAL | Can become card |

### 2.2 PARTIAL (Requires Significant Modification)

| Component | File | Issue | Required Change |
|-----------|------|-------|-----------------|
| Sidebar | `components/shell/Sidebar.tsx` | Static navigation | Rebuild as dynamic left rail |
| SIVASurface | `components/siva/SIVASurface.tsx` | Stores messages array | Remove chat history, make card-first |
| PagelessShell | `components/shell/PagelessShell.tsx` | Links to /dashboard/* pages | Remove page links |

### 2.3 MISSING (Must Be Built)

| Component | Locked Requirement | Priority |
|-----------|-------------------|----------|
| Dynamic Left Rail | Sections appear/disappear based on user actions | P0 |
| Card Container | Priority-ordered, max 2 lines, TTL-aware | P0 |
| Decision Card | Persist decisions, enable recall | P0 |
| Recall Surface | Decision/event recall (not chat history) | P1 |
| Preference Surface | Natural language input, validation | P1 |
| Report Card | Pull-based report display | P2 |
| Silence State | "No new signals today" display | P2 |

### 2.4 MUST BE REMOVED (Violates Locked UX)

| Component | File | Violation |
|-----------|------|-----------|
| ChatInterface | `components/chat/ChatInterface.tsx` | Chat bubbles forbidden |
| MessageBubble | `components/chat/MessageBubble.tsx` | Chat bubbles forbidden |
| TypingIndicator | `components/chat/TypingIndicator.tsx` | Chat UX forbidden |
| Static Sidebar | `components/shell/Sidebar.tsx` | Static navigation forbidden |
| Dashboard routes | `app/dashboard/discovery/*` | Page navigation forbidden |
| Dashboard routes | `app/dashboard/intelligence/*` | Page navigation forbidden |
| Dashboard routes | `app/dashboard/ranking/*` | Page navigation forbidden |
| ProfileSettings | `components/enterprise/ProfileSettings.tsx` | Settings/Preferences split forbidden |
| 18 Modal files | `components/*/Modal.tsx` | Modal interruptions forbidden |

### 2.5 Route Audit (All Must Be Eliminated)

Current routes that violate pageless model:

```
app/dashboard/
├── discovery/
├── intelligence/
├── ranking/
├── outreach/
├── analytics/
├── settings/
├── admin/
└── ...15+ sub-routes
```

**Required:** Single workspace route, all navigation via state/cards.

---

## 3. Backend Audit

### 3.1 EXISTS (Fully Compliant)

| System | File | Status | Notes |
|--------|------|--------|-------|
| NBA Engine | `lib/workspace/nba-engine.ts` | COMPLIANT | Returns exactly ONE NBA |
| Business Events | `lib/events/event-emitter.ts` | COMPLIANT | Immutable BTE log |
| Event Query | `lib/events/event-emitter.ts` | COMPLIANT | getEntityEvents, getWorkspaceEvents |

### 3.2 PARTIAL (Requires Extension)

| System | File | What Exists | What's Missing |
|--------|------|-------------|----------------|
| Workspace Store | `lib/workspace/workspace-store.ts` | Basic state | State machine, TTL, card lifecycle |
| SIVA Store | `lib/stores/siva-store.ts` | Messages array | Decision persistence, card-first model |
| User Preferences | `lib/db/user-preferences.ts` | Fixed enum preferences | Natural language parsing, validation |
| Recall | `components/workspace/HistoricalRecallBanner.tsx` | Action history | Decision/event recall model |

### 3.3 MISSING (Must Be Built)

| System | Locked Requirement | Priority |
|--------|-------------------|----------|
| Card State Machine | Card birth → action → persist/expire | P0 |
| Decision Store | Persist decisions for recall | P0 |
| TTL Engine | Card expiry logic | P1 |
| NL Preference Parser | Parse "Send me a daily report" | P1 |
| Preference Validator | Accept/reject with reason | P1 |
| Recall Index | Decision/event lookup by entity | P1 |

### 3.4 INCORRECT COUPLING (Must Be Refactored)

| System | Current State | Required State |
|--------|---------------|----------------|
| SIVA Store | `messages: SIVAMessage[]` - chat history | `cards: Card[]` - ephemeral cards |
| SIVA Store | `outputObjects: OutputObject[]` - separate | Merge into card model |
| SIVA Store | `clearConversation()` | Not needed (no conversation) |

---

## 4. State & Wiring Audit

### 4.1 Current State Model

```typescript
// CURRENT (siva-store.ts)
interface SIVAStore {
  state: SIVAState;           // 'idle' | 'listening' | 'thinking' | 'generating' | 'complete' | 'error'
  activeAgent: AgentType;
  messages: SIVAMessage[];    // VIOLATION: Chat history stored
  outputObjects: OutputObject[]; // PARTIAL: Not card model
  reasoningSteps: ReasoningStep[];
  inputValue: string;
  showReasoningOverlay: boolean;
}
```

### 4.2 REQUIRED State Machine (per LOCKED docs)

```typescript
// REQUIRED (per WORKSPACE_EXPERIENCE_FLOW.md)
interface WorkspaceState {
  // Entry conditions
  vertical: string;
  subVertical: string;
  region: string;
  persona: Persona;
  policy: Policy;

  // Card surface
  cards: Card[];              // Priority-ordered, TTL-aware
  nba: NBA | null;            // Single NBA (or none)

  // Left rail state (dynamic)
  leftRailSections: {
    today: boolean;           // Always true
    savedLeads: number;       // Count, show if > 0
    followUps: number;        // Count, show if > 0
    reports: number;          // Count, show if > 0
  };

  // System state
  systemState: 'live' | 'waiting' | 'no_signals';
  changesCount: number;       // "2 changes since last visit"

  // NO messages array
  // NO conversation history
}
```

### 4.3 State Wiring Gaps

| Gap | Current | Required |
|-----|---------|----------|
| Messages persist | `messages` array in store | No message persistence |
| Cards not first-class | `outputObjects` separate | Cards ARE the surface |
| No TTL | Objects live forever | Cards expire by TTL |
| No priority ordering | Chronological | Priority-ordered |
| No card lifecycle | Render/remove only | Birth → action → persist/expire |
| Left rail static | Fixed navigation | Dynamic based on state |
| No silence state | Always shows content | "No signals" is valid state |

### 4.4 UI Lying About System State

| UI Element | What It Shows | What System Has |
|------------|---------------|-----------------|
| Sidebar items | All always visible | Should hide if empty |
| Messages | Full history | Should be ephemeral |
| Dashboard routes | 15+ pages | Should be one canvas |

---

## 5. Anti-Pattern Violations

### EXPLICIT LIST (No Soft Language)

| # | Anti-Pattern | Current Location | Severity |
|---|--------------|------------------|----------|
| 1 | **Chat transcripts stored** | `lib/stores/siva-store.ts:112` - `messages: SIVAMessage[]` | CRITICAL |
| 2 | **Chat bubbles exist** | `components/chat/MessageBubble.tsx` | CRITICAL |
| 3 | **Multiple pages** | `app/dashboard/*` - 15+ routes | CRITICAL |
| 4 | **Static sidebar** | `components/shell/Sidebar.tsx` - hardcoded items | HIGH |
| 5 | **Empty sections shown** | Sidebar shows all items regardless of content | HIGH |
| 6 | **Modal interruptions** | 18 modal components in `components/*/` | HIGH |
| 7 | **Settings vs Preferences** | `ProfileSettings.tsx` + `user-preferences.ts` | MEDIUM |
| 8 | **Chronological ordering** | Messages/objects added in time order | MEDIUM |
| 9 | **No TTL on cards** | OutputObjects have no expiry | MEDIUM |
| 10 | **Forced engagement** | Auto-run discovery on load | LOW |

### Anti-Pattern Code References

```typescript
// VIOLATION 1: Chat history stored (siva-store.ts:112)
messages: SIVAMessage[];  // REMOVE

// VIOLATION 2: Messages rendered as bubbles (SIVASurface.tsx:248-288)
{messages.map((message, idx) => (
  <motion.div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
    // CHAT BUBBLE - REMOVE

// VIOLATION 3: Static sidebar (Sidebar.tsx)
const navItems = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Discovery', href: '/dashboard/discovery', icon: Target },
  // HARDCODED - REBUILD AS DYNAMIC

// VIOLATION 4: Multiple modals
components/enterprise/WorkspaceCreateModal.tsx
components/enterprise/UserInviteModal.tsx
// ... 16 more - REMOVE OR REDESIGN
```

---

## 6. Reuse Map

### 6.1 Safe to Reuse (No Changes)

| Component | File | Notes |
|-----------|------|-------|
| NBA Engine | `lib/workspace/nba-engine.ts` | Fully compliant |
| Business Events | `lib/events/event-emitter.ts` | Fully compliant |
| Brand Logo | `components/brand/PremiumRadarLogo.tsx` | Visual only |
| Lucide Icons | All icon usage | Visual only |

### 6.2 Reuse With Refactor

| Component | Refactor Required |
|-----------|-------------------|
| SIVAInputBar | Change from chat input to command palette |
| NextBestAction | Already compliant, minor styling |
| DiscoveryObject | Convert to Card component |
| ScoringObject | Convert to Card component |
| PagelessShell | Remove page links, make sidebar dynamic |
| Context Bar | Minor - already close to spec |

### 6.3 Delete and Rebuild

| Component | Reason |
|-----------|--------|
| ChatInterface | Chat model forbidden |
| MessageBubble | Chat bubbles forbidden |
| Sidebar | Static navigation forbidden |
| All dashboard sub-routes | Pageless model |
| All modals | Modal interruptions forbidden |

---

## 7. Heavy-Lift Implementation Plan (A→Z)

### Phase 0: Foundation (BLOCKING)

```
P0.1: Delete chat components
      - Remove components/chat/*
      - Remove messages array from SIVA store

P0.2: Remove multi-page routing
      - Consolidate to single /workspace route
      - Remove /dashboard/* sub-routes

P0.3: Create Card state model
      - Define Card interface with TTL
      - Implement card lifecycle
      - Priority ordering logic
```

### Phase 1: Core Surface

```
P1.1: Build Dynamic Left Rail
      - Sections appear/disappear based on state
      - No empty sections
      - Click = filter, not navigate

P1.2: Build Card Container
      - Max 2 lines visible
      - Expand on demand
      - Actions on cards
      - Single NBA enforcement

P1.3: Implement Command Palette
      - Refactor SIVAInputBar
      - Input → resolution → card
      - No chat bubbles
```

### Phase 2: Intelligence Wiring

```
P2.1: Wire NBA to Card Surface
      - Single NBA card at top
      - [Do Now] [Defer] actions

P2.2: Implement Decision Persistence
      - Store decisions (not conversations)
      - Enable recall lookup

P2.3: Build Recall Surface
      - Decision recall
      - Event recall
      - "Previously evaluated" pattern
```

### Phase 3: Preferences & States

```
P3.1: Build NL Preference Parser
      - Parse free-form text
      - Validate against policy
      - Accept/reject with reason

P3.2: Build Silence States
      - "No new signals today"
      - "Nothing urgent"
      - Trust builders

P3.3: Build Report Cards
      - Pull-based display
      - No modal interruption
```

### Phase 4: Polish & Compliance

```
P4.1: TTL Engine
      - Card expiry logic
      - Graceful removal

P4.2: Rehydration Logic
      - Returning login state
      - "2 changes since last visit"

P4.3: Remove all modals
      - Replace with card-based flows
      - Inline actions only
```

---

## 8. Estimated Scope

| Phase | Components | Effort Level |
|-------|------------|--------------|
| P0 | Foundation | HIGH (architectural change) |
| P1 | Core Surface | HIGH (new components) |
| P2 | Intelligence | MEDIUM (wiring existing backend) |
| P3 | Preferences | MEDIUM (new subsystem) |
| P4 | Polish | LOW (refinement) |

**Total:** Major rebuild required. This is not an incremental update.

---

## 9. Final Assessment

The current implementation was built around a **chat-centric, multi-page model**. The locked UX requires a **card-centric, pageless model**. These are fundamentally different architectures.

### What Works
- NBA Engine (single NBA, compliant)
- Business Events (immutable, compliant)
- Basic UI components (can be adapted)

### What Must Change
- Everything related to messages/conversation
- All page-based routing
- Sidebar behavior
- State model
- Card lifecycle

### Recommended Approach
Clean rebuild of the workspace surface using existing backend systems. Do not attempt to incrementally migrate - the architectural gap is too wide.

---

**End of Audit**
