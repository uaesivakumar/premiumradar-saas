# PHASE 1B: GOVERNANCE HARDENING PLAN

**Team:** MAC (Spec Enforcement)
**Status:** SPEC-ONLY (No code until Phase 1A merge)
**Date:** 2025-12-27
**Version:** 1.0.0

---

## Purpose

This document defines the **validation rules** and **acceptance criteria** for hardening the Wizard to comply with Control Plane v2.0 governance requirements.

**THIS IS A SPECIFICATION DOCUMENT. NO CODE.**

---

## 1. Policy Lifecycle Enforcement

### 1.1 Required State Machine

```
DRAFT → STAGED → ACTIVE → DEPRECATED
         ↑          │
         └──────────┘ (rollback allowed)
```

### 1.2 UI State Mapping

| Policy Status | UI Representation | User Actions Available |
|---------------|-------------------|------------------------|
| `DRAFT` | Yellow badge "Draft" | Edit fields, Stage |
| `STAGED` | Blue badge "Staged" | Test, Activate, Revert to Draft |
| `ACTIVE` | Green badge "Active" | Deprecate, Create New Version |
| `DEPRECATED` | Gray badge "Deprecated" | View only (read-only) |

### 1.3 Validation Rules

| Rule ID | Rule | Error Message |
|---------|------|---------------|
| `POL-001` | Cannot skip STAGED state | "Policy must be staged before activation" |
| `POL-002` | Cannot activate from DEPRECATED | "Deprecated policies cannot be reactivated" |
| `POL-003` | Only one ACTIVE policy per persona | "Persona already has an active policy" |
| `POL-004` | STAGED requires minimum 1 intent | "Policy must have at least one allowed intent to stage" |
| `POL-005` | STAGED requires minimum 1 tool | "Policy must have at least one allowed tool to stage" |

### 1.4 Acceptance Criteria

```
GIVEN a policy in DRAFT status
WHEN user clicks "Activate"
THEN system MUST reject with error POL-001
AND button label MUST be "Stage for Review" (not "Activate")

GIVEN a policy in STAGED status
WHEN user clicks "Activate"
THEN system MUST check POL-003 (no other ACTIVE policy)
AND system MUST transition status to ACTIVE
AND system MUST set activated_at timestamp

GIVEN a policy in ACTIVE status
WHEN user clicks "Deprecate"
THEN system MUST prompt for confirmation
AND system MUST set status to DEPRECATED
AND system MUST set deprecated_at timestamp

GIVEN a policy in DEPRECATED status
WHEN user views policy
THEN all fields MUST be read-only
AND no action buttons MUST be visible except "View History"
```

### 1.5 UI Components Required

| Component | Location | Purpose |
|-----------|----------|---------|
| `PolicyStatusBadge` | Policy Step | Shows current status with color |
| `PolicyLifecycleActions` | Policy Step sidebar | Stage/Activate/Deprecate buttons |
| `PolicyStagingPanel` | Policy Step | Test policy before activation |
| `PolicyVersionHistory` | Policy Step | View previous versions |

---

## 2. Region Enforcement

### 2.1 Core Principle

**No free-text region codes. Hierarchy is required.**

### 2.2 Region Hierarchy Schema

```
GLOBAL (root)
├── EMEA
│   ├── UAE
│   ├── SA
│   └── EG
├── APAC
│   ├── IN
│   ├── SG
│   └── AU
└── AMER
    ├── US
    │   ├── US-CA
    │   └── US-NY
    └── BR
```

### 2.3 Validation Rules

| Rule ID | Rule | Error Message |
|---------|------|---------------|
| `REG-001` | Region code must exist in hierarchy | "Unknown region code: {code}" |
| `REG-002` | LOCAL scope requires leaf region | "LOCAL scope requires specific region (e.g., UAE, US-CA)" |
| `REG-003` | REGIONAL scope requires branch region | "REGIONAL scope requires region group (e.g., EMEA, APAC)" |
| `REG-004` | GLOBAL scope must have NULL region_code | "GLOBAL scope cannot have a region code" |
| `REG-005` | Region must have GLOBAL fallback | "No GLOBAL persona exists for this sub-vertical" |

### 2.4 Acceptance Criteria

```
GIVEN persona step with scope = LOCAL
WHEN user types "INVALID" in region field
THEN system MUST reject with error REG-001
AND input field MUST show red border
AND dropdown MUST show valid options

GIVEN persona step with scope = GLOBAL
WHEN user attempts to enter region code
THEN region_code field MUST be hidden/disabled
AND system MUST enforce region_code = NULL

GIVEN persona step with scope = REGIONAL
WHEN user selects region = "UAE" (leaf node)
THEN system MUST reject with error REG-003
AND suggest "EMEA" instead

GIVEN sub-vertical with no GLOBAL persona
WHEN user creates LOCAL persona
THEN system MUST warn with REG-005
AND show "Create GLOBAL fallback first" button
```

