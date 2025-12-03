'use client';

/**
 * AuditTable Component
 * Sprint S59: Audit Layer UI
 *
 * Displays audit log entries in a table format with expandable details.
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import type { AuditEntry } from '@/lib/intelligence-suite/types';

interface AuditTableProps {
  entries: AuditEntry[];
  onRowClick?: (entry: AuditEntry) => void;
  className?: string;
}

export function AuditTable({ entries, onRowClick, className }: AuditTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getActionColor = (action: AuditEntry['action']) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'update':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'delete':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'execute':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
      case 'approve':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'reject':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'login':
      case 'logout':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'config_change':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getResourceIcon = (resourceType: AuditEntry['resourceType']) => {
    switch (resourceType) {
      case 'journey':
        return '🛤';
      case 'persona':
        return '👤';
      case 'object':
        return '📦';
      case 'signal':
        return '📡';
      case 'evidence':
        return '📋';
      case 'outreach':
        return '📧';
      case 'autonomous':
        return '🤖';
      case 'config':
        return '⚙';
      case 'user':
        return '👤';
      case 'workspace':
        return '🏢';
      case 'api_key':
        return '🔑';
      default:
        return '📄';
    }
  };

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden', className)}>
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
        <div className="col-span-2">Timestamp</div>
        <div className="col-span-2">User</div>
        <div className="col-span-2">Action</div>
        <div className="col-span-3">Resource</div>
        <div className="col-span-3">Description</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {entries.map((entry) => (
          <div key={entry.id}>
            {/* Main Row */}
            <div
              className={cn(
                'grid grid-cols-12 gap-4 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors',
                expandedId === entry.id && 'bg-blue-50 dark:bg-blue-900/20'
              )}
              onClick={() => {
                setExpandedId(expandedId === entry.id ? null : entry.id);
                onRowClick?.(entry);
              }}
            >
              {/* Timestamp */}
              <div className="col-span-2 text-gray-500 dark:text-gray-400">
                <div>{new Date(entry.timestamp).toLocaleDateString()}</div>
                <div className="text-xs">{new Date(entry.timestamp).toLocaleTimeString()}</div>
              </div>

              {/* User */}
              <div className="col-span-2">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {entry.userName}
                </div>
              </div>

              {/* Action */}
              <div className="col-span-2">
                <span className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded',
                  getActionColor(entry.action)
                )}>
                  {entry.action}
                </span>
              </div>

              {/* Resource */}
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <span>{getResourceIcon(entry.resourceType)}</span>
                  <div className="truncate">
                    <div className="text-gray-900 dark:text-white">
                      {entry.resourceName || entry.resourceId}
                    </div>
                    <div className="text-xs text-gray-500">{entry.resourceType}</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="col-span-3 text-gray-600 dark:text-gray-400 truncate">
                {entry.details.description}
              </div>
            </div>

            {/* Expanded Details */}
            {expandedId === entry.id && (
              <AuditEntryDetails entry={entry} />
            )}
          </div>
        ))}

        {entries.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No audit entries found
          </div>
        )}
      </div>
    </div>
  );
}

interface AuditEntryDetailsProps {
  entry: AuditEntry;
}

function AuditEntryDetails({ entry }: AuditEntryDetailsProps) {
  return (
    <div className="px-4 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-600">
      <div className="grid grid-cols-2 gap-6">
        {/* Metadata */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Details
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">ID:</span>{' '}
              <span className="font-mono text-gray-900 dark:text-white">{entry.id}</span>
            </div>
            <div>
              <span className="text-gray-500">User ID:</span>{' '}
              <span className="font-mono text-gray-900 dark:text-white">{entry.userId}</span>
            </div>
            {entry.ipAddress && (
              <div>
                <span className="text-gray-500">IP Address:</span>{' '}
                <span className="font-mono text-gray-900 dark:text-white">{entry.ipAddress}</span>
              </div>
            )}
            {entry.userAgent && (
              <div>
                <span className="text-gray-500">User Agent:</span>{' '}
                <span className="text-gray-900 dark:text-white text-xs">{entry.userAgent}</span>
              </div>
            )}
            {entry.details.promptVersion && (
              <div>
                <span className="text-gray-500">AI Prompt Version:</span>{' '}
                <span className="font-mono text-gray-900 dark:text-white">{entry.details.promptVersion}</span>
              </div>
            )}
            {entry.details.aiModel && (
              <div>
                <span className="text-gray-500">AI Model:</span>{' '}
                <span className="text-gray-900 dark:text-white">{entry.details.aiModel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Changes */}
        <div>
          {entry.details.changes && entry.details.changes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Changes
              </h4>
              <div className="space-y-2">
                {entry.details.changes.map((change, i) => (
                  <div key={i} className="text-sm bg-white dark:bg-gray-800 rounded p-2">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                      {change.field}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Before:</span>
                        <pre className="mt-1 text-red-600 dark:text-red-400 overflow-x-auto">
                          {JSON.stringify(change.oldValue, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <span className="text-gray-500">After:</span>
                        <pre className="mt-1 text-green-600 dark:text-green-400 overflow-x-auto">
                          {JSON.stringify(change.newValue, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {entry.details.before && entry.details.after && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Before / After Snapshot
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-gray-500">Before</span>
                  <pre className="mt-1 text-xs bg-white dark:bg-gray-800 p-2 rounded overflow-x-auto">
                    {JSON.stringify(entry.details.before, null, 2)}
                  </pre>
                </div>
                <div>
                  <span className="text-xs text-gray-500">After</span>
                  <pre className="mt-1 text-xs bg-white dark:bg-gray-800 p-2 rounded overflow-x-auto">
                    {JSON.stringify(entry.details.after, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Raw Metadata */}
      {Object.keys(entry.metadata).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Metadata
          </h4>
          <pre className="text-xs bg-white dark:bg-gray-800 p-2 rounded overflow-x-auto">
            {JSON.stringify(entry.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default AuditTable;
