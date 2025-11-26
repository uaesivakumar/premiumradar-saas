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
│  DECIDES: which signals | how reasoning | how routing   │
│  OWNS: vertical definitions, sub-verticals, rules       │
│  STORES: all configuration                              │
└─────────────────────────────────────────────────────────┘
                          ↓ returns rules
┌─────────────────────────────────────────────────────────┐
│                  Sales Context Layer                     │
│  LOADS rules from OS | APPLIES to SIVA wrappers         │
└─────────────────────────────────────────────────────────┘
                          ↓ filters
┌─────────────────────────────────────────────────────────┐
│                  SIVA Intelligence Layer                 │
│  Intent → Evidence → Routing → Objects → Persona        │
└─────────────────────────────────────────────────────────┘
```

### Architectural Responsibility

| Component | Responsibility |
|-----------|----------------|
| **SaaS Frontend** | ONLY select vertical/sub-vertical/region |
| **UPR OS** | DECIDES all rules (signals, reasoning, routing) |
| **Sales Context Layer** | LOADS rules from OS, applies to SIVA |
| **SIVA Wrappers** | READ rules before generating intelligence |

### What This Means for TC

1. **NO hardcoded signal logic** in SaaS frontend
2. **NO vertical-specific conditionals** in SIVA wrappers
3. **ALL rules come from OS** via Sales Context Layer
4. **OS config determines** which signals apply to which vertical
5. **SaaS is plug-and-play** - add new verticals via OS config, not code

---

## OS Configuration Interface

The SalesContextProvider should fetch configuration from OS:

```typescript
// This is what OS returns for a vertical
interface VerticalConfig {
  vertical: string;
  subVerticals: SubVerticalConfig[];
  radarTarget: 'companies' | 'individuals' | 'families' | 'candidates';
  allowedSignalTypes: string[];
  playbooks: PlaybookConfig[];
  scoringFactors: ScoringConfig;
}

// SaaS calls OS to get config
const config = await osClient.getVerticalConfig(vertical, subVertical, region);

// Sales Context applies this config
salesContext.applyConfig(config);
```

---

## Current Implementation Status

### ✅ Implemented (Banking Only)
- Banking vertical with sub-verticals
- UAE region support
- Hiring/expansion signals for banking

### 🚧 Placeholder (No Backend Logic)
- Insurance vertical (UI only)
- Real Estate vertical (UI only)
- Other regions

### ❌ NOT Implemented
- OS-level vertical config API
- Dynamic signal loading from OS
- Non-banking signal types

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
