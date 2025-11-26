# PremiumRadar-SAAS - TC Context File

## CRITICAL PRODUCT MODEL (READ FIRST)

**PremiumRadar is NOT an industry-intelligence engine.**
**PremiumRadar IS a sales enablement platform for different types of salespeople.**

All intelligence MUST obey: **Vertical → Sub-Vertical → Region** logic.

---

## The Correct Hierarchy

### 1. VERTICAL = Salesperson's Sector
The sector in which the SALESPERSON works.

| Vertical | Radar Target | What They Sell To |
|----------|--------------|-------------------|
| Banking | **COMPANIES** | Businesses needing banking products |
| Insurance | **INDIVIDUALS** | People needing insurance products |
| Real Estate | **BUYERS/FAMILIES** | People buying/renting property |
| Recruitment | **CANDIDATES** | Job seekers and hiring companies |
| SaaS Sales | **COMPANIES** | Businesses needing software |

### 2. SUB-VERTICAL = Salesperson's Role
The specific function or product area the salesperson covers.

**Banking Sub-Verticals:**
| Sub-Vertical | Description |
|--------------|-------------|
| Employee Banking | Payroll, salary accounts, employee benefits |
| Corporate Banking | Treasury, trade finance, corporate loans |
| SME Banking | Small business accounts, working capital |
| Retail Banking | Personal accounts, mortgages, cards |
| Wealth Management | Private banking, investments |

**Insurance Sub-Verticals:**
| Sub-Vertical | Description |
|--------------|-------------|
| Life Insurance | Individual life policies |
| Group Insurance | Corporate employee benefits |
| Health Insurance | Medical coverage |

**Real Estate Sub-Verticals:**
| Sub-Vertical | Description |
|--------------|-------------|
| Residential Sales | Home sales to families |
| Commercial Leasing | Office/retail space |
| Property Management | Rental management |

### 3. REGION = Salesperson's Operating Territory
| Level | Examples |
|-------|----------|
| Country | UAE, India, US |
| City | Dubai, Chennai, Bangalore |
| Territory | Dubai South, DIFC, Whitefield |

---

## CRITICAL: Different Verticals Have Different Signals

### ⚠️ HIRING SIGNALS ARE ONLY FOR BANKING

| Vertical | Relevant Signals | NOT Relevant |
|----------|------------------|--------------|
| **Banking** | Hiring, expansion, office opening, funding, project awards | Life events, rental expiry |
| **Insurance** | Life events, salary changes, job changes, family events | Hiring signals, office openings |
| **Real Estate** | Rental expiry, relocation, family growth, job relocation | Hiring signals, funding rounds |
| **Recruitment** | Hiring signals (different context), job postings | Life events, rental expiry |

### Signal Types Per Vertical

**Banking (targets COMPANIES):**
- `hiring-expansion` ✅ Company hiring = needs payroll accounts
- `office-opening` ✅ New office = new corporate accounts
- `market-entry` ✅ Entering region = needs local bank
- `funding-round` ✅ Capital raised = banking relationship
- `project-award` ✅ New project = cash flow needs

**Insurance (targets INDIVIDUALS):**
- `life-event` ✅ Marriage, birth, retirement
- `salary-change` ✅ Promotion = can afford better coverage
- `job-change` ✅ New job = needs new benefits
- `hiring-expansion` ❌ NOT RELEVANT

**Real Estate (targets BUYERS/FAMILIES):**
- `rental-expiry` ✅ Lease ending = buying opportunity
- `relocation` ✅ Job relocation = needs housing
- `family-growth` ✅ New baby = needs bigger home
- `hiring-expansion` ❌ NOT RELEVANT

---

## PLUG-AND-PLAY ARCHITECTURE (CRITICAL)

### Rule: Vertical-specific logic MUST NOT be hardcoded

```
┌─────────────────────────────────────────────────────────┐
│                    SaaS Frontend                         │
│  ONLY selects: vertical | sub-vertical | region         │
│  NO signal logic, NO reasoning rules, NO playbooks      │
└─────────────────────────────────────────────────────────┘
                          ↓ sends selection
┌─────────────────────────────────────────────────────────┐
│                       UPR OS                             │
│  PURE ENGINES ONLY (no business rules)                  │
│  FETCHES config from SaaS via API                       │
│  APPLIES config to SIVA wrappers                        │
└─────────────────────────────────────────────────────────┘
                          ↓ calls API
┌─────────────────────────────────────────────────────────┐
│              PremiumRadar SaaS (this repo)              │
│  STORES: all vertical configs in PostgreSQL             │
│  EXPOSES: /api/admin/vertical-config                    │
│  MANAGES: Super-Admin Panel for vertical editing        │
└─────────────────────────────────────────────────────────┘
                          ↓ returns config
┌─────────────────────────────────────────────────────────┐
│                  SIVA Intelligence Layer                 │
│  Intent → Evidence → Routing → Objects → Persona        │
│  (uses config to decide signals, scoring, etc.)         │
└─────────────────────────────────────────────────────────┘
```

