# SIVA API Contract

**Purpose**: Define the integration contract between PremiumRadar SaaS and UPR OS SIVA
**Created**: December 4, 2025
**Status**: Phase 1 - Integration Ready

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     PremiumRadar SaaS                           │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │ Pageless UX │  │ Discovery   │  │ Enrichment Engine    │   │
│  │ (SIVA Chat) │  │ (SERP+LLM)  │  │ (Apollo)             │   │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬───────────┘   │
│         │                │                     │               │
│         └────────────────┼─────────────────────┘               │
│                          │                                      │
│                    ┌─────▼─────┐                               │
│                    │ SIVA      │                               │
│                    │ Client    │ ◄── lib/integrations/siva-client.ts
│                    └─────┬─────┘                               │
└──────────────────────────┼──────────────────────────────────────┘
                           │ HTTP
┌──────────────────────────▼──────────────────────────────────────┐
│                        UPR OS                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    SIVA Brain                            │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │ Foundation Layer (STRICT - deterministic)          │  │   │
│  │  │ • CompanyQualityTool    • ContactTierTool         │  │   │
│  │  │ • TimingScoreTool       • EdgeCasesTool           │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │ Strict Layer (STRICT - deterministic)              │  │   │
│  │  │ • BankingProductMatchTool  • OutreachChannelTool  │  │   │
│  │  │ • OpeningContextTool       • CompositeScoreTool   │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │ Delegated Layer (LLM-enhanced)                     │  │   │
│  │  │ • OutreachMessageGenerator • FollowUpStrategy     │  │   │
│  │  │ • ObjectionHandler         • RelationshipTracker  │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Decision Logging: 900+ decisions tracked                │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### 1. Agent Core API (Individual Tool Execution)

**Base URL**: `{UPR_OS_URL}/api/agent-core/v1`

#### Tool Execution Endpoints

| Tool | Endpoint | Primitive | Layer |
|------|----------|-----------|-------|
| CompanyQualityTool | `POST /tools/evaluate_company_quality` | EVALUATE_COMPANY_QUALITY | Foundation |
| ContactTierTool | `POST /tools/select_contact_tier` | SELECT_CONTACT_TIER | Foundation |
| TimingScoreTool | `POST /tools/calculate_timing_score` | CALCULATE_TIMING_SCORE | Foundation |
| EdgeCasesTool | `POST /tools/check_edge_cases` | CHECK_EDGE_CASES | Foundation |
| BankingProductMatchTool | `POST /tools/match_banking_products` | MATCH_BANKING_PRODUCTS | Strict |
| OutreachChannelTool | `POST /tools/select_outreach_channel` | SELECT_OUTREACH_CHANNEL | Strict |
| OpeningContextTool | `POST /tools/generate_opening_context` | GENERATE_OPENING_CONTEXT | Strict |
| CompositeScoreTool | `POST /tools/generate_composite_score` | GENERATE_COMPOSITE_SCORE | Strict |
| OutreachMessageGeneratorTool | `POST /tools/generate_outreach_message` | GENERATE_OUTREACH_MESSAGE | Delegated |
| FollowUpStrategyTool | `POST /tools/determine_followup_strategy` | DETERMINE_FOLLOWUP_STRATEGY | Delegated |
| ObjectionHandlerTool | `POST /tools/handle_objection` | HANDLE_OBJECTION | Delegated |
| RelationshipTrackerTool | `POST /tools/track_relationship_health` | TRACK_RELATIONSHIP_HEALTH | Delegated |

---

### 2. OS Score API (Unified Scoring)

**Endpoint**: `POST /api/os/score`

#### Request

```typescript
interface ScoreRequest {
  entity_type: 'company';
  entity_id?: string;          // UUID - fetch from DB
  entity_data?: {              // OR provide directly
    name: string;
    domain?: string;
    industry?: string;
    size_range?: string;
    linkedin_url?: string;
  };
  signals?: Signal[];
  score_types: ('q_score' | 't_score' | 'l_score' | 'e_score' | 'composite')[];
  options?: {
    include_breakdown: boolean;
    include_explanation: boolean;
    profile: 'banking_employee' | 'banking_corporate' | 'default';
  };
}
```

