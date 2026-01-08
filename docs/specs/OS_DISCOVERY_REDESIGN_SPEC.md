# OS Discovery Redesign Specification

**Version:** 1.0
**Status:** APPROVED
**Sprint Target:** S383+
**Author:** TC
**Date:** 2025-01-08

---

## Scope Lock

### In Scope
- OS discovery pipeline redesign
- Query understanding + query synthesis
- Constraint validation (geo, freezone, area)
- Novelty + freshness controls
- Evidence payload contract

### Out of Scope (DO NOT TOUCH)
- SaaS workspace
- Card architecture
- BTE (Banking Targeting Engine)
- NBA core
- Auth
- Admin plane

---

## A. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USER REQUEST                                        │
│  POST /api/os/discovery                                                         │
│  {                                                                              │
│    queryText: "Find companies in ADGM Abu Dhabi",                              │
│    vertical: "banking", subVertical: "employee_banking", region: "UAE",        │
│    constraints: { area: "ADGM", city: "Abu Dhabi" },                           │
│    sinceTimestamp: "2025-01-01T00:00:00Z",                                     │
│    excludeEntityIds: ["entity-123", "entity-456"],                             │
│    noveltyMode: "strict"                                                        │
│  }                                                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: QUERY UNDERSTANDING (NEW - LLM)                                       │
│  ═══════════════════════════════════════                                        │
│                                                                                 │
│  Input: queryText + context                                                     │
│                                                                                 │
│  LLM Task: Parse user intent and extract constraints                           │
│                                                                                 │
│  Output: {                                                                      │
│    intent: "find_leads",                                                        │
│    parsedLocation: {                                                            │
│      country: "UAE",                                                            │
│      emirate: "Abu Dhabi",                                                      │
│      area: "ADGM",                          // Free zone detected               │
│      areaType: "free_zone",                 // free_zone | mainland | district  │
│      confidence: 0.95                                                           │
│    },                                                                           │
│    entityType: "company",                                                       │
│    signalTypes: ["hiring", "expansion"],    // Inferred from context           │
│    temporalHint: null                       // "recent", "this week", etc.     │
│  }                                                                              │
│                                                                                 │
│  Model: gpt-4-turbo | Cost: ~$0.02                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 2: QUERY SYNTHESIS (NEW - LLM)                                           │
│  ════════════════════════════════════                                           │
│                                                                                 │
│  Input: Parsed intent + location + context                                      │
│                                                                                 │
│  LLM Task: Generate optimal search queries for SERP                            │
│                                                                                 │
│  Output: {                                                                      │
│    queries: [                                                                   │
│      "ADGM registered companies hiring 2025",                                  │
│      "Abu Dhabi Global Market fintech expansion",                              │
│      "ADGM financial services new office",                                     │
│      "companies relocating to ADGM Abu Dhabi"                                  │
│    ],                                                                           │
│    searchLocation: "Abu Dhabi, United Arab Emirates",                          │
│    dateRestrict: "m3"  // Last 3 months (from sinceTimestamp)                  │
│  }                                                                              │
│                                                                                 │
│  Model: gpt-4-turbo | Cost: ~$0.01                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 3: SERP EXECUTION                                                        │
│  ═══════════════════════                                                        │
│                                                                                 │
│  FOR EACH synthesized query:                                                    │
│    POST https://serpapi.com/search                                             │
│      q: query                                                                   │
│      location: searchLocation                                                   │
│      tbs: dateRestrict                      // Time-based search               │
│      num: 10                                                                    │
│                                                                                 │
│  Output: Array<{                                                                │
│    title: string,                                                               │
│    snippet: string,                                                             │
│    url: string,                                                                 │
│    date: string | null,                     // Published date if available     │
│    source: string                           // Domain                          │
│  }>                                                                             │
│                                                                                 │
│  Cost: $0.005 × 4 queries = $0.02                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 4: CANDIDATE EXTRACTION (LLM - Enhanced)                                 │
│  ══════════════════════════════════════════════                                 │
│                                                                                 │
│  FOR EACH search result:                                                        │
│    Input: { title, snippet, url } + CONSTRAINT CONTEXT (NEW)                   │
│                                                                                 │
│    LLM Task: Extract companies WITH location validation context                │
│                                                                                 │
│    System Prompt Enhancement:                                                   │
│      "User is looking for companies in: {parsedLocation.area}                  │
│       Only extract companies with EXPLICIT evidence of presence in this area.  │
│       If location cannot be determined from content, mark as UNVERIFIED."      │
│                                                                                 │
│    Output per signal: {                                                         │
│      companyName: "string",                                                     │
│      extractedLocation: {                                                       │
│        raw: "headquartered in ADGM",        // Exact text from article         │
│        normalized: "ADGM",                                                      │
│        confidence: "VERIFIED" | "INFERRED" | "UNVERIFIED"                      │
│      },                                                                         │
│      evidence: {                                                                │
│        sourceUrl: "string",                                                     │
│        snippet: "string",                   // Relevant excerpt                 │
│        publishedDate: "string | null"                                          │
│      },                                                                         │
│      signal: {                                                                  │
│        type: "hiring" | "expansion" | "funding" | ...,                         │
│        strength: 1-5,                                                           │
│        description: "string"                                                    │
│      }                                                                          │
│    }                                                                            │
│                                                                                 │
│  Cost: $0.024 × 15 results = $0.36                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 5: CONSTRAINT VALIDATION FILTER (NEW - CRITICAL)                         │
│  ══════════════════════════════════════════════════════                         │
│                                                                                 │
│  RULE: FAIL CLOSED. If location cannot be validated, DISCARD.                  │
│                                                                                 │
│  FOR EACH extracted candidate:                                                  │
│                                                                                 │
│    IF constraints.area exists:                                                  │
│      IF extractedLocation.normalized != constraints.area:                       │
│        → REJECT (reason: "location_mismatch")                                  │
│      IF extractedLocation.confidence == "UNVERIFIED":                          │
│        → REJECT (reason: "location_unverified")                                │
│                                                                                 │
│    IF constraints.city exists:                                                  │
│      IF extractedLocation does not include city:                               │
│        → REJECT (reason: "city_mismatch")                                      │
│                                                                                 │
│  Output: {                                                                      │
│    passed: Array<Candidate>,                                                    │
│    rejected: Array<{ candidate, reason }>,                                     │
│    stats: {                                                                     │
│      total: number,                                                             │
│      passed: number,                                                            │
│      rejected: number,                                                          │
│      rejectionReasons: { location_mismatch: n, location_unverified: n, ... }   │
│    }                                                                            │
│  }                                                                              │
│                                                                                 │
│  Cost: $0 (logic only)                                                          │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 6: NOVELTY + FRESHNESS FILTER (NEW)                                      │
│  ═════════════════════════════════════════                                      │
│                                                                                 │
│  Input: Validated candidates + excludeEntityIds + sinceTimestamp               │
│                                                                                 │
│  Filter 1: Exclude Previously Seen                                              │
│    IF candidate.entityId IN excludeEntityIds:                                   │
│      IF noveltyMode == "strict":                                                │
│        → REJECT (reason: "previously_seen")                                    │
│      IF noveltyMode == "allow_new_evidence":                                   │
│        IF candidate.evidence.publishedDate > lastSeenDate:                     │
│          → PASS with resurfaceReason: "new_evidence"                           │
│        ELSE:                                                                    │
│          → REJECT (reason: "no_new_evidence")                                  │
│                                                                                 │
│  Filter 2: Freshness                                                            │
│    IF sinceTimestamp exists:                                                    │
│      IF candidate.evidence.publishedDate < sinceTimestamp:                     │
│        → REJECT (reason: "stale_evidence")                                     │
│                                                                                 │
│  Output: {                                                                      │
│    novel: Array<Candidate>,                                                     │
│    resurfaced: Array<{ candidate, resurfaceReason }>,                          │
│    filtered: Array<{ candidate, reason }>                                      │
│  }                                                                              │
│                                                                                 │
│  Cost: $0 (logic only)                                                          │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 7: SIVA SCORING (Existing - No Changes)                                  │
│  ═════════════════════════════════════════════                                  │
│                                                                                 │
│  Score validated candidates by:                                                 │
│    - Quality (Q-Score)                                                          │
│    - Timing (T-Score)                                                           │
│    - Likelihood (L-Score)                                                       │
│    - Effort (E-Score)                                                           │
│                                                                                 │
│  Output: Scored candidates sorted by composite score                            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RESPONSE                                            │
│  {                                                                              │
│    success: true,                                                               │
│    data: {                                                                      │
│      companies: [...],                      // Validated + scored              │
│      evidence: [...],                       // Source URLs + snippets          │
│      queryUnderstanding: {                  // Transparency                    │
│        parsedLocation: {...},                                                   │
│        synthesizedQueries: [...]                                               │
│      },                                                                         │
│      validation: {                                                              │
│        totalExtracted: 15,                                                      │
│        passedValidation: 3,                                                     │
│        rejectedCount: 12,                                                       │
│        rejectionBreakdown: {...}                                               │
│      },                                                                         │
│      novelty: {                                                                 │
│        newCompanies: 2,                                                         │
│        resurfacedWithNewEvidence: 1,                                           │
│        filteredAsSeen: 5                                                        │
│      }                                                                          │
│    },                                                                           │
│    meta: {                                                                      │
│      requestId: "...",                                                          │
│      processingTime: 4500,                                                      │
│      costs: { queryUnderstanding: 0.02, querySynthesis: 0.01, serp: 0.02, extraction: 0.36 }
│    }                                                                            │
│  }                                                                              │
│                                                                                 │
│  IF no valid companies:                                                         │
│  {                                                                              │
│    success: true,                                                               │
│    data: {                                                                      │
│      companies: [],                                                             │
│      message: "No companies found in ADGM matching your criteria.",            │
│      suggestion: "Try broadening to Abu Dhabi or All UAE",                     │
│      validation: { totalExtracted: 15, passedValidation: 0, ... }              │
│    }                                                                            │
│  }                                                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## B. Data Contracts

