# OS Discovery Redesign Specification v2.0

**Version:** 2.0 (POLICY-BOUND, NOVELTY-BOUND, ANSWER-ENGINE-GRADE)
**Status:** APPROVED
**Sprint Target:** S383+
**Author:** TC + Founder
**Date:** 2025-01-08

---

## Design Principles

1. **NO LLM decides policy** - Policy comes ONLY from Control Plane SalesContext
2. **Fail closed** on constraints in STRICT mode - Empty > Wrong
3. **Novelty is OS-native memory** - Not SaaS responsibility
4. **LLM for understanding + synthesis only** - Batch extraction, not per-result
5. **Full observability** - Trace is mandatory for every request

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USER REQUEST                                        │
│  POST /api/os/discovery                                                         │
│  {                                                                              │
│    queryText: "Find companies in ADGM Abu Dhabi",                              │
│    salesContextRef: { vertical, subVertical, region, persona_id },             │
│    sinceTimestamp, noveltyMode, budget                                          │
│  }                                                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 0: SALES CONTEXT RESOLUTION (MANDATORY - Control Plane)                  │
│  ══════════════════════════════════════════════════════════════                 │
│                                                                                 │
│  Input: vertical / subVertical / region / persona_id                           │
│                                                                                 │
│  Resolution: Query Control Plane for policy bundle                             │
│                                                                                 │
│  Output: SalesContextSnapshot {                                                 │
│    // Entity Configuration                                                      │
│    entityType: "company" | "person",                                           │
│                                                                                 │
│    // Signal Policy (HARD RULES)                                               │
│    allowedSignals: ["hiring", "expansion", "funding", "office_opening"],       │
│    disallowedSignals: ["layoff", "bankruptcy"],                                │
│                                                                                 │
│    // Kill Rules (Hard Filters - NEVER show)                                   │
│    killRules: [                                                                 │
│      { field: "industry", operator: "in", values: ["gambling", "tobacco"] },   │
│      { field: "employee_count", operator: "lt", value: 10 }                    │
│    ],                                                                           │
│                                                                                 │
│    // ICP Constraints (Ideal Customer Profile)                                 │
│    icpConstraints: {                                                            │
│      minEmployeeCount: 50,                                                      │
│      salaryBandMin: 15000,        // AED for EB persona                        │
│      employerTypes: ["private", "semi_gov"],                                   │
│      excludedEmployerTypes: ["free_zone_retail"]                               │
│    },                                                                           │
│                                                                                 │
│    // Scoring Weights (Policy-Bound)                                           │
│    scoringWeights: {                                                            │
│      signalWeights: {                                                           │
│        hiring: 0.35,                                                            │
│        expansion: 0.25,                                                         │
│        funding: 0.20,                                                           │
│        office_opening: 0.20                                                     │
│      },                                                                         │
│      priorWeights: {                                                            │
│        locationPrestige: 0.15,    // LPP - hierarchical                        │
│        brandStrength: 0.10,                                                     │
│        icpFit: 0.25                                                             │
│      },                                                                         │
│      timeDecay: {                                                               │
│        halfLifeDays: 30,                                                        │
│        maxAgeDays: 180                                                          │
│      }                                                                          │
│    },                                                                           │
│                                                                                 │
│    // Compliance Rules                                                          │
│    complianceRules: {                                                           │
│      doNotSuggest: ["company-id-123"],  // Blacklisted entities               │
│      sourcingLimits: { maxPerQuery: 50 },                                      │
│      dataRetention: { maxDays: 90 }                                            │
│    },                                                                           │
│                                                                                 │
│    // Location Prestige Prior (Hierarchical, NOT hardcoded)                    │
│    locationPrestigePrior: {                                                     │
│      hierarchy: ["zone", "district", "building"],                              │
│      prestigeScores: {                                                          │
│        "ADGM": 0.95,                                                            │
│        "DIFC": 0.95,                                                            │
│        "Downtown_Dubai": 0.85,                                                  │
│        "Business_Bay": 0.80,                                                    │
│        // ... loaded from Control Plane, NOT hardcoded                         │
│      }                                                                          │
│    }                                                                            │
│  }                                                                              │
│                                                                                 │
│  HARD RULE: Downstream layers ONLY use what SalesContext allows. No inference. │
│                                                                                 │
│  Deliverable: SalesContextSnapshot logged in trace for every request           │
│                                                                                 │
│  Source: Control Plane tables (os_personas, os_verticals, os_compliance)       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: QUERY UNDERSTANDING (LLM - Cheap, Single Call)                        │
│  ═══════════════════════════════════════════════════════                        │
│                                                                                 │
│  Input: queryText + SalesContextSnapshot                                        │
│                                                                                 │
│  LLM Task: Convert user text → structured intent + constraints                 │
│                                                                                 │
│  System Prompt:                                                                 │
│    "Parse user query into structured discovery intent.                         │
│     You are NOT deciding policy - only extracting constraints from text.       │
│     Output must use the provided schema."                                       │
│                                                                                 │
│  Output: QueryUnderstanding {                                                   │
│    // Intent                                                                    │
│    intent: "discover_companies" | "discover_signals" | "evaluate_company",     │
│                                                                                 │
│    // Geo Constraints (as constraints, NOT truth)                              │
│    geoConstraints: {                                                            │
│      country: "UAE",                                                            │
│      emirate: "Abu Dhabi" | null,                                              │
│      city: "Abu Dhabi" | null,                                                  │
│      zone: "ADGM" | null,              // Free zone                            │
│      area: string | null,              // District/neighborhood                │
│      confidence: 0.0-1.0,                                                       │
│      ambiguous: boolean                                                         │
│    },                                                                           │
│                                                                                 │
│    // Requested Signals (MUST be intersected with allowedSignals)              │
│    requestedSignals: ["hiring", "expansion"],                                  │
│                                                                                 │
│    // Time Bias                                                                 │
│    timeBias: {                                                                  │
│      recency: "last_30_days" | "last_90_days" | "last_180_days" | null,       │
│      explicit: boolean                  // User said "recent" explicitly       │
│    },                                                                           │
│                                                                                 │
│    // Ambiguity Flags (for trace)                                              │
│    ambiguityFlags: {                                                            │
│      locationAmbiguous: boolean,                                               │
│      signalTypeAmbiguous: boolean,                                             │
│      entityTypeAmbiguous: boolean                                              │
│    }                                                                            │
│  }                                                                              │
│                                                                                 │
│  Post-Processing:                                                               │
│    requestedSignals = intersect(requestedSignals, salesContext.allowedSignals) │
│    IF requestedSignals.length == 0:                                            │
│      requestedSignals = salesContext.allowedSignals  // Use all allowed        │
│                                                                                 │
│  Cost: ~$0.01 (single GPT-4 call with structured output)                       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 2: QUERY FAN-OUT + SYNTHESIS (LLM + Rules, Single Call)                  │
│  ═════════════════════════════════════════════════════════════                  │
│                                                                                 │
│  Input: QueryUnderstanding + SalesContextSnapshot                               │
│                                                                                 │
│  Goal: Generate 6-12 retrieval queries across multiple angles                  │
│                                                                                 │
│  LLM Task: Multi-query rewriting + decomposition                               │
│                                                                                 │
│  System Prompt:                                                                 │
│    "Generate 6-12 search queries for web retrieval.                            │
│     Vary angles: zone+companies, zone+hiring, zone+office, HR headcount, etc.  │
│     Include recency operators where possible.                                   │
│     Queries MUST stay within allowedSignals: {allowedSignals}"                 │
│                                                                                 │
│  Output: QueryFanOut {                                                          │
│    queries: [                                                                   │
│      {                                                                          │
│        text: "ADGM registered companies hiring 2025",                          │
│        angle: "zone_hiring",                                                    │
│        recencyOperator: "after:2024-10-01",                                    │
│        expectedSignal: "hiring"                                                 │
│      },                                                                         │
│      {                                                                          │
│        text: "Abu Dhabi Global Market fintech expansion news",                 │
│        angle: "zone_expansion",                                                 │
│        recencyOperator: null,                                                   │
│        expectedSignal: "expansion"                                              │
│      },                                                                         │
│      {                                                                          │
│        text: "companies opening office ADGM 2025",                             │
│        angle: "zone_office",                                                    │
│        recencyOperator: "after:2024-10-01",                                    │
│        expectedSignal: "office_opening"                                         │
│      },                                                                         │
│      {                                                                          │
│        text: "ADGM financial services license new",                            │
│        angle: "zone_regulatory",                                                │
│        recencyOperator: null,                                                   │
│        expectedSignal: "expansion"                                              │
│      },                                                                         │
│      {                                                                          │
│        text: "Abu Dhabi free zone headcount growth",                           │
│        angle: "hr_headcount",                                                   │
│        recencyOperator: null,                                                   │
│        expectedSignal: "hiring"                                                 │
│      },                                                                         │
│      {                                                                          │
│        text: "ADGM companies funding round Series",                            │
│        angle: "zone_funding",                                                   │
│        recencyOperator: null,                                                   │
│        expectedSignal: "funding"                                                │
│      }                                                                          │
│      // ... up to 12 queries                                                    │
│    ],                                                                           │
│    searchConfig: {                                                              │
│      location: "Abu Dhabi, United Arab Emirates",                              │
│      dateRestrict: "m3",                // Last 3 months                       │
│      domainConstraints: ["-linkedin.com", "-facebook.com"]                     │
│    }                                                                            │
│  }                                                                              │
│                                                                                 │
│  Validation:                                                                    │
│    FOR EACH query:                                                              │
│      IF query.expectedSignal NOT IN allowedSignals: REMOVE query               │
│                                                                                 │
│  Cost: ~$0.02 (single GPT-4 call)                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 3: RETRIEVAL (Hybrid + Rerank)                                           │
│  ════════════════════════════════════                                           │
│                                                                                 │
│  Input: QueryFanOut.queries + searchConfig + budget                            │
│                                                                                 │
│  Strategy: Multi-source retrieval + lightweight rerank                         │
│                                                                                 │
│  Step 3A: Lexical Retrieval (SERP)                                             │
│  ─────────────────────────────────                                              │
│    FOR EACH query (respecting budget.maxSerpCalls):                            │
│      POST https://serpapi.com/search                                           │
│        q: query.text + query.recencyOperator                                   │
│        location: searchConfig.location                                          │
│        tbs: searchConfig.dateRestrict                                           │
│        num: 10                                                                  │
│                                                                                 │
│    Output: serpResults[] = Array<{                                             │
│      title, snippet, url, date, source, queryAngle                             │
│    }>                                                                           │
│                                                                                 │
│  Step 3B: Internal Index Retrieval (Optional - Future)                         │
│  ─────────────────────────────────────────────────────                         │
│    Query internal evidence store (cached previous discoveries):                 │
│      SELECT * FROM evidence_cache                                               │
│      WHERE location ILIKE '%ADGM%'                                             │
│        AND signal_type IN (allowedSignals)                                     │
│        AND created_at > sinceTimestamp                                          │
│                                                                                 │
│    Output: internalResults[]                                                    │
│                                                                                 │
│  Step 3C: Unify + Deduplicate                                                  │
│  ────────────────────────────                                                   │
│    allResults = dedupe(serpResults + internalResults, by: url)                 │
│                                                                                 │
│  Step 3D: Lightweight Rerank (BM25 + Embedding, NOT LLM)                       │
│  ────────────────────────────────────────────────────────                      │
│    score = BM25(result, geoConstraints.zone) * 0.6                             │
│          + cosineSim(embed(result.snippet), embed(queryText)) * 0.4            │
│                                                                                 │
│    rankedResults = sort(allResults, by: score, desc).slice(0, 30)              │
│                                                                                 │
│  Output: RankedResults[] (max 30 for extraction)                               │
│                                                                                 │
│  Cost: $0.005 × 6 queries = $0.03 (SERP only)                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 4: CANDIDATE EXTRACTION (BATCH, Single LLM Call)                         │
│  ══════════════════════════════════════════════════════                         │
│                                                                                 │
│  Input: RankedResults[] (max 30) + SalesContextSnapshot + geoConstraints       │
│                                                                                 │
│  EXPLICITLY FORBIDDEN: $0.024 × N per-result extraction. BATCH ONLY.           │
│                                                                                 │
│  LLM Task: Extract all candidates from batch in single call                    │
│                                                                                 │
│  System Prompt:                                                                 │
│    "Extract company candidates from these search results.                      │
│     User is looking for: {geoConstraints.zone} in {geoConstraints.emirate}     │
│     Allowed signals: {allowedSignals}                                           │
│                                                                                 │
│     For each candidate, provide:                                               │
│     - company_name                                                              │
│     - claimed_location (exact text from source)                                │
│     - location_confidence: VERIFIED (explicit mention) | INFERRED | UNVERIFIED │
│     - signals found (type + evidence text)                                     │
│     - source_index (which result this came from)                               │
│                                                                                 │
│     If location cannot be determined: mark UNVERIFIED.                         │
│     Do NOT fabricate locations."                                               │
│                                                                                 │
│  User Prompt (Batched):                                                         │
│    "Results to analyze:                                                         │
│     [0] Title: {title}\n    Snippet: {snippet}\n    URL: {url}                 │
│     [1] Title: {title}\n    Snippet: {snippet}\n    URL: {url}                 │
│     ...                                                                         │
│     [29] Title: {title}\n    Snippet: {snippet}\n    URL: {url}                │
│                                                                                 │
│     Extract all candidates."                                                    │
│                                                                                 │
│  Output: CandidateExtraction {                                                  │
│    candidates: [                                                                │
│      {                                                                          │
│        companyName: "Fintech Corp",                                            │
│        claimedLocation: {                                                       │
│          raw: "headquartered at ADGM",      // Exact text                      │
│          normalized: "ADGM",                                                    │
│          confidence: "VERIFIED"                                                 │
│        },                                                                       │
│        signals: [                                                               │
│          {                                                                      │
│            type: "hiring",                                                      │
│            evidenceText: "announced 50 new positions",                         │
│            strength: 4                                                          │
│          }                                                                      │
│        ],                                                                       │
│        evidence: {                                                              │
│          sourceIndex: 3,                                                        │
│          url: "https://...",                                                    │
│          snippetHash: "abc123",                                                 │
│          publishedDate: "2025-01-05"                                           │
│        }                                                                        │
│      },                                                                         │
│      // ... more candidates                                                     │
│    ],                                                                           │
│    extractionStats: {                                                           │
│      resultsAnalyzed: 30,                                                       │
│      candidatesFound: 12,                                                       │
│      locationsVerified: 5,                                                      │
│      locationsInferred: 4,                                                      │
│      locationsUnverified: 3                                                     │
│    }                                                                            │
│  }                                                                              │
│                                                                                 │
│  Cost: ~$0.05 (single GPT-4 call for batch of 30)                              │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 5: CONSTRAINT VALIDATION (Two-Stage, Evidence-Grade)                     │
│  ══════════════════════════════════════════════════════════                     │
│                                                                                 │
│  Input: Candidates[] + geoConstraints + SalesContext.killRules + noveltyMode   │
│                                                                                 │
│  RULE: FAIL CLOSED in STRICT mode. Empty > Wrong.                              │
│                                                                                 │
│  Stage A: Snippet-Level Validation (Cheap, All Candidates)                     │
│  ─────────────────────────────────────────────────────────                     │
│    FOR EACH candidate:                                                          │
│                                                                                 │
│      // Kill Rule Check (Hard Filters)                                         │
│      IF matchesKillRule(candidate, salesContext.killRules):                    │
│        → REJECT (reason: "kill_rule", rule: ruleName)                          │
│                                                                                 │
│      // Location Constraint Check                                               │
│      IF geoConstraints.zone exists:                                             │
│        IF candidate.claimedLocation.normalized != geoConstraints.zone:         │
│          → REJECT (reason: "zone_mismatch",                                    │
│                    expected: geoConstraints.zone,                               │
│                    found: candidate.claimedLocation.normalized)                │
│                                                                                 │
│        IF candidate.claimedLocation.confidence == "UNVERIFIED":                │
│          IF noveltyMode == "STRICT":                                            │
│            → REJECT (reason: "location_unverified")                            │
│          ELSE:                                                                  │
│            → MARK as "unverified_bucket" (separate return)                     │
│                                                                                 │
│      // Signal Type Check                                                       │
│      FOR EACH signal IN candidate.signals:                                     │
│        IF signal.type NOT IN salesContext.allowedSignals:                      │
│          → REMOVE signal (not whole candidate)                                 │
│                                                                                 │
│      IF candidate.signals.length == 0:                                         │
│        → REJECT (reason: "no_valid_signals")                                   │
│                                                                                 │
│  Stage B: Selective Page Fetch (Top-N Borderline, Controlled Cost)             │
│  ─────────────────────────────────────────────────────────────────            │
│    borderlineCandidates = candidates WHERE confidence == "INFERRED"            │
│    topBorderline = sort(borderlineCandidates, by: signalStrength).slice(0, 5)  │
│                                                                                 │
│    FOR EACH candidate IN topBorderline:                                        │
│      IF budget.allowPageFetch:                                                  │
│        pageContent = fetchPage(candidate.evidence.url)                         │
│        locationMentions = extractLocationMentions(pageContent, geoConstraints) │
│                                                                                 │
│        IF locationMentions.explicit.includes(geoConstraints.zone):             │
│          candidate.claimedLocation.confidence = "VERIFIED"                     │
│          candidate.claimedLocation.raw = locationMentions.explicit[0]          │
│        ELSE:                                                                    │
│          IF noveltyMode == "STRICT":                                            │
│            → REJECT (reason: "location_not_confirmed_on_page")                 │
│                                                                                 │
│  Output: ValidationResult {                                                     │
│    verified: Candidate[],           // Ready for scoring                       │
│    unverifiedBucket: Candidate[],   // Only if noveltyMode != STRICT           │
│    rejected: Array<{                                                            │
│      candidate: Candidate,                                                      │
│      reason: string,                                                            │
│      details: object                                                            │
│    }>,                                                                          │
│    stats: {                                                                     │
│      total: number,                                                             │
│      verified: number,                                                          │
│      unverified: number,                                                        │
│      rejected: number,                                                          │
│      rejectionBreakdown: {                                                      │
│        kill_rule: number,                                                       │
│        zone_mismatch: number,                                                   │
│        location_unverified: number,                                             │
│        no_valid_signals: number                                                 │
│      }                                                                          │
│    }                                                                            │
│  }                                                                              │
│                                                                                 │
│  Cost: ~$0.01 (page fetches for top 5 borderline only)                         │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 6: NOVELTY + FRESHNESS (OS-Native Memory)                                │
│  ═══════════════════════════════════════════════                                │
│                                                                                 │
│  Input: ValidationResult.verified + user_id + sales_context_hash               │
│                                                                                 │
│  OS-Native Tables (MANDATORY):                                                  │
│  ──────────────────────────────                                                 │
│    CREATE TABLE seen_entities (                                                 │
│      id UUID PRIMARY KEY,                                                       │
│      user_id UUID NOT NULL,                                                     │
│      sales_context_hash VARCHAR(64) NOT NULL,  -- Hash of v/sv/r/persona       │
│      entity_id VARCHAR(255) NOT NULL,          -- Company identifier           │
│      entity_name VARCHAR(255),                                                  │
│      first_seen_at TIMESTAMP NOT NULL,                                          │
│      last_seen_at TIMESTAMP NOT NULL,                                           │
│      seen_count INT DEFAULT 1,                                                  │
│      last_evidence_hash VARCHAR(64),                                            │
│      UNIQUE(user_id, sales_context_hash, entity_id)                            │
│    );                                                                           │
│                                                                                 │
│    CREATE TABLE seen_evidence (                                                 │
│      id UUID PRIMARY KEY,                                                       │
│      entity_id VARCHAR(255) NOT NULL,                                          │
│      evidence_hash VARCHAR(64) NOT NULL,       -- Hash of url+snippet          │
│      source_url TEXT,                                                           │
│      first_seen_at TIMESTAMP NOT NULL,                                          │
│      last_seen_at TIMESTAMP NOT NULL,                                           │
│      UNIQUE(entity_id, evidence_hash)                                          │
│    );                                                                           │
│                                                                                 │
│    CREATE INDEX idx_seen_entities_lookup                                        │
│      ON seen_entities(user_id, sales_context_hash, entity_id);                 │
│    CREATE INDEX idx_seen_evidence_entity                                        │
│      ON seen_evidence(entity_id, first_seen_at);                               │
│                                                                                 │
│  Novelty Check:                                                                 │
│  ──────────────                                                                 │
│    FOR EACH candidate:                                                          │
│      seenRecord = SELECT * FROM seen_entities                                   │
│        WHERE user_id = {user_id}                                               │
│          AND sales_context_hash = {hash}                                       │
│          AND entity_id = {candidate.entityId}                                  │
│                                                                                 │
│      IF seenRecord EXISTS:                                                      │
│        // Check for new evidence                                                │
│        newEvidence = candidate.evidence.hash != seenRecord.last_evidence_hash  │
│        evidenceIsNewer = candidate.evidence.publishedDate > seenRecord.last_seen_at
│                                                                                 │
│        IF newEvidence AND evidenceIsNewer:                                     │
│          → PASS with noveltyStatus: "resurfaced"                               │
│          → resurfaceReason: "new_evidence_{date}"                              │
│          → UPDATE seen_entities SET last_seen_at = NOW(),                      │
│                                     last_evidence_hash = {hash}                │
│          → INSERT INTO seen_evidence (...)                                     │
│        ELSE:                                                                    │
│          → FILTER OUT (reason: "previously_seen_no_new_evidence")              │
│      ELSE:                                                                      │
│        → PASS with noveltyStatus: "new"                                        │
│        → INSERT INTO seen_entities (...)                                       │
│        → INSERT INTO seen_evidence (...)                                       │
│                                                                                 │
│  Freshness Check:                                                               │
│  ────────────────                                                               │
│    IF sinceTimestamp provided:                                                  │
│      FOR EACH candidate:                                                        │
│        IF candidate.evidence.publishedDate < sinceTimestamp:                   │
│          → FILTER OUT (reason: "stale_evidence")                               │
│                                                                                 │
│  Time Decay (Applied in Scoring):                                               │
│  ─────────────────────────────────                                              │
│    decayFactor = exp(-λ * daysSinceEvidence)                                   │
│    WHERE λ = ln(2) / salesContext.scoringWeights.timeDecay.halfLifeDays        │
│                                                                                 │
│  Output: NoveltyResult {                                                        │
│    novel: Candidate[],              // First time seen                         │
│    resurfaced: Array<{              // Seen before, new evidence               │
│      candidate: Candidate,                                                      │
│      resurfaceReason: string                                                    │
│    }>,                                                                          │
│    filtered: Array<{                // Previously seen, no new evidence        │
│      candidate: Candidate,                                                      │
│      reason: "previously_seen_no_new_evidence" | "stale_evidence"              │
│    }>,                                                                          │
│    stats: {                                                                     │
│      novel: number,                                                             │
│      resurfaced: number,                                                        │
│      filteredAsSeen: number,                                                    │
│      filteredAsStale: number                                                    │
│    }                                                                            │
│  }                                                                              │
│                                                                                 │
│  Cost: $0 (DB queries only)                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  LAYER 7: SIVA SCORING (Policy-Bound, Transparent)                              │
│  ═════════════════════════════════════════════════                              │
│                                                                                 │
│  Input: NoveltyResult.novel + NoveltyResult.resurfaced + SalesContextSnapshot  │
│                                                                                 │
│  Scoring Formula (Monotonic, Logged):                                           │
│  ─────────────────────────────────────                                          │
│                                                                                 │
│  SignalScore = Σ (signalWeight[type] × signalStrength × decayFactor)           │
│    WHERE signalWeight from salesContext.scoringWeights.signalWeights           │
│          decayFactor from timeDecay calculation                                 │
│                                                                                 │
│  PriorScore = (lppScore × lppWeight) + (brandScore × brandWeight)              │
│    WHERE lppScore = salesContext.locationPrestigePrior.prestigeScores[zone]    │
│          lppWeight = salesContext.scoringWeights.priorWeights.locationPrestige │
│          brandScore = calculateBrandStrength(candidate)  // 0-1               │
│          brandWeight = salesContext.scoringWeights.priorWeights.brandStrength  │
│                                                                                 │
│  FitScore = calculateICPFit(candidate, salesContext.icpConstraints)            │
│    // Employee count fit, salary band fit, employer type fit                   │
│    // Returns 0-1                                                               │
│                                                                                 │
│  FinalScore = (SignalScore × 0.50) + (FitScore × 0.30) + (PriorScore × 0.20)  │
│    // Weights are configurable in salesContext                                  │
│                                                                                 │
│  Tier Assignment:                                                               │
│    HOT:  FinalScore >= 0.75                                                     │
│    WARM: FinalScore >= 0.50                                                     │
│    COOL: FinalScore < 0.50                                                      │
│                                                                                 │
│  Prior-Based Surfacing (EB Persona Feature):                                   │
│  ───────────────────────────────────────────                                    │
│    IF candidate has NO signals BUT high PriorScore (lppScore >= 0.9):          │
│      → Include with label: "PRIOR_BASED"                                       │
│      → FinalScore = PriorScore × 0.7  // Capped                                │
│      → Explanation: "Premium zone employer - no recent signals"                │
│                                                                                 │
│  Output: ScoredCandidate[] sorted by FinalScore DESC                           │
│                                                                                 │
│  Each candidate includes:                                                       │
│    scores: {                                                                    │
│      signal: number,                                                            │
│      prior: number,                                                             │
│      fit: number,                                                               │
│      final: number,                                                             │
│      tier: "HOT" | "WARM" | "COOL"                                             │
│    },                                                                           │
│    scoreBreakdown: {                                                            │
│      signalContributions: [{ type, weight, value, decayed }],                  │
│      priorContributions: [{ factor, weight, value }],                          │
│      fitContributions: [{ factor, weight, value }]                             │
│    },                                                                           │
│    surfacingType: "SIGNAL_BASED" | "PRIOR_BASED"                               │
│                                                                                 │
│  Cost: $0 (calculation only)                                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  OBSERVABILITY: TRACE (MANDATORY - Every Request)                               │
│  ═══════════════════════════════════════════════                                │
│                                                                                 │
│  FOR EVERY discovery request, emit trace object:                               │
│                                                                                 │
│  DiscoveryTrace {                                                               │
│    // Request Identity                                                          │
│    traceId: UUID,                                                               │
│    requestId: string,                    // Client UUID                        │
│    timestamp: ISO8601,                                                          │
│    durationMs: number,                                                          │
│                                                                                 │
│    // Context                                                                   │
│    salesContextHash: string,                                                    │
│    salesContextSnapshot: SalesContextSnapshot,  // Full snapshot               │
│    personaId: number,                                                           │
│    userId: string,                                                              │
│                                                                                 │
│    // Layer 1: Query Understanding                                              │
│    queryUnderstanding: {                                                        │
│      originalQuery: string,                                                     │
│      parsedIntent: string,                                                      │
│      geoConstraints: object,                                                    │
│      requestedSignals: string[],                                               │
│      ambiguityFlags: object,                                                    │
│      llmLatencyMs: number                                                       │
│    },                                                                           │
│                                                                                 │
│    // Layer 2: Query Fan-Out                                                    │
│    queryFanOut: {                                                               │
│      queriesGenerated: string[],                                               │
│      anglesUsed: string[],                                                      │
│      llmLatencyMs: number                                                       │
│    },                                                                           │
│                                                                                 │
│    // Layer 3: Retrieval                                                        │
│    retrieval: {                                                                 │
│      serpQueriesExecuted: number,                                              │
│      serpResultsTotal: number,                                                  │
│      internalResultsTotal: number,                                             │
│      afterDeduplication: number,                                                │
│      afterRerank: number,                                                       │
│      serpLatencyMs: number                                                      │
│    },                                                                           │
│                                                                                 │
│    // Layer 4: Extraction                                                       │
│    extraction: {                                                                │
│      resultsAnalyzed: number,                                                   │
│      candidatesExtracted: number,                                               │
│      locationsVerified: number,                                                 │
│      locationsInferred: number,                                                 │
│      locationsUnverified: number,                                               │
│      llmLatencyMs: number                                                       │
│    },                                                                           │
│                                                                                 │
│    // Layer 5: Validation                                                       │
│    validation: {                                                                │
│      inputCandidates: number,                                                   │
│      passedValidation: number,                                                  │
│      rejectedTotal: number,                                                     │
│      rejectionReasons: {                                                        │
│        kill_rule: number,                                                       │
│        zone_mismatch: number,                                                   │
│        location_unverified: number,                                             │
│        no_valid_signals: number                                                 │
│      },                                                                         │
│      pageFetchesPerformed: number                                              │
│    },                                                                           │
│                                                                                 │
│    // Layer 6: Novelty                                                          │
│    novelty: {                                                                   │
│      novel: number,                                                             │
│      resurfaced: number,                                                        │
│      filteredAsSeen: number,                                                    │
│      filteredAsStale: number                                                    │
│    },                                                                           │
│                                                                                 │
│    // Layer 7: Scoring                                                          │
│    scoring: {                                                                   │
│      candidatesScored: number,                                                  │
│      tierBreakdown: { HOT: n, WARM: n, COOL: n },                              │
│      priorBasedCount: number                                                    │
│    },                                                                           │
│                                                                                 │
│    // Final Output                                                              │
│    output: {                                                                    │
│      companiesReturned: number,                                                 │
│      topCompanies: Array<{                                                     │
│        name: string,                                                            │
│        score: number,                                                           │
│        tier: string,                                                            │
│        topReasons: string[]  // Top 3 reasons for inclusion                    │
│      }>                                                                         │
│    },                                                                           │
│                                                                                 │
│    // Cost                                                                      │
│    costs: {                                                                     │
│      queryUnderstanding: number,                                               │
│      queryFanOut: number,                                                       │
│      serp: number,                                                              │
│      extraction: number,                                                        │
│      pageFetch: number,                                                         │
│      total: number                                                              │
│    },                                                                           │
│                                                                                 │
│    // Budget                                                                    │
│    budget: {                                                                    │
│      llmCallsUsed: number,                                                      │
│      llmCallsLimit: number,                                                     │
│      serpCallsUsed: number,                                                     │
│      serpCallsLimit: number,                                                    │
│      pageFetchesUsed: number,                                                   │
│      pageFetchesLimit: number,                                                  │
│      budgetExceeded: boolean,                                                   │
│      budgetExceededReason: string | null                                       │
│    }                                                                            │
│  }                                                                              │
│                                                                                 │
│  Storage: POST to /api/os/trace or log to structured logging system           │
│  Retention: 90 days minimum                                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              RESPONSE                                            │
│  {                                                                              │
│    success: true,                                                               │
│    data: {                                                                      │
│      companies: ScoredCandidate[],                                             │
│      unverifiedBucket: Candidate[],    // Only if noveltyMode != STRICT        │
│      queryUnderstanding: { ... },      // Transparency                         │
│      validation: { ... },              // Stats                                │
│      novelty: { ... },                 // Stats                                │
│      message?: string,                 // If empty: explanation                │
│      suggestion?: string               // If empty: next steps                 │
│    },                                                                           │
│    traceId: string,                    // For debugging                        │
│    meta: {                                                                      │
│      requestId: string,                                                         │
│      processingTimeMs: number,                                                  │
│      costs: { ... },                                                            │
│      budgetStatus: { ... }                                                      │
│    }                                                                            │
│  }                                                                              │
│                                                                                 │
│  IF budget exceeded:                                                            │
│  {                                                                              │
│    success: true,                                                               │
│    data: {                                                                      │
│      companies: [...],                 // Partial results                      │
│      budgetLimited: true,                                                       │
│      message: "Budget limited; widen scope or increase freshness window"       │
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

## API Contract

### Request

```typescript
interface DiscoveryRequest {
  // Required
  tenant_id: string;
  request_id: string;                    // Client UUID for idempotency

  // Query
  queryText: string;                     // User's natural language query

  // Sales Context Reference (for Layer 0 resolution)
  salesContextRef: {
    vertical: string;                    // "banking"
    subVertical: string;                 // "employee_banking"
    region: string;                      // "UAE"
    persona_id: number;                  // 1-7
  };

  // Time Controls
  sinceTimestamp?: string;               // ISO 8601 - evidence must be after this

  // Novelty Mode
  noveltyMode: 'STRICT' | 'ALLOW_NEW_EVIDENCE';

  // Budget Guards
  budget: {
    maxLlmCalls: number;                 // Default: 4 (understand + fanout + extract + optional rerank)
    maxSerpCalls: number;                // Default: 6
    maxPageFetches: number;              // Default: 5
  };

  // Options
  options?: {
    maxResults?: number;                 // Default: 10
    includeUnverifiedBucket?: boolean;   // Default: false
    includeTrace?: boolean;              // Default: false (full trace in response)
  };
}
```

### Response

```typescript
interface DiscoveryResponse {
  success: boolean;

  data: {
    // Validated, scored companies
    companies: Array<{
      id: string;
      name: string;
      domain?: string;

      // Location (validated)
      location: {
        raw: string;                     // Exact text from source
        normalized: string;              // ADGM, DIFC, etc.
        confidence: 'VERIFIED' | 'INFERRED';
      };

      // Signals
      signals: Array<{
        type: string;
        strength: number;
        evidenceText: string;
        decayedWeight: number;
      }>;

      // Evidence (mandatory)
      evidence: {
        sourceUrl: string;
        snippet: string;
        snippetHash: string;
        publishedDate?: string;
      };

      // Scores (transparent)
      scores: {
        signal: number;
        prior: number;
        fit: number;
        final: number;
        tier: 'HOT' | 'WARM' | 'COOL';
      };
      scoreBreakdown: {
        signalContributions: Array<{ type: string; weight: number; value: number }>;
        priorContributions: Array<{ factor: string; weight: number; value: number }>;
        fitContributions: Array<{ factor: string; weight: number; value: number }>;
      };

      // Novelty
      noveltyStatus: 'new' | 'resurfaced';
      resurfaceReason?: string;

      // Surfacing type
      surfacingType: 'SIGNAL_BASED' | 'PRIOR_BASED';
    }>;

    // Unverified bucket (if requested)
    unverifiedBucket?: Array<Candidate>;

    // Query understanding (transparency)
    queryUnderstanding: {
      originalQuery: string;
      parsedIntent: string;
      geoConstraints: object;
      requestedSignals: string[];
      synthesizedQueries: string[];
    };

    // Validation stats
    validation: {
      totalExtracted: number;
      passedValidation: number;
      rejectedTotal: number;
      rejectionBreakdown: object;
    };

    // Novelty stats
    novelty: {
      novel: number;
      resurfaced: number;
      filteredAsSeen: number;
      filteredAsStale: number;
    };

    // Empty handling
    message?: string;
    suggestion?: string;

    // Budget status
    budgetLimited?: boolean;
  };

  traceId: string;

  meta: {
    requestId: string;
    processingTimeMs: number;
    costs: {
      queryUnderstanding: number;
      queryFanOut: number;
      serp: number;
      extraction: number;
      pageFetch: number;
      total: number;
    };
    budgetStatus: {
      llmCallsUsed: number;
      llmCallsLimit: number;
      serpCallsUsed: number;
      serpCallsLimit: number;
      exceeded: boolean;
    };
  };
}
```

---

## Acceptance Tests

### Test Suite: EB Persona (UAE)

```yaml
test_eb_masdar_city:
  name: "Masdar City companies - EB Persona"
  request:
    queryText: "Find companies hiring in Masdar City"
    salesContextRef:
      vertical: banking
      subVertical: employee_banking
      region: UAE
      persona_id: 1  # EB
    noveltyMode: STRICT

  assertions:
    - IF companies.length > 0:
        THEN ALL companies MUST have location.normalized == "Masdar City"
        AND ALL companies MUST have location.confidence IN ["VERIFIED", "INFERRED"]
    - IF companies.length == 0:
        THEN data.message MUST contain "Masdar City"
        AND data.suggestion MUST exist
    - NEVER return companies with location != "Masdar City"
    - validation.rejectionBreakdown.zone_mismatch MUST be logged

test_eb_adgm:
  name: "ADGM companies - EB Persona"
  request:
    queryText: "Find good companies in ADGM Abu Dhabi"
    salesContextRef:
      vertical: banking
      subVertical: employee_banking
      region: UAE
      persona_id: 1
    noveltyMode: STRICT

  assertions:
    - IF companies.length > 0:
        THEN ALL companies MUST have evidence.snippet containing "ADGM" OR "Abu Dhabi Global Market"
    - IF companies.length == 0:
        THEN data.message == "No companies found in ADGM matching your criteria."
    - NEVER return generic Abu Dhabi companies without ADGM evidence

test_eb_novelty_no_repeats:
  name: "Same query tomorrow - no repeats"
  setup:
    # Day 1: Run query, get companies A, B, C
    # Record in seen_entities table
  request:
    queryText: "Find companies in ADGM"
    # ... same params as day 1
    noveltyMode: STRICT

  assertions:
    - Companies A, B, C MUST NOT appear unless they have new evidence
    - novelty.filteredAsSeen >= 3
    - IF A resurfaces:
        THEN A.noveltyStatus == "resurfaced"
        AND A.resurfaceReason contains "new_evidence"
        AND A.evidence.publishedDate > last_seen_at

test_eb_premium_zone_prior:
  name: "Premium employers - prior-based surfacing"
  request:
    queryText: "Find premium employers in Abu Dhabi"
    salesContextRef:
      vertical: banking
      subVertical: employee_banking
      region: UAE
      persona_id: 1
    noveltyMode: ALLOW_NEW_EVIDENCE

  assertions:
    - Companies with high LPP score (ADGM, DIFC) MAY surface even without signals
    - IF prior-based:
        THEN company.surfacingType == "PRIOR_BASED"
        AND company.scores.signal == 0
        AND company.scores.prior >= 0.9
```

### Test Suite: Working Capital Persona

```yaml
test_wc_adgm:
  name: "ADGM companies - Working Capital Persona"
  request:
    queryText: "Find companies in ADGM"
    salesContextRef:
      vertical: banking
      subVertical: working_capital
      region: UAE
      persona_id: 3  # Working Capital
    noveltyMode: STRICT

  assertions:
    - Same location validation as EB
    - DIFFERENT allowedSignals (per WC persona policy)
    - DIFFERENT scoringWeights (per WC persona policy)
    - Companies MUST still pass zone validation

test_wc_novelty:
  name: "Same query tomorrow - Working Capital"
  # Same as EB novelty test
  # Verifies novelty is per sales_context_hash (includes persona)
```

---

## Cost Discipline

### Budget Guard (Per Request)

```typescript
interface Budget {
  maxLlmCalls: number;      // Default: 4
  maxSerpCalls: number;     // Default: 6
  maxPageFetches: number;   // Default: 5
}
```

### Cost Breakdown (Target)

| Layer | Operation | Calls | Cost |
|-------|-----------|-------|------|
| Layer 1 | Query Understanding | 1 | $0.01 |
| Layer 2 | Query Fan-Out | 1 | $0.02 |
| Layer 3 | SERP | 6 | $0.03 |
| Layer 4 | Batch Extraction | 1 | $0.05 |
| Layer 5 | Page Fetch | 5 | $0.01 |
| **Total** | | | **$0.12** |

**Previous cost:** $0.41 (per-result extraction)
**New cost:** $0.12
**Savings:** 70%

### Budget Exceeded Behavior

```typescript
IF budget.llmCallsUsed >= budget.maxLlmCalls:
  → Stop LLM calls
  → Return partial results
  → Set response.data.budgetLimited = true
  → Set response.data.message = "Budget limited; widen scope or increase freshness window"
```

---

## Rollout Plan

### S383: Layer 0 + Layer 1 + Layer 2

**Goal:** Policy-bound query understanding and fan-out

**Deliverables:**
1. `SalesContextResolver` - Resolves policy from Control Plane
2. `QueryUnderstandingService` - LLM-based intent extraction
3. `QueryFanOutService` - LLM-based multi-query synthesis
4. Schema validation for SalesContextSnapshot

**Tables:**
- Read from: `os_personas`, `os_verticals`, `os_compliance`

**Tests:**
- SalesContext resolves correctly for EB and WC personas
- Query understanding extracts ADGM from "ADGM Abu Dhabi"
- Fan-out generates 6-12 queries within allowedSignals

### S384: Retrieval + Rerank + Batch Extraction

**Goal:** Hybrid retrieval with batch extraction

**Deliverables:**
1. `HybridRetriever` - SERP + internal index
2. `LightweightReranker` - BM25 + embedding (no LLM)
3. `BatchExtractor` - Single LLM call for all results

**Tables:**
- Create: `evidence_cache` (for internal retrieval)

**Tests:**
- Extraction uses single LLM call for batch
- Cost per extraction < $0.06
- Reranking prioritizes zone-matching results

### S385: Validation + Novelty Memory

**Goal:** Evidence-grade validation + OS-native novelty

**Deliverables:**
1. `ConstraintValidator` - Two-stage validation
2. `NoveltyService` - OS-native memory
3. Novelty tables

**Tables:**
- Create: `seen_entities`, `seen_evidence`

**Tests:**
- STRICT mode rejects UNVERIFIED
- Same query next day returns different results
- Resurfaced companies have new evidence

### S386: Tracing + Evaluation Harness + Smart Caching

**Goal:** Full observability + caching that respects novelty

**Deliverables:**
1. `TraceService` - Emit trace for every request
2. `EvaluationHarness` - Run acceptance tests
3. `SmartCache` - Novelty-aware caching

**Tables:**
- Create: `discovery_traces`

**Tests:**
- Trace contains all layer stats
- Cache hit doesn't violate novelty
- Evaluation harness passes all acceptance tests

---

## Non-Negotiables

1. **NO LLM decides policy** - SalesContext from Control Plane only
2. **FAIL CLOSED in STRICT mode** - Empty > Wrong
3. **Novelty is OS-native** - Not SaaS responsibility
4. **Batch extraction only** - No per-result LLM calls
5. **Full trace mandatory** - Every request logged
6. **Budget guard enforced** - Partial results over budget exceeded
7. **Evidence required** - No fabricated sources

---

## Approval

- [x] Architecture reviewed
- [x] Policy-bound design confirmed
- [x] Novelty as OS-native approved
- [x] Batch extraction mandated
- [x] Cost discipline enforced
- [x] Trace mandatory confirmed

**Approved by:** Founder
**Date:** 2025-01-08
