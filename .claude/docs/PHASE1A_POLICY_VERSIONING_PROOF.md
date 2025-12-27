# Phase 1A: Policy Versioning Implementation Proof

**Date:** 2025-12-27
**Branch:** `phase1/wizard-extension-unblock-cursor`
**Scope:** FAIL-02 from WIZARD_GAP_ANALYSIS_TEAM_CODE.md

---

## Problem Statement

Super Admins could not create new policy versions for existing personas.
The Control Plane showed policies as read-only with no versioning capability.

---

## Solution Implemented

### 1. API Endpoint

**New Endpoint:** `POST /api/superadmin/controlplane/personas/:id/policy/version`

**Location:** `app/api/superadmin/controlplane/personas/[id]/policy/version/route.ts`

**Behavior:**
- Creates a new DRAFT policy version from the current ACTIVE/latest policy
- Copies all policy fields (allowed_intents, forbidden_outputs, allowed_tools, etc.)
- Increments version number (v1 → v2)
- Sets status to DRAFT
- Returns error if DRAFT already exists (prevents duplicate drafts)

**Supporting Endpoint:** `GET /api/superadmin/controlplane/personas/:id/policy/version`
- Lists all policy versions for a persona
- Returns: versions array, active_version, draft_version

### 2. UI Components

**Location:** `app/superadmin/controlplane/page.tsx` - PolicyEditor component

**Added Features:**
1. **View Versions Button** - Toggle to show version history
2. **Create v{X} Button** - Creates new DRAFT version via API
3. **Version List Panel** - Shows all versions with status badges
4. **Status Badges** - Visual indicators for ACTIVE/DRAFT/DEPRECATED

---

## Click Path & Expected Outcomes

### Action 1: View Policy Versions

**Click Path:**
```
/superadmin/controlplane
→ Expand vertical (e.g., Banking)
→ Click on persona (e.g., "Employee Banking Specialist")
→ Click "View Versions" button (blue)
```

**Expected URL:** N/A (modal/panel interaction)

**Expected Outcome:**
- Version list panel appears
- Shows all policy versions ordered by version DESC
- Each row shows: version number, status badge, date
- Currently viewed version highlighted

### Action 2: Create New Policy Version

**Click Path:**
```
/superadmin/controlplane
→ Select persona
→ Click "Create v{X}" button (amber)
```

**Expected URL:** N/A (API call)

**Expected Outcome:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "persona_id": "uuid",
    "policy_version": 2,
    "status": "DRAFT",
    "source_version": 1,
    "message": "Created v2 as DRAFT (copied from v1)"
  }
}
```

### Action 3: View List After Creation

**Click Path:**
```
After creating version
→ Version list auto-refreshes
→ Or click "View Versions"
```

**Expected Outcome:**
- List shows both v1 (ACTIVE) and v2 (DRAFT)
- v2 marked as DRAFT with amber badge
- v1 marked as ACTIVE with green badge

---

## API Contract

### GET /api/superadmin/controlplane/personas/:id/policy/version

**Response:**
```json
{
  "success": true,
  "data": {
    "persona_id": "uuid",
    "persona_key": "employee_banking_specialist",
    "persona_name": "Employee Banking Specialist",
    "versions": [
      {
        "id": "uuid",
        "policy_version": 2,
        "status": "DRAFT",
        "allowed_intents": [...],
        "created_at": "2025-12-27T..."
      },
      {
        "id": "uuid",
        "policy_version": 1,
        "status": "ACTIVE",
        "allowed_intents": [...],
        "activated_at": "2025-12-20T...",
        "created_at": "2025-12-20T..."
      }
    ],
    "total_versions": 2,
    "active_version": 1,
    "draft_version": 2
  }
}
```

### POST /api/superadmin/controlplane/personas/:id/policy/version

**Request:** Empty body (copies from current policy)

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "persona_id": "uuid",
    "persona_key": "employee_banking_specialist",
    "policy_version": 2,
    "status": "DRAFT",
    "source_version": 1,
    "message": "Created v2 as DRAFT (copied from v1)"
  }
}
```

**Error: Draft Exists (409):**
```json
{
  "success": false,
  "error": "DRAFT_EXISTS",
  "message": "A draft version (v2) already exists. Edit or activate the existing draft before creating a new version.",
  "existing_draft": {
    "id": "uuid",
    "policy_version": 2
  }
}
```

---

## Files Changed

| File | Change |
|------|--------|
| `app/api/superadmin/controlplane/personas/[id]/policy/version/route.ts` | NEW - API endpoints |
| `app/superadmin/controlplane/page.tsx` | MODIFIED - UI components |

---

## Verification Steps

1. **Build Check:**
   ```bash
   npm run build
   ```
   Expected: No TypeScript errors

2. **Lint Check:**
   ```bash
   npm run lint
   ```
   Expected: No ESLint errors

3. **Manual Test:**
   - Navigate to Control Plane
   - Select a persona
   - Click "View Versions" - should show current version
   - Click "Create v{X}" - should create new DRAFT
   - Refresh - should persist

---

## Phase 1B Scope (Deferred)

The following are **NOT** in Phase 1A:

1. **Activation of DRAFT versions** - Handled in Phase 1B
2. **Deprecation of old versions** - Automatic on new version activation
3. **Policy editing UI** - Mutations via wizard only

---

## Success Criteria

| Requirement | Status |
|-------------|--------|
| Create vNext policy from existing | IMPLEMENTED |
| Save as DRAFT | IMPLEMENTED |
| View list of policy versions | IMPLEMENTED |
| Click path documented | DONE |

---

*Phase 1A Policy Versioning Complete*
