# Enterprise Existing State Report

**Author:** TEAM CODE (Ground-Truth Extractor)
**Date:** 2025-12-27
**Mode:** READ-ONLY DISCOVERY
**Purpose:** Map reality before Enterprise design

---

## Executive Summary

**The "Enterprise" concept exists only in documentation, not in implementation.**

| Aspect | Expected (from docs) | Actual (from code) |
|--------|---------------------|-------------------|
| Enterprise Table | `enterprises` table | DOES NOT EXIST |
| Enterprise ID on Users | `enterprise_id` | DOES NOT EXIST (uses `tenant_id`) |
| Enterprise Admin Role | `ENTERPRISE_ADMIN` | DOES NOT EXIST (uses `TENANT_ADMIN`) |
| Enterprise APIs | `/api/enterprise/*` | DO NOT EXIST |
| Enterprise UI | Enterprise Admin screens | DO NOT EXIST |
| Workspaces Table | `workspaces` table | DOES NOT EXIST |
| Policy Ownership | Enterprise-scoped | GLOBAL ONLY |

**Critical Finding:** The architecture documents (e.g., `enterprise-admin-user-management-and-operations.md`) describe an intended design that has NOT been implemented. The resolver code references tables and concepts that do not exist in the database.

---

## 1. What Exists (Confirmed)

### 1.1 Tenants Table (NOT Enterprises)

```sql
-- Location: prisma/migrations/VS10_users_tenants_profiles.sql
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  domain VARCHAR(255),
  plan VARCHAR(50) CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
  subscription_status VARCHAR(50),
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  max_users INTEGER DEFAULT 3,
  max_discoveries_per_month INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB
);
```

**Key Observation:** `plan = 'enterprise'` is just a pricing tier, NOT an organizational concept.

### 1.2 Users Table

```sql
-- Location: prisma/migrations/VS10_users_tenants_profiles.sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),  -- NO enterprise_id
  role VARCHAR(50) CHECK (role IN ('TENANT_USER', 'TENANT_ADMIN', 'SUPER_ADMIN', 'READ_ONLY')),
  -- ... other fields
);
```

**Key Observation:** No `ENTERPRISE_ADMIN` role exists.

### 1.3 Role Hierarchy (Actual)

```typescript
// Location: lib/auth/rbac/types.ts
export type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'TENANT_USER' | 'READ_ONLY';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  TENANT_ADMIN: 75,
  TENANT_USER: 50,
  READ_ONLY: 25,
};
```

**Key Observation:** `ENTERPRISE_ADMIN` does not exist in the actual codebase.

### 1.4 OS Workspace Bindings Table

```sql
-- Columns confirmed from code:
os_workspace_bindings (
  id UUID,
  tenant_id UUID,           -- Tenant-scoped, NOT enterprise-scoped
  workspace_id VARCHAR,     -- References non-existent workspaces table
  vertical_id UUID,
  sub_vertical_id UUID,
  persona_id UUID,
  is_active BOOLEAN
);
```

**Key Observation:** Bindings are tenant-scoped. No enterprise_id column.

### 1.5 OS Personas Table (GLOBAL)

```sql
-- From migrations and lib code:
os_personas (
  id UUID,
  sub_vertical_id UUID,
  key VARCHAR,
  name VARCHAR,
  scope VARCHAR(20) DEFAULT 'GLOBAL',  -- All personas are GLOBAL
  region_code VARCHAR(20),
  is_active BOOLEAN
);
```

**Key Observation:** No `enterprise_id` column. All personas are GLOBAL.

### 1.6 OS Persona Policies Table (GLOBAL)

```sql
os_persona_policies (
  id UUID,
  persona_id UUID,
  policy_version INTEGER,
  status VARCHAR(20),  -- DRAFT, STAGED, ACTIVE, DEPRECATED
  allowed_intents JSONB,
  forbidden_outputs JSONB,
  -- ... other policy fields
);
```