### Request Contract

```typescript
interface DiscoveryRequest {
  // Required
  tenant_id: string;
  persona_id: number;                    // 1-7 (existing)
  request_id: string;                    // Client UUID for idempotency

  // Query Understanding (NEW)
  queryText: string;                     // User's natural language query

  // Context
  sales_context: {
    vertical: string;                    // "banking"
    sub_vertical: string;                // "employee_banking"
    region: string;                      // "UAE"
  };

  // Constraints (NEW)
  constraints?: {
    country?: string;                    // "UAE"
    emirate?: string;                    // "Abu Dhabi"
    city?: string;                       // "Abu Dhabi City"
    area?: string;                       // "ADGM" | "Masdar City" | "DIFC"
    areaType?: 'free_zone' | 'mainland' | 'district';
  };

  // Novelty Controls (NEW)
  sinceTimestamp?: string;               // ISO 8601 - only news after this date
  excludeEntityIds?: string[];           // Previously seen entity IDs
  noveltyMode?: 'strict' | 'allow_new_evidence';  // Default: 'strict'

  // Existing
  mode?: 'live' | 'cached';
  workPatterns?: {
    preferredSectors?: string[];
    excludedCompanies?: string[];
  };
  options?: {
    maxResults?: number;                 // Default: 10
    includeEvidence?: boolean;           // Default: true
    includeQueryUnderstanding?: boolean; // Default: true
  };
}
```

