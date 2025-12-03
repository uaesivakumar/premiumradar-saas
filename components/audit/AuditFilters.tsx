'use client';

/**
 * AuditFilters Component
 * Sprint S59: Audit Layer UI
 *
 * Provides filtering and search controls for audit log entries.
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';
import type { AuditEntry } from '@/lib/intelligence-suite/types';

export interface AuditFiltersState {
  search: string;
  action: AuditEntry['action'] | 'all';
  resourceType: AuditEntry['resourceType'] | 'all';
  dateFrom: string;
  dateTo: string;
  userId: string;
}

interface AuditFiltersProps {
  filters: AuditFiltersState;
  onFiltersChange: (filters: AuditFiltersState) => void;
  userOptions?: { id: string; name: string }[];
  className?: string;
}

export function AuditFilters({
  filters,
  onFiltersChange,
  userOptions = [],
  className,
}: AuditFiltersProps) {
  const actionOptions: (AuditEntry['action'] | 'all')[] = [
    'all',
    'create',
    'update',
    'delete',
    'execute',
    'approve',
    'reject',
    'login',
    'logout',
    'config_change',
  ];

  const resourceTypeOptions: (AuditEntry['resourceType'] | 'all')[] = [
    'all',
    'journey',
    'persona',
    'object',
    'signal',
    'evidence',
    'outreach',
    'autonomous',
    'config',
    'user',
    'workspace',
    'api_key',
  ];

  const handleChange = (key: keyof AuditFiltersState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      action: 'all',
      resourceType: 'all',
      dateFrom: '',
      dateTo: '',
      userId: '',
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.action !== 'all' ||
    filters.resourceType !== 'all' ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.userId;

  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4',
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Filter Audit Logs
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search by description, resource..."
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>

        {/* Action Filter */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Action</label>
          <select
            value={filters.action}
            onChange={(e) => handleChange('action', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {actionOptions.map((action) => (
              <option key={action} value={action}>
                {action === 'all' ? 'All Actions' : action.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Resource Type Filter */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Resource Type</label>
          <select
            value={filters.resourceType}
            onChange={(e) => handleChange('resourceType', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {resourceTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">From Date</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleChange('dateFrom', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">To Date</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleChange('dateTo', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* User Filter */}
        {userOptions.length > 0 && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">User</label>
            <select
              value={filters.userId}
              onChange={(e) => handleChange('userId', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Users</option>
              {userOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Quick Filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-xs text-gray-500">Quick filters:</span>
        <QuickFilterButton
          label="Today"
          active={isToday(filters.dateFrom, filters.dateTo)}
          onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            onFiltersChange({ ...filters, dateFrom: today, dateTo: today });
          }}
        />
        <QuickFilterButton
          label="Last 7 days"
          active={isLast7Days(filters.dateFrom, filters.dateTo)}
          onClick={() => {
            const today = new Date();
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            onFiltersChange({
              ...filters,
              dateFrom: weekAgo.toISOString().split('T')[0],
              dateTo: today.toISOString().split('T')[0],
            });
          }}
        />
        <QuickFilterButton
          label="Config Changes"
          active={filters.action === 'config_change'}
          onClick={() =>
            onFiltersChange({
              ...filters,
              action: filters.action === 'config_change' ? 'all' : 'config_change',
            })
          }
        />
        <QuickFilterButton
          label="AI Actions"
          active={filters.resourceType === 'autonomous'}
          onClick={() =>
            onFiltersChange({
              ...filters,
              resourceType: filters.resourceType === 'autonomous' ? 'all' : 'autonomous',
            })
          }
        />
        <QuickFilterButton
          label="Deletions"
          active={filters.action === 'delete'}
          onClick={() =>
            onFiltersChange({
              ...filters,
              action: filters.action === 'delete' ? 'all' : 'delete',
            })
          }
        />
      </div>
    </div>
  );
}

interface QuickFilterButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function QuickFilterButton({ label, active, onClick }: QuickFilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2 py-1 text-xs rounded-full transition-colors',
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
      )}
    >
      {label}
    </button>
  );
}

function isToday(from: string, to: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return from === today && to === today;
}

function isLast7Days(from: string, to: string): boolean {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  return (
    from === weekAgo.toISOString().split('T')[0] &&
    to === today.toISOString().split('T')[0]
  );
}

export default AuditFilters;
