# HOSTILE AUDIT: User & Enterprise Management v1.1

**Audit Date:** 2025-12-27
**Auditor:** Claude Code (Hostile Mode)
**Scope:** S279-S329 (55 sprints, 9 phases)
**Methodology:** Trace actual execution paths, not spec compliance

---

## EXECUTIVE VERDICT

# ❌ CRITICAL FAILURE - NOT PRODUCTION READY

**With 10,000 enterprises and 100,000 users, this system will:**
- Create users without any enterprise (signup broken)
- Return 404 on all enterprise API calls
- Crash on security guards (SQL errors)
- Mix incompatible role taxonomies

**Root Cause:** The certification documents an architecture that WAS NOT IMPLEMENTED. The code writes to `tenants` table but reads from `enterprises` table. These are SEPARATE tables with NO bridge.

---

## SPEC COVERAGE MATRIX

### Phase A-D: Foundation & Backend (S279-S298A)

| Claimed File | Exists? | Wired? | Works at Runtime? |
|--------------|---------|--------|-------------------|
| `lib/enterprise/types.ts` | ❌ NO | - | - |
| `lib/enterprise/context.tsx` | ❌ NO | - | - |
| `lib/enterprise/hooks.ts` | ❌ NO | - | - |
| `lib/enterprise/enterprise-service.ts` | ❌ NO | - | - |
| `lib/enterprise/workspace-service.ts` | ❌ NO | - | - |
| `lib/enterprise/user-service.ts` | ❌ NO | - | - |
| `app/api/enterprise/route.ts` | ✅ YES | ⚠️ Partial | ❌ NO (no data) |
| `app/api/enterprise/users/route.ts` | ✅ YES | ⚠️ Partial | ❌ NO (no data) |
| `app/api/enterprise/workspaces/route.ts` | ✅ YES | ⚠️ Partial | ❌ NO (no data) |
| `lib/db/enterprises.ts` | ✅ YES | ❌ Not called | ❌ NO |
| `lib/db/workspaces.ts` | ✅ YES | ❌ Not called | ❌ NO |

### Phase E: AI & BTE Integration (S311-S315)

| Claimed File | Exists? | Wired? | Works at Runtime? |
|--------------|---------|--------|-------------------|
| `lib/ai/enterprise-context.ts` | ❓ NOT VERIFIED | - | - |
| `lib/ai/enterprise-siva.ts` | ❓ NOT VERIFIED | - | - |

### Phase F: Demo System (S316-S320)

| File | Exists? | Wired? | Works at Runtime? |
|------|---------|--------|-------------------|
| `lib/demo/demo-provisioner.ts` | ✅ YES | ⚠️ | ⚠️ (no enterprise base) |
| `lib/demo/demo-seeder.ts` | ✅ YES | ⚠️ | ⚠️ (no enterprise base) |
| `lib/demo/demo-lifecycle.ts` | ✅ YES | ⚠️ | ⚠️ (no enterprise base) |

### Phase G: Security, RLS & Audit (S321-S325)

| File | Exists? | Wired? | Works at Runtime? |
|------|---------|--------|-------------------|
| `lib/security/enterprise-audit.ts` | ✅ YES | ✅ | ⚠️ (needs enterprise) |
| `lib/security/enterprise-guards.ts` | ✅ YES | ✅ | ❌ SQL BUGS |
| `lib/security/enterprise-session.ts` | ✅ YES | ✅ | ⚠️ (needs enterprise) |
| `lib/security/permission-matrix.ts` | ✅ YES | ✅ | ⚠️ (needs enterprise) |
| `prisma/migrations/S298A_baseline_rls.sql` | ✅ YES | ✅ | ⚠️ Legacy role check |

### Phase H-I: Validation & Certification (S326-S329)

| File | Exists? | Wired? | Works at Runtime? |
|------|---------|--------|-------------------|
| `lib/validation/enterprise-flow.ts` | ✅ YES | ✅ | ✅ (queries DB) |
| `lib/validation/multi-workspace-flow.ts` | ✅ YES | ✅ | ✅ (queries DB) |
| `lib/validation/demo-flow.ts` | ✅ YES | ✅ | ✅ (queries DB) |
| `lib/validation/certification.ts` | ✅ YES | ✅ | ✅ (generates report) |

---

## WIRING FAILURES (CRITICAL)

### FAILURE #1: Signup Creates TENANT, Not ENTERPRISE

