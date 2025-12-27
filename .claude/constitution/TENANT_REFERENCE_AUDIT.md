# Tenant Reference Audit Report

**Sprint:** S279 - Spec Constitution & Codebase Audit
**Date:** 2025-12-27
**Purpose:** Map all tenant references before enterprise migration

---

## Summary Statistics

| Reference Type | Count | Impact |
|----------------|-------|--------|
| `tenant_id` in .ts files | 217 | HIGH - All need rename to `enterprise_id` |
| `tenant_id` in .tsx files | 19 | MEDIUM - Frontend components |
| `tenant_id` in .sql files | 47 | CRITICAL - DB schemas/migrations |
| `tenants` table references | 93 | CRITICAL - Entity name change |
| `TENANT_ADMIN` role | 25 | HIGH - Role rename/restructure |
| `TENANT_USER` role | 13 | HIGH - Role rename/restructure |

**Total References to Migrate: ~414**

---

## Files by Category

### 1. Database Migrations (CRITICAL)

```
prisma/migrations/VS10_users_tenants_profiles.sql     - tenants table definition
prisma/migrations/VS12_signals_scores_pipeline.sql    - tenant references
prisma/migrations/S253_user_preferences.sql           - tenant_id FK, RLS
prisma/migrations/S269_resolver_audit_log.sql         - tenant_id in audit
prisma/migrations/S270_idempotent_activation.sql      - tenant_id bindings
prisma/migrations/S50_journey_run_history.sql         - tenant_id tracking
prisma/migrations/api_integrations_table.sql          - tenant_id FK
```

### 2. Core Authentication & Session (CRITICAL)

```
lib/auth/rbac/types.ts                 - TENANT_ADMIN, TENANT_USER roles
lib/auth/rbac/enforcement.ts           - tenant_id enforcement
lib/auth/session.ts                    - tenant context
lib/auth/session/enhanced-session.ts   - tenant session data
middleware.ts                          - tenant middleware
```

### 3. Tenant Management (HIGH)

```
lib/tenant/isolation-policy.ts         - tenant isolation
lib/tenant/tenant-context.ts           - tenant context provider
lib/tenant/activity-boundary.ts        - tenant activity tracking
lib/tenant/api-keys.ts                 - tenant API keys
lib/tenant/rate-limiter.ts             - tenant rate limiting
lib/tenant/types.ts                    - tenant type definitions
lib/tenant/index.ts                    - tenant exports
```

### 4. API Routes (HIGH)

```
app/api/auth/login/route.ts            - tenant login
app/api/auth/signup/route.ts           - tenant signup
app/api/admin/users/route.ts           - tenant user management
app/api/admin/users/[id]/route.ts      - tenant user details
app/api/admin/setup/route.ts           - tenant setup
app/api/os/discovery/route.ts          - tenant OS discovery
app/api/os/score/route.ts              - tenant scoring
app/api/os/rank/route.ts               - tenant ranking
app/api/superadmin/controlplane/*      - tenant bindings
```

### 5. Frontend Components (MEDIUM)

```
components/admin/TenantTable.tsx       - tenant table UI
components/admin/ImpersonationBanner.tsx - tenant impersonation
app/dashboard/admin/page.tsx           - tenant admin dashboard
app/superadmin/page.tsx                - tenant list view
```

### 6. Services & Libraries (HIGH)

```
lib/db/users.ts                        - tenant user queries
lib/os-client.ts                       - tenant OS client
lib/os/discovery-api.ts                - tenant discovery
lib/resolver/auto-activation-resolver.ts - tenant resolver (BROKEN)
lib/billing/usage-metering.ts          - tenant billing
lib/integrations/siva-client.ts        - tenant SIVA integration
```

---

## RLS Policies to Migrate

Files with `app.tenant_id` RLS setting:

1. `prisma/migrations/VS10_users_tenants_profiles.sql`
   - RLS policy on `tenants` table
   - Uses `current_setting('app.tenant_id')`

2. `prisma/migrations/S253_user_preferences.sql`
   - RLS policy on `user_preferences`
   - Uses `current_setting('app.tenant_id')`

**Action Required:** All RLS policies must be migrated to `app.enterprise_id`

---

## Role Migration Map

| Current Role | New Role | Notes |
|--------------|----------|-------|
| `SUPER_ADMIN` | `SUPER_ADMIN` | No change |
| `TENANT_ADMIN` | `ENTERPRISE_ADMIN` | Scope: One enterprise |
| `TENANT_USER` | `ENTERPRISE_USER` or `INDIVIDUAL_USER` | Context-dependent |
| `READ_ONLY` | (Remove or keep) | Evaluate need |

**New Roles to Add:**
- `ENTERPRISE_USER` - One workspace scope
- `INDIVIDUAL_USER` - Personal scope (REAL or DEMO_SYSTEM)

---

## Known Issues

### 1. Auto-Activation Resolver (BROKEN)

```typescript
// lib/resolver/auto-activation-resolver.ts
// References non-existent 'workspaces' table
const existing = await queryOne<WorkspaceRow>(
  `SELECT * FROM workspaces WHERE tenant_id = $1`,
  [tenantId]
);
```

**Status:** Will fail at runtime. Must be fixed in S297.

### 2. Tenant Context Provider

```typescript
// lib/tenant/tenant-context.ts
// Entire module needs enterprise rename
```

### 3. Session Enhancement

```typescript
// lib/auth/session/enhanced-session.ts
// tenant_id baked into session structure
```

---

## Migration Strategy

### Phase B Approach (S282-S288A)

1. **Create new tables alongside old** (enterprises, workspaces)
2. **Add enterprise_id columns** (nullable initially)
3. **Migrate data** (tenants → enterprises)
4. **Update foreign keys** (tenant_id → enterprise_id)
5. **Rename roles** in CHECK constraints
6. **Update RLS policies** (app.tenant_id → app.enterprise_id)
7. **Drop old columns/tables** (after verification)

### Backward Compatibility

- Keep `tenant_id` as alias/computed column during transition
- Use database views for gradual migration
- Feature flag for enterprise mode

---

## Files Requiring NO Changes

These files use "tenant" in documentation/comments only:
- `README.md`
- Various `.md` docs
- Test fixtures (will update separately)

---

## Next Steps

1. **S280:** Create feature flags, map all references
2. **S281:** Design migration SQL scripts
3. **S282-S288:** Execute DB migrations
4. **S288A:** Global rename across codebase

---

*This audit is complete. Proceed to S280.*
