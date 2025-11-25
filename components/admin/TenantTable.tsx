/**
 * Tenant Table Component
 *
 * Data table for viewing and managing all tenants.
 */

'use client';

import { useState, useEffect } from 'react';
import {
  useTenantViewerStore,
  fetchTenants,
  fetchTenantStats,
  getTenantStatusColor,
  formatMrr,
  getUsagePercentage,
  type TenantSummary,
  type TenantFilters,
} from '@/lib/admin';

interface TenantTableProps {
  onSelectTenant?: (tenant: TenantSummary) => void;
  onImpersonate?: (tenant: TenantSummary) => void;
}

export function TenantTable({ onSelectTenant, onImpersonate }: TenantTableProps) {
  const {
    tenants,
    setTenants,
    filters,
    setFilters,
    pagination,
    setPagination,
    stats,
    setStats,
    isLoading,
    setLoading,
  } = useTenantViewerStore();

  const [searchInput, setSearchInput] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadData();
  }, [filters, pagination]);

  async function loadData() {
    setLoading(true);
    try {
      const [tenantsResult, statsResult] = await Promise.all([
        fetchTenants(filters, pagination),
        fetchTenantStats(),
      ]);

      setTenants(tenantsResult.items);
      setTotalPages(tenantsResult.totalPages);
      setTotalCount(tenantsResult.total);
      setStats(statsResult);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilters({ search: searchInput });
  }

  function handleStatusFilter(status: TenantSummary['status'] | 'all') {
    if (status === 'all') {
      setFilters({ status: undefined });
    } else {
      setFilters({ status: [status] });
    }
  }

  function handleSort(column: string) {
    const newOrder =
      pagination.sortBy === column && pagination.sortOrder === 'asc' ? 'desc' : 'asc';
    setPagination({ sortBy: column, sortOrder: newOrder });
  }

  const statusColors: Record<TenantSummary['status'], string> = {
    active: 'bg-green-100 text-green-700',
    suspended: 'bg-red-100 text-red-700',
    trial: 'bg-blue-100 text-blue-700',
    churned: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Tenants</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalTenants}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Active</div>
            <div className="text-2xl font-bold text-green-600">{stats.activeTenants}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total MRR</div>
            <div className="text-2xl font-bold text-gray-900">{formatMrr(stats.totalMrr)}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm text-gray-500">Total Users</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search tenants..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>

          <div className="flex gap-2">
            {(['all', 'active', 'trial', 'suspended', 'churned'] as const).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  (status === 'all' && !filters.status) ||
                  filters.status?.includes(status as TenantSummary['status'])
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Tenant
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('plan')}
                >
                  Plan
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  Status
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('userCount')}
                >
                  Users
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('mrr')}
                >
                  MRR
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No tenants found
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onSelectTenant?.(tenant)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{tenant.name}</div>
                        <div className="text-sm text-gray-500">{tenant.slug}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-sm text-gray-700">{tenant.plan}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[tenant.status]}`}
                      >
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{tenant.userCount}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatMrr(tenant.mrr)}</td>
                    <td className="px-4 py-3">
                      <div className="w-24">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>API</span>
                          <span>
                            {getUsagePercentage(tenant.usage.apiCalls, tenant.usage.apiCallsLimit)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{
                              width: `${getUsagePercentage(tenant.usage.apiCalls, tenant.usage.apiCallsLimit)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onImpersonate?.(tenant);
                          }}
                          className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          Impersonate
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTenant?.(tenant);
                          }}
                          className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, totalCount)} of {totalCount} tenants
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination({ page: pagination.page - 1 })}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination({ page: pagination.page + 1 })}
              disabled={pagination.page >= totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TenantTable;
