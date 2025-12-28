# PremiumRadar Wiring Verification

**Purpose:** Ensure newly implemented code is properly connected, wired, and the flow actually works.

**When to use:** After ANY code implementation (feature, API, component, module).

---

## CRITICAL: TC's Known Failure Pattern

TC (Claude) writes excellent code but frequently leaves it **disconnected**:
- New API routes not called from frontend
- New components not imported into pages
- New functions not wired to event handlers
- New database columns not used in queries
- New modules not exported from index files

**This command exists to catch these gaps.**

---

## EXECUTION STEPS

### Step 1: Identify What Was Just Implemented

Ask yourself (or check recent changes):
```bash
git diff --name-only HEAD~1
git log -1 --stat
```

Categorize the changes:
- [ ] New API route (`app/api/**`)
- [ ] New UI component (`components/**`)
- [ ] New page (`app/**/page.tsx`)
- [ ] New utility/lib (`lib/**`)
- [ ] New database migration (`prisma/migrations/**`)
- [ ] Modified existing file

---

### Step 2: Wiring Checklist by Type

#### For NEW API ROUTES:

```bash
# 1. Check route is accessible
curl -s http://localhost:3000/api/[your-route] | head -20

# 2. Find where it SHOULD be called from
grep -rn "api/[your-route]" --include="*.ts" --include="*.tsx" app/ components/ lib/

# 3. If not found, THIS IS THE BUG - route exists but nothing calls it
```

**Required connections:**
- [ ] Frontend component calls this API (fetch/axios)
- [ ] OR another API calls this API
- [ ] OR it's a webhook endpoint (document the external caller)

#### For NEW UI COMPONENTS:

```bash
# 1. Check component is exported
grep -n "export" components/[YourComponent].tsx

# 2. Find where it's imported
grep -rn "from.*[YourComponent]" --include="*.tsx" app/ components/

# 3. If not found, THIS IS THE BUG - component exists but not used
```

**Required connections:**
- [ ] Imported in a page or parent component
- [ ] Props are being passed correctly
- [ ] Event handlers are connected

#### For NEW LIB/UTILITY FUNCTIONS:

```bash
# 1. Check function is exported
grep -n "export" lib/[your-file].ts

# 2. Find usages
grep -rn "[functionName]" --include="*.ts" --include="*.tsx" app/ components/ lib/

# 3. If only found in definition file, THIS IS THE BUG
```

#### For NEW DATABASE TABLES/COLUMNS:

```bash
# 1. Check migration was applied
psql -c "\d [table_name]"

# 2. Find queries that use the new column/table
grep -rn "[column_name]\|[table_name]" --include="*.ts" lib/db/ app/api/

# 3. If not found in queries, THIS IS THE BUG
```

---

### Step 3: Trace the Complete Flow

For any feature, trace the FULL path:

```
USER ACTION → UI COMPONENT → API ROUTE → LIB FUNCTION → DATABASE → RESPONSE → UI UPDATE
```

**For each step, verify:**

| Step | Check | Command |
|------|-------|---------|
| UI Component | Has onClick/onSubmit handler? | `grep -n "onClick\|onSubmit" [file]` |
| Handler | Calls fetch/API? | `grep -n "fetch\|axios\|api/" [file]` |
| API Route | Exists and handles request? | `curl localhost:3000/api/...` |
| API Route | Calls lib function? | `grep -n "import.*from.*lib" [route]` |
| Lib Function | Queries database? | `grep -n "query\|pool\|prisma" [lib]` |
| Response | Returns to frontend? | `grep -n "NextResponse.json\|return" [route]` |
| UI | Updates on response? | `grep -n "useState\|setData\|mutate" [component]` |

---

### Step 4: Runtime Verification

**Start dev server if not running:**
```bash
npm run dev
```

**Test the actual flow:**

1. **API Test:**
```bash
# Replace with your endpoint
curl -s -X POST http://localhost:3000/api/[your-endpoint] \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}' | jq .
```

2. **Browser Test:**
- Open http://localhost:3000
- Navigate to the feature
- Open DevTools → Network tab
- Perform the action
- Verify API call is made
- Verify response is received
- Verify UI updates

3. **Database Test:**
```bash
# Verify data was written/read
psql -c "SELECT * FROM [table] ORDER BY created_at DESC LIMIT 5"
```

---

### Step 5: Common Missing Wires (Check These!)

