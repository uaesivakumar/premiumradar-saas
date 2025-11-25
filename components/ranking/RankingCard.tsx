/**
 * Ranking Card Component
 *
 * Display a ranked domain with scores and explanation.
 */

'use client';

import { useState } from 'react';
import {
  type RankedDomain,
  getScoreTier,
  getTierColor,
  getRankChangeIndicator,
  getCategoryIcon,
  getCategoryLabel,
} from '@/lib/ranking';

interface RankingCardProps {
  domain: RankedDomain;
  showExplanation?: boolean;
  onSelect?: (domain: RankedDomain) => void;
  onAction?: (action: string, domain: RankedDomain) => void;
}

export function RankingCard({
  domain,
  showExplanation = true,
  onSelect,
  onAction,
}: RankingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const tier = getScoreTier(domain.scores.composite);
  const tierColor = getTierColor(tier);
  const changeIndicator = getRankChangeIndicator(domain.rank, domain.previousRank);

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-md transition-all"
      onClick={() => onSelect?.(domain)}
    >
      {/* Header with Rank */}
      <div className="px-5 py-4 flex items-start justify-between border-b border-gray-100">
        <div className="flex items-center gap-4">
          {/* Rank Badge */}
          <div className="flex flex-col items-center">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
                domain.rank <= 3
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              #{domain.rank}
            </div>
            <RankChange indicator={changeIndicator} />
          </div>

          {/* Domain Info */}
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">{domain.domain}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <span>{domain.metadata.length} chars</span>
              <span>•</span>
              <span>{domain.metadata.tld}</span>
              {domain.metadata.vertical && (
                <>
                  <span>•</span>
                  <span className="text-purple-600">{domain.metadata.vertical}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Composite Score */}
        <div className={`text-center px-4 py-2 rounded-lg ${getTierBgColor(tier)}`}>
          <div className="text-2xl font-bold">{domain.scores.composite}</div>
          <div className="text-xs font-medium capitalize">{tier}</div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="px-5 py-4 grid grid-cols-4 gap-4">
        <ScoreItem
          category="quality"
          score={domain.scores.quality}
          weight={0.3}
        />
        <ScoreItem
          category="traffic"
          score={domain.scores.traffic}
          weight={0.25}
        />
        <ScoreItem
          category="liquidity"
          score={domain.scores.liquidity}
          weight={0.2}
        />
        <ScoreItem
          category="endUser"
          score={domain.scores.endUser}
          weight={0.25}
        />
      </div>

      {/* Signals */}
      {domain.signals.length > 0 && (
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-3 overflow-x-auto">
            {domain.signals.map((signal, index) => (
              <SignalPill key={index} signal={signal} />
            ))}
          </div>
        </div>
      )}

      {/* Explanation Toggle */}
      {showExplanation && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="w-full px-5 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors border-t border-gray-100 flex items-center justify-center gap-2"
        >
          {isExpanded ? 'Hide Explanation' : 'Show Explanation'}
          <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
      )}

      {/* Expanded Explanation */}
      {isExpanded && (
        <div className="px-5 py-4 bg-blue-50 border-t border-blue-100">
          <p className="text-sm text-gray-700 mb-3">{domain.explanation.summary}</p>

          {/* Top Factors */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-500 uppercase">Top Factors</h4>
            {domain.explanation.topFactors.slice(0, 3).map((factor) => (
              <div
                key={factor.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-700">{factor.name}</span>
                <span
                  className={`font-medium ${
                    factor.impact === 'positive'
                      ? 'text-green-600'
                      : factor.impact === 'negative'
                        ? 'text-red-600'
                        : 'text-gray-500'
                  }`}
                >
                  {factor.impact === 'positive' ? '+' : ''}
                  {factor.contribution.toFixed(1)} pts
                </span>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {domain.explanation.recommendations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-blue-200">
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                Recommendations
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {domain.explanation.recommendations.slice(0, 2).map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-5 py-3 flex items-center justify-between border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Confidence: {Math.round(domain.scores.confidence * 100)}%</span>
          <span>•</span>
          <span>Updated: {new Date(domain.lastUpdated).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction?.('analyze', domain);
            }}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Analyze
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAction?.('outreach', domain);
            }}
            className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Outreach
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoreItem({
  category,
  score,
  weight,
}: {
  category: 'quality' | 'traffic' | 'liquidity' | 'endUser';
  score: number;
  weight: number;
}) {
  const tier = getScoreTier(score);

  return (
    <div className="text-center">
      <div className="text-xl mb-1">{getCategoryIcon(category)}</div>
      <div className={`text-lg font-bold ${getScoreTextColor(tier)}`}>{score}</div>
      <div className="text-xs text-gray-500">{getCategoryLabel(category)}</div>
      <div className="text-xs text-gray-400">{(weight * 100).toFixed(0)}% weight</div>
    </div>
  );
}

function RankChange({
  indicator,
}: {
  indicator: ReturnType<typeof getRankChangeIndicator>;
}) {
  if (indicator.direction === 'stable') {
    return null;
  }

  const colorClass =
    indicator.direction === 'up'
      ? 'text-green-600'
      : indicator.direction === 'down'
        ? 'text-red-600'
        : 'text-purple-600';

  return (
    <div className={`text-xs mt-1 ${colorClass}`}>
      {indicator.icon}
      {indicator.amount > 0 && indicator.amount}
    </div>
  );
}

function SignalPill({ signal }: { signal: RankedDomain['signals'][0] }) {
  const trendIcon =
    signal.trend === 'up' ? '↑' : signal.trend === 'down' ? '↓' : '→';
  const trendColor =
    signal.trend === 'up'
      ? 'text-green-500'
      : signal.trend === 'down'
        ? 'text-red-500'
        : 'text-gray-400';

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-gray-200 text-xs whitespace-nowrap">
      <span className="font-medium text-gray-700">{signal.name}</span>
      <span className={trendColor}>{trendIcon}</span>
    </div>
  );
}

function getTierBgColor(tier: string): string {
  const colors: Record<string, string> = {
    excellent: 'bg-green-100 text-green-700',
    good: 'bg-blue-100 text-blue-700',
    fair: 'bg-yellow-100 text-yellow-700',
    poor: 'bg-red-100 text-red-700',
  };
  return colors[tier] || 'bg-gray-100 text-gray-700';
}

function getScoreTextColor(tier: string): string {
  const colors: Record<string, string> = {
    excellent: 'text-green-600',
    good: 'text-blue-600',
    fair: 'text-yellow-600',
    poor: 'text-red-600',
  };
  return colors[tier] || 'text-gray-600';
}
