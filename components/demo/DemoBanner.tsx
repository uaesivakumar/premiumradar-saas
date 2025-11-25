/**
 * Demo Banner Component
 *
 * Shows demo mode status and remaining actions/time.
 */

'use client';

import { useDemoModeStore, formatRemainingTime } from '@/lib/demo';

export function DemoBanner() {
  const { state, getRemainingActions, getRemainingTime, showCTA } = useDemoModeStore();

  if (!state?.isDemo) return null;

  const remainingActions = getRemainingActions();
  const remainingTime = getRemainingTime();
  const actionsPercent = (state.actionsPerformed / state.maxActions) * 100;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Demo badge */}
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">
            DEMO MODE
          </span>
          <span className="text-sm text-white/80">
            Explore PremiumRadar with sample data
          </span>
        </div>

        {/* Center: Progress */}
        <div className="flex items-center gap-6">
          {/* Actions remaining */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/80">Actions:</span>
            <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  actionsPercent > 80 ? 'bg-red-400' : 'bg-white'
                }`}
                style={{ width: `${100 - actionsPercent}%` }}
              />
            </div>
            <span className="text-sm font-medium">{remainingActions} left</span>
          </div>

          {/* Time remaining */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/80">Time:</span>
            <span
              className={`text-sm font-medium ${
                remainingTime < 5 ? 'text-red-300' : ''
              }`}
            >
              {formatRemainingTime(remainingTime)}
            </span>
          </div>
        </div>

        {/* Right: CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => showCTA('manual')}
            className="px-4 py-1.5 bg-white text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors"
          >
            Book a Demo
          </button>
        </div>
      </div>
    </div>
  );
}

// Compact demo indicator for smaller spaces
export function DemoIndicator() {
  const { state, getRemainingActions } = useDemoModeStore();

  if (!state?.isDemo) return null;

  const remainingActions = getRemainingActions();
  const isLow = remainingActions < 10;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
        isLow
          ? 'bg-red-100 text-red-700'
          : 'bg-blue-100 text-blue-700'
      }`}
    >
      <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
      Demo Mode • {remainingActions} actions left
    </div>
  );
}