#### Response

```typescript
interface ScoreResponse {
  success: boolean;
  data: {
    entity_id: string;
    entity_type: 'company';
    scores: {
      q_score?: { value: number; rating: string; breakdown?: object };
      t_score?: { value: number; category: string; breakdown?: object };
      l_score?: { value: number; tier: string; breakdown?: object };
      e_score?: { value: number; strength: string; breakdown?: object };
      composite?: { value: number; tier: string; grade: string };
    };
    explanations?: Record<string, string>;
    scoring_profile: string;
  };
  reason: string;
  confidence: number;
  profile: string;
  executionTimeMs: number;
  requestId: string;
}
```

---

### 3. OS Rank API (Entity Ranking)

**Endpoint**: `POST /api/os/rank`

#### Request

```typescript
interface RankRequest {
  entities: Array<{
    id: string;
    scores?: {
      q_score: number;
      t_score: number;
      l_score: number;
      e_score: number;
    };
  }>;
  options?: {
    profile: 'banking_employee' | 'banking_corporate' | 'default';
    weights?: {
      q_score: number;
      t_score: number;
      l_score: number;
      e_score: number;
    };
    limit: number;
    explain: boolean;
  };
}
```

#### Response

```typescript
interface RankResponse {
  success: boolean;
  data: {
    ranked_entities: Array<{
      rank: number;
      entity_id: string;
      rank_score: number;
      scores: object;
      explanation?: {
        why_this_rank: string[];
        comparison_to_next?: string;
        why_not_first?: string;
      };
    }>;
    total_ranked: number;
    ranking_config: {
      profile: string;
      weights: object;
    };
  };
  confidence: number;
  executionTimeMs: number;
}
```

---

## Tool Input/Output Contracts

### Tool 1: CompanyQualityTool

**SLA**: ≤300ms P50, ≤900ms P95

#### Input

```typescript
interface CompanyQualityInput {
  company_name: string;
  domain?: string;
  industry?: string;
  size?: number;
  size_bucket?: 'startup' | 'scaleup' | 'enterprise';
  uae_signals?: {
    has_ae_domain: boolean;
    has_uae_address: boolean;
    linkedin_location?: string;
  };
  salary_indicators?: {
    salary_level: 'low' | 'medium' | 'high';
    avg_salary?: number;
  };
  license_type?: 'Free Zone' | 'Mainland' | 'unknown';
}
```

#### Output

```typescript
interface CompanyQualityOutput {
  quality_score: number;           // 0-100
  reasoning: Array<{
    factor: string;
    points: number;
    explanation: string;
  }>;
  confidence: number;              // 0.0-1.0
  policy_version: string;
  edge_cases_applied: string[];
  timestamp: string;
}
```

**Edge Cases**:
- Enterprise Brand Exclusion (Emirates, ADNOC, Emaar, etc.) → score × 0.1
- Government Sector Exclusion → score × 0.05
- Free Zone Bonus → score × 1.3

---

### Tool 2: ContactTierTool

**SLA**: ≤200ms P50, ≤600ms P95

#### Input

```typescript
interface ContactTierInput {
  title: string;
  company_size?: number;
  department?: string;
  hiring_velocity_monthly?: number;
}
```

#### Output

```typescript
interface ContactTierOutput {
  tier: 'STRATEGIC' | 'PRIMARY' | 'SECONDARY' | 'BACKUP';
  priority: 1 | 2 | 3 | 4;
  confidence: number;
  reasoning: string;
  target_titles: string[];
  fallback_titles: string[];
  metadata: {
    score_breakdown: {
      seniority_score: number;
      department_score: number;
      company_size_score: number;
    };
    inferred_seniority: string;
    inferred_department: string;
  };
}
```

---

### Tool 3: TimingScoreTool

**SLA**: ≤120ms P50, ≤300ms P95

#### Input

```typescript
interface TimingScoreInput {
  current_date?: string;           // ISO date
  signal_type?: 'hiring' | 'funding' | 'expansion' | 'award';
  signal_age?: number;             // days
  fiscal_context?: {
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  };
}
```

