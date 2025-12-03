/**
 * Score Breakdown Component
 * Sprint S55: Discovery UI
 *
 * Visual breakdown of the company score with components and factors.
 */

import React, { useState } from 'react';
import type { ScoreBreakdownData, ScoreComponentData } from '../../lib/discovery';

interface ScoreBreakdownProps {
  data: ScoreBreakdownData;
  isLoading?: boolean;
}

export function ScoreBreakdown({ data, isLoading = false }: ScoreBreakdownProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (isLoading) {
    return <ScoreBreakdownSkeleton />;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header with Total Score */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Score Breakdown</h3>
          <div className="flex items-center gap-2">
            <div className={`text-3xl font-bold ${getScoreColor(data.totalScore)}`}>
              {Math.round(data.totalScore)}
            </div>
            <div className="text-sm text-gray-500">/ 100</div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Based on {data.components.length} scoring components
        </p>
      </div>

      {/* Score Gauge */}
      <div className="p-4 border-b border-gray-100">
        <ScoreGauge score={data.totalScore} />
      </div>

      {/* Components Breakdown */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Score Components</h4>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-600 hover:underline"
          >
            {showDetails ? 'Hide details' : 'Show details'}
          </button>
        </div>

        <div className="space-y-4">
          {data.components.map((component) => (
            <ComponentRow
              key={component.id}
              component={component}
              showDetails={showDetails}
              factors={showDetails ? data.factors.filter(f => true) : []}
            />
          ))}
        </div>
      </div>

      {/* Weights Summary */}
      <div className="p-4 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Weight Distribution</h4>
        <div className="flex h-4 rounded-full overflow-hidden">
          {data.components.map((component, i) => (
            <div
              key={component.id}
              className={`${getWeightColor(i)} transition-all`}
              style={{ width: `${component.weight * 100}%` }}
              title={`${component.name}: ${(component.weight * 100).toFixed(0)}%`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          {data.components.map((component, i) => (
            <div key={component.id} className="flex items-center gap-1 text-xs">
              <div className={`w-2 h-2 rounded-full ${getWeightColor(i)}`} />
              <span className="text-gray-600">{component.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComponentRow({
  component,
  showDetails,
  factors
}: {
  component: ScoreComponentData;
  showDetails: boolean;
  factors: ScoreBreakdownData['factors'];
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{component.name}</span>
          <span className="text-xs text-gray-400">
            ({(component.weight * 100).toFixed(0)}% weight)
          </span>
        </div>
        <span className={`text-sm font-semibold ${getScoreColor(component.value)}`}>
          {Math.round(component.value)}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getScoreBarColor(component.value)}`}
          style={{ width: `${component.value}%` }}
        />
      </div>

      {/* Description when expanded */}
      {showDetails && component.description && (
        <p className="mt-1 text-xs text-gray-500">{component.description}</p>
      )}
    </div>
  );
}

function ScoreGauge({ score }: { score: number }) {
  return (
    <div className="relative flex flex-col items-center">
      {/* Simple visual gauge */}
      <div className="w-full h-6 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${getScoreBarColor(score)} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between w-full mt-2 text-xs text-gray-400">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>

      {/* Score Label */}
      <div className="mt-2">
        <span className={`text-sm font-medium ${getScoreLabel(score).color}`}>
          {getScoreLabel(score).label}
        </span>
      </div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-600';
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

function getWeightColor(index: number): string {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-cyan-500',
    'bg-teal-500',
  ];
  return colors[index % colors.length];
}

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: 'text-green-600' };
  if (score >= 60) return { label: 'Good', color: 'text-yellow-600' };
  if (score >= 40) return { label: 'Fair', color: 'text-orange-500' };
  return { label: 'Needs Attention', color: 'text-red-600' };
}

function ScoreBreakdownSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 animate-pulse">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="w-32 h-5 bg-gray-200 rounded" />
          <div className="w-16 h-8 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="p-4 border-b border-gray-100">
        <div className="w-full h-6 bg-gray-200 rounded-full" />
      </div>
      <div className="p-4 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <div className="w-24 h-4 bg-gray-200 rounded" />
              <div className="w-8 h-4 bg-gray-200 rounded" />
            </div>
            <div className="h-2 bg-gray-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ScoreBreakdown;