**Key Observation:** No `enterprise_id`. Policies are attached to global personas.

---

## 2. What Partially Exists

### 2.1 Auto-Activation Resolver (References Non-Existent Tables)

```typescript
// Location: lib/resolver/auto-activation-resolver.ts

// This code REFERENCES a workspaces table that does not exist:
const existing = await queryOne<WorkspaceRow>(
  `SELECT * FROM workspaces
   WHERE tenant_id = $1 AND is_default = true AND is_active = true`,
  [tenantId]
);
```

**Status:** Code exists but will FAIL at runtime because `workspaces` table does not exist.

### 2.2 User Type Detection (Based on Plan, Not Enterprise)

```typescript
// Location: lib/resolver/auto-activation-resolver.ts
function getUserType(tenantPlan: TenantRow['plan']): 'enterprise' | 'individual' {
  return tenantPlan === 'enterprise' ? 'enterprise' : 'individual';
}
```

**Status:** This is a pricing-based check, NOT an organizational enterprise check.

### 2.3 Workspace Types (Defined But Not Used)

```typescript
// Location: lib/workspace/types.ts
export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: WorkspacePlan;
  settings: WorkspaceSettings;
}
```

**Status:** TypeScript types exist but no corresponding database table.

### 2.4 Demo Mode (Session-Based, Not Enterprise-Based)

```typescript
// Location: lib/demo/types.ts
export interface DemoModeState {
  isDemo: boolean;
  userId: string;
  sessionId: string;
  // ... session-level demo tracking
}
```

**Status:** Demo is session-based. No `is_demo` flag on tenants or enterprises.

---

## 3. What Does NOT Exist

### 3.1 Enterprise Table
- **Expected:** `CREATE TABLE enterprises (...)`
- **Actual:** DOES NOT EXIST
- **Impact:** No way to group tenants under an enterprise

### 3.2 Enterprise Admin Role
- **Expected:** `ENTERPRISE_ADMIN` role with scoped powers
- **Actual:** DOES NOT EXIST
- **Impact:** No mid-tier admin between TENANT_ADMIN and SUPER_ADMIN

### 3.3 Enterprise APIs
- **Expected:** `/api/enterprise/*` endpoints
- **Actual:** Directory `app/api/enterprise/` DOES NOT EXIST
- **Impact:** No enterprise-specific functionality

### 3.4 Enterprise UI Screens
- **Expected:** Enterprise Admin dashboard, team views
- **Actual:** DOES NOT EXIST
- **Impact:** No enterprise management interface

### 3.5 Workspaces Table
- **Expected:** `CREATE TABLE workspaces (...)`
- **Actual:** DOES NOT EXIST (only types in lib/workspace/types.ts)
- **Impact:** Resolver code will fail at runtime

### 3.6 Enterprise-Scoped Personas/Policies
- **Expected:** `enterprise_id` on `os_personas` or `os_persona_policies`
- **Actual:** DOES NOT EXIST
- **Impact:** No enterprise-specific persona overrides possible

### 3.7 Cross-Vertical Reassignment Approval Flow
- **Expected:** `/api/superadmin/approvals` for cross-vertical requests
- **Actual:** DOES NOT EXIST
- **Impact:** Doc-described workflow not implemented

### 3.8 Enterprise Demo Flag
- **Expected:** `is_demo` or `demo_expires_at` on enterprise/tenant
- **Actual:** DOES NOT EXIST (demo is session-based only)
- **Impact:** No enterprise-level demo management

---

## 4. Risk Areas / Ambiguities

### 4.1 Resolver Will Fail

The `auto-activation-resolver.ts` calls:
```sql
SELECT * FROM workspaces WHERE tenant_id = $1
```

This table does not exist. The resolver will throw a PostgreSQL error at runtime.

### 4.2 Tenant vs Enterprise Confusion