**File:** `app/api/auth/signup/route.ts:130`
```typescript
// ACTUAL: Creates user with TENANT via lib/db/users.ts
const userWithProfile = await createUser({...});
```

**File:** `lib/db/users.ts:174-182`
```typescript
// ACTUAL: Creates/finds TENANT, not enterprise
let tenantId = input.tenantId;
if (!tenantId && emailDomain) {
  const tenant = await getOrCreateTenantForDomain(  // ← TENANT!
    emailDomain,
    input.companyName || emailDomain
  );
  tenantId = tenant.id;
}
```

**EXPECTED:** Signup should call `getOrCreateEnterpriseForDomain()` from `lib/db/enterprises.ts`

**IMPACT:** Every user created via signup has NO enterprise. All `/api/enterprise/*` routes return 404.

### FAILURE #2: Session Uses tenantId, APIs Expect enterpriseId

**File:** `app/api/auth/signup/route.ts:174`
```typescript
const sessionResult = await createSession({
  ...
  tenantId: userWithProfile.tenant_id,  // ← TENANT!
```

**File:** `app/api/enterprise/route.ts:35`
```typescript
const enterpriseId = session.enterpriseId;  // ← NULL for signup users
if (!enterpriseId) {
  return NextResponse.json(
    { success: false, error: 'No enterprise associated with user' },  // ← ALWAYS
    { status: 404 }
  );
}
```

**IMPACT:** Session may have backward-compat fallback (`enterpriseId || tenantId`) but `getEnterpriseById()` queries `enterprises` table which has NO data from signup.

### FAILURE #3: SQL Column Name Errors in Guards

**File:** `lib/security/enterprise-guards.ts:282-284`
```typescript
const enterprise = await queryOne<...>(
  'SELECT is_active, status, demo_expires_at FROM enterprises WHERE id = $1',
                                                              // ↑ WRONG!
  [context.enterprise_id]
);
```

**CORRECT:** `WHERE enterprise_id = $1` (table uses `enterprise_id`, not `id`)

**File:** `lib/security/enterprise-guards.ts:196-199`
```typescript
const workspace = await queryOne<{ enterprise_id: string }>(
  'SELECT enterprise_id FROM workspaces WHERE id = $1',
                                         // ↑ WRONG!
  [workspaceId]
);
```

**CORRECT:** `WHERE workspace_id = $1`

**IMPACT:** Guards crash at runtime. No access control works.

### FAILURE #4: Role Taxonomy Mismatch

**Old System (lib/db/users.ts):**
```typescript
role: 'TENANT_USER' | 'TENANT_ADMIN' | 'SUPER_ADMIN' | 'READ_ONLY'
```

**New System (lib/security/enterprise-guards.ts):**
```typescript
type EnterpriseRole = 'SUPER_ADMIN' | 'ENTERPRISE_ADMIN' | 'ENTERPRISE_USER' | 'INDIVIDUAL_USER'
```

**Signup creates:** `TENANT_USER` (default)
**Guards check for:** `ENTERPRISE_USER`

**IMPACT:** Role checks fail. Users with `TENANT_USER` don't match `ENTERPRISE_USER`.

### FAILURE #5: RLS Still Uses Legacy Role

**File:** `prisma/migrations/S298A_baseline_rls.sql`
```sql
CREATE OR REPLACE FUNCTION is_enterprise_admin()
RETURNS BOOLEAN AS $
  SELECT current_setting('app.current_role', true) IN
    ('SUPER_ADMIN', 'ENTERPRISE_ADMIN', 'TENANT_ADMIN');  -- ← LEGACY!
$ LANGUAGE sql SECURITY DEFINER;
```

**IMPACT:** RLS works for `TENANT_ADMIN` but inconsistent with application code expecting only `ENTERPRISE_ADMIN`.

---

## RUNTIME BREAKPOINTS

### Breakpoint #1: User Signup → Enterprise Dashboard

```
User clicks "Sign Up"
  → POST /api/auth/signup
    → createUser() in lib/db/users.ts
      → getOrCreateTenantForDomain() ← CREATES TENANT
      → INSERT INTO tenants (...)
      → INSERT INTO users (tenant_id = ...)
  → createSession({ tenantId: ... })
  → User redirected to /dashboard

User visits /api/enterprise
  → getServerSession()
    → session.enterpriseId = null (or fallback to tenantId)
  → getEnterpriseById(enterpriseId)
    → SELECT * FROM enterprises WHERE enterprise_id = $1
    → RETURNS NULL (enterprises table is EMPTY)
  → 404 "No enterprise associated with user"
```

