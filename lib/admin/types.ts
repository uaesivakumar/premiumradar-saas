/**
 * Admin Types
 *
 * Type definitions for admin functionality including
 * impersonation, user management, and tenant viewing.
 */

// ============================================================
// IMPERSONATION TYPES
// ============================================================

export interface ImpersonationSession {
  id: string;
  adminId: string;
  adminEmail: string;
  targetTenantId: string;
  targetTenantName: string;
  startedAt: Date;
  expiresAt: Date;
  reason: string;
  auditTrail: ImpersonationAction[];
}

export interface ImpersonationAction {
  timestamp: Date;
  action: string;
  resource: string;
  details?: Record<string, unknown>;
}

export interface ImpersonationRequest {
  targetTenantId: string;
  reason: string;
  durationMinutes?: number; // Default 30 minutes
}

export interface ImpersonationContext {
  isImpersonating: boolean;
  session: ImpersonationSession | null;
  originalAdminId: string | null;
}

// ============================================================
// USER MANAGEMENT TYPES
// ============================================================

export type UserStatus = 'active' | 'disabled' | 'banned' | 'pending' | 'deleted';

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  workspaceId: string;
  workspaceName: string;
  role: string;
  createdAt: Date;
  lastActiveAt: Date | null;
  disabledAt: Date | null;
  disabledReason: string | null;
  bannedAt: Date | null;
  banReason: string | null;
  banExpiresAt: Date | null;
  deletedAt: Date | null;
}

export interface UserAction {
  type: 'disable' | 'enable' | 'ban' | 'unban' | 'delete' | 'restore';
  userId: string;
  reason?: string;
  expiresAt?: Date; // For temporary bans
  adminId: string;
}

export interface UserActionResult {
  success: boolean;
  user: ManagedUser;
  action: UserAction;
  message: string;
}

export interface BanOptions {
  reason: string;
  permanent: boolean;
  expiresAt?: Date;
  notifyUser: boolean;
}

export interface DisableOptions {
  reason: string;
  notifyUser: boolean;
}

// ============================================================
// TENANT VIEWER TYPES
// ============================================================

export interface TenantSummary {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: 'active' | 'suspended' | 'trial' | 'churned';
  userCount: number;
  createdAt: Date;
  lastActiveAt: Date | null;
  mrr: number; // Monthly recurring revenue in cents
  usage: TenantUsageSnapshot;
}

export interface TenantUsageSnapshot {
  apiCalls: number;
  apiCallsLimit: number;
  searches: number;
  searchesLimit: number;
  exports: number;
  exportsLimit: number;
  storageMb: number;
  storageMbLimit: number;
}

export interface TenantDetails extends TenantSummary {
  email: string;
  phone?: string;
  address?: TenantAddress;
  subscription: TenantSubscription;
  users: TenantUser[];
  billingHistory: TenantInvoice[];
  activityLog: TenantActivity[];
}

export interface TenantAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface TenantSubscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface TenantUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: UserStatus;
  lastActiveAt: Date | null;
}

export interface TenantInvoice {
  id: string;
  number: string;
  amount: number;
  status: 'paid' | 'open' | 'failed' | 'void';
  createdAt: Date;
  paidAt: Date | null;
}

export interface TenantActivity {
  id: string;
  action: string;
  actor: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

// ============================================================
// FILTER & PAGINATION TYPES
// ============================================================

export interface TenantFilters {
  status?: TenantSummary['status'][];
  plan?: string[];
  search?: string;
  minMrr?: number;
  maxMrr?: number;
  minUsers?: number;
  maxUsers?: number;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface UserFilters {
  status?: UserStatus[];
  workspaceId?: string;
  role?: string[];
  search?: string;
  lastActiveAfter?: Date;
  lastActiveBefore?: Date;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ============================================================
// ADMIN AUDIT TYPES
// ============================================================

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: 'user' | 'tenant' | 'config' | 'system';
  targetId: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
