# Enterprise Migration Strategy & Rollback Plan

**Sprint:** S281 - Migration Strategy & Rollback Plan
**Date:** 2025-12-27
**Status:** LOCKED - Follow exactly as written

---

## Executive Summary

This document defines the backward-safe migration strategy from the tenant model to the enterprise model. The migration is designed to:

1. **Zero downtime** - No service interruption
2. **Reversible** - Can rollback at any phase
3. **Incremental** - Each step is independently deployable
4. **Feature-flagged** - Old and new paths coexist

---

## Migration Phases

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MIGRATION TIMELINE                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Phase 1: PARALLEL TABLES (S282-S287)                               │
│  ─────────────────────────────────────                              │
│  • Create new tables alongside existing                             │
│  • No data migration yet                                            │
│  • Feature flags: OFF                                               │
│  • Risk: LOW                                                        │
│  • Rollback: DROP new tables                                        │
│                                                                     │
│  Phase 2: DATA MIGRATION (S288)                                     │
│  ─────────────────────────────────                                  │
│  • Copy tenants → enterprises                                       │
│  • Create default workspaces                                        │
│  • Update user FKs                                                  │
│  • Feature flags: OFF (migration only)                              │
│  • Risk: MEDIUM                                                     │
│  • Rollback: Restore from backup                                    │
│                                                                     │
│  Phase 3: CODE MIGRATION (S288A)                                    │
│  ──────────────────────────────────                                 │
│  • Global rename in codebase                                        │
│  • Update all queries                                               │
│  • Feature flags: ON for dev/staging                                │
│  • Risk: MEDIUM                                                     │
│  • Rollback: Revert git commit                                      │
│                                                                     │
│  Phase 4: CUTOVER (S298A+)                                          │
│  ──────────────────────────                                         │
│  • Enable RLS on enterprise_id                                      │
│  • Feature flags: ON for production                                 │
│  • Drop old tenant columns (after validation)                       │
│  • Risk: HIGH                                                       │
│  • Rollback: Disable feature flags                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Parallel Tables (S282-S287)

### Strategy

Create all new tables without touching existing data. This is safe and reversible.

### Migration Scripts

#### S282: enterprises table

```sql
-- prisma/migrations/S282_enterprises_table.sql

-- Create enterprises table (parallel to tenants)
CREATE TABLE IF NOT EXISTS enterprises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  industry VARCHAR(100),
  type VARCHAR(20) NOT NULL DEFAULT 'REAL' CHECK (type IN ('REAL', 'DEMO')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  plan VARCHAR(50) CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
  demo_expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Backward compatibility: link to original tenant
  legacy_tenant_id UUID UNIQUE
);

-- Index for lookups
CREATE INDEX idx_enterprises_type ON enterprises(type);
CREATE INDEX idx_enterprises_status ON enterprises(status);
CREATE INDEX idx_enterprises_legacy ON enterprises(legacy_tenant_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_enterprises_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enterprises_updated_at
  BEFORE UPDATE ON enterprises
  FOR EACH ROW EXECUTE FUNCTION update_enterprises_updated_at();
```

#### S283: workspaces table

```sql
-- prisma/migrations/S283_workspaces_table.sql

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100),
  is_default BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_default_per_enterprise
    EXCLUDE (enterprise_id WITH =) WHERE (is_default = true)
);

CREATE INDEX idx_workspaces_enterprise ON workspaces(enterprise_id);
CREATE INDEX idx_workspaces_default ON workspaces(enterprise_id, is_default) WHERE is_default = true;
```

#### S284: users table extension

```sql
-- prisma/migrations/S284_users_extension.sql

-- Add new columns to existing users table (nullable for migration)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS enterprise_id UUID REFERENCES enterprises(id),
  ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id),
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS demo_type VARCHAR(20) CHECK (demo_type IN ('SYSTEM', 'ENTERPRISE')),
  ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMP WITH TIME ZONE;

-- Index for new columns
CREATE INDEX IF NOT EXISTS idx_users_enterprise ON users(enterprise_id);
CREATE INDEX IF NOT EXISTS idx_users_workspace ON users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_users_demo ON users(is_demo) WHERE is_demo = true;
```

