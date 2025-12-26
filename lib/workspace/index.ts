/**
 * Workspace Module
 *
 * Multi-tenant workspace management.
 */

// Types
export type {
  Workspace,
  WorkspacePlan,
  WorkspaceSettings,
  WorkspaceFeatures,
  TeamRole,
  TeamMember,
  MemberStatus,
  Invitation,
  InvitationStatus,
  Permission,
  PermissionMatrix,
  Tenant,
  IsolationLevel,
  DataRegion,
  TenantStatus,
  TenantQuotas,
  ApiKey,
  ApiKeyStatus,
  ActivityLog,
  ActivityAction,
} from './types';

// RBAC
export {
  PERMISSION_MATRIX,
  ROLE_HIERARCHY,
  hasPermission,
  canManageRole,
  canAssignRole,
  getRolePermissions,
  getRoleInfo,
  createPermissionGuard,
  getAssignableRoles,
} from './rbac';

// Store
export {
  useWorkspaceStore,
  selectCurrentWorkspace,
  selectWorkspaces,
  selectMembers,
  selectActiveMembers,
  selectInvitedMembers,
  selectMembersByRole,
  selectIsOwner,
  selectIsAdmin,
  selectCanInvite,
  createMockWorkspace,
  createMockMember,
} from './workspace-store';

// S278: Workspace Intelligence Hooks
export { useRuntimeSignals, SIGNAL_TYPE_OPTIONS, PRIORITY_OPTIONS } from './useRuntimeSignals';
export { useOpportunityScore } from './useOpportunityScore';
export { useBlockersAndBoosters } from './useBlockersAndBoosters';
export { useWorkspaceIntelligence } from './useWorkspaceIntelligence';

export type { DerivedScore } from './useOpportunityScore';
export type { DerivedBlocker, DerivedBooster } from './useBlockersAndBoosters';
export type { WorkspaceIntelligenceConfig, WorkspaceIntelligenceResult } from './useWorkspaceIntelligence';
