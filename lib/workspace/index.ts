/**
 * Workspace Module
 *
 * Multi-tenant workspace management.
 *
 * S370: Card State Foundation added:
 * - Card types and state management
 * - TTL engine for card expiry
 * - Priority sorting for cards
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

// S370: Card State Foundation
export type {
  Card,
  CardType,
  CardStatus,
  CardAction,
  CardSourceType,
  CardEntityType,
} from './card-state';

export {
  createCard,
  createNBACard,
  createDecisionCard,
  createSignalCard,
  createSystemCard,
  DEFAULT_PRIORITIES,
} from './card-state';

export {
  TTL_CONFIG,
  getExpiryTime,
  shouldExpire,
  getTimeToExpiry,
  getExpiryDisplayString,
  filterExpired,
  markExpired,
  getExpiringCards,
  TTLEngine,
} from './ttl-engine';

export {
  sortByPriority,
  getDisplayCards,
  ensureNBAFirst,
  boostPriority,
  reducePriority,
  getPriorityLabel,
  hasActiveNBA,
  getActiveNBA,
  findDuplicateNBAs,
  groupByType,
  groupByEntity,
  getCardsForEntity,
} from './card-priority';