#### S285: role taxonomy update

```sql
-- prisma/migrations/S285_role_taxonomy.sql

-- Update role CHECK constraint to include new roles
-- This is done by creating a new constraint and dropping the old

-- Step 1: Drop old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Step 2: Add new constraint with all roles
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
  role IN (
    'SUPER_ADMIN',
    'ENTERPRISE_ADMIN',
    'ENTERPRISE_USER',
    'INDIVIDUAL_USER',
    -- Keep old roles during migration
    'TENANT_ADMIN',
    'TENANT_USER',
    'READ_ONLY'
  )
);
```

#### S286: demo_policies table

```sql
-- prisma/migrations/S286_demo_policies.sql

CREATE TABLE IF NOT EXISTS demo_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  scope VARCHAR(30) NOT NULL CHECK (
    scope IN ('INDIVIDUAL_REAL', 'INDIVIDUAL_SYSTEM', 'ENTERPRISE')
  ),
  max_duration_days INTEGER,
  idle_expiry_hours INTEGER,
  max_users INTEGER,
  max_actions_per_day INTEGER,
  allow_exports BOOLEAN DEFAULT false,
  allow_automation BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_demo_policies_scope ON demo_policies(scope);
CREATE INDEX idx_demo_policies_active ON demo_policies(is_active) WHERE is_active = true;
```

#### S286A: campaigns/templates tables

```sql
-- prisma/migrations/S286A_campaigns_templates.sql

-- Enterprise campaigns
CREATE TABLE IF NOT EXISTS enterprise_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  settings JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign assets
CREATE TABLE IF NOT EXISTS campaign_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES enterprise_campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message templates
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id UUID NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  body TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'email' CHECK (type IN ('email', 'sms', 'linkedin', 'whatsapp')),
  variables JSONB DEFAULT '[]',
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_campaigns_enterprise ON enterprise_campaigns(enterprise_id);
CREATE INDEX idx_templates_enterprise ON message_templates(enterprise_id);
```

### Rollback for Phase 1

```sql
-- ROLLBACK Phase 1: Drop all new tables
DROP TABLE IF EXISTS message_templates CASCADE;
DROP TABLE IF EXISTS campaign_assets CASCADE;
DROP TABLE IF EXISTS enterprise_campaigns CASCADE;
DROP TABLE IF EXISTS demo_policies CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS enterprises CASCADE;

-- Remove new columns from users
ALTER TABLE users
  DROP COLUMN IF EXISTS enterprise_id,
  DROP COLUMN IF EXISTS workspace_id,
  DROP COLUMN IF EXISTS is_demo,
  DROP COLUMN IF EXISTS demo_type,
  DROP COLUMN IF EXISTS demo_expires_at;

-- Restore original role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (
  role IN ('SUPER_ADMIN', 'TENANT_ADMIN', 'TENANT_USER', 'READ_ONLY')
);
```

---

## Phase 2: Data Migration (S288)

### Strategy

Copy data from tenants to enterprises. Keep both systems in sync during migration window.

### Migration Script

