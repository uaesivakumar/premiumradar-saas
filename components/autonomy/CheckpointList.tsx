'use client';

/**
 * CheckpointList Component
 * Sprint S58: Autonomous Safety UI
 *
 * Displays checkpoints requiring review or approval.
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import type { AutonomousCheckpoint } from '@/lib/intelligence-suite/types';

interface CheckpointListProps {
  checkpoints: AutonomousCheckpoint[];
  className?: string;
}

export function CheckpointList({ checkpoints, className }: CheckpointListProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filteredCheckpoints = checkpoints.filter((cp) => {
    if (filter === 'all') return true;
    return cp.status === filter;
  });

  const pendingCount = checkpoints.filter((cp) => cp.status === 'pending').length;

  const getTypeIcon = (type: AutonomousCheckpoint['type']) => {
    switch (type) {
      case 'approval-required':
        return '✋';
      case 'threshold-exceeded':
        return '📊';
      case 'anomaly-detected':
        return '⚠';
      case 'scheduled':
        return '📅';
      default:
        return '📋';
    }
  };

  const getStatusColor = (status: AutonomousCheckpoint['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700', className)}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Checkpoints
            </h3>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full animate-pulse">
                {pendingCount} pending
              </span>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded transition-colors',
                  filter === f
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-80 overflow-y-auto">
        {filteredCheckpoints.map((checkpoint) => (
          <CheckpointRow key={checkpoint.id} checkpoint={checkpoint} />
        ))}

        {filteredCheckpoints.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No checkpoints found
          </div>
        )}
      </div>
    </div>
  );
}

interface CheckpointRowProps {
  checkpoint: AutonomousCheckpoint;
}

function CheckpointRow({ checkpoint }: CheckpointRowProps) {
  const [expanded, setExpanded] = useState(false);

  const getTypeIcon = (type: AutonomousCheckpoint['type']) => {
    switch (type) {
      case 'approval-required':
        return '✋';
      case 'threshold-exceeded':
        return '📊';
      case 'anomaly-detected':
        return '⚠';
      case 'scheduled':
        return '📅';
      default:
        return '📋';
    }
  };

  const getStatusColor = (status: AutonomousCheckpoint['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <div
        className="flex items-start gap-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Type Icon */}
        <span className="text-xl">{getTypeIcon(checkpoint.type)}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {checkpoint.title}
            </h4>
            <span className={cn(
              'px-2 py-0.5 text-xs font-medium rounded',
              getStatusColor(checkpoint.status)
            )}>
              {checkpoint.status}
            </span>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
            {checkpoint.description}
          </p>

          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>
              Created: {new Date(checkpoint.createdAt).toLocaleString()}
            </span>
            {checkpoint.expiresAt && (
              <span>
                Expires: {new Date(checkpoint.expiresAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Expand Toggle */}
        <button className="text-gray-400">
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 ml-9 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          {checkpoint.approvedBy && (
            <div className="text-sm mb-2">
              <span className="text-gray-500">Approved by:</span>{' '}
              <span className="font-medium">{checkpoint.approvedBy}</span>
              {checkpoint.approvedAt && (
                <span className="text-gray-500 ml-2">
                  at {new Date(checkpoint.approvedAt).toLocaleString()}
                </span>
              )}
            </div>
          )}

          {Object.keys(checkpoint.context).length > 0 && (
            <div className="text-sm">
              <span className="text-gray-500">Context:</span>
              <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                {JSON.stringify(checkpoint.context, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CheckpointList;
