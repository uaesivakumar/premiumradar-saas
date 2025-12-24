# Enterprise Admin User Management and Operations

**Version:** 1.0
**Status:** LOCKED
**Last Updated:** 2025-12-24

---

## Purpose

Enterprise Admin is the **scoped operational layer** for managing users and viewing team intelligence within a single enterprise. Enterprise Admins have power within their boundary but cannot affect system-wide configuration.

---

## Core Principles

### 1. Scoped Power
- Enterprise Admin sees **only their enterprise**
- No visibility into other enterprises
- No ability to modify personas or system config

### 2. Team = Sub-Vertical
- No custom team definitions
- Team is derived from `sub_vertical_id`
- Coaching insights scoped by sub-vertical

### 3. Approval Paths for Cross-Boundary Actions
- Same-vertical reassignment: Allowed
- Cross-vertical reassignment: Requires Super Admin approval

---

## Enterprise Admin Capabilities

```typescript
const ENTERPRISE_ADMIN_CAPABILITIES = [
  'view_own_enterprise',
  'view_team_performance',
  'view_subvertical_insights',
  'view_coaching_recommendations',
  'create_user',
  'create_users_bulk',
  'disable_user',
  'reassign_user_same_vertical',
  'request_cross_vertical_reassign', // Creates approval request
];

// CANNOT do:
const ENTERPRISE_ADMIN_RESTRICTIONS = [
  'view_other_enterprises',
  'edit_personas',
  'extend_demos',
  'modify_thresholds',
  'approve_cross_vertical_reassign',
];
```

---

## User Management APIs (S265)

### Create User (Single)
```
POST /api/enterprise/users
Authorization: Enterprise Admin

Body:
{
  "email": "user@example.com",
  "name": "John Doe",
  "sub_vertical_id": "uuid",
  "role": "USER"
}

Response:
{
  "user_id": "uuid",
  "status": "ACTIVE",
  "created_at": "2025-12-24T12:00:00Z"
}
```

### Create Users (Bulk CSV)
```
POST /api/enterprise/users/bulk
Authorization: Enterprise Admin
Content-Type: multipart/form-data

Body: CSV file with columns: email, name, sub_vertical_id

Constraints:
- Maximum 20 users per batch
- All users must be within same enterprise
- All sub_vertical_ids must be valid for this enterprise

Response:
{
  "created": 18,
  "failed": 2,
  "errors": [
    { "row": 5, "email": "bad@email", "error": "invalid_email" },
    { "row": 12, "email": "dup@example.com", "error": "duplicate" }
  ]
}
```

### Disable User
```
POST /api/enterprise/users/:id/disable
Authorization: Enterprise Admin

Response:
{
  "user_id": "uuid",
  "status": "SUSPENDED",
  "disabled_at": "2025-12-24T12:00:00Z"
}
```

### Reassign User (Same Vertical)
```
POST /api/enterprise/users/:id/reassign
Authorization: Enterprise Admin

Body:
{
  "new_sub_vertical_id": "uuid"
}

Validation:
- new_sub_vertical_id must be within same vertical as current
- If cross-vertical, returns 403 with approval_required

Response (success):
{
  "user_id": "uuid",
  "old_sub_vertical_id": "uuid",
  "new_sub_vertical_id": "uuid",
  "reassigned_at": "2025-12-24T12:00:00Z"
}

Response (cross-vertical):
{
  "error": "CROSS_VERTICAL_REQUIRES_APPROVAL",
  "message": "Cross-vertical reassignment requires Super Admin approval",
  "approval_request_url": "/api/superadmin/approvals"
}
```

---

## Intelligence APIs (S265)

### GET /api/enterprise/team/performance
Returns team performance metrics from BTE signals.

**Scoping:** Automatically filtered by `enterprise_id` from auth context.

**Response:**
```json
{
  "teams": [
    {
      "sub_vertical_id": "uuid",
      "sub_vertical_name": "Employee Banking",
      "user_count": 12,
      "avg_nba_adoption": 0.78,
      "avg_follow_through": 0.65,
      "top_performer_id": "uuid",
      "needs_coaching_count": 3
    }
  ]
}
```

### GET /api/enterprise/subvertical/insights
Returns sub-vertical level insights.

**Response:**
```json
{
  "insights": [
    {
      "sub_vertical_id": "uuid",
      "sub_vertical_name": "Employee Banking",
      "momentum_trend": "increasing",
      "common_drop_off": "qualification",
      "avg_decision_latency_hours": 4.2
    }
  ]
}
```

### GET /api/enterprise/coaching
Returns coaching recommendations derived from BTE signals.

**Response:**
```json
{
  "recommendations": [
    {
      "user_id": "uuid",
      "user_name": "Jane Smith",
      "sub_vertical": "Employee Banking",
      "issue": "high_hesitation",
      "hesitation_index": 4.5,
      "suggested_action": "Provide decision-making framework training",
      "priority": "HIGH"
    }
  ]
}
```

---

## Constraints

### One User → One Enterprise
```sql
-- Enforced by FK + unique constraint
ALTER TABLE users
  ADD CONSTRAINT users_enterprise_fk
  FOREIGN KEY (enterprise_id)
  REFERENCES enterprises(enterprise_id);
```

### One User → One Workspace
```sql
-- Each user has exactly one workspace
-- workspace_id is NOT NULL
```

### One User → One Sub-Vertical
```sql
-- Each user operates in exactly one sub-vertical
-- sub_vertical_id is NOT NULL
-- Reassignment is explicit action, not multi-select
```

---

## Hard Rules

1. **Enterprise Admin cannot edit personas** - View only
2. **Enterprise Admin cannot extend demos** - Super Admin only
3. **Enterprise Admin cannot see other enterprises** - Scoped queries only
4. **No custom teams** - Team = sub_vertical_id
5. **Bulk limit is 20** - Prevents mass operations without oversight
6. **Cross-vertical requires approval** - Prevents accidental scope changes

---

## UI Requirements (S265)

Enterprise Admin Panel displays:

1. **Team Overview**
   - Users grouped by sub-vertical
   - Performance indicators per team

2. **User Management**
   - Create single user form
   - Bulk upload (CSV, max 20)
   - Disable user action
   - Reassign user (with approval flow for cross-vertical)

3. **Coaching Dashboard**
   - Users needing attention
   - Suggested coaching actions
   - All derived from BTE signals

4. **Sub-Vertical Insights**
   - Performance trends
   - Drop-off analysis
   - Comparison across sub-verticals (within enterprise only)

---

## Validation Requirements

Before Enterprise Admin goes live:
1. Enterprise Admin only sees scoped data
2. Coaching insights trace back to BTE
3. No custom team logic exists
4. If Enterprise Admin gains policy power → ABORT

---

## Version History

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2025-12-24 | Initial architecture (LOCKED) |