### Response Contract

```typescript
interface DiscoveryResponse {
  success: boolean;

  data: {
    // Validated companies
    companies: Array<{
      id: string;                        // Entity ID (for excludeEntityIds)
      name: string;
      domain?: string;
      industry?: string;

      // Location (validated)
      location: {
        raw: string;                     // "headquartered in ADGM"
        normalized: string;              // "ADGM"
        city?: string;                   // "Abu Dhabi"
        country: string;                 // "UAE"
        confidence: 'VERIFIED' | 'INFERRED';  // Never UNVERIFIED (filtered)
      };

      // Signal
      signal: {
        type: string;
        strength: number;                // 1-5
        description: string;
        triggerDate?: string;            // When signal occurred
      };

      // Evidence (NEW - required)
      evidence: {
        sourceUrl: string;
        sourceTitle: string;
        snippet: string;                 // Relevant excerpt with location mention
        publishedDate?: string;
        accessedAt: string;
      };

      // Scores (existing)
      sivaScores: {
        quality: number;
        timing: number;
        likelihood: number;
        effort: number;
        overall: number;
        tier: 'HOT' | 'WARM' | 'COOL';
      };

      // Novelty status (NEW)
      noveltyStatus: 'new' | 'resurfaced';
      resurfaceReason?: string;          // If resurfaced: "new_evidence_2025-01-08"
    }>;

    // Query understanding transparency (NEW)
    queryUnderstanding?: {
      originalQuery: string;
      parsedIntent: string;
      parsedLocation: {
        country?: string;
        emirate?: string;
        city?: string;
        area?: string;
        areaType?: string;
        confidence: number;
      };
      synthesizedQueries: string[];
    };

    // Validation stats (NEW)
    validation: {
      totalExtracted: number;
      passedValidation: number;
      rejectedCount: number;
      rejectionBreakdown: {
        location_mismatch: number;
        location_unverified: number;
        city_mismatch: number;
      };
    };

    // Novelty stats (NEW)
    novelty: {
      newCompanies: number;
      resurfacedWithNewEvidence: number;
      filteredAsPreviouslySeen: number;
      filteredAsStale: number;
    };

    // Empty result handling (NEW)
    message?: string;                    // "No companies found in ADGM..."
    suggestion?: string;                 // "Try broadening to Abu Dhabi"
  };

  error?: string;

  meta: {
    requestId: string;
    processingTimeMs: number;
    costs: {
      queryUnderstanding: number;
      querySynthesis: number;
      serp: number;
      extraction: number;
      total: number;
    };
  };
}
```

