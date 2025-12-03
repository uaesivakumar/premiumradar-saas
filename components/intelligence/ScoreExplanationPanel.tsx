'use client';

/**
 * ScoreExplanationPanel Component
 * Sprint S61: Score Explanation Engine
 *
 * Displays detailed score breakdown with explanations and factor analysis.
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import type { ScoreExplanationUI } from '@/lib/intelligence-suite/transformers';

interface ScoreExplanationPanelProps {
  score: ScoreExplanationUI;
  className?: string;
}

export function ScoreExplanationPanel({
  score,
  className,
}: ScoreExplanationPanelProps) {
  const [activeTab, setActiveTab] = useState<'breakdown' | 'factors' | 'history'>('breakdown');

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700', className)}>
      {/* Header with Score Gauge */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-6">
          {/* Score Gauge */}
          <div className="relative w-24 h-24">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                strokeWidth="8"
                fill="none"
                className="stroke-gray-200 dark:stroke-gray-700"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(score.totalScore / 100) * 251.2} 251.2`}
                className={cn(
                  score.totalScore >= 80 ? 'stroke-green-500' :
                  score.totalScore >= 60 ? 'stroke-yellow-500' :
                  score.totalScore >= 40 ? 'stroke-orange-500' :
                  'stroke-red-500'
                )}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {score.totalScore}
              </span>
              <span className={cn(
                'text-sm font-semibold',
                score.scoreGrade === 'A' ? 'text-green-600' :
                score.scoreGrade === 'B' ? 'text-blue-600' :
                score.scoreGrade === 'C' ? 'text-yellow-600' :
                score.scoreGrade === 'D' ? 'text-orange-600' :
                'text-red-600'
              )}>
                Grade {score.scoreGrade}
              </span>
            </div>
          </div>

          {/* Explanation Summary */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Score Explanation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {score.explanation.summary}
            </p>

            {/* Trend indicator */}
            <div className="flex items-center gap-2 mt-2">
              <span className={cn(
                'text-sm font-medium',
                score.history.trend === 'up' ? 'text-green-600' :
                score.history.trend === 'down' ? 'text-red-600' :
                'text-gray-500'
              )}>
                {score.history.trend === 'up' ? '↑' : score.history.trend === 'down' ? '↓' : '→'}
                {' '}{Math.abs(score.history.change).toFixed(1)} pts
              </span>
              <span className="text-xs text-gray-400">vs last period</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex">
          {(['breakdown', 'factors', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'breakdown' && (
          <ScoreBreakdownTab components={score.components} />
        )}
        {activeTab === 'factors' && (
          <ScoreFactorsTab factors={score.factors} />
        )}
        {activeTab === 'history' && (
          <ScoreHistoryTab history={score.history} />
        )}
      </div>

      {/* Recommendations */}
      {score.explanation.recommendations.length > 0 && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
            Recommendations
          </h4>
          <ul className="space-y-1">
            {score.explanation.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
                <span>•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface ScoreBreakdownTabProps {
  components: ScoreExplanationUI['components'];
}

function ScoreBreakdownTab({ components }: ScoreBreakdownTabProps) {
  return (
    <div className="space-y-4">
      {components.map((comp) => (
        <div key={comp.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>{comp.icon}</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {comp.name}
              </span>
              <span className="text-xs text-gray-500">
                ({(comp.weight * 100).toFixed(0)}% weight)
              </span>
            </div>
            <span className="font-bold" style={{ color: comp.color }}>
              {comp.value.toFixed(0)}
            </span>
          </div>

          <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${comp.value}%`,
                backgroundColor: comp.color,
              }}
            />
          </div>

          <div className="text-xs text-gray-500">
            Contributes {comp.contribution.toFixed(1)} points to total score
          </div>
        </div>
      ))}
    </div>
  );
}

interface ScoreFactorsTabProps {
  factors: ScoreExplanationUI['factors'];
}

function ScoreFactorsTab({ factors }: ScoreFactorsTabProps) {
  return (
    <div className="space-y-6">
      {/* Positive Factors */}
      <div>
        <h4 className="text-sm font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Key Drivers ({factors.positive.length})
        </h4>
        <div className="space-y-2">
          {factors.positive.map((factor) => (
            <FactorRow key={factor.id} factor={factor} type="positive" />
          ))}
          {factors.positive.length === 0 && (
            <p className="text-sm text-gray-500">No positive factors identified</p>
          )}
        </div>
      </div>

      {/* Negative Factors */}
      <div>
        <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          Key Risks ({factors.negative.length})
        </h4>
        <div className="space-y-2">
          {factors.negative.map((factor) => (
            <FactorRow key={factor.id} factor={factor} type="negative" />
          ))}
          {factors.negative.length === 0 && (
            <p className="text-sm text-gray-500">No risk factors identified</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface FactorRowProps {
  factor: ScoreExplanationUI['factors']['positive'][0];
  type: 'positive' | 'negative';
}

function FactorRow({ factor, type }: FactorRowProps) {
  return (
    <div className={cn(
      'p-2 rounded-lg text-sm',
      type === 'positive' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
    )}>
      <div className="flex items-center justify-between">
        <span className={cn(
          'font-medium',
          type === 'positive' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
        )}>
          {factor.name}
        </span>
        <span className={cn(
          'text-xs font-semibold',
          type === 'positive' ? 'text-green-600' : 'text-red-600'
        )}>
          {type === 'positive' ? '+' : '-'}{factor.magnitude.toFixed(1)}
        </span>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
        {factor.description}
      </p>
    </div>
  );
}

interface ScoreHistoryTabProps {
  history: ScoreExplanationUI['history'];
}

function ScoreHistoryTab({ history }: ScoreHistoryTabProps) {
  if (history.data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No historical data available
      </div>
    );
  }

  const maxScore = Math.max(...history.data.map((d) => d.score));
  const minScore = Math.min(...history.data.map((d) => d.score));
  const range = maxScore - minScore || 1;

  return (
    <div>
      <div className="h-40 flex items-end gap-1">
        {history.data.map((point, index) => {
          const height = ((point.score - minScore) / range) * 100 + 20;

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center"
            >
              <div
                className={cn(
                  'w-full rounded-t transition-all',
                  history.trend === 'up' ? 'bg-green-500' :
                  history.trend === 'down' ? 'bg-red-500' :
                  'bg-blue-500'
                )}
                style={{ height: `${height}%` }}
              />
              <span className="text-xs text-gray-400 mt-1">
                {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-center">
        <span className={cn(
          'text-lg font-semibold',
          history.trend === 'up' ? 'text-green-600' :
          history.trend === 'down' ? 'text-red-600' :
          'text-gray-600'
        )}>
          {history.trend === 'up' ? '↑ Improving' :
           history.trend === 'down' ? '↓ Declining' :
           '→ Stable'}
        </span>
        <span className="text-sm text-gray-500 ml-2">
          {history.change > 0 ? '+' : ''}{history.change.toFixed(1)} points
        </span>
      </div>
    </div>
  );
}

export default ScoreExplanationPanel;
