# PremiumRadar-SAAS - TC Context File

## CRITICAL PRODUCT MODEL (READ FIRST)

**PremiumRadar is NOT an industry-analysis platform.**
**PremiumRadar IS a sales enablement platform for frontline salespeople.**

All intelligence MUST obey: **Vertical → Sub-Vertical → Region** logic.

---

## The Correct Hierarchy

### 1. VERTICAL = Salesperson's Industry
The industry in which the SALESPERSON works (not the target company's industry).

| Vertical | Description |
|----------|-------------|
| Banking | Commercial/retail banking sales |
| Insurance | Insurance product sales |
| Real Estate | Property/development sales |
| SaaS Sales | Software/tech sales |

### 2. SUB-VERTICAL = Salesperson's Functional Role
The specific function or product area the salesperson covers.

**Example for Banking Vertical:**
| Sub-Vertical | Description |
|--------------|-------------|
| Employee Banking | Payroll, salary accounts, employee benefits |
| Corporate Banking | Treasury, trade finance, corporate loans |
| SME Banking | Small business accounts, working capital |
| Retail Banking | Personal accounts, mortgages, cards |
| Wealth Management | Private banking, investments |

### 3. REGION = Where the Salesperson Operates
Geographic territory the salesperson covers.

| Level | Examples |
|-------|----------|
| Country | UAE, India, US |
| City | Dubai, Abu Dhabi, Chennai, Bangalore |
| Territory | Dubai South, Business Bay, DIFC |

---

## What This Means for Intelligence

### CORRECT Signal Types (Sales Activity)
These signals indicate SALES opportunities:
- Hiring expansion (company growing = needs banking products)
- Office openings (new locations = new accounts)
- Market entry into region (entering UAE = needs local bank)
- Project awards (new projects = cash flow needs)
- Headcount jumps (more employees = payroll opportunity)
- Subsidiary creation (new entity = new accounts)
- Leadership hiring (decision makers changing)
- Funding rounds (capital = banking relationship opportunity)

### INCORRECT Signal Types (Do NOT use)
These are industry-analysis signals, NOT sales signals:
- ❌ Healthcare industry trends
- ❌ Real estate market analysis
- ❌ FinTech sector movements
- ❌ Developer/tech stack profiles
- ❌ Logistics industry signals

---

## Signal Filtering Rules

1. **Region Filter**: A payroll officer in Chennai should NOT see hiring signals from Delhi
2. **Sub-Vertical Filter**: A corporate banker should NOT see retail banking opportunities
3. **Vertical Filter**: All context is already scoped to salesperson's vertical

### Example Filtering Logic
```typescript
// Employee Banking sales rep in Dubai
const context = {
  vertical: 'banking',
  subVertical: 'employee-banking',
  region: 'dubai',
  territory: 'dubai-south',
};

// This rep should see:
// ✅ "Acme Corp opening Dubai office (150 employees)" - hiring in Dubai
// ✅ "TechCorp expanding team by 50% in UAE" - payroll opportunity
// ❌ "Acme Corp opens Chennai branch" - wrong region
// ❌ "TechCorp needs trade finance" - wrong sub-vertical
```

---

## Architecture: Sales Context Layer

The Sales Context sits ABOVE the SIVA Intelligence Layer:

```
┌─────────────────────────────────────────────────────────┐
│                   Sales Context Layer                    │
│  ┌─────────────────────────────────────────────────────┐│
│  │  vertical | subVertical | region | territory | KPIs ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
                          ↓ injects context
┌─────────────────────────────────────────────────────────┐
│                  SIVA Intelligence Layer                 │
│    Intent → Evidence → Routing → Objects → Persona      │
└─────────────────────────────────────────────────────────┘
                          ↓ wraps
┌─────────────────────────────────────────────────────────┐
│                   Existing Agent Layer                   │
│      Discovery | Ranking | Outreach | Enrichment        │
└─────────────────────────────────────────────────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| `lib/intelligence/context/SalesContextProvider.ts` | Sales context definition |
| `lib/intelligence/context/types.ts` | SalesContext types |
| `lib/intelligence/hooks/useSalesContext.ts` | React hook for context |

---

## UI Vertical Packs (Placeholder Only)

The UI may show industry options (Healthcare, Real Estate, etc.) as FUTURE PLACEHOLDERS.
These have NO backend logic and are not functional.
Only Banking (with sub-verticals) is implemented.

---

## DO NOT DO

1. ❌ Create sector-specific signal templates (Healthcare signals, Real Estate signals)
2. ❌ Analyze target company industries
3. ❌ Build industry-scanning features
4. ❌ Filter by company sector
5. ❌ Create vertical packs for non-banking industries

## DO

1. ✅ Filter by salesperson's vertical/sub-vertical/region
2. ✅ Focus on sales-activity signals (hiring, expansion, funding)
3. ✅ Context-aware recommendations based on sales role
4. ✅ Territory-scoped intelligence
5. ✅ KPI-aligned insights

---

## Summary

> **PremiumRadar helps salespeople find opportunities by analyzing SALES SIGNALS (hiring, expansion, funding) filtered by their ROLE (vertical, sub-vertical) and TERRITORY (region).**

This is NOT about analyzing industries.
This IS about helping salespeople hit their KPIs.
