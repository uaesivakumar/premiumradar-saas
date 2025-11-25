/**
 * Signal Viewer Component
 *
 * Display domain signals grouped by category.
 */

'use client';

import { useState } from 'react';
import {
  SIGNAL_TYPE_CONFIG,
  SIGNAL_STRENGTH_CONFIG,
  type SignalSummary,
  type SignalGroup,
  type Signal,
  getSignalTypeColor,
  getSignalStrengthColor,
} from '@/lib/discovery';

interface SignalViewerProps {
  summary: SignalSummary;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function SignalViewer({ summary, onRefresh, isLoading }: SignalViewerProps) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Domain Signals</h3>
          <p className="text-sm text-gray-500">
            {summary.totalSignals} signals from {summary.groups.length} categories
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ScoreBadge score={summary.overallScore} label="Overall" />
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-6 py-3 bg-gray-50 grid grid-cols-4 gap-4 border-b border-gray-100">
        <StatCard label="Strong" value={summary.strongSignals} color="green" />
        <StatCard
          label="Moderate"
          value={summary.totalSignals - summary.strongSignals - summary.weakSignals - summary.negativeSignals}
          color="blue"
        />
        <StatCard label="Weak" value={summary.weakSignals} color="yellow" />
        <StatCard label="Negative" value={summary.negativeSignals} color="red" />
      </div>

      {/* Signal Groups */}
      <div className="divide-y divide-gray-100">
        {summary.groups.map((group) => (
          <SignalGroupCard
            key={group.type}
            group={group}
            isExpanded={expandedGroup === group.type}
            onToggle={() =>
              setExpandedGroup(expandedGroup === group.type ? null : group.type)
            }
          />
        ))}
      </div>

      {/* Last Updated */}
      <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500">
        Last updated: {new Date(summary.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const color =
    score >= 80
      ? 'bg-green-100 text-green-700'
      : score >= 60
        ? 'bg-blue-100 text-blue-700'
        : score >= 40
          ? 'bg-yellow-100 text-yellow-700'
          : 'bg-red-100 text-red-700';

  return (
    <div className={`px-3 py-1.5 rounded-lg ${color}`}>
      <div className="text-xs font-medium">{label}</div>
      <div className="text-lg font-bold">{score}</div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
  };

  return (
    <div className="text-center">
      <div className={`text-xl font-bold ${colorClasses[color]}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function SignalGroupCard({
  group,
  isExpanded,
  onToggle,
}: {
  group: SignalGroup;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = SIGNAL_TYPE_CONFIG[group.type];
  const strengthConfig = SIGNAL_STRENGTH_CONFIG[group.aggregateStrength];

  return (
    <div>
      {/* Group Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div className="text-left">
            <div className="font-medium text-gray-900">{group.label}</div>
            <div className="text-sm text-gray-500">
              {group.signals.length} signal{group.signals.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">
              {group.aggregateScore}
            </div>
            <div
              className="text-xs font-medium"
              style={{ color: getStrengthHex(group.aggregateStrength) }}
            >
              {strengthConfig.label}
            </div>
          </div>
          <span
            className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          >
            ▼
          </span>
        </div>
      </button>

      {/* Expanded Signals */}
      {isExpanded && (
        <div className="px-6 pb-4 space-y-2">
          {group.signals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} />
          ))}
        </div>
      )}
    </div>
  );
}

function SignalCard({ signal }: { signal: Signal }) {
  const strengthConfig = SIGNAL_STRENGTH_CONFIG[signal.strength];

  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{signal.name}</span>
            {signal.trend && <TrendIndicator trend={signal.trend} />}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{signal.description}</p>
        </div>

        <div className="text-right">
          <div className="font-semibold text-gray-900">
            {typeof signal.rawValue === 'number'
              ? signal.rawValue.toLocaleString()
              : signal.rawValue}
          </div>
          <div
            className="text-xs font-medium"
            style={{ color: getStrengthHex(signal.strength) }}
          >
            {strengthConfig.label} ({signal.value}/100)
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <span>Source: {signal.source}</span>
        <span>Confidence: {Math.round(signal.confidence * 100)}%</span>
      </div>
    </div>
  );
}

function TrendIndicator({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  const config = {
    up: { icon: '↑', color: 'text-green-500' },
    down: { icon: '↓', color: 'text-red-500' },
    stable: { icon: '→', color: 'text-gray-400' },
  };

  return <span className={config[trend].color}>{config[trend].icon}</span>;
}

function getStrengthHex(strength: Signal['strength']): string {
  const colors = {
    strong: '#10B981',
    moderate: '#3B82F6',
    weak: '#F59E0B',
    neutral: '#6B7280',
    negative: '#EF4444',
  };
  return colors[strength];
}