**RESULT:** Every user sees "No enterprise" error.

### Breakpoint #2: Admin Creates User

```
Admin calls POST /api/enterprise/users
  → requireRole('ENTERPRISE_ADMIN')
    → getGuardContext()
      → session.user.role = 'TENANT_USER'
    → hasRoleLevel('TENANT_USER', 'ENTERPRISE_ADMIN')
    → Returns false
  → 403 "ENTERPRISE_ADMIN role required"
```

**RESULT:** No one can create users because no one has `ENTERPRISE_ADMIN` role.

### Breakpoint #3: Security Guard Check

```
Any request with requireActiveEnterprise()
  → SELECT is_active, status FROM enterprises WHERE id = $1
  → ERROR: column "id" does not exist
  → Unhandled exception
```

**RESULT:** Application crashes on any guard check.

---

## ENTITIES: EXISTENCE vs EXECUTION

| Entity | DB Table Exists? | Code Writes? | Code Reads? | Data Exists? |
|--------|------------------|--------------|-------------|--------------|
| enterprises | ✅ | ❌ (never written) | ✅ | ❌ EMPTY |
| workspaces | ✅ | ⚠️ (only via admin) | ✅ | ❌ EMPTY |
| users (enterprise_id) | ✅ column | ❌ | ✅ | NULL for all |
| users (workspace_id) | ✅ column | ❌ | ✅ | NULL for all |
| tenants | ✅ | ✅ (signup) | ⚠️ (legacy) | ✅ HAS DATA |
| demo_policies | ✅ | ⚠️ | ⚠️ | ⚠️ |
| workspace_members | ✅ | ❌ | ✅ | ❌ EMPTY |
| user_invitations | ✅ | ⚠️ | ⚠️ | ⚠️ |

---

## CROSS-REPO WIRING (SaaS → OS)

### Enterprise Context to OS

**Finding:** Enterprise ID is NEVER passed to OS.

The OS client (`lib/os/os-client.ts`) handles:
- System config
- LLM routing
- Providers
- Verticals
- Territories
- Sales-bench governance

**None of these pass enterprise_id.** OS is enterprise-agnostic for now.

### AI/BTE Reality

Cannot verify - would need to trace actual SIVA calls with enterprise context.
The OS client authenticates via `x-pr-os-token` (system-level) not per-enterprise.

---

## REQUIRED FIXES (Priority Order)

### P0 - CRITICAL (System Non-Functional)

1. **Bridge signup to enterprises:**
   ```typescript
   // In lib/db/users.ts createUser():
   - const tenant = await getOrCreateTenantForDomain(...)
   + const enterprise = await getOrCreateEnterpriseForDomain(...)
   + const workspace = await getOrCreateDefaultWorkspace(enterprise.enterprise_id, subVerticalId)
   ```

2. **Fix SQL column names in guards:**
   ```typescript
   // lib/security/enterprise-guards.ts:283
   - 'SELECT ... FROM enterprises WHERE id = $1'
   + 'SELECT ... FROM enterprises WHERE enterprise_id = $1'

   // lib/security/enterprise-guards.ts:198
   - 'SELECT ... FROM workspaces WHERE id = $1'
   + 'SELECT ... FROM workspaces WHERE workspace_id = $1'
   ```

3. **Create missing lib/enterprise/* files** or update certification to remove false claims

### P1 - HIGH (Role System Broken)

4. **Unify role taxonomy:**
   - Either migrate all to `ENTERPRISE_*` roles
   - Or maintain explicit mapping

5. **Update RLS functions** to use consistent role names

### P2 - MEDIUM (Cross-Repo)

6. **Add enterprise_id to OS calls** where tenant isolation needed

---

## CONCLUSION

The User & Enterprise Management Program v1.1 has:
- ✅ Created database tables
- ✅ Created API route files
- ✅ Created security modules
- ✅ Created validation/certification
- ❌ **NOT wired signup to create enterprises**
- ❌ **NOT created lib/enterprise/* service layer**
- ❌ **NOT fixed SQL column references**
- ❌ **NOT unified role taxonomy**

**The certification report is INVALID.** It claims certification of code that cannot function.

---

## ATTESTATION

This audit was conducted in hostile mode with READ-ONLY access.
No code was modified during this audit.
All findings are based on traced execution paths, not spec documents.

**Auditor:** Claude Code (Opus 4.5)
**Date:** 2025-12-27
