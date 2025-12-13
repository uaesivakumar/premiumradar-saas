# VS11 - FRONTEND WIRING SPRINT

**Sprint**: VS11 - Connect Frontend to Real Backend
**Priority**: P0 BLOCKER
**Trigger**: Gemini 2.0 Flash Audit (2025-12-13)
**Goal**: Replace all mock data in frontend with real API calls

---

## EXECUTIVE SUMMARY

VS10 successfully wired the backend (auth, persistence, SIVA, email).
However, the **frontend components are facades** using hardcoded mock data.

**Before VS11**: Users see real login → fake dashboard data
**After VS11**: Users see real login → real SIVA intelligence

---

## P0 BLOCKERS TO FIX

### 1. Company Profile API (MISSING)

**Problem**: `/api/companies/[id]` endpoint doesn't exist
**Impact**: Frontend has nowhere to fetch company data

**Solution**: Create `app/api/companies/[id]/route.ts`

```typescript
// GET /api/companies/[id]
// - Fetch company from enrichment engine
// - Include signals from OS
// - Include QTLE scores from SIVA
// - Include contacts from Apollo
```

---

### 2. Company Profile Page (MOCK DATA)

**File**: `app/dashboard/companies/[id]/page.tsx`
**Problem**: Uses `getMockCompanyData()` function (lines 43-224)
**Impact**: All company profiles show hardcoded "Emirates Group" data

**Solution**: Replace mock function with API call

```typescript
// BEFORE (line 249)
const mockData = getMockCompanyData(companyId);

// AFTER
const response = await fetch(`/api/companies/${companyId}`);
const result = await response.json();
const companyData = result.data;
```

---

### 3. Outreach Page (MOCK DATA)

**File**: `app/dashboard/outreach/page.tsx`
**Problem**: Uses `mockCompany` constant (lines 15-31)
**Impact**: Outreach always shows "Emirates NBD"

**Solution**: Accept company via URL params or fetch from API

```typescript
// BEFORE
const mockCompany: BankingCompanyProfile = { name: 'Emirates NBD', ... };

// AFTER
const searchParams = useSearchParams();
const companyId = searchParams.get('companyId');
const [company, setCompany] = useState<CompanyData | null>(null);

useEffect(() => {
  if (companyId) {
    fetch(`/api/companies/${companyId}`).then(r => r.json()).then(setCompany);
  }
}, [companyId]);
```

---

### 4. Subscription Store (MOCK HELPERS)

**File**: `lib/billing/subscription-store.ts`
**Problem**: `createMockSubscription()` uses `Math.random()` for IDs
**Impact**: Mock subscriptions lose state on refresh

**Solution**: Remove mock helpers or gate them with `process.env.NODE_ENV`

```typescript
// Only use mock data in development
export function createMockSubscription(...): Subscription {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Mock subscriptions not allowed in production');
  }
  // ... existing mock logic
}
```

---

## IMPLEMENTATION WORKSTREAMS

### VS11.1: Create Company API
- Create `app/api/companies/[id]/route.ts`
- Fetch from enrichment engine
- Include SIVA scores
- Include Apollo contacts

### VS11.2: Wire Company Profile Page
- Replace `getMockCompanyData()` with real API call
- Handle loading and error states
- Ensure signals come from OS

### VS11.3: Wire Outreach Page
- Accept `companyId` from URL params
- Fetch company data from API
- Generate outreach using OS `/api/os/outreach`

### VS11.4: Clean Up Mock Helpers
- Remove or gate `createMockSubscription()`
- Remove or gate `createMockInvoice()`
- Add production safeguards

### VS11.5: Dashboard Stats Wiring
- Verify `/api/dashboard/stats` returns real data
- Wire dashboard page to use API response
- Remove any remaining mock fallbacks

---

## VALIDATION CRITERIA

| Criterion | Test |
|-----------|------|
| Company API works | `curl /api/companies/123` returns real data |
| Profile shows real data | Different companies show different data |
| Outreach uses real company | Selected company appears in outreach |
| No mock data in production | `grep -r getMock` returns 0 results |

---

## ESTIMATED EFFORT

| Workstream | Complexity | Time |
|------------|------------|------|
| VS11.1: Company API | Medium | 2 hours |
| VS11.2: Company Profile | Low | 1 hour |
| VS11.3: Outreach Page | Low | 1 hour |
| VS11.4: Mock Cleanup | Low | 30 min |
| VS11.5: Dashboard Stats | Medium | 1 hour |

**Total**: ~6 hours

---

## DEPENDENCIES

- VS10 must be complete (auth, persistence) ✅
- Enrichment engine must be working ✅
- OS API must be accessible ✅

---

## AUTHORIZATION

Sprint authorized based on Gemini 2.0 Flash audit findings.

**Authorization Code**: VS11-FRONTEND-WIRING-20251213