### 2.5 UI Components Required

| Component | Location | Purpose |
|-----------|----------|---------|
| `RegionHierarchyDropdown` | Persona Step | Replaces free-text input |
| `RegionScopeValidator` | Persona Step | Validates scope + region match |
| `RegionFallbackWarning` | Persona Step | Warns if no GLOBAL fallback |
| `RegionHierarchyViewer` | Control Plane | Visualize full hierarchy |

---

## 3. Binding Failure Visibility

### 3.1 Core Principle

**Silent success is FORBIDDEN. All failures must be surfaced.**

### 3.2 Current Violation (to be fixed)

```typescript
// CURRENT (WRONG):
if (!response.ok || !data.success) {
  console.warn('Auto-bind returned:', data);  // Silent!
  updateWizardState({
    binding_id: 'auto-managed',  // Fake success!
  });
  markStepComplete(5);  // Proceeds anyway!
}
```

### 3.3 Validation Rules

| Rule ID | Rule | Error Message |
|---------|------|---------------|
| `BND-001` | Binding failure must block wizard | "Binding failed: {reason}" |
| `BND-002` | binding_id must be valid UUID | "Invalid binding ID" |
| `BND-003` | binding_id = "auto-managed" is FORBIDDEN | "Binding was not created" |
| `BND-004` | Binding requires active persona | "Persona must be active before binding" |
| `BND-005` | Binding requires active policy | "Policy must be ACTIVE before binding" |

### 3.4 Acceptance Criteria

```
GIVEN binding step
WHEN auto-bind API returns error
THEN wizard MUST NOT proceed to next step
AND error panel MUST show exact API error
AND "Retry" button MUST be visible
AND "Skip" MUST NOT exist

GIVEN binding step
WHEN binding succeeds
THEN binding_id MUST be valid UUID
AND binding_id MUST NOT equal "auto-managed"
AND tenant_id and workspace_id MUST be populated

GIVEN binding step with failed binding
WHEN user clicks "Retry"
THEN system MUST call auto-bind API again
AND show loading state during retry
```

### 3.5 Error States to Surface

| Error Code | Display Text | Recovery Action |
|------------|--------------|-----------------|
| `BINDING_FAILED` | "Failed to create workspace binding" | Retry button |
| `PERSONA_NOT_ACTIVE` | "Persona is not active" | Go back to Step 3 |
| `POLICY_NOT_ACTIVE` | "Policy is not active" | Go back to Step 4 |
| `WORKSPACE_NOT_FOUND` | "Workspace does not exist" | Contact admin |
| `TENANT_NOT_FOUND` | "Tenant does not exist" | Contact admin |

### 3.6 UI Components Required

| Component | Location | Purpose |
|-----------|----------|---------|
| `BindingErrorPanel` | Binding Step | Shows exact failure reason |
| `BindingRetryButton` | Binding Step | Allows retry on failure |
| `BindingStatusIndicator` | Binding Step | Success/Failure/Loading states |

---

## 4. Empty Policy Hard-Block

### 4.1 Core Principle

**A policy with 0 intents OR 0 tools cannot proceed past DRAFT.**

### 4.2 Validation Rules

| Rule ID | Rule | Error Message |
|---------|------|---------------|
| `EMP-001` | Minimum 1 allowed_intent required | "Add at least one allowed intent" |
| `EMP-002` | Minimum 1 allowed_tool required | "Add at least one allowed tool" |
| `EMP-003` | Cannot stage empty policy | "Policy cannot be staged without intents and tools" |
| `EMP-004` | Cannot proceed to binding with DRAFT policy | "Policy must be ACTIVE before binding" |

### 4.3 Acceptance Criteria

```
GIVEN policy step with 0 intents and 0 tools
WHEN user clicks "Save Policy"
THEN "Stage for Review" button MUST be disabled
AND tooltip MUST show EMP-001 and EMP-002 messages
AND policy MUST save as DRAFT only

GIVEN policy step with 1+ intents but 0 tools
WHEN user clicks "Stage for Review"
THEN system MUST reject with error EMP-002
AND tools section MUST highlight with red border

GIVEN policy in DRAFT status
WHEN wizard attempts to proceed to binding step
THEN system MUST block with error EMP-004
AND show "Activate policy first" message
```

### 4.4 UI Components Required

