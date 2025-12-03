'use client';

/**
 * KillSwitchPanel Component
 * Sprint S58: Autonomous Safety UI
 *
 * Displays kill switch status and controls.
 * READ-ONLY: Shows status from OS, no direct control.
 */

import React from 'react';
import { cn } from '@/lib/utils/cn';
import type { KillSwitchState } from '@/lib/intelligence-suite/types';

interface KillSwitchPanelProps {
  killSwitch: KillSwitchState;
  className?: string;
}

export function KillSwitchPanel({ killSwitch, className }: KillSwitchPanelProps) {
  const { active, triggeredAt, triggeredBy, reason, canResume } = killSwitch;

  if (!active) {
    return (
      <div className={cn(
        'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4',
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
            <span className="text-green-600 dark:text-green-300 text-xl">✓</span>
          </div>
          <div>
            <h3 className="font-medium text-green-800 dark:text-green-300">
              Kill Switch Inactive
            </h3>
            <p className="text-sm text-green-600 dark:text-green-400">
              Autonomous operations are running normally
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4',
      className
    )}>
      <div className="flex items-start gap-4">
        {/* Alert Icon */}
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center flex-shrink-0">
          <span className="text-red-600 dark:text-red-300 text-2xl animate-pulse">⚠</span>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="font-semibold text-red-800 dark:text-red-300 text-lg">
            Kill Switch Activated
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            All autonomous operations have been halted
          </p>

          {/* Details */}
          <div className="mt-4 space-y-2 text-sm">
            {triggeredAt && (
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <span className="font-medium">Triggered:</span>
                <span>{new Date(triggeredAt).toLocaleString()}</span>
              </div>
            )}
            {triggeredBy && (
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <span className="font-medium">By:</span>
                <span>{triggeredBy}</span>
              </div>
            )}
            {reason && (
              <div className="flex items-start gap-2 text-red-700 dark:text-red-300">
                <span className="font-medium">Reason:</span>
                <span>{reason}</span>
              </div>
            )}
          </div>

          {/* Resume Status */}
          <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <span className={cn(
                'w-2 h-2 rounded-full',
                canResume ? 'bg-yellow-500' : 'bg-red-500'
              )} />
              <span className="text-sm text-red-700 dark:text-red-300">
                {canResume
                  ? 'System can be resumed after review'
                  : 'Manual intervention required to resume'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default KillSwitchPanel;
