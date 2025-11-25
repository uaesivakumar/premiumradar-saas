/**
 * User Management
 *
 * Admin functions for managing users including
 * ban, disable, delete, and restore operations.
 */

import { create } from 'zustand';
import type {
  ManagedUser,
  UserAction,
  UserActionResult,
  UserStatus,
  UserFilters,
  PaginationParams,
  PaginatedResult,
  BanOptions,
  DisableOptions,
} from './types';

// ============================================================
// USER MANAGEMENT STORE (Zustand)
// ============================================================

interface UserManagementStore {
  users: ManagedUser[];
  selectedUsers: string[];
  isLoading: boolean;
  error: string | null;
  filters: UserFilters;
  pagination: PaginationParams;

  setUsers: (users: ManagedUser[]) => void;
  updateUser: (userId: string, updates: Partial<ManagedUser>) => void;
  selectUser: (userId: string) => void;
  deselectUser: (userId: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  setFilters: (filters: Partial<UserFilters>) => void;
  setPagination: (pagination: Partial<PaginationParams>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useUserManagementStore = create<UserManagementStore>((set, get) => ({
  users: [],
  selectedUsers: [],
  isLoading: false,
  error: null,
  filters: {},
  pagination: { page: 1, pageSize: 25, sortBy: 'lastActiveAt', sortOrder: 'desc' },

  setUsers: (users) => set({ users }),

  updateUser: (userId, updates) => {
    const { users } = get();
    set({
      users: users.map((u) => (u.id === userId ? { ...u, ...updates } : u)),
    });
  },

  selectUser: (userId) => {
    const { selectedUsers } = get();
    if (!selectedUsers.includes(userId)) {
      set({ selectedUsers: [...selectedUsers, userId] });
    }
  },

  deselectUser: (userId) => {
    const { selectedUsers } = get();
    set({ selectedUsers: selectedUsers.filter((id) => id !== userId) });
  },

  selectAll: () => {
    const { users } = get();
    set({ selectedUsers: users.map((u) => u.id) });
  },

  deselectAll: () => set({ selectedUsers: [] }),

  setFilters: (filters) => {
    const { filters: current } = get();
    set({ filters: { ...current, ...filters }, pagination: { ...get().pagination, page: 1 } });
  },

  setPagination: (pagination) => {
    const { pagination: current } = get();
    set({ pagination: { ...current, ...pagination } });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));

// ============================================================
// USER ACTIONS
// ============================================================

/**
 * Disable a user account
 */
export async function disableUser(
  userId: string,
  options: DisableOptions,
  adminId: string
): Promise<UserActionResult> {
  const action: UserAction = {
    type: 'disable',
    userId,
    reason: options.reason,
    adminId,
  };

  // In production, this would call the API
  const updatedUser: ManagedUser = {
    id: userId,
    email: '',
    name: '',
    status: 'disabled',
    workspaceId: '',
    workspaceName: '',
    role: '',
    createdAt: new Date(),
    lastActiveAt: null,
    disabledAt: new Date(),
    disabledReason: options.reason,
    bannedAt: null,
    banReason: null,
    banExpiresAt: null,
    deletedAt: null,
  };

  await logUserAction(action);

  if (options.notifyUser) {
    await sendUserNotification(userId, 'account_disabled', {
      reason: options.reason,
    });
  }

  return {
    success: true,
    user: updatedUser,
    action,
    message: `User ${userId} has been disabled`,
  };
}

/**
 * Enable a disabled user account
 */
export async function enableUser(userId: string, adminId: string): Promise<UserActionResult> {
  const action: UserAction = {
    type: 'enable',
    userId,
    adminId,
  };

  const updatedUser: ManagedUser = {
    id: userId,
    email: '',
    name: '',
    status: 'active',
    workspaceId: '',
    workspaceName: '',
    role: '',
    createdAt: new Date(),
    lastActiveAt: null,
    disabledAt: null,
    disabledReason: null,
    bannedAt: null,
    banReason: null,
    banExpiresAt: null,
    deletedAt: null,
  };

  await logUserAction(action);

  return {
    success: true,
    user: updatedUser,
    action,
    message: `User ${userId} has been enabled`,
  };
}

/**
 * Ban a user account
 */
export async function banUser(
  userId: string,
  options: BanOptions,
  adminId: string
): Promise<UserActionResult> {
  const action: UserAction = {
    type: 'ban',
    userId,
    reason: options.reason,
    expiresAt: options.permanent ? undefined : options.expiresAt,
    adminId,
  };

  const updatedUser: ManagedUser = {
    id: userId,
    email: '',
    name: '',
    status: 'banned',
    workspaceId: '',
    workspaceName: '',
    role: '',
    createdAt: new Date(),
    lastActiveAt: null,
    disabledAt: null,
    disabledReason: null,
    bannedAt: new Date(),
    banReason: options.reason,
    banExpiresAt: options.permanent ? null : options.expiresAt || null,
    deletedAt: null,
  };

  await logUserAction(action);

  if (options.notifyUser) {
    await sendUserNotification(userId, 'account_banned', {
      reason: options.reason,
      permanent: options.permanent,
      expiresAt: options.expiresAt,
    });
  }

  return {
    success: true,
    user: updatedUser,
    action,
    message: `User ${userId} has been banned${options.permanent ? ' permanently' : ''}`,
  };
}

/**
 * Unban a user account
 */
export async function unbanUser(userId: string, adminId: string): Promise<UserActionResult> {
  const action: UserAction = {
    type: 'unban',
    userId,
    adminId,
  };

  const updatedUser: ManagedUser = {
    id: userId,
    email: '',
    name: '',
    status: 'active',
    workspaceId: '',
    workspaceName: '',
    role: '',
    createdAt: new Date(),
    lastActiveAt: null,
    disabledAt: null,
    disabledReason: null,
    bannedAt: null,
    banReason: null,
    banExpiresAt: null,
    deletedAt: null,
  };

  await logUserAction(action);

  return {
    success: true,
    user: updatedUser,
    action,
    message: `User ${userId} has been unbanned`,
  };
}

/**
 * Soft delete a user account
 */
export async function deleteUser(
  userId: string,
  reason: string,
  adminId: string
): Promise<UserActionResult> {
  const action: UserAction = {
    type: 'delete',
    userId,
    reason,
    adminId,
  };

  const updatedUser: ManagedUser = {
    id: userId,
    email: '',
    name: '',
    status: 'deleted',
    workspaceId: '',
    workspaceName: '',
    role: '',
    createdAt: new Date(),
    lastActiveAt: null,
    disabledAt: null,
    disabledReason: null,
    bannedAt: null,
    banReason: null,
    banExpiresAt: null,
    deletedAt: new Date(),
  };

  await logUserAction(action);

  return {
    success: true,
    user: updatedUser,
    action,
    message: `User ${userId} has been deleted`,
  };
}

/**
 * Restore a deleted user account
 */
export async function restoreUser(userId: string, adminId: string): Promise<UserActionResult> {
  const action: UserAction = {
    type: 'restore',
    userId,
    adminId,
  };

  const updatedUser: ManagedUser = {
    id: userId,
    email: '',
    name: '',
    status: 'active',
    workspaceId: '',
    workspaceName: '',
    role: '',
    createdAt: new Date(),
    lastActiveAt: null,
    disabledAt: null,
    disabledReason: null,
    bannedAt: null,
    banReason: null,
    banExpiresAt: null,
    deletedAt: null,
  };

  await logUserAction(action);

  return {
    success: true,
    user: updatedUser,
    action,
    message: `User ${userId} has been restored`,
  };
}

// ============================================================
// BULK ACTIONS
// ============================================================

/**
 * Perform action on multiple users
 */
export async function bulkUserAction(
  userIds: string[],
  actionType: UserAction['type'],
  options: { reason?: string; adminId: string }
): Promise<UserActionResult[]> {
  const results: UserActionResult[] = [];

  for (const userId of userIds) {
    let result: UserActionResult;

    switch (actionType) {
      case 'disable':
        result = await disableUser(
          userId,
          { reason: options.reason || 'Bulk action', notifyUser: false },
          options.adminId
        );
        break;
      case 'enable':
        result = await enableUser(userId, options.adminId);
        break;
      case 'ban':
        result = await banUser(
          userId,
          { reason: options.reason || 'Bulk action', permanent: false, notifyUser: false },
          options.adminId
        );
        break;
      case 'unban':
        result = await unbanUser(userId, options.adminId);
        break;
      case 'delete':
        result = await deleteUser(userId, options.reason || 'Bulk action', options.adminId);
        break;
      case 'restore':
        result = await restoreUser(userId, options.adminId);
        break;
      default:
        continue;
    }

    results.push(result);
  }

  return results;
}

// ============================================================
// QUERY FUNCTIONS
// ============================================================

/**
 * Fetch users with filters and pagination
 */
export async function fetchUsers(
  filters: UserFilters,
  pagination: PaginationParams
): Promise<PaginatedResult<ManagedUser>> {
  // In production, this would call the API
  // For now, return mock data
  const mockUsers: ManagedUser[] = generateMockUsers(50);

  // Apply filters
  let filtered = mockUsers;

  if (filters.status?.length) {
    filtered = filtered.filter((u) => filters.status!.includes(u.status));
  }

  if (filters.workspaceId) {
    filtered = filtered.filter((u) => u.workspaceId === filters.workspaceId);
  }

  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(
      (u) => u.email.toLowerCase().includes(search) || u.name.toLowerCase().includes(search)
    );
  }

  // Apply pagination
  const total = filtered.length;
  const totalPages = Math.ceil(total / pagination.pageSize);
  const start = (pagination.page - 1) * pagination.pageSize;
  const items = filtered.slice(start, start + pagination.pageSize);

  return {
    items,
    total,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages,
    hasNext: pagination.page < totalPages,
    hasPrev: pagination.page > 1,
  };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<ManagedUser | null> {
  // In production, this would call the API
  const users = generateMockUsers(50);
  return users.find((u) => u.id === userId) || null;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Log user action to audit trail
 */
async function logUserAction(action: UserAction): Promise<void> {
  console.log('[USER ACTION AUDIT]', JSON.stringify(action, null, 2));
}

/**
 * Send notification to user
 */
async function sendUserNotification(
  userId: string,
  type: string,
  data: Record<string, unknown>
): Promise<void> {
  console.log('[USER NOTIFICATION]', { userId, type, data });
}

/**
 * Generate mock users for development
 */
function generateMockUsers(count: number): ManagedUser[] {
  const statuses: UserStatus[] = ['active', 'disabled', 'banned', 'pending', 'deleted'];
  const roles = ['owner', 'admin', 'analyst', 'viewer'];

  return Array.from({ length: count }, (_, i) => ({
    id: `user_${i + 1}`,
    email: `user${i + 1}@example.com`,
    name: `User ${i + 1}`,
    status: statuses[i % statuses.length],
    workspaceId: `ws_${Math.floor(i / 5) + 1}`,
    workspaceName: `Workspace ${Math.floor(i / 5) + 1}`,
    role: roles[i % roles.length],
    createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
    lastActiveAt: i % 3 === 0 ? null : new Date(Date.now() - i * 60 * 60 * 1000),
    disabledAt: statuses[i % statuses.length] === 'disabled' ? new Date() : null,
    disabledReason: statuses[i % statuses.length] === 'disabled' ? 'Inactive account' : null,
    bannedAt: statuses[i % statuses.length] === 'banned' ? new Date() : null,
    banReason: statuses[i % statuses.length] === 'banned' ? 'Terms violation' : null,
    banExpiresAt: null,
    deletedAt: statuses[i % statuses.length] === 'deleted' ? new Date() : null,
  }));
}

/**
 * Get status badge color
 */
export function getStatusColor(status: UserStatus): string {
  const colors: Record<UserStatus, string> = {
    active: 'green',
    disabled: 'yellow',
    banned: 'red',
    pending: 'blue',
    deleted: 'gray',
  };
  return colors[status];
}

/**
 * Get status label
 */
export function getStatusLabel(status: UserStatus): string {
  const labels: Record<UserStatus, string> = {
    active: 'Active',
    disabled: 'Disabled',
    banned: 'Banned',
    pending: 'Pending',
    deleted: 'Deleted',
  };
  return labels[status];
}
