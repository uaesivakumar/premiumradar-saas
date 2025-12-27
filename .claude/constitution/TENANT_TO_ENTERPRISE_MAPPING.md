# Tenant to Enterprise Migration Mapping

**Sprint:** S280 - Tenant Reference Mapping & Feature Flags
**Date:** 2025-12-27
**Purpose:** Detailed mapping for S288A global rename

---

## Global Rename Rules

| Old Term | New Term | Scope |
|----------|----------|-------|
| `tenant` | `enterprise` | Entity name |
| `tenants` | `enterprises` | Table name |
| `tenant_id` | `enterprise_id` | Column/FK |
| `TENANT_ADMIN` | `ENTERPRISE_ADMIN` | Role |
| `TENANT_USER` | `ENTERPRISE_USER` / `INDIVIDUAL_USER` | Role (context-dependent) |
| `app.tenant_id` | `app.enterprise_id` | RLS setting |
| `TenantContext` | `EnterpriseContext` | Context provider |
| `tenantId` | `enterpriseId` | Variable names |

---

## File-by-File Migration Map

### CRITICAL: Database Migrations

| File | Changes Required |
|------|------------------|
| `prisma/migrations/VS10_users_tenants_profiles.sql` | Rename table `tenants` → `enterprises`, add new columns |
| `prisma/migrations/VS12_signals_scores_pipeline.sql` | Update FKs |
| `prisma/migrations/S253_user_preferences.sql` | Update RLS policy |
| `prisma/migrations/S269_resolver_audit_log.sql` | Update tenant_id → enterprise_id |
| `prisma/migrations/S270_idempotent_activation.sql` | Update bindings |
| `prisma/migrations/S50_journey_run_history.sql` | Update tenant_id |
| `prisma/migrations/api_integrations_table.sql` | Update tenant_id FK |

### CRITICAL: Authentication & Session

| File | Changes Required |
|------|------------------|
| `lib/auth/rbac/types.ts` | Add ENTERPRISE_ADMIN, ENTERPRISE_USER, INDIVIDUAL_USER roles |
| `lib/auth/rbac/enforcement.ts` | Update tenant_id → enterprise_id in checks |
| `lib/auth/session.ts` | Update session to carry enterprise_id |
| `lib/auth/session/enhanced-session.ts` | Update tenant_id → enterprise_id |
| `middleware.ts` | Update tenant checks to enterprise |

### HIGH: Tenant Module → Enterprise Module

| File | Action |
|------|--------|
| `lib/tenant/` | RENAME entire directory to `lib/enterprise/` |
| `lib/tenant/isolation-policy.ts` | Rename to enterprise-isolation-policy.ts |
| `lib/tenant/tenant-context.ts` | Rename to enterprise-context.ts |
| `lib/tenant/activity-boundary.ts` | Update tenant → enterprise |
| `lib/tenant/api-keys.ts` | Update tenant → enterprise |
| `lib/tenant/rate-limiter.ts` | Update tenant → enterprise |
| `lib/tenant/types.ts` | Update type definitions |
| `lib/tenant/index.ts` | Update exports |

### HIGH: API Routes

| File | Changes |
|------|---------|
| `app/api/auth/login/route.ts` | Update tenant_id → enterprise_id |
| `app/api/auth/signup/route.ts` | Update tenant_id → enterprise_id |
| `app/api/admin/users/route.ts` | Update tenant queries |
| `app/api/admin/users/[id]/route.ts` | Update tenant checks |
| `app/api/admin/setup/route.ts` | Update tenant setup |
| `app/api/os/discovery/route.ts` | Update tenant_id param |
| `app/api/os/score/route.ts` | Update tenant_id param |
| `app/api/os/rank/route.ts` | Update tenant_id param |
| `app/api/superadmin/controlplane/bindings/route.ts` | Update tenant queries |

### HIGH: Services & Libraries

| File | Changes |
|------|---------|
| `lib/db/users.ts` | Update all tenant queries |
| `lib/os-client.ts` | Update tenant_id param |
| `lib/os/discovery-api.ts` | Update tenant_id param |
| `lib/resolver/auto-activation-resolver.ts` | MAJOR FIX: Use real workspaces table |
| `lib/billing/usage-metering.ts` | Update tenant_id |
| `lib/integrations/siva-client.ts` | Update tenant_id |

### MEDIUM: Frontend Components

| File | Changes |
|------|---------|
| `components/admin/TenantTable.tsx` | Rename to EnterpriseTable.tsx |
| `components/admin/ImpersonationBanner.tsx` | Update tenant refs |
| `app/dashboard/admin/page.tsx` | Update tenant admin dashboard |
| `app/superadmin/page.tsx` | Update tenant list view |

---

## Role Migration Details

### Current Roles (lib/auth/rbac/types.ts)

```typescript
// CURRENT
export type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'TENANT_USER' | 'READ_ONLY';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  TENANT_ADMIN: 75,
  TENANT_USER: 50,
  READ_ONLY: 25,
};
```

