/**
 * Tenant Viewer
 *
 * View and manage all tenants in the system.
 */

import { create } from 'zustand';
import type {
  TenantSummary,
  TenantDetails,
  TenantFilters,
  PaginationParams,
  PaginatedResult,
} from './types';

// ============================================================
// TENANT VIEWER STORE (Zustand)
// ============================================================

interface TenantViewerStore {
  tenants: TenantSummary[];
  selectedTenant: TenantDetails | null;
  isLoading: boolean;
  error: string | null;
  filters: TenantFilters;
  pagination: PaginationParams;
  stats: TenantStats | null;

  setTenants: (tenants: TenantSummary[]) => void;
  setSelectedTenant: (tenant: TenantDetails | null) => void;
  setFilters: (filters: Partial<TenantFilters>) => void;
  setPagination: (pagination: Partial<PaginationParams>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStats: (stats: TenantStats) => void;
}

interface TenantStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  churnedTenants: number;
  totalMrr: number;
  avgMrrPerTenant: number;
  totalUsers: number;
}

export const useTenantViewerStore = create<TenantViewerStore>((set, get) => ({
  tenants: [],
  selectedTenant: null,
  isLoading: false,
  error: null,
  filters: {},
  pagination: { page: 1, pageSize: 25, sortBy: 'createdAt', sortOrder: 'desc' },
  stats: null,

  setTenants: (tenants) => set({ tenants }),
  setSelectedTenant: (selectedTenant) => set({ selectedTenant }),

  setFilters: (filters) => {
    const { filters: current, pagination } = get();
    set({
      filters: { ...current, ...filters },
      pagination: { ...pagination, page: 1 },
    });
  },

  setPagination: (pagination) => {
    const { pagination: current } = get();
    set({ pagination: { ...current, ...pagination } });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setStats: (stats) => set({ stats }),
}));

// ============================================================
// TENANT QUERY FUNCTIONS
// ============================================================

/**
 * Fetch all tenants with filters and pagination
 */
export async function fetchTenants(
  filters: TenantFilters,
  pagination: PaginationParams
): Promise<PaginatedResult<TenantSummary>> {
  // In production, this would call the API
  const mockTenants = generateMockTenants(100);

  // Apply filters
  let filtered = mockTenants;

  if (filters.status?.length) {
    filtered = filtered.filter((t) => filters.status!.includes(t.status));
  }

  if (filters.plan?.length) {
    filtered = filtered.filter((t) => filters.plan!.includes(t.plan));
  }

  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(
      (t) => t.name.toLowerCase().includes(search) || t.slug.toLowerCase().includes(search)
    );
  }

  if (filters.minMrr !== undefined) {
    filtered = filtered.filter((t) => t.mrr >= filters.minMrr!);
  }

  if (filters.maxMrr !== undefined) {
    filtered = filtered.filter((t) => t.mrr <= filters.maxMrr!);
  }

  if (filters.minUsers !== undefined) {
    filtered = filtered.filter((t) => t.userCount >= filters.minUsers!);
  }

  if (filters.maxUsers !== undefined) {
    filtered = filtered.filter((t) => t.userCount <= filters.maxUsers!);
  }

  // Sort
  if (pagination.sortBy) {
    filtered.sort((a, b) => {
      const aVal = a[pagination.sortBy as keyof TenantSummary];
      const bVal = b[pagination.sortBy as keyof TenantSummary];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (aVal < bVal) return pagination.sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return pagination.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Paginate
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
 * Fetch tenant details by ID
 */
export async function fetchTenantDetails(tenantId: string): Promise<TenantDetails | null> {
  // In production, this would call the API
  const summary = generateMockTenants(1)[0];
  summary.id = tenantId;

  const details: TenantDetails = {
    ...summary,
    email: `billing@${summary.slug}.com`,
    phone: '+1 (555) 123-4567',
    address: {
      line1: '123 Business Ave',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'US',
    },
    subscription: {
      id: `sub_${tenantId}`,
      plan: summary.plan,
      status: summary.status === 'active' ? 'active' : 'canceled',
      currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
    },
    users: generateMockTenantUsers(summary.userCount),
    billingHistory: generateMockInvoices(6),
    activityLog: generateMockActivity(20),
  };

  return details;
}

/**
 * Fetch tenant statistics
 */
export async function fetchTenantStats(): Promise<TenantStats> {
  // In production, this would call the API
  const tenants = generateMockTenants(100);

  const stats: TenantStats = {
    totalTenants: tenants.length,
    activeTenants: tenants.filter((t) => t.status === 'active').length,
    trialTenants: tenants.filter((t) => t.status === 'trial').length,
    churnedTenants: tenants.filter((t) => t.status === 'churned').length,
    totalMrr: tenants.reduce((sum, t) => sum + t.mrr, 0),
    avgMrrPerTenant: tenants.reduce((sum, t) => sum + t.mrr, 0) / tenants.length,
    totalUsers: tenants.reduce((sum, t) => sum + t.userCount, 0),
  };

  return stats;
}

// ============================================================
// TENANT ACTIONS
// ============================================================

/**
 * Suspend a tenant
 */
export async function suspendTenant(
  tenantId: string,
  reason: string,
  adminId: string
): Promise<{ success: boolean; message: string }> {
  console.log('[TENANT ACTION]', { action: 'suspend', tenantId, reason, adminId });
  return { success: true, message: `Tenant ${tenantId} has been suspended` };
}

/**
 * Reactivate a suspended tenant
 */
export async function reactivateTenant(
  tenantId: string,
  adminId: string
): Promise<{ success: boolean; message: string }> {
  console.log('[TENANT ACTION]', { action: 'reactivate', tenantId, adminId });
  return { success: true, message: `Tenant ${tenantId} has been reactivated` };
}

/**
 * Export tenant data
 */
export async function exportTenantData(
  tenantId: string,
  format: 'json' | 'csv'
): Promise<{ success: boolean; downloadUrl: string }> {
  console.log('[TENANT ACTION]', { action: 'export', tenantId, format });
  return { success: true, downloadUrl: `/api/admin/tenants/${tenantId}/export?format=${format}` };
}

// ============================================================
// MOCK DATA GENERATORS
// ============================================================

function generateMockTenants(count: number): TenantSummary[] {
  const plans = ['free', 'starter', 'professional', 'enterprise'];
  const statuses: TenantSummary['status'][] = ['active', 'suspended', 'trial', 'churned'];

  return Array.from({ length: count }, (_, i) => {
    const plan = plans[i % plans.length];
    const status = statuses[Math.floor(Math.random() * 4)];

    // Base MRR by plan
    const baseMrr: Record<string, number> = {
      free: 0,
      starter: 2900,
      professional: 14900,
      enterprise: 49900,
    };

    return {
      id: `tenant_${i + 1}`,
      name: `Company ${i + 1}`,
      slug: `company-${i + 1}`,
      plan,
      status,
      userCount: Math.floor(Math.random() * 20) + 1,
      createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000 * Math.random() * 365),
      lastActiveAt:
        status === 'churned'
          ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          : new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      mrr: baseMrr[plan] + Math.floor(Math.random() * 1000) * 100,
      usage: {
        apiCalls: Math.floor(Math.random() * 50000),
        apiCallsLimit: plan === 'enterprise' ? 1000000 : plan === 'professional' ? 100000 : 10000,
        searches: Math.floor(Math.random() * 5000),
        searchesLimit: plan === 'enterprise' ? 100000 : plan === 'professional' ? 10000 : 1000,
        exports: Math.floor(Math.random() * 500),
        exportsLimit: plan === 'enterprise' ? 10000 : plan === 'professional' ? 1000 : 100,
        storageMb: Math.floor(Math.random() * 5000),
        storageMbLimit: plan === 'enterprise' ? 100000 : plan === 'professional' ? 10000 : 1000,
      },
    };
  });
}

function generateMockTenantUsers(count: number) {
  const roles = ['owner', 'admin', 'analyst', 'viewer'];
  const statuses = ['active', 'disabled', 'pending'];

  return Array.from({ length: count }, (_, i) => ({
    id: `user_${i + 1}`,
    email: `user${i + 1}@tenant.com`,
    name: `User ${i + 1}`,
    role: roles[i % roles.length],
    status: statuses[i % statuses.length] as 'active' | 'disabled' | 'banned' | 'pending' | 'deleted',
    lastActiveAt: i % 3 === 0 ? null : new Date(Date.now() - i * 60 * 60 * 1000),
  }));
}

function generateMockInvoices(count: number) {
  const statuses: Array<'paid' | 'open' | 'failed' | 'void'> = ['paid', 'paid', 'paid', 'open'];

  return Array.from({ length: count }, (_, i) => ({
    id: `inv_${i + 1}`,
    number: `INV-${String(1000 + i).padStart(4, '0')}`,
    amount: 14900 + Math.floor(Math.random() * 5000),
    status: statuses[i % statuses.length],
    createdAt: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000),
    paidAt: statuses[i % statuses.length] === 'paid' ? new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000) : null,
  }));
}

function generateMockActivity(count: number) {
  const actions = [
    'User invited',
    'User removed',
    'Plan upgraded',
    'API key created',
    'Export completed',
    'Settings updated',
    'Domain added',
    'Analysis run',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `activity_${i + 1}`,
    action: actions[i % actions.length],
    actor: `user${(i % 5) + 1}@tenant.com`,
    timestamp: new Date(Date.now() - i * 60 * 60 * 1000 * Math.random() * 24),
    details: {},
  }));
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Get status badge color
 */
export function getTenantStatusColor(status: TenantSummary['status']): string {
  const colors: Record<TenantSummary['status'], string> = {
    active: 'green',
    suspended: 'red',
    trial: 'blue',
    churned: 'gray',
  };
  return colors[status];
}

/**
 * Format MRR for display
 */
export function formatMrr(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Calculate usage percentage
 */
export function getUsagePercentage(used: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

/**
 * Get usage status color
 */
export function getUsageStatusColor(percentage: number): string {
  if (percentage >= 90) return 'red';
  if (percentage >= 70) return 'yellow';
  return 'green';
}
