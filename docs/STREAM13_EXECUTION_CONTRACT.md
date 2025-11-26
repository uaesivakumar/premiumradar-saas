# Stream 13 Execution Contract

**Stream:** Stream 13 — SIVA Intelligence & Routing Layer
**Sprints:** S43-S47
**Date:** 2025-11-26
**Status:** BINDING CONTRACT

---

## CRITICAL CONSTRAINT: ADDITIVE-ONLY IMPLEMENTATION

Stream 13 adds the **"brain"** (intelligence layer).
Existing code is the **"muscles"** (execution layer).

**The brain wraps the muscles. It does NOT replace them.**

---

## NO INTERFERENCE CONTRACT

### PROTECTED FILES — DO NOT MODIFY

#### SIVA Surface (S26-S30)
```
✗ components/siva/SIVASurface.tsx
✗ components/siva/SIVAInputBar.tsx
✗ components/siva/SIVAPersonaPanel.tsx
✗ components/siva/AgentSwitcher.tsx
✗ components/siva/OutputObjectRenderer.tsx
✗ components/siva/ReasoningOverlay.tsx
✗ components/siva/index.ts
```

#### Output Objects v1
```
✗ components/siva/objects/DiscoveryObject.tsx
✗ components/siva/objects/ObjectContainer.tsx
✗ components/siva/objects/OutreachObject.tsx
✗ components/siva/objects/RankingObject.tsx
✗ components/siva/objects/ScoringObject.tsx
✗ components/siva/objects/index.ts
```

#### Agent Registry & Types
```
✗ lib/agents/registry.ts
✗ lib/agents/types.ts
✗ lib/agents/index.ts
```

#### Stores
```
✗ lib/stores/siva-store.ts
✗ lib/stores/industry-store.ts
✗ lib/stores/onboarding-store.ts
✗ lib/stores/scoring-store.ts
```

#### Execution Engines
```
✗ lib/os-client.ts
✗ lib/discovery/* (if exists)
✗ lib/ranking/* (if exists)
✗ lib/outreach/* (if exists)
```

#### Dashboard Routes
```
✗ app/dashboard/*
✗ app/dashboard/layout.tsx
✗ app/dashboard/page.tsx
```

#### API Routes
```
✗ app/api/os/*
✗ app/api/health/*
```

---

## WRAPPER-ONLY STRATEGY

### MANDATORY WRAPPER HOOKS

TC MUST create these wrapper hooks to integrate intelligence:

```
lib/intelligence/hooks/
├── useIntentWrapper.ts      ← Wraps query processing
├── useRoutingWrapper.ts     ← Wraps agent selection
├── useEvidenceWrapper.ts    ← Wraps output generation
├── usePersonaWrapper.ts     ← Wraps message formatting
└── index.ts
```

### FORBIDDEN DIRECT CALLS

TC MUST NOT directly call or replace these functions:

```typescript
// ❌ FORBIDDEN - Direct modification
submitQuery()              // In siva-store.ts
handleAgentSelection()     // In AgentSwitcher.tsx
handleOutputObjectCreation() // In registry.ts

// ✅ ALLOWED - Wrapper pattern
useIntentWrapper().processQuery(query)  // Calls submitQuery internally
useRoutingWrapper().routeToAgent(query) // Wraps agent selection
useEvidenceWrapper().enrichOutput(obj)  // Wraps object creation
```

### WRAPPER INTEGRATION PATTERN

```typescript
// Example: Intent wrapper wraps submitQuery
export function useIntentWrapper() {
  const { submitQuery } = useSIVAStore();
  const { classifyIntent } = useIntentClassifier();

  const processQuery = async (query: string) => {
    // 1. Intelligence layer processes first
    const intent = await classifyIntent(query);
    const normalizedQuery = normalizeQuery(query, intent);

    // 2. Then calls existing submitQuery (unchanged)
    return submitQuery(normalizedQuery);
  };

  return { processQuery };
}
```

---

## NEW MODULE STRUCTURE

### Stream 13 Directory (CREATE ONLY)