---

## C. Acceptance Tests

### Test 1: Location Constraint - Masdar City

```yaml
name: masdar_city_constraint
description: Query for Masdar City should only return Masdar-validated companies

request:
  queryText: "Find companies in Masdar City"
  sales_context:
    vertical: banking
    sub_vertical: employee_banking
    region: UAE
  constraints:
    area: "Masdar City"
    city: "Abu Dhabi"
  noveltyMode: strict

expected_behavior:
  - Query understanding extracts: { area: "Masdar City", city: "Abu Dhabi", areaType: "free_zone" }
  - Synthesized queries include: "Masdar City companies", "Masdar sustainable companies"
  - Extraction marks location confidence for each company
  - Validation filter REJECTS companies without explicit Masdar mention
  - Response contains ONLY Masdar-validated companies OR empty with explanation

acceptance_criteria:
  - IF companies returned: ALL must have location.normalized = "Masdar City"
  - IF no companies: response.data.message must explain "No companies found in Masdar City"
  - response.data.validation.rejectedCount shows how many were filtered
  - NEVER return generic UAE companies (G42, Microsoft, etc.) without Masdar evidence
```

### Test 2: Location Constraint - ADGM

```yaml
name: adgm_constraint
description: Query for ADGM should only return ADGM-validated companies

request:
  queryText: "Find good companies in ADGM Abu Dhabi"
  sales_context:
    vertical: banking
    sub_vertical: employee_banking
    region: UAE
  constraints:
    area: "ADGM"
    city: "Abu Dhabi"
    areaType: "free_zone"
  noveltyMode: strict

expected_behavior:
  - Query understanding extracts: { area: "ADGM", city: "Abu Dhabi", areaType: "free_zone" }
  - Synthesized queries include: "ADGM registered companies", "Abu Dhabi Global Market fintech"
  - Extraction looks for explicit ADGM mentions in articles
  - Validation filter REJECTS companies saying just "Abu Dhabi" without ADGM

acceptance_criteria:
  - IF companies returned: ALL must have evidence mentioning "ADGM" explicitly
  - IF no companies: response.data.message = "No companies found in ADGM matching your criteria"
  - response.data.companies[*].evidence.snippet must contain "ADGM" or "Abu Dhabi Global Market"
  - NEVER return mainland Abu Dhabi companies as ADGM results
```