| Symptom | Missing Wire | Fix |
|---------|--------------|-----|
| Button does nothing | onClick not connected | Add `onClick={handleSubmit}` |
| API never called | fetch not triggered | Wire handler to form/button |
| Data not showing | Response not stored in state | Add `setData(response.data)` |
| 404 on API call | Route file in wrong location | Move to `app/api/[correct-path]/route.ts` |
| Import error | Not exported from module | Add `export` to function/component |
| DB column missing | Migration not applied | Run migration |
| Type error | Interface not imported | Add import statement |

---

### Step 6: Report Format

After verification, report:

```
## Wiring Verification Report

### What Was Implemented
- [List files/features]

### Wiring Status
| Component | Connected To | Status |
|-----------|--------------|--------|
| [Component] | [Target] | ✅/❌ |

### Flow Trace
USER → [Component] → [API] → [Lib] → [DB] → [Response] → [UI Update]
      ✅           ✅       ✅      ✅      ✅           ✅

### Tests Performed
- [ ] API endpoint responds correctly
- [ ] Frontend calls API
- [ ] Database read/write works
- [ ] UI updates on response

### Missing Wires Found
- [List any gaps discovered]

### Fixes Applied
- [List any fixes made]
```

---

## QUICK COMMANDS

```bash
# Find orphan components (defined but never imported)
for f in components/**/*.tsx; do
  name=$(basename "$f" .tsx)
  count=$(grep -rn "from.*$name" --include="*.tsx" app/ components/ | wc -l)
  if [ "$count" -eq 0 ]; then echo "ORPHAN: $f"; fi
done

# Find orphan API routes (defined but never called)
for f in app/api/**/route.ts; do
  path=$(echo "$f" | sed 's|app/api/||' | sed 's|/route.ts||')
  count=$(grep -rn "api/$path" --include="*.ts" --include="*.tsx" | wc -l)
  if [ "$count" -eq 0 ]; then echo "ORPHAN API: /api/$path"; fi
done

# Find unused exports
grep -rn "^export " lib/**/*.ts | while read line; do
  file=$(echo "$line" | cut -d: -f1)
  name=$(echo "$line" | grep -oP "export (const|function|class) \K\w+")
  if [ -n "$name" ]; then
    count=$(grep -rn "$name" --include="*.ts" --include="*.tsx" | grep -v "^$file" | wc -l)
    if [ "$count" -eq 0 ]; then echo "UNUSED: $name in $file"; fi
  fi
done
```

---

## NON-NEGOTIABLE RULE

**DO NOT mark a task as complete until /wiring passes.**

If wiring gaps are found:
1. Fix them immediately
2. Re-run /wiring
3. Only then mark complete

---

## STEP 7: BEHAVIOR TRACE VERIFICATION (NEW - v2.2)

**Added based on User & Enterprise Management v1.1 hostile audit failure.**

This step catches the pattern: "code exists but isn't connected at the entry point."

### 7.1 Entry Point Wiring Check

**Critical entry points must call the correct functions, NOT legacy ones.**

```bash
# Example: Verify signup creates ENTERPRISE, not TENANT
echo "=== ENTRY POINT WIRING ==="

# Check what signup actually calls
grep -n "getOrCreate" app/api/auth/signup/route.ts

# EXPECTED (good):
#   import { getOrCreateEnterpriseForDomain } from '@/lib/db/enterprises';
#
# NOT EXPECTED (legacy - must fix):
#   import { getOrCreateTenantForDomain } from '@/lib/db/tenants';

# Automated check
if grep -q "getOrCreateTenantForDomain" app/api/auth/signup/route.ts; then
  echo "❌ FAIL: Signup still calls legacy getOrCreateTenantForDomain"
  echo "   Must call getOrCreateEnterpriseForDomain instead"
  exit 1
fi

if grep -q "getOrCreateEnterpriseForDomain" app/api/auth/signup/route.ts; then
  echo "✅ PASS: Signup calls getOrCreateEnterpriseForDomain"
fi
```

### 7.2 SQL Column Name Check

**SQL queries must use correct column names.**

```bash
echo "=== SQL COLUMN NAMES ==="

# Tables that DON'T use 'id' as primary key
declare -A TABLE_PK=(
  ["enterprises"]="enterprise_id"
  ["workspaces"]="workspace_id"
)

for table in "${!TABLE_PK[@]}"; do
  pk="${TABLE_PK[$table]}"

  # Find incorrect usage: FROM table WHERE id =
  bad_queries=$(grep -rn "FROM $table" lib/ app/ --include="*.ts" | grep "WHERE id =")

  if [ -n "$bad_queries" ]; then
    echo "❌ FAIL: Found 'WHERE id =' on $table (should be $pk)"
    echo "$bad_queries"
    exit 1
  fi
done

echo "✅ PASS: All SQL column names correct"
```