```sql
-- prisma/migrations/S288_data_migration.sql

-- Step 1: Migrate tenants to enterprises
INSERT INTO enterprises (
  id,
  name,
  domain,
  type,
  status,
  plan,
  metadata,
  created_at,
  legacy_tenant_id
)
SELECT
  id,
  name,
  domain,
  CASE
    WHEN is_active = false THEN 'suspended'
    ELSE 'REAL'
  END,
  CASE
    WHEN is_active = true THEN 'active'
    ELSE 'suspended'
  END,
  plan,
  COALESCE(metadata, '{}'),
  created_at,
  id  -- legacy_tenant_id = original tenant id
FROM tenants
ON CONFLICT (legacy_tenant_id) DO NOTHING;

-- Step 2: Create default workspace for each enterprise
INSERT INTO workspaces (enterprise_id, name, slug, is_default)
SELECT
  e.id,
  e.name || ' - Default Workspace',
  LOWER(REPLACE(e.name, ' ', '-')) || '-default',
  true
FROM enterprises e
WHERE NOT EXISTS (
  SELECT 1 FROM workspaces w
  WHERE w.enterprise_id = e.id AND w.is_default = true
);

-- Step 3: Update users with enterprise_id and workspace_id
UPDATE users u
SET
  enterprise_id = e.id,
  workspace_id = (
    SELECT w.id FROM workspaces w
    WHERE w.enterprise_id = e.id AND w.is_default = true
    LIMIT 1
  ),
  is_demo = false
FROM enterprises e
WHERE u.tenant_id = e.legacy_tenant_id
  AND u.enterprise_id IS NULL;

-- Step 4: Migrate roles
UPDATE users SET role = 'ENTERPRISE_ADMIN' WHERE role = 'TENANT_ADMIN';
UPDATE users SET role = 'ENTERPRISE_USER' WHERE role = 'TENANT_USER' AND enterprise_id IS NOT NULL;
UPDATE users SET role = 'INDIVIDUAL_USER' WHERE role = 'TENANT_USER' AND enterprise_id IS NULL;
UPDATE users SET role = 'INDIVIDUAL_USER' WHERE role = 'READ_ONLY';

-- Step 5: Verify migration
DO $$
DECLARE
  tenant_count INTEGER;
  enterprise_count INTEGER;
  orphan_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO tenant_count FROM tenants;
  SELECT COUNT(*) INTO enterprise_count FROM enterprises;
  SELECT COUNT(*) INTO orphan_users FROM users WHERE tenant_id IS NOT NULL AND enterprise_id IS NULL;

  IF enterprise_count < tenant_count THEN
    RAISE EXCEPTION 'Migration incomplete: % tenants, % enterprises', tenant_count, enterprise_count;
  END IF;

  IF orphan_users > 0 THEN
    RAISE EXCEPTION 'Found % orphaned users without enterprise_id', orphan_users;
  END IF;

  RAISE NOTICE 'Migration verified: % enterprises, 0 orphaned users', enterprise_count;
END $$;
```

### Rollback for Phase 2

```sql
-- ROLLBACK Phase 2: Restore original state

-- Step 1: Restore original roles
UPDATE users SET role = 'TENANT_ADMIN' WHERE role = 'ENTERPRISE_ADMIN';
UPDATE users SET role = 'TENANT_USER' WHERE role IN ('ENTERPRISE_USER', 'INDIVIDUAL_USER');

-- Step 2: Clear enterprise references
UPDATE users SET enterprise_id = NULL, workspace_id = NULL;

-- Step 3: Clear workspaces
DELETE FROM workspaces;

-- Step 4: Clear enterprises
DELETE FROM enterprises;
```

---

## Phase 3: Code Migration (S288A)

### Strategy

Global search-and-replace with feature flag gating. Keep backward compatibility layer.

### Code Changes

All code changes are feature-flagged:

```typescript
// lib/enterprise/backward-compat.ts

import { isFeatureEnabled } from '@/lib/config/feature-flags';

export function getEntityIdColumn(): string {
  return isFeatureEnabled('enterprise_mode') ? 'enterprise_id' : 'tenant_id';
}

export function getEntityTable(): string {
  return isFeatureEnabled('enterprise_mode') ? 'enterprises' : 'tenants';
}

export function getRlsSetting(): string {
  return isFeatureEnabled('enterprise_mode') ? 'app.enterprise_id' : 'app.tenant_id';
}
```

### Rollback for Phase 3

```bash
# ROLLBACK Phase 3: Revert code changes
git revert HEAD~1  # Revert S288A commit

# Or disable feature flag
# Set ff_enterprise_mode to disabled in all environments
```

---