### Test 3: Novelty - No Repeats

```yaml
name: novelty_no_repeats
description: Same query next day should not return same companies without new evidence

setup:
  # Day 1: Run discovery, get companies A, B, C
  day1_response:
    companies: [{ id: "A" }, { id: "B" }, { id: "C" }]

request:
  # Day 2: Same query with exclusions
  queryText: "Find companies in ADGM"
  excludeEntityIds: ["A", "B", "C"]
  noveltyMode: strict
  sinceTimestamp: "2025-01-08T00:00:00Z"

expected_behavior:
  - Companies A, B, C are excluded from results
  - Only NEW companies (D, E, F) or companies with NEW evidence are returned
  - If no new companies: empty result with explanation

acceptance_criteria:
  - response.data.companies should NOT contain ids A, B, or C
  - response.data.novelty.filteredAsPreviouslySeen = 3 (if A, B, C were in SERP results)
  - IF A resurfaces with new evidence published after sinceTimestamp:
    - Include with noveltyStatus: "resurfaced", resurfaceReason: "new_evidence_2025-01-09"
```

### Test 4: Empty Result Handling

```yaml
name: empty_result_graceful
description: No valid matches should return helpful empty response, never wrong results

request:
  queryText: "Find companies in Khalifa Port Free Zone"
  constraints:
    area: "Khalifa Port Free Zone"
    city: "Abu Dhabi"
  noveltyMode: strict

expected_behavior:
  - If no companies explicitly mention Khalifa Port Free Zone: empty result
  - Response includes explanation and suggestion
  - NEVER falls back to generic Abu Dhabi or UAE results

acceptance_criteria:
  - IF validation.passedValidation = 0:
    - response.data.companies = []
    - response.data.message = "No companies found in Khalifa Port Free Zone matching your criteria."
    - response.data.suggestion = "Try broadening to Abu Dhabi or All UAE"
  - response.success = true (empty is not an error)
  - NEVER return companies without explicit Khalifa Port evidence
```

### Test 5: Evidence Required

```yaml
name: evidence_required
description: Every returned company must have verifiable evidence

request:
  queryText: "Find hiring companies in DIFC"
  constraints:
    area: "DIFC"
    city: "Dubai"
  options:
    includeEvidence: true

acceptance_criteria:
  - EVERY company in response has:
    - evidence.sourceUrl: valid URL
    - evidence.snippet: non-empty string containing "DIFC" or "Dubai International Financial"
    - evidence.publishedDate: ISO date or null (not fabricated)
  - Companies without evidence are NOT included
  - evidence.snippet is actual text from source, not generated
```

---

## D. Migration Plan

### Phase 1: Query Understanding + Synthesis (S383)

**Goal:** Add LLM-based query parsing and search query generation

**Changes:**
1. New file: `/os/discovery/query-understanding.js`
   - `parseUserQuery(queryText, context)` → parsed intent + location
   - Uses GPT-4 with structured output

2. New file: `/os/discovery/query-synthesis.js`
   - `synthesizeSearchQueries(parsedQuery)` → array of SERP queries
   - Replaces static template system

3. Modify: `/routes/os/discovery.js`
   - Add Layer 1 + Layer 2 before SERP calls
   - Keep existing extraction as fallback

**Rollout:**
- Feature flag: `DISCOVERY_QUERY_UNDERSTANDING_ENABLED`
- A/B test: 10% traffic initially
- Monitor: Query quality, cost increase, latency

**Acceptance:**
- Queries include specific location terms (ADGM, Masdar, etc.)
- Cost increase < $0.05 per discovery
- Latency increase < 500ms

---

### Phase 2: Validation Filter (S384)

**Goal:** Add constraint validation layer after extraction