### 7.3 File Existence Check

**If claiming to have created files, verify they exist.**

```bash
echo "=== FILE EXISTENCE ==="

# Files that SHOULD exist for enterprise management
REQUIRED_FILES=(
  "lib/db/enterprises.ts"
  "lib/db/workspaces.ts"
  "app/api/enterprise/route.ts"
  "app/api/enterprise/users/route.ts"
  "app/api/enterprise/workspaces/route.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ FAIL: Required file missing: $file"
    exit 1
  fi
done

echo "✅ PASS: All required files exist"
```

### 7.4 Role Taxonomy Check

**Role names must be consistent (either old OR new, not mixed).**

```bash
echo "=== ROLE TAXONOMY ==="

# Check for mixed role taxonomy
OLD_ROLES="TENANT_USER|TENANT_ADMIN"
NEW_ROLES="ENTERPRISE_USER|ENTERPRISE_ADMIN|INDIVIDUAL_USER"

uses_old=$(grep -rn "$OLD_ROLES" lib/db/ lib/security/ --include="*.ts" | wc -l)
uses_new=$(grep -rn "$NEW_ROLES" lib/db/ lib/security/ --include="*.ts" | wc -l)

if [ "$uses_old" -gt 0 ] && [ "$uses_new" -gt 0 ]; then
  echo "⚠️ WARNING: Mixed role taxonomy detected"
  echo "   Old roles (TENANT_*): $uses_old occurrences"
  echo "   New roles (ENTERPRISE_*): $uses_new occurrences"
  echo "   Consider migrating to consistent taxonomy"
fi
```

### 7.5 End-to-End Flow Trace

**Trace the full path from user action to database write.**

```
USER ACTION → UI COMPONENT → API ROUTE → LIB FUNCTION → DATABASE → RESPONSE
    ↓              ↓              ↓            ↓            ↓          ↓
  signup     AuthForm.tsx    /api/signup   createUser   enterprises  session
                               ↓               ↓            ↓
                         Must call:        Must call:   Must write:
                         createUser    getOrCreate...   enterprises
                                                        (NOT tenants)
```

**For each critical path, verify:**

| Step | What to Check | Command |
|------|---------------|---------|
| Entry point | Calls correct function | `grep -n "functionName" entry_file.ts` |
| Lib function | Writes to correct table | `grep -n "INSERT INTO" lib_file.ts` |
| Table | Has correct columns | `psql -c "\d table_name"` |

---

## WIRING REPORT FORMAT (Updated v2.2)

```
## Wiring Verification Report

### What Was Implemented
- [List files/features]

### STANDARD WIRING CHECKS
| Component | Connected To | Status |
|-----------|--------------|--------|
| [Component] | [Target] | ✅/❌ |

### BEHAVIOR TRACE CHECKS (v2.2)
| Check | Status | Details |
|-------|--------|---------|
| Entry Point Wiring | ✅/❌ | signup calls getOrCreateEnterpriseForDomain |
| SQL Column Names | ✅/❌ | enterprises uses enterprise_id |
| File Existence | ✅/❌ | All claimed files exist |
| Role Taxonomy | ✅/❌ | Consistent ENTERPRISE_* usage |

### Flow Trace
USER → [Component] → [API] → [Lib] → [DB] → [Response] → [UI Update]
      ✅           ✅       ✅      ✅      ✅           ✅

### Tests Performed
- [ ] API endpoint responds correctly
- [ ] Frontend calls API
- [ ] Database read/write works
- [ ] UI updates on response
- [ ] Entry point calls correct function (v2.2)
- [ ] SQL uses correct column names (v2.2)

### Missing Wires Found
- [List any gaps discovered]

### Fixes Applied
- [List any fixes made]
```

---

## LESSONS FROM HOSTILE AUDIT (User & Enterprise v1.1)

**The following failures are now caught by Step 7:**

| Failure | What Happened | How Step 7 Prevents |
|---------|---------------|---------------------|
| Entry point disconnect | signup called getOrCreateTenantForDomain | 7.1 checks entry point calls |
| SQL column bug | WHERE id = $1 on enterprises table | 7.2 verifies column names |
| Missing files | lib/enterprise/* claimed but empty | 7.3 verifies existence |
| Role taxonomy | TENANT_USER vs ENTERPRISE_USER | 7.4 checks consistency |
| No E2E trace | Files existed but weren't connected | 7.5 traces full flow |

**Root Cause:** TC (Claude) writes excellent individual files but leaves them disconnected.

**Prevention:** Step 7 verifies the CONNECTION, not just existence.