```
lib/intelligence/                   ← ALL Stream 13 code goes here
├── index.ts                        ← Main exports
├── types.ts                        ← Shared intelligence types
│
├── hooks/                          ← WRAPPER HOOKS (Critical)
│   ├── useIntentWrapper.ts
│   ├── useRoutingWrapper.ts
│   ├── useEvidenceWrapper.ts
│   ├── usePersonaWrapper.ts
│   └── index.ts
│
├── intent/                         ← S43
│   ├── IntentClassifier.ts
│   ├── EntityExtractor.ts
│   ├── QueryNormalizer.ts
│   ├── ContextMemory.ts
│   ├── types.ts
│   └── index.ts
│
├── evidence/                       ← S44
│   ├── EvidenceCollector.ts
│   ├── SignalReasoner.ts
│   ├── ScoreJustifier.ts
│   ├── RankingEvidencePack.ts
│   ├── OutreachEvidencePack.ts
│   ├── types.ts
│   └── index.ts
│
├── routing/                        ← S45
│   ├── ToolRouter.ts
│   ├── MultiAgentOrchestrator.ts
│   ├── ExecutionQueue.ts
│   ├── FallbackHandler.ts
│   ├── AgentHandoff.ts
│   ├── types.ts
│   └── index.ts
│
├── objects/                        ← S46
│   ├── LiveObjectManager.ts
│   ├── ObjectLinker.ts
│   ├── ObjectInspector.ts
│   ├── SessionManager.ts
│   ├── types.ts
│   └── index.ts
│
└── persona/                        ← S47
    ├── PersonaKernel.ts
    ├── TonePackManager.ts
    ├── PersonalizationMemory.ts
    ├── BankingPersona.ts
    ├── OutreachTones.ts
    ├── types.ts
    └── index.ts
```

### New Stores (CREATE ONLY)

```
lib/stores/
├── intent-store.ts      ← NEW (S43)
├── evidence-store.ts    ← NEW (S44)
├── routing-store.ts     ← NEW (S45)
├── persona-store.ts     ← NEW (S47)
```

---

## PRE-COMMIT SAFETY CHECKS

Before EVERY commit, TC MUST verify:

```bash
# 1. Check no protected files modified
git diff --name-only | grep -E "(components/siva/|lib/agents/|lib/stores/siva-store|app/dashboard/|lib/os-client)" && echo "❌ PROTECTED FILE MODIFIED - REVERT" || echo "✅ No protected files modified"

# 2. Verify all changes in lib/intelligence/
git diff --name-only | grep -v "lib/intelligence/" | grep -v "docs/" | grep -v ".claude/" && echo "⚠️ Changes outside intelligence layer" || echo "✅ All changes in intelligence layer"

# 3. Build must pass
npm run build

# 4. TypeScript must pass
npx tsc --noEmit
```

---

## ENFORCEMENT SUMMARY

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                     STREAM 13 EXECUTION RULES                                 ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ✗ DO NOT MODIFY:                                                            ║
║    • components/siva/* (all SIVA Surface components)                         ║
║    • components/siva/objects/* (v1 output objects)                           ║
║    • lib/agents/* (registry, types)                                          ║
║    • lib/stores/siva-store.ts                                                ║
║    • lib/os-client.ts                                                        ║
║    • lib/discovery/*, lib/ranking/*, lib/outreach/* (engines)                ║
║    • app/dashboard/* (dashboard routes)                                      ║
║    • app/api/os/* (API routes)                                               ║
║                                                                              ║
║  ✓ CREATE ONLY:                                                              ║
║    • lib/intelligence/* (all Stream 13 modules)                              ║
║    • lib/intelligence/hooks/* (wrapper hooks)                                ║
║    • lib/stores/*-store.ts (new stores only)                                 ║
║                                                                              ║
║  ✓ WRAPPER PATTERN:                                                          ║
║    • useIntentWrapper → wraps submitQuery                                    ║
║    • useRoutingWrapper → wraps agent selection                               ║
║    • useEvidenceWrapper → wraps output creation                              ║
║    • usePersonaWrapper → wraps message formatting                            ║
║                                                                              ║
║  ✗ FORBIDDEN DIRECT CALLS:                                                   ║
║    • submitQuery() - use useIntentWrapper().processQuery()                   ║
║    • handleAgentSelection() - use useRoutingWrapper().routeToAgent()         ║
║    • handleOutputObjectCreation() - use useEvidenceWrapper().enrichOutput()  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## CONTRACT SIGNATURE

This contract is binding for all S43-S47 implementation.
Any violation requires immediate revert and re-implementation.

**Stream 13 = Brain (Intelligence Layer)**
**S26-S36 = Muscles (Execution Layer)**

The brain wraps the muscles. It does NOT replace them.

---

*Contract Created: 2025-11-26*
*Enforced For: S43, S44, S45, S46, S47*