## Phase 4: Cutover (After Phase C)

### Strategy

Enable enterprise RLS, disable tenant paths, drop legacy columns.

### Cutover Steps

```sql
-- Step 1: Enable enterprise RLS (S298A)
ALTER TABLE enterprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY enterprise_isolation ON enterprises
  FOR ALL USING (id = current_setting('app.enterprise_id', true)::UUID);

CREATE POLICY workspace_enterprise_isolation ON workspaces
  FOR ALL USING (enterprise_id = current_setting('app.enterprise_id', true)::UUID);

-- Step 2: Add NOT NULL constraint to enterprise_id (after validation)
-- Only run after confirming all users have enterprise_id
ALTER TABLE users ALTER COLUMN enterprise_id SET NOT NULL;

-- Step 3: Drop legacy columns (after full validation, Phase I)
-- This is IRREVERSIBLE - only run after Final Certification
ALTER TABLE users DROP COLUMN tenant_id;
DROP TABLE tenants;
```

### Rollback for Phase 4

```sql
-- ROLLBACK Phase 4: Disable RLS, restore nullable
ALTER TABLE enterprises DISABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS enterprise_isolation ON enterprises;
DROP POLICY IF EXISTS workspace_enterprise_isolation ON workspaces;

ALTER TABLE users ALTER COLUMN enterprise_id DROP NOT NULL;
```

---

## Backup Strategy

### Before Each Phase

```bash
# Create backup before Phase 2 (data migration)
pg_dump -h localhost -p 5433 -U upr_app -d upr_production \
  --format=custom \
  --file="backup_pre_phase2_$(date +%Y%m%d_%H%M%S).dump"

# Verify backup
pg_restore --list backup_pre_phase2_*.dump | head -20
```

### Point-in-Time Recovery

Ensure Cloud SQL has PITR enabled:

```bash
gcloud sql instances describe upr-postgres --format="value(settings.backupConfiguration)"
```

---

## Validation Gates

### Gate 1: After Phase B (S288)

```bash
# Run validation script
psql -h localhost -p 5433 -U upr_app -d upr_production <<EOF
SELECT
  'tenants' as table_name, COUNT(*) as count FROM tenants
UNION ALL
SELECT 'enterprises', COUNT(*) FROM enterprises
UNION ALL
SELECT 'workspaces', COUNT(*) FROM workspaces
UNION ALL
SELECT 'users_with_enterprise', COUNT(*) FROM users WHERE enterprise_id IS NOT NULL
UNION ALL
SELECT 'orphaned_users', COUNT(*) FROM users WHERE tenant_id IS NOT NULL AND enterprise_id IS NULL;
EOF
```

Expected output:
- enterprises count = tenants count
- orphaned_users = 0

### Gate 2: After Phase C (S298)

```bash
# API curl tests
curl -s -X POST "$STAGING_URL/api/enterprise" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Enterprise", "type": "REAL"}' \
  | jq '.success'
# Expected: true

curl -s "$STAGING_URL/api/enterprise/TEST_ID" | jq '.enterprise.type'
# Expected: "REAL"
```

### Gate 3: RLS Isolation Test (Before Phase D)

```bash
# Test cross-enterprise isolation
# As Enterprise A, try to read Enterprise B data
# Should return empty or 403
```

---

## Emergency Contacts

| Scenario | Action |
|----------|--------|
| Migration fails mid-way | Restore from backup |
| Data corruption detected | Enable PITR recovery |
| Feature flag issue | Disable via admin UI |
| Production incident | Rollback to previous deploy |

---

## Timeline Estimates

| Phase | Duration | Risk |
|-------|----------|------|
| Phase 1 (Tables) | 1 day | LOW |
| Phase 2 (Data) | 2 hours | MEDIUM |
| Phase 3 (Code) | 2 days | MEDIUM |
| Phase 4 (Cutover) | 1 day | HIGH |

Total: ~5 days for database migration

---

*This strategy is LOCKED. Execute exactly as documented.*
