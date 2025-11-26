/**
 * Admin Module
 *
 * Exports all admin functionality including impersonation,
 * user management, and tenant viewing.
 */

// Types
export type {
  ImpersonationSession,
  ImpersonationRequest,
  ImpersonationContext,
  ImpersonationAction,
  UserStatus,
  ManagedUser,
  UserAction,
  UserActionResult,
  BanOptions,
  DisableOptions,
  TenantSummary,
  TenantDetails,
  TenantUsageSnapshot,
  TenantAddress,
  TenantSubscription,
  TenantUser,
  TenantInvoice,
  TenantActivity,
  TenantFilters,
  UserFilters,
  PaginationParams,
  PaginatedResult,
  AdminAuditLog,
} from './types';

// Impersonation
export {
  useImpersonationStore,
  selectIsImpersonating,
  selectImpersonationSession,
  selectOriginalAdminId,
  selectAuditTrail,
  startImpersonation,
  endImpersonation,
  canImpersonate,
  isActionAllowedDuringImpersonation,
  getImpersonationRestrictions,
  formatSessionTimeRemaining,
  isSessionExpiringSoon,
} from './impersonation';

// User Management
export {
  useUserManagementStore,
  disableUser,
  enableUser,
  banUser,
  unbanUser,
  deleteUser,
  restoreUser,
  bulkUserAction,
  fetchUsers,
  getUserById,
  getStatusColor,
  getStatusLabel,
} from './user-management';

// Tenant Viewer
export {
  useTenantViewerStore,
  fetchTenants,
  fetchTenantDetails,
  fetchTenantStats,
  suspendTenant,
  reactivateTenant,
  exportTenantData,
  getTenantStatusColor,
  formatMrr,
  getUsagePercentage,
  getUsageStatusColor,
} from './tenant-viewer';

// Vertical Config Service
// NOTE: Server-only exports are in ./server.ts
// Import from '@/lib/admin/server' in API routes and server components