**Changes:**
1. New file: `/os/discovery/constraint-validator.js`
   - `validateCandidate(candidate, constraints)` → pass/reject with reason
   - Location matching with confidence check

2. Modify: `/os/discovery/signal-extraction.js`
   - Add constraint context to LLM prompt
   - Extract location confidence per signal

3. Modify: `/routes/os/discovery.js`
   - Add Layer 5 after extraction
   - Return validation stats in response

**Rollout:**
- Feature flag: `DISCOVERY_VALIDATION_FILTER_ENABLED`
- Initially log-only (don't filter, just track)
- Then enable filtering with flag

**Acceptance:**
- Masdar query returns only Masdar companies or empty
- ADGM query returns only ADGM companies or empty
- Validation stats visible in response

---

### Phase 3: Novelty + Freshness (S385)

**Goal:** Add novelty and freshness filtering

**Changes:**
1. New file: `/os/discovery/novelty-filter.js`
   - `filterByNovelty(candidates, excludeIds, sinceTimestamp, mode)`
   - Handles strict vs allow_new_evidence modes

2. Modify: `/routes/os/discovery.js`
   - Accept `excludeEntityIds`, `sinceTimestamp`, `noveltyMode`
   - Add Layer 6 before scoring
   - Return novelty stats in response

3. New table: `discovery_entity_history`
   - Track seen entities per tenant/user
   - Store last evidence date per entity

**Rollout:**
- Feature flag: `DISCOVERY_NOVELTY_FILTER_ENABLED`
- Start with `sinceTimestamp` only
- Add `excludeEntityIds` after SaaS integration

**Acceptance:**
- Same query next day returns different results (or empty with explanation)
- Re-surfaced companies show new evidence
- Novelty stats visible in response

---

### Phase 4: Smart Caching (S386)

**Goal:** Cache respects novelty and constraints

**Changes:**
1. Modify: `/os/discovery/cache.js`
   - Cache key includes: query + constraints + noveltyMode
   - TTL based on freshness requirements
   - Invalidate on new SERP results

2. Add: Cache warming for common queries
   - Background job runs popular queries
   - Pre-populates cache with fresh results

**Rollout:**
- Feature flag: `DISCOVERY_SMART_CACHE_ENABLED`
- Monitor cache hit rates
- Ensure novelty not violated by cache

**Acceptance:**
- Cache hit doesn't return stale/seen companies
- Different constraints = different cache entries
- Cache warming reduces latency for common queries

---

## Cost Analysis

| Layer | Operation | Cost per Discovery |
|-------|-----------|-------------------|
| Query Understanding | GPT-4 (1 call) | $0.02 |
| Query Synthesis | GPT-4 (1 call) | $0.01 |
| SERP Execution | SerpAPI (4 calls) | $0.02 |
| Candidate Extraction | GPT-4 (15 calls) | $0.36 |
| **Total** | | **$0.41** |

**Current cost:** ~$0.38
**New cost:** ~$0.41
**Increase:** ~8% (+$0.03)

Value: Correct results vs. wrong results = priceless.

---

## Non-Negotiable Rules

1. **FAIL CLOSED**: If location cannot be validated, discard the entity
2. **EMPTY > WRONG**: Zero results is acceptable; irrelevant results are not
3. **EVIDENCE REQUIRED**: Every returned company must have verifiable source
4. **NO FALLBACKS**: Never fall back to generic results when specific location requested
5. **TRANSPARENCY**: Response must show what was filtered and why

---

## Sprint Breakdown

| Sprint | Scope | Effort |
|--------|-------|--------|
| S383 | Query Understanding + Synthesis | 3 days |
| S384 | Validation Filter | 2 days |
| S385 | Novelty + Freshness | 3 days |
| S386 | Smart Caching | 2 days |

**Total:** 10 days across 4 sprints

---

## Approval

- [ ] Architecture reviewed
- [ ] Data contracts approved
- [ ] Acceptance tests defined
- [ ] Migration plan approved
- [ ] Cost increase acceptable

**Approved by:** Founder
**Date:** 2025-01-08
