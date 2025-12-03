'use client';

/**
 * Audit Log Viewer Page
 * Sprint S59: Audit Layer UI
 *
 * View and filter audit log entries.
 */

import { useState, useMemo } from 'react';
import { useAuditLogs } from '@/lib/intelligence-suite';
import { AuditTable, AuditFilters, AuditDetail, type AuditFiltersState } from '@/components/audit';
import type { AuditEntry } from '@/lib/intelligence-suite/types';

const initialFilters: AuditFiltersState = {
  search: '',
  action: 'all',
  resourceType: 'all',
  dateFrom: '',
  dateTo: '',
  userId: '',
};

export default function AuditPage() {
  const { data: entries, total, isLoading, error } = useAuditLogs();
  const [filters, setFilters] = useState<AuditFiltersState>(initialFilters);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  // Apply filters to entries
  const filteredEntries = useMemo(() => {
    if (!entries || entries.length === 0) return [];

    return entries.filter((entry) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matches =
          entry.details.description.toLowerCase().includes(searchLower) ||
          entry.resourceName?.toLowerCase().includes(searchLower) ||
          entry.resourceId.toLowerCase().includes(searchLower) ||
          entry.userName.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }

      // Action filter
      if (filters.action !== 'all' && entry.action !== filters.action) {
        return false;
      }

      // Resource type filter
      if (filters.resourceType !== 'all' && entry.resourceType !== filters.resourceType) {
        return false;
      }

      // Date filters
      if (filters.dateFrom) {
        const entryDate = new Date(entry.timestamp);
        const fromDate = new Date(filters.dateFrom);
        if (entryDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const entryDate = new Date(entry.timestamp);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (entryDate > toDate) return false;
      }

      // User filter
      if (filters.userId && entry.userId !== filters.userId) {
        return false;
      }

      return true;
    });
  }, [entries, filters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-500">Loading audit logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-red-500">Failed to load audit logs</div>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  // Get unique users for filter dropdown
  const userOptions = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    const users = new Map<string, string>();
    entries.forEach((entry) => {
      users.set(entry.userId, entry.userName);
    });
    return Array.from(users.entries()).map(([id, name]) => ({ id, name }));
  }, [entries]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Audit Log
        </h1>
        <p className="text-gray-500 mt-1">
          View and search system audit entries
        </p>
      </div>

      <AuditFilters
        filters={filters}
        onFiltersChange={setFilters}
        userOptions={userOptions}
      />

      {selectedEntry ? (
        <AuditDetail
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      ) : (
        <AuditTable
          entries={filteredEntries}
          onRowClick={setSelectedEntry}
        />
      )}

      <div className="text-sm text-gray-500 text-center">
        Showing {filteredEntries.length} of {total} entries
      </div>
    </div>
  );
}