### New Roles (After Migration)

```typescript
// NEW
export type UserRole =
  | 'SUPER_ADMIN'
  | 'ENTERPRISE_ADMIN'
  | 'ENTERPRISE_USER'
  | 'INDIVIDUAL_USER';

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER_ADMIN: 100,
  ENTERPRISE_ADMIN: 75,
  ENTERPRISE_USER: 50,
  INDIVIDUAL_USER: 50,
};
```

### Role Mapping Logic

```typescript
// Migration logic for existing users
function migrateRole(oldRole: string, hasEnterprise: boolean): string {
  switch (oldRole) {
    case 'SUPER_ADMIN':
      return 'SUPER_ADMIN';
    case 'TENANT_ADMIN':
      return 'ENTERPRISE_ADMIN';
    case 'TENANT_USER':
      return hasEnterprise ? 'ENTERPRISE_USER' : 'INDIVIDUAL_USER';
    case 'READ_ONLY':
      return 'INDIVIDUAL_USER'; // Deprecated
    default:
      return 'INDIVIDUAL_USER';
  }
}
```

---

## RLS Migration Details

### Current RLS (VS10_users_tenants_profiles.sql)

```sql
-- Current tenant isolation
CREATE POLICY tenant_isolation ON tenants
  FOR ALL USING (id = current_setting('app.tenant_id', true)::UUID);
```

### New RLS (After Migration)

```sql
-- New enterprise isolation
CREATE POLICY enterprise_isolation ON enterprises
  FOR ALL USING (id = current_setting('app.enterprise_id', true)::UUID);

-- Additional: Demo user exclusion from real metrics
CREATE POLICY demo_exclusion ON enterprises
  FOR SELECT USING (
    type = 'REAL' OR
    current_setting('app.include_demo', true)::BOOLEAN = true
  );
```

---

## Session Context Migration

### Current Session Structure

```typescript
// Current
interface Session {
  user: {
    id: string;
    email: string;
    tenant_id: string;
    role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'TENANT_USER' | 'READ_ONLY';
  };
}
```

### New Session Structure

```typescript
// New
interface Session {
  user: {
    id: string;
    email: string;
    enterprise_id: string | null;  // null for INDIVIDUAL_USER
    workspace_id: string | null;   // null for admins
    role: UserRole;
    is_demo: boolean;
    demo_type: 'SYSTEM' | 'ENTERPRISE' | null;
  };
}
```

---

## Feature Flag Gating

All changes should be gated behind feature flags for safe rollout:

```typescript
// Check before using new enterprise model
if (isFeatureEnabled('enterprise_mode')) {
  // Use enterprise_id
} else {
  // Fall back to tenant_id
}
```

### Flag Dependencies

```
ff_enterprise_mode (master switch)
├── ff_enterprise_admin_role
├── ff_workspaces
├── ff_demo_policy_system
├── ff_enterprise_rls
├── ff_ai_briefs
└── ff_evidence_packs
```

---

## Backward Compatibility Layer

During migration, maintain dual support:

```typescript
// lib/enterprise/backward-compat.ts
export function getEntityId(session: Session): string {
  if (isFeatureEnabled('enterprise_mode')) {
    return session.user.enterprise_id;
  }
  // @deprecated - fall back to tenant_id
  return session.user.tenant_id;
}

export function getEntityColumn(): string {
  if (isFeatureEnabled('enterprise_mode')) {
    return 'enterprise_id';
  }
  return 'tenant_id';
}
```

---

## Migration Sequence (S282-S288A)

1. **S282:** Create `enterprises` table (new, parallel to tenants)
2. **S283:** Create `workspaces` table
3. **S284:** Add new columns to `users` (enterprise_id, workspace_id, is_demo, etc.)
4. **S285:** Add new roles to CHECK constraint
5. **S286:** Create `demo_policies` table
6. **S286A:** Create campaigns/templates tables
7. **S287:** Create `os_stage_graphs` table
8. **S288:** Migrate data: tenants → enterprises
9. **S288A:** Global rename across codebase

---

## Validation Checkpoints

### After S288 (Data Migration)

```sql
-- Verify enterprise count matches tenant count
SELECT
  (SELECT COUNT(*) FROM tenants) as tenant_count,
  (SELECT COUNT(*) FROM enterprises) as enterprise_count;

-- Verify no orphaned users
SELECT COUNT(*) FROM users WHERE enterprise_id IS NULL AND role != 'INDIVIDUAL_USER';

-- Verify workspaces created
SELECT COUNT(*) FROM workspaces WHERE is_default = true;
```

### After S288A (Global Rename)

```bash
# Verify no remaining tenant_id references in active code
grep -r "tenant_id" --include="*.ts" --include="*.tsx" lib/ app/ | grep -v "// @deprecated" | wc -l
# Expected: 0

# Verify all roles updated
grep -r "TENANT_ADMIN\|TENANT_USER" --include="*.ts" lib/ app/ | wc -l
# Expected: 0
```

---

*This mapping is complete. Proceed to S281.*
