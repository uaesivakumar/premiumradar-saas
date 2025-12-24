# Super Admin User Management and Command Center

**Version:** 1.0
**Status:** LOCKED
**Last Updated:** 2025-12-24

---

## Purpose

Super Admin is the **founder-level control plane** for PremiumRadar. It provides read-only intelligence views powered by BTE signals and exclusive authority over personas and system configuration.

---

## Core Principles

### 1. Decisions, Not Metrics
- Super Admin sees **decisions** (who to act on, what's broken)
- Super Admin does **NOT** see raw metrics dashboards
- Aggregates first, drill-down only with explicit intent (logged)

### 2. Exclusive Authority
- Only Super Admin can create/edit/deprecate personas
- Only Super Admin can modify BTE thresholds
- Only Super Admin can extend demo periods
- Enterprise Admin = VIEW ONLY for personas

### 3. Full Audit Trail
- Every Super Admin action is logged
- MFA is mandatory
- Multiple Super Admins allowed

---

## Authentication (S264)

### Requirements
- Multiple Super Admins allowed
- MFA mandatory for all Super Admin actions
- Session timeout: 1 hour of inactivity
- Every action audited to `audit_log` table

### Role Definition
```typescript
type UserRole = 'SUPER_ADMIN' | 'ENTERPRISE_ADMIN' | 'USER';

// Super Admin capabilities
const SUPER_ADMIN_CAPABILITIES = [
  'view_all_enterprises',
  'view_enterprise_health',
  'view_demo_misuse',
  'view_product_friction',
  'create_persona',
  'edit_persona',
  'deprecate_persona',
  'bind_persona_subvertical',
  'modify_bte_thresholds',
  'extend_demo',
  'create_enterprise',
  'suspend_enterprise',
  'delete_enterprise',
];
```

---

## Read-Only Intelligence APIs (S264)

### GET /api/superadmin/enterprises/health
Returns aggregate health scores for all enterprises.

**Response:**
```json
{
  "enterprises": [
    {
      "enterprise_id": "uuid",
      "name": "Acme Corp",
      "type": "REAL",
      "health_score": 0.85,
      "active_users": 24,
      "nba_adoption_rate": 0.72,
      "at_risk": false
    }
  ]
}
```

**Data Source:** BTE signals aggregated by enterprise_id

### GET /api/superadmin/demos/misuse
Returns demos showing abuse patterns.

**Response:**
```json
{
  "flagged_demos": [
    {
      "enterprise_id": "uuid",
      "name": "Test Company",
      "misuse_type": "discovery_only",
      "days_since_last_action": 14,
      "nba_ignore_rate": 0.95,
      "recommendation": "expire"
    }
  ]
}
```

**Misuse Types:**
- `discovery_only` - Only using discovery, ignoring actions
- `inactive` - No activity for 7+ days
- `nba_ignore` - Ignoring >80% of recommendations

### GET /api/superadmin/product/friction
Returns product friction points from BTE signals.

**Response:**
```json
{
  "friction_points": [
    {
      "stage": "onboarding",
      "drop_off_rate": 0.23,
      "avg_hesitation_index": 3.2,
      "affected_users": 156
    }
  ]
}
```

---

## Persona Authority (S264)

### Only Super Admin Can:

#### Create Persona
```
POST /api/superadmin/personas
```

#### Edit Persona Rules
```
PATCH /api/superadmin/personas/:id
```

#### Bind Persona to Sub-Vertical
```
POST /api/superadmin/personas/:id/bind
Body: { "sub_vertical_id": "uuid" }
```

#### Deprecate Persona
```
POST /api/superadmin/personas/:id/deprecate
```

### Enterprise Admin Restrictions
- Can VIEW persona details
- CANNOT create, edit, bind, or deprecate personas
- Attempting restricted actions returns 403

---

## Data Model (S263)

### enterprises Table
```sql
CREATE TABLE enterprises (
  enterprise_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('REAL', 'DEMO')),
  region text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETED')),
  created_at timestamptz NOT NULL DEFAULT NOW()
);
```

### users Table
```sql
CREATE TABLE users (
  user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enterprise_id uuid NOT NULL REFERENCES enterprises(enterprise_id),
  workspace_id uuid NOT NULL,
  sub_vertical_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ENTERPRISE_ADMIN', 'USER')),
  mode text NOT NULL CHECK (mode IN ('REAL', 'DEMO')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'EXPIRED')),
  created_at timestamptz NOT NULL DEFAULT NOW()
);

-- Constraints:
-- One user → one enterprise
-- One user → one workspace
-- One user → one sub-vertical
```

---

## Hard Rules

1. **No raw logs by default** - Aggregates only
2. **Drill-down requires explicit intent** - Logged as audit event
3. **All intelligence from BTE** - No custom queries
4. **Cross-enterprise views are aggregate-first** - Never expose individual user data across enterprises
5. **MFA cannot be disabled** - Security non-negotiable

---

## UI Requirements (S264)

Super Admin Command Center displays:

1. **Enterprise Health Grid**
   - All enterprises with health scores
   - Click to drill down (logged)

2. **Demo Misuse Alerts**
   - Flagged demos with recommended actions
   - One-click expire button

3. **Product Friction Map**
   - Visual representation of drop-off points
   - Powered by BTE signals only

4. **Persona Manager**
   - List all personas
   - Create/Edit/Deprecate actions
   - Bind to sub-verticals

---

## Validation Requirements

Before Super Admin goes live:
1. Super Admin sees decisions, not metrics
2. Persona edits are fully audited
3. Cross-enterprise views are aggregate-first
4. If this becomes a metrics dashboard → ABORT

---

## Version History

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2025-12-24 | Initial architecture (LOCKED) |
