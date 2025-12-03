/**
 * Signal Impact Panel Component
 * Sprint S55: Discovery UI
 *
 * Panel showing signal impacts grouped by category.
 */

import React, { useState } from 'react';
import type { SignalImpactPanelData, SignalImpactData, SignalImpactCategory } from '../../lib/discovery';

interface SignalImpactPanelProps {
  data: SignalImpactPanelData;
  isLoading?: boolean;
}

export function SignalImpactPanel({ data, isLoading = false }: SignalImpactPanelProps) {
  const [expandedCategory, setExpandedCategory] = useState<SignalImpactCategory | null>(null);

  if (isLoading) {
    return <SignalImpactPanelSkeleton />;
  }

  const categories = Object.entries(data.byCategory) as [SignalImpactCategory, SignalImpactData[]][];

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-3">Signal Impact Analysis</h3>
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total Signals:</span>
            <span className="ml-1 font-semibold text-gray-900">{data.signals.length}</span>
          </div>
          <div>
            <span className="text-green-600 font-medium">+{data.totalPositive}</span>
            <span className="mx-1 text-gray-400">/</span>
            <span className="text-red-600 font-medium">-{data.totalNegative}</span>
          </div>
          <div>
            <span className="text-gray-500">Net Impact:</span>
            <span className={`ml-1 font-semibold ${data.netImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.netImpact >= 0 ? '+' : ''}{data.netImpact.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="divide-y divide-gray-100">
        {categories.map(([category, signals]) => (
          <div key={category}>
            {/* Category Header */}
            <button
              onClick={() =>
                setExpandedCategory(expandedCategory === category ? null : category)
              }
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{getCategoryIcon(category)}</span>
                <span className="font-medium text-gray-700 capitalize">{category}</span>
                <span className="text-xs text-gray-400">({signals.length})</span>
              </div>
              <div className="flex items-center gap-3">
                <CategoryImpactBadge signals={signals} />
                <span className="text-gray-400">
                  {expandedCategory === category ? '▼' : '▶'}
                </span>
              </div>
            </button>

            {/* Signals List */}
            {expandedCategory === category && (
              <div className="px-4 pb-4 space-y-2">
                {signals.map((signal) => (
                  <SignalItem key={signal.id} signal={signal} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Overall Signal Score Contribution</span>
          <span className={`font-semibold ${data.netImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.netImpact >= 0 ? '+' : ''}{data.netImpact.toFixed(1)} points
          </span>
        </div>
      </div>
    </div>
  );
}

function SignalItem({ signal }: { signal: SignalImpactData }) {
  const isPositive = signal.impact === 'positive';
  const isNegative = signal.impact === 'negative';
  const impactColor = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500';
  const bgColor = isPositive ? 'bg-green-50' : isNegative ? 'bg-red-50' : 'bg-gray-50';

  return (
    <div className={`p-3 rounded-lg ${bgColor}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-700">{signal.name}</span>
            <ImpactBadge impact={signal.impact} />
          </div>
          <p className="text-sm text-gray-600">{signal.description}</p>
          <p className="text-xs text-gray-400 mt-1">
            Confidence: {Math.round(signal.confidence * 100)}% • Source: {signal.source}
          </p>
        </div>
        <div className={`text-right ${impactColor}`}>
          <div className="font-semibold">
            {signal.scoreContribution >= 0 ? '+' : ''}{signal.scoreContribution.toFixed(1)}
          </div>
          <div className="text-xs text-gray-400">points</div>
        </div>
      </div>
    </div>
  );
}

function ImpactBadge({ impact }: { impact: 'positive' | 'negative' | 'neutral' }) {
  const colors: Record<string, string> = {
    positive: 'bg-green-100 text-green-700',
    negative: 'bg-red-100 text-red-700',
    neutral: 'bg-gray-100 text-gray-600',
  };

  return (
    <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${colors[impact]}`}>
      {impact}
    </span>
  );
}

function CategoryImpactBadge({ signals }: { signals: SignalImpactData[] }) {
  const positiveCount = signals.filter((s) => s.impact === 'positive').length;
  const negativeCount = signals.filter((s) => s.impact === 'negative').length;
  const net = positiveCount - negativeCount;
  const isPositive = net > 0;

  return (
    <span
      className={`px-2 py-0.5 text-xs rounded-full font-medium ${
        isPositive
          ? 'bg-green-100 text-green-700'
          : net < 0
          ? 'bg-red-100 text-red-700'
          : 'bg-gray-100 text-gray-600'
      }`}
    >
      {isPositive ? '+' : ''}{net}
    </span>
  );
}

function getCategoryIcon(category: SignalImpactCategory): string {
  const icons: Record<SignalImpactCategory, string> = {
    growth: '📈',
    industry: '🏢',
    intent: '🎯',
    financial: '💰',
    timing: '⏱️',
    engagement: '🤝',
    risk: '⚠️',
  };
  return icons[category] || '📊';
}

function SignalImpactPanelSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 animate-pulse">
      <div className="p-4 border-b border-gray-100">
        <div className="w-40 h-5 bg-gray-200 rounded mb-3" />
        <div className="flex items-center gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-24 h-4 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-200 rounded" />
                <div className="w-24 h-4 bg-gray-200 rounded" />
              </div>
              <div className="w-16 h-5 bg-gray-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="w-48 h-4 bg-gray-200 rounded" />
          <div className="w-20 h-4 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export default SignalImpactPanel;