| Component | Location | Purpose |
|-----------|----------|---------|
| `PolicyCompletionIndicator` | Policy Step sidebar | Shows intent/tool counts |
| `PolicyMinimumRequirements` | Policy Step | Visual checklist |
| `StageBlocker` | Policy Step | Explains why staging is blocked |

---

## 5. Implementation Phases

### Phase 1B-1: Policy Lifecycle (Priority: CRITICAL)

| Task | Validation Rules | Acceptance Criteria |
|------|------------------|---------------------|
| Add STAGED status to UI | POL-001, POL-002 | All 4 status badges visible |
| Block DRAFT → ACTIVE transition | POL-001 | Error shown on attempt |
| Add staging panel | POL-004, POL-005 | Test before activate |
| Add deprecation flow | N/A | Confirmation + timestamp |

### Phase 1B-2: Region Enforcement (Priority: HIGH)

| Task | Validation Rules | Acceptance Criteria |
|------|------------------|---------------------|
| Replace free-text with dropdown | REG-001 | No typing allowed |
| Add hierarchy validation | REG-002, REG-003 | Scope matches region level |
| Add GLOBAL fallback check | REG-005 | Warning if no fallback |
| Hide region for GLOBAL scope | REG-004 | Field invisible |

### Phase 1B-3: Binding Failure (Priority: CRITICAL)

| Task | Validation Rules | Acceptance Criteria |
|------|------------------|---------------------|
| Remove silent success | BND-001, BND-003 | No fake binding_id |
| Add error panel | BND-001 | Exact error displayed |
| Add retry button | N/A | Retry on failure |
| Block wizard on failure | BND-001 | Cannot proceed |

### Phase 1B-4: Empty Policy Block (Priority: HIGH)

| Task | Validation Rules | Acceptance Criteria |
|------|------------------|---------------------|
| Add minimum checks | EMP-001, EMP-002 | Counts validated |
| Disable staging button | EMP-003 | Button disabled when empty |
| Block binding step | EMP-004 | Cannot proceed with DRAFT |

---

## 6. Test Matrix

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| `T-POL-01` | Attempt DRAFT → ACTIVE | Blocked with POL-001 |
| `T-POL-02` | Stage then Activate | Success |
| `T-POL-03` | Deprecate active policy | Confirmation → DEPRECATED |
| `T-REG-01` | Type invalid region | Rejected with REG-001 |
| `T-REG-02` | Select region from dropdown | Accepted |
| `T-REG-03` | LOCAL with branch region | Rejected with REG-003 |
| `T-REG-04` | No GLOBAL fallback | Warning REG-005 |
| `T-BND-01` | Binding API fails | Wizard blocked, error shown |
| `T-BND-02` | binding_id = "auto-managed" | Rejected with BND-003 |
| `T-BND-03` | Retry after failure | API called again |
| `T-EMP-01` | 0 intents, 0 tools | Stage button disabled |
| `T-EMP-02` | 1 intent, 0 tools | Stage blocked with EMP-002 |
| `T-EMP-03` | Proceed with DRAFT | Blocked with EMP-004 |

---

## 7. Files to Modify (Reference Only)

**NO CODE CHANGES UNTIL PHASE 1A MERGE**

| File | Changes Required |
|------|------------------|
| `steps/policy-step.tsx` | Add lifecycle UI, staging panel |
| `steps/persona-step.tsx` | Replace region input with dropdown |
| `steps/binding-step.tsx` | Remove silent success, add error panel |
| `wizard-context.tsx` | Add lifecycle state validation |
| `(new) components/PolicyStatusBadge.tsx` | Status badge component |
| `(new) components/RegionDropdown.tsx` | Hierarchy dropdown |
| `(new) components/BindingErrorPanel.tsx` | Error display |

---

## 8. Dependencies

| Dependency | Required For | Status |
|------------|--------------|--------|
| Phase 1A merge | All Phase 1B work | PENDING |
| Region hierarchy data | REG-* rules | NEEDS DEFINITION |
| API: `/api/.../policy/stage` | POL-* rules | NEEDS CREATION |
| API: `/api/.../policy/deprecate` | POL-* rules | NEEDS CREATION |

---

## Approval Checklist

- [ ] Policy lifecycle validation rules approved
- [ ] Region enforcement validation rules approved
- [ ] Binding failure visibility rules approved
- [ ] Empty policy hard-block rules approved
- [ ] Phase 1A merged to main
- [ ] Implementation can begin

---

*Spec by: TEAM MAC (Governance)*
*Branch: phase1/wizard-governance-hardening*
*Mode: SPEC-ONLY (No code until Phase 1A merge)*