#### Output

```typescript
interface TimingScoreOutput {
  timing_multiplier: number;       // 0.0-2.0
  category: 'OPTIMAL' | 'GOOD' | 'FAIR' | 'POOR';
  confidence: number;
  reasoning: string;
  metadata: {
    calendar_multiplier: number;
    signal_recency_multiplier: number;
    signal_type_modifier: number;
    calendar_context: string;      // e.g., 'Q1_BUDGET_SEASON', 'RAMADAN'
    signal_freshness: string;      // 'HOT', 'WARM', 'RECENT', etc.
    next_optimal_window?: string;
  };
}
```

**UAE Calendar Integration**:
- Q1 Budget Season (Jan-Feb): ×1.3
- Ramadan: ×0.3 (pause outreach)
- Summer Slowdown (Jul-Aug): ×0.7
- Q4 Budget Freeze (Dec): ×0.6

---

### Tool 4: EdgeCasesTool

**SLA**: ≤50ms P50, ≤150ms P95

#### Input

```typescript
interface EdgeCasesInput {
  company_profile: {
    name: string;
    sector: 'private' | 'government' | 'semi-government';
    size?: number;
    year_founded?: number;
    is_sanctioned?: boolean;
    is_bankrupt?: boolean;
    has_legal_issues?: boolean;
  };
  contact_profile?: {
    email?: string;
    is_verified?: boolean;
    has_bounced?: boolean;
    has_opted_out?: boolean;
  };
  historical_data?: {
    previous_attempts?: number;
    previous_responses?: number;
    last_contact_date?: string;
    has_active_negotiation?: boolean;
  };
}
```

#### Output

```typescript
interface EdgeCasesOutput {
  decision: 'BLOCK' | 'WARN' | 'PROCEED';
  confidence: number;
  blockers: Array<{
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    message: string;
    can_override: boolean;
  }>;
  warnings: Array<{
    type: string;
    severity: 'MEDIUM' | 'LOW';
    message: string;
    can_override: boolean;
  }>;
  reasoning: string;
  metadata: {
    blockers_count: number;
    warnings_count: number;
    critical_issues: string[];
    overridable: boolean;
  };
}
```

---

### Tool 8: CompositeScoreTool

**SLA**: ≤50ms P50, ≤100ms P95

#### Input

```typescript
interface CompositeScoreInput {
  company_quality: {
    quality_score: number;
    confidence: number;
    edge_cases_applied: string[];
  };
  contact_tier: {
    tier: string;
    priority: number;
    confidence: number;
  };
  timing_score: {
    timing_multiplier: number;
    category: string;
    confidence: number;
  };
  edge_cases?: {
    decision: string;
    blockers: any[];
    warnings: any[];
  };
  signals?: Array<{
    type: string;
    confidence: number;
    age_days: number;
  }>;
}
```

#### Output

```typescript
interface CompositeScoreOutput {
  q_score: number;                 // 0-100
  tier: 'HOT' | 'WARM' | 'COLD' | 'DISQUALIFIED';
  confidence: number;
  breakdown: {
    company_contribution: number;
    contact_contribution: number;
    timing_contribution: number;
    signal_contribution: number;
    edge_case_penalty: number;
  };
  recommended_action: 'PRIORITIZE' | 'QUEUE' | 'NURTURE' | 'SKIP';
  reasoning: string;
}
```

---

## Profile-Based Weights

### Banking Employee (Default for SaaS)

```typescript
const BANKING_EMPLOYEE_WEIGHTS = {
  q_score: 0.25,    // Company quality
  t_score: 0.35,    // Timing (most important for EB)
  l_score: 0.20,    // Lead score
  e_score: 0.20     // Evidence score
};
```

**Rationale**: Timing is critical for Employee Banking - hiring signals decay fast.

### Banking Corporate

```typescript
const BANKING_CORPORATE_WEIGHTS = {
  q_score: 0.35,    // Company quality (most important)
  t_score: 0.20,    // Timing
  l_score: 0.25,    // Lead score
  e_score: 0.20     // Evidence
};
```