The codebase conflates "tenant" and "enterprise":
- `tenant.plan = 'enterprise'` means pricing tier
- Docs describe `enterprise` as organizational unit
- These are different concepts with same naming

### 4.3 No Enterprise Hierarchy

Current model: Flat `tenant → users`
Desired model (from docs): `enterprise → tenants? → users` or `enterprise → workspaces → users`

No intermediate grouping exists.

### 4.4 Policy Ownership Gap

Current: `persona → policy` (global)
Desired (from docs): `enterprise → persona_override → policy_override`

No enterprise override mechanism exists.

### 4.5 RLS Only on Tenant, Not Enterprise

```sql
-- Current RLS policies reference tenant_id only:
CREATE POLICY tenant_isolation ON tenants
  FOR ALL USING (id = current_setting('app.tenant_id', true)::UUID);
```

No enterprise-level RLS exists.

---

## 5. Open Questions (Strictly Factual)

1. **Is `tenant` intended to be renamed to `enterprise`?**
   - The schema uses `tenants`, but docs use `enterprise`

2. **What is the relationship: enterprise → tenant → workspace → user?**
   - Currently only: `tenant → user` exists

3. **Should personas be enterprise-scoped or remain global?**
   - Currently GLOBAL. No override mechanism.

4. **Where should workspaces table be created?**
   - Referenced in resolver but does not exist

5. **Is ENTERPRISE_ADMIN a separate role or alias for TENANT_ADMIN?**
   - Currently TENANT_ADMIN is the only mid-tier role

6. **Should demo mode be enterprise-level or tenant-level?**
   - Currently session-level only

---

## File References

| File | Contains |
|------|----------|
| `prisma/migrations/VS10_users_tenants_profiles.sql` | tenants, users, user_profiles tables |
| `prisma/migrations/controlplane_v2_phase1.sql` | os_personas, os_persona_policies additions |
| `prisma/migrations/S269_resolver_audit_log.sql` | os_workspace_bindings references |
| `lib/auth/rbac/types.ts` | Role definitions (no ENTERPRISE_ADMIN) |
| `lib/resolver/auto-activation-resolver.ts` | References non-existent workspaces table |
| `lib/workspace/types.ts` | TypeScript types (no DB implementation) |
| `docs/architecture/enterprise-admin-user-management-and-operations.md` | Desired design (NOT implemented) |

---

## Summary Table

| Entity | DB Table | API Endpoints | UI Screens | Status |
|--------|----------|---------------|------------|--------|
| Enterprise | - | - | - | DOES NOT EXIST |
| Tenant | `tenants` | `/api/admin/*` | Dashboard/Admin | EXISTS |
| User | `users` | `/api/admin/users` | Settings/Team | EXISTS |
| Workspace | - | - | - | DOES NOT EXIST (only types) |
| Enterprise Admin | - | - | - | DOES NOT EXIST |
| Persona | `os_personas` | `/api/superadmin/controlplane/*` | Super Admin CP | EXISTS (GLOBAL only) |
| Policy | `os_persona_policies` | `/api/superadmin/controlplane/*` | Super Admin CP | EXISTS (GLOBAL only) |
| Workspace Binding | `os_workspace_bindings` | `/api/superadmin/controlplane/bindings` | Super Admin CP | EXISTS (tenant-scoped) |

---

## Conclusion

**Enterprise as described in architecture documents DOES NOT EXIST in the codebase.**

The only "enterprise" reference is `tenant.plan = 'enterprise'`, which is a pricing tier flag, not an organizational concept.

Before any Enterprise sprint can begin, the following must be decided:
1. Create new `enterprises` table vs rename `tenants`
2. Define enterprise → tenant → workspace → user hierarchy
3. Add `ENTERPRISE_ADMIN` role
4. Create `/api/enterprise/*` endpoints
5. Create `workspaces` table (resolver depends on it)
6. Decide persona/policy ownership model

**This report contains no recommendations. Only facts.**

---

*END OF REPORT*