### Architectural Responsibility

| Component | Responsibility | Contains Vertical Logic? |
|-----------|----------------|--------------------------|
| **SaaS Frontend** | Select vertical/sub-vertical/region, display results | ❌ NO |
| **SaaS Admin Panel** | CRUD for vertical configs, seeded examples | ✅ YES (stores) |
| **SaaS PostgreSQL** | Single source of truth for configs | ✅ YES (data) |
| **UPR OS** | Pure engines, fetches config via API | ❌ NO |
| **SIVA Wrappers** | Apply config to intelligence operations | ❌ NO (reads config) |

### Runtime Flow

```
1. Frontend → sends vertical/subVertical/region
2. OS → calls GET /api/admin/vertical-config?vertical=X&subVertical=Y&region=Z
3. SaaS → returns config from PostgreSQL (with 5-min cache)
4. OS → applies config inside SIVA wrappers
5. SIVA → generates intelligence using config rules
```

---

## Vertical Config API

**Endpoint:** `/api/admin/vertical-config`

```typescript
// GET - Fetch specific config
GET /api/admin/vertical-config?vertical=banking&subVertical=employee-banking&region=UAE

// Response when found
{
  "success": true,
  "data": {
    "id": "uuid",
    "vertical": "banking",
    "subVertical": "employee-banking",
    "regionCountry": "UAE",
    "radarTarget": "companies",
    "config": {
      "allowedSignalTypes": ["hiring-expansion", "headcount-jump", ...],
      "signalConfigs": [...],
      "scoringWeights": { "quality": 0.3, ... },
      "enrichmentSources": [...],
      "outreachChannels": [...],
      "journeyStages": [...]
    }
  }
}

// Response when NOT configured
{
  "success": false,
  "error": "VERTICAL_NOT_CONFIGURED",
  "message": "Coming Soon — We're expanding to your industry! Request early access."
}
```

---

## Current Implementation Status

### ✅ Fully Implemented
- Vertical config service with PostgreSQL storage
- API endpoint `/api/admin/vertical-config`
- Banking/Employee Banking/UAE seed script
- Config caching (5-min TTL)
- Zod validation for configs

### ✅ Seeded (Ready to Use)
- Banking vertical
- Employee Banking sub-vertical
- UAE region
- All hiring/expansion signals
- Scoring weights and factors
- Regional weights (UAE, KSA, Qatar, etc.)
- Enrichment sources (Apollo, LinkedIn, Crunchbase)
- Outreach channels
- Journey stages

### 🚧 To Build
- Super-Admin UI for vertical management
- Non-banking vertical seeds

### Seeding Banking Vertical

```bash
# Run the seed script
npx ts-node scripts/seeds/banking-employee-uae.ts
```

---

## DO NOT DO

1. ❌ Hardcode signal logic for verticals in SaaS
2. ❌ Apply hiring signals to Insurance/Real Estate
3. ❌ Create vertical-specific conditionals in SIVA
4. ❌ Assume same signals work for all verticals
5. ❌ Build industry-analysis features

## DO

1. ✅ Let OS decide which signals apply
2. ✅ Load vertical rules from OS config
3. ✅ Filter by salesperson's context (vertical/sub-vertical/region)
4. ✅ Keep SaaS plug-and-play ready
5. ✅ Ensure only Banking has hiring signals (for now)

---

## Summary

> **PremiumRadar helps salespeople find opportunities based on their ROLE (vertical/sub-vertical) and TERRITORY (region). Different verticals target different entities (companies vs individuals) with different signals. All rules come from OS configuration, NOT hardcoded in SaaS.**

| Vertical | Targets | Key Signals |
|----------|---------|-------------|
| Banking | Companies | Hiring, expansion, funding |
| Insurance | Individuals | Life events, salary changes |
| Real Estate | Buyers/Families | Rental expiry, relocation |
| Recruitment | Candidates | Job postings, hiring |

**Hiring signals are ONLY for Banking.**
**OS decides all vertical rules.**
**SaaS is plug-and-play.**
