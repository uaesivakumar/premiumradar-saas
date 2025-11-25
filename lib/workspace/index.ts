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