---

## Integration Pattern for SaaS

### 1. Discovery Flow

```
SaaS                                    UPR OS SIVA
 │                                           │
 │  1. SERP discovers companies              │
 │  2. LLM extracts names/signals            │
 │  3. Apollo enriches headcount             │
 │                                           │
 │  4. POST /api/os/score ────────────────► │
 │     { entity_data, signals, profile }     │
 │                                           │
 │  ◄────────────────────────────────────── │
 │     { q_score, t_score, composite }       │
 │                                           │
 │  5. POST /api/os/rank ─────────────────► │
 │     { entities[], profile }               │
 │                                           │
 │  ◄────────────────────────────────────── │
 │     { ranked_entities[], explanations }   │
 │                                           │
 │  6. Render in Pageless UX                 │
```

### 2. Chat Intent Handler (Example)

```typescript
// User: "Top 5 employers to target this week"

async function handleTopEmployersIntent(context: SalesContext) {
  // 1. Get enriched companies from SaaS enrichment engine
  const companies = await enrichmentEngine.getEnrichedCompanies({
    region: context.region,
    limit: 20
  });

  // 2. Call SIVA for scoring
  const scores = await Promise.all(
    companies.map(company =>
      sivaClient.score({
        entity_data: company,
        signals: company.signals,
        score_types: ['composite'],
        options: {
          profile: 'banking_employee',
          include_explanation: true
        }
      })
    )
  );

  // 3. Call SIVA for ranking
  const ranked = await sivaClient.rank({
    entities: scores.map(s => ({
      id: s.entity_id,
      scores: s.scores
    })),
    options: {
      profile: 'banking_employee',
      limit: 5,
      explain: true
    }
  });

  // 4. Return SIVA's decisions (NOT improvised)
  return {
    employers: ranked.ranked_entities,
    reasoning: ranked.ranked_entities.map(e => e.explanation)
  };
}
```

---

## SaaS Rules

### MUST DO

1. ✅ Always send `profile: 'banking_employee'` for EB context
2. ✅ Always include `signals[]` for accurate timing scores
3. ✅ Always pass `entity_data` with headcount if available
4. ✅ Render SIVA's `reasoning` in UI for explainability
5. ✅ Log SIVA request/response for debugging

### MUST NOT

1. ❌ Build scoring logic in SaaS
2. ❌ Use generic LLM prompts for ranking
3. ❌ Invent timing/calendar rules
4. ❌ Skip edge case checks
5. ❌ Override SIVA decisions without logging

---

## Health Checks

### Agent Core Health

```
GET /api/agent-core/v1/health

Response:
{
  "status": "ok",
  "tools": {
    "foundation": { "companyQuality": "operational", ... },
    "strict": { "bankingProductMatch": "operational", ... },
    "delegated": { "outreachMessage": "operational", ... }
  },
  "totalTools": 12,
  "operationalTools": 12
}
```

### OS Score Health

```
GET /api/os/score/health

Response:
{
  "success": true,
  "service": "os-score",
  "status": "healthy"
}
```

---

## Error Handling

### Error Response Format

```typescript
interface SIVAError {
  success: false;
  tool?: string;
  error: string;
  code?: string;
  metadata: {
    executionTimeMs: number;
    timestamp: string;
    requestId: string;
  };
}
```

### Error Codes

| Code | Meaning | SaaS Action |
|------|---------|-------------|
| `OS_SCORE_NOT_FOUND` | Entity not in DB | Use `entity_data` instead |
| `OS_SCORE_INVALID_INPUT` | Missing required fields | Validate before calling |
| `OS_RANK_INVALID_INPUT` | No entities provided | Check entity list |
| `TOOL_RATE_LIMITED` | 100 req/min exceeded | Implement backoff |
| `TOOL_TIMEOUT` | SLA exceeded | Retry or use fallback |

---

## UPR OS Base URL

```
Production: https://upr-os.sivakumar.ai
Staging: https://upr-os-staging.sivakumar.ai (if available)
```

**Note**: Actual URL to be confirmed. SaaS should use environment variable `UPR_OS_URL`.
