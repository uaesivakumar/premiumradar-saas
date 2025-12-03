'use client';

/**
 * AuditDetail Component
 * Sprint S59: Audit Layer UI
 *
 * Full-page detail view for a single audit entry with complete information.
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';
import type { AuditEntry } from '@/lib/intelligence-suite/types';

interface AuditDetailProps {
  entry: AuditEntry;
  onClose?: () => void;
  className?: string;
}

export function AuditDetail({ entry, onClose, className }: AuditDetailProps) {
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
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getResourceIcon(entry.resourceType)}</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Audit Entry Detail
              </h2>
              <p className="text-sm text-gray-500 font-mono">{entry.id}</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Timestamp</label>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {new Date(entry.timestamp).toLocaleString()}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">User</label>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {entry.userName}
            </div>
            <div className="text-xs text-gray-500 font-mono">{entry.userId}</div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Action</label>
            <span
              className={cn(
                'inline-block px-2 py-1 text-xs font-medium rounded',
                getActionColor(entry.action)
              )}
            >
              {entry.action}
            </span>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Resource Type</label>
            <div className="text-sm font-medium text-gray-900 dark:text-white capitalize">
              {entry.resourceType.replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        {/* Resource Information */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Resource Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Resource ID</label>
              <div className="text-sm font-mono text-gray-900 dark:text-white break-all">
                {entry.resourceId}
              </div>
            </div>
            {entry.resourceName && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Resource Name</label>
                <div className="text-sm text-gray-900 dark:text-white">
                  {entry.resourceName}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {entry.details.description}
          </p>
        </div>

        {/* Connection Information */}
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Connection Details
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {entry.ipAddress && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">IP Address</label>
                <div className="font-mono text-gray-900 dark:text-white">
                  {entry.ipAddress}
                </div>
              </div>
            )}
            {entry.userAgent && (
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">User Agent</label>
                <div className="text-xs text-gray-600 dark:text-gray-400 break-all">
                  {entry.userAgent}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Information */}
        {(entry.details.promptVersion || entry.details.aiModel) && (
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-3">
              AI Context
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {entry.details.promptVersion && (
                <div>
                  <label className="block text-xs text-purple-600 dark:text-purple-400 mb-1">
                    Prompt Version
                  </label>
                  <div className="font-mono text-purple-900 dark:text-purple-100">
                    {entry.details.promptVersion}
                  </div>
                </div>
              )}
              {entry.details.aiModel && (
                <div>
                  <label className="block text-xs text-purple-600 dark:text-purple-400 mb-1">
                    AI Model
                  </label>
                  <div className="text-purple-900 dark:text-purple-100">
                    {entry.details.aiModel}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Changes */}
        {entry.details.changes && entry.details.changes.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Field Changes ({entry.details.changes.length})
            </h3>
            <div className="space-y-3">
              {entry.details.changes.map((change, i) => (
                <div
                  key={i}
                  className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3"
                >
                  <div className="font-medium text-gray-900 dark:text-white mb-2">
                    {change.field}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-red-600 mb-1">
                        Previous Value
                      </label>
                      <pre className="text-xs bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-2 rounded overflow-x-auto">
                        {JSON.stringify(change.oldValue, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <label className="block text-xs text-green-600 mb-1">
                        New Value
                      </label>
                      <pre className="text-xs bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-2 rounded overflow-x-auto">
                        {JSON.stringify(change.newValue, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Before/After Snapshots */}
        {entry.details.before && entry.details.after && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              State Snapshots
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Before State
                </label>
                <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                  {JSON.stringify(entry.details.before, null, 2)}
                </pre>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  After State
                </label>
                <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                  {JSON.stringify(entry.details.after, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        {Object.keys(entry.metadata).length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Metadata
            </h3>
            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded-lg overflow-x-auto">
              {JSON.stringify(entry.metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditDetail;
