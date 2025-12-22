# Sales-Bench UI Governance Redesign

**Date:** 2025-12-22
**Status:** IMPLEMENTED
**PRD Reference:** PRD v1.3 Appendix

---

## 1. UI Copy Inventory

### Metric Labels (Changed)

| Old Label | New Label |
|-----------|-----------|
| Golden Pass Rate | Golden Path Compliance |
| Kill Containment | Policy Containment Rate |
| Best Performer | Reference Suite |
| Insight | Governance Notice |
| Performance needs attention | Governance Status: Some suites require attention before RM trials |
| SIVA Sales-Bench | SIVA Governance Console |
| Behavioral validation & performance tracking | Behavioral Validation & Trust Evaluation — No Runtime Impact |
| Validation Suites | Governance Suites |

### Tooltips (Added)

Every metric card now shows on hover:
> "This metric is for validation and trust evaluation only.
> It does not represent conversion performance or optimization guidance."

### Suite Status Badges (Added)

| Status | Badge |
|--------|-------|
| FROZEN / SYSTEM_VALIDATED | 🔒 BASELINE — DO NOT TUNE |
| ARCHIVED / DEPRECATED | 📦 REFERENCE ONLY |
| GA_APPROVED | ✓ GA APPROVED |

### RM Trial Badge (Added)

Binary status only:
- ✅ **RM TRIAL READY** (green)
- ❌ **NOT READY FOR RM TRIALS** (neutral)

---

## 2. Founder View vs Operator View

### Founder View (DEFAULT)

**Banner:**
> "Founder View: You are evaluating trust and maturity, not performance."

**Shows:**
- Trust Summary (observational metrics)
- "What This Proves" section:
  - SIVA follows expected behavioral patterns on known scenarios
  - Policy gates are consistently enforced
  - Golden path scenarios produce expected ACT decisions
- "What This Does NOT Prove" section:
  - Real-world conversion rates or sales success
  - Model accuracy on unseen data
  - Optimization guidance or tuning recommendations
- Governance Notice (not "Insight")
- RM Trial Status per suite

**Does NOT Show:**
- Cohen's d
- Any CTA to "fix", "adjust", or "re-run"
- Trend indicators (removed)

### Operator View (RESTRICTED)

**Banner:**
> "Operator View: Metrics here do not indicate sales success. Do not tune thresholds without governance approval."

**Shows:**
- Raw metrics with decimal precision
- Cohen's d column
- All scenario-level data

**View Toggle:**
- Default: Founder View
- Persists via localStorage
- Toggle button in header

---

## 3. RM Trial Readiness Gate

### Conditions (ALL must be true)

| Condition | Requirement |
|-----------|-------------|
| Suite Status | `SYSTEM_VALIDATED` or `GA_APPROVED` |
| Shadow Stability | ≥ 2 consecutive weeks |
| Founder Approval | ≥ 10 ACT outcomes manually approved |
| Block Integrity | 0 false positives |
| Wiring Parity | Latest certification = VALID |

### UI Representation

- **Binary badge only** — no gradients, no percentages
- Tooltip: "RM trials are allowed only after governance validation, shadow stability, and founder trust approval."

### Forbidden Signals

UI never says:
- "Almost ready"
- "Improving"
- "Trending toward readiness"

---

## 4. PRD v1.3 Mapping Checklist

| PRD Requirement | Implementation |
|----------------|----------------|
| No "performance" language | ✅ Replaced all instances |
| No "optimization" guidance | ✅ UI never suggests tuning |
| No red/green performance colors | ✅ Neutral colors only |
| Tooltips on metrics | ✅ Added to all metric cards |
| Lock icon for frozen suites | ✅ 🔒 with "DO NOT TUNE" |
| Reference-only for archived | ✅ Badge added |
| Founder View default | ✅ localStorage-persisted |
| Operator View restricted | ✅ Requires explicit toggle |
| RM Trial binary gate | ✅ No gradients |
| "What this proves" section | ✅ Added in Founder View |
| "What this does NOT prove" | ✅ Added in Founder View |

---

## 5. How This UI Prevents Misuse of Sales-Bench

### The Problem (Before)

The old UI created false cognitive signals:
1. **"Best Performer"** implied SIVA models compete on performance
2. **Red/green colors** implied good/bad judgment on metrics
3. **"Performance needs attention"** implied action was required
4. **Trend indicators** implied optimization was expected

This mental model was **dangerous** because:
- It encouraged tuning thresholds without governance approval
- It conflated behavioral validation with sales success
- It implied low scores meant SIVA was "broken"

### The Solution (After)

The new UI enforces governance mental model:

1. **Neutral Language**
   - "Compliance" not "Performance"
   - "Reference Suite" not "Best Performer"
   - "Governance Notice" not "Insight"

2. **Explicit Boundaries**
   - "What this proves" vs "What this does NOT prove"
   - Clear statement: "Metrics are observational"
   - Footer disclaimer on every page

3. **Binary Gates**
   - RM Trial Readiness is YES or NO
   - No "almost ready" or "trending"
   - Forces explicit governance checkpoints

4. **View Separation**
   - Founders evaluate trust, not mechanics
   - Operators see raw data with warning
   - Default view protects from misinterpretation

5. **Visual Constraints**
   - No red/green coloring on metrics
   - Lock icons prevent "tune this" impulse
   - No CTAs to "fix" or "adjust"

### Key Invariant

> The UI must never suggest that low metrics mean SIVA needs fixing.
> Metrics are observational. Governance decisions require human judgment.

---

## 6. Files Modified

| File | Changes |
|------|---------|
| `app/superadmin/sales-bench/page.tsx` | Complete rewrite with governance UI |

---

## 7. Wiring Parity Check (Governance Tripwire)

### Purpose

The Parity Check button is a **governance tripwire** that verifies Frontend Discovery and Sales-Bench use the **identical SIVA scoring path**. This prevents intelligence path drift.

### Behavior

| Aspect | Value |
|--------|-------|
| Location | Founder View only |
| Output | Binary: `PARITY_VERIFIED` or `PARITY_BROKEN` |
| Test Cases | Fixed, immutable set (minimum 5) |
| Comparison | Outcomes, policy gates, persona_id, tools_used |
| Logging | Timestamp, certification_id, commit SHA |

### UI Elements

1. **Run Parity Check** button
2. **Result Display**: Green for VERIFIED, Red for BROKEN
3. **Last Certification Status**: Shows previous certification if available

### RM Trial Readiness Impact

When parity is BROKEN:
- All RM Trial Readiness badges show `PARITY BROKEN — LOCKED`
- Governance alert displayed: "Do not proceed with RM trials until parity is restored"
- All suites locked from RM involvement

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/superadmin/os/sales-bench?action=parity-status` | GET | Get last certification status |
| `/api/superadmin/os/sales-bench` | POST | Run parity check (command: `parity-check`) |

### Files Modified

| File | Changes |
|------|---------|
| `lib/os/os-client.ts` | Added `runParityCertification()` and `getParityStatus()` methods |
| `app/api/superadmin/os/sales-bench/route.ts` | Added `parity-check` command and `parity-status` action |
| `app/superadmin/sales-bench/page.tsx` | Added Parity Check UI (Founder View only) |

---

## Stop Condition

Implementation complete. Awaiting founder review and sign-off before any additional features.
