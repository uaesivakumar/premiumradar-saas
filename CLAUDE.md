# PremiumRadar-SAAS - TC Context File

## CRITICAL PRODUCT MODEL (READ FIRST)

**PremiumRadar is NOT an industry-intelligence engine.**
**PremiumRadar IS a sales enablement platform for salespeople.**

### BANKING ONLY (For Now)

**Only the Banking vertical is currently active.** All other verticals (Insurance, Real Estate, Recruitment, SaaS Sales) are **UI placeholders only** with no backend intelligence logic.

---

## Active Vertical: Banking

### 1. VERTICAL = Salesperson's Sector
The sector in which the SALESPERSON works (not the target company's industry).

| Vertical | Status | Radar Target |
|----------|--------|--------------|
| **Banking** | ✅ ACTIVE | Companies |
| Insurance | 🔒 UI Placeholder | Individuals |
| Real Estate | 🔒 UI Placeholder | Families |
| Recruitment | 🔒 UI Placeholder | Candidates |
| SaaS Sales | 🔒 UI Placeholder | Companies |

### 2. SUB-VERTICAL = Salesperson's Role (Banking Only)
The specific function or product area within Banking:

| Sub-Vertical | Description |
|--------------|-------------|
| Employee Banking | Payroll, salary accounts, employee benefits |
| Corporate Banking | Treasury, trade finance, corporate loans |
| SME Banking | Small business accounts, working capital |

### 3. REGION = Salesperson's Operating Territory
Filters companies to the salesperson's territory:

| Level | Examples |
|-------|----------|
| Country | UAE, India, US |
| City | Dubai, Chennai, Bangalore |
| Territory | Dubai South, DIFC, Whitefield |

---

## Signals: Sales Opportunity Triggers ONLY

### CRITICAL: What Signals ARE

Signals are **sales opportunity triggers from OS**, representing actionable company events that indicate banking needs:

| Signal Type | Meaning |
|-------------|---------|
| `hiring-expansion` | Company hiring = needs payroll accounts |
| `headcount-jump` | Rapid growth = scaling banking needs |
| `office-opening` | New office = new corporate accounts |
| `market-entry` | Entering UAE = needs local bank |
| `funding-round` | Capital raised = treasury needs |
| `project-award` | New project = working capital needs |
| `subsidiary-creation` | New entity = multi-entity banking |

### CRITICAL: What Signals ARE NOT

PremiumRadar does **NOT** model:
- ❌ Life events (marriage, birth, retirement)
- ❌ Family events (new baby, family growth)
- ❌ Individual relocations
- ❌ Salary changes
- ❌ Rental expiry
- ❌ Tech adoption signals
- ❌ Industry intelligence / market analysis

These were **hallucinated in error** and have been removed.

---

## Architecture: Banking-First Model

```
┌─────────────────────────────────────────────────────────┐
│                    SaaS Frontend                         │
│  Selects: vertical | sub-vertical | region              │
│  Shows "Coming Soon" for non-banking verticals          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                       UPR OS                             │
│  Fetches config from SaaS API                           │
│  Only Banking config exists                             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              PremiumRadar SaaS (this repo)              │
│  Banking config in PostgreSQL                           │
│  Returns "VERTICAL_NOT_CONFIGURED" for others           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  SIVA Intelligence Layer                 │
│  Banking signals only                                    │
│  Banking personas only                                   │
│  Banking prompts only                                    │
└─────────────────────────────────────────────────────────┘
```

---

## Vertical Config API

**Endpoint:** `/api/admin/vertical-config`

```typescript
// GET - Fetch Banking config (only one that works)
GET /api/admin/vertical-config?vertical=banking&subVertical=employee-banking&region=UAE

// Response for Banking
{
  "success": true,
  "data": {
    "vertical": "banking",
    "subVertical": "employee-banking",
    "regionCountry": "UAE",
    "radarTarget": "companies",
    "config": {
      "allowedSignalTypes": ["hiring-expansion", "headcount-jump", ...],
      "scoringWeights": { "quality": 0.3, ... },
      "enrichmentSources": [...],
      "outreachChannels": [...],
      "journeyStages": [...]
    }
  }
}

// Response for NON-BANKING verticals
{
  "success": false,
  "error": "VERTICAL_NOT_CONFIGURED",
  "message": "Coming Soon — We're expanding to your industry! Request early access."
}
```

---

## Current Implementation Status

### ✅ Active & Working
- Banking vertical (ONLY)
- Employee Banking / Corporate Banking / SME Banking sub-verticals
- UAE region
- Sales trigger signals (hiring, expansion, funding, etc.)
- Scoring engine for banking
- Pattern matching for banking
- Deep persona for banking
- SIVA prompts for banking
- Dashboard components show "Coming Soon" for non-banking

### 🔒 UI Placeholders Only (No Backend Logic)
- Insurance vertical
- Real Estate vertical
- Recruitment vertical
- SaaS Sales vertical

### 🚧 To Build (Future)
- Super-Admin UI for vertical management
- Additional vertical implementations (when ready)

---

## DO NOT DO

1. ❌ Create backend intelligence for non-banking verticals
2. ❌ Add life event, family event, or relocation signals
3. ❌ Model insurance/real-estate/recruitment signals
4. ❌ Build industry-analysis features
5. ❌ Assume signals work across verticals
6. ❌ Hardcode vertical-specific logic in frontend

## DO

1. ✅ Only Banking has active intelligence
2. ✅ All signals are sales triggers from OS
3. ✅ Show "Coming Soon" for non-banking verticals
4. ✅ Keep SaaS plug-and-play ready for future verticals
5. ✅ Filter by salesperson's context (vertical/sub-vertical/region)

---

## Summary

> **PremiumRadar currently supports Banking salespeople only. Intelligence includes hiring expansion, office openings, funding rounds, and other company-level sales triggers. Other verticals (Insurance, Real Estate, Recruitment, SaaS) are UI placeholders that show "Coming Soon" messages.**

| Aspect | Value |
|--------|-------|
| Active Vertical | Banking only |
| Radar Target | Companies |
| Signal Types | Sales triggers (hiring, expansion, funding) |
| Non-Banking | UI placeholders, "Coming Soon" |
| Source of Truth | OS config via API |

**Signals are sales triggers, NOT life events.**
**Banking only. Everything else is Coming Soon.**
